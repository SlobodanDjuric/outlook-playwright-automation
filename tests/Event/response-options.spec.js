import { test, expect } from '@playwright/test';
import { CalendarNavigation } from '../../pages/components/CalendarNavigation.js';
import { NewEventCompose } from '../../pages/outlook/NewEventCompose.js';

function pad2(n) {
  return String(n).padStart(2, '0');
}

function formatDDMMYYYY(date) {
  return `${pad2(date.getDate())}/${pad2(date.getMonth() + 1)}/${date.getFullYear()}`;
}

function futureDateDDMMYYYY(daysAhead = 30) {
  const d = new Date();
  d.setDate(d.getDate() + daysAhead);
  return formatDDMMYYYY(d);
}

// because this is a minimal test we only need a single attendee and basic
// navigation; most of the complex interactions are encapsulated in the POM.

test('Response options toggles behave correctly', async ({ page }) => {
  test.setTimeout(90_000);

  const TITLE = `Resp options ${Date.now()}`;
  const ATTENDEE = 'foo@example.com';

  await page.context().grantPermissions(['geolocation']);
  await page.goto('https://outlook.live.com/mail/', {
    waitUntil: 'domcontentloaded',
  });

  await expect(page.getByRole('button', { name: /new email/i })).toBeVisible({
    timeout: 45_000,
  });

  const nav = new CalendarNavigation(page);
  await nav.goToCalendar();
  await nav.clickNewEvent();

  const event = new NewEventCompose(page);
  await event.waitUntilOpen();

  await event.eventDetails.fillTitle(TITLE);
  await event.eventDetails.addRequiredAttendee(ATTENDEE);

  // open the response options menu and adjust toggles directly using the
  // restricted setResponseOption object exposed by the helper.
  await event.eventDetails.openResponseOptions.setResponseOption.RequestResponses(true);
  await event.eventDetails.openResponseOptions.setResponseOption.AllowForwarding(false);
  await event.eventDetails.openResponseOptions.setResponseOption.HideAttendeeList(true);

  // toggling the same option again is still allowed
  await event.eventDetails.openResponseOptions.setResponseOption.AllowForwarding(true);

  // use the same namespace to open the "add optional attendees" menu item
  await event.eventDetails.openResponseOptions.setResponseOption.addOptionalAttendees();

  // fill the newly exposed optional attendee field
  await event.eventDetails.addOptionalAttendee('bar@example.com');

  // toggle in-person via location settings helper (under eventDetails)
  await event.eventDetails.openLocationSettings.setInPersonEvent(true);
  const titleValue = await event.eventDetails.titleInput.inputValue();
  expect(titleValue).toContain('[In-person]');

  // short pause to observe state (not strictly necessary)
  await page.waitForTimeout(1000);
});
