# Outlook Playwright Automation

QA automation framework for Microsoft Outlook Web using Playwright and the Page Object Model (POM) pattern.

---

## Requirements

- Node.js 18+
- `npm install`
- A valid Microsoft / Outlook Live account

---

## Setup

### 1. Install dependencies

```bash
npm install
npx playwright install chromium
```

### 2. Authenticate

Run the auth test once to save a browser session to `storageState.json`.
All subsequent tests reuse this session — no login prompt during runs.

```bash
npx playwright test tests/custom/auth.spec.js
```

Re-run this command whenever the session expires (typically after a few hours of inactivity).

---

## Running tests

```bash
# Run all tests
npx playwright test

# Run a specific file
npx playwright test tests/Mail/send-new-email.spec.js

# Run a specific folder
npx playwright test tests/Event/

# Open the HTML report after a run
npx playwright show-report
```

---

## Project structure

```
├── pages/
│   ├── components/
│   │   ├── CalendarNavigation.js   # Navigate Mail → Calendar, open New Event
│   │   ├── MailContextMenu.js      # Right-click context menu on messages
│   │   └── mailFolders.js          # Folder tree navigation + message list
│   ├── constants/
│   │   ├── calendarActions.js      # Button label constants (New event, Send…)
│   │   ├── calendarFields.js       # Locator constants for calendar form fields
│   │   ├── calendarOptions.js      # Enums: Status, Reminder, Privacy, EventType
│   │   ├── folders.js              # Folder name constants (Inbox, Sent Items…)
│   │   └── mailActions.js          # Mail toolbar action label constants
│   └── outlook/
│       ├── eventService.js         # High-level service: create event in one call
│       ├── NewEmailCompose.js      # New mail compose POM (To/CC/BCC/Subject/Body)
│       └── NewEventCompose.js      # New event compose POM (full feature set)
├── tests/
│   ├── fixtures.js                 # Shared Playwright fixtures (calendarPage, newEventPage, mailPage)
│   ├── custom/
│   │   ├── auth.spec.js            # Save session to storageState.json
│   │   ├── delete-message.spec.js  # Delete a message from Inbox
│   │   ├── flag-mail.spec.js       # Flag / unflag a message
│   │   ├── folders-checks.spec.js  # Folder tree assertions
│   │   └── select-message-by-subject.spec.js  # Find message in virtualized list
│   ├── Mail/
│   │   ├── send-new-email.spec.js        # Send email with TO / CC / BCC
│   │   ├── populate-new-email.spec.js    # Fill compose form without sending
│   │   ├── copilot-send-full-mail-pom.spec.js  # Full send using Copilot-assisted flow
│   │   ├── folder-toolbar.spec.js        # Folder toolbar actions (filter, sort, jump to)
│   │   └── reply-forward.spec.js         # Reply / Reply All / Forward from Sent Items
│   └── Event/
│       ├── new-event-manual.spec.js      # Create event with raw Playwright steps
│       ├── new-event-pom.spec.js         # Create standard event via POM
│       ├── new-event-pom-all-day.spec.js # Create all-day event
│       ├── new-event-pom-recurring.spec.js  # Create recurring event
│       ├── new-event-service.spec.js     # Create event using EventService layer
│       ├── new-event-toolbar.spec.js     # Set Status / Reminder / Privacy in toolbar
│       ├── new-event-toolbar-specific.spec.js  # Targeted toolbar option tests
│       ├── response-options.spec.js      # Event response options (Accept / Tentative / Decline)
│       ├── simple-recurring.spec.js      # Weekly / monthly recurring patterns
│       ├── recurring-5-days.spec.js      # Recurring event across 5 weekdays
│       └── edit-event.spec.js            # Create event, reopen it, edit title, verify update
└── playwright.config.js
```

---

## Page Objects

### `NewEmailCompose`

Compose a new email from scratch.

```js
const compose = new NewEmailCompose(page);
await compose.openNewMail();
await compose.to.add('recipient@example.com');
await compose.cc.add('cc@example.com');
await compose.subject.set('Hello');
await compose.body.set('Message body text.');
await compose.send.click();
```

### `NewEventCompose`

Full event compose form. Accessed via the `newEventPage` fixture or manually after `nav.clickNewEvent()`.

```js
await event.eventDetails.fillTitle('Team Sync');
await event.eventDetails.addRequiredAttendee('colleague@example.com');
await event.eventDetails.openTimeDropdown.setStartDate('18/03/2026');
await event.eventDetails.openTimeDropdown.setStartTime('10:00');
await event.eventDetails.openTimeDropdown.setEndTime('11:00');
await event.eventDetails.openTimeDropdown.close();
await event.eventDetails.setLocation('Conference Room 1');
await event.eventBody.setBody('Agenda: ...');
await event.eventToolbar.setStatus(Status.Busy);
await event.eventToolbar.setReminder(Reminder.FifteenMinutesBefore);
await event.save();
```

Recurring events:

```js
await event.clickSeriesButton();
await event.setRecurrenceFrequency('Weekly');
await event.setWeeklyDays(['Monday', 'Wednesday']);
await event.setRecurrenceUntil('30/06/2026');
```

### `MailFolders`

Navigate to a folder and select messages from a virtualized list.

```js
const mailFolders = new MailFolders(page);
await mailFolders.open('Sent Items');
await mailFolders.selectMessageBySubject('My subject');
```

### `CalendarNavigation`

Navigate from Mail to Calendar and open the New Event dialog.

```js
const nav = new CalendarNavigation(page);
await nav.goToCalendar();
await nav.clickNewEvent();
```

### `EventService`

High-level service that creates a full event in a single call.

```js
const svc = new EventService(page);
await svc.createAndSend({
  title: 'Sprint Review',
  attendee: 'team@example.com',
  startDate: '20/03/2026',
  startTime: '14:00',
  endTime: '15:00',
});
```

---

## Shared fixtures

`tests/fixtures.js` provides three Playwright fixtures that replace the repeated
`page.goto → CalendarNavigation → goToCalendar()` boilerplate in every test.

| Fixture | Navigates to | Provides |
|---|---|---|
| `mailPage` | Outlook Mail | `{ page, compose, mailFolders }` |
| `calendarPage` | Outlook Calendar | `{ page, nav }` |
| `newEventPage` | Calendar + New Event open | `{ page, nav, event }` |

Usage:

```js
import { test, expect } from '../fixtures.js';

test.use({ timeout: 180_000 });

test('my test', async ({ newEventPage }) => {
  const { page, event } = newEventPage;
  await event.eventDetails.fillTitle('My Event');
  // …
});
```

---

## Constants

All constants are in `pages/constants/` and should be used instead of hardcoded strings.

```js
import { Status, Reminder, Privacy, EventType } from '../constants/calendarOptions.js';

// Status options
Status.Free | Status.Busy | Status.Tentative | Status.Working_Elsewhere | Status.Out_Of_Office

// Reminder options
Reminder.FifteenMinutesBefore | Reminder.OneDayBefore | Reminder.OneWeekBefore // …

// Privacy
Privacy.Private | Privacy.NotPrivate

// Event type
EventType.Event | EventType.Series
```

---

## Authentication notes

- Session is stored in `storageState.json` (gitignored).
- All tests reuse this state via `storageState: 'storageState.json'` in `playwright.config.js`.
- Tests run with `headless: false` and `fullyParallel: true` by default.
- Run `tests/custom/auth.spec.js` to refresh the session when it expires.
