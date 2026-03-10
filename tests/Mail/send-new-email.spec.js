// tests/send-full-mail-pom.spec.js
import { test, expect } from '@playwright/test';
import { NewEmailCompose } from '../../pages/outlook/NewEmailCompose.js';
import { MailFolders } from '../../pages/components/mailFolders.js';

test('Outlook - Send full email (TO + CC + BCC + Subject + Body) - POM', async ({ page }) => {
  test.setTimeout(180_000);

  await page.goto('https://outlook.live.com/mail/', {
    waitUntil: 'domcontentloaded',
  });
  await expect(page).toHaveURL(/outlook\.live\.com\/mail/i);

  /**
   * This test uses Page Objects to keep the flow readable:
   * - open compose
   * - fill TO/CC/BCC, subject and body
   * - send
   * - verify the message appears in Sent Items
   */
  const compose = new NewEmailCompose(page);
  const mailFolders = new MailFolders(page);

  const TO = 'test@example.com';
  const CC = 'cc@example.com';
  const BCC = 'bcc@example.com';

  const SUBJECT = `Playwright full send ${Date.now()}`;
  const BODY = 'Ovo je test poruka sa TO + CC + BCC.';

  await compose.openNewMail();

  // Recipients must be committed row-by-row because Outlook can keep focus in the wrong field.
  await compose.to.add(TO);
  await compose.cc.add(CC);
  await compose.bcc.add(BCC);

  // Fill subject and body content.
  await compose.subject.set(SUBJECT);
  await compose.body.set(BODY);

  // Send the email.
  await compose.send.click();

  // Small delay to allow Outlook to finish post-send UI transitions.
  await page.waitForTimeout(4000);

  /**
   * Verification:
   * - Open Sent Items
   * - Select the first message in the message list
   * - Assert that the details pane contains the expected subject
   */
  await mailFolders.open('Sent Items');

  const messageList = page.getByRole('listbox', { name: /message list/i });
  await expect(messageList).toBeVisible({ timeout: 30_000 });

  const firstOption = messageList.locator('[role="option"]').first();
  await expect(firstOption).toBeVisible({ timeout: 30_000 });

  // Click inside the row to avoid edge cases where click lands on a non-interactive region.
  await firstOption.click({ force: true, position: { x: 60, y: 40 } });

  await expect(firstOption).toHaveAttribute('aria-selected', 'true', {
    timeout: 30_000,
  });

  await expect(page.getByRole('main').getByText(SUBJECT, { exact: true }).first()).toBeVisible({ timeout: 30_000 });
});
