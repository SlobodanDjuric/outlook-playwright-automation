// tests/FolderTree/folder-ellipsis-menu.spec.js
//
// Tests for the three-dots (ellipsis) hover button on the account row.
// Hovering the account treeitem (user@outlook.com) reveals a "More options"
// button; clicking it opens a context menu with "Create new folder".

import { test } from '../fixtures.js';

test.use({ timeout: 120_000 });

const SUFFIX = Date.now();
const TEST_FOLDER = `AutoEllipsis_${SUFFIX}`;

// ---------------------------------------------------------------------------
// 1. Create new folder via three-dots on account row
// ---------------------------------------------------------------------------

test('Create new top-level folder via account ellipsis menu', async ({ mailPage }) => {
  const { folderContextMenu, mailFolders } = mailPage;

  await mailFolders.waitUntilReady();
  await folderContextMenu.createNewFolderUnderAccount(TEST_FOLDER);
  await folderContextMenu.verifyFolderVisible(TEST_FOLDER);

  // cleanup
  await folderContextMenu.deleteFolder(TEST_FOLDER);
});
