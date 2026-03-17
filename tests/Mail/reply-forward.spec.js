// tests/Mail/reply-forward.spec.js
import { test, expect } from '../fixtures.js';

// All tests in this file navigate to Outlook and need extra time for auth + page load.
test.use({ timeout: 180_000 });

/**
 * Reply / Reply All / Forward tests.
 *
 * Strategy:
 * - Open Sent Items (always has messages from previous test runs).
 * - Select the first (most recent) message — no seed email needed.
 * - Trigger the action via the Outlook toolbar.
 * - Verify that the inline compose form opened (Send button + Message body).
 *
 * Outlook Web layout notes:
 * - "Reply all" is a direct button in the toolbar (outside role="main").
 * - "Reply" and "Forward" live in the "Expand to see more respond options" dropdown.
 * - Reply / Reply All open an INLINE form at the bottom of the reading pane
 *   (no editable subject field — subject is pre-populated internally).
 * - Forward may open the full compose panel.
 * - In all cases, the presence of the "Send" button confirms the form is ready.
 */

// ── helpers ──────────────────────────────────────────────────────────────────

/**
 * Opens Sent Items and clicks the first message in the list.
 */
async function openFirstSentMessage(page, mailFolders) {
  await mailFolders.open('Sent Items');

  const messageList = page.getByRole('listbox', { name: /message list/i });
  await expect(messageList).toBeVisible({ timeout: 30_000 });

  const firstMsg = messageList.locator('[role="option"]').first();
  await expect(firstMsg).toBeVisible({ timeout: 30_000 });
  await firstMsg.click({ force: true, position: { x: 60, y: 40 } });
  await expect(firstMsg).toHaveAttribute('aria-selected', 'true', { timeout: 30_000 });
}

/**
 * Triggers the given respond action from the Outlook mail toolbar.
 *
 * - "Reply all"  → direct toolbar button (outside the main landmark).
 * - "Reply"      → "Expand to see more respond options" dropdown → menuitem.
 * - "Forward"    → same dropdown → menuitem.
 */
async function clickRespondAction(page, actionName) {
  if (/^reply all$/i.test(actionName)) {
    const btn = page.getByRole('button', { name: /^reply all$/i }).first();
    await expect(btn).toBeVisible({ timeout: 30_000 });
    await btn.click();
  } else {
    const expandBtn = page
      .getByRole('button', { name: /expand to see more respond options/i })
      .first();
    await expect(expandBtn).toBeVisible({ timeout: 30_000 });
    await expandBtn.click();

    const item = page
      .getByRole('menuitem', { name: new RegExp(`^${actionName}$`, 'i') })
      .first();
    await expect(item).toBeVisible({ timeout: 10_000 });
    await item.click();
  }
}

/**
 * Waits for the compose / inline-reply form to become ready.
 * Outlook opens an inline reply at the bottom of the reading pane.
 * The presence of a "Send" button confirms the form is active.
 */
async function waitForComposeReady(page) {
  // Inline reply form: "Send" button + "Message body" textbox
  const sendBtn = page.getByRole('button', { name: /^send$/i }).first();
  await expect(sendBtn).toBeVisible({ timeout: 30_000 });
  return sendBtn;
}

// ── tests ─────────────────────────────────────────────────────────────────────

test('Reply — inline reply form opens after clicking Reply', async ({ mailPage }) => {
  const { page, mailFolders } = mailPage;
  test.setTimeout(180_000);

  await openFirstSentMessage(page, mailFolders);
  await clickRespondAction(page, 'Reply');

  // Verify the inline compose form is ready.
  await waitForComposeReady(page);

  // The reply body editor should also be present.
  await expect(
    page.getByRole('textbox', { name: /message body/i }).first()
  ).toBeVisible({ timeout: 15_000 });
});

test('Reply All — inline reply form opens after clicking Reply All', async ({ mailPage }) => {
  const { page, mailFolders } = mailPage;
  test.setTimeout(180_000);

  await openFirstSentMessage(page, mailFolders);
  await clickRespondAction(page, 'Reply all');

  await waitForComposeReady(page);

  await expect(
    page.getByRole('textbox', { name: /message body/i }).first()
  ).toBeVisible({ timeout: 15_000 });
});

test('Forward — compose form opens after clicking Forward', async ({ mailPage }) => {
  const { page, mailFolders } = mailPage;
  test.setTimeout(180_000);

  await openFirstSentMessage(page, mailFolders);
  await clickRespondAction(page, 'Forward');

  await waitForComposeReady(page);

  // Forward opens a full compose panel — the message body editor is present.
  await expect(
    page.getByLabel(/message body/i).first()
  ).toBeVisible({ timeout: 15_000 });
});
