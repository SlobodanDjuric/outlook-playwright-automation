// tests/Event/edit-event.spec.js
import { test, expect } from '../fixtures.js';
import { NewEventCompose } from '../../pages/page-objects/NewEventCompose.js';
import { futureDateDDMMYYYY } from '../utils/dateHelpers.js';

// All tests in this file navigate to Outlook Calendar and need extra time.
test.use({ timeout: 180_000 });

/**
 * Edit existing calendar event test.
 *
 * Flow:
 * 1. Navigate to Calendar and click "New event".
 * 2. Fill title / date / time and explicitly save via the Save button.
 * 3. Wait until the compose form is dismissed.
 * 4. Find the event on the calendar grid.
 *    - Outlook renders events as buttons whose accessible name includes the title.
 * 5. Click the event → mini-popup shows "View event".
 * 6. Click "View event" → Outlook opens the event directly in edit compose form.
 * 7. Modify the title and save.
 * 8. Verify the updated title appears on the calendar.
 *
 * Implementation notes:
 * - event.save() guards behind role="dialog" which may not match the inline
 *   compose panel; we save directly via the toolbar Save button instead.
 * - Calendar event buttons expose the title in their accessible name, so
 *   getByRole('button', { name: /title/ }) is the correct locator.
 */

test('Edit existing event — title update persists on calendar', async ({ calendarPage }) => {
  const { page, nav } = calendarPage;

  const ORIGINAL_TITLE = `Edit Test ${Date.now()}`;
  const UPDATED_TITLE = `${ORIGINAL_TITLE} [edited]`;
  const START_DATE = futureDateDDMMYYYY(1);
  const START_TIME = '10:00';
  const END_TIME = '11:00';

  // ── Step 1: open New event compose ───────────────────────────────────────
  await nav.clickNewEvent();

  const event = new NewEventCompose(page);
  await event.waitUntilOpen();

  // ── Step 2: fill event details ────────────────────────────────────────────
  await event.eventDetails.fillTitle(ORIGINAL_TITLE);
  await event.eventDetails.openTimeDropdown.setStartDate(START_DATE);
  await event.eventDetails.openTimeDropdown.setStartTime(START_TIME);
  await event.eventDetails.openTimeDropdown.setEndTime(END_TIME);
  await event.eventDetails.openTimeDropdown.close();

  // ── Step 3: save via the toolbar Save button ──────────────────────────────
  // We bypass event.save() because it gates on role="dialog" which may not
  // match Outlook's inline compose panel, causing a silent early return.
  const saveBtn = page.getByRole('button', { name: /^save$/i }).first();
  await expect(saveBtn).toBeVisible({ timeout: 15_000 });
  await saveBtn.click();

  // Wait until the compose form is dismissed (title input gone = form closed).
  await expect(page.getByPlaceholder('Add title')).toBeHidden({ timeout: 45_000 });

  // Short pause for the calendar grid to re-render.
  await page.waitForTimeout(1_500);

  // Navigate to the day containing the event (calendar may still show today).
  // Click "Go to next day" if the event is tomorrow.
  const nextDayBtn = page.getByRole('button', { name: /go to next day/i }).first();
  if (await nextDayBtn.isVisible({ timeout: 3_000 }).catch(() => false)) {
    await nextDayBtn.click();
    await page.waitForTimeout(800);
  }

  // ── Step 4: find the event on the calendar grid ───────────────────────────
  // Outlook calendar events are buttons with accessible names that include
  // the event title, e.g.: "Edit Test 123, 10:00 to 11:00, Tuesday, …, Busy"
  const eventBtn = page
    .getByRole('button', { name: new RegExp(ORIGINAL_TITLE.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'), 'i') })
    .first();

  await expect(eventBtn).toBeVisible({ timeout: 30_000 });

  // ── Step 5: click event → mini popup ─────────────────────────────────────
  await eventBtn.click();

  // ── Step 6: click "View event" → opens the edit compose form directly ─────
  // In Outlook Web, "View event" opens the full inline compose form for editing
  // (no separate read-only view + Edit button — we're already in edit mode).
  const viewEventBtn = page.getByRole('button', { name: /view event/i }).first();
  await expect(viewEventBtn).toBeVisible({ timeout: 15_000 });
  await viewEventBtn.click();

  // ── Step 7: wait for the edit compose form ───────────────────────────────
  const editCompose = new NewEventCompose(page);
  await editCompose.waitUntilOpen();

  const titleInput = editCompose.eventDetails.titleInput;
  await expect(titleInput).toBeVisible({ timeout: 15_000 });
  await titleInput.fill(UPDATED_TITLE);

  // Save: try toolbar Save button first, then fall back to event.save().
  const editSaveBtn = page.getByRole('button', { name: /^save$/i }).first();
  if (await editSaveBtn.isVisible({ timeout: 3_000 }).catch(() => false)) {
    await editSaveBtn.click();
    await expect(page.getByPlaceholder('Add title')).toBeHidden({ timeout: 45_000 });
  } else {
    await editCompose.save();
    await page.waitForTimeout(2_000);
  }

  // ── Step 9: verify updated title on calendar ──────────────────────────────
  const updatedBtn = page
    .getByRole('button', { name: new RegExp(UPDATED_TITLE.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'), 'i') })
    .first();

  await expect(updatedBtn).toBeVisible({ timeout: 20_000 });
});
