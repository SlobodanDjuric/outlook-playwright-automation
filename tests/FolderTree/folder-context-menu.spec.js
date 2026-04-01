// tests/FolderTree/folder-context-menu.spec.js
//
// Tests for FolderTreeContextMenu — right-click operations on folders.

import { test } from '../fixtures.js';
import { Folders } from '../../pages/constants/folders.js';

test.use({ timeout: 120_000 });

const SUFFIX = Date.now();
const TEST_FOLDER = `AutoTest_${SUFFIX}`;
const RENAMED_FOLDER = `AutoRenamed_${SUFFIX}`;

// ---------------------------------------------------------------------------
// 1. Create new subfolder
// ---------------------------------------------------------------------------

test('Create new subfolder under Inbox', async ({ mailPage }) => {
  const { folderContextMenu, mailFolders } = mailPage;

  await mailFolders.waitUntilReady();
  await folderContextMenu.createNewSubfolder('Inbox', TEST_FOLDER);
  await folderContextMenu.verifyFolderVisible(TEST_FOLDER);

  // cleanup
  await folderContextMenu.deleteFolder(TEST_FOLDER);
});

// ---------------------------------------------------------------------------
// 2. Rename a folder
// ---------------------------------------------------------------------------

test('Rename a folder', async ({ mailPage }) => {
  const { folderContextMenu, mailFolders } = mailPage;

  await mailFolders.waitUntilReady();
  await folderContextMenu.createNewSubfolder('Inbox', TEST_FOLDER);
  await folderContextMenu.verifyFolderVisible(TEST_FOLDER);

  await folderContextMenu.renameFolder(TEST_FOLDER, RENAMED_FOLDER);

  await folderContextMenu.verifyFolderVisible(RENAMED_FOLDER);
  await folderContextMenu.verifyFolderHidden(TEST_FOLDER);

  // cleanup
  await folderContextMenu.deleteFolder(RENAMED_FOLDER);
});

// ---------------------------------------------------------------------------
// 3. Mark all as read in Inbox
// ---------------------------------------------------------------------------

test('Mark all as read — Inbox', async ({ mailPage }) => {
  const { folderContextMenu, mailFolders } = mailPage;

  await mailFolders.waitUntilReady();
  await folderContextMenu.markAllAsRead('Inbox');
  await folderContextMenu.verifyFolderVisible('Inbox');
});

// ---------------------------------------------------------------------------
// 4. Delete a folder
// ---------------------------------------------------------------------------

test('Delete a folder', async ({ mailPage }) => {
  const { folderContextMenu, mailFolders } = mailPage;

  await mailFolders.waitUntilReady();
  await folderContextMenu.createNewSubfolder('Inbox', TEST_FOLDER);
  await folderContextMenu.verifyFolderVisible(TEST_FOLDER);

  await folderContextMenu.deleteFolder(TEST_FOLDER);
  await folderContextMenu.verifyFolderHidden(TEST_FOLDER);
});

// ---------------------------------------------------------------------------
// 5. Context menu contains expected options
// ---------------------------------------------------------------------------

test('Context menu contains Rename, Delete folder, Mark all as read', async ({ mailPage }) => {
  const { folderContextMenu, mailFolders } = mailPage;

  await mailFolders.waitUntilReady();
  await folderContextMenu.createNewSubfolder('Inbox', TEST_FOLDER);
  await folderContextMenu.verifyFolderVisible(TEST_FOLDER);

  await folderContextMenu.verifyMenuContains(TEST_FOLDER, 'Rename');
  await folderContextMenu.verifyMenuContains(TEST_FOLDER, 'Delete');
  await folderContextMenu.verifyMenuContains(TEST_FOLDER, 'Mark all as read');

  // cleanup
  await folderContextMenu.deleteFolder(TEST_FOLDER);
});

// ---------------------------------------------------------------------------
// 6. Empty the Deleted Items folder
// ---------------------------------------------------------------------------

test('Empty Deleted Items folder', async ({ mailPage }) => {
  const { folderContextMenu, mailFolders } = mailPage;

  await mailFolders.waitUntilReady();
  await folderContextMenu.emptyFolder(Folders.DeletedItems);
  await folderContextMenu.verifyFolderVisible('Deleted Items');
});
