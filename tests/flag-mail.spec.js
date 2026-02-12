import { test, expect } from "@playwright/test";
import { MailFolders } from "../pages/components/mailFolders.js";
import { MailContextMenu } from "../pages/components/MailContextMenu.js";
import { Folders } from "../pages/constants/folders.js";
import { MailActions } from "../pages/constants/mailActions.js";

/**
 * Flags an existing email in Sent Items using the context menu.
 *
 * Precondition:
 * The email with subject "Hello from Playwright" must already exist
 * in the Sent Items before this test runs. This test does not create data.
 */
test('Flag email "Hello from Playwright" in Sent Items', async ({ page }) => {
  await page.goto("https://outlook.live.com/mail/", {
    waitUntil: "domcontentloaded",
  });

  await expect(
    page.getByRole("button", { name: /new email/i })
  ).toBeVisible({ timeout: 45_000 });

  /**
   * Open Sent Items using the MailFolders Page Object.
   */
  const mailFolders = new MailFolders(page);
  await mailFolders.open(Folders.SentItems);

  await page.pause()
  /**
   * Apply the "Flag" action through the context menu.
   * The target email must already be present in the message list.
   */
  const contextMenu = new MailContextMenu(page);
  await contextMenu.applyActionToMail(
    "Hello from Playwright",
    MailActions.Flag
  );

  /**
   * Basic verification:
   * Confirm that the message row is visible after the action.
   * (Icon-level validation could be added if needed.)
   */
  const flaggedMail = page.getByRole("option", {
    name: /hello from playwright/i,
  });

  await expect(flaggedMail).toBeVisible();
});
