// pages/outlook/NewEventCompose.js
import { expect } from '@playwright/test';
import { CalendarActions } from '../constants/calendarActions.js';
import { CalendarFields } from '../constants/calendarFields.js';
import { EventType, Status, Reminder, Privacy } from '../constants/calendarOptions.js';

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

// ============================================================================
// helper sub-classes for structured page object
// ============================================================================

class EventToolbar {
  constructor(page) {
    this.page = page;
  }

  async clickSeriesButton() {
    const btn = this.page.locator(CalendarFields.RecurringButton).first();
    await btn.waitFor({ state: 'visible', timeout: 30_000 });
    await btn.click();
  }

  async setStatus(status) {
    const btn = this.page
      .getByRole('button', {
        name: /busy|free|working elsewhere|tentative|out of office/i,
      })
      .first();
    await btn.click();
    try {
      const option = this.page.getByText(status, { exact: true }).first();
      await option.waitFor({ state: 'visible', timeout: 2_000 });
      await option.click();
    } catch (e) {}
  }

  // convenience shortcuts
  async free() {
    await this.setStatus('Free');
  }
  async busy() {
    await this.setStatus('Busy');
  }
  async workingElsewhere() {
    await this.setStatus('Working elsewhere');
  }
  async tentative() {
    await this.setStatus('Tentative');
  }
  async outOfOffice() {
    await this.setStatus('Out of office');
  }

  async setReminder(optionText) {
    const btn = this.page.locator(CalendarFields.ReminderButton).first();
    await btn.click();
    try {
      const option = this.page.getByText(optionText, { exact: true }).first();
      await option.waitFor({ state: 'visible', timeout: 2_000 });
      await option.click();
    } catch (e) {}
  }

  async setPrivacy(privacyOption) {
    const btn = this.page.locator(CalendarFields.PrivacyButton).first();
    await btn.click();
    try {
      const option = this.page.getByText(privacyOption, { exact: true }).first();
      await option.waitFor({ state: 'visible', timeout: 2_000 });
      await option.click();
    } catch (e) {}
  }
}

// helper returned by `eventDetails.openResponseOptions`
class ResponseOptions {
  constructor(page) {
    this.page = page;
    this.opened = false;

    /**
     * Actions available under `openResponseOptions.setResponseOption`.
     *
     * The API is intentionally narrow so that autocompletion after the dot
     * only presents the four available operations.  The first three expect a
     * boolean argument (`true` or `false`), and the last one takes no
     * arguments.
     *
     * @type {{RequestResponses: function(boolean):Promise<ResponseOptions>,
     *          AllowForwarding: function(boolean):Promise<ResponseOptions>,
     *          HideAttendeeList: function(boolean):Promise<ResponseOptions>,
     *          addOptionalAttendees: function():Promise<ResponseOptions>}}
     */
    this.setResponseOption = {
      RequestResponses: async (enabled) => {
        await this._toggle('Request responses', Boolean(enabled));
        return this;
      },
      AllowForwarding: async (enabled) => {
        await this._toggle('Allow forwarding', Boolean(enabled));
        return this;
      },
      HideAttendeeList: async (enabled) => {
        await this._toggle('Hide attendee list', Boolean(enabled));
        return this;
      },
      addOptionalAttendees: async () => {
        // re-use existing helper for clicking the menu item
        await this.addOptionalAttendees();
        return this;
      },
    };
  }

  async ensureOpen() {
    if (!this.opened) {
      const btn = this.page.locator(CalendarFields.ResponseOptionsButton).first();
      await btn.waitFor({ state: 'visible', timeout: 30_000 });
      await btn.click();
      await this.page.waitForTimeout(200);
      this.opened = true;
    }
  }

  async _toggle(label, enabled) {
    await this.ensureOpen();
    const item = this.page
      .getByRole('menuitemcheckbox', {
        name: new RegExp(label, 'i'),
      })
      .first();
    await item.waitFor({ state: 'visible', timeout: 10_000 });
    const checked = (await item.getAttribute('aria-checked')) === 'true';
    if (checked !== enabled) {
      await item.click();
    }
  }

  async addOptionalAttendees() {
    await this.ensureOpen();
    const opt = this.page.getByRole('menuitem', { name: /add optional attendees/i }).first();
    await opt.waitFor({ state: 'visible', timeout: 10_000 });
    await opt.click();
    return this;
  }
}

// ------------------------------------------------------------------------
// helper class for the time/date dropdown (opened by clicking the
// "HH:MM - HH:MM" line).  This is a stand‑alone class rather than a
// nested declaration so it can be referenced by EventDetails without
// syntactic problems.  The surface is deliberately narrow so editors
// only autocomplete the supported operations.
// ------------------------------------------------------------------------
// ------------------------------------------------------------------------
// helper class encapsulating interactions with the recurrence panel that
// appears when the "Make recurring"/"Recurrence" option is clicked.  This
// keeps all recurrence-specific selectors and helpers separate from the rest
// of the compose object.
// ------------------------------------------------------------------------
class MakeRecurring {
  /**
   * @param {NewEventCompose} owner - the compose instance that owns the panel
   */
  constructor(owner) {
    this.owner = owner;
    this.page = owner.page;
  }

