// pages/page-objects/NewEventCompose.js
import { expect } from '@playwright/test';
import { CalendarFields } from '../selectors/calendarFields.js';
import { CalendarActions, EventType, Status, Reminder } from '../constants/calendarOptions.js';

// Internal helpers: EventToolbar, ResponseOptions, MakeRecurring,
//                   TimeDropdown, LocationSettings, EventDetails, EventBody

// ============================================================================
// Main page object
// ============================================================================

export class NewEventCompose {
  constructor(page) {
    this.page = page;
    this.dialog = page.getByRole('dialog').first();
    this.eventToolbar = new EventToolbar(page);
    this.eventDetails = new EventDetails(page, this);
    this.eventBody = new EventBody(page);
    this.makeRecurring = new MakeRecurring(this);
    this.sendButton = page
      .getByRole('button', { name: new RegExp(`^${CalendarActions.Send}$`, 'i') })
      .first();
  }

  async waitUntilOpen() {
    await expect(this.eventDetails.titleInput).toBeVisible({ timeout: 45_000 });
  }

  async fillTitle(title) {
    await this.eventDetails.fillTitle(title);
  }

  async addRequiredAttendee(email) {
    await this.eventDetails.addRequiredAttendee(email);
  }

  async setLocation(text) {
    return this.eventDetails.setLocation(text);
  }

  async setBody(text) {
    return this.eventBody.setBody(text);
  }

  async setStartDate(ddmmyyyy) {
    await this.eventDetails.openTimeDropdown.setStartDate(ddmmyyyy);
  }

  async setStartTime(hhmm) {
    await this.eventDetails.openTimeDropdown.setStartTime(hhmm);
  }

  async setEndDate(ddmmyyyy) {
    await this.eventDetails.openTimeDropdown.setEndDate(ddmmyyyy);
  }

  async setEndTime(hhmm) {
    await this.eventDetails.openTimeDropdown.setEndTime(hhmm);
  }

  /** Delegates to EventToolbar — validation is enforced there. */
  async setStatus(status) {
    return this.eventToolbar.setStatus(status);
  }

  /** Delegates to EventToolbar — validation is enforced there. */
  async setReminder(optionText) {
    return this.eventToolbar.setReminder(optionText);
  }

  async setPrivacy(privacyOption) {
    return this.eventToolbar.setPrivacy(privacyOption);
  }

  async setOnlineMeeting(enabled) {
    return this.eventToolbar.setOnlineMeeting(enabled);
  }

  async setCategory(categoryName) {
    return this.eventToolbar.setCategory(categoryName);
  }

  async clickSeriesButton() {
    return this.eventToolbar.clickSeriesButton();
  }

  async clickRecurrenceOption() {
    return this.makeRecurring.clickRecurrenceOption();
  }

  async setRepeatEvery(count) {
    return this.makeRecurring.setRepeatEvery(count);
  }

  async setRecurrenceFrequency(frequency) {
    return this.makeRecurring.setRecurrenceFrequency(frequency);
  }

  async setRecurrencePattern(patternText) {
    return this.makeRecurring.setRecurrencePattern(patternText);
  }

  async setFirstPatternStartingWith(prefix) {
    return this.makeRecurring.setFirstPatternStartingWith(prefix);
  }

  async setRecurrenceUntil(ddmmyyyy) {
    return this.makeRecurring.setRecurrenceUntil(ddmmyyyy);
  }

  async setWeeklyDays(days) {
    return this.makeRecurring.setWeeklyDays(days);
  }

  /**
   * Ensures the event is in the specified type (Event or Series).
   * @param {EventType[keyof EventType]} type
   */
  async ensureEventType(type) {
    if (type === EventType.Series) {
      await this.clickSeriesButton();
    }
  }

  async blurAndCloseSuggestions() {
    await this.eventDetails.blurAndCloseSuggestions();
  }

  async dismissDiscardChanges() {
    const dialog = this.page.locator(`text=${CalendarFields.DiscardChangesText}`).first();
    if (await dialog.isVisible({ timeout: 2_000 }).catch(() => false)) {
      const cancelBtn = this.page.getByRole('button', { name: CalendarFields.KeepChangesLabel }).first();
      if (await cancelBtn.isVisible({ timeout: 2_000 }).catch(() => false)) {
        await cancelBtn.click();
        await this.page.waitForTimeout(300);
      } else {
        await this.page.keyboard.press('Escape').catch(() => {});
        await this.page.waitForTimeout(300);
      }
    }
  }

  /**
   * Discards unsaved changes by pressing Escape and confirming the discard dialog.
   */
  async discard() {
    await this.page.keyboard.press('Escape');
    await this.page.waitForTimeout(400);
    const discardBtn = this.page
      .getByRole('button', { name: CalendarFields.DiscardConfirmLabel })
      .first();
    if (await discardBtn.isVisible({ timeout: 2_000 }).catch(() => false)) {
      await discardBtn.click();
    }
  }

