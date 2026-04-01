// tests/Constants/sort-options.spec.js
//
// Verifies that every value in SortOptions appears in the "Sorted" dropdown.

import { test } from '../fixtures.js';
import { SortOptions } from '../../pages/constants/mailOptions.js';
import { Folders } from '../../pages/constants/folders.js';

test.use({ timeout: 90_000 });

test('SortOptions constants — all sort options appear in the Sort dropdown', async ({ mailPage }) => {
  const { page, folder } = mailPage;

  await folder.open(Folders.DeletedItems);
  // Reset to Date first so all 8 options (incl. Flag Status) are present
  await folder.toolbar.sortBy(SortOptions.Date);
  await folder.toolbar.openSortDropdown();

  for (const label of Object.values(SortOptions)) {
    await folder.toolbar.verifyMenuItemVisible(label, `Sort option "${label}" not found`);
  }

  await page.keyboard.press('Escape');
});
