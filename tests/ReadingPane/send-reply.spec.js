// tests/ReadingPane/send-reply.spec.js
//
// Verifies MailReadingPane.send() — inline reply is sent and compose form closes.

import { test } from '../fixtures.js';
import { Folders } from '../../pages/constants/folders.js';

test.use({ timeout: 150_000 });

test('send — inline reply is sent and compose form closes', async ({ mailPage }) => {
  const { mailFolders, readingPane } = mailPage;

  await mailFolders.open(Folders.SentItems);
  await mailFolders.selectFirstMessage();

  await readingPane.reply();
  await readingPane.waitForComposeReady();
  await readingPane.typeReplyBody('Automated reply test.');
  await readingPane.send();

  await readingPane.verifySendButtonHidden();
});
