// tests/MailCompose/attach.spec.js
//
// Verifies NewEmailCompose.attach() — file attachment appears in compose form.

import { test } from '../fixtures.js';
import { writeFileSync } from 'fs';
import { tmpdir } from 'os';
import { join } from 'path';

test.use({ timeout: 120_000 });

test('attach — file attachment appears in compose form', async ({ mailPage }) => {
  const { compose } = mailPage;

  const filePath = join(tmpdir(), 'playwright-attach-test.txt');
  writeFileSync(filePath, 'Playwright attachment test file.');

  await compose.openNewMail();
  await compose.attach(filePath);
  await compose.verifyAttachment('playwright-attach-test.txt');

  await compose.close();
});
