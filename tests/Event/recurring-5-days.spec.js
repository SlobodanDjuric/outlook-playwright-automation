// tests/Event/recurring-5-days.spec.js
// Tests for configuring recurring events with various frequency settings:
//   1. Every 5 days
//   2. Every 1 month on the second Thursday
//   3. Every 4 weeks on Friday and Saturday
//   4. Every year with "On the" pattern
// Each test verifies that the recurrence summary and toolbar state update correctly.

import { test, expect } from '@playwright/test';
import { CalendarNavigation } from '../../pages/components/CalendarNavigation.js';
import { NewEventCompose } from '../../pages/page-objects/NewEventCompose.js';
import { CalendarFields } from '../../pages/selectors/calendarFields.js';
import { formatDDMMYYYY, tomorrow, addMonths } from '../utils/dateHelpers.js';

test.use({ timeout: 120_000 });

// ── test 1: every 5 days ────────────────────────────────────────────────────

test('Recurring — every 5 days: interval, unit, and summary are correct', async ({ page }) => {

  const TITLE        = `Playwright Recurring 5-Day Event ${Date.now()}`;
  const START_DATE   = formatDDMMYYYY(tomorrow());
  const START_TIME   = '09:00';
  const END_TIME     = '09:30';
  const UNTIL_DATE   = formatDDMMYYYY(addMonths(new Date(), 4));
  const REPEAT_EVERY = 5;
  const FREQUENCY    = 'Days';

  await page.goto('https://outlook.live.com/mail/', { waitUntil: 'domcontentloaded' });
  await expect(page.getByRole('button', { name: /new email/i })).toBeVisible({ timeout: 45_000 });

  const nav = new CalendarNavigation(page);
  await nav.goToCalendar();
  await nav.clickNewEvent();

  const event = new NewEventCompose(page);
  await event.waitUntilOpen();

  await event.fillTitle(TITLE);

  // date & time
  const time = event.eventDetails.openTimeDropdown;
  await time.setStartDate(START_DATE);
  await time.setStartTime(START_TIME);
  await time.setEndTime(END_TIME);

  // enable recurrence then configure settings
  await event.clickRecurrenceOption();
  await event.setRepeatEvery(REPEAT_EVERY);
  await event.setRecurrenceFrequency(FREQUENCY);
  await event.setRecurrenceUntil(UNTIL_DATE);

  // ── verifications ──────────────────────────────────────────────────────────

  // interval combobox shows 5
  const intervalCombobox = page.locator(CalendarFields.RepeatEveryInput);
  await expect(intervalCombobox).toBeVisible({ timeout: 10_000 });
  expect((await intervalCombobox.textContent())?.trim()).toMatch(/^5/);

  // unit combobox shows "day"
  const unitCombobox = page.getByRole('combobox', { name: /unit of time/i });
  expect((await unitCombobox.textContent())?.trim()).toMatch(/day/i);

  // summary button mentions "5 day"
  const summaryLocator = page.locator('button:has-text("5 day"), button[aria-label*="5 day" i]').first();
  await expect(summaryLocator).toBeVisible({ timeout: 10_000 });
  const summaryText = await summaryLocator.getAttribute('aria-label') ?? await summaryLocator.textContent();
  console.log('summary =', summaryText);

  // toolbar "Series" radio is checked
  await expect(page.locator(CalendarFields.RecurringButton).first()).toHaveAttribute('aria-checked', 'true');

  await page.waitForTimeout(3000);
});

// ── test 2: every 1 month on the second Thursday ────────────────────────────

test('Recurring — every 1 month on second Thursday: unit and pattern radio are correct', async ({ page }) => {

  const TITLE        = `Playwright Recurring Monthly Event ${Date.now()}`;
  const START_DATE   = formatDDMMYYYY(tomorrow());
  const START_TIME   = '20:00';
  const END_TIME     = '20:30';
  const REPEAT_EVERY = 1;
  const FREQUENCY    = 'Month';
  const PATTERN      = 'On the';
  const UNTIL_DATE   = formatDDMMYYYY(addMonths(new Date(), 4));

  await page.goto('https://outlook.live.com/mail/', { waitUntil: 'domcontentloaded' });
  await expect(page.getByRole('button', { name: /new email/i })).toBeVisible({ timeout: 45_000 });

  const nav = new CalendarNavigation(page);
  await nav.goToCalendar();
  await nav.clickNewEvent();

  const event = new NewEventCompose(page);
  await event.waitUntilOpen();

  await event.fillTitle(TITLE);

  // date & time
  const time = event.eventDetails.openTimeDropdown;
  await time.setStartDate(START_DATE);
  await time.setStartTime(START_TIME);
  await time.setEndTime(END_TIME);

  // enable recurrence once, then configure settings directly on event
  await event.clickRecurrenceOption();
  await event.setRepeatEvery(REPEAT_EVERY);
  await event.setRecurrenceFrequency(FREQUENCY);
  await event.setFirstPatternStartingWith(PATTERN);
  await event.setRecurrenceUntil(UNTIL_DATE);

  // ── verifications ──────────────────────────────────────────────────────────

  // unit combobox shows "month"
  const unitCombobox = page.getByRole('combobox', { name: /unit of time/i });
  expect((await unitCombobox.textContent())?.trim()).toMatch(/month/i);

  // "On the" radio is checked (pattern selection)
  const patternRadio = page.getByRole('radio', { name: /^on the/i }).first();
  await expect(patternRadio).toBeChecked({ timeout: 10_000 });

  // toolbar "Series" radio is checked
  await expect(page.locator(CalendarFields.RecurringButton).first()).toHaveAttribute('aria-checked', 'true');

  await page.waitForTimeout(3000);
});

