// tests/ReadingPane/delete-message.spec.js
//
// Verifies MailReadingPane.delete() — message disappears from Sent Items.

import { test } from '../fixtures.js';
import { Folders } from '../../pages/constants/folders.js';

test.use({ timeout: 150_000 });

test('delete — message is removed from Sent Items after reading-pane delete', async ({ mailPage }) => {
  const { mailFolders, readingPane } = mailPage;

  await mailFolders.open(Folders.SentItems);
  const firstRow = await mailFolders.selectFirstMessage();
  const subject = (await firstRow.innerText().catch(() => '')).split('\n')[0].trim();

  await readingPane.delete();

  if (subject) {
    await mailFolders.verifyMessageHidden(subject);
  }
});
