// tests/Event/new-event-toolbar-specific.spec.js
// Targeted toolbar test: configures a single fixed combination of EventType,
// Status, Reminder, and Privacy from constants and saves the event.
// Useful for verifying a specific production-like toolbar configuration.

import { test, expect } from '@playwright/test';
import { CalendarNavigation } from '../../pages/components/CalendarNavigation.js';
import { NewEventCompose } from '../../pages/page-objects/NewEventCompose.js';
import { EventType, Status, Reminder, Privacy } from '../../pages/constants/calendarOptions.js';

test('Outlook Calendar - toolbar with specific event config', async ({ page }) => {
  test.setTimeout(120_000);

  const TITLE = `Specific Toolbar Config ${Date.now()}`;

  // === Test Configuration ===
  const EVENT_TYPE = EventType.Event;
  const EVENT_STATUS = Status.Free;
  const EVENT_REMINDER = Reminder.TwoHoursBefore;
  const EVENT_PRIVACY = Privacy.Private;

  await test.step('Navigate to calendar and open new event', async () => {
    await page.goto('https://outlook.live.com/mail/', {
      waitUntil: 'domcontentloaded',
    });

    await expect(page.getByRole('button', { name: /new email/i })).toBeVisible({
      timeout: 45_000,
    });

    const nav = new CalendarNavigation(page);
    await nav.goToCalendar();
    await nav.clickNewEvent();
  });

  const event = new NewEventCompose(page);

  await test.step('Fill title', async () => {
    await event.waitUntilOpen();
    await event.eventDetails.fillTitle(TITLE);
  });

  await test.step('Set event type', async () => {
    await event.ensureEventType(EVENT_TYPE);
  });

  await test.step('Set status/availability', async () => {
    await event.eventToolbar.setStatus(EVENT_STATUS);
  });

  await test.step('Set reminder', async () => {
    await event.eventToolbar.setReminder(EVENT_REMINDER);
  });

  await test.step('Set privacy', async () => {
    await event.eventToolbar.setPrivacy(EVENT_PRIVACY);
  });

  await test.step('Save event', async () => {
    await event.save();
  });
});
