import { test, expect } from "@playwright/test";

test("Send email from Outlook", async ({ page }) => {
  await page.goto("https://outlook.live.com/mail/", {waitUntil: "domcontentloaded",});
  await expect(page).toHaveURL(/outlook\.live\.com\/mail/i);

  // New mail
  const newMailButton = page.getByRole("button", {name: /new mail|new email/i,});
  await newMailButton.waitFor({ state: "visible", timeout: 30_000 });
  await newMailButton.click();

  // (Opcionalno) čekaj da se compose pojavi
  const body = page.getByLabel(/message body/i);
  await expect(body).toBeVisible({ timeout: 30_000 });

  // 3. TO (ne klikći "To" dugme - otvara popup)
  // klikni u prazno polje desno od "To", pa kucaj
  const toWell = page.locator("#recipient-well-label-to").locator("xpath=../..");

  // klikni malo desno od "To" da aktivira recipient input
  await toWell.click({ position: { x: 140, y: 20 }, force: true });

  // kucaj kao korisnik (Outlook često ignoriše fill)
  await page.keyboard.type("test@example.com", { delay: 30 });
  await page.keyboard.press("Enter");

  // (opciono) potvrdi da se recipient pojavio
  await expect(page.getByText("test@example.com")).toBeVisible({timeout: 10_000,});

  // Subject
  const subjectText = page.getByRole("textbox", {name: /add a subject|subject/i,});
  await subjectText.fill("Playwright test email");

  // Body
  await body.click();
  await body.fill("Hello 👋\n\nThis email was sent by Playwright automation.");

  // Send
  await page.getByRole("button", { name: /^send$/i }).click();

  // ---- Verification: Sent Items contains the subject ----
  // This is much more reliable than toast text on Outlook.
  const sentFolder = page.getByRole("treeitem", { name: /sent items|poslate/i }).first();
  await expect(sentFolder).toBeVisible({ timeout: 30_000 });
  await sentFolder.click();

  // message list should show the subject
  await expect(page.getByText(subjectText).first()).toBeVisible({timeout: 30_000,});
});

