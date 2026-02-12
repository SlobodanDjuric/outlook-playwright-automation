// tests/to-cc-bcc-subject-body.spec.js
import { test, expect } from "@playwright/test";

/**
 * Verifies:
 * - TO, CC and BCC rows are rendered in correct order
 * - Recipients are committed into the correct row only
 * - Subject and Body fields can be filled
 *
 * This test intentionally does NOT send the email.
 */
test("Outlook - TO + CC + BCC + Subject + Body (verify rows, no send)", async ({
  page,
}) => {
  test.setTimeout(180_000);

  await page.goto("https://outlook.live.com/mail/", {
    waitUntil: "domcontentloaded",
  });
  await expect(page).toHaveURL(/outlook\.live\.com\/mail/i);

  // Test data
  const TO = "test@example.com";
  const CC = "cc@example.com";
  const BCC = "bcc@example.com";

  const SUBJECT = `Hello from Playwright ${Date.now()}`;
  const BODY = "Ovo je test poruka (TO + CC + BCC).";

  /**
   * Escapes email string so it can be safely used inside RegExp.
   */
  const emailRx = (email) =>
    new RegExp(email.replace(/[.*+?^${}()|[\]\\]/g, "\\$&"), "i");

  /**
   * Focuses the recipient editor for the given row (TO / CC / BCC).
   * Ensures that activeElement belongs to the correct container.
   */
  async function focusRecipient(kind /* "TO" | "CC" | "BCC" */) {
    const container = page.locator(`div[id$="_${kind}"]`).first();
    await expect(
      container,
      `Recipient container *_${kind} not found`
    ).toBeVisible({ timeout: 15_000 });

    const editor = container.locator('div[contenteditable="true"]').first();
    await expect(
      editor,
      `No contenteditable editor inside *_${kind}`
    ).toBeVisible({ timeout: 15_000 });

    for (let i = 0; i < 5; i++) {
      await editor.click({ force: true });

      const ok = await page.evaluate((suffix) => {
        const a = document.activeElement;
        if (!a) return false;
        return !!a.closest(`div[id$="_${suffix}"]`);
      }, kind);

      if (ok) return { container, editor };
      await page.waitForTimeout(150);
    }

    throw new Error(
      `Could not focus ${kind} editor (activeElement not inside *_${kind}).`
    );
  }

  /**
   * Asserts that one recipient row is visually rendered below another.
   * Used to validate correct vertical order (TO → CC → BCC).
   */
  async function assertRowBelow(prevBtn, nextBtn, label) {
    const a = await prevBtn.boundingBox();
    const b = await nextBtn.boundingBox();
    if (!a || !b) throw new Error(`Could not read bounding boxes for ${label}`);

    const delta = b.y - a.y;
    expect(
      delta,
      `${label}: not below (delta=${delta}px)`
    ).toBeGreaterThanOrEqual(5);
    expect(delta, `${label}: too far below (delta=${delta}px)`).toBeLessThan(
      90
    );
  }

  // Open compose panel
  const newMailButton = page.getByRole("button", {
    name: /new mail|new email/i,
  });
  await newMailButton.waitFor({ state: "visible", timeout: 30_000 });
  await newMailButton.click();

  const bodyRoot = page.getByLabel(/message body/i);
  await expect(bodyRoot).toBeVisible({ timeout: 30_000 });

  // TO: add recipient and verify it appears only in TO container
  const { container: toContainer } = await focusRecipient("TO");
  await page.keyboard.type(TO, { delay: 25 });
  await page.keyboard.press("Enter");
  await expect(toContainer.getByText(emailRx(TO))).toBeVisible({
    timeout: 10_000,
  });

  // CC: reveal row, verify position below TO, then add recipient
  const toBtn = page.locator("#recipient-well-label-to");
  const ccBtn = page.locator("#recipient-well-label-cc");

  await page.getByRole("button", { name: /^cc$/i }).first().click();
  await expect(ccBtn).toBeVisible({ timeout: 10_000 });

  await assertRowBelow(toBtn, ccBtn, "CC row vs TO row");

  const { container: ccContainer } = await focusRecipient("CC");
  await page.keyboard.type(CC, { delay: 25 });
  await page.keyboard.press("Enter");
  await expect(ccContainer.getByText(emailRx(CC))).toBeVisible({
    timeout: 10_000,
  });

  // Ensure CC recipient is not rendered under TO
  await expect(toContainer.getByText(emailRx(CC))).toHaveCount(0);

  // BCC: reveal row, verify position below CC, then add recipient
  await page.getByRole("button", { name: /^bcc$/i }).first().click();

  const bccBtn = page.locator("#recipient-well-label-bcc");
  await expect(bccBtn).toBeVisible({ timeout: 10_000 });

  await assertRowBelow(ccBtn, bccBtn, "BCC row vs CC row");

  const { container: bccContainer } = await focusRecipient("BCC");
  await page.keyboard.type(BCC, { delay: 25 });
  await page.keyboard.press("Enter");
  await expect(bccContainer.getByText(emailRx(BCC))).toBeVisible({
    timeout: 10_000,
  });

  // Ensure BCC recipient is not rendered under TO or CC
  await expect(toContainer.getByText(emailRx(BCC))).toHaveCount(0);
  await expect(ccContainer.getByText(emailRx(BCC))).toHaveCount(0);

  // Subject field
  const subjectInput = page.getByPlaceholder(/add a subject/i);
  await subjectInput.click();
  await subjectInput.fill(SUBJECT);

  // Body editor
  await bodyRoot.click();
  await page.keyboard.type(BODY, { delay: 10 });

  // Small delay kept intentionally for local debugging
  await page.waitForTimeout(1500);
});
