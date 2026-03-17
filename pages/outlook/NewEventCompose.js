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
    try {
      const option = this.page.getByText(optionText, { exact: true }).first();
      await option.waitFor({ state: 'visible', timeout: 2_000 });
      await option.click();
    } catch (e) {}
  }

  /**
   * Opens the privacy dropdown and selects the given option.
   * @param {string} privacyOption - use Privacy.Private or Privacy.NotPrivate from constants
   */
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

  /**
   * Toggles a menu checkbox item to the desired state.
   * Opens the menu first if it isn't already open.
   * @param {string} label - partial label text of the menu item
   * @param {boolean} enabled - desired checked state
   */
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

  /** Opens the "Add optional attendees" menu item to reveal the optional field. */
  async addOptionalAttendees() {
    await this.ensureOpen();
    const opt = this.page.getByRole('menuitem', { name: /add optional attendees/i }).first();
    await opt.waitFor({ state: 'visible', timeout: 10_000 });
    await opt.click();
    return this;
  }
}

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
      setWeeklyDays: async (days) => {
        await this.setWeeklyDays(days);
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

  /**
   * Sets the "Repeat every N" interval field.
   * If the recurrence editor panel isn't visible yet, clicks the "Occurs every …"
   * summary button first to reopen it.
   * @param {number} count - interval value (e.g. 2 for "every 2 weeks")
   */
  async setRepeatEvery(count) {
    await this.page.waitForTimeout(200);

    // if the recurrence editor isn't open yet, click the "Occurs every …"
    // summary button that appears on the event form after enabling recurrence
    const intervalCombobox = this.page.locator(CalendarFields.RepeatEveryInput);
    const alreadyVisible = await intervalCombobox.isVisible({ timeout: 1_500 }).catch(() => false);
    if (!alreadyVisible) {
      const summaryBtn = this.page.getByRole('button', { name: /Occurs every/i }).first();
      await summaryBtn.waitFor({ state: 'visible', timeout: 15_000 });
      await summaryBtn.click();
      await this.page.waitForTimeout(400);
    }

    await intervalCombobox.waitFor({ state: 'visible', timeout: 30_000 });

    // the "Interval" field is a custom combobox — click to open, then pick the option
    await intervalCombobox.click();
    await this.page.waitForTimeout(300);

    // try clicking the matching option from the opened listbox
    const option = this.page.getByRole('option', { name: new RegExp(`^${count}$`) }).first();
    if (await option.isVisible({ timeout: 3_000 }).catch(() => false)) {
      await option.click();
    } else {
      // fallback: native <select> or type-ahead
      await intervalCombobox.selectOption(String(count)).catch(async () => {
        await this.page.keyboard.type(String(count));
      });
    }

    await this.page.waitForTimeout(300);
  }

  /**
   * Selects the unit of time for the recurrence (Days, Weeks, Months, Years).
   * Outlook uses plural forms in the listbox — the regex handles both.
   * @param {string} frequency - e.g. "Day", "Week", "Month", "Year"
   */
  async setRecurrenceFrequency(frequency) {
    await this.page.waitForTimeout(200);

    // ensure the recurrence editor panel is open
    const unitCombobox = this.page.getByRole('combobox', { name: /unit of time/i });
    if (!(await unitCombobox.isVisible({ timeout: 1_500 }).catch(() => false))) {
      const summaryBtn = this.page.getByRole('button', { name: /Occurs every/i }).first();
      await summaryBtn.waitFor({ state: 'visible', timeout: 15_000 });
      await summaryBtn.click();
      await this.page.waitForTimeout(400);
    }

    // click the "Unit of time" combobox and pick the option
    // Outlook labels options with plural forms: "days", "weeks", "months", "years"
    await unitCombobox.waitFor({ state: 'visible', timeout: 10_000 });
    await unitCombobox.click();
    await this.page.waitForTimeout(300);

    const option = this.page
      .getByRole('option', { name: new RegExp(`^${frequency}s?$`, 'i') })
      .first();
    if (await option.isVisible({ timeout: 3_000 }).catch(() => false)) {
      await option.click();
    } else {
      const fallback = this.page
        .locator(`[role="option"]:has-text("${frequency}")`)
        .first();
      await fallback.waitFor({ state: 'visible', timeout: 5_000 });
      await fallback.click();
    }
    await this.page.waitForTimeout(200);
  }

  /**
   * Selects a recurrence pattern option (radio or listbox item).
   * Used for monthly patterns like "On the fourth Friday" or "On the 15th".
   * @param {string} patternText - partial label of the pattern option
   */
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
      // Fluent UI wraps the radio input in a <label> that intercepts pointer events;
      // force: true bypasses the interception and clicks the underlying input directly.
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
   * Useful for yearly recurrence where the exact "On the …" label is dynamic.
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

    // ensure the recurrence editor panel is open.
    // for yearly recurrence the interval combobox is hidden (you can't set "every N years"),
    // so we use the unit-of-time combobox as an alternative panel-open indicator.
    // only open the panel if NEITHER indicator is visible – clicking the summary button
    // while the panel is already open would toggle it closed.
    const intervalCombobox = this.page.locator(CalendarFields.RepeatEveryInput);
    const unitCombobox = this.page.getByRole('combobox', { name: /unit of time/i });
    const panelOpen = (await intervalCombobox.isVisible({ timeout: 1_000 }).catch(() => false)) ||
                      (await unitCombobox.isVisible({ timeout: 1_000 }).catch(() => false));
    if (!panelOpen) {
      const summaryBtn = this.page.getByRole('button', { name: /Occurs every/i }).first();
      await summaryBtn.waitFor({ state: 'visible', timeout: 15_000 });
      await summaryBtn.click();
      await this.page.waitForTimeout(400);
    }

    // clicking the Until / "Choose an end date" button opens a calendar picker.
    // strategy 1: find via the "Until" label parent
    // strategy 2: "Choose an end date" button (yearly recurrence UI)
    let untilDateBtn = null;
    const untilLabel = this.page.getByText('Until', { exact: true }).first();
    if (await untilLabel.isVisible({ timeout: 2_000 }).catch(() => false)) {
      const untilContainer = untilLabel.locator('..');
      untilDateBtn = untilContainer.getByRole('button').first();
    } else {
      untilDateBtn = this.page.getByRole('button', { name: /choose an end date/i }).first();
    }
    await untilDateBtn.waitFor({ state: 'visible', timeout: 10_000 });
    await untilDateBtn.click();
    await this.page.waitForTimeout(600);

    // parse dd/mm/yyyy
    const [dd, mm, yyyy] = ddmmyyyy.split('/').map(Number);
    const MONTHS_FULL  = ['January','February','March','April','May','June',
                          'July','August','September','October','November','December'];
    const MONTHS_SHORT = ['Jan','Feb','Mar','Apr','May','Jun',
                          'Jul','Aug','Sep','Oct','Nov','Dec'];
    const fullName  = MONTHS_FULL[mm - 1];
    const shortName = MONTHS_SHORT[mm - 1];

    // navigate the calendar to the target month/year.
    // The Until picker can open at a date ahead of the target (e.g. it defaults to 1 year
    // from start), so we must support both forward and backward navigation.
    const targetRe = new RegExp(`(${fullName}|${shortName})\\s+${yyyy}`, 'i');
    const isOnTarget = async () =>
      this.page.getByRole('button', { name: targetRe }).first()
        .isVisible({ timeout: 500 }).catch(() => false);

    if (!(await isOnTarget())) {
      // try forward first (up to 24 months)
      for (let nav = 0; nav < 24; nav++) {
        if (await isOnTarget()) break;
        const nextBtn = this.page.getByRole('button', { name: /go to next month/i }).first();
        if (!(await nextBtn.isVisible({ timeout: 500 }).catch(() => false))) break;
        await nextBtn.click();
        await this.page.waitForTimeout(300);
      }
    }

    if (!(await isOnTarget())) {
      // target is behind the current view — navigate backward (up to 36 months back)
      for (let nav = 0; nav < 36; nav++) {
        if (await isOnTarget()) break;
        const prevBtn = this.page.getByRole('button', { name: /go to previous month/i }).first();
        if (!(await prevBtn.isVisible({ timeout: 500 }).catch(() => false))) break;
        await prevBtn.click();
        await this.page.waitForTimeout(300);
      }
    }

    // The Until picker calendar grid does not carry an aria-label with the month/year name.
    // Instead, anchor on the header button (e.g. "December 2026") and navigate from it
    // to the sibling calendar grid that holds the day buttons.
    // Structure (both inline pickers and left-sidebar mini-cal):
    //   grandparent
    //     nav-container: button["December 2026"], prev/next arrows
    //     grid: gridcell > button["1"], button["2"], ...
    // From the header button: ../../ reaches grandparent, then search for day buttons inside.
    const headerBtn = this.page
      .getByRole('button', { name: new RegExp(`(${fullName}|${shortName})\\s+${yyyy}`, 'i') })
      .first();

    // Primary: 2 levels up → grandparent contains both header and grid
    let dayBtn = headerBtn
      .locator('../..')
      .getByRole('button', { name: new RegExp(`^${dd}(?:[,\\s]|$)`) })
      .first();
    if (!(await dayBtn.isVisible({ timeout: 3_000 }).catch(() => false))) {
      // Try 3 levels up in case the structure is one level deeper
      dayBtn = headerBtn
        .locator('../../..')
        .getByRole('button', { name: new RegExp(`^${dd}(?:[,\\s]|$)`) })
        .first();
    }
    if (!(await dayBtn.isVisible({ timeout: 3_000 }).catch(() => false))) {
      // Fallback: match by visible text content (no aria-label on button)
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
   * Uses a two-pass approach: first selects wanted days, then deselects the rest.
   * This prevents Outlook from blocking deselection that would leave 0 days selected.
   * @param {string[]} days - full day names, e.g. ['Monday', 'Friday']
   */
  async setWeeklyDays(days) {
    // 'days' is an array of full day names, e.g. ['Friday', 'Saturday']
    // ensure recurrence panel is open
    const intervalCombobox = this.page.locator(CalendarFields.RepeatEveryInput);
    if (!(await intervalCombobox.isVisible({ timeout: 1_500 }).catch(() => false))) {
      const summaryBtn = this.page.getByRole('button', { name: /Occurs every/i }).first();
      await summaryBtn.waitFor({ state: 'visible', timeout: 15_000 });
      await summaryBtn.click();
      await this.page.waitForTimeout(400);
    }

    // Outlook renders days as option elements inside a listbox "Days of the week"
    const dayListbox = this.page.getByRole('listbox', { name: /days of the week/i });
    await dayListbox.waitFor({ state: 'visible', timeout: 10_000 });

    // two-pass approach: add wanted days first, then remove unwanted ones.
    // this prevents Outlook from blocking deselection when it would leave 0 days selected.
    const ALL_DAYS = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'];
    const wantedSet = new Set(days.map((d) => d.toLowerCase()));

    // pass 1: select wanted days that are not yet selected
    for (const day of ALL_DAYS) {
      if (!wantedSet.has(day.toLowerCase())) continue;
      const dayOption = dayListbox.getByRole('option', { name: new RegExp(`^${day}$`, 'i') });
      await dayOption.waitFor({ state: 'visible', timeout: 5_000 });
      const selected = (await dayOption.getAttribute('aria-selected').catch(() => null)) === 'true';
      if (!selected) {
        await dayOption.click();
        await this.page.waitForTimeout(200);
      }
    }

    // pass 2: deselect unwanted days (now safe since wanted days are already selected)
    for (const day of ALL_DAYS) {
      if (wantedSet.has(day.toLowerCase())) continue;
      const dayOption = dayListbox.getByRole('option', { name: new RegExp(`^${day}$`, 'i') });
      await dayOption.waitFor({ state: 'visible', timeout: 5_000 });
      const selected = (await dayOption.getAttribute('aria-selected').catch(() => null)) === 'true';
      if (selected) {
        await dayOption.click();
        await this.page.waitForTimeout(200);
      }
    }
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

  /**
   * Sets the start date. Clears the field and types the value, then commits with Enter.
   * @param {string} ddmmyyyy - date in dd/mm/yyyy format, e.g. "15/06/2026"
   */
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
   * Sets the start time. Uses fill+Tab (not type+Enter) because the time
   * combobox accepts typed values via fill more reliably.
   * @param {string} hhmm - time in HH:MM format, e.g. "09:30"
   */
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

  /**
   * Sets the end time.
   * @param {string} hhmm - time in HH:MM format, e.g. "10:00"
   */
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

  /** Returns true if the All-day checkbox is currently checked. */
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

  /**
   * Sets the All-day checkbox to the desired state (only clicks if it needs to change).
   * @param {boolean} enabled - true to enable all-day, false to disable
   */
  async setAllDay(enabled) {
    const currently = await this.isAllDayEnabled();
    if (enabled && !currently) {
      await this.toggleAllDay();
    } else if (!enabled && currently) {
      await this.toggleAllDay();
    }
    return this;
  }

  /** Closes the time/date dropdown by pressing Escape. */
  async close() {
    await this.page.keyboard.press('Escape').catch(() => {});
  }

}


// ------------------------------------------------------------------------
// helper class for location settings (used by EventDetails.openLocationSettings)
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


/**
 * EventDetails
 * ------------
 * Encapsulates interactions with the main form fields: title, attendees,
 * location, and the time/date dropdown. Also exposes `openResponseOptions`
 * and `openTimeDropdown` as cached helper objects.
 */
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

  /**
   * Closes any open suggestion/autocomplete dropdown and moves focus away.
   * Called after committing a recipient or location so the dropdown doesn't
   * block the next interaction.
   */
  async blurAndCloseSuggestions() {
    await this.page.keyboard.press('Escape').catch(() => {});
    await this.page.waitForTimeout(50);
    await this.page.keyboard.press('Tab').catch(() => {});
    await this.page.waitForTimeout(50);
  }

  /**
   * Focuses a contenteditable field, types text, and commits with Enter.
   * Retries focus up to 5 times because Outlook sometimes keeps focus in a
   * nested child element rather than the editor root.
   * @param {import('@playwright/test').Locator} editor
   * @param {string} text
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
    await expect(this.page.getByText(email).first()).toBeVisible({
      timeout: 30_000,
    });
    await this.blurAndCloseSuggestions();
  }

  async setStartDate(ddmmyyyy) {
    await this.openTimeDropdown.setStartDate(ddmmyyyy);
  }

  /** Delegates to TimeDropdown.setStartTime. @param {string} hhmm */
  async setStartTime(hhmm) {
    await this.openTimeDropdown.setStartTime(hhmm);
  }

  /** Delegates to TimeDropdown.setEndTime. @param {string} hhmm */
  async setEndTime(hhmm) {
    await this.openTimeDropdown.setEndTime(hhmm);
  }

  /** Closes the time/date dropdown panel. */
  async closeTimeDropdown() {
    await this.openTimeDropdown.close();
  }

  /** Returns true if the All-day checkbox is currently checked. */
  async isAllDayEnabled() {
    return await this.openTimeDropdown.isAllDayEnabled();
  }

  /** Clicks the All-day checkbox, toggling it regardless of current state. */
  async toggleAllDay() {
    await this.openTimeDropdown.toggleAllDay();
  }

  /**
   * Sets the All-day checkbox to the desired state.
   * @param {boolean} enabled
   */
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

  /**
   * Adds an optional attendee. The optional field must already be visible
   * (call `openResponseOptions.setResponseOption.addOptionalAttendees()` first if needed).
   * @param {string} email
   */
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

/**
 * EventBody
 * ---------
 * Handles typing into the event body (rich-text contenteditable area).
 * Uses force-clicks and a focus guard because the body editor can be nested
 * inside a wrapper that intercepts normal clicks.
 */
class EventBody {
  constructor(page) {
    this.page = page;
    this.editorWrapper = page.locator(CalendarFields.EditorWrapper).first();
    this.body = page.locator(CalendarFields.BodyEditable).first();
  }

  /**
   * Clears the body and types the given text.
   * Avoids pressing Escape (it would close the compose dialog if focus is outside a text field).
   * @param {string} text
   */
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
  }

  async save() {
    await this.dismissDiscardChanges();
    if (!(await this.dialog.isVisible().catch(() => false))) return;

    const saveBtn = this.page.getByRole('button', { name: /^save$/i }).first();
    if (await saveBtn.isVisible({ timeout: 2_000 }).catch(() => false)) {
      await saveBtn.click();
      await expect(this.dialog).toBeHidden({ timeout: 45_000 });
      return;
    }

    const sendBtn = this.page.getByRole('button', { name: /^send$/i }).first();
    if (await sendBtn.isVisible({ timeout: 2_000 }).catch(() => false)) {
      const menuSibling = sendBtn.locator('xpath=following-sibling::button').first();
      if (await menuSibling.isVisible().catch(() => false)) {
        await menuSibling.click();
      } else {
        await sendBtn.click();
        await expect(this.dialog).toBeHidden({ timeout: 45_000 });
        return;
      }
      const draftOption = this.page.getByRole('menuitem', { name: /save as draft/i }).first();
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

