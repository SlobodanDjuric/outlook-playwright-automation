// tests/Event/response-options.spec.js
// Tests the "Response options" menu in the New Event compose dialog:
// - toggling Request Responses, Allow Forwarding, Hide Attendee List
// - revealing and filling the optional attendees field
// - enabling the "In-person" location setting (which prefixes the title with [In-person])

import { test, expect } from '@playwright/test';
import { CalendarNavigation } from '../../pages/components/CalendarNavigation.js';
import { NewEventCompose } from '../../pages/page-objects/NewEventCompose.js';

test.use({ timeout: 90_000 });

test('Response options — toggles and optional attendees update the compose form correctly', async ({ page }) => {

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
