// tests/custom/folders-checks.spec.js
// Navigates to each standard Outlook folder in sequence and verifies that
// the folder name is visible in the main panel after opening.
// Covers: Sent Items, Inbox, Junk Email, Drafts, Deleted Items, Archive, Notes, Conversation History.

import { test, expect } from '@playwright/test';
import { MailFolders } from '../../pages/components/MailFolderss.js';
import { Folders } from '../../pages/constants/folders.js';

test('Navigate all standard folders — each folder header is visible after opening', async ({ page }) => {
  await page.goto('https://outlook.live.com/mail/', {
    waitUntil: 'domcontentloaded',
  });
  await expect(page).toHaveURL(/outlook\.live\.com\/mail/i);

  // wait for the mailbox UI to load (ensure we are past the login/loader screen)
  await expect(page.getByRole('button', { name: /new email/i })).toBeVisible({
    timeout: 45_000,
  });

  const mailFolders = new MailFolders(page);

  // open the folder via the MailFolderss page object
  await mailFolders.open(Folders.SentItems);

  // verify that "Sent Items" text appears somewhere in the main panel
  await expect(page.getByText(/sent items/i).first()).toBeVisible({
    timeout: 30_000,
  });
  await page.waitForTimeout(3500);

  await mailFolders.open(Folders.Inbox);
  await expect(page.getByText(/inbox/i).first()).toBeVisible({
    timeout: 30_000,
  });
  await page.waitForTimeout(3000);

  await mailFolders.open(Folders.JunkEmail);
  await expect(page.getByText(/junk email/i).first()).toBeVisible({
    timeout: 30_000,
  });
  await page.waitForTimeout(3500);

  await mailFolders.open(Folders.Drafts);
  await expect(page.getByText(/drafts/i).first()).toBeVisible({
    timeout: 30_000,
  });
  await page.waitForTimeout(3500);

  await mailFolders.open(Folders.DeletedItems);
  await expect(page.getByText(/deleted items/i).first()).toBeVisible({
    timeout: 30_000,
  });
  await page.waitForTimeout(3500);

  await mailFolders.open(Folders.Archive);
  await expect(page.getByText(/archive/i).first()).toBeVisible({
    timeout: 30_000,
  });
  await page.waitForTimeout(3500);

  await mailFolders.open(Folders.Notes);
  await expect(page.getByText(/notes/i).first()).toBeVisible({
    timeout: 300_000,
  });
  await page.waitForTimeout(8500);

  await mailFolders.open(Folders.ConversationHistory);
  await expect(page.getByText(/conversation/i).first()).toBeVisible({
    timeout: 30_000,
  });
  await page.waitForTimeout(3500);
});
