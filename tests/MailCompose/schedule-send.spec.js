// tests/MailCompose/schedule-send.spec.js
//
// Verifies NewEmailCompose.scheduleSend() — schedule send picker opens.

import { test } from '../fixtures.js';

test.use({ timeout: 120_000 });

test('scheduleSend — schedule send picker opens from compose toolbar', async ({ mailPage }) => {
  const { page, compose } = mailPage;

  await compose.openNewMail();
  await compose.scheduleSend();
  await compose.verifyScheduleSendPickerVisible();

  await page.keyboard.press('Escape');
  await compose.close();
});
