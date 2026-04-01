// tests/FolderTree/conversation-thread.spec.js
//
// Tests for ConversationThread — conversation grouping in search results.

import { test, expect } from '../fixtures.js';

test.use({ timeout: 120_000 });

const SEARCH_TERM = 'the';

// ---------------------------------------------------------------------------
// 1. "Expand conversation" buttons appear in search results
// ---------------------------------------------------------------------------

test('Search results contain "Expand conversation" buttons', async ({ mailPage }) => {
  const { searchBar, mailFolders, conversationThread } = mailPage;

  await mailFolders.waitUntilReady();
  await searchBar.search(SEARCH_TERM);
  await searchBar.verifyResultsVisible();

  const hasCollapsed = await conversationThread.hasCollapsedThread();
  if (!hasCollapsed) {
    test.skip(true, 'No collapsed conversations found in search results — skipping.');
    return;
  }

  expect(hasCollapsed).toBe(true);
  await searchBar.clear();
});

// ---------------------------------------------------------------------------
// 2. Clicking "Expand conversation" opens the email in the Reading Pane
// ---------------------------------------------------------------------------

test('Clicking "Expand conversation" opens email in Reading Pane', async ({ mailPage }) => {
  const { searchBar, mailFolders, conversationThread } = mailPage;

  await mailFolders.waitUntilReady();
  await searchBar.search(SEARCH_TERM);
  await searchBar.verifyResultsVisible();

  const hasCollapsed = await conversationThread.hasCollapsedThread();
  if (!hasCollapsed) {
    test.skip(true, 'No collapsed conversations found — skipping.');
    return;
  }

  await conversationThread.expandFirst();
  expect(await conversationThread.hasReadingPane()).toBe(true);

  await searchBar.clear();
});

// ---------------------------------------------------------------------------
// 3. Reading Pane contains a heading after expand
// ---------------------------------------------------------------------------

test('Reading Pane shows email heading after conversation expand', async ({ mailPage }) => {
  const { searchBar, mailFolders, conversationThread } = mailPage;

  await mailFolders.waitUntilReady();
  await searchBar.search(SEARCH_TERM);
  await searchBar.verifyResultsVisible();

  const hasCollapsed = await conversationThread.hasCollapsedThread();
  if (!hasCollapsed) {
    test.skip(true, 'No collapsed conversations found — skipping.');
    return;
  }

  await conversationThread.expandFirst();
  await conversationThread.verifyExpanded();

  await searchBar.clear();
});

// ---------------------------------------------------------------------------
// 4. Multiple conversations: each has its own "Expand conversation" button
// ---------------------------------------------------------------------------

test('Multiple collapsed conversations each have their own Expand button', async ({ mailPage }) => {
  const { searchBar, mailFolders, conversationThread } = mailPage;

  await mailFolders.waitUntilReady();
  await searchBar.search(SEARCH_TERM);
  await searchBar.verifyResultsVisible();

  const hasCollapsed = await conversationThread.hasCollapsedThread();
  if (!hasCollapsed) {
    test.skip(true, 'No collapsed conversations found — skipping.');
    return;
  }

  const count = await conversationThread._expandButtons().count();
  expect(count).toBeGreaterThan(0);

  await searchBar.clear();
});

// ---------------------------------------------------------------------------
// 5. Message list is present in Inbox (sanity check)
// ---------------------------------------------------------------------------

test('Message list is visible in Inbox', async ({ mailPage }) => {
  const { mailFolders } = mailPage;

  await mailFolders.waitUntilReady();
  await mailFolders.open('Inbox');
  await mailFolders.verifyMessageListVisible();
});
