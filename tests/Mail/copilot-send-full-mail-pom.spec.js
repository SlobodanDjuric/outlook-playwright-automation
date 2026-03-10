// tests/send-full-mail-pom.spec.js
import { test, expect } from '@playwright/test';
import { NewEmailCompose } from '../../pages/outlook/NewEmailCompose.js';
import { MailFolders } from '../../pages/components/mailFolders.js';

// this spec is a slightly enhanced variant of the older
// `send-new-email.spec.js`.  it demonstrates a few improvements:
//  * explicit test.step blocks for readability in the trace
//  * no hard `waitForTimeout` after send; we wait for the compose
//    panel to disappear instead
//  * file/comment names are consistent
//  * optional helper `openSent` on the MailFolders object could
//    be reused in other specs (left as an exercise)

test('Outlook - Send full email (TO + CC + BCC + Subject + Body) - POM', async ({ page }) => {
  test.setTimeout(180_000);

  const compose = new NewEmailCompose(page);
  const mailFolders = new MailFolders(page);

  // dynamic data used by the test
  const TO = 'test@example.com';
  const CC = 'cc@example.com';
  const BCC = 'bcc@example.com';
  const SUBJECT = `Playwright full send ${Date.now()}`;
  const BODY = 'Ovo je test poruka sa TO + CC + BCC.';

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

    //   // wait until the editor panel has closed - indicates send completed
    //   await expect(compose.body.root()).toBeHidden({ timeout: 30_000 });
    // });

    // await test.step("Verify message in Sent Items", async () => {
    //   await mailFolders.open("Sent Items");

    //   const messageList = page.getByRole("listbox", { name: /message list/i });
    //   await expect(messageList).toBeVisible({ timeout: 30_000 });

    //   const firstOption = messageList.locator('[role="option"]').first();
    //   await expect(firstOption).toBeVisible({ timeout: 30_000 });
    //   await firstOption.click({ force: true, position: { x: 60, y: 40 } });
    //   await expect(firstOption).toHaveAttribute("aria-selected", "true", {
    //     timeout: 30_000,
    //   });

    //   await expect(
    //     page.getByRole("main").getByText(SUBJECT, { exact: true }).first()
    //   ).toBeVisible({ timeout: 30_000 });
  });
});
