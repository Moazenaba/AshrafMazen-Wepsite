import { expect, test } from '@playwright/test';
import { liveOn } from '../fixtures/data';
import { consoleErrors, mockServer } from '../fixtures/mock';

test('with no live broadcast there is no banner', async ({ page }) => {
  await mockServer(page);
  await page.goto('/');
  await page.waitForTimeout(0);
  await expect(page.getByRole('region', { name: 'بث مباشر' })).toHaveCount(0);
  expect(consoleErrors(page)).toEqual([]);
});

test('with a live broadcast the banner shows on the home page and on a lesson page', async ({ page }) => {
  await mockServer(page, { live: liveOn });
  await page.goto('/');
  await expect(page.getByRole('region', { name: 'بث مباشر' })).toBeVisible({ timeout: 10000 });
  await page.goto('/lesson/lesson-text');
  await expect(page.getByRole('region', { name: 'بث مباشر' })).toBeVisible({ timeout: 10000 });
  expect(consoleErrors(page)).toEqual([]);
});

test('/live shows a frame of the broadcast video', async ({ page }) => {
  await mockServer(page, { live: liveOn });
  await page.goto('/live');
  const frame = page.locator('iframe');
  await expect(frame).toHaveAttribute('src', new RegExp(liveOn.videoId));
  expect(consoleErrors(page)).toEqual([]);
});
