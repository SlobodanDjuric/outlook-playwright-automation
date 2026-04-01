// tests/ReadingPane/mark-as-read.spec.js
//
// Verifies MailReadingPane.markAsUnread() and markAsRead():
//   1. Open Sent Items and select the first message.
//   2. Mark it as unread via More actions.
//   3. Mark it as read again — restoring original state.

import { test } from '../fixtures.js';
import { Folders } from '../../pages/constants/folders.js';

test.use({ timeout: 150_000 });

test('mark as read/unread — message read state toggles via More actions', async ({ mailPage }) => {
  const { mailFolders, readingPane } = mailPage;

  await mailFolders.open(Folders.SentItems);
  await mailFolders.selectFirstMessage();

  // Mark as unread
  await readingPane.markAsUnread();

  // Restore: mark as read
  await readingPane.markAsRead();
});