  /**
   * Deletes the event while the compose form is already open.
   * Handles the optional confirmation dialog.
   */
  async delete() {
    const deleteBtn = this.page.getByRole('button', { name: CalendarFields.DeleteLabel }).first();
    if (!(await deleteBtn.isVisible({ timeout: 3_000 }).catch(() => false))) return;
    await deleteBtn.click();
    await this.page.waitForTimeout(800);
    const confirmBtn = this.page.getByRole('button', { name: CalendarFields.DeleteLabel }).first();
    if (await confirmBtn.isVisible({ timeout: 3_000 }).catch(() => false)) {
      await confirmBtn.click();
    }
  }

  /**
   * Opens the Categorize picker and selects the first available category.
   * Returns the category name that was selected, or null if no categories exist.
   */
  async selectFirstAvailableCategory() {
    return this.eventToolbar.selectFirstAvailableCategory();
  }

  /**
   * Asserts the title input is visible and contains the expected string.
   * @param {string} expected
   */
  async verifyTitle(expected) {
    const titleInput = this.page.getByPlaceholder('Add title');
    await expect(titleInput).toBeVisible({ timeout: 15_000 });
    const actual = await titleInput.inputValue();
    expect(actual).toContain(expected);
  }

  /**
   * Asserts the selected category name (or its first word) is reflected in
   * the compose toolbar / form.
   * @param {string} name - full category name returned by selectFirstAvailableCategory()
   */
  async verifyCategoryVisible(name) {
    const firstWord = name.split(' ')[0];
    await expect(
      this.page.getByRole('button', { name: new RegExp(firstWord, 'i') })
        .or(this.page.getByText(new RegExp(firstWord, 'i')))
        .first()
    ).toBeVisible({ timeout: 10_000 });
  }

  /**
   * Asserts the end-date combobox value contains the given day string.
   * Only meaningful for all-day events (the combobox is visible only then).
   * @param {string} day - day portion to look for, e.g. '02'
   */
  async verifyEndDateContains(day) {
    const combobox = this.page.getByRole('combobox', { name: CalendarFields.EndDateLabel });
    await expect(combobox).toBeVisible({ timeout: 10_000 });
    const value = await combobox.inputValue().catch(() => combobox.getAttribute('value')).catch(() => '');
    expect(value ?? '').toMatch(new RegExp(day));
  }

  /**
   * Asserts the Teams / online-meeting switch is checked (enabled=true) or
   * unchecked (enabled=false).
   * @param {boolean} enabled
   */
  async verifyOnlineMeeting(enabled) {
    const sw = this.page.getByRole('switch', { name: CalendarFields.OnlineMeetingLabel }).first();
    await expect(sw).toBeVisible({ timeout: 15_000 });
    if (enabled) {
      await expect(sw).toBeChecked({ timeout: 5_000 });
    } else {
      await expect(sw).not.toBeChecked({ timeout: 5_000 });
    }
  }

  async save() {
    await this.dismissDiscardChanges();

    const saveBtn = this.page.getByRole('button', { name: CalendarFields.SaveLabel }).first();
    const saveBtnVisible = await saveBtn.waitFor({ state: 'visible', timeout: 15_000 }).then(() => true).catch(() => false);
    if (saveBtnVisible) {
      await saveBtn.click();
      await expect(this.page.locator(CalendarFields.TitleInput)).toBeHidden({ timeout: 45_000 });
      await this.page.waitForTimeout(1_000);
      return;
    }

    const sendBtn = this.page.getByRole('button', { name: /^send$/i }).first();
    const sendBtnVisible = await sendBtn.waitFor({ state: 'visible', timeout: 5_000 }).then(() => true).catch(() => false);
    if (sendBtnVisible) {
      const menuSibling = sendBtn.locator('xpath=following-sibling::button').first();
      if (await menuSibling.isVisible().catch(() => false)) {
        await menuSibling.click();
      } else {
        await sendBtn.click();
        await expect(this.dialog).toBeHidden({ timeout: 45_000 });
        return;
      }
      const draftOption = this.page.getByRole('menuitem', { name: CalendarFields.SaveAsDraftLabel }).first();
      await draftOption.waitFor({ state: 'visible', timeout: 15_000 });
      await draftOption.click();
      await expect(this.dialog).toBeHidden({ timeout: 45_000 });
      return;
    }

    throw new Error(`Unable to locate Save or Send button`);
  }

  async send() {
    await this.dismissDiscardChanges();
    this.sendButton = this.page
      .getByRole('button', { name: new RegExp(`^${CalendarActions.Send}$`, 'i') })
      .first();
    await this.sendButton.waitFor({ state: 'visible', timeout: 45_000 });
    await this.sendButton.click();
    await expect(this.dialog).toBeHidden({ timeout: 45_000 });
  }
}


// ============================================================================
// Internal helper classes
// ============================================================================

/**
 * EventToolbar
 * ------------
 * Wraps the toolbar buttons that appear at the top of the compose dialog:
 * Series/Recurring toggle, Status (Busy/Free/…), Reminder, and Privacy.
 */
class EventToolbar {
  constructor(page) {
    this.page = page;
  }

  /** Clicks the "Series" / "Recurring" toolbar button to convert the event into a series. */
  async clickSeriesButton() {
    const btn = this.page.locator(CalendarFields.RecurringButton).first();
    await btn.waitFor({ state: 'visible', timeout: 30_000 });
    await btn.click();
  }

