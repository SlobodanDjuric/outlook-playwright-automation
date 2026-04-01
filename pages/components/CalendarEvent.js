// pages/components/CalendarEvent.js
import { expect } from '@playwright/test';

/**
 * CalendarEventActions
 * --------------------
 * Handles interactions with existing events already saved in the calendar grid:
 * finding them by title, opening them for viewing / editing, and deleting them.
 *
 * The calendar grid renders events as buttons whose accessible name contains
 * the event title, date, time and status, e.g.:
 *   "My Meeting, 10:00 to 11:00, Tuesday, 1 April 2025, Busy"
 *
 * Usage:
 *   const actions = new CalendarEventActions(page);
 *   await actions.openByTitle('My Meeting');  // opens compose / view form
 *   await actions.deleteByTitle('My Meeting');
 */
export class CalendarEventActions {
  constructor(page) {
    this.page = page;
  }

  /**
   * Returns a locator for the event button matching `title` in the calendar grid.
   * @param {string} title
   */
  _eventButton(title) {
    const escaped = title.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
    return this.page
      .getByRole('button', { name: new RegExp(escaped, 'i') })
      .first();
  }

  /**
   * Clicks the event on the calendar grid to open the mini-popup.
   * @param {string} title
   */
  async clickOnGrid(title) {
    const btn = this._eventButton(title);
    await expect(btn).toBeVisible({ timeout: 30_000 });
    await btn.click();
  }

  /**
   * Opens the full compose / view form for an event with the given title.
   * Flow: click event → mini-popup → click "View event".
   * @param {string} title
   */
  async openByTitle(title) {
    await this.clickOnGrid(title);

    const viewBtn = this.page
      .getByRole('button', { name: /view event/i })
      .first();
    await expect(viewBtn).toBeVisible({ timeout: 15_000 });
    await viewBtn.click();

    // Wait for the compose form to appear (title input becomes visible)
    await expect(
      this.page.getByPlaceholder('Add title')
    ).toBeVisible({ timeout: 30_000 });
  }

  /**
   * Deletes an event by title.
   * Flow: openByTitle → click Delete toolbar button → confirm dialog if present.
   * @param {string} title
   */
  async deleteByTitle(title) {
    await this.openByTitle(title);

    const deleteBtn = this.page
      .getByRole('button', { name: /^delete$/i })
      .first();
    await expect(deleteBtn).toBeVisible({ timeout: 15_000 });
    await deleteBtn.click();

    // Some Outlook configurations show a confirmation dialog
    await this.page.waitForTimeout(800);
    const confirmBtn = this.page
      .getByRole('button', { name: /^delete$/i })
      .first();
    if (await confirmBtn.isVisible({ timeout: 3_000 }).catch(() => false)) {
      await confirmBtn.click();
    }

    // Wait for compose form to close
    await expect(
      this.page.getByPlaceholder('Add title')
    ).toBeHidden({ timeout: 30_000 });
  }

  /**
   * Returns true if an event with `title` is currently visible in the grid.
   * @param {string} title
   */
  async isVisible(title) {
    return await this._eventButton(title)
      .isVisible({ timeout: 3_000 })
      .catch(() => false);
  }
}


/**
 * MeetingResponse
 * ---------------
 * Handles Accept / Decline / Tentative responses to meeting invitations.
 *
 * Response buttons appear in two contexts:
 *   1. The mini-popup after clicking a meeting on the calendar grid.
 *   2. The full event view form (when opened via "View event").
 *
 * If the current user is the organiser the buttons will not be present.
 * Use `hasResponseButtons()` to check before calling the response methods.
 *
 * Usage:
 *   const resp = new MeetingResponse(page);
 *   if (await resp.hasResponseButtons()) {
 *     await resp.accept();
 *   }
 */
export class MeetingResponse {
  constructor(page) {
    this.page = page;
  }

  /**
   * Scans the current calendar view for a meeting invitation by clicking each
   * visible event button until Accept/Decline/Tentative buttons appear.
   * Returns true if an invited event was found (response buttons visible).
   * Closes any opened mini-popup when no invited event is found.
   */
  async findInvitedEvent() {
    const eventButtons = this.page.getByRole('button', { name: /,.*to.*,|busy|tentative|free/i });
    const count = await eventButtons.count().catch(() => 0);

    for (let i = 0; i < Math.min(count, 10); i++) {
      const btn = eventButtons.nth(i);
      if (!(await btn.isVisible({ timeout: 1_000 }).catch(() => false))) continue;
      await btn.click().catch(() => {});
      await this.page.waitForTimeout(400);
      if (await this.hasResponseButtons()) return true;
      await this.page.keyboard.press('Escape').catch(() => {});
      await this.page.waitForTimeout(200);
    }
    return false;
  }

  /**
   * Returns true if Accept / Decline / Tentative buttons are currently visible.
   */
  async hasResponseButtons() {
    return await this.page
      .getByRole('button', { name: /^accept$/i })
      .first()
      .isVisible({ timeout: 3_000 })
      .catch(() => false);
  }

  /**
   * Clicks the "Accept" button.
   * If a sub-menu appears (e.g. "Send the response now" / "Don't send a response"),
   * automatically chooses "Send the response now".
   */
  async accept() {
    await this._respond('accept');
  }

  /**
   * Clicks the "Decline" button.
   */
  async decline() {
    await this._respond('decline');
  }

  /**
   * Clicks the "Tentative" button.
   */
  async tentative() {
    await this._respond('tentative');
  }

  /**
   * Internal helper — clicks the main response button then handles the
   * optional "Send response now" sub-menu that Outlook sometimes shows.
   * @param {'accept'|'decline'|'tentative'} action
   */
  async _respond(action) {
    const btn = this.page
      .getByRole('button', { name: new RegExp(`^${action}$`, 'i') })
      .first();
    await expect(btn).toBeVisible({ timeout: 15_000 });
    await btn.click();
    await this.page.waitForTimeout(400);

    // Outlook may show a sub-menu: "Send the response now" / "Edit the response…"
    // / "Don't send a response".  We prefer "Send the response now".
    const sendNowOption = this.page
      .getByRole('menuitem', { name: /send (the )?response now/i })
      .or(this.page.getByRole('option', { name: /send (the )?response now/i }))
      .first();

    if (await sendNowOption.isVisible({ timeout: 2_000 }).catch(() => false)) {
      await sendNowOption.click();
    }

    await this.page.waitForTimeout(500);
  }
}
