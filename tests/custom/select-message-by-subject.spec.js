import { test, expect } from '@playwright/test';
import { MailFolders } from '../../pages/components/mailFolders.js';

test('Find sent mail by subject', async ({ page }) => {
  test.setTimeout(180_000);

  await page.goto('https://outlook.live.com/mail/', {
    waitUntil: 'domcontentloaded',
  });

  const mailFolders = new MailFolders(page);

  // open the Drafts folder
  await mailFolders.open('Drafts');

  // find and select the message by subject
  const SUBJECT = 'Hello from Playwrighterrr';
  await mailFolders.selectMessageBySubject(SUBJECT);

  // verify the subject appears in the reading pane
  await expect(page.getByRole('main').getByText(SUBJECT, { exact: true }).first()).toBeVisible({ timeout: 30_000 });
  await page.waitForTimeout(10000);
});
