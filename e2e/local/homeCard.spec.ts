import { expect, test } from '@playwright/test';
import { siteBundle } from '../fixtures/data';
import { consoleErrors, mockServer } from '../fixtures/mock';

// The home card the admin sets: a YouTube video alone gives the picture (its first frame) and opens the video;
// the admin screen fills the title from the video when Enter is pressed.
const card = (over: object) => JSON.stringify({ enabled: true, title: 'درس مختار', subtitle: 'قناة الشيخ', imageUrl: '', videoUrl: '', audioUrl: '', buttonLabel: '', ...over });
const withCard = (value: string) => ({ ...siteBundle, settings: [...siteBundle.settings, { key: 'home_feature', value }] });

test('a video link alone shows its first frame and opens the video', async ({ page }) => {
  await mockServer(page, { site: withCard(card({ videoUrl: 'https://youtu.be/loVFoAlqeCc' })) });
  await page.goto('/');
  await expect(page.getByRole('heading', { name: 'درس مختار' })).toBeVisible();
  const src = await page.locator('article img').first().getAttribute('src');
  expect(src).toContain('loVFoAlqeCc');
  await page.getByRole('link', { name: 'شاهد واستمع الآن' }).first().click();
  await expect(page).toHaveURL(/\/video\/loVFoAlqeCc/);
  expect(consoleErrors(page)).toEqual([]);
});

test('a background sound is not played before the visitor taps', async ({ page }) => {
  await mockServer(page, { site: withCard(card({ imageUrl: '/api/r2?file=branding%2Fpic.png', audioUrl: '/api/r2?file=audio%2Fsilence.wav' })) });
  let audioRequests = 0;
  await page.route('**/api/r2?file=audio**', (route) => {
    audioRequests += 1;
    return route.fulfill({ status: 200, contentType: 'audio/wav', body: Buffer.alloc(64) });
  });
  await page.goto('/');
  await expect(page.getByRole('heading', { name: 'درس مختار' })).toBeVisible();
  await page.waitForLoadState('networkidle');
  expect(audioRequests).toBe(0);
  await page.mouse.click(5, 300);
  await expect.poll(() => audioRequests, { timeout: 8000 }).toBeGreaterThan(0);
  expect(consoleErrors(page).filter((e) => !/play|audio|media|NotSupported/i.test(e))).toEqual([]);
});

test('the admin: Enter after the video link fills the title and the line under it, and they stay editable', async ({ page }) => {
  await mockServer(page);
  await page.route('**/www.youtube.com/oembed**', (route) =>
    route.fulfill({ status: 200, contentType: 'application/json', headers: { 'access-control-allow-origin': '*' }, body: JSON.stringify({ title: 'عنوان من يوتيوب', author_name: 'قناة يوتيوب' }) }),
  );
  await page.goto('/dev/admin');
  await page.getByRole('button', { name: /^شكل الموقع/ }).click({ timeout: 25000 });
  await page.getByRole('link', { name: 'البطاقة الكبيرة' }).click();
  await page.getByLabel('رابط فيديو يوتيوب (اختياري)').fill('https://youtu.be/loVFoAlqeCc');
  await page.getByLabel('رابط فيديو يوتيوب (اختياري)').press('Enter');
  await expect(page.getByLabel('العنوان', { exact: true })).toHaveValue('عنوان من يوتيوب');
  await expect(page.getByLabel('السطر تحت العنوان')).toHaveValue('قناة يوتيوب');
  await page.getByLabel('العنوان', { exact: true }).fill('عنواني الخاص');
  await expect(page.getByLabel('العنوان', { exact: true })).toHaveValue('عنواني الخاص');
  await expect(page.getByText('كما ستظهر')).toBeVisible();
});
