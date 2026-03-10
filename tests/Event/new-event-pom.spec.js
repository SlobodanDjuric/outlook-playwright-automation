// tests/send-new-event-pom.spec.js
import { test, expect } from '@playwright/test';
import { CalendarNavigation } from '../../pages/components/CalendarNavigation.js';
import { NewEventCompose } from '../../pages/outlook/NewEventCompose.js';

function pad2(n) {
  return String(n).padStart(2, '0');
}

function formatDDMMYYYY(date) {
  return `${pad2(date.getDate())}/${pad2(date.getMonth() + 1)}/${date.getFullYear()}`;
}

function futureDateDDMMYYYY(daysAhead = 30) {
  const d = new Date();
  d.setDate(d.getDate() + daysAhead);
  return formatDDMMYYYY(d);
}

test('Outlook Calendar - Send new event (POM)', async ({ page }) => {
  test.setTimeout(120_000);

  const TITLE = `Playwright POM Event ${Date.now()}`;
  const ATTENDEE = 'test@example.com';
  const START_DATE = futureDateDDMMYYYY(45); // future date
  const START_TIME = '18:15';
  const END_TIME = '19:00';
  const LOCATION = 'Conference 3';
  const BODY = 'Ovo je body poruka za New Event (POM). Playwright test.';

  // grant location permission ahead of time so the Chrome geolocation
  // prompt doesn't interfere when typing a location
  await page.context().grantPermissions(['geolocation']);

  await page.goto('https://outlook.live.com/mail/', {
    waitUntil: 'domcontentloaded',
  });

  await expect(page.getByRole('button', { name: /new email/i })).toBeVisible({
    timeout: 45_000,
  });

  const nav = new CalendarNavigation(page);
  await nav.goToCalendar();
  await nav.clickNewEvent();

  const event = new NewEventCompose(page);
  await event.waitUntilOpen();

  await event.eventDetails.fillTitle(TITLE);

  await event.eventDetails.addRequiredAttendee(ATTENDEE);

  // open the time panel and configure date/time in‑line
  await event.eventDetails.openTimeDropdown.setStartDate(START_DATE);
  await event.eventDetails.openTimeDropdown.setStartTime(START_TIME);
  await event.eventDetails.openTimeDropdown.setEndTime(END_TIME);
  await event.eventDetails.openTimeDropdown.setAllDay(true); // ensure it's an event, not an all-day
  // close the panel when done
  await event.eventDetails.openTimeDropdown.close();

  await event.eventDetails.setLocation(LOCATION); 

  await event.eventBody.setBody(BODY);

  // attempt to save; save() is now tolerant if the dialog vanished
  await event.save();

  // short pause so any UI transitions complete
  await page.waitForTimeout(3000);
});
