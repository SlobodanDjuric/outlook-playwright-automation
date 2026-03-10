// pages/components/CalendarNavigation.js
import { expect } from '@playwright/test';
import { CalendarActions } from '../constants/calendarActions.js';

/**
 * CalendarNavigation
 * ------------------
 * Page Object responsible for navigation-related actions
 * within the Outlook Calendar module.
 *
 * Responsibilities:
 * - Navigate from Mail to Calendar
 * - Open the "New event" dialog
 */
export class CalendarNavigation {
  constructor(page) {
    this.page = page;
  }

  /**
   * Navigates from Mail to Calendar.
   * Works when starting from the Mail page.
   */
  async goToCalendar() {
    const calendarNav = this.page.locator('button[aria-label*="Calendar" i], a[aria-label*="Calendar" i]').first();

    await expect(calendarNav).toBeVisible({ timeout: 45_000 });
    await calendarNav.click();
  }

  /**
   * Clicks the "New event" button in Calendar.
   */
  async clickNewEvent() {
    const newEventBtn = this.page
      .getByRole('button', {
        name: new RegExp(`^${CalendarActions.NewEvent}$`, 'i'),
      })
      .first();

    await expect(newEventBtn).toBeVisible({ timeout: 45_000 });
    // occasionally a tooltip overlays the button; force clicking avoids
    // intermittent "intercepts pointer events" errors seen in CI.
    await this.page.waitForTimeout(150);

    // Click and then ensure the compose dialog actually appears.  In the past
    // the click would silently fail / be swallowed by the UI when a tooltip
    // was present, leading to tests hanging downstream.
    await newEventBtn.click({ force: true });

    const titleInput = this.page.getByPlaceholder('Add title').first();
    try {
      await expect(titleInput).toBeVisible({ timeout: 5_000 });
    } catch (e) {
      // second attempt if the first click didn't open the dialog
      await newEventBtn.click({ force: true });
      await expect(titleInput).toBeVisible({ timeout: 45_000 });
    }
  }
}
