// tests/Calendar/calendar-views.spec.js
//
// Verifies that CalendarNavigation.switchToView() switches between all views.

import { test } from '../fixtures.js';
import { CalendarView } from '../../pages/constants/calendarOptions.js';

test.use({ timeout: 120_000 });

test('Switch to Day view', async ({ calendarPage }) => {
  const { nav } = calendarPage;

  await nav.switchToView(CalendarView.Day);
  await nav.verifyCurrentView(CalendarView.Day);
});

test('Switch to Work week view', async ({ calendarPage }) => {
  const { nav } = calendarPage;

  await nav.switchToView(CalendarView.WorkWeek);
  await nav.verifyCurrentView(CalendarView.WorkWeek);
});

test('Switch to Week view', async ({ calendarPage }) => {
  const { nav } = calendarPage;

  await nav.switchToView(CalendarView.Week);
  await nav.verifyCurrentView(CalendarView.Week);
});

test('Switch to Month view', async ({ calendarPage }) => {
  const { nav } = calendarPage;

  await nav.switchToView(CalendarView.Month);
  await nav.verifyCurrentView(CalendarView.Month);
});

test('goToToday — Today button navigates back to current week/day', async ({ calendarPage }) => {
  const { nav } = calendarPage;

  await nav.goToNextPeriod();
  await nav.goToToday();
  await nav.verifyTodayButtonVisible();
});
