// pages/components/mailFolders.js
import { expect } from '@playwright/test';

/**
 * MailFolders
 * -----------
 * Page Object for Outlook folder navigation, message list interaction,
 * and the mini-toolbar that appears above the message list.
 *
 * Responsibilities:
 * - wait until the main Mail UI is ready
 * - open a folder by name (Inbox, Sent Items, Deleted Items, …)
 * - select a message by subject (handles virtualized lists)
 * - interact with the folder toolbar (filter, sort, jump to, favourites)
 * - verify folder/message state
 *
 * Access the toolbar via: mailFolders.toolbar.*
 */
export class MailFolders {
  constructor(page) {
    this.page = page;
    this.toolbar = new FolderToolbar(page);
  }

  // ── UI readiness ───────────────────────────────────────────────────────────

  /**
   * Waits until the Outlook Mail UI is ready enough to interact with.
   * Considers UI ready when either the "New email" button or the folder tree is visible.
   */
  async waitUntilReady() {
    const newEmail = this.page.getByRole('button', { name: /new email/i });
    const folderTree = this.page.getByRole('tree').first();

    await Promise.race([
      newEmail.waitFor({ state: 'visible', timeout: 45_000 }).catch(() => {}),
      folderTree.waitFor({ state: 'visible', timeout: 45_000 }).catch(() => {}),
    ]);

    const ok =
      (await newEmail.isVisible().catch(() => false)) ||
      (await folderTree.isVisible().catch(() => false));

    if (!ok) {
      throw new Error('Outlook UI not ready (Mail or folder tree not visible).');
    }
  }

  // ── Folder navigation ──────────────────────────────────────────────────────

  /**
   * Opens a folder by name and waits until it is selected.
   *
   * Implementation notes:
   * - Outlook folder tree may contain multiple matching items (same label in different sections)
   * - We prefer clicking a non-selected item to actually trigger navigation
   * - After clicking, we poll until any matching treeitem becomes aria-selected="true"
   *
   * @param {string} folderName - e.g. 'Inbox', 'Sent Items'
   */
  async open(folderName) {
    await this.waitUntilReady();

    const nameRx = new RegExp(escapeRegExp(folderName), 'i');

    const tree = this.page.getByRole('tree').first();
    const items = tree.getByRole('treeitem', { name: nameRx });

    // Fallback: in some renders the treeitem can be found outside the first tree container
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

    await this.page.waitForTimeout(400);
  }

  // ── Message list ───────────────────────────────────────────────────────────

  /** Returns the message list listbox locator. */
  get messageList() {
    return this.page.getByRole('listbox', { name: /message list/i });
  }

  /** Returns all visible message-list option rows. */
  get messageItems() {
    return this.messageList.locator('[role="option"]');
  }

  /**
   * Selects a message row by subject in the currently opened folder.
   *
   * Outlook message list is commonly virtualized, so not all rows exist in the DOM at once.
   * Strategy: iterate rendered rows, PageDown to load more, repeat until timeout.
   *
   * Returns the locator for the selected row.
   *
   * @param {string} subject
   * @param {{ timeout?: number }} options
   */
  async selectMessageBySubject(subject, { timeout = 60_000 } = {}) {
    await expect(this.messageList).toBeVisible({ timeout: 30_000 });

    const endAt = Date.now() + timeout;

    while (Date.now() < endAt) {
      const options = this.messageList.locator('[role="option"]');
      const count = await options.count();

      for (let i = 0; i < count; i++) {
        const row = options.nth(i);
        const text = (await row.innerText().catch(() => '')) || '';

        if (text.toLowerCase().includes(subject.toLowerCase())) {
          await row.scrollIntoViewIfNeeded();
          await row.click({ force: true, position: { x: 60, y: 40 } });
          await expect(row).toHaveAttribute('aria-selected', 'true', { timeout: 30_000 });
          return row;
        }
      }

      // Virtualized list: scroll further down and try again
      await this.messageList.focus();
      await this.page.keyboard.press('PageDown');
      await this.page.waitForTimeout(250);
    }

    throw new Error(`Message with subject "${subject}" not found.`);
  }

  /**
   * Clicks the first message in the currently open folder's message list.
   * Waits until that row becomes aria-selected="true".
   * Returns the row locator.
   */
  async selectFirstMessage() {
    await expect(this.messageList).toBeVisible({ timeout: 45_000 });
    const first = this.messageList.locator('[role="option"]').first();
    await expect(first).toBeVisible({ timeout: 45_000 });
    await first.click({ force: true, position: { x: 60, y: 40 } });
    await expect(first).toHaveAttribute('aria-selected', 'true', { timeout: 30_000 });
    return first;
  }

