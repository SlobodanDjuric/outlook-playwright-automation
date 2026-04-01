// tests/Calendar/online-meeting.spec.js
//
// Verifies the Teams / online meeting toggle in the new-event compose form.

import { test } from '../fixtures.js';

test.use({ timeout: 120_000 });

test('Teams meeting toggle — enabling adds a meeting link indicator', async ({ newEventPage }) => {
  const { event } = newEventPage;

  await event.fillTitle(`OnlineMeeting Test ${Date.now()}`);
  await event.setOnlineMeeting(true);
  await event.verifyOnlineMeeting(true);

  await event.discard();
});

test('Teams meeting toggle — disabling removes the meeting link indicator', async ({ newEventPage }) => {
  const { event } = newEventPage;

  await event.fillTitle(`OnlineMeeting Off Test ${Date.now()}`);
  await event.setOnlineMeeting(true);
  await event.setOnlineMeeting(false);
  await event.verifyOnlineMeeting(false);

  await event.discard();
});
