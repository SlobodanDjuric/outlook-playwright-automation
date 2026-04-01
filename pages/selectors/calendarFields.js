// pages/selectors/calendarFields.js

/**
 * CalendarFields
 * --------------
 * Centralized collection of Outlook Calendar field selectors and ARIA label
 * patterns used by Calendar Page Objects (e.g. NewEventCompose).
 *
 * CSS selectors are stored as strings; ARIA label patterns as RegExp.
 * This prevents hardcoded values from being scattered across Page Objects.
 */
export const CalendarFields = Object.freeze({
  // ── Core compose fields ───────────────────────────────────────────────────

  TitleInput:                'input[placeholder="Add title"]',
  RequiredAttendeesEditable: '[aria-label="Invite required attendees"][contenteditable="true"]',
  OptionalAttendeesEditable: '[aria-label="Invite optional attendees"][contenteditable="true"]',
  LocationInput:             '#location-suggestions-picker-input',

  // ── Body editor ───────────────────────────────────────────────────────────

  EditorWrapper: 'div[data-ms-editor]',
  BodyEditable:  'div[role="textbox"][contenteditable="true"][data-ms-editor="true"]',

  // ── Toolbar buttons ───────────────────────────────────────────────────────

  RecurringButton:        'button[aria-label*="recurrence" i], button[aria-label*="recurring" i], button:has-text("Recurrence"), button:has-text("Series")',
  ReminderButton:         'button[aria-label*="reminder" i]',
  PrivacyButton:          'button[aria-label*="private" i]',
  ResponseOptionsButton:  'button[aria-label*="response options" i], button:has-text("Response options")',
  LocationSettingsButton: 'button[aria-label*="location settings" i]',

  // ── Date/time panel ───────────────────────────────────────────────────────

  TimeRangeLineRegex: /\d{2}:\d{2}\s*-\s*\d{2}:\d{2}/,
  AllDayCheckbox:     'input[aria-label*="all day" i]',

  // ARIA label patterns for date/time comboboxes inside the date/time panel
  StartDateLabel: /start date/i,
  StartTimeLabel: /start time/i,
  EndDateLabel:   /end date/i,
  EndTimeLabel:   /end time/i,

  // ── Recurrence panel ─────────────────────────────────────────────────────

  // "Repeat every N" interval combobox
  RepeatEveryInput: '[role="combobox"][aria-label*="interval" i]',

  // ARIA label patterns for recurrence comboboxes/buttons
  UnitOfTimeLabel:    /unit of time/i,
  OccursEveryLabel:   /Occurs every/i,
  DaysOfWeekLabel:    /days of the week/i,

  // ── Toolbar button labels ─────────────────────────────────────────────────

  StatusButtonLabel:     /busy|free|working elsewhere|tentative|out of office/i,
  OnlineMeetingLabel:    /teams meeting|online meeting/i,
  OnlineMeetingSelector: '[aria-label*="teams meeting" i], [aria-label*="online meeting" i]',
  CategorizeLabel:       /categori/i,
  CategorizeSelector:    '[aria-label*="categori" i]',

  // ── Dialog / action button labels ─────────────────────────────────────────

  DiscardChangesText:  /discard changes/i,
  KeepChangesLabel:    /no|cancel|keep changes/i,
  DiscardConfirmLabel: /discard|don.t save|yes/i,
  DeleteLabel:         /^delete$/i,
  SaveLabel:           /^save$/i,
  SaveAsDraftLabel:    /save as draft/i,

  // ── Response options ──────────────────────────────────────────────────────

  AddOptionalAttendeesLabel: /add optional attendees/i,

  // ── Location settings ─────────────────────────────────────────────────────

  InPersonEventLabel: /in-person event/i,

  // ── Calendar picker navigation (used in "Until" date picker) ─────────────

  CalendarPickerNextMonthLabel: /go to next month/i,
  CalendarPickerPrevMonthLabel: /go to previous month/i,
  ChooseEndDateLabel:           /choose an end date/i,

  // ── Recurrence panel container ────────────────────────────────────────────

  RecurrencePanelSelector: '[role="dialog"], [role="region"]',
});