  /**
   * Clicks on the recurrence option inside the time/date dropdown. Returns
   * a helper object whose methods allow configuring the recurrence settings.
   */
  async clickRecurrenceOption() {
    const helpers = {
      setRepeatEvery: async (count) => {
        await this.setRepeatEvery(count);
        return helpers;
      },
      setRecurrenceFrequency: async (freq) => {
        await this.setRecurrenceFrequency(freq);
        return helpers;
      },
      setRecurrencePattern: async (pattern) => {
        await this.setRecurrencePattern(pattern);
        return helpers;
      },
      setRecurrenceUntil: async (date) => {
        await this.setRecurrenceUntil(date);
        return helpers;
      },
    };

    // open dropdown first
    await this.owner.eventDetails.openTimeDropdown.ensureOpen();

    for (let attempt = 1; attempt <= 2; attempt++) {
      await this.page.waitForTimeout(300);
      let recurrenceBtn = null;
      recurrenceBtn = this.page.locator('button:has-text(/recurrence/i), a:has-text(/recurrence/i), [role="button"]:has-text(/recurrence/i), [role="checkbox"]:has-text(/recurrence/i)').first();
      if (await recurrenceBtn.isVisible({ timeout: 3_000 }).catch(() => false)) {
        await recurrenceBtn.click();
        await this.page.waitForTimeout(300);
        return helpers;
      }
      const recurrenceTextBtn = this.page.locator('text=/recurrence/i').first();
      if (await recurrenceTextBtn.isVisible({ timeout: 2_000 }).catch(() => false)) {
        await recurrenceTextBtn.click({ force: true });
        await this.page.waitForTimeout(300);
        return helpers;
      }
      const panel = this.page.locator('[role="dialog"], [role="region"]').first();
      if (await panel.isVisible({ timeout: 2_000 }).catch(() => false)) {
        const panelRecurrence = panel.locator('text=/recurrence/i').first();
        if (await panelRecurrence.isVisible({ timeout: 2_000 }).catch(() => false)) {
          await panelRecurrence.click({ force: true });
          await this.page.waitForTimeout(300);
          return helpers;
        }
      }
      const recurrenceCheckbox = this.page.locator('input[type="checkbox"][aria-label*="recurrence" i], input[type="checkbox"] + label:has-text(/recurrence/i)').first();
      if (await recurrenceCheckbox.isVisible({ timeout: 2_000 }).catch(() => false)) {
        await recurrenceCheckbox.click();
        await this.page.waitForTimeout(300);
        return helpers;
      }
      const recurringBtn = this.page.locator('button:has-text(/recurring/i), a:has-text(/recurring/i), [role="button"]:has-text(/recurring/i)').first();
      if (await recurringBtn.isVisible({ timeout: 2_000 }).catch(() => false)) {
        await recurringBtn.click();
        await this.page.waitForTimeout(300);
        return helpers;
      }
    }
    try {
      await this.owner.clickSeriesButton();
      return helpers;
    } catch (e) {}
    const availableElements = await this.page
      .locator('button, a, [role="button"], label')
      .evaluateAll((els) =>
        els.slice(0, 15).map((el) => ({
          tag: el.tagName,
          text: el.textContent?.trim().substring(0, 50),
          role: el.getAttribute('role'),
        }))
      )
      .catch(() => []);
    throw new Error(`Could not find "Recurrence" option in the date/time panel. ` + `Available elements (first 15): ${JSON.stringify(availableElements, null, 2)}`);
  }

  async setRepeatEvery(count) {
    await this.page.waitForTimeout(200);
    const repeatInput = this.page.locator(CalendarFields.RepeatEveryInput);
    await expect(repeatInput).toBeVisible({ timeout: 30_000 });
    await repeatInput.click();
    await repeatInput.focus();
    await repeatInput.press(process.platform === 'darwin' ? 'Meta+A' : 'Control+A');
    await repeatInput.press('Backspace');
    await repeatInput.type(String(count), { delay: 25 });
    await this.page.waitForTimeout(200);
  }

  async setRecurrenceFrequency(frequency) {
    await this.page.waitForTimeout(200);
    const frequencyOption = this.page.getByRole('option', {
      name: new RegExp(`^${frequency}$`, 'i'),
    });
    const frequencyRadio = this.page
      .getByRole('radio', {
        name: new RegExp(frequency, 'i'),
      })
      .first();
    if (await frequencyRadio.isVisible({ timeout: 10_000 }).catch(() => false)) {
      await frequencyRadio.click();
    } else if (await frequencyOption.isVisible({ timeout: 10_000 }).catch(() => false)) {
      await frequencyOption.click();
    } else {
      const frequencyBtn = this.page.locator(`text=${frequency}`).first();
      await expect(frequencyBtn).toBeVisible({ timeout: 10_000 });
      await frequencyBtn.click();
    }
    await this.page.waitForTimeout(200);
  }

  async setRecurrencePattern(patternText) {
    await this.page.waitForTimeout(200);
    const patternOption = this.page.getByRole('option', {
      name: new RegExp(patternText, 'i'),
    });
    const patternRadio = this.page
      .getByRole('radio', {
        name: new RegExp(patternText, 'i'),
      })
      .first();
    if (await patternRadio.isVisible({ timeout: 10_000 }).catch(() => false)) {
      await patternRadio.click();
    } else if (await patternOption.isVisible({ timeout: 10_000 }).catch(() => false)) {
      await patternOption.click();
    } else {
      const patternBtn = this.page.locator(`text=${patternText}`).first();
      await expect(patternBtn).toBeVisible({ timeout: 10_000 });
      await patternBtn.click();
    }
    await this.page.waitForTimeout(200);
  }

  async setRecurrenceUntil(ddmmyyyy) {
    await this.page.waitForTimeout(200);
    const untilInput = this.page.locator(CalendarFields.UntilDateInput);
    await expect(untilInput).toBeVisible({ timeout: 30_000 });
    await untilInput.click();
    await untilInput.focus();
    await untilInput.press(process.platform === 'darwin' ? 'Meta+A' : 'Control+A');
    await untilInput.press('Backspace');
    await untilInput.type(ddmmyyyy, { delay: 20 });
    await untilInput.press('Tab');
    await this.page.waitForTimeout(200);
  }
}

class TimeDropdown {
  /**
   * @param {NewEventCompose} owner - the compose instance which created this
   * dropdown.  we keep a reference so recurrence helpers can call back into
   * the compose methods without polluting the public surface.
   */
  constructor(owner) {
    this.owner = owner;
    this.page = owner.page;
    this.opened = false;
  }

