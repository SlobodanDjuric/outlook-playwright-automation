// tests/Event/optional-attendees.spec.js
import { test, expect } from '../fixtures.js';
import { futureDateDDMMYYYY } from '../utils/dateHelpers.js';

// All tests in this file navigate to Outlook Calendar and need extra time.
test.use({ timeout: 180_000 });

/**
 * Optional attendees test.
 *
 * Flow:
 * 1. Open New event compose.
 * 2. Add a required attendee.
 * 3. Open "Response options" to reveal the optional attendees field.
 * 4. Add an optional attendee.
 * 5. Verify both attendees appear in the compose form.
 *
 * Implementation notes:
 * - Optional attendees require first opening the Response Options menu and
 *   clicking "Add optional attendees" to reveal the optional input field.
 * - The API for this is:
 *     event.eventDetails.openResponseOptions.setResponseOption.addOptionalAttendees()
 *   followed by event.eventDetails.addOptionalAttendee(email).
 */
test('Optional attendees — required and optional attendees both appear in compose', async ({ newEventPage }) => {
  const { page, event } = newEventPage;

  const TITLE = `Optional Attendee Test ${Date.now()}`;
  const REQUIRED = 'required@example.com';
  const OPTIONAL = 'optional@example.com';

  // ── Step 1: fill title and date ───────────────────────────────────────────
  await event.eventDetails.fillTitle(TITLE);
  await event.eventDetails.openTimeDropdown.setStartDate(futureDateDDMMYYYY(3));
  await event.eventDetails.openTimeDropdown.setStartTime('11:00');
  await event.eventDetails.openTimeDropdown.setEndTime('12:00');
  await event.eventDetails.openTimeDropdown.close();

  // ── Step 2: add required attendee ────────────────────────────────────────
  await event.eventDetails.addRequiredAttendee(REQUIRED);

  // ── Step 3: open response options and reveal optional attendees field ──────
  // openResponseOptions returns a helper with addOptionalAttendees() method.
  await event.eventDetails.openResponseOptions.setResponseOption.addOptionalAttendees();

  // ── Step 4: add optional attendee ────────────────────────────────────────
  await event.eventDetails.addOptionalAttendee(OPTIONAL);

  // ── Step 5: verify both attendees are visible in the compose form ─────────
  await expect(page.getByText(REQUIRED).first()).toBeVisible({ timeout: 15_000 });
  await expect(page.getByText(OPTIONAL).first()).toBeVisible({ timeout: 15_000 });
});
