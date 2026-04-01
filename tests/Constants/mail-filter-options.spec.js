// tests/Constants/mail-filter-options.spec.js
//
// Verifies that every value in MailFilterOptions appears in the Filter dropdown.

import { test } from '../fixtures.js';
import { MailFilterOptions } from '../../pages/constants/mailOptions.js';
import { Folders } from '../../pages/constants/folders.js';

test.use({ timeout: 90_000 });

test('MailFilterOptions constants — all filter options appear in the Filter dropdown', async ({ mailPage }) => {
  const { page, folder } = mailPage;

  await folder.open(Folders.Inbox);
  await folder.toolbar.openFilterDropdown();

  for (const label of Object.values(MailFilterOptions)) {
    await folder.toolbar.verifyMenuItemVisible(label);
  }

  await page.keyboard.press('Escape');
});
