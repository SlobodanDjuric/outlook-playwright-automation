import { test, expect } from "@playwright/test";
import { MailFolders } from "../pages/components/mailFolders.js";
import { MailContextMenu } from "../pages/components/MailContextMenu.js";
import { Folders } from "../pages/constants/folders.js";
import { MailActions } from "../pages/constants/mailActions.js";

test('Flag email "Hello from Playwright" in Inbox', async ({ page }) => {
  // Otvori Outlook
  await page.goto("https://outlook.live.com/mail/", {
    waitUntil: "domcontentloaded",
  });

  await expect(page.getByRole("button", { name: /new email/i }))
    .toBeVisible({ timeout: 45_000 });

  // Otvori Inbox
  const mailFolders = new MailFolders(page);
  await mailFolders.open(Folders.Inbox);

  // Flaguj mail
  const contextMenu = new MailContextMenu(page);
  await contextMenu.applyActionToMail(
    "Hello from Playwright",
    MailActions.Flag
  );

  // (Opcionalna verifikacija – vidi se flag icon)
  const flaggedMail = page.getByRole("option", {
    name: /hello from playwright/i,
  });

  await expect(flaggedMail).toBeVisible();
});