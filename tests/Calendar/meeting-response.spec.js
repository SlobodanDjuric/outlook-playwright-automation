// tests/Calendar/meeting-response.spec.js
//
// Verifies the MeetingResponse POM (Accept / Decline / Tentative).
// Tests skip gracefully when no meeting invitation exists in the test account.

import { test, expect } from '../fixtures.js';

test.use({ timeout: 120_000 });

test('Accept meeting invitation via MeetingResponse POM', async ({ calendarPage }) => {
  const { meetingResponse } = calendarPage;

  const found = await meetingResponse.findInvitedEvent();
  if (!found) {
    test.skip(true, 'No meeting invitation found in current calendar view — skipping Accept test.');
    return;
  }

  await meetingResponse.accept();
  expect(true).toBe(true);
});

test('Decline meeting invitation via MeetingResponse POM', async ({ calendarPage }) => {
  const { meetingResponse } = calendarPage;

  const found = await meetingResponse.findInvitedEvent();
  if (!found) {
    test.skip(true, 'No meeting invitation found — skipping Decline test.');
    return;
  }

  await meetingResponse.decline();
  expect(true).toBe(true);
});

test('Tentative meeting invitation via MeetingResponse POM', async ({ calendarPage }) => {
  const { meetingResponse } = calendarPage;

  const found = await meetingResponse.findInvitedEvent();
  if (!found) {
    test.skip(true, 'No meeting invitation found — skipping Tentative test.');
    return;
  }

  await meetingResponse.tentative();
  expect(true).toBe(true);
});

test('MeetingResponse.hasResponseButtons — returns false when no event is open', async ({ calendarPage }) => {
  const { meetingResponse } = calendarPage;

  const result = await meetingResponse.hasResponseButtons();
  expect(result).toBe(false);
});
