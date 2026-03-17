import { test } from '@playwright/test';

test('Login and save storage state', async ({ page }) => {
  test.setTimeout(180_000);

  await page.goto('https://outlook.live.com/', {
    waitUntil: 'domcontentloaded',
  });

  // manually log in with the NEW account here
  // Playwright will wait until you finish the login flow

  await page.pause(); // pause here and log in manually

  // once login is complete and the mailbox is visible
  await page.context().storageState({
    path: 'storageState.json',
  });
});
