import { test } from '@playwright/test';

test('Login and save storage state', async ({ page }) => {
  test.setTimeout(180_000);

  await page.goto('https://outlook.live.com/mail/', {
    waitUntil: 'domcontentloaded',
  });

  // ovde ćeš ručno da se uloguješ sa NOVIM nalogom
  // Playwright će čekati da završiš login

  await page.pause(); // ovde se loguj ručno

  // kada završiš login i vidiš mailbox
  await page.context().storageState({
    path: 'storageState.json',
  });
});
