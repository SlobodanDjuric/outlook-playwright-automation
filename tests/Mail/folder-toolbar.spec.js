// tests/Mail/folder-toolbar.spec.js
import { test } from '../fixtures.js';
import { MailFolders } from '../../pages/components/MailFolders.js';
import { Folders } from '../../pages/constants/folders.js';

test.use({ timeout: 90_000 });

test('folder toolbar - Add and Remove Deleted Items from Favourites', async ({ mailPage }) => {
  const { page } = mailPage;
  const folder = new MailFolders(page);

  await folder.open(Folders.DeletedItems);
  await folder.toolbar.addToFavourites();
  await folder.verifyFolderInFavourites(Folders.DeletedItems);

  await folder.open(Folders.DeletedItems);
  await folder.toolbar.removeFromFavourites();
  await folder.verifyFolderNotInFavourites(Folders.DeletedItems);
});

test('folder toolbar - Select first two messages in Deleted Items', async ({ mailPage }) => {
  const { page } = mailPage;
  const folder = new MailFolders(page);

  await folder.open(Folders.DeletedItems);
  await folder.selectMessages(2);
});

test('folder toolbar - Jump to Last month in Deleted Items', async ({ mailPage }) => {
  const { page } = mailPage;
  const folder = new MailFolders(page);

  await folder.open(Folders.DeletedItems);
  await folder.toolbar.sortBy('Date');
  await folder.toolbar.jumpTo('Last month');
});

test('folder toolbar - Filter by Unread in Sent Items', async ({ mailPage }) => {
  const { page } = mailPage;
  const folder = new MailFolders(page);

  await folder.open(Folders.SentItems);
  await folder.toolbar.filter('Unread');
  await folder.verifyFilterActive();
});

test('folder toolbar - Sort by Size in Deleted Items', async ({ mailPage }) => {
  const { page } = mailPage;
  const folder = new MailFolders(page);

  await folder.open(Folders.DeletedItems);
  await folder.toolbar.sortBy('Size');
  await folder.verifySortedBy('Size');
});

test('folder toolbar - Switch between Other and Focused tabs in Inbox', async ({ mailPage }) => {
  const { page } = mailPage;
  const folder = new MailFolders(page);

  await folder.open(Folders.Inbox);
  await folder.toolbar.clickOther();
  await folder.toolbar.clickFocused();
});
