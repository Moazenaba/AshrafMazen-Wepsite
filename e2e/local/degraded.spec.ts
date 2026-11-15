import { expect, test } from '@playwright/test';
import { consoleErrors, mockServer } from '../fixtures/mock';

test('when /api/site fails and nothing is saved, the page shows the retry state, not a blank page', async ({ page }) => {
  // The direct database reads fail too (no lessons), so there is nothing to show
  await mockServer(page, { site: 'fail', lessons: [] });
  await page.route('**/*.supabase.co/**', (route) => route.fulfill({ status: 500, contentType: 'application/json', body: '{"message":"down"}' }));
  await page.goto('/');
  await expect(page.getByRole('alert').filter({ hasText: 'تعذّر تحميل المحتوى الآن' })).toBeVisible({ timeout: 15000 });
  await expect(page.getByRole('button', { name: 'إعادة المحاولة' })).toBeVisible();
  // The failing database reads are logged by the data layer on purpose
  expect(consoleErrors(page).filter((e) => !/Supabase|supabase|home data|get[A-Z]\w+ error|حدث خطأ أثناء معالجة/i.test(e))).toEqual([]);
});

test('when /api/youtube-library fails the home page still shows the lessons', async ({ page }) => {
  await mockServer(page, { library: 'fail' });
  await page.goto('/');
  await expect(page.getByText('الدرس الخامس شروط لا إله إلا الله').first()).toBeVisible();
  expect(consoleErrors(page)).toEqual([]);
});
