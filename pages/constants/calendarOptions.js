/**
 * CalendarOptions
 * ---------------
 * Centralized list of all available options for event toolbar controls,
 * plus UI action labels used in Calendar navigation.
 *
 * These are used by tests to specify exact event configurations
 * without hardcoding option labels.
 */

// Calendar UI action button labels (formerly calendarActions.js)
export const CalendarActions = Object.freeze({
  NewEvent: 'New event',
  Send: 'Send',
});

// Event type toggle: "Event" or "Series"
export const EventType = Object.freeze({
  Event: 'Event',
  Series: 'Series',
});

// Availability / Status dropdown options
export const Status = Object.freeze({
  Free: 'Free',
  Busy: 'Busy',
  Working_Elsewhere: 'Working elsewhere',
  Tentative: 'Tentative',
  Out_Of_Office: 'Out of office',
});

// Reminder / Notification options
export const Reminder = Object.freeze({
  DontRemindMe: "Don't remind me",
  AtTimeOfEvent: 'At time of event',
  FiveMinutesBefore: '5 minutes before',
  FifteenMinutesBefore: '15 minutes before',
  ThirtyMinutesBefore: '30 minutes before',
  OneHourBefore: '1 hour before',
  TwoHoursBefore: '2 hours before',
  TwelveHoursBefore: '12 hours before',
  OneDayBefore: '1 day before',
  OneWeekBefore: '1 week before',
});

// Privacy toggle: "Private" or "Not private"
export const Privacy = Object.freeze({
  Private: 'Private',
  NotPrivate: 'Not private',
});

/**
 * Recurrence frequency options used in the recurring event dialog.
 * Passed to RecurrenceOptions.setRecurrenceFrequency().
 */
export const RecurrenceFrequency = Object.freeze({
  Daily: 'Day',
  Weekly: 'Week',
  Monthly: 'Month',
  Yearly: 'Year',
});

/**
 * Days of the week used in recurring event day-of-week selection.
 * Passed to RecurrenceOptions.setDaysOfWeek().
 */
export const WeekDays = Object.freeze({
  Monday: 'Monday',
  Tuesday: 'Tuesday',
  Wednesday: 'Wednesday',
  Thursday: 'Thursday',
  Friday: 'Friday',
  Saturday: 'Saturday',
  Sunday: 'Sunday',
});

/**
 * Calendar view names used with CalendarNavigation.switchToView().
 */
export const CalendarView = Object.freeze({
  Day: 'Day',
  WorkWeek: 'Work week',
  Week: 'Week',
  Month: 'Month',
});
