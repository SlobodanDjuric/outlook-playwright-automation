import { test, expect } from '@playwright/test';

test('Send email from Outlook (using saved session)', async ({ page }) => {
  await page.goto('https://outlook.live.com/mail/', { waitUntil: 'domcontentloaded' });
  await page.waitForSelector('[role="main"]', { timeout: 30_000 });

  // Click "New email" (primary action)
  const newEmail = page.getByRole('button', { name: 'New email' });
  await expect(newEmail).toBeVisible({ timeout: 30_000 });
  await newEmail.click();

  // ---- Scope everything to the compose dialog/pane ----
  // Outlook usually opens compose in a dialog. We scope locators to avoid hitting Search textbox.
  const compose = page.getByRole('dialog').first();
  await expect(compose).toBeVisible({ timeout: 30_000 });

  // Wait until message body exists inside compose (signal that compose is fully loaded)
  const body = compose.locator('div[aria-label*="Message body"]');
  await expect(body).toBeVisible({ timeout: 30_000 });

  // TO field (People picker) - within compose only
  // Try common patterns; Outlook can render To as a contenteditable textbox.
  const toCandidates = [
    compose.locator('input[aria-label="To"]'),
    compose.locator('div[aria-label="To"] div[role="textbox"]'),
    compose.getByRole('textbox', { name: /^to$/i }),
    // fallback: first editable textbox in compose header area
    compose.locator('div[role="textbox"][contenteditable="true"]'),
  ];

  let toBox = null;
  for (const candidate of toCandidates) {
    if (await candidate.first().isVisible().catch(() => false)) {
      toBox = candidate.first();
      break;
    }
  }
  if (!toBox) throw new Error('TO field not found in compose dialog.');

  const recipient = 'test@example.com';

  await toBox.click();
  await toBox.fill(recipient);

  // Important: People picker often needs Enter to "commit" the recipient
  await page.keyboard.press('Enter');

  // Assert recipient got committed (chip or text present inside To area)
  // We keep it flexible: either a chip/title, or just the text.
  await expect(compose).toContainText(recipient, { timeout: 10_000 });

  // Subject (within compose)
  const subjectText = `Playwright test ${Date.now()}`;
  const subject = compose.locator('input[placeholder*="subject" i]');
  await expect(subject).toBeVisible({ timeout: 30_000 });
  await subject.fill(subjectText);

  // Body (within compose)
  await body.click();
  await body.fill('Sent via Playwright automation 🚀');

  // Send (within compose)
  const sendBtn = compose.locator('button[aria-label*="Send"]');
  await expect(sendBtn).toBeVisible({ timeout: 30_000 });
  await sendBtn.click();

  // ---- Verification: Sent Items contains the subject ----
  // This is much more reliable than toast text on Outlook.
  const sentFolder = page.getByRole('treeitem', { name: /sent items|poslate/i }).first();
  await expect(sentFolder).toBeVisible({ timeout: 30_000 });
  await sentFolder.click();

  // message list should show the subject
  await expect(page.getByText(subjectText).first()).toBeVisible({ timeout: 30_000 });
});