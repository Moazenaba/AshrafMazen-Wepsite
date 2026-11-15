import { expect, test } from '@playwright/test';
import { consoleErrors, mockServer } from '../fixtures/mock';

test.beforeEach(async ({ page }) => {
  await mockServer(page);
});

const box = (page: import('@playwright/test').Page) => page.getByPlaceholder(/عنوان درس أو فيديو أو كتاب/);

test('typing a word of a title lists that lesson', async ({ page }) => {
  await page.goto('/search');
  await box(page).fill('الطهارة');
  await expect(page.getByText('الدرس الثالث كتاب الطهارة').first()).toBeVisible();
  expect(consoleErrors(page)).toEqual([]);
});

test('different Arabic letter forms still find the lesson', async ({ page }) => {
  await page.goto('/search');
  // "الاصول" with a plain alef finds the series "شرح الأصول الثلاثة" (أ and ا are the same letter for search)
  await box(page).fill('الاصول');
  await expect(page.getByText('الدرس الأول معنى التوحيد').first()).toBeVisible();
  expect(consoleErrors(page)).toEqual([]);
});

test('nonsense shows the empty state', async ({ page }) => {
  await page.goto('/search');
  await box(page).fill('زززززز');
  await expect(page.getByText(/لا توجد دروس مرفوعة على الموقع تطابق/)).toBeVisible();
  expect(consoleErrors(page)).toEqual([]);
});