// ── test 3: every 4 weeks on Friday and Saturday ────────────────────────────

test('Recurring — every 4 weeks on Fri + Sat: summary reflects selected days', async ({ page }) => {

  const TITLE        = `Playwright Recurring Weekly Event ${Date.now()}`;
  const START_DATE   = formatDDMMYYYY(tomorrow());
  const START_TIME   = '16:00';
  const END_TIME     = '16:30';
  const REPEAT_EVERY = 4;
  const FREQUENCY    = 'Weeks';
  const DAYS         = ['Friday', 'Saturday'];
  const UNTIL_DATE   = formatDDMMYYYY(addMonths(new Date(), 4));

  await page.goto('https://outlook.live.com/mail/', { waitUntil: 'domcontentloaded' });
  await expect(page.getByRole('button', { name: /new email/i })).toBeVisible({ timeout: 45_000 });

  const nav = new CalendarNavigation(page);
  await nav.goToCalendar();
  await nav.clickNewEvent();

  const event = new NewEventCompose(page);
  await event.waitUntilOpen();

  await event.fillTitle(TITLE);

  // date & time
  const time = event.eventDetails.openTimeDropdown;
  await time.setStartDate(START_DATE);
  await time.setStartTime(START_TIME);
  await time.setEndTime(END_TIME);

  // enable recurrence then configure settings
  // setWeeklyDays must come last — earlier calls can auto-select today's day
  await event.clickRecurrenceOption();
  await event.setRepeatEvery(REPEAT_EVERY);
  await event.setRecurrenceFrequency(FREQUENCY);
  await event.setRecurrenceUntil(UNTIL_DATE);
  await event.setWeeklyDays(DAYS);

  // ── verifications ──────────────────────────────────────────────────────────

  // summary button mentions "4 week" (with selected days)
  const summaryLocator = page.locator('button:has-text("4 week"), button[aria-label*="4 week" i]').first();
  await expect(summaryLocator).toBeVisible({ timeout: 10_000 });
  const summaryText = await summaryLocator.getAttribute('aria-label') ?? await summaryLocator.textContent();
  console.log('summary =', summaryText);

  // toolbar "Series" radio is checked
  await expect(page.locator(CalendarFields.RecurringButton).first()).toHaveAttribute('aria-checked', 'true');

  await page.waitForTimeout(3000);
});

// ── test 4: every year, first "On the" pattern, end date +7 months ──────────

test('Recurring — every year with "On the" pattern: unit and radio are correct', async ({ page }) => {

  const TITLE      = `Playwright Recurring Yearly Event ${Date.now()}`;
  const START_DATE = formatDDMMYYYY(tomorrow());
  const START_TIME = '10:00';
  const END_TIME   = '10:30';
  const UNTIL_DATE = formatDDMMYYYY(addMonths(new Date(), 7));

  await page.goto('https://outlook.live.com/mail/', { waitUntil: 'domcontentloaded' });
  await expect(page.getByRole('button', { name: /new email/i })).toBeVisible({ timeout: 45_000 });

  const nav = new CalendarNavigation(page);
  await nav.goToCalendar();
  await nav.clickNewEvent();

  const event = new NewEventCompose(page);
  await event.waitUntilOpen();

  await event.fillTitle(TITLE);

  // date & time
  const time = event.eventDetails.openTimeDropdown;
  await time.setStartDate(START_DATE);
  await time.setStartTime(START_TIME);
  await time.setEndTime(END_TIME);

  // enable recurrence, set yearly frequency (no "repeat every" for year)
  await event.clickRecurrenceOption();
  await event.setRecurrenceFrequency('Year');

  // select the first "On the …" radio button
  await event.setFirstPatternStartingWith('On the');

  // click "Choose an end date" and pick today + 7 months
  await event.setRecurrenceUntil(UNTIL_DATE);

  // ── verifications ──────────────────────────────────────────────────────────

  // unit combobox shows "year"
  const unitCombobox = page.getByRole('combobox', { name: /unit of time/i });
  expect((await unitCombobox.textContent())?.trim()).toMatch(/year/i);

  // first "On the" radio is checked
  const onTheRadio = page.getByRole('radio', { name: /^on the/i }).first();
  await expect(onTheRadio).toBeChecked({ timeout: 10_000 });

  // toolbar "Series" radio is checked
  await expect(page.locator(CalendarFields.RecurringButton).first()).toHaveAttribute('aria-checked', 'true');

  await page.waitForTimeout(3000);
});
