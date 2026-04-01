// tests/ReadingPane/download-attachments.spec.js
//
// Verifies MailReadingPane.downloadAttachments():
//   1. Open Sent Items and select the first message.
//   2. If it has attachments ("Download all" button visible), download them.
//   3. Skip gracefully if no attachments found.

import { test, expect } from '../fixtures.js';
import { Folders } from '../../pages/constants/folders.js';

test.use({ timeout: 150_000 });

test('downloadAttachments — download starts for a message with attachments', async ({ mailPage }) => {
  const { page, mailFolders, readingPane } = mailPage;

  await mailFolders.open(Folders.SentItems);

  await mailFolders.selectFirstMessage();
  await page.waitForTimeout(800);

  if (!(await readingPane.hasAttachments())) {
    test.skip(true, 'First message in Sent Items has no attachments — skipping.');
    return;
  }

  const download = await readingPane.downloadAttachments();
  expect(download.suggestedFilename()).toBeTruthy();
});
