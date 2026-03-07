import { test } from '@playwright/test';
test('debug-admin', async ({ page }) => {
  await page.goto('/he/dashboard/admin', { waitUntil: 'domcontentloaded' });
  await page.waitForTimeout(5000);
  const url = page.url();
  const pulseCount = await page.evaluate(() => document.querySelectorAll('.animate-pulse').length);
  const bodyText = await page.evaluate(() => document.body.innerText.substring(0, 300));
  console.log('URL:', url);
  console.log('Pulse count:', pulseCount);
  console.log('Body text:', bodyText);
});
