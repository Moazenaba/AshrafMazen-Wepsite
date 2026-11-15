import { expect, test } from '@playwright/test';
import { consoleErrors, mockServer } from '../fixtures/mock';

test.use({ viewport: { width: 375, height: 812 } });

test.beforeEach(async ({ page }) => {
  await mockServer(page);
});

for (const path of ['/', '/lesson/lesson-text', '/books']) {
  test(`no horizontal scroll on ${path}`, async ({ page }) => {
    await page.goto(path);
    await expect(page.getByRole('heading', { level: 1 }).first()).toBeVisible();
    const overflow = await page.evaluate(() => document.documentElement.scrollWidth - document.documentElement.clientWidth);
    expect(overflow).toBeLessThanOrEqual(0);
    expect(consoleErrors(page)).toEqual([]);
  });
}

test('the menu button opens the menu', async ({ page }) => {
  await page.goto('/');
  await page.getByRole('button', { name: 'فتح القائمة' }).click();
  await expect(page.getByRole('button', { name: 'إغلاق القائمة' }).first()).toBeVisible();
  expect(consoleErrors(page)).toEqual([]);
});
