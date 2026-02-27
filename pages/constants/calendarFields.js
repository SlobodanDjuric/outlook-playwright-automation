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
  RequiredAttendeesEditable:
    '[aria-label="Invite required attendees"][contenteditable="true"]',

  // Time range line (e.g. "18:15 - 19:00")
  TimeRangeLineRegex: /\d{2}:\d{2}\s*-\s*\d{2}:\d{2}/,

  // Location input field
  LocationInput: "#location-suggestions-picker-input",

  // Editor wrapper container
  EditorWrapper: "div[data-ms-editor]",

  // Body contenteditable editor
  BodyEditable:
    'div[role="textbox"][contenteditable="true"][data-ms-editor="true"]',
});