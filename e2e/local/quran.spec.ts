import { expect, test } from '@playwright/test';
import { consoleErrors, mockServer, silence } from '../fixtures/mock';

// Fixtures of MP3Quran v3 (lists) and v4 (text and timings); the audio itself is one second of silence
const server = 'https://server1.mp3quran.net/audio/e2e-reciter/r1';
const reciters = { reciters: [{ id: 1, name: 'قارئ تجريبي', moshaf: [{ id: 10, name: 'حفص', server, rewaya_id: 1, surah_list: '1,2', surah_total: 2 }] }] };
const suwar = { suwar: [{ id: 1, name: 'الفاتحة' }, { id: 2, name: 'البقرة' }] };
const riwayat = { riwayat: [{ id: 1, name: 'حفص' }] };
const words = { data: { words: [[1, 1, 0, 400, 1], [1, 2, 400, 800, 1]], text: { ayahs: [[1, [[1, 'بِسْمِ', 'x', 1], [2, 'ٱللَّهِ', 'x', 2]]]] } } };
const ayahs = { data: { ayahs: [[1, 0, 800]] } };

test.beforeEach(async ({ page }) => {
  await mockServer(page);
  const json = (body: unknown) => ({ status: 200, contentType: 'application/json', headers: { 'access-control-allow-origin': '*' }, body: JSON.stringify(body) });
  await page.route('**/www.mp3quran.net/api/v3/reciters**', (r) => r.fulfill(json(reciters)));
  await page.route('**/www.mp3quran.net/api/v3/suwar**', (r) => r.fulfill(json(suwar)));
  await page.route('**/www.mp3quran.net/api/v3/riwayat**', (r) => r.fulfill(json(riwayat)));
  await page.route('**/api-staging.mp3quran.net/v4/**word-timings**', (r) => r.fulfill(json(words)));
  await page.route('**/api-staging.mp3quran.net/v4/**ayah-timings**', (r) => r.fulfill(json(ayahs)));
  await page.route('**/server1.mp3quran.net/**', (r) => r.fulfill({ status: 200, contentType: 'audio/wav', headers: { 'access-control-allow-origin': '*' }, body: silence() }));
});

test('pick a reciter, open a surah, and see its text', async ({ page }) => {
  await page.goto('/quran');
  await page.getByRole('link', { name: /قارئ تجريبي/ }).first().click();
  await page.getByRole('link', { name: /الفاتحة/ }).first().click();
  await page.getByRole('link', { name: 'قراءة مع الصوت' }).click();
  await expect(page.getByText('ٱللَّهِ')).toBeVisible();
  expect(consoleErrors(page).filter((e) => !/mp3quran|audio|media/i.test(e))).toEqual([]);
});

test('a word gets the highlight class when the audio time moves', async ({ page }) => {
  await page.goto('/quran/read/1/10/1');
  await expect(page.getByText('ٱللَّهِ')).toBeVisible();
  await page.getByRole('button', { name: 'تشغيل' }).click();
  await expect(page.locator('.quran-word.quran-active')).toHaveCount(1, { timeout: 10000 });
});

test('without the text service the surah still has a play button and the notice', async ({ page }) => {
  await page.route('**/api-staging.mp3quran.net/**', (r) => r.fulfill({ status: 500, body: '{}' }));
  await page.goto('/quran/read/1/10/1');
  await expect(page.getByText('النص المتزامن غير متاح لهذه التلاوة الآن.')).toBeVisible();
  await expect(page.getByRole('button', { name: 'تشغيل' })).toBeVisible();
});
