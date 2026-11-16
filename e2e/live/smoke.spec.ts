import { expect, test } from '@playwright/test';

// Read-only checks of a deployed address (E2E_BASE_URL). Only GET requests; never signs in, never submits a form.
test.skip(!process.env.E2E_BASE_URL, 'set E2E_BASE_URL to run the live checks');

test('the home page answers and shows a heading, with the security header', async ({ page }) => {
  const errors: string[] = [];
  page.on('pageerror', (e) => errors.push(e.message));
  const response = await page.goto('/');
  expect(response?.status()).toBe(200);
  expect(response?.headers()['content-security-policy']).toBeTruthy();
  await expect(page.getByRole('heading', { level: 1 }).first()).toBeVisible();
  expect(errors).toEqual([]);
});

test('/api/site lists lessons and the first lesson link opens', async ({ page, request }) => {
  const data = await (await request.get('/api/site')).json();
  expect(data.lessons.length).toBeGreaterThan(0);
  await page.goto(`/lesson/${data.lessons[0].id}`);
  await expect(page.getByRole('heading', { level: 1 }).first()).toBeVisible();
});

test('/admin shows the login form and nothing of the dashboard', async ({ page }) => {
  await page.goto('/admin');
  await expect(page.locator('input[type="password"]').first()).toBeVisible();
  await expect(page.getByRole('button', { name: /^الدروس/ })).toHaveCount(0);
});
