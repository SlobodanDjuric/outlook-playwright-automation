// tests/Constants/jump-to-options.spec.js
//
// Verifies JumpToOptions constants against what Outlook shows in the
// Jump To dropdown for each relevant Sort field.
//
// Jump To is only available when sorted by: Date, Category, Size, Importance.
// Sorted by: From, Flag Status, Subject, Type — Jump To is NOT shown.

import { test } from '../fixtures.js';
import { SortOptions, JumpToOptions } from '../../pages/constants/mailOptions.js';
import { Folders } from '../../pages/constants/folders.js';

// ── Groups with Jump To ───────────────────────────────────────────────────────

test('JumpToOptions.ByDate — all options visible when sorted by Date', async ({ mailPage }) => {
  test.setTimeout(90_000);
  const { page, folder } = mailPage;

  await folder.open(Folders.DeletedItems);
  await folder.toolbar.sortBy(SortOptions.Date);
  await folder.toolbar.openJumpToDropdown();

  for (const label of Object.values(JumpToOptions.ByDate)) {
    await folder.toolbar.verifyMenuItemVisible(label, `ByDate "${label}" not found`);
  }
  await page.keyboard.press('Escape');
});

test('JumpToOptions.ByCategory — all options visible when sorted by Category', async ({ mailPage }) => {
  test.setTimeout(90_000);
  const { page, folder } = mailPage;

  await folder.open(Folders.DeletedItems);
  await folder.toolbar.sortBy(SortOptions.Date);
  await folder.toolbar.sortBy(SortOptions.Category);
  await folder.toolbar.openJumpToDropdown();

  for (const label of Object.values(JumpToOptions.ByCategory)) {
    await folder.toolbar.verifyMenuItemVisible(label, `ByCategory "${label}" not found`);
  }
  await page.keyboard.press('Escape');
});

test('JumpToOptions.BySize — all options visible when sorted by Size', async ({ mailPage }) => {
  test.setTimeout(90_000);
  const { page, folder } = mailPage;

  await folder.open(Folders.DeletedItems);
  await folder.toolbar.sortBy(SortOptions.Date);
  await folder.toolbar.sortBy(SortOptions.Size);
  await folder.toolbar.openJumpToDropdown();

  for (const label of Object.values(JumpToOptions.BySize)) {
    await folder.toolbar.verifyMenuItemVisible(label, `BySize "${label}" not found`);
  }
  await page.keyboard.press('Escape');
});

test('JumpToOptions.ByImportance — all options visible when sorted by Importance', async ({ mailPage }) => {
  test.setTimeout(90_000);
  const { page, folder } = mailPage;

  await folder.open(Folders.DeletedItems);
  await folder.toolbar.sortBy(SortOptions.Date);
  await folder.toolbar.sortBy(SortOptions.Importance);
  await folder.toolbar.openJumpToDropdown();

  for (const label of Object.values(JumpToOptions.ByImportance)) {
    await folder.toolbar.verifyMenuItemVisible(label, `ByImportance "${label}" not found`);
  }
  await page.keyboard.press('Escape');
});

// ── Sort fields with no Jump To ───────────────────────────────────────────────

const NO_JUMP_TO_SORTS = [
  SortOptions.From,
  SortOptions.FlagStatus,
  SortOptions.Subject,
  SortOptions.Type,
];

for (const sortOption of NO_JUMP_TO_SORTS) {
  test(`Jump To not available when sorted by ${sortOption}`, async ({ mailPage }) => {
    test.setTimeout(90_000);
    const { folder } = mailPage;

    await folder.open(Folders.DeletedItems);
    await folder.toolbar.sortBy(SortOptions.Date);
    await folder.toolbar.sortBy(sortOption);

    await folder.toolbar.verifyJumpToButtonHidden(
      `Jump To should NOT be visible when sorted by "${sortOption}"`
    );
  });
}