  /**
   * Enters select mode (via toolbar) and selects the first `count` messages.
   * @param {number} count
   */
  async selectMessages(count) {
    await this.toolbar.clickSelect();
    const checkboxes = this.page.getByRole('checkbox', { name: /select a conversation/i });
    await expect(checkboxes.first()).toBeVisible({ timeout: 10_000 });
    const available = await checkboxes.count();
    const toSelect = Math.min(count, available);
    for (let i = 0; i < toSelect; i++) {
      const cb = checkboxes.nth(i);
      await cb.scrollIntoViewIfNeeded();
      await cb.click({ force: true });
      await this.page.waitForTimeout(200);
    }
    for (let i = 0; i < toSelect; i++) {
      await expect(checkboxes.nth(i)).toBeChecked({ timeout: 10_000 });
    }
  }

  /**
   * Checks (selects) a single message by its 0-based index.
   * Assumes select mode is already active (toolbar Select button already clicked).
   * @param {number} index
   */
  async checkMessageAtIndex(index) {
    const checkboxes = this.page.getByRole('checkbox', { name: /select a conversation/i });
    await expect(checkboxes.first()).toBeVisible({ timeout: 10_000 });
    const cb = checkboxes.nth(index);
    await cb.scrollIntoViewIfNeeded();
    await cb.click({ force: true });
    await expect(cb).toBeChecked({ timeout: 10_000 });
  }

  // ── Assertions ─────────────────────────────────────────────────────────────

  /** Asserts the given subject text is visible in the reading pane. */
  async verifySubjectInReadingPane(subject) {
    await expect(
      this.page.getByRole('main').getByText(subject, { exact: true }).first()
    ).toBeVisible({ timeout: 30_000 });
  }

  /** Asserts that a message row with the given subject is visible in the message list. */
  async verifyMessageVisible(subject) {
    await expect(
      this.page.getByRole('option', { name: new RegExp(subject, 'i') }).first()
    ).toBeVisible({ timeout: 15_000 });
  }

  /** Asserts that a message row with the given subject is NOT visible in the message list. */
  async verifyMessageHidden(subject) {
    await expect(
      this.page.getByRole('option', { name: new RegExp(subject, 'i') }).first()
    ).toBeHidden({ timeout: 15_000 });
  }

  /** Asserts that the message list listbox is visible. */
  async verifyMessageListVisible() {
    await expect(this.messageList).toBeVisible({ timeout: 15_000 });
  }

  /** Asserts that a folder with the given name exists in the folder tree. */
  async verifyFolderInTree(name) {
    await expect(
      this.page.getByRole('treeitem', { name: new RegExp(name, 'i') }).first()
    ).toBeVisible({ timeout: 15_000 });
  }

  /**
   * Verifies that the given folder name appears inside the Favourites section
   * of the folder tree.
   * @param {string} folderName
   */
  async verifyFolderInFavourites(folderName) {
    const favouritesGroup = this.page
      .getByRole('tree').first()
      .getByRole('treeitem', { name: /^favou?rites/i }).first();

    const expanded = await favouritesGroup.getAttribute('aria-expanded').catch(() => null);
    if (expanded === 'false') {
      await favouritesGroup.click();
      await this.page.waitForTimeout(300);
    }

    await expect(
      this.page.getByRole('tree').first()
        .getByRole('treeitem', { name: new RegExp(folderName, 'i') }).first()
    ).toBeVisible({ timeout: 10_000 });
  }

  /**
   * Verifies that the given folder name does NOT appear inside the Favourites section.
   * @param {string} folderName
   */
  async verifyFolderNotInFavourites(folderName) {
    const inFav = await this.page
      .getByRole('tree').first()
      .locator('[aria-label*="favou" i] >> [role="treeitem"]')
      .filter({ hasText: new RegExp(folderName, 'i') })
      .first()
      .isVisible()
      .catch(() => false);
    expect(inFav).toBe(false);
  }

  /** Verifies that the Filter is active by checking for the "Clear filter" button. */
  async verifyFilterActive() {
    await expect(
      this.page.getByRole('button', { name: /clear filter/i }).first()
    ).toBeVisible({ timeout: 10_000 });
  }

  /**
   * Verifies that the message list is sorted by the given option.
   * @param {string} option - e.g. 'Size', 'Date'
   */
  async verifySortedBy(option) {
    const sortBtn = this.page.getByRole('button', { name: /sorted/i }).first();
    await expect(sortBtn).toBeVisible({ timeout: 10_000 });
    const label =
      (await sortBtn.getAttribute('aria-label').catch(() => '')) ||
      (await sortBtn.textContent().catch(() => ''));
    expect(label).toMatch(new RegExp(option, 'i'));
  }
}


