// tests/send-new-event-service.spec.js
// Uses EventService (lower-level API) instead of the POM compose dialog
import { test, expect } from '@playwright/test';
import { EventService } from '../../pages/outlook/eventService.js';

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

test('Outlook Calendar - Send new event (Service)', async ({ page }) => {
  test.setTimeout(120_000);

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
