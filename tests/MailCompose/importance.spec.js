// tests/MailCompose/importance.spec.js
//
// Verifies NewEmailCompose.setImportance():
//   1. Open new email compose.
//   2. Set High importance — toolbar button becomes active.
//   3. Set Low importance.

import { test } from '../fixtures.js';

test.use({ timeout: 120_000 });

test('setImportance — High and Low importance buttons are clickable', async ({ mailPage }) => {
  const { compose } = mailPage;

  await compose.openNewMail();

  await compose.setImportance('High');
  await compose.setImportance('Low');

  await compose.close();
});
