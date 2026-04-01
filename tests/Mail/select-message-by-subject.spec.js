// tests/Mail/select-message-by-subject.spec.js
import { test } from '../fixtures.js';
import { Folders } from '../../pages/constants/folders.js';

test.use({ timeout: 180_000 });

test('Find draft by subject — message opens in reading pane', async ({ mailPage }) => {
  const { mailFolders } = mailPage;

  const SUBJECT = 'Hello from Playwrighterrr';

  await mailFolders.open(Folders.Drafts);
  await mailFolders.selectMessageBySubject(SUBJECT);
  await mailFolders.verifySubjectInReadingPane(SUBJECT);
});
