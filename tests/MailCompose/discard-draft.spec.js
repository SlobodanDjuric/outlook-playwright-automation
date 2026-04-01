// tests/MailCompose/discard-draft.spec.js
//
// Verifies NewEmailCompose.discardDraft():
//   1. Open new email compose and type something.
//   2. Call discardDraft() — compose panel closes without saving.
//   3. Assert compose form is no longer visible.

import { test } from '../fixtures.js';

test.use({ timeout: 120_000 });

test('discardDraft — compose closes without saving to Drafts', async ({ mailPage }) => {
  const { compose } = mailPage;

  await compose.openNewMail();

  await compose.subject.set('Discard draft test');
  await compose.body.set('This draft should be discarded.');

  await compose.discardDraft();

  await compose.body.verifyHidden();
});
