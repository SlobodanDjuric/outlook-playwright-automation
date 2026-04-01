import { expect } from '@playwright/test';

// ---------------------------------------------------------------------------
// helpers
// ---------------------------------------------------------------------------

function escapeRegExp(str) {
  return str.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}

/**
 * FolderTreeContextMenu
 * ----------------------
 * Right-click context menu for folders in the Outlook folder tree.
 *
 * Outlook renders the folder tree as [role="tree"] with each folder
 * as a [role="treeitem"].  Right-clicking a treeitem opens a [role="menu"]
 * with standard folder operations.
 *
 * Supported operations:
 *   - createNewSubfolder(parent, name)   — New subfolder inside a parent
 *   - renameFolder(folder, newName)      — Inline rename
 *   - deleteFolder(folder)              — Delete with confirmation
 *   - emptyFolder(folder)               — Permanently delete all items
 *   - markAllAsRead(folder)             — Mark every message as read
 *   - addToFavourites(folder)           — Pin to Favourites section
 *   - removeFromFavourites(folder)      — Unpin from Favourites section
 */
export class FolderTreeContextMenu {
  constructor(page) {
    this.page = page;
  }

  // -------------------------------------------------------------------------
  // low-level primitives
  // -------------------------------------------------------------------------

  /**
   * Right-clicks the first treeitem whose name matches `folderName`.
   *
   * Outlook shows some system folders twice in the tree: once inside the
   * "Favourites" group and again inside the main account group.  The
   * Favourites copy has a restricted context menu (no "New subfolder",
   * disabled Rename, etc.), so we always prefer the non-Favourites item.
   *
   * Folder names may include unread counts like "Inbox 3 unread", so we
   * use a loose contains-match rather than an exact one.
   */
  async openForFolder(folderName) {
    const tree = this.page.getByRole('tree').first();
    const allItems = tree.getByRole('treeitem', {
      name: new RegExp(escapeRegExp(folderName), 'i'),
    });

    await allItems.first().waitFor({ state: 'visible', timeout: 30_000 });

    const count = await allItems.count();
    let targetItem = allItems.first();

    if (count > 1) {
      // Walk through candidates and prefer one whose ancestors do NOT
      // include the Favourites group (identifiable by aria-label).
      for (let i = 0; i < count; i++) {
        const item = allItems.nth(i);
        const isInFavourites = await item
          .evaluate((el) => {
            // Walk up to find the nearest [role="group"] ancestor.
            // Its accessible name comes from aria-label OR aria-labelledby
            // (Outlook uses aria-labelledby pointing to a sibling header treeitem).
            const group = el.closest('[role="group"]');
            if (!group) return false;

            // Check aria-label directly
            const directLabel = (group.getAttribute('aria-label') || '').toLowerCase();
            if (directLabel.includes('favou')) return true;

            // Check aria-labelledby → resolve referenced elements
            const labelledBy = group.getAttribute('aria-labelledby');
            if (labelledBy) {
              for (const id of labelledBy.trim().split(/\s+/)) {
                const ref = document.getElementById(id);
                if (ref && (ref.textContent || '').toLowerCase().includes('favou')) return true;
              }
            }

            return false;
          })
          .catch(() => false);

        if (!isInFavourites) {
          targetItem = item;
          break;
        }
      }
    }

    await expect(targetItem).toBeVisible({ timeout: 30_000 });
    await targetItem.click({ button: 'right' });
    // wait for the menu to be painted
    await this.page.waitForTimeout(400);
  }

  /**
   * Clicks a menuitem whose label matches `nameOrRegex` (case-insensitive).
   * Works for both [role="menuitem"] and [role="menuitemcheckbox"].
   * Accepts a string (converted to a regex) or a RegExp directly.
   */
  async selectOption(nameOrRegex) {
    const rx = nameOrRegex instanceof RegExp
      ? nameOrRegex
      : new RegExp(nameOrRegex, 'i');

    const item = this.page
      .getByRole('menuitem', { name: rx })
      .or(this.page.getByRole('menuitemcheckbox', { name: rx }))
      .first();

    await expect(item).toBeVisible({ timeout: 10_000 });
    await item.click();
    await this.page.waitForTimeout(400);
  }