  /**
   * Opens the status dropdown and selects the given option.
   * @param {Status[keyof Status]} status - one of the Status constants:
   *   Status.Free | Status.Busy | Status.Working_Elsewhere | Status.Tentative | Status.Out_Of_Office
   */
  async setStatus(status) {
    const allowed = Object.values(Status);
    if (!allowed.includes(status)) {
      throw new Error(
        `Invalid status "${status}". Allowed values: ${allowed.map(v => `Status.${Object.keys(Status).find(k => Status[k] === v)}`).join(', ')}`
      );
    }
    const btn = this.page
      .getByRole('button', {
        name: CalendarFields.StatusButtonLabel,
      })
      .first();
    await btn.click();
    const statusOption = this.page.getByText(status, { exact: true }).first();
    if (!(await statusOption.isVisible({ timeout: 2_000 }).catch(() => false))) {
      throw new Error(`Status option "${status}" not visible after opening dropdown`);
    }
    await statusOption.click();
  }

  /**
   * Opens the reminder dropdown and selects the given option.
   * @param {Reminder[keyof Reminder]} optionText - one of the Reminder constants:
   *   Reminder.DontRemindMe | Reminder.AtTimeOfEvent | Reminder.FiveMinutesBefore |
   *   Reminder.FifteenMinutesBefore | Reminder.ThirtyMinutesBefore | Reminder.OneHourBefore |
   *   Reminder.TwoHoursBefore | Reminder.TwelveHoursBefore | Reminder.OneDayBefore | Reminder.OneWeekBefore
   */
  async setReminder(optionText) {
    const allowed = Object.values(Reminder);
    if (!allowed.includes(optionText)) {
      throw new Error(
        `Invalid reminder "${optionText}". Allowed values: ${allowed.map(v => `Reminder.${Object.keys(Reminder).find(k => Reminder[k] === v)}`).join(', ')}`
      );
    }
    const btn = this.page.locator(CalendarFields.ReminderButton).first();
    await btn.click();
    const reminderOption = this.page.getByText(optionText, { exact: true }).first();
    if (!(await reminderOption.isVisible({ timeout: 2_000 }).catch(() => false))) {
      throw new Error(`Reminder option "${optionText}" not visible after opening dropdown`);
    }
    await reminderOption.click();
  }

  /**
   * Enables or disables the Teams / online meeting toggle on the compose toolbar.
   * @param {boolean} enabled
   */
  async setOnlineMeeting(enabled) {
    const control = this.page
      .getByRole('switch', { name: CalendarFields.OnlineMeetingLabel })
      .or(this.page.getByRole('button', { name: CalendarFields.OnlineMeetingLabel }))
      .or(this.page.locator(CalendarFields.OnlineMeetingSelector))
      .first();

    await control.waitFor({ state: 'visible', timeout: 30_000 });

    const isOn = await control.evaluate((el) => {
      if (el.checked === true) return true;
      if (el.getAttribute('aria-checked') === 'true') return true;
      if (el.getAttribute('aria-pressed') === 'true') return true;
      return /remove/i.test(el.textContent || '') || /remove/i.test(el.getAttribute('aria-label') || '');
    }).catch(() => false);

    if (Boolean(isOn) !== Boolean(enabled)) {
      await control.click();
      await this.page.waitForTimeout(500);
    }
  }

  /**
   * Sets the event category by opening the Categorize picker and selecting
   * the first option whose label matches `categoryName` (case-insensitive).
   * @param {string} categoryName - e.g. "Red category", "Blue category"
   */
  async setCategory(categoryName) {
    const categorizeBtn = this.page
      .getByRole('button', { name: CalendarFields.CategorizeLabel })
      .or(this.page.locator(CalendarFields.CategorizeSelector))
      .first();

    await categorizeBtn.waitFor({ state: 'visible', timeout: 30_000 });
    await categorizeBtn.click();
    await this.page.waitForTimeout(300);

    const option = this.page
      .getByRole('menuitem', { name: new RegExp(categoryName, 'i') })
      .or(this.page.getByRole('option', { name: new RegExp(categoryName, 'i') }))
      .first();

    await option.waitFor({ state: 'visible', timeout: 10_000 });
    await option.click();
    await this.page.waitForTimeout(300);
  }

  /**
   * Opens the Categorize picker and selects the first available category.
   * Returns the category name string, or null if no categories are configured.
   */
  async selectFirstAvailableCategory() {
    const categorizeBtn = this.page
      .getByRole('button', { name: CalendarFields.CategorizeLabel })
      .or(this.page.locator(CalendarFields.CategorizeSelector))
      .first();
    await categorizeBtn.waitFor({ state: 'visible', timeout: 30_000 });
    await categorizeBtn.click();
    await this.page.waitForTimeout(400);

    const firstCategory = this.page
      .getByRole('menuitem')
      .filter({ hasText: /category/i })
      .first();

    if (!(await firstCategory.isVisible({ timeout: 3_000 }).catch(() => false))) {
      await this.page.keyboard.press('Escape');
      return null;
    }

    const name = (await firstCategory.innerText().catch(() => '')).trim();
    await firstCategory.click();
    await this.page.waitForTimeout(400);
    return name;
  }

