// pages/components/CalendarNavigation.js
import { expect } from "@playwright/test";
import { CalendarActions } from "../constants/calendarActions.js";

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
    const calendarNav = this.page
      .locator('button[aria-label*="Calendar" i], a[aria-label*="Calendar" i]')
      .first();

    await expect(calendarNav).toBeVisible({ timeout: 45_000 });
    await calendarNav.click();
  }

  /**
   * Clicks the "New event" button in Calendar.
   */
  async clickNewEvent() {
    const newEventBtn = this.page
      .getByRole("button", {
        name: new RegExp(`^${CalendarActions.NewEvent}$`, "i"),
      })
      .first();

    await expect(newEventBtn).toBeVisible({ timeout: 45_000 });
    await newEventBtn.click();
  }
}