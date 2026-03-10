import { test, expect } from '@playwright/test';
import { MailFolders } from '../../pages/components/mailFolders.js';

test('Find sent mail by subject', async ({ page }) => {
  test.setTimeout(180_000);

  await page.goto('https://outlook.live.com/mail/', {
    waitUntil: 'domcontentloaded',
  });

  const mailFolders = new MailFolders(page);

  // 1️⃣ otvori Outlook
  // 2️⃣ selektuj Sent Items
  await mailFolders.open('Drafts');

  // 3️⃣ nadji i selektuj mail po subjectu
  const SUBJECT = 'Hello from Playwrighterrr';
  await mailFolders.selectMessageBySubject(SUBJECT);

  // potvrda desno
  await expect(page.getByRole('main').getByText(SUBJECT, { exact: true }).first()).toBeVisible({ timeout: 30_000 });
  await page.waitForTimeout(10000);
});