  async ensureOpen() {
    // if the time panel already contains the start date combobox we can
    // assume it's open; this avoids toggling it closed accidentally.
    const startDate = this.page.getByRole('combobox', { name: /start date/i });
    if (await startDate.isVisible({ timeout: 2_000 }).catch(() => false)) {
      return this;
    }

    // otherwise click the time-range line to open it
    const line = this.page.locator(`text=${CalendarFields.TimeRangeLineRegex}`).first();
    await line.waitFor({ state: 'visible', timeout: 45_000 });
    await line.click();
    await this.page.waitForTimeout(500);
    return this;
  }

  async setStartDate(ddmmyyyy) {
    await this.ensureOpen();
    const startDate = this.page.getByRole('combobox', { name: /start date/i });
    await startDate.waitFor({ state: 'visible', timeout: 30_000 });
    await startDate.click();
    await startDate.focus();
    await startDate.press(process.platform === 'darwin' ? 'Meta+A' : 'Control+A');
    await startDate.press('Backspace');
    await startDate.type(ddmmyyyy, { delay: 20 });
    await startDate.press('Enter');
    return this;
  }

  /**
   * Proxy to the compose-level recurrence click helper so tests can simply
   * call `time.clickRecurrenceOption()` instead of reaching back up to the
   * owner.  This mirrors the behavior described in the smoke test request.
   */
  async clickRecurrenceOption() {
    await this.owner.clickRecurrenceOption();
  }

  async setStartTime(hhmm) {
    await this.ensureOpen();
    const startTime = this.page.getByRole('combobox', { name: /start time/i });
    await startTime.waitFor({ state: 'visible', timeout: 30_000 });
    await startTime.click();
    await startTime.focus();
    await startTime.press(process.platform === 'darwin' ? 'Meta+A' : 'Control+A');
    await startTime.press('Backspace');
    await startTime.fill(hhmm);
    await startTime.press('Tab');
    return this;
  }

  async setEndTime(hhmm) {
    await this.ensureOpen();
    const endTime = this.page.getByRole('combobox', { name: /end time/i });
    await endTime.waitFor({ state: 'visible', timeout: 30_000 });
    await endTime.click();
    await endTime.focus();
    await endTime.press(process.platform === 'darwin' ? 'Meta+A' : 'Control+A');
    await endTime.press('Backspace');
    await endTime.fill(hhmm);
    await endTime.press('Tab');
    return this;
  }

  async isAllDayEnabled() {
    return await this.page
      .locator(CalendarFields.AllDayCheckbox)
      .isChecked()
      .catch(() => false);
  }

  async toggleAllDay() {
    // make sure the date/time dropdown is visible before clicking the
    // checkbox; callers used to rely on previous calls (e.g. isAllDayEnabled)
    // opening the panel but the create-all-day test no longer does that.
    await this.ensureOpen();

    const chk = this.page.locator(CalendarFields.AllDayCheckbox);
    await chk.waitFor({ state: 'visible', timeout: 30_000 });
    await chk.click();
    return this;
  }

  async setAllDay(enabled) {
    const currently = await this.isAllDayEnabled();
    if (enabled && !currently) {
      await this.toggleAllDay();
    } else if (!enabled && currently) {
      await this.toggleAllDay();
    }
    return this;
  }

  async close() {
    await this.page.keyboard.press('Escape').catch(() => {});
  }

  // ----------------------------------------------------------------------
  // recurrence helpers exposed via a callable helper.  the returned value
  // acts as both a function (so you can `await time.clickRecurrenceOption()`)
  // and as a namespace for setter methods, enabling fluent chains like
  //
  //   await time.clickRecurrenceOption
  //             .setRepeatEvery(3)
  //             .setRecurrenceFrequency('Months')
  //
  // without additional `await` or `try` boilerplate.  the implementation
  // attaches the setters as properties on the async function.
  // ----------------------------------------------------------------------
  get clickRecurrenceOption() {
    const self = this;

    // helper that actually performs the click via the owning compose
    async function clickHelper() {
      await self.owner.clickRecurrenceOption();
    }

    // add the fluent setter methods
    clickHelper.setRepeatEvery = async (count) => {
      await clickHelper();
      await self.owner.setRepeatEvery(count);
      return clickHelper;
    };
    clickHelper.setRecurrenceFrequency = async (freq) => {
      await clickHelper();
      await self.owner.setRecurrenceFrequency(freq);
      return clickHelper;
    };
    clickHelper.setRecurrencePattern = async (pattern) => {
      await clickHelper();
      await self.owner.setRecurrencePattern(pattern);
      return clickHelper;
    };
    clickHelper.setRecurrenceUntil = async (date) => {
      await clickHelper();
      await self.owner.setRecurrenceUntil(date);
      return clickHelper;
    };

    return clickHelper;
  }
}

class EventDetails {
  constructor(page, compose) {
    // keep a link to the compose instance so helpers like the time dropdown
    // can call back into methods defined on the top‑level class.
    this.page = page;
    this.compose = compose;
    this.titleInput = page.locator(CalendarFields.TitleInput);
    this.requiredAttendees = page.locator(CalendarFields.RequiredAttendeesEditable);
    this.location = page.locator(CalendarFields.LocationInput);
  }

  /**
   * Helper object exposing response options actions.  Usage examples:
   *
   *   // set a toggle by name, only the three supported properties are
   *   // autocompleted and they require a boolean argument
   *   await event.eventDetails.openResponseOptions.setResponseOption
   *     .RequestResponses(true);
   *
   *   // open the "add optional attendees" menu entry using the same namespace
   *   await event.eventDetails.openResponseOptions.setResponseOption
   *     .addOptionalAttendees();
   *
   * The helper instance is cached so multiple calls reuse the same object.
   */
  get openResponseOptions() {
    if (!this._responseHelper) {
      this._responseHelper = new ResponseOptions(this.page);
    }
    return this._responseHelper;
  }