  // -------------------------------------------------------------------------
  // inline text-input helper
  // -------------------------------------------------------------------------

  /**
   * After triggering "New subfolder" or "Rename", Outlook injects an inline
   * <input type="text"> (or occasionally a contenteditable span) into the
   * treeitem.  This helper waits for that input, fills it, and commits with
   * Enter.
   */
  async _fillTreeInput(name) {
    // primary: a plain text input that appeared inside the folder tree
    const treeInput = this.page
      .getByRole('tree')
      .locator('input[type="text"]')
      .last();

    // fallback: a textbox role anywhere on the page (e.g. a rename dialog)
    const dialogInput = this.page
      .getByRole('textbox', { name: /folder name|new folder/i })
      .first();

    let input;
    if (await treeInput.isVisible({ timeout: 5_000 }).catch(() => false)) {
      input = treeInput;
    } else if (await dialogInput.isVisible({ timeout: 3_000 }).catch(() => false)) {
      input = dialogInput;
    } else {
      // last resort: any newly visible textbox
      input = this.page.locator('input[type="text"]').last();
      await expect(input).toBeVisible({ timeout: 10_000 });
    }

    // select-all first to clear the pre-filled value (rename keeps old name)
    await input.press(process.platform === 'darwin' ? 'Meta+A' : 'Control+A');
    await input.fill(name);
    await this.page.keyboard.press('Enter');
    await this.page.waitForTimeout(1_000);
  }

  // -------------------------------------------------------------------------
  // confirmation-dialog helper
  // -------------------------------------------------------------------------

  /**
   * Confirms a destructive action dialog (Delete / Empty folder).
   * Looks for an affirmative button whose label is one of the common
   * confirmation words Outlook uses.
   */
  async _confirmDialog() {
    await this.page.waitForTimeout(500);
    const dialog = this.page
      .getByRole('alertdialog')
      .or(this.page.getByRole('dialog'))
      .last();

    if (!(await dialog.isVisible({ timeout: 2_000 }).catch(() => false))) return;

    const confirmBtn = dialog
      .getByRole('button', { name: /delete|ok|yes|confirm|empty/i })
      .first();

    if (await confirmBtn.isVisible({ timeout: 2_000 }).catch(() => false)) {
      await confirmBtn.click();
      await this.page.waitForTimeout(1_000);
    }
  }

  // -------------------------------------------------------------------------
  // public operations
  // -------------------------------------------------------------------------

  /**
   * Creates a new subfolder inside `parentFolder`.
   * Opens the context menu on the parent, clicks "New subfolder" (or "New
   * folder"), then fills the inline text input that appears.
   *
   * @param {string} parentFolder - name of the parent folder
   * @param {string} newFolderName - name for the new subfolder
   */
  async createNewSubfolder(parentFolder, newFolderName) {
    await this.openForFolder(parentFolder);

    // Outlook labels this "Create new subfolder" (not just "New subfolder").
    // Use hasText filter which matches visible text content (more reliable
    // than accessible-name regex for items whose text contains extra content).
    const newBtn = this.page
      .getByRole('menuitem')
      .filter({ hasText: /create new subfolder|new subfolder|new folder/i })
      .first();
    await expect(newBtn).toBeVisible({ timeout: 10_000 });
    await newBtn.click();
    await this.page.waitForTimeout(500);

    await this._fillTreeInput(newFolderName);
  }

  /**
   * Renames `folderName` to `newName` via the context-menu "Rename" option.
   */
  async renameFolder(folderName, newName) {
    await this.openForFolder(folderName);
    await this.selectOption('Rename');
    await this._fillTreeInput(newName);
  }

  /**
   * Deletes `folderName` via the context-menu "Delete folder" option.
   * Accepts any confirmation dialog that appears.
   */
  async deleteFolder(folderName) {
    await this.openForFolder(folderName);
    // Outlook labels the menu item "Delete" (not "Delete folder")
    await this.selectOption(/^delete$/i);
    await this._confirmDialog();
  }

