import { test, expect } from '@playwright/test';
import { MailFolders } from '../../pages/components/mailFolders.js';
import { Folders } from '../../pages/constants/folders.js';

test('Select "Sent Items" folder and verify it is opened', async ({ page }) => {
  await page.goto('https://outlook.live.com/mail/', {
    waitUntil: 'domcontentloaded',
  });
  await expect(page).toHaveURL(/outlook\.live\.com\/mail/i);

  // ✅ čekaj da se mailbox UI učita (da nismo na login/loader)
  await expect(page.getByRole('button', { name: /new email/i })).toBeVisible({
    timeout: 45_000,
  });

  const mailFolders = new MailFolders(page);

  // ✅ otvori folder preko klase
  await mailFolders.open(Folders.SentItems);

  // ✅ verifikacija: da se pojavi tekst "Sent Items" negde u glavnom panelu
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
