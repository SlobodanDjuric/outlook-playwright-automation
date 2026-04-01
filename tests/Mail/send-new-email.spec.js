// tests/Mail/send-new-email.spec.js
import { test } from '../fixtures.js';
import { Folders } from '../../pages/constants/folders.js';

test.use({ timeout: 180_000 });

test('Outlook - Send full email (TO + CC + BCC + Subject + Body) - POM', async ({ mailPage }) => {
  const { compose, mailFolders } = mailPage;

  const TO = 'test@example.com';
  const CC = 'cc@example.com';
  const BCC = 'bcc@example.com';
  const SUBJECT = `Playwright full send ${Date.now()}`;
  const BODY = 'This is a test message with TO + CC + BCC.';

  await compose.openNewMail();
  await compose.to.add(TO);
  await compose.cc.add(CC);
  await compose.bcc.add(BCC);
  await compose.subject.set(SUBJECT);
  await compose.body.set(BODY);
  await compose.send.click();

  await mailFolders.open(Folders.SentItems);
  await mailFolders.selectFirstMessage();
  await mailFolders.verifySubjectInReadingPane(SUBJECT);
});