  /**
   * Empties `folderName` (permanently removes all messages inside).
   * Accepts the confirmation dialog.
   *
   * Outlook's context menu item is labelled "Empty" (not "Empty folder").
   */
  async emptyFolder(folderName) {
    await this.openForFolder(folderName);

    // "Empty" is disabled when the folder is already empty.
    const menuItem = this.page
      .getByRole('menuitem', { name: /^empty$/i })
      .first();

    await expect(menuItem).toBeVisible({ timeout: 10_000 });

    const isDisabled = await menuItem.evaluate(
      (el) => el.getAttribute('aria-disabled') === 'true' || el.hasAttribute('disabled')
    ).catch(() => false);

    if (isDisabled) {
      await this.page.keyboard.press('Escape');
      await this.page.waitForTimeout(300);
      return;
    }

    await menuItem.click();
    await this._confirmDialog();
  }

  /**
   * Marks all messages in `folderName` as read.
   * Accepts a potential large-folder confirmation dialog.
   */
  async markAllAsRead(folderName) {
    await this.openForFolder(folderName);

    // "Mark all as read" is disabled when the folder has no unread messages.
    const menuItem = this.page
      .getByRole('menuitem', { name: /mark all as read/i })
      .first();

    await expect(menuItem).toBeVisible({ timeout: 10_000 });

    // If the item is disabled (no unread messages), just close the menu.
    const isDisabled = await menuItem.evaluate(
      (el) => el.getAttribute('aria-disabled') === 'true' || el.hasAttribute('disabled')
    ).catch(() => false);

    if (isDisabled) {
      await this.page.keyboard.press('Escape');
      await this.page.waitForTimeout(300);
      return;
    }

    await menuItem.click();

    // Outlook may show "Mark all as read?" confirmation for large mailboxes
    const confirmBtn = this.page
      .getByRole('button', { name: /^(ok|yes|mark|confirm)$/i })
      .first();
    if (await confirmBtn.isVisible({ timeout: 2_000 }).catch(() => false)) {
      await confirmBtn.click();
    }
    await this.page.waitForTimeout(1_000);
  }

  // -------------------------------------------------------------------------
  // three-dots (ellipsis) hover menu
  // -------------------------------------------------------------------------

  /**
   * Returns the non-Favourites treeitem matching `folderName`.
   * Shared by both `openForFolder` and `openEllipsisMenuForFolder`.
   */
  async _getTreeItem(folderName) {
    const tree = this.page.getByRole('tree').first();
    const allItems = tree.getByRole('treeitem', {
      name: new RegExp(escapeRegExp(folderName), 'i'),
    });

    await allItems.first().waitFor({ state: 'visible', timeout: 30_000 });

    const count = await allItems.count();
    let targetItem = allItems.first();

    if (count > 1) {
      for (let i = 0; i < count; i++) {
        const item = allItems.nth(i);
        const isInFavourites = await item
          .evaluate((el) => {
            const group = el.closest('[role="group"]');
            if (!group) return false;
            const directLabel = (group.getAttribute('aria-label') || '').toLowerCase();
            if (directLabel.includes('favou')) return true;
            const labelledBy = group.getAttribute('aria-labelledby');
            if (labelledBy) {
              for (const id of labelledBy.trim().split(/\s+/)) {
                const ref = document.getElementById(id);
                if (ref && (ref.textContent || '').toLowerCase().includes('favou')) return true;
              }
            }
            return false;
          })
          .catch(() => false);

        if (!isInFavourites) {
          targetItem = item;
          break;
        }
      }
    }

    return targetItem;
  }

  /**
   * Opens the three-dots (ellipsis / "More options") button that appears
   * when you hover a folder row, then waits for the context menu to paint.
   *
   * Outlook shows the button only on hover, so we mouse-over the row first.
   * The button's accessible name varies across locales ("More options", "…",
   * "More"), so we use a broad regex.
   */
  async openEllipsisMenuForFolder(folderName) {
    const targetItem = await this._getTreeItem(folderName);

    await expect(targetItem).toBeVisible({ timeout: 30_000 });
    await targetItem.hover();
    await this.page.waitForTimeout(400);

    // Outlook's three-dots button has no accessible name — find the last
    // button inside the row (expand/collapse toggles, if present, come first).
    const ellipsisBtn = targetItem.locator('button').last();

    await expect(ellipsisBtn).toBeVisible({ timeout: 8_000 });
    await ellipsisBtn.click();
    await this.page.waitForTimeout(400);
  }

