// tests/fixtures.js
import { test as base } from '@playwright/test';
import { CalendarNavigation } from '../pages/components/CalendarNavigation.js';
import { NewEventCompose } from '../pages/outlook/NewEventCompose.js';
import { NewEmailCompose } from '../pages/outlook/NewEmailCompose.js';
import { MailFolders } from '../pages/components/mailFolders.js';

/**
 * Shared Playwright fixtures for Outlook automation tests.
 *
 * Available fixtures:
 *
 * calendarPage — navigates to Outlook Mail, then to Calendar.
 *   Provides: { page, nav }
 *   Use when you only need to be on the calendar (no new event dialog).
 *
 * newEventPage — extends calendarPage: also clicks "New event" and waits
 *   for the compose dialog to open.
 *   Provides: { page, nav, event }
 *   Use for all "create event" tests.
 *
 * mailPage — navigates to Outlook Mail and waits until the UI is ready.
 *   Provides: { page, compose, mailFolders }
 *   Use for all mail-related tests.
 */
export const test = base.extend({
  /**
   * calendarPage
   * Navigates to Outlook Mail → Calendar.
   * Yields { page, nav } to the test.
   */
  calendarPage: async ({ page }, use) => {
    await page.goto('https://outlook.live.com/mail/', {
      waitUntil: 'domcontentloaded',
    });

    const { expect } = await import('@playwright/test');
    await expect(page.getByRole('button', { name: /new email/i })).toBeVisible({
      timeout: 45_000,
    });

    const nav = new CalendarNavigation(page);
    await nav.goToCalendar();

    await use({ page, nav });
  },

  /**
   * newEventPage
   * Extends calendarPage: also opens the "New event" compose dialog.
   * Yields { page, nav, event } to the test.
   */
  newEventPage: async ({ page }, use) => {
    await page.goto('https://outlook.live.com/mail/', {
      waitUntil: 'domcontentloaded',
    });

    const { expect } = await import('@playwright/test');
    await expect(page.getByRole('button', { name: /new email/i })).toBeVisible({
      timeout: 45_000,
    });

    const nav = new CalendarNavigation(page);
    await nav.goToCalendar();
    await nav.clickNewEvent();

    const event = new NewEventCompose(page);
    await event.waitUntilOpen();

    await use({ page, nav, event });
  },

  /**
   * mailPage
   * Navigates to Outlook Mail and waits until the UI is ready.
   * Yields { page, compose, mailFolders } to the test.
   */
  mailPage: async ({ page }, use) => {
    await page.goto('https://outlook.live.com/mail/', {
      waitUntil: 'domcontentloaded',
    });

    const { expect } = await import('@playwright/test');
    await expect(page.getByRole('button', { name: /new email/i })).toBeVisible({
      timeout: 45_000,
    });

    const compose = new NewEmailCompose(page);
    const mailFolders = new MailFolders(page);

    await use({ page, compose, mailFolders });
  },
});

export { expect } from '@playwright/test';
