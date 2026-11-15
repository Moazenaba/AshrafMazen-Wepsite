import { expect, test } from '@playwright/test';
import { consoleErrors, mockServer } from '../fixtures/mock';

test.beforeEach(async ({ page }) => {
  await mockServer(page);
});

test('the home page shows the hero, the featured lesson and not the draft', async ({ page }) => {
  await page.goto('/');
  await expect(page.locator('html')).toHaveAttribute('dir', 'rtl');
  await expect(page.getByText('الاسم التجريبي للشيخ').first()).toBeVisible();
  await expect(page.getByText('الدرس الخامس شروط لا إله إلا الله').first()).toBeVisible();
  await expect(page.getByText('مسودة لا يراها الزوار')).toHaveCount(0);
  expect(consoleErrors(page)).toEqual([]);
});