  /**
   * Creates a new subfolder inside `parentFolder` using the three-dots
   * hover button rather than the right-click context menu.
   *
   * @param {string} parentFolder  - folder row to hover over
   * @param {string} newFolderName - name for the new subfolder
   */
  async createNewFolderViaEllipsis(parentFolder, newFolderName) {
    await this.openEllipsisMenuForFolder(parentFolder);

    const newBtn = this.page
      .getByRole('menuitem')
      .filter({ hasText: /create new subfolder|new subfolder|new folder/i })
      .first();

    await expect(newBtn).toBeVisible({ timeout: 10_000 });
    await newBtn.click();
    await this.page.waitForTimeout(500);

    await this._fillTreeInput(newFolderName);
  }

  /**
   * Opens the three-dots button on the account row (the `user@outlook.com`
   * level-1 treeitem), then waits for the context menu to paint.
   *
   * The account treeitem is identified by its name containing "@" — it is
   * the only level-1 item in the tree that looks like an e-mail address.
   * Like folder rows, the button has no accessible name; it is the last
   * <button> inside the row (the first is the expand/collapse chevron).
   */
  async openEllipsisMenuForAccount() {
    const tree = this.page.getByRole('tree').first();
    const accountItem = tree.getByRole('treeitem', { name: /@/i }).first();

    await expect(accountItem).toBeVisible({ timeout: 30_000 });
    await accountItem.hover();
    await this.page.waitForTimeout(400);

    const ellipsisBtn = accountItem.locator('button').last();

    await expect(ellipsisBtn).toBeVisible({ timeout: 8_000 });
    await ellipsisBtn.click();
    await this.page.waitForTimeout(400);
  }

  /**
   * Creates a new top-level folder under the account by clicking the
   * three-dots button on the account row and selecting "Create new folder".
   *
   * @param {string} newFolderName - name for the new folder
   */
  async createNewFolderUnderAccount(newFolderName) {
    await this.openEllipsisMenuForAccount();

    const newBtn = this.page
      .getByRole('menuitem')
      .filter({ hasText: /create new folder|new folder/i })
      .first();

    await expect(newBtn).toBeVisible({ timeout: 10_000 });
    await newBtn.click();
    await this.page.waitForTimeout(500);

    await this._fillTreeInput(newFolderName);
  }

  // -------------------------------------------------------------------------
  // favourites
  // -------------------------------------------------------------------------

  /**
   * Pins `folderName` to the Favourites section via the context menu.
   */
  async addToFavourites(folderName) {
    await this.openForFolder(folderName);
    await this.selectOption(/add to favou?rites/);
  }

  /**
   * Removes `folderName` from the Favourites section via the context menu.
   */
  async removeFromFavourites(folderName) {
    await this.openForFolder(folderName);
    await this.selectOption(/remove from favou?rites/);
  }

  /**
   * Asserts that a folder with the given name is visible in the folder tree.
   * @param {string} name
   */
  async verifyFolderVisible(name) {
    await expect(
      this.page
        .getByRole('treeitem', { name: new RegExp(escapeRegExp(name), 'i') })
        .first()
    ).toBeVisible({ timeout: 15_000 });
  }

  /**
   * Asserts that a folder with the given name is NOT visible in the folder tree.
   * @param {string} name
   */
  async verifyFolderHidden(name) {
    await expect(
      this.page
        .getByRole('treeitem', { name: new RegExp(escapeRegExp(name), 'i') })
        .first()
    ).toBeHidden({ timeout: 15_000 });
  }

  /**
   * Returns the list of option labels currently visible in the context menu.
   * Useful for assertions / debug.
   */
  async getMenuOptions() {
    const items = this.page.getByRole('menuitem');
    const count = await items.count();
    const labels = [];
    for (let i = 0; i < count; i++) {
      labels.push(((await items.nth(i).textContent()) || '').trim());
    }
    return labels;
  }

