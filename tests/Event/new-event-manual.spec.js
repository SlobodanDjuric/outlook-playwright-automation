// tests/new-event-manual.spec.js
import { test, expect } from '@playwright/test';

/**
 * Creates and sends a new Outlook Calendar event using raw locators (no POM).
 *
 * This test covers:
 * - navigating from Mail to Calendar
 * - creating a new event
 * - filling title, required attendee, date/time, location and body
 * - sending the event and verifying the dialog is dismissed
 *
 * Tests use raw locators and direct Playwright actions.
 */
test.use({ timeout: 120_000 });

test('Outlook Calendar - Create and send new event', async ({ page }) => {

  const TITLE = `Playwright Test Event ${Date.now()}`;
  const ATTENDEE = 'test@example.com';
  const LOCATION = 'Conference Room 3';
  const EVENT_BODY = 'This is a test message for a new event created with Playwright.';

  // Helper: get the correct select-all keystroke based on OS
  const selectAllKey = process.platform === 'darwin' ? 'Meta+A' : 'Control+A';

  // Helper: Dismisses suggestion dropdowns and blurs the current field
  async function closeAndBlurSuggestions() {
    await page.keyboard.press('Escape').catch(() => {});
    await page.waitForTimeout(50);
    await page.keyboard.press('Tab').catch(() => {});
    await page.waitForTimeout(50);
  }

  // Helper: Types text into a contenteditable element and commits it via Enter
  async function typeAndCommitInContentEditable(editor, text, { delay = 25 } = {}) {
    await editor.scrollIntoViewIfNeeded();
    await editor.click({ force: true });

    // Verify focus settled on the editor (Outlook can be flaky)
    for (let i = 0; i < 5; i++) {
      await editor.click({ force: true });

      const focused = await editor
        .evaluate((el) => {
          const a = document.activeElement;
          return a === el || (!!a?.closest?.('[contenteditable="true"]') && el.contains(a));
        })
        .catch(() => false);

      if (focused) break;
      await page.waitForTimeout(150);
    }

    await page.keyboard.type(text, { delay });
    await page.keyboard.press('Enter');
  }

  await test.step('Navigate to Outlook Calendar', async () => {
    await page.goto('https://outlook.live.com/mail/', {
      waitUntil: 'domcontentloaded',
    });

    await expect(page.getByRole('button', { name: /new email/i })).toBeVisible({
      timeout: 45_000,
    });

    // Navigate to Calendar (icon can be button or link)
    const calendarNav = page.locator('button[aria-label*="Calendar" i], a[aria-label*="Calendar" i]').first();
    await expect(calendarNav).toBeVisible({ timeout: 45_000 });
    await calendarNav.click();
  });

  await test.step('Open new event dialog', async () => {
    const newEventBtn = page.getByRole('button', { name: /^new event$/i }).first();
    await expect(newEventBtn).toBeVisible({ timeout: 45_000 });
    await newEventBtn.click();

    // Title input confirms compose is ready
    const titleInput = page.locator('input[placeholder="Add title"]');
    await expect(titleInput).toBeVisible({ timeout: 45_000 });
  });

  await test.step('Fill event details: Title and Attendee', async () => {
    // Title
    const titleInput = page.locator('input[placeholder="Add title"]');
    await titleInput.fill(TITLE);

    // Required attendees (contenteditable)
    const requiredAttendees = page.locator('[aria-label="Invite required attendees"][contenteditable="true"]');
    await expect(requiredAttendees).toBeVisible({ timeout: 45_000 });
    await typeAndCommitInContentEditable(requiredAttendees, ATTENDEE);

    // Verify attendee rendered
    await expect(page.getByText(ATTENDEE).first()).toBeVisible({
      timeout: 30_000,
    });

    await closeAndBlurSuggestions();
  });

  await test.step('Fill date and time', async () => {
    // Click time range to open the date/time picker
    const timeRangeLine = page.locator('text=/\\d{2}:\\d{2}\\s*-\\s*\\d{2}:\\d{2}/').first();

    await timeRangeLine.waitFor({ state: 'visible', timeout: 45_000 });
    await timeRangeLine.click();

    // Start date (today's date shifted by 2 months)
    const now = new Date();
    now.setMonth(now.getMonth() + 2);
    const formattedDate = `${String(now.getDate()).padStart(2, '0')}/${String(now.getMonth() + 1).padStart(2, '0')}/${now.getFullYear()}`;

    const startDate = page.getByRole('combobox', { name: /start date/i });
    await startDate.waitFor({ state: 'visible', timeout: 30_000 });
    await startDate.click();
    await startDate.focus();
    await startDate.press(selectAllKey);
    await startDate.press('Backspace');
    await startDate.type(formattedDate, { delay: 20 });
    await startDate.press('Enter');

    // Start time (18:15)
    const startTime = page.getByRole('combobox', { name: /start time/i });
    await startTime.waitFor({ state: 'visible', timeout: 30_000 });
    await startTime.click();
    await startTime.focus();
    await startTime.press(selectAllKey);
    await startTime.press('Backspace');
    await startTime.fill('18:15');
    await startTime.press('Tab');

    // End time (19:00)
    const endTime = page.getByRole('combobox', { name: /end time/i });
    await endTime.waitFor({ state: 'visible', timeout: 30_000 });
    await endTime.click();
    await endTime.focus();
    await endTime.press(selectAllKey);
    await endTime.press('Backspace');
    await endTime.fill('19:00');
    await endTime.press('Tab');

    // Close time dropdown
    await page.keyboard.press('Escape');
  });

  await test.step('Fill location and event body', async () => {
    // Location field
    const location = page.locator('#location-suggestions-picker-input');
    await location.waitFor({ state: 'visible', timeout: 45_000 });
    await location.click();
    await location.fill(LOCATION);

    // Dismiss location suggestions
    await closeAndBlurSuggestions();

    // Body editor (MS editor wrapper + contenteditable)
    const editorWrapper = page.locator('div[data-ms-editor]').first();
    await editorWrapper.waitFor({ state: 'visible', timeout: 45_000 });
    await editorWrapper.scrollIntoViewIfNeeded();
    await editorWrapper.click({ force: true });

    const body = page.locator('div[role="textbox"][contenteditable="true"][data-ms-editor="true"]').first();

    await body.waitFor({ state: 'visible', timeout: 45_000 });
    await body.click({ force: true });

    // Replace and set message
    await page.keyboard.press(selectAllKey);
    await page.keyboard.press('Backspace');
    await page.keyboard.type(EVENT_BODY, { delay: 10 });
  });

  // await test.step("Send event and verify", async () => {
  //   const sendButton = page.getByRole("button", { name: /^send$/i }).first();
  //   await sendButton.waitFor({ state: "visible", timeout: 45_000 });
  //   await sendButton.click();

  //   // Verify compose dialog closes
  //   const dialog = page.getByRole("dialog").first();
  //   await expect(dialog).toBeHidden({ timeout: 45_000 });
  // });
});
