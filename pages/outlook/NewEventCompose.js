// pages/outlook/NewEventCompose.js
import { expect } from "@playwright/test";
import { CalendarActions } from "../constants/calendarActions.js";
import { CalendarFields } from "../constants/calendarFields.js";

/**
 * NewEventCompose
 * ---------------
 * Page Object representing the Outlook Calendar "New event" compose dialog.
 *
 * Responsibilities:
 * - Wait for the dialog to be ready
 * - Fill core event fields (title, required attendees)
 * - Configure date/time via the time dropdown
 * - Fill optional fields (location, body)
 * - Send the event and confirm dialog dismissal
 */
export class NewEventCompose {
  constructor(page) {
    this.page = page;

    // Primary dialog container (used for post-send visibility check)
    this.dialog = page.getByRole("dialog").first();

    // Field locators
    this.titleInput = page.locator(CalendarFields.TitleInput);
    this.requiredAttendees = page.locator(
      CalendarFields.RequiredAttendeesEditable
    );
    this.location = page.locator(CalendarFields.LocationInput);

    // Body editor (Outlook uses an MS editor wrapper + contenteditable textbox)
    this.editorWrapper = page.locator(CalendarFields.EditorWrapper).first();
    this.body = page.locator(CalendarFields.BodyEditable).first();

    // Action buttons
    this.sendButton = page
      .getByRole("button", {
        name: new RegExp(`^${CalendarActions.Send}$`, "i"),
      })
      .first();
  }

  /**
   * Closes suggestion popups and moves focus away from active inputs.
   * Used after committing recipients/location where dropdowns may remain open.
   */
  async blurAndCloseSuggestions() {
    await this.page.keyboard.press("Escape").catch(() => {});
    await this.page.waitForTimeout(50);
    await this.page.keyboard.press("Tab").catch(() => {});
    await this.page.waitForTimeout(50);
  }

  /**
   * Types into a contenteditable field and commits with Enter.
   * Includes a focus guard because Outlook can keep focus in a nested element
   * or fail to activate the editor on the first click.
   */
  async typeAndCommitInContentEditable(editor, text, { delay = 25 } = {}) {
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
      await this.page.waitForTimeout(150);
    }

    await this.page.keyboard.type(text, { delay });
    await this.page.keyboard.press("Enter");
  }

  /**
   * Clears a combobox and types a value, then commits with Enter.
   * This is primarily used for Start Date where typing is more stable.
   */
  async clearAndTypeCombobox(combo, value, { delay = 20 } = {}) {
    await combo.waitFor({ state: "visible", timeout: 30_000 });
    await combo.click();
    await combo.focus();

    await combo.press(process.platform === "darwin" ? "Meta+A" : "Control+A");
    await combo.press("Backspace");

    await combo.type(value, { delay });
    await combo.press("Enter");
  }

  /**
   * Clears a combobox and fills a value, then commits via Tab.
   * This is primarily used for time inputs.
   */
  async clearAndFillCombobox(combo, value) {
    await combo.waitFor({ state: "visible", timeout: 30_000 });
    await combo.click();
    await combo.focus();

    await combo.press(process.platform === "darwin" ? "Meta+A" : "Control+A");
    await combo.press("Backspace");

    await combo.fill(value);
    await combo.press("Tab");
  }

  /**
   * Waits until the "New event" compose UI is ready for interaction.
   * Title input is used as a stable readiness signal.
   */
  async waitUntilOpen() {
    await expect(this.titleInput).toBeVisible({ timeout: 45_000 });
  }

  /**
   * Sets the event title.
   */
  async fillTitle(title) {
    await expect(this.titleInput).toBeVisible({ timeout: 45_000 });
    await this.titleInput.fill(title);
  }

  /**
   * Adds a required attendee and verifies it is rendered in the UI.
   * Uses a contenteditable commit flow (type + Enter).
   */
  async addRequiredAttendee(email) {
    await expect(this.requiredAttendees).toBeVisible({ timeout: 45_000 });
    await this.typeAndCommitInContentEditable(this.requiredAttendees, email);

    await expect(this.page.getByText(email).first()).toBeVisible({
      timeout: 30_000,
    });

    await this.blurAndCloseSuggestions();
  }

  /**
   * Opens the time range dropdown by clicking the "HH:MM - HH:MM" line.
   */
  async openTimeDropdown() {
    const timeRangeLine = this.page
      .locator(`text=${CalendarFields.TimeRangeLineRegex}`)
      .first();

    await timeRangeLine.waitFor({ state: "visible", timeout: 45_000 });
    await timeRangeLine.click();
  }

  /**
   * Sets the start date (expected format: dd/mm/yyyy).
   */
  async setStartDate(ddmmyyyy) {
    const startDate = this.page.getByRole("combobox", { name: /start date/i });
    await this.clearAndTypeCombobox(startDate, ddmmyyyy, { delay: 20 });
  }

  /**
   * Sets the start time (expected format: HH:MM).
   */
  async setStartTime(hhmm) {
    const startTime = this.page.getByRole("combobox", { name: /start time/i });
    await this.clearAndFillCombobox(startTime, hhmm);
  }

  /**
   * Sets the end time (expected format: HH:MM).
   */
  async setEndTime(hhmm) {
    const endTime = this.page.getByRole("combobox", { name: /end time/i });
    await this.clearAndFillCombobox(endTime, hhmm);
  }

  /**
   * Closes the time dropdown.
   */
  async closeTimeDropdown() {
    await this.page.keyboard.press("Escape").catch(() => {});
  }

  /**
   * Sets the event location and dismisses suggestions.
   */
  async setLocation(text) {
    await this.location.waitFor({ state: "visible", timeout: 45_000 });
    await this.location.click();
    await this.location.fill(text);

    await this.page.keyboard.press("Escape").catch(() => {});
    await this.location.press("Tab").catch(() => {});
  }

  /**
   * Replaces the current body content with the provided text.
   * Outlook uses an MS editor surface; we first activate the wrapper,
   * then click into the contenteditable textbox.
   */
  async setBody(text) {
    await this.editorWrapper.waitFor({ state: "visible", timeout: 45_000 });
    await this.editorWrapper.scrollIntoViewIfNeeded();

    await this.editorWrapper.click({ force: true });

    await this.body.waitFor({ state: "visible", timeout: 45_000 });
    await this.body.click({ force: true });

    await this.page.keyboard.press(
      process.platform === "darwin" ? "Meta+A" : "Control+A"
    );
    await this.page.keyboard.press("Backspace");

    await this.page.keyboard.type(text, { delay: 10 });
  }

  /**
   * Sends the event and verifies that the compose dialog is dismissed.
   */
  async send() {
    await this.sendButton.waitFor({ state: "visible", timeout: 45_000 });
    await this.sendButton.click();

    await expect(this.dialog).toBeHidden({ timeout: 45_000 });
  }
}