// tests/ReadingPane/discard.spec.js
//
// Verifies MailReadingPane.discard():
//   1. Open Sent Items and select the first message.
//   2. Open the Reply inline form.
//   3. Call discard() — the compose form should disappear.

import { test } from '../fixtures.js';
import { Folders } from '../../pages/constants/folders.js';

test.use({ timeout: 150_000 });

test('discard — inline reply form closes after discard', async ({ mailPage }) => {
  const { mailFolders, readingPane } = mailPage;

  await mailFolders.open(Folders.SentItems);
  await mailFolders.selectFirstMessage();

  await readingPane.reply();
  await readingPane.waitForComposeReady();

  await readingPane.discard();

  await readingPane.verifySendButtonHidden();
});
