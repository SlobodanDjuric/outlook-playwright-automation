import { test, expect } from "@playwright/test";
import { NewEmailCompose } from "../pages/outlook/NewEmailCompose.js";
import { MailFolders } from "../pages/components/mailFolders.js";
import { Folders } from "../pages/constants/folders.js";

test("Send email from Outlook (To + Cc + Bcc) - POM", async ({ page }) => {
  test.setTimeout(180_000);

  await page.goto("https://outlook.live.com/mail/", {
    waitUntil: "domcontentloaded",
  });

  await expect(
    page.getByRole("button", { name: /new email|new mail/i })
  ).toBeVisible({ timeout: 45_000 });

  const compose = new NewEmailCompose(page);
  const mailFolders = new MailFolders(page);

  const SUBJECT = `Hello from Playwright ${Date.now()}`;
  const BODY = "Ovo je test poruka (To + Cc + Bcc).";

  await compose.openNewMail();

  await compose.to.add("to@example.com");
  await page.pause();

  await compose.cc.add("cc@example.com");
  await page.pause();

  await compose.bcc.add("bcc@example.com");
  await page.pause();

  await compose.subject.set(SUBJECT);
  await compose.body.set(BODY);

  await compose.send.click();

  await page.waitForTimeout(5_000);

  await mailFolders.open(Folders.SentItems);

  const messageList = page.getByRole("listbox", { name: /message list/i });
  await expect(messageList).toBeVisible({ timeout: 30_000 });

  const sentMail = messageList
    .getByRole("option", { name: new RegExp(SUBJECT, "i") })
    .first();

  await expect(sentMail).toBeVisible({ timeout: 30_000 });
  await sentMail.click({ force: true, position: { x: 60, y: 40 } });

  await expect(
    page.getByRole("main").getByText(SUBJECT, { exact: true }).first()
  ).toBeVisible({ timeout: 30_000 });
});
