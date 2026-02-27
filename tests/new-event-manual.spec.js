// tests/open-new-event.spec.js
import { test, expect } from "@playwright/test";

/**
 * Creates and sends a new Outlook Calendar event using raw locators (no POM).
 *
 * This test covers:
 * - navigating from Mail to Calendar
 * - creating a new event
 * - filling title, required attendee, date/time, location and body
 * - sending the event and verifying the dialog is dismissed
 */
test("Outlook Calendar - New event: fill Title + required attendee", async ({
  page,
}) => {
  test.setTimeout(120_000);

  const TITLE = `Playwright Test Event ${Date.now()}`;
  const ATTENDEE = "test@example.com";

  /**
   * Dismisses suggestion popups and blurs the current field.
   * Useful after recipients/location where dropdown suggestions may remain open.
   */
  async function blurAndCloseSuggestions() {
    await page.keyboard.press("Escape").catch(() => {});
    await page.waitForTimeout(50);
    await page.keyboard.press("Tab").catch(() => {});
    await page.waitForTimeout(50);
  }

  /**
   * Types text into a contenteditable element and commits it via Enter.
   * Includes a focus guard because Outlook can be flaky when activating editors.
   */
  async function typeAndCommitInContentEditable(
    editor,
    text,
    { delay = 25 } = {}
  ) {
    await editor.scrollIntoViewIfNeeded();
    await editor.click({ force: true });

    for (let i = 0; i < 5; i++) {
      await editor.click({ force: true });

      const focused = await editor
        .evaluate((el) => {
          const a = document.activeElement;
          return (
            a === el ||
            (!!a?.closest?.('[contenteditable="true"]') && el.contains(a))
          );
        })
        .catch(() => false);

      if (focused) break;
      await page.waitForTimeout(150);
    }

    await page.keyboard.type(text, { delay });
    await page.keyboard.press("Enter");
  }

  await page.goto("https://outlook.live.com/mail/", {
    waitUntil: "domcontentloaded",
  });

  await expect(page.getByRole("button", { name: /new email/i })).toBeVisible({
    timeout: 45_000,
  });

  // Navigate to Calendar (icon can be a button or a link depending on layout)
  const calendarNav = page
    .locator('button[aria-label*="Calendar" i], a[aria-label*="Calendar" i]')
    .first();
  await expect(calendarNav).toBeVisible({ timeout: 45_000 });
  await calendarNav.click();

  // Open "New event"
  const newEventBtn = page
    .getByRole("button", { name: /^new event$/i })
    .first();
  await expect(newEventBtn).toBeVisible({ timeout: 45_000 });
  await newEventBtn.click();

  // Title input is used as a stable "compose is ready" anchor
  const titleInput = page.locator('input[placeholder="Add title"]');
  await expect(titleInput).toBeVisible({ timeout: 45_000 });
  await titleInput.fill(TITLE);

  // Required attendees uses a contenteditable editor
  const requiredAttendees = page.locator(
    '[aria-label="Invite required attendees"][contenteditable="true"]'
  );
  await expect(requiredAttendees).toBeVisible({ timeout: 45_000 });
  await typeAndCommitInContentEditable(requiredAttendees, ATTENDEE);

  // Validate attendee is rendered (chip/text)
  await expect(page.getByText(ATTENDEE).first()).toBeVisible({
    timeout: 30_000,
  });

  await blurAndCloseSuggestions();

  // Open date/time dropdown by clicking the time range line (e.g. "18:15 - 19:00")
  const timeRangeLine = page
    .locator("text=/\\d{2}:\\d{2}\\s*-\\s*\\d{2}:\\d{2}/")
    .first();

  await timeRangeLine.waitFor({ state: "visible", timeout: 45_000 });
  await timeRangeLine.click();

  // Start date (dd/mm/yyyy)
  const startDate = page.getByRole("combobox", { name: /start date/i });
  await startDate.waitFor({ state: "visible", timeout: 30_000 });
  await startDate.click();
  await startDate.focus();
  await startDate.press(process.platform === "darwin" ? "Meta+A" : "Control+A");
  await startDate.press("Backspace");
  await startDate.type("26/03/2026", { delay: 20 });
  await startDate.press("Enter");

  // Start time (HH:MM)
  const startTime = page.getByRole("combobox", { name: /start time/i });
  await startTime.waitFor({ state: "visible", timeout: 30_000 });
  await startTime.click();
  await startTime.focus();
  await startTime.press(process.platform === "darwin" ? "Meta+A" : "Control+A");
  await startTime.press("Backspace");
  await startTime.fill("18:15");
  await startTime.press("Tab"); // commit

  // End time (HH:MM)
  const endTime = page.getByRole("combobox", { name: /end time/i });
  await endTime.waitFor({ state: "visible", timeout: 30_000 });
  await endTime.click();
  await endTime.focus();
  await endTime.press(process.platform === "darwin" ? "Meta+A" : "Control+A");
  await endTime.press("Backspace");
  await endTime.fill("19:00");
  await endTime.press("Tab"); // commit

  // Close time dropdown (Tab does not close it reliably)
  await page.keyboard.press("Escape");

  // Location field (free text, do not select from suggestions)
  const location = page.locator("#location-suggestions-picker-input");
  await location.waitFor({ state: "visible", timeout: 45_000 });
  await location.click();
  await location.fill("Conference 3");

  // Dismiss suggestions and blur/commit the field
  await page.keyboard.press("Escape");
  await location.press("Tab");

  // Body editor (MS editor wrapper + contenteditable textbox)
  const editorWrapper = page.locator("div[data-ms-editor]").first();
  await editorWrapper.waitFor({ state: "visible", timeout: 45_000 });
  await editorWrapper.scrollIntoViewIfNeeded();

  await editorWrapper.click({ force: true });

  const body = page
    .locator(
      'div[role="textbox"][contenteditable="true"][data-ms-editor="true"]'
    )
    .first();

  await body.waitFor({ state: "visible", timeout: 45_000 });
  await body.click({ force: true });

  // Replace current content and type the message
  await page.keyboard.press(
    process.platform === "darwin" ? "Meta+A" : "Control+A"
  );
  await page.keyboard.press("Backspace");
  await page.keyboard.type(
    "Ovo je body poruka za New Event. Playwright testa.gggggggggggggggggggggggggggggggggggggggggg",
    { delay: 10 }
  );

  // Send event
  const sendButton = page.getByRole("button", { name: /^send$/i }).first();
  await sendButton.waitFor({ state: "visible", timeout: 45_000 });
  await sendButton.click();

  // Optional: confirm that the compose dialog is dismissed
  const dialog = page.getByRole("dialog").first();
  await expect(dialog).toBeHidden({ timeout: 45_000 });

  await page.waitForTimeout(5000);

  // Keep only when debugging locally
  // await page.pause();
});
