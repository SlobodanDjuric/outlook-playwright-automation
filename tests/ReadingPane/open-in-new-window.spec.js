// tests/ReadingPane/open-in-new-window.spec.js
//
// Verifies MailReadingPane.openInNewWindow():
//   1. Open Sent Items and select the first message.
//   2. Click "Open in new window" (pop-out).
//   3. Assert the new page opened — skip gracefully if button unavailable.

import { test, expect } from '../fixtures.js';
import { Folders } from '../../pages/constants/folders.js';

test.use({ timeout: 150_000 });

test('openInNewWindow — message opens in a new pop-out window', async ({ mailPage }) => {
  const { mailFolders, readingPane } = mailPage;

  await mailFolders.open(Folders.SentItems);
  await mailFolders.selectFirstMessage();

  const newPage = await readingPane.openInNewWindow();

  if (newPage === null) {
    test.skip(true, '"Open in new window" button not available in this Outlook account.');
    return;
  }

  expect(newPage.url()).toContain('outlook');
  await newPage.close();
});
