// tests/custom/auth.spec.js
// One-time manual login helper: pauses execution so you can log in by hand,
// then saves the resulting browser storage state to storageState.json.
// Run this once before running other tests to authenticate.
// This test is NOT part of the regular test suite — run it manually only.

import { test } from '@playwright/test';

test.use({ timeout: 180_000 });

test('Login and save storage state', async ({ page }) => {

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
