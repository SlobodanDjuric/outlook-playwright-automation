// tests/Calendar/navigate-calendar.spec.js
//
// Verifies forward / backward navigation and the Today button via nav.getHeading().

import { test, expect } from '../fixtures.js';

test.use({ timeout: 120_000 });

test('goToNextPeriod — advances the calendar heading', async ({ calendarPage }) => {
  const { nav } = calendarPage;

  const before = await nav.getHeading();
  await nav.goToNextPeriod();
  const after = await nav.getHeading();

  expect(after).not.toBe('');
  if (before !== '') expect(after).not.toBe(before);
});

test('goToPreviousPeriod — retreats the calendar heading', async ({ calendarPage }) => {
  const { nav } = calendarPage;

  await nav.goToNextPeriod();
  const advanced = await nav.getHeading();

  await nav.goToPreviousPeriod();
  const retreated = await nav.getHeading();

  expect(retreated).not.toBe('');
  if (advanced !== '') expect(retreated).not.toBe(advanced);
});

test('goToToday — restores calendar to current period after two forward steps', async ({ calendarPage }) => {
  const { nav } = calendarPage;

  const original = await nav.getHeading();

  await nav.goToNextPeriod();
  await nav.goToNextPeriod();
  await nav.goToToday();

  const restored = await nav.getHeading();
  if (original !== '') expect(restored).toBe(original);
});