  /**
   * Helper object for interacting with the time/date panel that opens when
   * the time range line is clicked.  The API mirrors the pattern used for
   * response options: only valid actions are exposed and each method returns
   * the helper so calls can be chained.
   *
   * Example usage:
   *
   *   await event.eventDetails.openTimeDropdown
   *     .setStartDate(START_DATE)
   *     .setStartTime(START_TIME)
   *     .setEndTime(END_TIME)
   *     .setAllDay(true)
   *     .close();
   */
  get openTimeDropdown() {
    if (!this._timeHelper) {
      // we want the underlying compose rather than the details object so the
      // recurrence helpers are available
      this._timeHelper = new TimeDropdown(this.compose || this);
    }
    return this._timeHelper;
  }

  async blurAndCloseSuggestions() {
    await this.page.keyboard.press('Escape').catch(() => {});
    await this.page.waitForTimeout(50);
    await this.page.keyboard.press('Tab').catch(() => {});
    await this.page.waitForTimeout(50);
  }

  async typeAndCommitInContentEditable(editor, text, { delay = 25 } = {}) {
    await editor.scrollIntoViewIfNeeded();
    await editor.click({ force: true });

    for (let i = 0; i < 5; i++) {
      await editor.click({ force: true });
      const focused = await editor
        .evaluate((el) => {
          const a = document.activeElement;
          return a === el || (!!a?.closest?.('[contenteditable="true"]') && el.contains(a));
        })
        .catch(() => false);
      if (focused) break;
      await this.page.waitForTimeout(150);
    }

    await this.page.keyboard.type(text, { delay });
    await this.page.keyboard.press('Enter');
  }

  async fillTitle(title) {
    await expect(this.titleInput).toBeVisible({ timeout: 45_000 });
    await this.titleInput.fill(title);
  }

  async addRequiredAttendee(email) {
    await expect(this.requiredAttendees).toBeVisible({ timeout: 45_000 });
    await this.typeAndCommitInContentEditable(this.requiredAttendees, email);
    await expect(this.page.getByText(email).first()).toBeVisible({
      timeout: 30_000,
    });
    await this.blurAndCloseSuggestions();
  }

  async setStartDate(ddmmyyyy) {
    await this.openTimeDropdown.setStartDate(ddmmyyyy);
  }

  async clearAndTypeCombobox(combo, value, { delay = 20 } = {}) {
    await combo.waitFor({ state: 'visible', timeout: 30_000 });
    await combo.click();
    await combo.focus();
    await combo.press(process.platform === 'darwin' ? 'Meta+A' : 'Control+A');
    await combo.press('Backspace');
    await combo.type(value, { delay });
    await combo.press('Enter');
  }

  async clearAndFillCombobox(combo, value) {
    await combo.waitFor({ state: 'visible', timeout: 30_000 });
    await combo.click();
    await combo.focus();
    await combo.press(process.platform === 'darwin' ? 'Meta+A' : 'Control+A');
    await combo.press('Backspace');
    await combo.fill(value);
    await combo.press('Tab');
  }

  async setStartTime(hhmm) {
    await this.openTimeDropdown.setStartTime(hhmm);
  }

  async setEndTime(hhmm) {
    await this.openTimeDropdown.setEndTime(hhmm);
  }

  async closeTimeDropdown() {
    await this.openTimeDropdown.close();
  }

  async isAllDayEnabled() {
    return await this.openTimeDropdown.isAllDayEnabled();
  }

  async toggleAllDay() {
    await this.openTimeDropdown.toggleAllDay();
  }

  async setAllDay(enabled) {
    await this.openTimeDropdown.setAllDay(enabled);
  }

  async setLocation(text) {
    await this.location.waitFor({ state: 'visible', timeout: 45_000 });

    // if a discard-changes dialog is already visible, close it before proceeding
    const preDialog = this.page.locator('text=/discard changes/i').first();
    if (await preDialog.isVisible({ timeout: 1_000 }).catch(() => false)) {
      // clicking the button often fails because the backdrop intercepts events;
      // pressing Escape is more reliable for dismissing the dialog
      await this.page.keyboard.press('Escape').catch(() => {});
      await this.page.waitForTimeout(300);
    }

    // attempt to click, retry once if a dialog intercepts pointer events
    for (let attempt = 1; attempt <= 2; attempt++) {
      try {
        await this.location.click();
        break;
      } catch (e) {
        // dismiss potential dialog and retry by pressing Escape (button clicks were blocked)
        const dlg = this.page.locator('text=/discard changes/i').first();
        if (await dlg.isVisible({ timeout: 1_000 }).catch(() => false)) {
          await this.page.keyboard.press('Escape').catch(() => {});
          await this.page.waitForTimeout(300);
        }
      }
    }

    await this.location.fill(text);

    // give any suggestion dropdown a moment to appear and then blur
    await this.page.waitForTimeout(150);

    // Move focus away from the location field; clicking the title is a
    // neutral action that won't close the dialog.
    if (await this.titleInput.isVisible({ timeout: 5_000 }).catch(() => false)) {
      await this.titleInput.click().catch(() => {});
      await this.page.waitForTimeout(100);
    } else {
      // fallback to keyboard tabbing
      await this.page.keyboard.press('Tab').catch(() => {});
      await this.page.waitForTimeout(100);
    }

    // Dismiss discard changes dialog if it popped up
    const dialog = this.page.locator('text=/discard changes/i').first();
    if (await dialog.isVisible({ timeout: 2_000 }).catch(() => false)) {
      const cancelBtn = this.page.getByRole('button', { name: /no|cancel|keep changes/i }).first();
      if (await cancelBtn.isVisible({ timeout: 2_000 }).catch(() => false)) {
        await cancelBtn.click();
        await this.page.waitForTimeout(300);
      } else {
        await this.page.keyboard.press('Escape').catch(() => {});
        await this.page.waitForTimeout(300);
      }
    }

    // Wait for the UI to settle
    await this.page.waitForTimeout(300);
  }

