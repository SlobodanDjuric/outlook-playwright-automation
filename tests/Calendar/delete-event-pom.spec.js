// tests/Calendar/delete-event-pom.spec.js
//
// Verifies CalendarEventActions.deleteByTitle():
//   1. Create a new event and save it.
//   2. Delete it via the POM method.
//   3. Assert it no longer appears on the calendar grid.

import { test, expect } from '../fixtures.js';
import { NewEventCompose } from '../../pages/page-objects/NewEventCompose.js';
import { futureDateDDMMYYYY } from '../utils/dateHelpers.js';

test.use({ timeout: 180_000 });

test('deleteByTitle — event disappears from calendar after POM delete', async ({ calendarPage }) => {
  const { page, nav, calendarEventActions } = calendarPage;

  const TITLE = `DeletePOM ${Date.now()}`;
  const START_DATE = futureDateDDMMYYYY(1);

  // ── Create event ──────────────────────────────────────────────────────────
  await nav.clickNewEvent();
  const event = new NewEventCompose(page);
  await event.waitUntilOpen();

  await event.fillTitle(TITLE);
  await event.setStartDate(START_DATE);
  await event.setStartTime('15:00');
  await event.setEndTime('16:00');
  await event.eventDetails.openTimeDropdown.close();
  await event.save();

  // Switch to Day view and navigate to tomorrow so the event is visible
  await nav.switchToView('Day');
  await nav.goToNextDay();

  expect(await calendarEventActions.isVisible(TITLE)).toBe(true);

  // ── Delete via POM ────────────────────────────────────────────────────────
  await calendarEventActions.deleteByTitle(TITLE);

  // ── Verify it's gone ──────────────────────────────────────────────────────
  await page.waitForTimeout(1_000);
  expect(await calendarEventActions.isVisible(TITLE)).toBe(false);
});
