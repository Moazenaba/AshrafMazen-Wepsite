import { expect, test } from '@playwright/test';
import { consoleErrors, mockServer } from '../fixtures/mock';

test.beforeEach(async ({ page }) => {
  await mockServer(page);
});

// The links of the top bar (desktop width): each opens a page with a heading and no error screen
const PAGES = [
  { label: 'المرئيات', path: '/videos' },
  { label: 'الصوتيات', path: '/audio' },
  { label: 'المكتبة', path: '/books' },
  { label: 'المحفوظات', path: '/bookmarks' },
];

test('every top-bar link opens a page with a heading and no error screen', async ({ page }) => {
  await page.setViewportSize({ width: 1280, height: 800 });
  await page.goto('/');
  for (const { label, path } of PAGES) {
    await page.getByRole('navigation', { name: 'القائمة الرئيسية' }).getByRole('link', { name: new RegExp(label) }).click();
    await expect(page).toHaveURL(new RegExp(`${path}$`));
    await expect(page.getByRole('heading', { level: 1 }).first()).toBeVisible();
    await expect(page.getByText('تعذّر عرض هذه الصفحة')).toHaveCount(0);
  }
  expect(consoleErrors(page)).toEqual([]);
});

test('the browser back button returns to the previous page', async ({ page }) => {
  await page.setViewportSize({ width: 1280, height: 800 });
  await page.goto('/');
  await page.getByRole('navigation', { name: 'القائمة الرئيسية' }).getByRole('link', { name: /المكتبة/ }).click();
  await expect(page).toHaveURL(/\/books$/);
  await page.goBack();
  await expect(page).toHaveURL(/\/$/);
  expect(consoleErrors(page)).toEqual([]);
});
