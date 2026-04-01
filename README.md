# Outlook Playwright Automation

QA automation framework for Microsoft Outlook Web using [Playwright](https://playwright.dev/) and the Page Object Model (POM) pattern.

---

## Requirements

- Node.js 18+
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

# Run a specific folder
npx playwright test tests/Mail/
npx playwright test tests/Event/
npx playwright test tests/Calendar/

# Run a specific file
npx playwright test tests/Mail/send-new-email.spec.js

# Open the HTML report after a run
npx playwright show-report
```

Available npm scripts:

```bash
npm test                  # Run all tests
npm run test:mail         # Run Mail/ tests
npm run test:event        # Run Event/ tests
npm run test:auth         # Run auth setup only
npm run report            # Open HTML report
```

---

## Project structure

```
├── pages/
│   ├── components/
│   │   ├── CalendarNavigation.js   # Navigate Mail→Calendar, switch views, open New Event
│   │   ├── CalendarEvent.js        # Find and open/delete existing events on the grid
│   │   ├── FolderTree.js           # Folder tree: right-click context menu + ellipsis hover menu
│   │   ├── MailContextMenu.js      # Right-click context menu on message items
│   │   ├── MailFolders.js          # Folder navigation, message selection, reading pane actions
│   │   └── MailSearchBar.js        # Search input, query submission, result filtering
│   ├── constants/
│   │   ├── calendarFields.js       # Selectors for calendar compose fields (date, time, title…)
│   │   ├── calendarOptions.js      # Enums: Status, Reminder, Privacy, RecurrenceFrequency, CalendarView…
│   │   ├── folders.js              # Standard folder names (Inbox, Sent Items, Drafts…)
│   │   ├── mailActions.js          # Context menu action labels
│   │   ├── mailFields.js           # Selectors for mail compose fields (To, Cc, Body…)
│   │   └── mailOptions.js          # Enums: SortOptions, MailFilterOptions, JumpToOptions
│   └── page-objects/
│       ├── NewEventCompose.js      # Event compose POM (title, attendees, date/time, recurrence, toolbar)
│       ├── NewEmailCompose.js      # Email compose POM (To/Cc/Bcc, Subject, Body, attachments)
│       └── EventService.js         # High-level service: create & send event in one call
├── tests/
│   ├── fixtures.js                 # Shared Playwright fixtures
│   ├── utils/
│   │   └── dateHelpers.js          # Date formatting utilities
│   ├── Calendar/                   # Calendar feature tests
│   ├── Constants/                  # Constant value coverage tests
│   ├── Event/                      # Event creation & editing tests
│   ├── FolderTree/                 # Folder tree & search bar tests
│   ├── Mail/                       # Mail sending & management tests
│   ├── MailCompose/                # Compose dialog feature tests
│   ├── ReadingPane/                # Reading pane action tests
│   └── custom/                     # Auth setup & misc checks
└── playwright.config.js
```

---

## Fixtures

`tests/fixtures.js` provides three fixtures that handle navigation and POM setup.
Import them instead of `@playwright/test` in every test file:

```js
import { test, expect } from '../fixtures.js';
```

### `mailPage` — Outlook Mail

Navigates to the Mail view and waits until the UI is ready.

```js
test('example', async ({ mailPage }) => {
  const {
    page,             // Playwright Page
    compose,          // NewEmailCompose
    mailFolders,      // MailFolders  — folder nav & message list
    folder,           // MailFolder   — folder nav + toolbar (sortBy, filter, jumpTo)
    readingPane,      // MailReadingPane — reply, flag, delete, more actions
    contextMenu,      // MailContextMenu
    subContextMenu,   // SubContextMenu
    folderContextMenu,// FolderTreeContextMenu
    searchBar,        // MailSearchBar
    conversationThread,// ConversationThread
    eventService,     // EventService
  } = mailPage;
});
```

### `calendarPage` — Outlook Calendar

Navigates to the Calendar view.

```js
test('example', async ({ calendarPage }) => {
  const {
    page,
    nav,                  // CalendarNavigation — view switching, forward/back/today
    calendarEventActions, // CalendarEventActions — open/delete events by title
    meetingResponse,      // MeetingResponse — accept/decline/tentative
  } = calendarPage;
});
```

### `newEventPage` — Calendar + New Event open

Extends `calendarPage` and opens the New Event compose dialog.

```js
test('example', async ({ newEventPage }) => {
  const {
    page,
    nav,
    event,  // NewEventCompose — fill title, date/time, attendees, recurrence, save
    calendarEventActions,
    meetingResponse,
  } = newEventPage;
});
```

---

## Page Objects

### `NewEmailCompose`

```js
await compose.openNewMail();
await compose.to.add('recipient@example.com');
await compose.cc.add('cc@example.com');
await compose.bcc.add('bcc@example.com');
await compose.subject.set('Hello');
await compose.body.set('Message body.');
await compose.attach('/path/to/file.pdf');
await compose.send();

// Assertions
await compose.verifyAttachment('file.pdf');
await compose.body.verifyHidden();          // compose form closed
await compose.verifyPopOutBodyVisible(newPage);
```

### `NewEventCompose`

```js
await event.fillTitle('Team Sync');
await event.setStartDate('18/03/2026');
await event.setStartTime('10:00');
await event.setEndTime('11:00');
await event.eventDetails.openTimeDropdown.close();
await event.addRequiredAttendee('colleague@example.com');
await event.setLocation('Conference Room 1');
await event.setBody('Agenda: ...');
await event.setStatus(Status.Busy);
await event.setReminder(Reminder.FifteenMinutesBefore);
await event.setOnlineMeeting(true);
await event.save();

// Assertions
await event.verifyTitle('Team Sync');
await event.verifyOnlineMeeting(true);
await event.verifyEndDateContains('19');
await event.verifyCategoryVisible('Red Category');

// Cleanup
await event.discard();   // discard unsaved changes
await event.delete();    // delete a saved event from within the compose form
```

Recurring events:

```js
const recurrence = await event.makeRecurring.clickRecurrenceOption();
await recurrence.setRecurrenceFrequency(RecurrenceFrequency.Weekly);
await recurrence.setWeeklyDays([WeekDays.Monday, WeekDays.Wednesday]);
await recurrence.setRecurrenceUntil('30/06/2026');

// Assertions (for Constants tests)
await recurrence.openFrequencyDropdown();
await recurrence.verifyFrequencyOptionVisible('Week');
await recurrence.verifyWeekDayVisible('Monday');
```

### `CalendarNavigation`

```js
await nav.goToCalendar();
await nav.clickNewEvent();
await nav.switchToView(CalendarView.Day);
await nav.goToNextPeriod();
await nav.goToPreviousPeriod();
await nav.goToToday();
await nav.goToNextDay();

const heading = await nav.getHeading(); // e.g. "March 2026"

// Assertions
await nav.verifyCurrentView(CalendarView.Day);
await nav.verifyViewButtonVisible('Week');
await nav.verifyTodayButtonVisible();
```

### `FolderTreeContextMenu`

Right-click context menu and three-dots hover menu for folders in the folder tree.

```js
// --- Right-click context menu ---
await folderContextMenu.createNewSubfolder('Inbox', 'My Subfolder');
await folderContextMenu.renameFolder('My Subfolder', 'Renamed Folder');
await folderContextMenu.deleteFolder('Renamed Folder');
await folderContextMenu.emptyFolder('Deleted Items');
await folderContextMenu.markAllAsRead('Inbox');
await folderContextMenu.addToFavourites('Sent Items');
await folderContextMenu.removeFromFavourites('Sent Items');

// Assertions
await folderContextMenu.verifyFolderVisible('My Subfolder');
await folderContextMenu.verifyFolderHidden('My Subfolder');
await folderContextMenu.verifyMenuContains('Inbox', 'Rename');

// --- Three-dots (ellipsis) hover menu ---

// Hover a folder row → click "..." → create subfolder inside it
await folderContextMenu.createNewFolderViaEllipsis('Inbox', 'My Subfolder');

// Hover the account row (user@outlook.com) → click "..." → create top-level folder
await folderContextMenu.createNewFolderUnderAccount('My New Folder');
```

### `MailFolders`

```js
await mailFolders.open('Sent Items');
await mailFolders.selectFirstMessage();
await mailFolders.selectMessageBySubject('Invoice March');

await mailFolders.verifyMessageVisible('Invoice March');
await mailFolders.verifyMessageHidden('Old subject');
await mailFolders.verifyMessageListVisible();
await mailFolders.verifyFolderInTree('Sent Items');
```

### `MailFolder` (folder + toolbar combined)

```js
await folder.open('Deleted Items');
await folder.toolbar.sortBy(SortOptions.Date);
await folder.toolbar.openSortDropdown();
await folder.toolbar.openFilterDropdown();
await folder.toolbar.openJumpToDropdown();

// Assertions
await folder.toolbar.verifyMenuItemVisible('Date');
await folder.toolbar.verifyJumpToButtonHidden('Jump To not expected here');
```

### `MailReadingPane`

```js
await readingPane.reply();
await readingPane.replyAll();
await readingPane.forward();
await readingPane.waitForComposeReady();
await readingPane.typeReplyBody('Hello!');
await readingPane.send();
await readingPane.discard();
await readingPane.delete();
await readingPane.flag();
await readingPane.markAsRead();
await readingPane.markAsUnread();
await readingPane.moreActions();
await readingPane.printMessage();
await readingPane.openInNewWindow();
const download = await readingPane.downloadAttachments();

// Assertions
await readingPane.verifySendButtonHidden();
await readingPane.verifyFlagButtonVisible();
await readingPane.verifyMoreActionsMenuVisible();
const hasAttach = await readingPane.hasAttachments(); // boolean
```

### `EventService`

High-level service that creates and sends a complete event in one call:

```js
await eventService.createAndSend({
  title: 'Sprint Review',
  attendee: 'team@example.com',
  startDate: '20/03/2026',
  startTime: '14:00',
  endTime: '15:00',
});
```

---

## Constants

All string values used in the UI are defined as constants in `pages/constants/`.
Always import and use constants instead of hardcoding strings.

```js
import { Status, Reminder, Privacy, EventType, CalendarView, RecurrenceFrequency, WeekDays } from '../constants/calendarOptions.js';
import { Folders } from '../constants/folders.js';
import { SortOptions, MailFilterOptions, JumpToOptions } from '../constants/mailOptions.js';
```

| Constant | Values |
|---|---|
| `Status` | `Free`, `Busy`, `Tentative`, `Working_Elsewhere`, `Out_Of_Office` |
| `Reminder` | `NoneNoneSet`, `FiveMinutesBefore`, `FifteenMinutesBefore`, `OneHourBefore`, `OneDayBefore`, … |
| `Privacy` | `Private`, `NotPrivate` |
| `EventType` | `Event`, `Series` |
| `CalendarView` | `Day`, `WorkWeek`, `Week`, `Month` |
| `RecurrenceFrequency` | `Daily`, `Weekly`, `Monthly`, `Yearly` |
| `WeekDays` | `Sunday`, `Monday`, `Tuesday`, `Wednesday`, `Thursday`, `Friday`, `Saturday` |
| `Folders` | `Inbox`, `Drafts`, `SentItems`, `DeletedItems`, `JunkEmail`, `Archive`, `Outbox`, … |
| `SortOptions` | `Date`, `From`, `Subject`, `Size`, `Category`, `Importance`, `FlagStatus`, `Type` |
| `MailFilterOptions` | `All`, `Unread`, `Flagged`, `Mentioned`, `HasFiles`, … |
| `JumpToOptions` | `ByDate`, `ByCategory`, `BySize`, `ByImportance` (each is a nested object of options) |

---

## Test suites

| Folder | What's tested |
|---|---|
| `tests/Calendar/` | View switching, navigation, event create/open/delete, recurrence, Teams link, categories |
| `tests/Event/` | Event creation (standard, all-day, recurring), toolbar options, editing, service layer |
| `tests/Mail/` | Send, reply, forward, draft, delete, flag, categorize, move, folder toolbar, search |
| `tests/MailCompose/` | Attach file, format text, importance, schedule send, read receipt, pop-out, discard |
| `tests/ReadingPane/` | Reply/send, discard, delete, flag, mark as read, more actions, print, download, open in window |
| `tests/FolderTree/` | Folder context menu (create/rename/delete/empty), ellipsis hover menu (create top-level folder), search bar, conversation threads |
| `tests/Constants/` | Verifies that every constant value maps to a real UI element |
| `tests/custom/` | Auth setup, folder structure checks |

---

## Writing a new test

1. Import from `fixtures.js` (not `@playwright/test`) to get pre-configured POMs.
2. Pick the right fixture (`mailPage`, `calendarPage`, `newEventPage`).
3. Use only POM methods and constants — no raw `page.getByRole()` in tests.
4. Set a timeout via `test.use({ timeout: 120_000 })` at the top of the file.

```js
// tests/Mail/my-test.spec.js
import { test, expect } from '../fixtures.js';
import { Folders } from '../../pages/constants/folders.js';

test.use({ timeout: 120_000 });

test('my test description', async ({ mailPage }) => {
  const { mailFolders, readingPane } = mailPage;

  await mailFolders.open(Folders.SentItems);
  await mailFolders.selectFirstMessage();
  await readingPane.flag();
  await readingPane.verifyFlagButtonVisible();
  await readingPane.flag(); // restore
});
```

---

## Authentication notes

- Session is stored in `storageState.json` (gitignored).
- All tests reuse this state via `storageState: 'storageState.json'` in `playwright.config.js`.
- Tests run with `headless: false` and `fullyParallel: true` by default.
- Default timeout: 120 seconds per test (override with `test.use({ timeout: N })`).
- Run `tests/custom/auth.spec.js` to refresh the session when it expires.
