// pages/components/MailReadingPane.js
import { expect } from '@playwright/test';

/**
 * MailReadingPane
 * ---------------
 * Encapsulates the toolbar actions available in the Outlook reading pane
 * after a message is selected: Reply, Reply All, Forward, and compose-ready checks.
 */
export class MailReadingPane {
  constructor(page) {
    this.page = page;
  }

  /** Clicks "Reply All" — direct toolbar button. */
  async replyAll() {
    const btn = this.page.getByRole('button', { name: /^reply all$/i }).first();
    await expect(btn).toBeVisible({ timeout: 30_000 });
    await btn.click();
  }

  /**
   * Opens the "Expand to see more respond options" dropdown and clicks
   * the given action ("Reply" or "Forward").
   * @param {'Reply'|'Forward'} action
   */
  async _respondViaDropdown(action) {
    const expandBtn = this.page
      .getByRole('button', { name: /expand to see more respond options/i })
      .first();
    await expect(expandBtn).toBeVisible({ timeout: 30_000 });
    await expandBtn.click();

    const item = this.page
      .getByRole('menuitem', { name: new RegExp(`^${action}$`, 'i') })
      .first();
    await expect(item).toBeVisible({ timeout: 10_000 });
    await item.click();
  }

  /** Opens the "Reply" inline form. */
  async reply() {
    await this._respondViaDropdown('Reply');
  }

  /** Opens the "Forward" compose form. */
  async forward() {
    await this._respondViaDropdown('Forward');
  }

  /**
   * Waits until the inline compose / reply form is ready.
   * Presence of a "Send" button confirms the form is active.
   */
  async waitForComposeReady() {
    await expect(
      this.page.getByRole('button', { name: /^send$/i }).first()
    ).toBeVisible({ timeout: 30_000 });
  }

  /** Asserts that the message body textbox is visible (reply/forward form). */
  async verifyComposeBodyVisible() {
    await expect(
      this.page.getByRole('textbox', { name: /message body/i }).first()
    ).toBeVisible({ timeout: 15_000 });
  }

  /** Sends the inline reply/forward compose form. */
  async send() {
    const btn = this.page.getByRole('button', { name: /^send$/i }).first();
    await expect(btn).toBeVisible({ timeout: 15_000 });
    await btn.click();
    await this.page.waitForTimeout(500);
  }

  /** Discards (cancels) the inline reply/forward compose form. */
  async discard() {
    const btn = this.page
      .getByRole('button', { name: /^discard$/i })
      .first();
    await expect(btn).toBeVisible({ timeout: 15_000 });
    await btn.click();
    await this.page.waitForTimeout(300);
  }

  /** Clicks the Delete button in the reading pane toolbar. */
  async delete() {
    const btn = this.page
      .getByRole('button', { name: /^delete$/i })
      .first();
    await expect(btn).toBeVisible({ timeout: 15_000 });
    await btn.click();
    await this.page.waitForTimeout(500);
  }

  /** Clicks the "Flag / Unflag" toggle button in the reading pane toolbar. */
  async flag() {
    const btn = this.page
      .getByRole('button', { name: /^flag \/ unflag$/i })
      .first();
    await expect(btn).toBeVisible({ timeout: 15_000 });
    await btn.click();
    await this.page.waitForTimeout(300);
  }

  /** Opens the "More options" (…) menu in the reading pane. */
  async moreActions() {
    const btn = this.page
      .getByRole('button', { name: /^more options$/i })
      .first();
    await expect(btn).toBeVisible({ timeout: 15_000 });
    await btn.click();
    await this.page.waitForTimeout(300);
  }

  /**
   * Opens the Header action menu (button on the conversation header)
   * which contains: Mark as read, Mark as unread, Move, Copy, Delete, Categorise.
   */
  async _headerActionMenu() {
    const btn = this.page
      .getByRole('button', { name: /^header action menu$/i })
      .first();
    await expect(btn).toBeVisible({ timeout: 15_000 });
    await btn.click();
    await this.page.waitForTimeout(300);
  }

  /** Marks the open message as read via the Header action menu. */
  async markAsRead() {
    await this._headerActionMenu();
    const item = this.page
      .getByRole('menuitem', { name: /^mark as read$/i })
      .first();
    await expect(item).toBeVisible({ timeout: 8_000 });
    await item.click();
    await this.page.waitForTimeout(300);
  }

  /** Marks the open message as unread via the Header action menu. */
  async markAsUnread() {
    await this._headerActionMenu();
    const item = this.page
      .getByRole('menuitem', { name: /^mark as unread$/i })
      .first();
    await expect(item).toBeVisible({ timeout: 8_000 });
    await item.click();
    await this.page.waitForTimeout(300);
  }

  /** Opens the print dialog for the current message via More options. */
  async printMessage() {
    await this.moreActions();
    const item = this.page
      .getByRole('menuitem', { name: /^print$/i })
      .first();
    await expect(item).toBeVisible({ timeout: 8_000 });
    await item.click();
    await this.page.waitForTimeout(500);
  }

  /**
   * Opens the current message in a new pop-out window.
   * Returns the new Playwright Page so callers can interact with it.
   * NOTE: This button is not available in all Outlook versions/accounts.
   * Returns null if the button is not found.
   */
  async openInNewWindow() {
    const btn = this.page
      .getByRole('button', { name: /open in new window|pop.?out/i })
      .first();
    if (!(await btn.isVisible({ timeout: 5_000 }).catch(() => false))) {
      return null;
    }
    const [newPage] = await Promise.all([
      this.page.context().waitForEvent('page'),
      btn.click(),
    ]);
    await newPage.waitForLoadState('domcontentloaded');
    return newPage;
  }

  /**
   * Types text into the inline reply/forward message body.
   * Assumes the compose form is already open (call reply() or forward() first).
   * @param {string} text
   */
  async typeReplyBody(text) {
    const body = this.page.getByRole('textbox', { name: /message body/i }).first();
    await expect(body).toBeVisible({ timeout: 15_000 });
    await body.click();
    await body.type(text, { delay: 20 });
  }

  /**
   * Returns true if the currently selected message has attachments
   * ("Download all" button is visible in the reading pane).
   */
  async hasAttachments() {
    return this.page.getByRole('button', { name: /download all/i }).first()
      .isVisible({ timeout: 5_000 }).catch(() => false);
  }

  /** Asserts the inline Send button is hidden (compose form was closed). */
  async verifySendButtonHidden() {
    await expect(
      this.page.getByRole('button', { name: /^send$/i }).first()
    ).toBeHidden({ timeout: 15_000 });
  }

  /** Asserts the "Flag / Unflag" button is visible in the reading pane toolbar. */
  async verifyFlagButtonVisible() {
    await expect(
      this.page.getByRole('button', { name: /^flag \/ unflag$/i }).first()
    ).toBeVisible({ timeout: 10_000 });
  }

  /**
   * Asserts that at least one menu item is visible after opening the More
   * actions menu (i.e., the menu is open and has content).
   */
  async verifyMoreActionsMenuVisible() {
    await expect(
      this.page.getByRole('menuitem').first()
    ).toBeVisible({ timeout: 8_000 });
  }

  /**
   * Downloads all attachments of the currently open message.
   * Only call this when the message has attachments ("Download all" button visible).
   * Returns the Playwright Download object.
   */
  async downloadAttachments() {
    const btn = this.page
      .getByRole('button', { name: /download all/i })
      .first();
    await expect(btn).toBeVisible({ timeout: 15_000 });
    const [download] = await Promise.all([
      this.page.waitForEvent('download'),
      btn.click(),
    ]);
    return download;
  }
}
