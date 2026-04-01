// tests/Mail/reply-forward.spec.js
import { test } from '../fixtures.js';
import { Folders } from '../../pages/constants/folders.js';

test.use({ timeout: 180_000 });

test('Reply — inline reply form opens after clicking Reply', async ({ mailPage }) => {
  const { mailFolders, readingPane } = mailPage;

  await mailFolders.open(Folders.SentItems);
  await mailFolders.selectFirstMessage();

  await readingPane.reply();
  await readingPane.waitForComposeReady();
  await readingPane.verifyComposeBodyVisible();
});

test('Reply All — inline reply form opens after clicking Reply All', async ({ mailPage }) => {
  const { mailFolders, readingPane } = mailPage;

  await mailFolders.open(Folders.SentItems);
  await mailFolders.selectFirstMessage();

  await readingPane.replyAll();
  await readingPane.waitForComposeReady();
  await readingPane.verifyComposeBodyVisible();
});

test('Forward — compose form opens after clicking Forward', async ({ mailPage }) => {
  const { mailFolders, readingPane } = mailPage;

  await mailFolders.open(Folders.SentItems);
  await mailFolders.selectFirstMessage();

  await readingPane.forward();
  await readingPane.waitForComposeReady();
  await readingPane.verifyComposeBodyVisible();
});
