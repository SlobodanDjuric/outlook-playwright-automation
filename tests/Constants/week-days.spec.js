// tests/Constants/week-days.spec.js
//
// Verifies that every value in WeekDays appears as an option inside the
// "Days of the week" listbox in the weekly recurrence editor.

import { test } from '../fixtures.js';
import { RecurrenceFrequency, WeekDays } from '../../pages/constants/calendarOptions.js';

test.use({ timeout: 120_000 });

test('WeekDays constants — all day labels appear in the weekly recurrence editor', async ({ newEventPage }) => {
  const { page, event } = newEventPage;

  // Open recurrence editor
  const recurrence = await event.makeRecurring.clickRecurrenceOption();
  await page.waitForTimeout(500);

  // Set frequency to Weekly so the "Days of the week" listbox appears
  await recurrence.setRecurrenceFrequency(RecurrenceFrequency.Weekly);
  await page.waitForTimeout(500);

  for (const dayLabel of Object.values(WeekDays)) {
    await recurrence.verifyWeekDayVisible(dayLabel);
  }
});
