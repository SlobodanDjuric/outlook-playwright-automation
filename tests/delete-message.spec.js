import { test, expect } from "@playwright/test";
import { MailFolders } from "../pages/components/mailFolders.js";
import { Folders } from "../pages/constants/folders.js";

test('Delete draft email with subject "Random"', async ({ page }) => {
  // 1️⃣ Otvori Outlook
  await page.goto("https://outlook.live.com/mail/", {
    waitUntil: "domcontentloaded",
  });

  await expect(page.getByRole("button", { name: /new email/i }))
    .toBeVisible({ timeout: 45_000 });

  // 2️⃣ Otvori Drafts folder
  const mailFolders = new MailFolders(page);
  await mailFolders.open(Folders.Drafts);

  // 3️⃣ Pronađi mail sa subjectom "Random"
  const draftMail = page
    .getByRole("option", { name: /random/i })
    .first();

  await expect(draftMail).toBeVisible({ timeout: 30_000 });

  // 4️⃣ Desni klik (context menu)
  await draftMail.click({ button: "right" });

  // 5️⃣ Klik na Delete iz context menija
  const deleteOption = page.getByRole("menuitem", { name: /delete/i });
  await expect(deleteOption).toBeVisible({ timeout: 10_000 });
  await deleteOption.click();

  // 6️⃣ Verifikacija: mail više ne postoji u Drafts
  await expect(
    page.getByRole("option", { name: /random/i })
  ).toHaveCount(0);
});