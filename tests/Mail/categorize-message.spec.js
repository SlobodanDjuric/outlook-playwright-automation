// tests/Mail/categorize-message.spec.js
import { test } from '../fixtures.js';
import { MailContextMenu, SubContextMenu } from '../../pages/components/MailContextMenu.js';
import { MailContextActions } from '../../pages/constants/mailActions.js';
import { Folders } from '../../pages/constants/folders.js';

test.use({ timeout: 120_000 });

test('Categorize — apply Blue category to first message in Sent Items', async ({ mailPage }) => {
  const { page, mailFolders } = mailPage;

  await mailFolders.open(Folders.SentItems);

  const contextMenu = new MailContextMenu(page);
  await contextMenu.applyActionToFirstMessage(MailContextActions.Categorize);

  const subMenu = new SubContextMenu(page);
  await subMenu.search('Blue');
  await subMenu.selectFirst();
});
