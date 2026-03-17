// pages/constants/calendarFields.js

/**
 * CalendarFields
 * --------------
 * Centralized collection of Outlook Calendar field selectors and patterns.
 *
 * This prevents:
 * - Hardcoded selectors inside Page Objects or tests
 * - Selector duplication
 * - Inconsistent field access across the framework
 *
 * These selectors are intended to be consumed by
 * Calendar-related Page Objects (e.g. NewEventCompose).
 */
export const CalendarFields = Object.freeze({
  // Event title input field
  TitleInput: 'input[placeholder="Add title"]',

  // Required attendees contenteditable field
  RequiredAttendeesEditable: '[aria-label="Invite required attendees"][contenteditable="true"]',

  // Time range line (e.g. "18:15 - 19:00")
  TimeRangeLineRegex: /\d{2}:\d{2}\s*-\s*\d{2}:\d{2}/,

  // Location input field
  LocationInput: '#location-suggestions-picker-input',

  // Editor wrapper container
  EditorWrapper: 'div[data-ms-editor]',

  // Body contenteditable editor
  BodyEditable: 'div[role="textbox"][contenteditable="true"][data-ms-editor="true"]',

  // All day event checkbox
  AllDayCheckbox: 'input[aria-label*="all day" i]',

  // Recurrence/recurring options
  RecurringButton: 'button[aria-label*="recurrence" i], button[aria-label*="recurring" i], button:has-text("Recurrence"), button:has-text("Series")',
  // status/availability (busy) dropdown button; label text includes current state (Busy, Free, etc.)
  StatusButton: 'button[aria-label*="busy" i], button[aria-label*="status" i]',
  // reminder dropdown
  ReminderButton: 'button[aria-label*="reminder" i]',
  // privacy toggle uses an aria-label; text is not visible so match attr
  PrivacyButton: 'button[aria-label*="private" i]',

  // response options dropdown (toggles for request responses, forward, hide list etc.)
  ResponseOptionsButton: 'button[aria-label*="response options" i], button:has-text("Response options")',
  // button next to location field that opens extra settings (in‑person toggle)
  LocationSettingsButton: 'button[aria-label*="location settings" i]',
  // optional attendees input that appears when the related menu item is clicked
  OptionalAttendeesEditable: '[aria-label="Invite optional attendees"][contenteditable="true"]',

  RepeatEveryInput: '[role="combobox"][aria-label*="interval" i]',
  RecurrenceFrequencyDropdown: 'select[aria-label*="repeat" i], [role="listbox"][aria-label*="repeat" i]',
  RecurrencePatternDropdown: '[aria-label*="pattern" i], [role="listbox"][aria-label*="pattern" i]',
  UntilDateInput: 'input[aria-label*="until" i], input[aria-label*="end date" i]',
});
