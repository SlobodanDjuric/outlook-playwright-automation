// tests/Mail/flag-mail.spec.js
import { test } from '../fixtures.js';
import { MailContextMenu } from '../../pages/components/MailContextMenu.js';
import { MailContextActions } from '../../pages/constants/mailActions.js';
import { Folders } from '../../pages/constants/folders.js';

test.use({ timeout: 180_000 });

test('Flag draft — draft remains visible in Drafts folder after flagging', async ({ mailPage }) => {
  const { page, compose, mailFolders } = mailPage;

  const SUBJECT = `Playwright Flag Draft ${Date.now()}`;
  const BODY = 'This draft will be flagged.';

  await compose.openNewMail();
  await compose.subject.set(SUBJECT);
  await compose.body.set(BODY);
  await compose.close();

  await mailFolders.open(Folders.Drafts);

  const contextMenu = new MailContextMenu(page);
  await contextMenu.applyActionToMail(SUBJECT, MailContextActions.Flag);

  await mailFolders.verifyMessageVisible(SUBJECT);
});
