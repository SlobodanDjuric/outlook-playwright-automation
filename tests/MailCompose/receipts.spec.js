// tests/MailCompose/receipts.spec.js
//
// Verifies NewEmailCompose.setReadReceipt() and setDeliveryReceipt():
//   1. Open new email compose.
//   2. Enable Read receipt via More send options menu.
//   3. Enable Delivery receipt via More send options menu.
//   Note: receipt options are enterprise features; skipped on Outlook.com free accounts.

import { test } from '../fixtures.js';

test.use({ timeout: 120_000 });

test('setReadReceipt — read receipt is toggled from More send options menu', async ({ mailPage }) => {
  const { compose } = mailPage;

  await compose.openNewMail();
  const available = await compose.setReadReceipt();

  if (!available) {
    await compose.close();
    test.skip(true, 'Read receipt not available in this Outlook account.');
    return;
  }

  await compose.close();
});

test('setDeliveryReceipt — delivery receipt is toggled from More send options menu', async ({ mailPage }) => {
  const { compose } = mailPage;

  await compose.openNewMail();
  const available = await compose.setDeliveryReceipt();

  if (!available) {
    await compose.close();
    test.skip(true, 'Delivery receipt not available in this Outlook account.');
    return;
  }

  await compose.close();
});
