// tests/Mail/populate-new-email.spec.js
import { test, expect } from '../fixtures.js';

test.use({ timeout: 180_000 });

test('Outlook - TO + CC + BCC + Subject + Body (verify rows, no send)', async ({ mailPage }) => {
  const { compose } = mailPage;

  const TO = 'test@example.com';
  const CC = 'cc@example.com';
  const BCC = 'bcc@example.com';
  const SUBJECT = `Hello from Playwright ${Date.now()}`;
  const BODY = 'This is a test message (TO + CC + BCC).';

  /** Asserts that nextLocator is visually below prevLocator in the compose form. */
  async function assertRowBelow(prevLocator, nextLocator, label) {
    await prevLocator.scrollIntoViewIfNeeded();
    await nextLocator.scrollIntoViewIfNeeded();
    const a = await prevLocator.boundingBox();
    const b = await nextLocator.boundingBox();
    if (!a || !b) throw new Error(`Could not read bounding boxes for ${label}`);
    const delta = b.y - a.y;
    expect(delta, `${label}: not below (delta=${delta}px)`).toBeGreaterThanOrEqual(5);
    expect(delta, `${label}: too far below (delta=${delta}px)`).toBeLessThan(90);
  }

  await compose.openNewMail();

  const page = mailPage.page;
  const toLabel = page.locator('#recipient-well-label-to');
  const ccLabel = page.locator('#recipient-well-label-cc');
  const bccLabel = page.locator('#recipient-well-label-bcc');

  await compose.to.add(TO);

  await compose.cc.add(CC);
  await assertRowBelow(toLabel, ccLabel, 'CC row vs TO row');

  await compose.bcc.add(BCC);
  await assertRowBelow(ccLabel, bccLabel, 'BCC row vs CC row');

  await compose.subject.set(SUBJECT);
  await compose.body.set(BODY);
});
