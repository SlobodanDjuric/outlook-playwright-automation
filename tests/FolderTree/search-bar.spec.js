// tests/FolderTree/search-bar.spec.js
//
// Tests for MailSearchBar — Outlook search bar interactions.

import { test, expect } from '../fixtures.js';

test.use({ timeout: 120_000 });

test('Search bar is visible on Mail page', async ({ mailPage }) => {
  const { searchBar, mailFolders } = mailPage;

  await mailFolders.waitUntilReady();
  await searchBar.verifySearchBarVisible();
});

test('Search for a term — results list is visible', async ({ mailPage }) => {
  const { searchBar, mailFolders } = mailPage;

  await mailFolders.waitUntilReady();
  await searchBar.search('the');
  await searchBar.verifyResultsVisible();
});

test('Clear search — message list reappears', async ({ mailPage }) => {
  const { searchBar, mailFolders } = mailPage;

  await mailFolders.waitUntilReady();
  await searchBar.search('the');
  await searchBar.verifyResultsVisible();

  await searchBar.clear();
  await mailFolders.verifyMessageListVisible();
});

test('Search for gibberish — no results message is shown', async ({ mailPage }) => {
  const { searchBar, mailFolders } = mailPage;

  await mailFolders.waitUntilReady();
  await searchBar.search('zxqwerty_no_results_9876543');
  await searchBar.verifyNoResults();

  await searchBar.clear();
});

test('Search scope filter — "Email" tab narrows results', async ({ mailPage }) => {
  const { searchBar, mailFolders } = mailPage;

  await mailFolders.waitUntilReady();
  await searchBar.search('the');
  await searchBar.verifyResultsVisible();
  await searchBar.filterByScope('Email');
  await searchBar.verifyResultsVisible();

  await searchBar.clear();
});

test('Search refinement chip — "Unread" button filters results', async ({ mailPage }) => {
  const { searchBar, mailFolders } = mailPage;

  await mailFolders.waitUntilReady();
  await searchBar.search('the');
  await searchBar.verifyResultsVisible();
  await searchBar.filterByScope('Unread');

  await searchBar.clear();
});

test('isSearchActive is false before and true after search', async ({ mailPage }) => {
  const { searchBar, mailFolders } = mailPage;

  await mailFolders.waitUntilReady();

  expect(await searchBar.isSearchActive()).toBe(false);

  await searchBar.search('the');
  expect(await searchBar.isSearchActive()).toBe(true);

  await searchBar.clear();
});
