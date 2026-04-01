// tests/Event/new-event-pom-all-day.spec.js
import { test, expect } from '@playwright/test';
import { CalendarNavigation } from '../../pages/components/CalendarNavigation.js';
import { NewEventCompose } from '../../pages/page-objects/NewEventCompose.js';
import { futureDateDDMMYYYY } from '../utils/dateHelpers.js';

test.use({ timeout: 120_000 });

test('Outlook Calendar - Create all-day event (POM)', async ({ page }) => {

  // Test data
  const TITLE = `Playwright All-Day Event ${Date.now()}`;
  const ATTENDEE = 'team@example.com';
  const EVENT_DATE = futureDateDDMMYYYY(2);
  const LOCATION = 'Virtual Meeting';
  const BODY = 'Ovo je all-day event kreiran putem Playwright POM-a.';

  await test.step('Navigate to Outlook Calendar', async () => {
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

  await test.step('Fill event title and attendee', async () => {
    await event.waitUntilOpen();
    await event.fillTitle(TITLE);
    await event.addRequiredAttendee(ATTENDEE);
  });

  await test.step("Enable 'All day' and set date", async () => {
    // open the time panel and perform all actions via the fluent helper
    const time = event.eventDetails.openTimeDropdown;

    // toggle on and pick a start date; direct toggle avoids potential
    // race between isAllDayEnabled and the checkbox appearing.
    await time.toggleAllDay();
    await time.setStartDate(EVENT_DATE);

    // verify toggle worked
    const nowEnabled = await event.eventDetails.isAllDayEnabled();
    expect(nowEnabled).toBe(true);

    await time.close();
  });

  await test.step('Fill location and body', async () => {
    await event.eventDetails.setLocation(LOCATION);
    await event.eventBody.setBody(BODY);
  });

  await test.step('Save all-day event', async () => {
    await event.save();
  });
});

test('Outlook Calendar - Toggle all-day on/off (POM)', async ({ page }) => {

  const TITLE = `Playwright Toggle Test ${Date.now()}`;
  const ATTENDEE = 'test@example.com';
  const EVENT_DATE = futureDateDDMMYYYY(3);

  await test.step('Navigate and open new event dialog', async () => {
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

  await test.step('Fill basic event details', async () => {
    await event.waitUntilOpen();
    await event.fillTitle(TITLE);
    await event.addRequiredAttendee(ATTENDEE);
    // open grey time bar via new helper path (no need to call method directly)
    await event.eventDetails.openTimeDropdown.ensureOpen();
  });

  await test.step('Toggle all-day multiple times', async () => {
    const time = event.eventDetails.openTimeDropdown;

    // Start: all-day disabled
    let isEnabled = await event.eventDetails.isAllDayEnabled();
    expect(isEnabled).toBe(false);

    // Toggle ON
    await time.toggleAllDay();
    isEnabled = await event.eventDetails.isAllDayEnabled();
    expect(isEnabled).toBe(true);

    // Toggle OFF
    await time.toggleAllDay();
    isEnabled = await event.eventDetails.isAllDayEnabled();
    expect(isEnabled).toBe(false);

    // Toggle ON again
    await time.toggleAllDay();
    isEnabled = await event.eventDetails.isAllDayEnabled();
    expect(isEnabled).toBe(true);
  });

  await test.step('Set date and send', async () => {
    await event.setStartDate(EVENT_DATE);
    // the time panel helper has its own close method
    await event.eventDetails.openTimeDropdown.close();
    await event.save();
  });
});
