// tests/Constants/recurrence-frequency.spec.js
//
// Verifies that every value in RecurrenceFrequency appears in the
// "Unit of time" combobox inside the New Event recurrence editor.

import { test } from '../fixtures.js';
import { RecurrenceFrequency } from '../../pages/constants/calendarOptions.js';

test.use({ timeout: 120_000 });

test('RecurrenceFrequency constants — all frequency options appear in the recurrence dialog', async ({ newEventPage }) => {
  const { page, event } = newEventPage;

  const recurrence = await event.makeRecurring.clickRecurrenceOption();
  await page.waitForTimeout(500);

  await recurrence.openFrequencyDropdown();

  for (const label of Object.values(RecurrenceFrequency)) {
    await recurrence.verifyFrequencyOptionVisible(label);
  }

  await page.keyboard.press('Escape');
});
