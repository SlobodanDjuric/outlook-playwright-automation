// tests/Mail/delete-message.spec.js
import { test } from '../fixtures.js';
import { MailContextMenu } from '../../pages/components/MailContextMenu.js';
import { MailContextActions } from '../../pages/constants/mailActions.js';
import { Folders } from '../../pages/constants/folders.js';

test.use({ timeout: 180_000 });

test('Delete draft — draft disappears from Drafts folder after deletion', async ({ mailPage }) => {
  const { page, compose, mailFolders } = mailPage;

  const SUBJECT = `Playwright Delete Draft ${Date.now()}`;
  const BODY = 'This draft will be deleted.';

  await compose.openNewMail();
  await compose.subject.set(SUBJECT);
  await compose.body.set(BODY);
  await compose.close();

  // await mailFolders.open(Folders.Drafts);
  await mailFolders.open("Drafts");

  const contextMenu = new MailContextMenu(page);
  await contextMenu.applyActionToMail(SUBJECT, MailContextActions.Delete);

  await mailFolders.verifyMessageHidden(SUBJECT);
});
