import { expect } from '@playwright/test';

/**
 * MailContextMenu
 * ----------------
 * Page Object representing the right-click context menu
 * for email items in the Outlook message list.
 *
 * Provides a simple API to:
 * - open the context menu for a specific email (by subject)
 * - select an action from the context menu (Delete, Archive, Flag, etc.)
 *
 * This abstraction keeps tests clean and avoids repeating
 * low-level locator logic.
 */
export class MailContextMenu {
  constructor(page) {
    this.page = page;
  }

  /**
   * Opens the context menu for the first message in the current folder.
   * Scoped to the message list listbox to avoid ambiguity.
   */
  async openForFirstMessage() {
    await this.openForNthMessage(0);
  }

  /**
   * Opens the context menu for the Nth message (0-indexed) in the current folder.
   * Scoped to the message list listbox to avoid ambiguity.
   * @param {number} index - 0 for first, 1 for second, etc.
   */
  async openForNthMessage(index) {
    const list = this.page.getByRole('listbox', { name: /message list/i });
    await expect(list).toBeVisible({ timeout: 30_000 });

    const item = list.locator('[role="option"]').nth(index);
    await expect(item).toBeVisible({ timeout: 30_000 });
    await item.click({ button: 'right' });
  }

  /**
   * Selects an action from the opened context menu.
   *
   * Example actions:
   * - "Delete"
   * - "Archive"
   * - "Flag"
   */
  async selectOption(optionName) {
    const option = this.page.getByRole('menuitem', {
      name: new RegExp(optionName, 'i'),
    });

    await expect(option).toBeVisible({ timeout: 10_000 });
    await option.click();
  }

  /**
   * Convenience method for performing a full action
   * in a single call from the test.
   *
   * Example:
   *   await contextMenu.applyActionToMail("Test Subject", "Delete");
   */
  async applyActionToMail(subject, action) {
    const list = this.page.getByRole('listbox', { name: /message list/i });
    await expect(list).toBeVisible({ timeout: 30_000 });

    const mailItem = list.locator('[role="option"]', { hasText: new RegExp(subject, 'i') }).first();
    await expect(mailItem).toBeVisible({ timeout: 30_000 });
    await mailItem.click({ button: 'right' });

    await this.selectOption(action);
  }

  async applyActionToFirstMessage(action) {
    await this.openForFirstMessage();
    await this.selectOption(action);
  }
}

/**
 * SubContextMenu
 * ---------------
 * Universal Page Object for sub-panels that appear after selecting an action
 * from the context menu (e.g. Categorise, Move, Copy).
 *
 * Handles two panel types transparently:
 * - Popup panels with a listbox + options (e.g. Categorise → category list)
 * - Cascading submenus with menuitems (e.g. Move → folder list)
 *
 * API:
 *   search(query)          — type in the search/filter input
 *   selectFirst()          — click the first result
 *   selectByName(name)     — click a result by name
 *   createNewFolder(name)  — Move/Copy specific: create a new folder and confirm
 */
export class SubContextMenu {
  constructor(page) {
    this.page = page;
  }

  /**
   * Returns the search input of the sub-panel.
   * Covers both searchbox role and common placeholder patterns.
   */
  searchInput() {
    return this.page
      .getByRole('searchbox')
      .or(this.page.locator([
        'input[placeholder*="search" i]',
        'input[aria-label*="search" i]',
        'input[aria-label*="categor" i]',
        'input[placeholder*="folder" i]',
      ].join(', ')))
      .first();
  }

  /**
   * Waits until the sub-panel search input is visible.
   */
  async waitUntilOpen() {
    await expect(this.searchInput()).toBeVisible({ timeout: 10_000 });
  }

  /**
   * Types a query into the sub-panel search/filter input.
   * @param {string} query
   */
  async search(query) {
    const input = this.searchInput();
    await expect(input).toBeVisible({ timeout: 10_000 });
    await input.fill(query);
  }

  /**
   * Clicks the first result in the sub-panel.
   * Handles both [role="option"] in a listbox (Categorise picker)
   * and [role="menuitem"] in a submenu (Move/Copy folder list).
   */
  async selectFirst() {
    const firstOption = this.page
      .locator('[role="listbox"]')
      .filter({ has: this.page.locator('[role="option"]') })
      .last()
      .locator('[role="option"]')
      .first();

    const isOption = await firstOption.isVisible({ timeout: 2_000 }).catch(() => false);
    if (isOption) {
      await firstOption.click();
      return;
    }

    // Folder submenu: menuitems
    const firstItem = this.page.locator('[role="menu"]').last()
      .locator('[role="menuitem"]').first();
    await expect(firstItem).toBeVisible({ timeout: 10_000 });
    await firstItem.click();
  }

  /**
   * Clicks the result matching the given name.
   * Handles both [role="option"] and [role="menuitem"].
   * @param {string} name
   */
  async selectByName(name) {
    const rx = new RegExp(name, 'i');

    const option = this.page
      .locator('[role="listbox"]')
      .filter({ has: this.page.locator('[role="option"]') })
      .last()
      .getByRole('option', { name: rx });

    const isOption = await option.isVisible({ timeout: 2_000 }).catch(() => false);
    if (isOption) {
      await option.click();
      return;
    }

    const menuItem = this.page.getByRole('menuitem', { name: rx }).first();
    await expect(menuItem).toBeVisible({ timeout: 10_000 });
    await menuItem.click();
  }

  /**
   * Creates a new destination folder from the Move/Copy submenu.
   *
   * Flow:
   * 1. Clicks "Create new folder" in the submenu
   * 2. Types the folder name via keyboard (required to trigger Outlook's input events)
   * 3. Clicks Save — folder is created and messages are moved, submenu closes
   *
   * @param {string} name - name for the new folder
   */
  async createNewFolder(name) {
    const createBtn = this.page
      .getByRole('button', { name: /create new folder/i })
      .or(this.page.getByRole('menuitem', { name: /create new folder/i }))
      .first();

    await expect(createBtn).toBeVisible({ timeout: 10_000 });
    await createBtn.click();

    const input = this.page
      .getByPlaceholder(/folder name/i)
      .or(this.page.getByRole('textbox', { name: /folder name/i }))
      .first();

    await expect(input).toBeVisible({ timeout: 10_000 });
    await input.click();
    await this.page.keyboard.type(name, { delay: 40 });

    const saveBtn = this.page.getByRole('button', { name: /^save$/i }).first();
    await expect(saveBtn).toBeVisible({ timeout: 10_000 });
    await saveBtn.click();
    // Save creates the folder and completes the Move/Copy — submenu closes automatically.
    await this.page.waitForTimeout(1_000);
  }
}
