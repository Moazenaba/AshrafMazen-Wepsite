import { expect, test } from '@playwright/test';
import { consoleErrors, mockServer } from '../fixtures/mock';

test.beforeEach(async ({ page }) => {
  await mockServer(page);
});

test('the library lists both books', async ({ page }) => {
  await page.goto('/books');
  await expect(page.getByText('كتاب التوحيد المختصر').first()).toBeVisible();
  await expect(page.getByText('رسالة في الطهارة').first()).toBeVisible();
  expect(consoleErrors(page)).toEqual([]);
});

test('opening a book shows its title', async ({ page }) => {
  await page.goto('/books');
  await page.getByRole('link', { name: /كتاب التوحيد المختصر/ }).first().click();
  await expect(page).toHaveURL(/\/book\/book-1$/);
  await expect(page.getByRole('heading', { level: 1 })).toContainText('كتاب التوحيد المختصر');
  expect(consoleErrors(page)).toEqual([]);
});
