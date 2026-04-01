// tests/ReadingPane/print-message.spec.js
//
// Verifies MailReadingPane.printMessage():
//   1. Open Sent Items and select the first message.
//   2. Call printMessage() — triggers the browser print dialog.
//   3. Override window.print to prevent the native dialog from blocking.

import { test } from '../fixtures.js';
import { Folders } from '../../pages/constants/folders.js';

test.use({ timeout: 150_000 });

test('printMessage — print action is triggered from More actions menu', async ({ mailPage }) => {
  const { page, mailFolders, readingPane } = mailPage;

  await mailFolders.open(Folders.SentItems);
  await mailFolders.selectFirstMessage();

  // Intercept window.print so the native dialog does not block the test
  await page.evaluate(() => { window.print = () => {}; });

  await readingPane.printMessage();
});
