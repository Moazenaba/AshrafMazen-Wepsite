import AxeBuilder from '@axe-core/playwright';
import { expect, test } from '@playwright/test';
import { mockServer } from '../fixtures/mock';

test.beforeEach(async ({ page }) => {
  await mockServer(page);
});

// Violations of impact critical or serious fail the test; the list is printed to make a failure readable
for (const path of ['/', '/lesson/lesson-text', '/books', '/contribute']) {
  test(`no critical or serious accessibility violations on ${path}`, async ({ page }) => {
    // Entrance animations are off, so contrast is measured on the finished page and not mid-fade
    await page.emulateMedia({ reducedMotion: 'reduce' });
    await page.goto(path);
    await expect(page.getByRole('heading', { level: 1 }).first()).toBeVisible();
    const result = await new AxeBuilder({ page }).analyze();
    const bad = result.violations.filter((v) => v.impact === 'critical' || v.impact === 'serious');
    expect(bad.map((v) => `${v.id}: ${v.nodes.map((n) => n.target.join(' ')).slice(0, 3).join(' | ')}`)).toEqual([]);
  });
}
