// tests/ReadingPane/more-actions.spec.js
//
// Verifies MailReadingPane.moreActions():
//   1. Open Sent Items and select the first message.
//   2. Open the More actions (…) menu.
//   3. Assert the menu appeared (at least one menuitem is visible).

import { test } from '../fixtures.js';
import { Folders } from '../../pages/constants/folders.js';

test.use({ timeout: 150_000 });

test('moreActions — More actions menu opens in the reading pane', async ({ mailPage }) => {
  const { page, mailFolders, readingPane } = mailPage;

  await mailFolders.open(Folders.SentItems);
  await mailFolders.selectFirstMessage();

  await readingPane.moreActions();
  await readingPane.verifyMoreActionsMenuVisible();

  // Close the menu
  await page.keyboard.press('Escape');
});
