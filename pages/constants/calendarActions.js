/**
 * CalendarActions
 * ---------------
 * Centralized list of Outlook Calendar UI action labels.
 *
 * This prevents:
 * - hardcoded strings in tests
 * - inconsistent naming across the suite
 *
 * Intended usage:
 *   page.getByRole("button", { name: CalendarActions.NewEvent })
 */
export const CalendarActions = Object.freeze({
  NewEvent: 'New event',
  Send: 'Send',
});
