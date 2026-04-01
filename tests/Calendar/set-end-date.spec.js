// tests/Calendar/set-end-date.spec.js
//
// Verifies that setEndDate() updates the end-date combobox (All day events only).

import { test } from '../fixtures.js';
import { futureDateDDMMYYYY } from '../utils/dateHelpers.js';

test.use({ timeout: 120_000 });

test('setEndDate — end date combobox reflects the value that was set', async ({ newEventPage }) => {
  const { page, event } = newEventPage;

  const START_DATE = futureDateDDMMYYYY(1);
  const END_DATE   = futureDateDDMMYYYY(2);

  await event.fillTitle(`EndDate Test ${Date.now()}`);

  const timeDropdown = event.eventDetails.openTimeDropdown;
  await timeDropdown.ensureOpen();
  if (!(await timeDropdown.isAllDayEnabled())) {
    await timeDropdown.toggleAllDay();
    await page.waitForTimeout(500);
  }

  await event.setStartDate(START_DATE);
  await event.setEndDate(END_DATE);

  const [dd] = END_DATE.split('/');
  await event.verifyEndDateContains(dd);

  await event.discard();
});