  /**
   * Opens the privacy dropdown and selects the given option.
   * @param {string} privacyOption - use Privacy.Private or Privacy.NotPrivate from constants
   */
  async setPrivacy(privacyOption) {
    const btn = this.page.locator(CalendarFields.PrivacyButton).first();
    await btn.click();
    const privacyOptionEl = this.page.getByText(privacyOption, { exact: true }).first();
    if (!(await privacyOptionEl.isVisible({ timeout: 2_000 }).catch(() => false))) {
      throw new Error(`Privacy option "${privacyOption}" not visible after opening dropdown`);
    }
    await privacyOptionEl.click();
  }
}

// ----------------------------------------------------------------------------

// helper returned by `eventDetails.openResponseOptions`
class ResponseOptions {
  constructor(page) {
    this.page = page;
    this.opened = false;

    /**
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
        await this.addOptionalAttendees();
        return this;
      },
    };
  }

  /** Opens the "Response options" menu once; subsequent calls are no-ops. */
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
      .getByRole('menuitemcheckbox', { name: new RegExp(label, 'i') })
      .first();
    await item.waitFor({ state: 'visible', timeout: 10_000 });
    const checked = (await item.getAttribute('aria-checked')) === 'true';
    if (checked !== enabled) {
      await item.click();
    }
  }

  /** Opens the "Add optional attendees" menu item to reveal the optional field. */
  async addOptionalAttendees() {
    await this.ensureOpen();
    const opt = this.page.getByRole('menuitem', { name: CalendarFields.AddOptionalAttendeesLabel }).first();
    await opt.waitFor({ state: 'visible', timeout: 10_000 });
    await opt.click();
    return this;
  }
}

// ----------------------------------------------------------------------------

// helper class encapsulating interactions with the recurrence panel
class MakeRecurring {
  constructor(owner) {
    this.owner = owner;
    this.page = owner.page;
  }

