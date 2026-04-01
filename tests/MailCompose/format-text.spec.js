// tests/MailCompose/format-text.spec.js
//
// Verifies FormatToolbar helpers (bold, italic, underline, font, font size).

import { test } from '../fixtures.js';

test.use({ timeout: 120_000 });

test('format text toolbar — bold, italic, underline via keyboard shortcuts', async ({ mailPage }) => {
  const { compose } = mailPage;

  await compose.openNewMail();
  await compose.body.set('Format test text');
  await compose.body.selectAll();

  await compose.format.bold();
  await compose.format.italic();
  await compose.format.underline();

  await compose.close();
});

test('format text toolbar — setFont and setFontSize via dropdowns', async ({ mailPage }) => {
  const { compose } = mailPage;

  await compose.openNewMail();
  await compose.body.set('Font test');
  await compose.body.selectAll();

  await compose.format.setFont('Arial');
  await compose.format.setFontSize('14');

  await compose.close();
});
