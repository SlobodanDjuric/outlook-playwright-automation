// tests/fixtures.js
import { test as base } from '@playwright/test';
import { CalendarNavigation } from '../pages/components/CalendarNavigation.js';
import { CalendarEventActions, MeetingResponse } from '../pages/components/CalendarEvent.js';
import { NewEventCompose } from '../pages/page-objects/NewEventCompose.js';
import { NewEmailCompose } from '../pages/page-objects/NewEmailCompose.js';
import { MailFolders } from '../pages/components/MailFolders.js';
import { MailReadingPane } from '../pages/components/MailReadingPane.js';
import { MailContextMenu, SubContextMenu } from '../pages/components/MailContextMenu.js';
import { FolderTreeContextMenu, ConversationThread } from '../pages/components/FolderTree.js';
import { MailSearchBar } from '../pages/components/MailSearchBar.js';
import { EventService } from '../pages/page-objects/EventService.js';

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

    const calendarEventActions = new CalendarEventActions(page);
    const meetingResponse = new MeetingResponse(page);

    await use({ page, nav, calendarEventActions, meetingResponse });
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

    const calendarEventActions = new CalendarEventActions(page);
    const meetingResponse = new MeetingResponse(page);

    await use({ page, nav, event, calendarEventActions, meetingResponse });
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
    const folder = mailFolders;
    const readingPane = new MailReadingPane(page);
    const contextMenu = new MailContextMenu(page);
    const subContextMenu = new SubContextMenu(page);
    const folderContextMenu = new FolderTreeContextMenu(page);
    const searchBar = new MailSearchBar(page);
    const conversationThread = new ConversationThread(page);
    const eventService = new EventService(page);

    await use({
      page,
      compose,
      mailFolders,
      folder,
      readingPane,
      contextMenu,
      subContextMenu,
      folderContextMenu,
      searchBar,
      conversationThread,
      eventService,
    });
  },
});

export { expect } from '@playwright/test';
