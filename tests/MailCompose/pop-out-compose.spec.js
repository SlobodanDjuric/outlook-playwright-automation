// tests/MailCompose/pop-out-compose.spec.js
//
// Verifies NewEmailCompose.popOutCompose():
//   1. Open new email compose.
//   2. Click the pop-out button — compose opens in a new window.
//   3. Assert message body is visible in the new window — skip if button not available.

import { test } from '../fixtures.js';

test.use({ timeout: 120_000 });

test('popOutCompose — compose opens in a new pop-out window', async ({ mailPage }) => {
  const { compose } = mailPage;

  await compose.openNewMail();

  const newPage = await compose.popOutCompose();

  if (newPage === null) {
    test.skip(true, 'Pop-out compose button not available in this Outlook account.');
    return;
  }

  await compose.verifyPopOutBodyVisible(newPage);
  await newPage.close();
});
