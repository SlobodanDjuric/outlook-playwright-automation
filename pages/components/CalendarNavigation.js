// pages/components/CalendarNavigation.js
import { expect } from '@playwright/test';
import { CalendarActions } from '../constants/calendarOptions.js';

/**
 * CalendarNavigation
 * ------------------
 * Page Object responsible for navigation-related actions
 * within the Outlook Calendar module.
 *
 * Responsibilities:
 * - Navigate from Mail to Calendar
 * - Open the "New event" dialog
 * - Switch calendar views (Day / Work week / Week / Month)
 * - Navigate forward / backward / to today
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
   * Switches to a calendar view.
   * @param {'Day'|'Work week'|'Week'|'Month'} view - use CalendarView constants
   */
  async switchToView(view) {
    // Outlook renders view buttons as regular buttons (e.g. "Day", "Work week").
    // Some locales or screen sizes may append " view" to the label.
    const btn = this.page
      .getByRole('button', { name: new RegExp(`^${view}$`, 'i') })
      .or(this.page.getByRole('button', { name: new RegExp(`${view} view`, 'i') }))
      .first();
    await expect(btn).toBeVisible({ timeout: 15_000 });
    await btn.click();
    await this.page.waitForTimeout(500);
  }

  /**
   * Clicks the "Today" button to navigate to the current date.
   */
  async goToToday() {
    // Outlook renders the Today button with the full date in its label,
    // e.g. "Go to today March 25, 2026" — match the invariant prefix only.
    const btn = this.page.getByRole('button', { name: /go to today/i }).first();
    await expect(btn).toBeVisible({ timeout: 15_000 });
    await btn.click();
    await this.page.waitForTimeout(300);
  }

  /**
   * Clicks the forward navigation arrow (next day / next week / next month,
   * depending on the active view).
   */
  async goToNextPeriod() {
    const btn = this.page.getByRole('button', { name: /go to next/i }).first();
    await expect(btn).toBeVisible({ timeout: 15_000 });
    await btn.click();
    await this.page.waitForTimeout(300);
  }

  /**
   * Clicks the backward navigation arrow.
   */
  async goToPreviousPeriod() {
    const btn = this.page.getByRole('button', { name: /go to previous/i }).first();
    await expect(btn).toBeVisible({ timeout: 15_000 });
    await btn.click();
    await this.page.waitForTimeout(300);
  }

  /**
   * Returns the currently visible calendar heading text (e.g. "March 2026").
   * Useful for asserting that navigation changed the displayed period.
   */
  async getHeading() {
    const headingWithYear = this.page
      .locator('[role="heading"]')
      .filter({ hasText: /\d{4}/ })
      .first();
    if (await headingWithYear.isVisible({ timeout: 3_000 }).catch(() => false)) {
      return (await headingWithYear.innerText().catch(() => '')).trim();
    }
    const btnWithYear = this.page
      .locator('button[aria-label*="2025"], button[aria-label*="2026"], button[aria-label*="2027"]')
      .or(this.page.getByRole('button').filter({ hasText: /\b20\d{2}\b/ }))
      .first();
    if (await btnWithYear.isVisible({ timeout: 2_000 }).catch(() => false)) {
      return (await btnWithYear.innerText().catch(() => '')).trim();
    }
    return '';
  }

  /**
   * Clicks "Go to next day" — only available in Day view.
   * No-op if the button is not present (different view active).
   */
  async goToNextDay() {
    const btn = this.page.getByRole('button', { name: /go to next day/i }).first();
    if (await btn.isVisible({ timeout: 3_000 }).catch(() => false)) {
      await btn.click();
      await this.page.waitForTimeout(800);
    }
  }

  /**
   * Asserts that the correct "Go to next …" navigation button is visible for
   * the given view, confirming the view switch actually took effect.
   * @param {'Day'|'Work week'|'Week'|'Month'} viewName - use CalendarView constants
   */
  async verifyCurrentView(viewName) {
    const patterns = {
      'Day': /go to next day/i,
      'Work week': /go to next week/i,
      'Week': /go to next week/i,
      'Month': /go to next month/i,
    };
    const pattern = patterns[viewName] || /go to next/i;
    await expect(
      this.page.getByRole('button', { name: pattern }).first()
    ).toBeVisible({ timeout: 15_000 });
  }

  /**
   * Asserts that a view-switcher button (e.g. "Day", "Work week") is visible
   * in the calendar toolbar.
   * @param {string} viewName - e.g. 'Day', 'Week', 'Month'
   */
  async verifyViewButtonVisible(viewName) {
    await expect(
      this.page.getByRole('button', { name: new RegExp(`^${viewName}$`, 'i') }).first()
    ).toBeVisible({ timeout: 10_000 });
  }

  /** Asserts the "Go to today" navigation button is visible. */
  async verifyTodayButtonVisible() {
    await expect(
      this.page.getByRole('button', { name: /go to today/i }).first()
    ).toBeVisible({ timeout: 10_000 });
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
