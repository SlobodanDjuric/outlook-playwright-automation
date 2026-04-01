// tests/Mail/copilot-send-full-mail-pom.spec.js
// Variant of send-new-email.spec.js that uses explicit test.step blocks
// for better trace readability in the Playwright HTML report.

import { test, expect } from '@playwright/test';
import { NewEmailCompose } from '../../pages/page-objects/NewEmailCompose.js';

test.use({ timeout: 180_000 });

test('Outlook - Send full email (TO + CC + BCC + Subject + Body) - POM with steps', async ({ page }) => {
  const compose = new NewEmailCompose(page);

  const TO = 'test@example.com';
  const CC = 'cc@example.com';
  const BCC = 'bcc@example.com';
  const SUBJECT = `Playwright full send ${Date.now()}`;
  const BODY = 'This is a test message with TO + CC + BCC.';

  await test.step('Navigate to Outlook mail', async () => {
    await page.goto('https://outlook.live.com/mail/', {
      waitUntil: 'domcontentloaded',
    });
    await expect(page).toHaveURL(/outlook\.live\.com\/mail/i);
  });

  await test.step('Compose and send message', async () => {
    await compose.openNewMail();

    await compose.to.add(TO);
    await compose.cc.add(CC);
    await compose.bcc.add(BCC);

    await compose.subject.set(SUBJECT);
    await compose.body.set(BODY);

    await compose.send.click();
  });
});
