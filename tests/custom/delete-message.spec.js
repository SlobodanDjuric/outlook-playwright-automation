import { test, expect } from '@playwright/test';
import { MailFolders } from '../../pages/components/mailFolders.js';
import { Folders } from '../../pages/constants/folders.js';

/**
 * Deletes an existing email from a specific folder.
 *
 * Precondition:
 * A message with the expected subject must already exist
 * in the target folder before this test runs.
 * This test does not create test data.
 */
test('Delete email with subject "Hello from Playwright"', async ({ page }) => {
  await page.goto('https://outlook.live.com/mail/', {
    waitUntil: 'domcontentloaded',
  });

  await expect(page.getByRole('button', { name: /new email/i })).toBeVisible({
    timeout: 45_000,
  });

  /**
   * Open the target folder.
   * The message to be deleted must already exist in this folder.
   */
  const mailFolders = new MailFolders(page);
  await mailFolders.open(Folders.SentItems);

  /**
   * Locate the message by subject.
   * If it does not exist, the test should fail.
   */
  const draftMail = page.getByRole('option', { name: /Hello from Playwright/i }).first();

  await expect(draftMail).toBeVisible({ timeout: 30_000 });

  /**
   * Open context menu and select Delete.
   */
  await draftMail.click({ button: 'right' });

  const deleteOption = page.getByRole('menuitem', { name: /delete/i });
  await expect(deleteOption).toBeVisible({ timeout: 10_000 });
  await deleteOption.click();

  /**
   * Verification:
   * Ensure the message no longer appears in the current folder.
   */
  await expect(page.getByRole('option', { name: /random/i })).toHaveCount(0);
});
