import { expect, test } from '@playwright/test';
import { consoleErrors, mockServer } from '../fixtures/mock';

// The admin screens run on /dev/admin: a fake in-memory database and fake storage, no sign-in
test.beforeEach(async ({ page }) => {
  await mockServer(page);
  await page.goto('/dev/admin');
  await expect(page.getByRole('button', { name: /إدارة الدروس/ })).toBeVisible({ timeout: 20000 });
});

test('every tab opens with no console error', async ({ page }) => {
  const tabs = ['الإحصائيات', 'الطلبات', 'فيديوهات القناة', 'الريلز', 'إدارة الدروس', 'إدارة السلاسل', 'إدارة الأقسام', 'المكتبة', 'الأحاديث والأقوال', 'إدارة الواجهة والتواصل', 'البيانات والتكامل'];
  for (const name of tabs) {
    await page.getByRole('button', { name: new RegExp(`^${name}`) }).click();
    await expect(page.getByRole('button', { name: new RegExp(`^${name}`) })).toBeVisible();
  }
  expect(consoleErrors(page).filter((e) => !/\/api\/|Failed to fetch|r2/i.test(e))).toEqual([]);
});

test('a category can be created and edited', async ({ page }) => {
  await page.getByRole('button', { name: /إدارة الأقسام/ }).click();
  await page.getByRole('button', { name: 'إضافة قسم جديد' }).first().click();
  await page.getByPlaceholder(/العقيدة، الفقه/).fill('قسم اختباري');
  await page.getByRole('button', { name: /حفظ|إضافة القسم/ }).last().click();
  await expect(page.getByText('قسم اختباري').first()).toBeVisible();
});

test('an invalid lesson form shows its message and stays open', async ({ page }) => {
  await page.getByRole('button', { name: /إدارة الدروس/ }).click();
  await page.getByRole('button', { name: /إضافة درس/ }).first().click();
  await page.getByRole('button', { name: /حفظ|نشر|إضافة الدرس/ }).last().click();
  // The empty required title stops the save; the window stays open
  expect(await page.getByPlaceholder(/باب فضل التوحيد/).evaluate((el: HTMLInputElement) => el.validity.valueMissing)).toBe(true);
  await expect(page.getByRole('heading', { name: 'إضافة درس جديد' })).toBeVisible();
});

test('a lesson can be created, edited and deleted', async ({ page }) => {
  await page.getByRole('button', { name: /إدارة الدروس/ }).click();
  await page.getByRole('button', { name: /إضافة درس/ }).first().click();
  await page.getByPlaceholder(/باب فضل التوحيد/).fill('درس اختباري جديد');
  await page.locator('textarea').first().fill('نص تفريغ للاختبار');
  await page.getByRole('button', { name: /حفظ|نشر|إضافة الدرس/ }).last().click();
  await expect(page.getByText('درس اختباري جديد').first()).toBeVisible();

  const row = page.getByRole('row').filter({ hasText: 'درس اختباري جديد' });
  await row.getByTitle('تعديل').click();
  await page.getByPlaceholder(/باب فضل التوحيد/).fill('درس اختباري معدل');
  await page.getByRole('button', { name: /حفظ|تحديث/ }).last().click();
  await expect(page.getByText('درس اختباري معدل').first()).toBeVisible();

  await page.getByRole('row').filter({ hasText: 'درس اختباري معدل' }).getByTitle('حذف').click();
  await page.getByRole('button', { name: /تأكيد|حذف/ }).last().click();
  await expect(page.getByText('درس اختباري معدل')).toHaveCount(0);
});
