// tests/Event/delete-event.spec.js
import { test, expect } from '../fixtures.js';
import { NewEventCompose } from '../../pages/page-objects/NewEventCompose.js';
import { futureDateDDMMYYYY } from '../utils/dateHelpers.js';

// All tests in this file navigate to Outlook Calendar and need extra time.
test.use({ timeout: 180_000 });

/**
 * Delete calendar event test.
 *
 * Flow:
 * 1. Create a new event with a unique title and save it explicitly.
 * 2. Find the event on the calendar grid.
 * 3. Click the event → mini-popup appears.
 * 4. Click "Delete" in the mini-popup.
 * 5. Confirm the event no longer appears on the calendar.
 *
 * Implementation notes:
 * - We use the same "explicit Save button" approach as edit-event.spec.js
 *   because event.save() gates on role="dialog".
 * - After deletion, we wait briefly and then assert the event button is gone.
 */
test('Delete event — event disappears from calendar after deletion', async ({ calendarPage }) => {
  const { page, nav } = calendarPage;

  const TITLE = `Delete Test ${Date.now()}`;

  // ── Step 1: create the event ─────────────────────────────────────────────
  await nav.clickNewEvent();

  const event = new NewEventCompose(page);
  await event.waitUntilOpen();

  await event.eventDetails.fillTitle(TITLE);
  await event.eventDetails.openTimeDropdown.setStartDate(futureDateDDMMYYYY(1));
  await event.eventDetails.openTimeDropdown.setStartTime('14:00');
  await event.eventDetails.openTimeDropdown.setEndTime('15:00');
  await event.eventDetails.openTimeDropdown.close();

  // Save directly via toolbar button (bypasses role="dialog" guard in event.save()).
  const saveBtn = page.getByRole('button', { name: /^save$/i }).first();
  await expect(saveBtn).toBeVisible({ timeout: 15_000 });
  await saveBtn.click();
  await expect(page.getByPlaceholder('Add title')).toBeHidden({ timeout: 45_000 });
  await page.waitForTimeout(1_000);

  // Navigate to the day containing the event if needed.
  const nextDayBtn = page.getByRole('button', { name: /go to next day/i }).first();
  if (await nextDayBtn.isVisible({ timeout: 3_000 }).catch(() => false)) {
    await nextDayBtn.click();
    await page.waitForTimeout(800);
  }

  // ── Step 2: find the event on the calendar grid ───────────────────────────
  const escapedTitle = TITLE.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
  const eventBtn = page
    .getByRole('button', { name: new RegExp(escapedTitle, 'i') })
    .first();
  await expect(eventBtn).toBeVisible({ timeout: 30_000 });

  // ── Step 3: click event → mini-popup → "View event" ─────────────────────
  // In Outlook Work week view, a direct click may open inline editing rather
  // than the mini-popup.  Click the event button to trigger the popup, then
  // immediately click "View event" to open the full compose form.
  await eventBtn.click();

  const viewEventBtn = page.getByRole('button', { name: /view event/i }).first();
  await expect(viewEventBtn).toBeVisible({ timeout: 15_000 });
  await viewEventBtn.click();

  // Wait for the event compose form to open.
  const editCompose = new NewEventCompose(page);
  await editCompose.waitUntilOpen();

  // ── Step 4: click "Delete" in the compose toolbar ────────────────────────
  // The compose toolbar has a Delete button (trash icon) that removes the event.
  const deleteBtn = page
    .getByRole('button', { name: /^delete$/i })
    .first();
  await expect(deleteBtn).toBeVisible({ timeout: 15_000 });
  await deleteBtn.click();

  // Handle possible confirmation dialog ("Delete event?" → "Delete" / "Cancel").
  await page.waitForTimeout(800);
  const confirmDelete = page.getByRole('button', { name: /^delete$/i }).first();
  if (await confirmDelete.isVisible({ timeout: 3_000 }).catch(() => false)) {
    await confirmDelete.click();
  }

  // ── Step 5: verify event is gone ─────────────────────────────────────────
  await page.waitForTimeout(1_500);
  await expect(
    page.getByRole('button', { name: new RegExp(escapedTitle, 'i') }).first()
  ).toBeHidden({ timeout: 15_000 });
});
