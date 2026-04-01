// tests/Calendar/open-existing-event.spec.js
//
// Verifies CalendarEventActions.openByTitle():
//   1. Create a new event and save it.
//   2. Find it on the calendar grid by title.
//   3. Open it via the mini-popup "View event" button.
//   4. Confirm the compose form contains the correct title.
//   5. Delete and clean up.

import { test } from '../fixtures.js';
import { NewEventCompose } from '../../pages/page-objects/NewEventCompose.js';
import { futureDateDDMMYYYY } from '../utils/dateHelpers.js';

test.use({ timeout: 180_000 });

test('openByTitle — opens the compose form for an existing event', async ({ calendarPage }) => {
  const { page, nav, calendarEventActions } = calendarPage;

  const TITLE = `OpenTest ${Date.now()}`;
  const START_DATE = futureDateDDMMYYYY(1);

  // ── Create event ──────────────────────────────────────────────────────────
  await nav.clickNewEvent();
  const event = new NewEventCompose(page);
  await event.waitUntilOpen();

  await event.fillTitle(TITLE);
  await event.setStartDate(START_DATE);
  await event.setStartTime('11:00');
  await event.setEndTime('12:00');
  await event.eventDetails.openTimeDropdown.close();
  await event.save();

  // Switch to Day view and navigate to tomorrow so the event is visible
  await nav.switchToView('Day');
  await nav.goToNextDay();

  // ── Open the event ────────────────────────────────────────────────────────
  await calendarEventActions.openByTitle(TITLE);
  await event.verifyTitle(TITLE);

  // ── Clean up ──────────────────────────────────────────────────────────────
  await event.delete();
});