  /**
   * Verifies that the context menu for `folderName` contains a specific option.
   */
  async verifyMenuContains(folderName, optionName) {
    await this.openForFolder(folderName);
    const item = this.page
      .getByRole('menuitem', { name: new RegExp(optionName, 'i') })
      .first();
    await expect(item).toBeVisible({ timeout: 10_000 });
    // close the menu without taking an action
    await this.page.keyboard.press('Escape');
    await this.page.waitForTimeout(300);
  }
}


/**
 * ConversationThread
 * ------------------
 * Handles conversation thread interactions in the Outlook message list.
 *
 * Outlook Web behaviour (search results):
 *   - Every grouped conversation shows a labelled "Expand conversation" button.
 *   - Clicking it selects the item and opens the email in the Reading Pane.
 *     The button becomes [active] on the selected item; no separate
 *     "Collapse conversation" button appears in search results.
 *
 * Because of this, the POM treats:
 *   - "collapsed" → "Expand conversation" button visible (not yet opened)
 *   - "expanded"  → Reading Pane contains email content (item was opened)
 *
 * Use `expandFirst()` to open the first conversation; use `hasReadingPane()`
 * to verify it was opened.  `collapseFirst()` closes the Reading Pane by
 * clicking away (selects a different item or presses Escape).
 */
export class ConversationThread {
  constructor(page) {
    this.page = page;
  }

  /**
   * Returns the message-list listbox locator.
   */
  list() {
    return this.page.getByRole('listbox', { name: /message list/i });
  }

  /**
   * The Reading Pane region — visible once an email is opened.
   */
  readingPane() {
    return this.page.getByRole('main', { name: /reading pane/i });
  }

  /**
   * Locates all visible "Expand conversation" buttons inside the list.
   */
  _expandButtons() {
    return this.list().getByRole('button', { name: /expand conversation/i });
  }

  /**
   * Returns true if at least one "Expand conversation" button is visible
   * (i.e. the list contains collapsed / not-yet-opened conversations).
   */
  async hasCollapsedThread() {
    await expect(this.list()).toBeVisible({ timeout: 30_000 });
    return await this._expandButtons()
      .first()
      .isVisible({ timeout: 2_000 })
      .catch(() => false);
  }

  /**
   * Returns true if the Reading Pane is currently showing email content.
   * In search results, this is the signal that a conversation was "expanded"
   * (i.e. opened) via the "Expand conversation" button.
   */
  async hasReadingPane() {
    return await this.readingPane()
      .isVisible({ timeout: 2_000 })
      .catch(() => false);
  }

  /**
   * Clicks the "Expand conversation" button on the first collapsed item,
   * opening it in the Reading Pane.
   */
  async expandFirst() {
    await expect(this.list()).toBeVisible({ timeout: 30_000 });
    const btn = this._expandButtons().first();
    await expect(btn).toBeVisible({ timeout: 15_000 });
    await btn.click();
    await this.page.waitForTimeout(800);
  }

  /**
   * "Collapses" (closes) the open conversation by pressing Escape, which
   * deselects the current item and hides the Reading Pane in Outlook Web.
   */
  async collapseFirst() {
    await this.page.keyboard.press('Escape');
    await this.page.waitForTimeout(500);
  }

  /**
   * Clicks "Expand conversation" on the item whose accessible name contains
   * `subject`.
   * @param {string} subject
   */
  async expandBySubject(subject) {
    await expect(this.list()).toBeVisible({ timeout: 30_000 });
    const item = this.list()
      .getByRole('option', { name: new RegExp(escapeRegExp(subject), 'i') })
      .first();
    await expect(item).toBeVisible({ timeout: 30_000 });
    const btn = item.getByRole('button', { name: /expand conversation/i }).first();
    await expect(btn).toBeVisible({ timeout: 10_000 });
    await btn.click();
    await this.page.waitForTimeout(800);
  }

  /**
   * Asserts the Reading Pane is visible (conversation is open / "expanded").
   */
  async verifyExpanded() {
    await expect(this.readingPane()).toBeVisible({ timeout: 15_000 });
  }

  /**
   * Asserts the Reading Pane is not visible (no conversation open).
   */
  async verifyCollapsed() {
    await expect(this.readingPane()).not.toBeVisible({ timeout: 5_000 });
  }
}
