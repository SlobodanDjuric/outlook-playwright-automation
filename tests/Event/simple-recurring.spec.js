// tests/Event/simple-recurring.spec.js
// Smoke test: verifies that clicking the Recurring button in the time dropdown
// sets a 3-week repeat interval, updates the summary label, and marks the
// toolbar "Series" radio as checked.

import { test, expect } from '@playwright/test';
import { CalendarNavigation } from '../../pages/components/CalendarNavigation.js';
import { NewEventCompose } from '../../pages/page-objects/NewEventCompose.js';
import { CalendarFields } from '../../pages/selectors/calendarFields.js';

test.use({ timeout: 90_000 });

test('Recurring — set 3-week interval and verify summary + toolbar state', async ({ page }) => {

  await page.goto('https://outlook.live.com/mail/', { waitUntil: 'domcontentloaded' });
  await expect(page.getByRole('button', { name: /new email/i })).toBeVisible({ timeout: 45_000 });

  const nav = new CalendarNavigation(page);
  await nav.goToCalendar();
  await nav.clickNewEvent();

  const event = new NewEventCompose(page);
  await event.waitUntilOpen();

  // open the time/date dropdown and hit the Recurring button inside
  const time = event.eventDetails.openTimeDropdown;
  await time.ensureOpen();
  // using the new MakeRecurring class directly to manage recurrence options
  const recurHelper = await event.makeRecurring.clickRecurrenceOption();

  // set the repeat interval to 3 weeks — this must succeed
  await time.ensureOpen();
  await recurHelper.setRepeatEvery(3);

  // verify: "Interval" combobox must show 3
  const repeatInput = page.locator(CalendarFields.RepeatEveryInput);
  await expect(repeatInput).toBeVisible({ timeout: 10_000 });
  const val = await repeatInput.textContent();
  console.log('interval combobox value =', val?.trim());
  expect(val?.trim()).toMatch(/^3/);

  // verify: recurrence summary must mention "3 weeks"
  const summaryLocator = page.locator('button:has-text("3 week"), button[aria-label*="3 week" i]').first();
  await expect(summaryLocator).toBeVisible({ timeout: 10_000 });
  const summaryText = await summaryLocator.getAttribute('aria-label') ?? await summaryLocator.textContent();
  console.log('summary text =', summaryText);

  // ensure the toolbar's Recurring/Series button reflects the toggle
  const toolbarBtn = page.locator(CalendarFields.RecurringButton).first();
  await expect(toolbarBtn).toHaveAttribute('aria-checked', 'true');

  // wait a little so any UI animation is visible
  await page.waitForTimeout(5000);
});
