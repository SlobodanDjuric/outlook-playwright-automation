// tests/Event/new-event-service.spec.js
// Creates and sends a calendar event using the EventService high-level API.
// EventService wraps CalendarNavigation + NewEventCompose into a single call,
// making this the simplest way to test the full event creation flow.
import { test, expect } from '@playwright/test';
import { EventService } from '../../pages/page-objects/EventService.js';
import { futureDateDDMMYYYY } from '../utils/dateHelpers.js';

test.use({ timeout: 120_000 });

test('Outlook Calendar - Send new event (Service)', async ({ page }) => {

  await page.goto('https://outlook.live.com/mail/', {
    waitUntil: 'domcontentloaded',
  });
  await expect(page.getByRole('button', { name: /new email/i })).toBeVisible({
    timeout: 45_000,
  });

  const service = new EventService(page);

  await service.createAndSend({
    title: `PW Service Event ${Date.now()}`,
    attendee: 'slobodan_sj88@yahoo.com',
    startDate: futureDateDDMMYYYY(60),
    startTime: '18:15',
    endTime: '19:00',
    location: 'Conference 3',
    body: 'Test body message (Service).',
  });

  await page.waitForTimeout(3000);
});
