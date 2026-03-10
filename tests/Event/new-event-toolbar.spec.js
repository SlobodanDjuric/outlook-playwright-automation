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

// This test covers a variety of toolbar interactions on the "New event" dialog
// including toggling into a series, cycling through availability/status
// options, picking different reminder values and flipping the private toggle.
// It only fills a title and then saves the event (no attendees or body).

test('Outlook Calendar - toolbar buttons (series/status/reminder/privacy)', async ({ page }) => {
  test.setTimeout(120_000);

  const TITLE = `Toolbar testing ${Date.now()}`;

  await test.step('Navigate to calendar and open new event', async () => {
    await page.goto('https://outlook.live.com/mail/', {
      waitUntil: 'domcontentloaded',
    });

    // ensure we are logged in by checking presence of a known element
    await expect(page.getByRole('button', { name: /new email/i })).toBeVisible({
      timeout: 45_000,
    });

    const nav = new CalendarNavigation(page);
    await nav.goToCalendar();
    await nav.clickNewEvent();
  });

  const event = new NewEventCompose(page);

  await test.step('Fill basic details', async () => {
    await event.waitUntilOpen();
    await event.eventDetails.fillTitle(TITLE);
  });

  await test.step('Toggle series button', async () => {
    await event.eventToolbar.clickSeriesButton();
  });

  await test.step('Cycle through status options', async () => {
    const statuses = ['Free', 'Working elsewhere', 'Tentative', 'Busy', 'Out of office'];
    for (const s of statuses) {
      await event.eventToolbar.setStatus(s);
    }
  });

  await test.step('Cycle through reminders', async () => {
    const reminders = ["Don't remind me", 'At time of event', '5 minutes before', '15 minutes before', '30 minutes before', '1 hour before', '2 hours before', '12 hours before', '1 day before', '1 week before'];
    for (const r of reminders) {
      await event.eventToolbar.setReminder(r);
    }
  });

  await test.step('Cycle through privacy options and save', async () => {
    // Toggle between Private and Not private
    await event.eventToolbar.setPrivacy('Private');
    await event.eventToolbar.setPrivacy('Not private');
    await event.save();
  });
});