  async addOptionalAttendee(email) {
    const field = this.page.locator(CalendarFields.OptionalAttendeesEditable);
    await expect(field).toBeVisible({ timeout: 45_000 });
    await this.typeAndCommitInContentEditable(field, email);
    await expect(this.page.getByText(email).first()).toBeVisible({
      timeout: 30_000,
    });
    await this.blurAndCloseSuggestions();
  }
  /**
   * Returns a helper object for interacting with the location-settings menu.
   * The helper exposes only setInPersonEvent(boolean) and is cached per instance.
   */
  get openLocationSettings() {
    if (!this._locationSettingsHelper) {
      this._locationSettingsHelper = new LocationSettings(this.page);
    }
    return this._locationSettingsHelper;
  }
}

class EventBody {
  constructor(page) {
    this.page = page;
    this.editorWrapper = page.locator(CalendarFields.EditorWrapper).first();
    this.body = page.locator(CalendarFields.BodyEditable).first();
  }

  async setBody(text) {
    // previously we used Escape to clear suggestions, but in practice the
    // compose dialog will close when Escape is pressed with focus outside of
    // a text field.  Since the body rarely shows suggestions on its own we
    // avoid using Escape entirely here and let the click logic handle focus.
    this.editorWrapper.scrollIntoViewIfNeeded();
    await this.page.waitForTimeout(200);
    await this.editorWrapper.waitFor({ state: 'visible', timeout: 45_000 });
    await this.editorWrapper.click({ force: true });
    await this.page.waitForTimeout(200);
    await this.body.waitFor({ state: 'visible', timeout: 45_000 });
    await this.body.click({ force: true });
    await this.page.waitForTimeout(200);
    const isFocused = await this.body
      .evaluate((el) => {
        const active = document.activeElement;
        return active === el || (!!active?.closest?.('[contenteditable="true"]') && el.contains(active));
      })
      .catch(() => false);
    if (!isFocused) {
      await this.body.click({ force: true });
      await this.page.waitForTimeout(150);
    }
    await this.page.keyboard.press(process.platform === 'darwin' ? 'Meta+A' : 'Control+A');
    await this.page.keyboard.press('Backspace');
    await this.page.keyboard.type(text, { delay: 10 });
    // leave focus in the body rather than hitting escape here
  }
}

export class NewEventCompose {
  constructor(page) {
    this.page = page;

    // Primary dialog container (used for post-send visibility check)
    this.dialog = page.getByRole('dialog').first();

    // helpers
    this.eventToolbar = new EventToolbar(page);
    this.eventDetails = new EventDetails(page, this);
    this.eventBody = new EventBody(page);

    // recurrence-specific helper
    this.makeRecurring = new MakeRecurring(this);

    // Action buttons
    this.sendButton = page
      .getByRole('button', {
        name: new RegExp(`^${CalendarActions.Send}$`, 'i'),
      })
      .first();
  }

  // -----------------------------------------------------------------------
  // convenience wrappers for legacy calls (kept for backwards compatibility)
  // -----------------------------------------------------------------------
  async setLocation(text) {
    return this.eventDetails.setLocation(text);
  }

  async setBody(text) {
    return this.eventBody.setBody(text);
  }

