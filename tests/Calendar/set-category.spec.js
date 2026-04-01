// tests/Calendar/set-category.spec.js
//
// Verifies event.selectFirstAvailableCategory() in the new-event compose form.

import { test } from '../fixtures.js';

test.use({ timeout: 120_000 });

test('setCategory — selecting a colour category reflects on the compose form', async ({ newEventPage }) => {
  const { event } = newEventPage;

  await event.fillTitle(`Category Test ${Date.now()}`);

  const categoryName = await event.selectFirstAvailableCategory();

  if (!categoryName) {
    await event.discard();
    test.skip(true, 'No colour categories configured for this account — skipping.');
    return;
  }

  await event.verifyCategoryVisible(categoryName);

  await event.discard();
});
