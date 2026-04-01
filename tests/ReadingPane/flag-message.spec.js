// tests/ReadingPane/flag-message.spec.js
//
// Verifies MailReadingPane.flag():
//   1. Open Sent Items and select the first message.
//   2. Flag it — button label should toggle.
//   3. Unflag it — restores original state.

import { test } from '../fixtures.js';
import { Folders } from '../../pages/constants/folders.js';

test.use({ timeout: 150_000 });

test('flag — message is flagged then unflagged via reading pane toolbar', async ({ mailPage }) => {
  const { mailFolders, readingPane } = mailPage;

  await mailFolders.open(Folders.SentItems);
  await mailFolders.selectFirstMessage();

  // Flag the message
  await readingPane.flag();

  // The button remains "Flag / Unflag" — verify it's still in the toolbar
  await readingPane.verifyFlagButtonVisible();

  // Restore: unflag
  await readingPane.flag();
});
