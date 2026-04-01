// tests/Mail/move-to-new-folder.spec.js
import { test } from '../fixtures.js';
import { MailFolders } from '../../pages/components/MailFolders.js';
import { MailContextMenu, SubContextMenu } from '../../pages/components/MailContextMenu.js';
import { MailContextActions } from '../../pages/constants/mailActions.js';
import { Folders } from '../../pages/constants/folders.js';

test.use({ timeout: 120_000 });

test('Move — select 2 sent messages, create folder, mark second as unread', async ({ mailPage }) => {
  const { page } = mailPage;

  const FOLDER_NAME = `Move_${Date.now()}`;

  const folder = new MailFolders(page);
  const contextMenu = new MailContextMenu(page);
  const subMenu = new SubContextMenu(page);

  // Open Sent Items and sort: Date → Oldest on top
  await folder.open(Folders.SentItems);
  await folder.toolbar.sortBy('Date');
  await folder.toolbar.sortBy('Oldest on top');

  // Enter select mode and check first 2 messages
  await folder.selectMessages(2);

  // Right-click first checked message → Move → Create new folder
  await contextMenu.openForFirstMessage();
  await contextMenu.selectOption(MailContextActions.Move);
  await subMenu.createNewFolder(FOLDER_NAME);

  // Open the newly created folder
  await folder.open(FOLDER_NAME);

  // Enter select mode, check second message, right-click → Mark as unread
  await folder.toolbar.clickSelect();
  await folder.checkMessageAtIndex(1);
  await contextMenu.openForNthMessage(1);
  await contextMenu.selectOption(MailContextActions.MarkAsUnread);

  // Exit select mode
  await folder.toolbar.clickSelect();
});