  async clickRecurrenceOption() {
    const helpers = {
      setRepeatEvery: async (count) => { await this.setRepeatEvery(count); return helpers; },
      setRecurrenceFrequency: async (freq) => { await this.setRecurrenceFrequency(freq); return helpers; },
      setRecurrencePattern: async (pattern) => { await this.setRecurrencePattern(pattern); return helpers; },
      setRecurrenceUntil: async (date) => { await this.setRecurrenceUntil(date); return helpers; },
      setWeeklyDays: async (days) => { await this.setWeeklyDays(days); return helpers; },
      openFrequencyDropdown: async () => { await this.openFrequencyDropdown(); return helpers; },
      verifyFrequencyOptionVisible: async (label) => { await this.verifyFrequencyOptionVisible(label); return helpers; },
      verifyWeekDayVisible: async (dayLabel) => { await this.verifyWeekDayVisible(dayLabel); return helpers; },
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
      const panel = this.page.locator(CalendarFields.RecurrencePanelSelector).first();
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
    const seriesWorked = await this.owner.clickSeriesButton().then(() => true).catch(() => false);
    if (seriesWorked) return helpers;
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
   * Sets the "Repeat every N" interval field.
   * @param {number} count - interval value (e.g. 2 for "every 2 weeks")
   */
  async setRepeatEvery(count) {
    await this.page.waitForTimeout(200);

    const intervalCombobox = this.page.locator(CalendarFields.RepeatEveryInput);
    const alreadyVisible = await intervalCombobox.isVisible({ timeout: 1_500 }).catch(() => false);
    if (!alreadyVisible) {
      const summaryBtn = this.page.getByRole('button', { name: CalendarFields.OccursEveryLabel }).first();
      await summaryBtn.waitFor({ state: 'visible', timeout: 15_000 });
      await summaryBtn.click();
      await this.page.waitForTimeout(400);
    }

    await intervalCombobox.waitFor({ state: 'visible', timeout: 30_000 });
    await intervalCombobox.click();
    await this.page.waitForTimeout(300);

    const option = this.page.getByRole('option', { name: new RegExp(`^${count}$`) }).first();
    if (await option.isVisible({ timeout: 3_000 }).catch(() => false)) {
      await option.click();
    } else {
      await intervalCombobox.selectOption(String(count)).catch(async () => {
        await this.page.keyboard.type(String(count));
      });
    }

    await this.page.waitForTimeout(300);
  }

  /**
   * Selects the unit of time for the recurrence (Days, Weeks, Months, Years).
   * @param {string} frequency - e.g. "Day", "Week", "Month", "Year"
   */
  async setRecurrenceFrequency(frequency) {
    await this.page.waitForTimeout(200);

    const unitCombobox = this.page.getByRole('combobox', { name: CalendarFields.UnitOfTimeLabel });
    if (!(await unitCombobox.isVisible({ timeout: 1_500 }).catch(() => false))) {
      const summaryBtn = this.page.getByRole('button', { name: CalendarFields.OccursEveryLabel }).first();
      await summaryBtn.waitFor({ state: 'visible', timeout: 15_000 });
      await summaryBtn.click();
      await this.page.waitForTimeout(400);
    }

    await unitCombobox.waitFor({ state: 'visible', timeout: 10_000 });
    await unitCombobox.click();
    await this.page.waitForTimeout(300);

    const option = this.page
      .getByRole('option', { name: new RegExp(`^${frequency}s?$`, 'i') })
      .first();
    if (await option.isVisible({ timeout: 3_000 }).catch(() => false)) {
      await option.click();
    } else {
      const fallback = this.page.locator(`[role="option"]:has-text("${frequency}")`).first();
      await fallback.waitFor({ state: 'visible', timeout: 5_000 });
      await fallback.click();
    }
    await this.page.waitForTimeout(200);
  }

  /**
   * Opens the "Unit of time" frequency combobox without selecting any option.
   * Call verifyFrequencyOptionVisible() afterwards to assert options, then
   * press Escape to close.
   */
  async openFrequencyDropdown() {
    await this.page.waitForTimeout(200);
    const unitCombobox = this.page.getByRole('combobox', { name: CalendarFields.UnitOfTimeLabel });
    if (!(await unitCombobox.isVisible({ timeout: 2_000 }).catch(() => false))) {
      const summaryBtn = this.page.getByRole('button', { name: CalendarFields.OccursEveryLabel }).first();
      await summaryBtn.waitFor({ state: 'visible', timeout: 15_000 });
      await summaryBtn.click();
      await this.page.waitForTimeout(400);
    }
    await unitCombobox.waitFor({ state: 'visible', timeout: 10_000 });
    await unitCombobox.click();
    await this.page.waitForTimeout(300);
  }

  /**
   * Asserts that a frequency option (e.g. "Day", "Week") is visible in the
   * open frequency combobox dropdown.
   * @param {string} label - matches "Day"/"Week"/"Month"/"Year" (or plural form)
   */
  async verifyFrequencyOptionVisible(label) {
    await expect(
      this.page.getByRole('option', { name: new RegExp(`^${label}s?$`, 'i') }).first()
    ).toBeVisible({ timeout: 5_000 });
  }

  /**
   * Asserts that a day option (e.g. "Monday") is visible in the
   * "Days of the week" listbox in the Weekly recurrence editor.
   * @param {string} dayLabel - e.g. 'Monday', 'Tuesday'
   */
  async verifyWeekDayVisible(dayLabel) {
    const dayListbox = this.page.getByRole('listbox', { name: /days of the week/i });
    await expect(dayListbox).toBeVisible({ timeout: 15_000 });
    await expect(
      dayListbox.getByRole('option', { name: new RegExp(`^${dayLabel}$`, 'i') }).first()
    ).toBeVisible({ timeout: 5_000 });
  }

  /**
   * Selects a recurrence pattern option (radio or listbox item).
   * @param {string} patternText - partial label of the pattern option
   */
  async setRecurrencePattern(patternText) {
    await this.page.waitForTimeout(200);
    const patternOption = this.page.getByRole('option', { name: new RegExp(patternText, 'i') });
    const patternRadio = this.page.getByRole('radio', { name: new RegExp(patternText, 'i') }).first();
    if (await patternRadio.isVisible({ timeout: 10_000 }).catch(() => false)) {
      await patternRadio.click({ force: true });
    } else if (await patternOption.isVisible({ timeout: 10_000 }).catch(() => false)) {
      await patternOption.click();
    } else {
      const patternBtn = this.page.locator(`text=${patternText}`).first();
      await expect(patternBtn).toBeVisible({ timeout: 10_000 });
      await patternBtn.click();
    }
    await this.page.waitForTimeout(200);
  }

  /**
   * Clicks the first radio button whose label starts with the given prefix.
   * @param {string} prefix - e.g. 'On the'
   */
  async setFirstPatternStartingWith(prefix) {
    await this.page.waitForTimeout(200);
    const radio = this.page.getByRole('radio', { name: new RegExp(`^${prefix}`, 'i') }).first();
    await radio.waitFor({ state: 'visible', timeout: 10_000 });
    await radio.click({ force: true });
    await this.page.waitForTimeout(200);
  }

  async setRecurrenceUntil(ddmmyyyy) {
    await this.page.waitForTimeout(200);

    const intervalCombobox = this.page.locator(CalendarFields.RepeatEveryInput);
    const unitCombobox = this.page.getByRole('combobox', { name: CalendarFields.UnitOfTimeLabel });
    const panelOpen = (await intervalCombobox.isVisible({ timeout: 1_000 }).catch(() => false)) ||
                      (await unitCombobox.isVisible({ timeout: 1_000 }).catch(() => false));
    if (!panelOpen) {
      const summaryBtn = this.page.getByRole('button', { name: CalendarFields.OccursEveryLabel }).first();
      await summaryBtn.waitFor({ state: 'visible', timeout: 15_000 });
      await summaryBtn.click();
      await this.page.waitForTimeout(400);
    }

    let untilDateBtn = null;
    const untilLabel = this.page.getByText('Until', { exact: true }).first();
    if (await untilLabel.isVisible({ timeout: 2_000 }).catch(() => false)) {
      const untilContainer = untilLabel.locator('..');
      untilDateBtn = untilContainer.getByRole('button').first();
    } else {
      untilDateBtn = this.page.getByRole('button', { name: CalendarFields.ChooseEndDateLabel }).first();
    }
    await untilDateBtn.waitFor({ state: 'visible', timeout: 10_000 });
    await untilDateBtn.click();
    await this.page.waitForTimeout(600);

    const [dd, mm, yyyy] = ddmmyyyy.split('/').map(Number);
    const MONTHS_FULL  = ['January','February','March','April','May','June',
                          'July','August','September','October','November','December'];
    const MONTHS_SHORT = ['Jan','Feb','Mar','Apr','May','Jun',
                          'Jul','Aug','Sep','Oct','Nov','Dec'];
    const fullName  = MONTHS_FULL[mm - 1];
    const shortName = MONTHS_SHORT[mm - 1];

    const targetRe = new RegExp(`(${fullName}|${shortName})\\s+${yyyy}`, 'i');
    const isOnTarget = async () =>
      this.page.getByRole('button', { name: targetRe }).first()
        .isVisible({ timeout: 500 }).catch(() => false);

    if (!(await isOnTarget())) {
      for (let nav = 0; nav < 24; nav++) {
        if (await isOnTarget()) break;
        const nextBtn = this.page.getByRole('button', { name: CalendarFields.CalendarPickerNextMonthLabel }).first();
        if (!(await nextBtn.isVisible({ timeout: 500 }).catch(() => false))) break;
        await nextBtn.click();
        await this.page.waitForTimeout(300);
      }
    }

    if (!(await isOnTarget())) {
      for (let nav = 0; nav < 36; nav++) {
        if (await isOnTarget()) break;
        const prevBtn = this.page.getByRole('button', { name: CalendarFields.CalendarPickerPrevMonthLabel }).first();
        if (!(await prevBtn.isVisible({ timeout: 500 }).catch(() => false))) break;
        await prevBtn.click();
        await this.page.waitForTimeout(300);
      }
    }

    const headerBtn = this.page
      .getByRole('button', { name: new RegExp(`(${fullName}|${shortName})\\s+${yyyy}`, 'i') })
      .first();

    let dayBtn = headerBtn
      .locator('../..')
      .getByRole('button', { name: new RegExp(`^${dd}(?:[,\\s]|$)`) })
      .first();
    if (!(await dayBtn.isVisible({ timeout: 3_000 }).catch(() => false))) {
      dayBtn = headerBtn
        .locator('../../..')
        .getByRole('button', { name: new RegExp(`^${dd}(?:[,\\s]|$)`) })
        .first();
    }
    if (!(await dayBtn.isVisible({ timeout: 3_000 }).catch(() => false))) {
      dayBtn = headerBtn
        .locator('../../..')
        .locator('button')
        .filter({ hasText: new RegExp(`^\\s*${dd}\\s*$`) })
        .first();
    }
    await dayBtn.waitFor({ state: 'visible', timeout: 10_000 });
    await dayBtn.click();
    await this.page.waitForTimeout(300);
  }

  /**
   * Selects exactly the given days of the week for a weekly recurring event.
   * @param {string[]} days - full day names, e.g. ['Monday', 'Friday']
   */
  async setWeeklyDays(days) {
    const intervalCombobox = this.page.locator(CalendarFields.RepeatEveryInput);
    if (!(await intervalCombobox.isVisible({ timeout: 1_500 }).catch(() => false))) {
      const summaryBtn = this.page.getByRole('button', { name: CalendarFields.OccursEveryLabel }).first();
      await summaryBtn.waitFor({ state: 'visible', timeout: 15_000 });
      await summaryBtn.click();
      await this.page.waitForTimeout(400);
    }

    const dayListbox = this.page.getByRole('listbox', { name: CalendarFields.DaysOfWeekLabel });
    await dayListbox.waitFor({ state: 'visible', timeout: 10_000 });

    const ALL_DAYS = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'];
    const wantedSet = new Set(days.map((d) => d.toLowerCase()));

    for (const day of ALL_DAYS) {
      if (!wantedSet.has(day.toLowerCase())) continue;
      const dayOption = dayListbox.getByRole('option', { name: new RegExp(`^${day}$`, 'i') });
      await dayOption.waitFor({ state: 'visible', timeout: 5_000 });
      const selected = (await dayOption.getAttribute('aria-selected').catch(() => null)) === 'true';
      if (!selected) { await dayOption.click(); await this.page.waitForTimeout(200); }
    }

    for (const day of ALL_DAYS) {
      if (wantedSet.has(day.toLowerCase())) continue;
      const dayOption = dayListbox.getByRole('option', { name: new RegExp(`^${day}$`, 'i') });
      await dayOption.waitFor({ state: 'visible', timeout: 5_000 });
      const selected = (await dayOption.getAttribute('aria-selected').catch(() => null)) === 'true';
      if (selected) { await dayOption.click(); await this.page.waitForTimeout(200); }
    }
  }
}

// ----------------------------------------------------------------------------

class TimeDropdown {
  constructor(owner) {
    this.owner = owner;
    this.page = owner.page;
    this.opened = false;
  }

  async ensureOpen() {
    const startDate = this.page.getByRole('combobox', { name: CalendarFields.StartDateLabel });
    if (await startDate.isVisible({ timeout: 2_000 }).catch(() => false)) {
      return this;
    }
    const line = this.page.locator(`text=${CalendarFields.TimeRangeLineRegex}`).first();
    await line.waitFor({ state: 'visible', timeout: 45_000 });
    await line.click();
    await this.page.waitForTimeout(500);
    return this;
  }

  /**
   * Sets the start date.
   * @param {string} ddmmyyyy - date in dd/mm/yyyy format, e.g. "15/06/2026"
   */
  async setStartDate(ddmmyyyy) {
    await this.ensureOpen();
    const startDate = this.page.getByRole('combobox', { name: CalendarFields.StartDateLabel });
    await startDate.waitFor({ state: 'visible', timeout: 30_000 });
    await startDate.focus();
    await startDate.press(process.platform === 'darwin' ? 'Meta+A' : 'Control+A');
    await startDate.press('Backspace');
    await startDate.type(ddmmyyyy, { delay: 20 });
    await startDate.press('Enter');
    return this;
  }

  /**
   * Sets the start time.
   * @param {string} hhmm - time in HH:MM format, e.g. "09:30"
   */
  async setStartTime(hhmm) {
    await this.ensureOpen();
    const startTime = this.page.getByRole('combobox', { name: CalendarFields.StartTimeLabel });
    await startTime.waitFor({ state: 'visible', timeout: 30_000 });
    await startTime.click();
    await startTime.focus();
    await startTime.press(process.platform === 'darwin' ? 'Meta+A' : 'Control+A');
    await startTime.press('Backspace');
    await startTime.fill(hhmm);
    await startTime.press('Tab');
    return this;
  }

  /**
   * Sets the end date for an all-day or multi-day event.
   * NOTE: The end-date combobox is only shown when "All day" is enabled.
   * @param {string} ddmmyyyy - date in dd/mm/yyyy format, e.g. "27/03/2026"
   */
  async setEndDate(ddmmyyyy) {
    await this.ensureOpen();
    const endDate = this.page.getByRole('combobox', { name: CalendarFields.EndDateLabel });
    await endDate.waitFor({ state: 'visible', timeout: 30_000 });
    await endDate.click();
    await endDate.focus();
    await endDate.fill(ddmmyyyy);
    await endDate.press('Tab');
    await this.page.waitForTimeout(300);
    return this;
  }

  /**
   * Sets the end time.
   * @param {string} hhmm - time in HH:MM format, e.g. "10:00"
   */
  async setEndTime(hhmm) {
    await this.ensureOpen();
    const endTime = this.page.getByRole('combobox', { name: CalendarFields.EndTimeLabel });
    await endTime.waitFor({ state: 'visible', timeout: 30_000 });
    await endTime.click();
    await endTime.focus();
    await endTime.press(process.platform === 'darwin' ? 'Meta+A' : 'Control+A');
    await endTime.press('Backspace');
    await endTime.fill(hhmm);
    await endTime.press('Tab');
    return this;
  }

  /** Returns true if the All-day checkbox is currently checked. */
  async isAllDayEnabled() {
    return await this.page.locator(CalendarFields.AllDayCheckbox).isChecked().catch(() => false);
  }

  async toggleAllDay() {
    await this.ensureOpen();
    const chk = this.page.locator(CalendarFields.AllDayCheckbox);
    await chk.waitFor({ state: 'visible', timeout: 30_000 });
    await chk.click();
    return this;
  }

  /**
   * Sets the All-day checkbox to the desired state.
   * @param {boolean} enabled
   */
  async setAllDay(enabled) {
    const currently = await this.isAllDayEnabled();
    if (enabled && !currently) await this.toggleAllDay();
    else if (!enabled && currently) await this.toggleAllDay();
    return this;
  }

  /** Closes the time/date dropdown by pressing Escape. */
  async close() {
    await this.page.keyboard.press('Escape').catch(() => {});
  }
}

// ----------------------------------------------------------------------------

// helper class for location settings (used by EventDetails.openLocationSettings)
class LocationSettings {
  constructor(page) {
    this.page = page;
    this.opened = false;

    /** @type {{setInPersonEvent: function(boolean):Promise<LocationSettings>}} */
    this.setInPersonEvent = async (enabled) => {
      await this.ensureOpen();
      const toggle = this.page
        .getByRole('menuitemcheckbox', { name: CalendarFields.InPersonEventLabel })
        .first();
      await toggle.waitFor({ state: 'visible', timeout: 10_000 });
      const checked = (await toggle.getAttribute('aria-checked')) === 'true';
      if (checked !== Boolean(enabled)) await toggle.click();
      return this;
    };
  }

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

// ----------------------------------------------------------------------------

/**
 * EventDetails
 * ------------
 * Encapsulates interactions with the main form fields: title, attendees,
 * location, and the time/date dropdown. Also exposes `openResponseOptions`
 * and `openTimeDropdown` as cached helper objects.
 */
class EventDetails {
  constructor(page, compose) {
    this.page = page;
    this.compose = compose;
    this.titleInput = page.locator(CalendarFields.TitleInput);
    this.requiredAttendees = page.locator(CalendarFields.RequiredAttendeesEditable);
    this.location = page.locator(CalendarFields.LocationInput);
  }

  get openResponseOptions() {
    if (!this._responseHelper) {
      this._responseHelper = new ResponseOptions(this.page);
    }
    return this._responseHelper;
  }

  get openTimeDropdown() {
    if (!this._timeHelper) {
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

  /** Fills the event title field. */
  async fillTitle(title) {
    await expect(this.titleInput).toBeVisible({ timeout: 45_000 });
    await this.titleInput.fill(title);
  }

  /**
   * Adds a required attendee and waits for the token to appear in the UI.
   * @param {string} email - full email address
   */
  async addRequiredAttendee(email) {
    await expect(this.requiredAttendees).toBeVisible({ timeout: 45_000 });
    await this.typeAndCommitInContentEditable(this.requiredAttendees, email);
    await expect(this.page.getByText(email).first()).toBeVisible({ timeout: 30_000 });
    await this.blurAndCloseSuggestions();
  }

  async setStartDate(ddmmyyyy) { await this.openTimeDropdown.setStartDate(ddmmyyyy); }
  async setEndDate(ddmmyyyy) { await this.openTimeDropdown.setEndDate(ddmmyyyy); }
  async setStartTime(hhmm) { await this.openTimeDropdown.setStartTime(hhmm); }
  async setEndTime(hhmm) { await this.openTimeDropdown.setEndTime(hhmm); }
  async closeTimeDropdown() { await this.openTimeDropdown.close(); }
  async isAllDayEnabled() { return await this.openTimeDropdown.isAllDayEnabled(); }
  async toggleAllDay() { await this.openTimeDropdown.toggleAllDay(); }
  async setAllDay(enabled) { await this.openTimeDropdown.setAllDay(enabled); }

  async setLocation(text) {
    await this.location.waitFor({ state: 'visible', timeout: 45_000 });

    const preDialog = this.page.locator(`text=${CalendarFields.DiscardChangesText}`).first();
    if (await preDialog.isVisible({ timeout: 1_000 }).catch(() => false)) {
      await this.page.keyboard.press('Escape').catch(() => {});
      await this.page.waitForTimeout(300);
    }

    for (let attempt = 1; attempt <= 2; attempt++) {
      try {
        await this.location.click();
        break;
      } catch (e) {
        const dlg = this.page.locator(`text=${CalendarFields.DiscardChangesText}`).first();
        if (await dlg.isVisible({ timeout: 1_000 }).catch(() => false)) {
          await this.page.keyboard.press('Escape').catch(() => {});
          await this.page.waitForTimeout(300);
        }
      }
    }

    await this.location.fill(text);
    await this.page.waitForTimeout(150);

    if (await this.titleInput.isVisible({ timeout: 5_000 }).catch(() => false)) {
      await this.titleInput.click().catch(() => {});
      await this.page.waitForTimeout(100);
    } else {
      await this.page.keyboard.press('Tab').catch(() => {});
      await this.page.waitForTimeout(100);
    }

    const dialog = this.page.locator(`text=${CalendarFields.DiscardChangesText}`).first();
    if (await dialog.isVisible({ timeout: 2_000 }).catch(() => false)) {
      const cancelBtn = this.page.getByRole('button', { name: CalendarFields.KeepChangesLabel }).first();
      if (await cancelBtn.isVisible({ timeout: 2_000 }).catch(() => false)) {
        await cancelBtn.click();
        await this.page.waitForTimeout(300);
      } else {
        await this.page.keyboard.press('Escape').catch(() => {});
        await this.page.waitForTimeout(300);
      }
    }

    await this.page.waitForTimeout(300);
  }

  /**
   * Adds an optional attendee. The optional field must already be visible.
   * @param {string} email
   */
  async addOptionalAttendee(email) {
    const field = this.page.locator(CalendarFields.OptionalAttendeesEditable);
    await expect(field).toBeVisible({ timeout: 45_000 });
    await this.typeAndCommitInContentEditable(field, email);
    await expect(this.page.getByText(email).first()).toBeVisible({ timeout: 30_000 });
    await this.blurAndCloseSuggestions();
  }

  get openLocationSettings() {
    if (!this._locationSettingsHelper) {
      this._locationSettingsHelper = new LocationSettings(this.page);
    }
    return this._locationSettingsHelper;
  }
}

// ----------------------------------------------------------------------------

/**
 * EventBody
 * ---------
 * Handles typing into the event body (rich-text contenteditable area).
 */
class EventBody {
  constructor(page) {
    this.page = page;
    this.editorWrapper = page.locator(CalendarFields.EditorWrapper).first();
    this.body = page.locator(CalendarFields.BodyEditable).first();
  }

  async setBody(text) {
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
  }
}