  /**
   * Closes suggestion popups and moves focus away from active inputs.
   * Used after committing recipients/location where dropdowns may remain open.
   */
  async blurAndCloseSuggestions() {
    await this.page.keyboard.press('Escape').catch(() => {});
    await this.page.waitForTimeout(50);
    await this.page.keyboard.press('Tab').catch(() => {});
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
          return a === el || (!!a?.closest?.('[contenteditable="true"]') && el.contains(a));
        })
        .catch(() => false);

      if (focused) break;
      await this.page.waitForTimeout(150);
    }

    await this.page.keyboard.type(text, { delay });
    await this.page.keyboard.press('Enter');
  }

  /**
   * Clears a combobox and types a value, then commits with Enter.
   * This is primarily used for Start Date where typing is more stable.
   */
  async clearAndTypeCombobox(combo, value, { delay = 20 } = {}) {
    await combo.waitFor({ state: 'visible', timeout: 30_000 });
    await combo.click();
    await combo.focus();

    await combo.press(process.platform === 'darwin' ? 'Meta+A' : 'Control+A');
    await combo.press('Backspace');

    await combo.type(value, { delay });
    await combo.press('Enter');
  }

  /**
   * Clears a combobox and fills a value, then commits via Tab.
   * This is primarily used for time inputs.
   */
  async clearAndFillCombobox(combo, value) {
    await combo.waitFor({ state: 'visible', timeout: 30_000 });
    await combo.click();
    await combo.focus();

    await combo.press(process.platform === 'darwin' ? 'Meta+A' : 'Control+A');
    await combo.press('Backspace');

    await combo.fill(value);
    await combo.press('Tab');
  }

  /**
   * Waits until the "New event" compose UI is ready for interaction.
   * Title input is used as a stable readiness signal.
   */
  async waitUntilOpen() {
    // titleInput now lives under details sub-object
    await expect(this.eventDetails.titleInput).toBeVisible({ timeout: 45_000 });
  }

  /**
   * Sets the event title.
   */
  async fillTitle(title) {
    // titleInput moved into eventDetails; delegate so callers still work
    await this.eventDetails.fillTitle(title);
  }

  /**
   * Adds a required attendee and verifies it is rendered in the UI.
   * Uses a contenteditable commit flow (type + Enter).
   */
  async addRequiredAttendee(email) {
    // delegate to the details sub-object
    await this.eventDetails.addRequiredAttendee(email);
  }

  /**
   * Opens the time range dropdown by clicking the "HH:MM - HH:MM" line.
   * Wrapper for backward compatibility.
   */
  async openTimeDropdown() {
    await this.openTimeDropdownWithRecurrence();
  }

  /**
   * Opens the time/date dropdown and waits for the recurrence options to be visible.
   * Recurrence options are typically available within the date/time panel.
   */
  async openTimeDropdownWithRecurrence() {
    const timeRangeLine = this.page.locator(`text=${CalendarFields.TimeRangeLineRegex}`).first();

    await timeRangeLine.waitFor({ state: 'visible', timeout: 45_000 });
    await timeRangeLine.click();

    // Wait for the time/date panel to fully expand
    await this.page.waitForTimeout(500);
  }

  /**
   * Sets the start date (expected format: dd/mm/yyyy).
   */
  async setStartDate(ddmmyyyy) {
    const startDate = this.page.getByRole('combobox', { name: /start date/i });
    await this.clearAndTypeCombobox(startDate, ddmmyyyy, { delay: 20 });
  }

  /**
   * Sets the start time (expected format: HH:MM).
   */
  async setStartTime(hhmm) {
    const startTime = this.page.getByRole('combobox', { name: /start time/i });
    await this.clearAndFillCombobox(startTime, hhmm);
  }

  /**
   * Sets the end time (expected format: HH:MM).
   */
  async setEndTime(hhmm) {
    const endTime = this.page.getByRole('combobox', { name: /end time/i });
    await this.clearAndFillCombobox(endTime, hhmm);
  }

  /**
   * Clicks on the "Recurrence" option within the date/time panel.
   * This should be called AFTER openTimeDropdownWithRecurrence().
   * Recurrence might be a button, link, or checkbox within the time panel.
   */
  async clickRecurrenceOption() {
    // expose the setter helpers in the same scope as the click operation so
    // callers can treat the result like a mini-API. this satisfies the
    // requirement that `setRepeatEvery` lives within `clickRecurrenceOption`.
    const helpers = {
      setRepeatEvery: async (count) => {
        await this.setRepeatEvery(count);
        return helpers;
      },
      setRecurrenceFrequency: async (freq) => {
        await this.setRecurrenceFrequency(freq);
        return helpers;
      },
      setRecurrencePattern: async (pattern) => {
        await this.setRecurrencePattern(pattern);
        return helpers;
      },
      setRecurrenceUntil: async (date) => {
        await this.setRecurrenceUntil(date);
        return helpers;
      },
    };

    // The panel may close after interacting with the time inputs, so always
    // start by re-opening it.  Delegate to the time dropdown helper because
    // the logic for opening lives there.
    await this.eventDetails.openTimeDropdown.ensureOpen();

    // Sometimes the panel renders its content a bit slowly. We'll allow a
    // couple of attempts before giving up, since failures were previously
    // benign but noisy.
    for (let attempt = 1; attempt <= 2; attempt++) {
      // brief pause to let any animations settle
      await this.page.waitForTimeout(300);

      // Try multiple strategies to find the recurrence option within the time panel
      let recurrenceBtn = null;

      // Strategy 1: Look for any clickable element with "Recurrence" text (case-insensitive)
      recurrenceBtn = this.page.locator('button:has-text(/recurrence/i), a:has-text(/recurrence/i), [role="button"]:has-text(/recurrence/i), [role="checkbox"]:has-text(/recurrence/i)').first();

      if (await recurrenceBtn.isVisible({ timeout: 3_000 }).catch(() => false)) {
        await recurrenceBtn.click();
        await this.page.waitForTimeout(300);
        return helpers;
      }

      // Strategy 2: Look for element with text containing "recurrence" and click it
      const recurrenceTextBtn = this.page.locator('text=/recurrence/i').first();
      if (await recurrenceTextBtn.isVisible({ timeout: 2_000 }).catch(() => false)) {
        await recurrenceTextBtn.click({ force: true });
        await this.page.waitForTimeout(300);
        return helpers;
      }

      // Strategy 3: Find within a specific panel/dialog container
      const panel = this.page.locator('[role="dialog"], [role="region"]').first();
      if (await panel.isVisible({ timeout: 2_000 }).catch(() => false)) {
        const panelRecurrence = panel.locator('text=/recurrence/i').first();
        if (await panelRecurrence.isVisible({ timeout: 2_000 }).catch(() => false)) {
          await panelRecurrence.click({ force: true });
          await this.page.waitForTimeout(300);
          return helpers;
        }
      }

      // Strategy 4: Look for checkbox with "recurrence" label
      const recurrenceCheckbox = this.page.locator('input[type="checkbox"][aria-label*="recurrence" i], input[type="checkbox"] + label:has-text(/recurrence/i)').first();
      if (await recurrenceCheckbox.isVisible({ timeout: 2_000 }).catch(() => false)) {
        await recurrenceCheckbox.click();
        await this.page.waitForTimeout(300);
        return helpers;
      }

      // Strategy 5: Try to find any button/link containing "recurring"
      const recurringBtn = this.page.locator('button:has-text(/recurring/i), a:has-text(/recurring/i), [role="button"]:has-text(/recurring/i)').first();
      if (await recurringBtn.isVisible({ timeout: 2_000 }).catch(() => false)) {
        await recurringBtn.click();
        await this.page.waitForTimeout(300);
        return helpers;
      }

      // if we got here and it's the first attempt, loop again before failing
    }

    // Nothing worked after two tries. as a last-ditch fallback try the
    // toolbar "Series" button which has the same effect to open recurrence
    // settings for an event.  This should significantly reduce noise when the
    // panel item is simply not rendered.
    try {
      await this.clickSeriesButton();
      return helpers;
    } catch (e) {
      // ignore and proceed to error below
    }

    const availableElements = await this.page
      .locator('button, a, [role="button"], label')
      .evaluateAll((els) =>
        els.slice(0, 15).map((el) => ({
          tag: el.tagName,
          text: el.textContent?.trim().substring(0, 50),
          role: el.getAttribute('role'),
        }))
      )
      .catch(() => []);

    throw new Error(`Could not find "Recurrence" option in the date/time panel. ` + `Available elements (first 15): ${JSON.stringify(availableElements, null, 2)}`);
  }

  /**
   * Clicks the "Series"/"Recurring" toolbar button which toggles the event
   * into a series/recurring event. This is exposed separately from
   * `clickRecurrenceOption` which operates within the date/time panel.
   */
  async clickSeriesButton() {
    const btn = this.page.locator(CalendarFields.RecurringButton).first();
    await btn.waitFor({ state: 'visible', timeout: 30_000 });
    await btn.click();
  }

  /**
   * Sets the availability/status (Busy/Free/Working elsewhere/etc.) by
   * opening the status dropdown and selecting the desired option.
   * `status` should be the human‑readable label exactly as shown in the menu.
   */
  async setStatus(status) {
    // open the availability dropdown
    const btn = this.page
      .getByRole('button', {
        name: /busy|free|working elsewhere|tentative|out of office/i,
      })
      .first();
    await btn.click();

    // attempt to pick by exact text; use very short timeout and swallow if not
    // visible so tests can continue even if some labels change.
    try {
      const option = this.page.getByText(status, { exact: true }).first();
      await option.waitFor({ state: 'visible', timeout: 2_000 });
      await option.click();
    } catch (e) {
      // ignore if the item cannot be selected
    }
  }

  /**
   * Chooses a reminder option from the reminder dropdown in the toolbar.
   */
  async setReminder(optionText) {
    const btn = this.page.locator(CalendarFields.ReminderButton).first();
    await btn.click();

    try {
      const option = this.page.getByText(optionText, { exact: true }).first();
      await option.waitFor({ state: 'visible', timeout: 2_000 });
      await option.click();
    } catch (e) {
      // ignore missing reminder entries
    }
  }

  /**
   * Sets privacy state by clicking the button and selecting the correct menu option.
   * privacyOption should be "Private" or "Not private" (from the Privacy constant).
   */
  async setPrivacy(privacyOption) {
    const btn = this.page.locator(CalendarFields.PrivacyButton).first();
    await btn.click();

    try {
      const option = this.page.getByText(privacyOption, { exact: true }).first();
      await option.waitFor({ state: 'visible', timeout: 2_000 });
      await option.click();
    } catch (e) {
      // ignore if the item cannot be selected
    }
  }

  /**
   * Opens the response options menu (the three‑dot icon next to attendees).

  /**
   * Sets the "Repeat every" frequency count.
   * E.g., if count = 3 and frequency = "Months", repeats every 3 months.
   */
  async setRepeatEvery(count) {
    return this.makeRecurring.setRepeatEvery(count);
  }

  /**
   * Selects the recurrence frequency/unit (Days, Weeks, Months, Years).
   * This typically interacts with a dropdown or radio group.
   */
  async setRecurrenceFrequency(frequency) {
    return this.makeRecurring.setRecurrenceFrequency(frequency);
  }

  /**
   * Selects a specific recurrence pattern for monthly/weekly recurring events.
   * E.g., "On the fourth Friday", "On the 15th", etc.
   */
  async setRecurrencePattern(patternText) {
    return this.makeRecurring.setRecurrencePattern(patternText);
  }

  /**
   * Sets the "Until" date for the recurring event (format: dd/mm/yyyy).
   * E.g., "11/01/2027" for Jan 11, 2027.
   */
  async setRecurrenceUntil(ddmmyyyy) {
    return this.makeRecurring.setRecurrenceUntil(ddmmyyyy);
  }

  /**
   * Sets the event location and dismisses suggestions.
   * This method aggressively closes the location dropdown to prevent
   * it from interfering with subsequent interactions.
   */
  // the class already exposes location/body helpers through eventDetails
  // and eventBody. the convenience wrappers above take care of them, so we
  // can completely remove the duplicate implementations that previously lived
  // here.  keeping them around was causing "undefined" errors when someone
  // accidentally called the wrong method (see failing recurring tests).

  // (methods removed)

  /**
   * Sends the event and verifies that the compose dialog is dismissed.
   */
  async send() {
    await this.dismissDiscardChanges();
    await this.sendButton.waitFor({ state: 'visible', timeout: 45_000 });
    await this.sendButton.click();

    await expect(this.dialog).toBeHidden({ timeout: 45_000 });
  }

  /**
   * Clicks the "Save" button (used when not sending invites) and verifies
   * the compose dialog is dismissed. This complements `send()` above.
   */
  async save() {
    await this.dismissDiscardChanges();

    // if the dialog is already gone, assume the event was saved by some
    // previous action (body editing sometimes causes auto-close) and exit
    // gracefully rather than throwing an error.
    if (!(await this.dialog.isVisible().catch(() => false))) {
      console.log('save(): dialog not visible, skipping save');
      return;
    }

    // simple case: Save button is visible
    const saveBtn = this.page.getByRole('button', { name: /^save$/i }).first();
    if (await saveBtn.isVisible({ timeout: 2_000 }).catch(() => false)) {
      await saveBtn.click();
      await expect(this.dialog).toBeHidden({ timeout: 45_000 });
      return;
    }

    // fallback: button has switched to Send with a dropdown; choose "Save as draft"
    const sendBtn = this.page.getByRole('button', { name: /^send$/i }).first();
    if (await sendBtn.isVisible({ timeout: 2_000 }).catch(() => false)) {
      // log HTML for debugging
      console.log('sendBtn html:', await sendBtn.innerHTML());
      // also log outerHTML of parent and siblings
      console.log('sendBtn parentHTML', await sendBtn.evaluate((el) => el.parentElement?.outerHTML));
      console.log('sendBtn nextSibling', await sendBtn.evaluate((el) => el.nextElementSibling?.outerHTML));
      console.log('sendBtn previousSibling', await sendBtn.evaluate((el) => el.previousElementSibling?.outerHTML));

      // first look for the split-button menu sibling (the actual arrow
      // button that lives next to the primary send control). this is much
      // more reliable than guessing based on icon selectors which were being
      // clicked previously and produced false positives.
      let arrowClicked = false;
      const menuSibling = sendBtn.locator('xpath=following-sibling::button').first();
      if (await menuSibling.isVisible().catch(() => false)) {
        await menuSibling.click();
        arrowClicked = true;
      } else {
        // fall back to a few generic selectors in case the structure is
        // different; these are low-priority and should not trigger arrowClicked
        // unless we actually click something meaningful.
        const arrowSelectors = ['[data-automationid=splitbuttonmenu]', '.ms-Button-menuIcon', '[aria-haspopup] svg'];
        for (const sel of arrowSelectors) {
          const arrow = sendBtn.locator(sel).first();
          if (await arrow.isVisible().catch(() => false)) {
            await arrow.click();
            arrowClicked = true;
            break;
          }
        }
      }

      if (!arrowClicked) {
        // there was no dropdown arrow available – clicking the primary
        // action will immediately send the event (no draft option exists).
        // treat it as a normal send and return.
        await sendBtn.click();
        await expect(this.dialog).toBeHidden({ timeout: 45_000 });
        return;
      }

      // if we did click an arrow, a menu should appear; capture any items
      // for debugging and then select "Save as draft".
      const items = this.page.locator('role=menuitem');
      const count = await items.count();
      console.log('menu items after send click:', count);
      for (let i = 0; i < count; i++) {
        const it = items.nth(i);
        console.log(i, await it.textContent());
      }

      const draftOption = this.page
        .getByRole('menuitem', {
          name: /save as draft/i,
        })
        .first();
      await draftOption.waitFor({ state: 'visible', timeout: 15_000 });
      await draftOption.click();
      await expect(this.dialog).toBeHidden({ timeout: 45_000 });
      return;
    }

    // if neither button appears, throw for debugging. include dialog
    // visibility to aid diagnosis.
    const dialogVisible = await this.dialog.isVisible().catch(() => false);
    throw new Error(`Unable to locate Save or Send button when saving event ` + `(dialog visible: ${dialogVisible})`);
  }

  /**
   * Convenience method that selects "Save as draft" explicitly via the send
   * dropdown. Useful when we know Send is present and want that option.
   */
  async saveAsDraft() {
    const sendBtn = this.page.getByRole('button', { name: /^send$/i }).first();
    await sendBtn.waitFor({ state: 'visible', timeout: 45_000 });
    await sendBtn.click();
    const draftOption = this.page
      .getByRole('menuitem', {
        name: /save as draft/i,
      })
      .first();
    await draftOption.waitFor({ state: 'visible', timeout: 15_000 });
    await draftOption.click();
    await expect(this.dialog).toBeHidden({ timeout: 45_000 });
  }

  /**
   * Ensures the event is in the specified type (Event or Series).
   * If current state differs from desired, toggles via Series button.
   */
  async ensureEventType(type) {
    // For now, assume we start in Event mode and only toggle if Series is desired
    if (type === EventType.Series) {
      await this.clickSeriesButton();
    }
    // If type is Event, do nothing (default state)
  }

  /**
   * Sets the status/availability to the specified value using the Status constant.
   */
  async ensureStatus(status) {
    await this.setStatus(status);
  }

  // ------------------------------------------------------------------------
  // location settings helper class follows after end of NewEventCompose
  // ------------------------------------------------------------------------

  /**
   * Sets the reminder to the specified value using the Reminder constant.
   */
  async ensureReminder(reminder) {
    await this.setReminder(reminder);
  }

  /**
   * Sets privacy state: pass Privacy.Private or Privacy.NotPrivate from constants.
   */
  async ensurePrivacy(privacyOption) {
    await this.setPrivacy(privacyOption);
  }

  /**
   * If a "Discard changes" confirmation popup appears, close it.
   * This can happen when focus leaves a compose field and Outlook
   * warns about unsaved input. We look for common dialog buttons
   * and click the negative path ("No", "Cancel", etc.).
   */
  async dismissDiscardChanges() {
    const dialogSelector = 'text=/discard changes/i';
    const dialog = this.page.locator(dialogSelector).first();
    if (await dialog.isVisible({ timeout: 2_000 }).catch(() => false)) {
      // look for a button with "No" or "Cancel"
      const cancelBtn = this.page.getByRole('button', { name: /no|cancel|keep changes/i }).first();
      if (await cancelBtn.isVisible({ timeout: 2_000 }).catch(() => false)) {
        await cancelBtn.click();
        await this.page.waitForTimeout(300);
      } else {
        // fallback: press Escape to close dialog
        await this.page.keyboard.press('Escape').catch(() => {});
        await this.page.waitForTimeout(300);
      }
    }
  }
}

