import { expect } from '@playwright/test';

/**
 * MailFolders
 * -----------
 * Page Object for interacting with the Outlook folder tree and message list.
 *
 * Responsibilities:
 * - wait until the main Mail UI is ready
 * - open a folder by name (Inbox, Sent Items, Deleted Items, ...)
 * - select a message in the message list by subject (handles virtualized lists)
 *
 * This keeps folder navigation and message selection out of tests.
 */
export class MailFolders {
  constructor(page) {
    this.page = page;
  }

  /**
   * Waits until the Outlook Mail UI is ready enough to interact with.
   * We consider UI ready when either:
   * - the "New email" button is visible, or
   * - the folder tree is visible
   *
   * This avoids flaky failures during initial load / transitions.
   */
  async waitUntilReady() {
    const newEmail = this.page.getByRole('button', { name: /new email/i });
    const folderTree = this.page.getByRole('tree').first();

    await Promise.race([newEmail.waitFor({ state: 'visible', timeout: 45_000 }).catch(() => {}), folderTree.waitFor({ state: 'visible', timeout: 45_000 }).catch(() => {})]);

    const ok = (await newEmail.isVisible().catch(() => false)) || (await folderTree.isVisible().catch(() => false));

    if (!ok) {
      throw new Error('Outlook UI not ready (Mail or folder tree not visible).');
    }
  }

  /**
   * Opens a folder by name.
   *
   * Implementation notes:
   * - Outlook folder tree may contain multiple matching items (same label in different sections)
   * - We prefer clicking a non-selected item to actually trigger navigation
   * - After clicking, we poll until any matching treeitem becomes aria-selected="true"
   */
  async open(folderName) {
    await this.waitUntilReady();

    const nameRx = new RegExp(escapeRegExp(folderName), 'i');

    const tree = this.page.getByRole('tree').first();
    const items = tree.getByRole('treeitem', { name: nameRx });

    // Fallback: in some renders, the treeitem can be found outside the first tree container
    const candidates = (await items.count()) ? items : this.page.getByRole('treeitem', { name: nameRx });

    const count = await candidates.count();
    if (!count) throw new Error(`Folder not found: ${folderName}`);

    // Pick a folder item that is not already selected (to force navigation)
    let toClick = candidates.nth(0);
    for (let i = 0; i < count; i++) {
      const el = candidates.nth(i);
      const selected = (await el.getAttribute('aria-selected'))?.toLowerCase() === 'true';
      if (!selected) {
        toClick = el;
        break;
      }
    }

    await toClick.scrollIntoViewIfNeeded();
    await expect(toClick).toBeVisible({ timeout: 30_000 });
    await toClick.click();

    // Confirm navigation by waiting until at least one matching folder is selected
    await expect
      .poll(
        async () => {
          const c = await candidates.count();
          for (let i = 0; i < c; i++) {
            const el = candidates.nth(i);
            const selected = (await el.getAttribute('aria-selected'))?.toLowerCase() === 'true';
            if (selected) return true;
          }
          return false;
        },
        { timeout: 30_000 }
      )
      .toBe(true);

    // Small UI stabilizer (we intentionally avoid "networkidle" here)
    await this.page.waitForTimeout(400);
  }

  /**
   * Selects a message row by subject in the currently opened folder.
   *
   * Outlook message list is commonly virtualized, so not all rows exist in the DOM at once.
   * Strategy:
   * - iterate through currently rendered rows and look for the subject substring
   * - if not found, PageDown to load the next chunk
   * - repeat until timeout
   *
   * Returns the locator for the selected row.
   */
  async selectMessageBySubject(subject, { timeout = 60_000 } = {}) {
    const list = this.page.getByRole('listbox', { name: /message list/i });
    await expect(list).toBeVisible({ timeout: 30_000 });

    const endAt = Date.now() + timeout;

    while (Date.now() < endAt) {
      const options = list.locator('[role="option"]');
      const count = await options.count();

      for (let i = 0; i < count; i++) {
        const row = options.nth(i);
        const text = (await row.innerText().catch(() => '')) || '';

        if (text.toLowerCase().includes(subject.toLowerCase())) {
          await row.scrollIntoViewIfNeeded();

          // Click inside the row to avoid edge cases where click lands on a non-interactive region
          await row.click({ force: true, position: { x: 60, y: 40 } });

          await expect(row).toHaveAttribute('aria-selected', 'true', {
            timeout: 30_000,
          });

          return row;
        }
      }

      // Virtualized list: scroll further down and try again
      await list.focus();
      await this.page.keyboard.press('PageDown');
      await this.page.waitForTimeout(250);
    }

    throw new Error(`Message with subject "${subject}" not found.`);
  }

