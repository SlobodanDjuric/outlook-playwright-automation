// tests/Mail/draft.spec.js
import { test } from '../fixtures.js';
import { Folders } from '../../pages/constants/folders.js';

test.use({ timeout: 180_000 });

test('Save email as draft — draft appears in Drafts folder', async ({ mailPage }) => {
  const { compose, mailFolders } = mailPage;

  const SUBJECT = `Playwright Draft ${Date.now()}`;
  const BODY = 'This email was intentionally left as a draft.';

  await compose.openNewMail();
  await compose.subject.set(SUBJECT);
  await compose.body.set(BODY);
  await compose.close();

  await mailFolders.open("Drafts");
  await mailFolders.selectMessageBySubject(SUBJECT);
});
