// tests/Constants/calendar-views.spec.js
//
// Verifies that every value in CalendarViews appears as a button in the
// calendar toolbar view switcher.

import { test } from '../fixtures.js';
import { CalendarView } from '../../pages/constants/calendarOptions.js';

test.use({ timeout: 90_000 });

test('CalendarViews constants — all view names appear in the calendar toolbar', async ({ calendarPage }) => {
  const { nav } = calendarPage;

  for (const viewName of Object.values(CalendarView)) {
    await nav.verifyViewButtonVisible(viewName);
  }
});