  /**
   * Convenience helper:
   * - open a folder
   * - then select a message by subject
   */
  async openAndSelectBySubject(folderName, subject, opts) {
    await this.open(folderName);
    return this.selectMessageBySubject(subject, opts);
  }
}

/**
 * FolderToolbar
 * -------------
 * Encapsulates the mini-toolbar that appears above the message list when a
 * folder is selected.  Buttons: Add to Favourites, Select, Jump to, Filter,
 * Sort by date.
 */
class FolderToolbar {
  constructor(page) {
    this.page = page;
  }

  /** Clicks the "Favorite folder" toggle button (adds to Favourites). */
  async addToFavourites() {
    const btn = this.page
      .getByRole('button', { name: /favou?rite folder/i })
      .first();
    await btn.waitFor({ state: 'visible', timeout: 10_000 });
    await btn.click();
    await this.page.waitForTimeout(500);
  }

  /** Clicks the "Favorite folder" toggle button again (removes from Favourites). */
  async removeFromFavourites() {
    const btn = this.page
      .getByRole('button', { name: /favou?rite folder/i })
      .first();
    await btn.waitFor({ state: 'visible', timeout: 10_000 });
    await btn.click();
    await this.page.waitForTimeout(500);
  }

  /** Clicks the "Select" toolbar button to enter multi-select mode. */
  async clickSelect() {
    const btn = this.page
      .getByRole('button', { name: /^select$/i })
      .first();
    await btn.waitFor({ state: 'visible', timeout: 10_000 });
    await btn.click();
    await this.page.waitForTimeout(400);
  }

  /**
   * Opens the "Jump to" dropdown and clicks the given option.
   * @param {string} option - e.g. 'Last month', 'Last week'
   */
  async jumpTo(option) {
    const btn = this.page
      .getByRole('button', { name: /jump to/i })
      .first();
    await btn.waitFor({ state: 'visible', timeout: 10_000 });
    await btn.click();
    await this.page.waitForTimeout(600);

    const item = this.page
      .getByRole('menuitemradio', { name: new RegExp(option, 'i') })
      .first();
    await item.waitFor({ state: 'visible', timeout: 8_000 });
    await item.click();
    await this.page.waitForTimeout(500);
  }

  /**
   * Opens the "Filter" dropdown and selects the given filter option.
   * @param {string} option - e.g. 'Unread', 'Flagged'
   */
  async filter(option) {
    const btn = this.page
      .getByRole('button', { name: /^filter$/i })
      .first();
    await btn.waitFor({ state: 'visible', timeout: 10_000 });
    await btn.click();
    await this.page.waitForTimeout(300);
    const item = this.page
      .getByRole('menuitemradio', { name: new RegExp(option, 'i') })
      .first();
    await item.waitFor({ state: 'visible', timeout: 5_000 });
    await item.click();
    await this.page.waitForTimeout(500);
  }

  /**
   * Opens the "Sorted" dropdown and selects the given sort field.
   * @param {string} option - e.g. 'Size', 'From', 'Subject'
   */
  async sortBy(option) {
    const btn = this.page
      .getByRole('button', { name: /sorted/i })
      .first();
    await btn.waitFor({ state: 'visible', timeout: 10_000 });
    await btn.click();
    await this.page.waitForTimeout(300);
    const item = this.page
      .getByRole('menuitemradio', { name: new RegExp(option, 'i') })
      .first();
    await item.waitFor({ state: 'visible', timeout: 5_000 });
    await item.click();
    await this.page.waitForTimeout(500);
  }
}

/**
 * MailFolder
 * ----------
 * High-level page object that combines folder navigation with the mini
 * toolbar that sits above the message list.
 *
 * Usage:
 *   const folder = new MailFolder(page);
 *   await folder.open('Deleted Items');
 *   await folder.toolbar.addToFavourites();
 */
export class MailFolder {
  constructor(page) {
    this.page = page;
    this._folders = new MailFolders(page);
    this.toolbar = new FolderToolbar(page);
  }

  /**
   * Navigates to the given folder and waits until it is selected.
   * @param {string} folderName - e.g. 'Deleted Items', 'Sent Items'
   */
  async open(folderName) {
    await this._folders.open(folderName);
  }

  /**
   * Returns the message list locator for the currently open folder.
   * Useful for assertions on the visible messages.
   */
  get messageList() {
    return this.page.getByRole('listbox', { name: /message list/i });
  }

  /** Returns all visible message-list option rows. */
  get messageItems() {
    return this.messageList.locator('[role="option"]');
  }
}

/**
 * Escapes a string so it can be safely used inside a RegExp constructor.
 */
function escapeRegExp(str) {
  return str.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}
