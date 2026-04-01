// tests/Constants/folders.spec.js
//
// Verifies that every value in the Folders constant exists in the Outlook
// folder tree.

import { test } from '../fixtures.js';
import { Folders } from '../../pages/constants/folders.js';

// Folders that are always visible in the sidebar.
// Outbox only appears when there are queued outgoing messages,
// ConversationHistory and Notes may be hidden on some accounts.
const ALWAYS_VISIBLE = [
  Folders.Inbox,
  Folders.Drafts,
  Folders.SentItems,
  Folders.DeletedItems,
  Folders.JunkEmail,
  Folders.Archive,
];

test.use({ timeout: 90_000 });

test('Folders constants — standard folder names appear in the folder tree', async ({ mailPage }) => {
  const { mailFolders } = mailPage;

  for (const name of ALWAYS_VISIBLE) {
    await mailFolders.verifyFolderInTree(name);
  }
});
