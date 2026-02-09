import { test, expect } from "@playwright/test";
import { NewEmailCompose } from "../pages/outlook/NewEmailCompose.js";
import { MailFolders } from "../pages/components/mailFolders.js";

test("Send email from Outlook (POM)", async ({ page }) => {
  test.setTimeout(180_000);

  await page.goto("https://outlook.live.com/mail/", { waitUntil: "domcontentloaded" });

  const compose = new NewEmailCompose(page);
  const mailFolders = new MailFolders(page);

  const SUBJECT = "Hello from Playwright";
  const BODY = "Ovo je test poruka.";

  await compose.openNewMail();
  await compose.to.add("test@example.com");
  await compose.subject.set(SUBJECT);
  await compose.body.set(BODY);
  await compose.send.click();

  await page.waitForTimeout(5_000);

  await mailFolders.open("Sent Items");

  // ✅ klik na prvi mail iz Message list (scoped)
  const messageList = page.getByRole("listbox", { name: /message list/i });
  await expect(messageList).toBeVisible({ timeout: 30_000 });

  const firstOption = messageList.locator('[role="option"]').first();
  await expect(firstOption).toBeVisible({ timeout: 30_000 });

  // klikni u “telo” reda
  await firstOption.click({ force: true, position: { x: 60, y: 40 } });

  // ✅ čekaj da bude selektovan
  await expect(firstOption).toHaveAttribute("aria-selected", "true", { timeout: 30_000 });

  // ✅ proveri subject desno
  await expect(page.getByRole("main").getByText(SUBJECT, { exact: true }).first())
    .toBeVisible({ timeout: 30_000 });
});

