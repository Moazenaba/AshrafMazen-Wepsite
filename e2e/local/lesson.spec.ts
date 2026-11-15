import { expect, test } from '@playwright/test';
import { consoleErrors, mockServer } from '../fixtures/mock';

test.beforeEach(async ({ page }) => {
  await mockServer(page);
});

test('a video lesson shows its title and a player area', async ({ page }) => {
  await page.goto('/lesson/lesson-video');
  await expect(page.getByRole('heading', { level: 1 })).toContainText('معنى التوحيد');
  await expect(page.getByRole('region', { name: 'محتوى الدرس' })).toBeVisible();
  expect(consoleErrors(page)).toEqual([]);
});

test('an audio lesson: pressing play opens the bottom player', async ({ page }) => {
  await page.goto('/lesson/lesson-audio');
  await expect(page.getByRole('heading', { level: 1 })).toContainText('أقسام التوحيد');
  await page.getByRole('region', { name: 'محتوى الدرس' }).getByRole('button', { name: /تشغيل|استماع/ }).first().click();
  await expect(page.getByRole('region', { name: 'المشغل الصوتي' }).or(page.getByLabel('المشغل الصوتي'))).toBeVisible();
  expect(consoleErrors(page)).toEqual([]);
});

test('a written lesson shows its text', async ({ page }) => {
  await page.goto('/lesson/lesson-text');
  await expect(page.getByText('نص مكتوب في أحكام الطهارة وآدابها.')).toBeVisible();
  expect(consoleErrors(page)).toEqual([]);
});

test('an unknown lesson shows the not-available state', async ({ page }) => {
  await page.goto('/lesson/does-not-exist');
  await expect(page.getByRole('heading', { name: 'الدرس غير متاح' })).toBeVisible();
  expect(consoleErrors(page)).toEqual([]);
});
