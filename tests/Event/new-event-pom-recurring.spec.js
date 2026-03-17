// tests/new-event-pom-recurring.spec.js
import { test, expect } from '@playwright/test';
import { CalendarNavigation } from '../../pages/components/CalendarNavigation.js';
import { NewEventCompose } from '../../pages/outlook/NewEventCompose.js';

/**
 * Helper to format date as dd/mm/yyyy
 */
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

test('Outlook Calendar - Create recurring event (every 3 months on fourth Friday) - POM', async ({ page }) => {
  test.setTimeout(120_000);

  // Test data
  const TITLE = `Playwright Recurring Event ${Date.now()}`;
  const ATTENDEE = 'recurring@example.com';
  const START_DATE = futureDateDDMMYYYY(30); // 30 days from now
  const START_TIME = '14:00';
  const END_TIME = '15:00';
  const LOCATION = 'Team Room';
  const BODY = 'This is a recurring event that repeats every 3 months on the fourth Friday.';

  // Recurrence settings
  const REPEAT_EVERY = 3; // every 3 months
  const FREQUENCY = 'Months';
  const PATTERN = 'On the fourth Friday';
  const UNTIL_DATE = '11/01/2027'; // Jan 11, 2027

  // navigate & open dialog
  await page.goto('https://outlook.live.com/mail/', { waitUntil: 'domcontentloaded' });
  await expect(page.getByRole('button', { name: /new email/i })).toBeVisible({ timeout: 45_000 });
  const nav = new CalendarNavigation(page);
  await nav.goToCalendar();
  await nav.clickNewEvent();

  const event = new NewEventCompose(page);
  await event.waitUntilOpen();

  // basic info
  await event.fillTitle(TITLE);
  await event.addRequiredAttendee(ATTENDEE);

  // date/time + recurrence
  const time = event.eventDetails.openTimeDropdown;
  await time.setStartDate(START_DATE);
  await time.setStartTime(START_TIME);
  await time.setEndTime(END_TIME);

  await time.clickRecurrenceOption.setRepeatEvery(REPEAT_EVERY);
  await time.clickRecurrenceOption.setRecurrenceFrequency(FREQUENCY);
  await time.clickRecurrenceOption.setRecurrencePattern(PATTERN);
  await time.clickRecurrenceOption.setRecurrenceUntil(UNTIL_DATE);

  await time.close();

  // location & body
  await event.eventDetails.setLocation(LOCATION);
  await page.waitForTimeout(800);
  await event.eventBody.setBody(BODY);
});

// weekly event

test('Outlook Calendar - Create weekly recurring event (every 2 weeks) - POM', async ({ page }) => {
  test.setTimeout(120_000);

  const TITLE = `Playwright Weekly Recurring ${Date.now()}`;
  const ATTENDEE = 'weekly@example.com';
  const START_DATE = futureDateDDMMYYYY(7);
  const START_TIME = '10:00';
  const END_TIME = '10:30';
  const LOCATION = 'Standup Room';
  const BODY = 'Weekly standup that repeats every 2 weeks.';

  const REPEAT_EVERY = 2;
  const FREQUENCY = 'Weeks';
  const UNTIL_DATE = '31/12/2026';

  await page.goto('https://outlook.live.com/mail/', { waitUntil: 'domcontentloaded' });
  await expect(page.getByRole('button', { name: /new email/i })).toBeVisible({ timeout: 45_000 });
  const nav = new CalendarNavigation(page);
  await nav.goToCalendar();
  await nav.clickNewEvent();

  const event = new NewEventCompose(page);
  await event.waitUntilOpen();

  await event.fillTitle(TITLE);
  await event.addRequiredAttendee(ATTENDEE);

  const time = event.eventDetails.openTimeDropdown;
  await time.setStartDate(START_DATE);
  await time.setStartTime(START_TIME);
  await time.setEndTime(END_TIME);

  await time.clickRecurrenceOption.setRepeatEvery(REPEAT_EVERY);
  await time.clickRecurrenceOption.setRecurrenceFrequency(FREQUENCY);
  await time.clickRecurrenceOption.setRecurrenceUntil(UNTIL_DATE);

  await time.close();

  await event.eventDetails.setLocation(LOCATION);
  await page.waitForTimeout(800);
  await event.eventBody.setBody(BODY);
});

// daily event

test('Outlook Calendar - Create daily recurring event (every 5 days) - POM', async ({ page }) => {
  test.setTimeout(120_000);

  const TITLE = `Playwright Daily Recurring ${Date.now()}`;
  const ATTENDEE = 'daily@example.com';
  const START_DATE = futureDateDDMMYYYY(1);
  const START_TIME = '09:00';
  const END_TIME = '09:15';
  const LOCATION = 'Virtual';
  const BODY = 'Daily reminder that repeats every 5 days.';

  const REPEAT_EVERY = 5;
  const FREQUENCY = 'Days';
  const UNTIL_DATE = '30/06/2026';

  await page.goto('https://outlook.live.com/mail/', { waitUntil: 'domcontentloaded' });
  await expect(page.getByRole('button', { name: /new email/i })).toBeVisible({ timeout: 45_000 });
  const nav = new CalendarNavigation(page);
  await nav.goToCalendar();
  await nav.clickNewEvent();

  const event = new NewEventCompose(page);
  await event.waitUntilOpen();

  await event.fillTitle(TITLE);
  await event.addRequiredAttendee(ATTENDEE);

  const time = event.eventDetails.openTimeDropdown;
  await time.setStartDate(START_DATE);
  await time.setStartTime(START_TIME);
  await time.setEndTime(END_TIME);

  await time.clickRecurrenceOption.setRepeatEvery(REPEAT_EVERY);
  await time.clickRecurrenceOption.setRecurrenceFrequency(FREQUENCY);
  await time.clickRecurrenceOption.setRecurrenceUntil(UNTIL_DATE);

  await time.close();

  await event.eventDetails.setLocation(LOCATION);
  await page.waitForTimeout(800);
  await event.eventBody.setBody(BODY);
});
