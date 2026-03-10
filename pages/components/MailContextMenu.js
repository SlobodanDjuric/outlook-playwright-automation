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
   * Opens the context menu for a specific email
   * identified by its subject.
   *
   * The method:
   * 1. Locates the email row using ARIA role "option"
   * 2. Performs a right-click on it
   */
  async openForSubject(subject) {
    const mailItem = this.page.getByRole('option', { name: new RegExp(subject, 'i') }).first();

    await expect(mailItem).toBeVisible({ timeout: 30_000 });
    await mailItem.click({ button: 'right' });
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
    await this.openForSubject(subject);
    await this.selectOption(action);
  }
}