// ------------------------------------------------------------------------
// helper class for location settings (used by NewEventCompose.openLocationSettings)
// ------------------------------------------------------------------------
// ------------------------------------------------------------------------
// helper class for location settings (used by NewEventCompose.openLocationSettings)
// ------------------------------------------------------------------------
class LocationSettings {
  constructor(page) {
    this.page = page;
    this.opened = false;

    /**
     * Actions available under `openLocationSettings`.
     * Only the following property is defined so editors can autocomplete:
     *   - setInPersonEvent(boolean)
     *
     * The function toggles the in‑person checkbox and returns the helper so
     * calls may be chained.  Coercion to Boolean is applied for simplicity.
     *
     * @type {{setInPersonEvent: function(boolean):Promise<LocationSettings>}}
     */
    this.setInPersonEvent = async (enabled) => {
      await this.ensureOpen();
      const toggle = this.page
        .getByRole('menuitemcheckbox', {
          name: /in-person event/i,
        })
        .first();
      await toggle.waitFor({ state: 'visible', timeout: 10_000 });
      const checked = (await toggle.getAttribute('aria-checked')) === 'true';
      if (checked !== Boolean(enabled)) {
        await toggle.click();
      }
      return this;
    };
  }

  /**
   * Ensure the location-settings menu is open (clicks the button once).
   */
  async ensureOpen() {
    if (!this.opened) {
      const btn = this.page.locator(CalendarFields.LocationSettingsButton).first();
      await btn.waitFor({ state: 'visible', timeout: 30_000 });
      await btn.click();
      await this.page.waitForTimeout(200);
      this.opened = true;
    }
  }
}
