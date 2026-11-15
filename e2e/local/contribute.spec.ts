import { expect, test } from '@playwright/test';
import { consoleErrors, mockServer } from '../fixtures/mock';

test('an empty form is not accepted: the server answer is shown and no thank-you appears', async ({ page }) => {
  // The form has no browser validation (noValidate); the server function is what refuses an empty request
  await mockServer(page, { submit: { status: 400, body: { error: 'يرجى كتابة العنوان.' } } });
  await page.goto('/contribute');
  await page.getByRole('button', { name: 'إرسال للمراجعة' }).click();
  await expect(page.getByRole('alert').filter({ hasText: 'يرجى كتابة العنوان.' })).toBeVisible();
  await expect(page.getByText('جزاك الله خيراً')).toHaveCount(0);
  expect(consoleErrors(page)).toEqual([]);
});

test('a valid form posts once and shows the thank-you state', async ({ page }) => {
  await mockServer(page);
  const bodies: Record<string, unknown>[] = [];
  await page.route('**/api/submit', (route) => {
    bodies.push(route.request().postDataJSON());
    return route.fulfill({ status: 201, contentType: 'application/json', body: '{"ok":true}' });
  });
  await page.goto('/contribute');
  await page.locator('#c-title').fill('كتاب مقترح');
  await page.locator('#c-url').fill('https://example.com/book.pdf');
  await page.waitForTimeout(4200); // the form refuses a submit made in the first seconds (a bot sign)
  await page.getByRole('button', { name: 'إرسال للمراجعة' }).click();
  await expect(page.getByText('جزاك الله خيراً')).toBeVisible();
  expect(bodies).toHaveLength(1);
  expect(bodies[0]).toMatchObject({ kind: 'book', title: 'كتاب مقترح', url: 'https://example.com/book.pdf' });
  expect(consoleErrors(page)).toEqual([]);
});

test('a 500 answer shows an error and keeps the typed text', async ({ page }) => {
  await mockServer(page, { submit: { status: 500, body: { error: 'تعذّر حفظ الطلب الآن.' } } });
  await page.goto('/contribute');
  await page.locator('#c-title').fill('كتاب مقترح');
  await page.locator('#c-url').fill('https://example.com/book.pdf');
  await page.getByRole('button', { name: 'إرسال للمراجعة' }).click();
  await expect(page.getByRole('alert').filter({ hasText: 'تعذّر حفظ الطلب الآن.' })).toBeVisible();
  await expect(page.locator('#c-title')).toHaveValue('كتاب مقترح');
  expect(consoleErrors(page)).toEqual([]);
});