// ============================================================================
// Internal helper class
// ============================================================================

/**
 * FolderToolbar
 * -------------
 * Encapsulates the mini-toolbar that appears above the message list when a
 * folder is selected. Buttons: Add to Favourites, Select, Jump to, Filter, Sort.
 *
 * Accessed via: mailFolders.toolbar.*
 */
class FolderToolbar {
  constructor(page) {
    this.page = page;
  }

  /**
   * Clicks the "Focused" tab in the Inbox message list.
   * Only visible when the Inbox folder is open.
   */
  async clickFocused() {
    const tab = this.page.getByRole('tab', { name: /^focused$/i }).first();
    await tab.waitFor({ state: 'visible', timeout: 10_000 });
    await tab.click();
    await this.page.waitForTimeout(400);
  }

  /**
   * Clicks the "Other" tab in the Inbox message list.
   * Only visible when the Inbox folder is open.
   */
  async clickOther() {
    const tab = this.page.getByRole('tab', { name: /^other$/i }).first();
    await tab.waitFor({ state: 'visible', timeout: 10_000 });
    await tab.click();
    await this.page.waitForTimeout(400);
  }

  /** Clicks the "Favorite folder" toggle button (adds to Favourites). */
  async addToFavourites() {
    await this._clickFavouriteButton();
  }

  /** Clicks the "Favorite folder" toggle button again (removes from Favourites). */
  async removeFromFavourites() {
    await this._clickFavouriteButton();
  }

  async _clickFavouriteButton() {
    const btn = this.page.getByRole('button', { name: /favou?rite folder/i }).first();
    await btn.waitFor({ state: 'visible', timeout: 10_000 });
    await btn.click();
    await this.page.waitForTimeout(500);
  }

  /** Clicks the "Select" toolbar button to enter multi-select mode. */
  async clickSelect() {
    const btn = this.page.getByRole('button', { name: /^select$/i }).first();
    await btn.waitFor({ state: 'visible', timeout: 10_000 });
    await btn.click();
    await this.page.waitForTimeout(400);
  }

  /**
   * Opens the "Jump to" dropdown without selecting any option.
   * Call page.keyboard.press('Escape') to close.
   */
  async openJumpToDropdown() {
    const btn = this.page.getByRole('button', { name: /jump to/i }).first();
    await btn.waitFor({ state: 'visible', timeout: 10_000 });
    await btn.click();
    await this.page.waitForTimeout(600);
  }

  /**
   * Opens the "Filter" dropdown without selecting any option.
   * Call page.keyboard.press('Escape') to close.
   */
  async openFilterDropdown() {
    const btn = this.page.getByRole('button', { name: /^filter$/i }).first();
    await btn.waitFor({ state: 'visible', timeout: 10_000 });
    await btn.click();
    await this.page.waitForTimeout(300);
  }

  /**
   * Opens the "Sorted" dropdown without selecting any option.
   * Call page.keyboard.press('Escape') to close.
   */
  async openSortDropdown() {
    const btn = this.page.getByRole('button', { name: /sorted/i }).first();
    await btn.waitFor({ state: 'visible', timeout: 10_000 });
    await btn.click();
    await this.page.waitForTimeout(500);
  }

  /**
   * Opens the "Jump to" dropdown and clicks the given option.
   * @param {string} option - e.g. 'Last month', 'Last week'
   */
  async jumpTo(option) {
    await this.openJumpToDropdown();
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
    await this.openFilterDropdown();
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
    await this.openSortDropdown();
    const item = this.page
      .getByRole('menuitemradio', { name: new RegExp(option, 'i') })
      .first();
    await item.waitFor({ state: 'visible', timeout: 5_000 });
    await item.click();
    await this.page.waitForTimeout(500);
  }

  /**
   * Asserts that a menu option (menuitemradio) with the given label is visible
   * in the currently open dropdown/menu.
   * @param {string} label
   * @param {string} [msg]
   */
  async verifyMenuItemVisible(label, msg = `menu option "${label}" not found`) {
    await expect(
      this.page.getByRole('menuitemradio', { name: new RegExp(`^${label}$`, 'i') }).first(),
      msg
    ).toBeVisible({ timeout: 5_000 });
  }

  /**
   * Asserts that the "Jump to" button is NOT visible in the folder toolbar.
   * @param {string} [msg]
   */
  async verifyJumpToButtonHidden(msg = 'Jump To button should not be visible') {
    await expect(
      this.page.getByRole('button', { name: /jump to/i }).first(),
      msg
    ).not.toBeVisible({ timeout: 3_000 });
  }
}


// ── Helpers ───────────────────────────────────────────────────────────────────

function escapeRegExp(str) {
  return str.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}
