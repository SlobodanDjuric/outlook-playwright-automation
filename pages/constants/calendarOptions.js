/**
 * CalendarOptions
 * ---------------
 * Centralized list of all available options for event toolbar controls.
 *
 * These are used by tests to specify exact event configurations
 * without hardcoding option labels.
 */

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
