import { test, expect } from '@playwright/test';
import { MailFolder } from '../../pages/components/mailFolders.js';

const BASE_URL = 'https://outlook.live.com/mail/';

async function goToMail(page) {
  await page.goto(BASE_URL, { waitUntil: 'domcontentloaded' });
  await expect(page.getByRole('button', { name: /new email/i })).toBeVisible({ timeout: 45_000 });
}

// ── 1. Add / Remove from Favourites ─────────────────────────────────────────

test('folder toolbar - Add and Remove Deleted Items from Favourites', async ({ page }) => {
  test.setTimeout(90_000);

  await goToMail(page);
  const folder = new MailFolder(page);
  await folder.open('Deleted Items');

  // ── add to favourites ──────────────────────────────────────────────────────
  await folder.toolbar.addToFavourites();

  // verify "Deleted Items" now appears inside the Favourites section of the
  // folder tree (the Favourites group is a treeitem that contains children)
  const favouritesGroup = page
    .getByRole('tree')
    .first()
    .getByRole('treeitem', { name: /^favou?rites/i })
    .first();

  // the group may need to be expanded first
  const expanded = await favouritesGroup.getAttribute('aria-expanded').catch(() => null);
  if (expanded === 'false') {
    await favouritesGroup.click();
    await page.waitForTimeout(300);
  }

  // "Deleted Items" should now be visible somewhere inside the Favourites tree
  const deletedInFavourites = page
    .getByRole('tree')
    .first()
    .getByRole('treeitem', { name: /deleted items/i })
    .first();
  await expect(deletedInFavourites).toBeVisible({ timeout: 10_000 });

  // ── remove from favourites ─────────────────────────────────────────────────
  // re-select the Deleted Items folder so the toolbar reflects it
  await folder.open('Deleted Items');
  await folder.toolbar.removeFromFavourites();

  await page.waitForTimeout(500);
  // after removal the entry should no longer appear under Favourites
  // (it may still exist as a regular folder treeitem, so we scope the check
  //  to the Favourites group only)
  const deletedStillInFav = await page
    .getByRole('tree')
    .first()
    .locator('[aria-label*="favou" i] >> [role="treeitem"]')
    .filter({ hasText: /deleted items/i })
    .first()
    .isVisible()
    .catch(() => false);

  expect(deletedStillInFav).toBe(false);

  await page.waitForTimeout(2000);
});

// ── 2. Select ────────────────────────────────────────────────────────────────

test('folder toolbar - Select first two messages in Deleted Items', async ({ page }) => {
  test.setTimeout(90_000);

  await goToMail(page);
  const folder = new MailFolder(page);
  await folder.open('Deleted Items');

  // enter select mode
  await folder.toolbar.clickSelect();

  // in select mode, each message row gets a "Select a conversation" checkbox
  const checkboxes = page.getByRole('checkbox', { name: /select a conversation/i });
  await expect(checkboxes.first()).toBeVisible({ timeout: 10_000 });

  const count = await checkboxes.count();
  expect(count).toBeGreaterThan(0);

  // click first two available checkboxes
  const toSelect = Math.min(2, count);
  for (let i = 0; i < toSelect; i++) {
    const cb = checkboxes.nth(i);
    await cb.scrollIntoViewIfNeeded();
    await cb.click({ force: true });
    await page.waitForTimeout(200);
  }

  // verify both checkboxes are now checked
  for (let i = 0; i < toSelect; i++) {
    await expect(checkboxes.nth(i)).toBeChecked({ timeout: 10_000 });
  }

  await page.waitForTimeout(2000);
});

// ── 3. Jump to ───────────────────────────────────────────────────────────────

test('folder toolbar - Jump to Last month in Deleted Items', async ({ page }) => {
  test.setTimeout(90_000);

  await goToMail(page);
  const folder = new MailFolder(page);
  await folder.open('Deleted Items');

  // ensure sorted by Date so Jump to shows date-based options (Today/Last month/etc.)
  await folder.toolbar.sortBy('Date');
  await folder.toolbar.jumpTo('Last month');

  // verify we are still in the Deleted Items folder (heading visible = no error)
  const heading = page.getByRole('heading', { name: /deleted items/i }).first();
  await expect(heading).toBeVisible({ timeout: 10_000 });

  await page.waitForTimeout(2000);
});

// ── 4. Filter ────────────────────────────────────────────────────────────────

test('folder toolbar - Filter by Unread in Sent Items', async ({ page }) => {
  test.setTimeout(90_000);

  await goToMail(page);
  const folder = new MailFolder(page);
  await folder.open('Sent Items');

  await folder.toolbar.filter('Unread');

  // after applying a filter, Outlook shows a "Clear filter" button
  const clearFilterBtn = page.getByRole('button', { name: /clear filter/i }).first();
  await expect(clearFilterBtn).toBeVisible({ timeout: 10_000 });

  await page.waitForTimeout(2000);
});

// ── 5. Sort by ───────────────────────────────────────────────────────────────

test('folder toolbar - Sort by Size in Deleted Items', async ({ page }) => {
  test.setTimeout(90_000);

  await goToMail(page);
  const folder = new MailFolder(page);
  await folder.open('Deleted Items');

  await folder.toolbar.sortBy('Size');

  // after sorting, the sort button label changes to e.g. "Sorted: By Size"
  const sortBtn = page
    .getByRole('button', { name: /sorted/i })
    .first();
  await expect(sortBtn).toBeVisible({ timeout: 10_000 });

  const label = (await sortBtn.getAttribute('aria-label').catch(() => '')) ||
                (await sortBtn.textContent().catch(() => ''));
  expect(label).toMatch(/size/i);

  await page.waitForTimeout(2000);
});
