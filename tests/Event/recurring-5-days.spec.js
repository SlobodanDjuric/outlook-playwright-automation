import { test, expect } from '@playwright/test';
import { CalendarNavigation } from '../../pages/components/CalendarNavigation.js';
import { NewEventCompose } from '../../pages/outlook/NewEventCompose.js';
import { CalendarFields } from '../../pages/constants/calendarFields.js';

// ── date helpers ────────────────────────────────────────────────────────────

function formatDate(d) {
  const dd = String(d.getDate()).padStart(2, '0');
  const mm = String(d.getMonth() + 1).padStart(2, '0');
  return `${dd}/${mm}/${d.getFullYear()}`;
}

function addMonths(date, months) {
  const d = new Date(date);
  const day = d.getDate();
  d.setMonth(d.getMonth() + months, 1);
  const maxDay = new Date(d.getFullYear(), d.getMonth() + 1, 0).getDate();
  d.setDate(Math.min(day, maxDay));
  return d;
}

function tomorrow() {
  const d = new Date();
  d.setDate(d.getDate() + 1);
  return d;
}


// ── test 1: every 5 days ────────────────────────────────────────────────────

test('set recurring event - every 5 days', async ({ page }) => {
  test.setTimeout(120_000);

  const TITLE        = `Playwright Recurring 5-Day Event ${Date.now()}`;
  const START_DATE   = formatDate(tomorrow());
  const START_TIME   = '09:00';
  const END_TIME     = '09:30';
  const UNTIL_DATE   = formatDate(addMonths(new Date(), 4));
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

test('set recurring event - every 1 month on the second Thursday', async ({ page }) => {
  test.setTimeout(120_000);

  const TITLE_M       = `Playwright Recurring Monthly Event ${Date.now()}`;
  const START_DATE_M  = formatDate(tomorrow());
  const START_TIME_M  = '20:00';
  const END_TIME_M    = '20:30';
  const REPEAT_EVERY_M = 1;
  const FREQUENCY_M   = 'Month';
  const PATTERN_M     = 'On the';
  const UNTIL_DATE_M  = formatDate(addMonths(new Date(), 4));

  await page.goto('https://outlook.live.com/mail/', { waitUntil: 'domcontentloaded' });
  await expect(page.getByRole('button', { name: /new email/i })).toBeVisible({ timeout: 45_000 });

  const nav = new CalendarNavigation(page);
  await nav.goToCalendar();
  await nav.clickNewEvent();

  const event = new NewEventCompose(page);
  await event.waitUntilOpen();

  await event.fillTitle(TITLE_M);

  // date & time
  const time = event.eventDetails.openTimeDropdown;
  await time.setStartDate(START_DATE_M);
  await time.setStartTime(START_TIME_M);
  await time.setEndTime(END_TIME_M);

  // enable recurrence once, then configure settings directly on event
  await event.clickRecurrenceOption();
  await event.setRepeatEvery(REPEAT_EVERY_M);
  await event.setRecurrenceFrequency(FREQUENCY_M);
  await event.setFirstPatternStartingWith(PATTERN_M);
  await event.setRecurrenceUntil(UNTIL_DATE_M);

  // ── verifications ──────────────────────────────────────────────────────────

  // unit combobox shows "month"
  const unitCombobox = page.getByRole('combobox', { name: /unit of time/i });
  expect((await unitCombobox.textContent())?.trim()).toMatch(/month/i);

  // first "On the" radio is checked
  const patternRadio = page.getByRole('radio', { name: /^on the/i }).first();
  await expect(patternRadio).toBeChecked({ timeout: 10_000 });

  // toolbar "Series" radio is checked
  await expect(page.locator(CalendarFields.RecurringButton).first()).toHaveAttribute('aria-checked', 'true');

  await page.waitForTimeout(3000);
});

// ── test 3: every 4 weeks on Friday and Saturday ────────────────────────────

test('set recurring event - every 4 weeks on Friday and Saturday', async ({ page }) => {
  test.setTimeout(120_000);

  const TITLE_W        = `Playwright Recurring Weekly Event ${Date.now()}`;
  const START_DATE_W   = formatDate(tomorrow());
  const START_TIME_W   = '16:00';
  const END_TIME_W     = '16:30';
  const REPEAT_EVERY_W = 4;
  const FREQUENCY_W    = 'Weeks';
  const DAYS_W         = ['Friday', 'Saturday'];
  const UNTIL_DATE_W   = formatDate(addMonths(new Date(), 4));

  await page.goto('https://outlook.live.com/mail/', { waitUntil: 'domcontentloaded' });
  await expect(page.getByRole('button', { name: /new email/i })).toBeVisible({ timeout: 45_000 });

  const nav = new CalendarNavigation(page);
  await nav.goToCalendar();
  await nav.clickNewEvent();

  const event = new NewEventCompose(page);
  await event.waitUntilOpen();

  await event.fillTitle(TITLE_W);

  // date & time
  const time = event.eventDetails.openTimeDropdown;
  await time.setStartDate(START_DATE_W);
  await time.setStartTime(START_TIME_W);
  await time.setEndTime(END_TIME_W);

  // enable recurrence then configure settings
  // setWeeklyDays must come last — earlier calls can auto-select today's day
  await event.clickRecurrenceOption();
  await event.setRepeatEvery(REPEAT_EVERY_W);
  await event.setRecurrenceFrequency(FREQUENCY_W);
  await event.setRecurrenceUntil(UNTIL_DATE_W);
  await event.setWeeklyDays(DAYS_W);

  // ── verifications ──────────────────────────────────────────────────────────

  // summary button mentions "4 week"
  const summaryLocator = page.locator('button:has-text("4 week"), button[aria-label*="4 week" i]').first();
  await expect(summaryLocator).toBeVisible({ timeout: 10_000 });
  const summaryText = await summaryLocator.getAttribute('aria-label') ?? await summaryLocator.textContent();
  console.log('summary =', summaryText);

  // toolbar "Series" radio is checked
  await expect(page.locator(CalendarFields.RecurringButton).first()).toHaveAttribute('aria-checked', 'true');

  await page.waitForTimeout(3000);
});

// ── test 4: every year, first "On the" pattern, end date +7 months ──────────

test('set recurring event - every year with On the pattern', async ({ page }) => {
  test.setTimeout(120_000);

  const TITLE_Y      = `Playwright Recurring Yearly Event ${Date.now()}`;
  const START_DATE_Y = formatDate(tomorrow());
  const START_TIME_Y = '10:00';
  const END_TIME_Y   = '10:30';
  const UNTIL_DATE_Y = formatDate(addMonths(new Date(), 7));

  await page.goto('https://outlook.live.com/mail/', { waitUntil: 'domcontentloaded' });
  await expect(page.getByRole('button', { name: /new email/i })).toBeVisible({ timeout: 45_000 });

  const nav = new CalendarNavigation(page);
  await nav.goToCalendar();
  await nav.clickNewEvent();

  const event = new NewEventCompose(page);
  await event.waitUntilOpen();

  await event.fillTitle(TITLE_Y);

  // date & time
  const time = event.eventDetails.openTimeDropdown;
  await time.setStartDate(START_DATE_Y);
  await time.setStartTime(START_TIME_Y);
  await time.setEndTime(END_TIME_Y);

  // enable recurrence, set yearly frequency (no "repeat every" for year)
  await event.clickRecurrenceOption();
  await event.setRecurrenceFrequency('Year');

  // select the first "On the …" radio button
  await event.setFirstPatternStartingWith('On the');

  // click "Choose an end date" and pick today + 7 months
  await event.setRecurrenceUntil(UNTIL_DATE_Y);

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
