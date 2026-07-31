import { expect, test } from '@playwright/test';
import AxeBuilder from '@axe-core/playwright';

const states = [
  'idle','requesting_permission','locating','reverse_geocoding','manual_entry','validating_manual_address','resolved',
  'permission_denied','location_unavailable','timeout','offline','network_error','invalid_address','out_of_area','success',
] as const;

for (const state of states) {
  test(`C-002 ${state} has no WCAG 2.1 A/AA axe violations`, async ({ page }) => {
    await page.goto(`/location?state=${state}&driver=fake`);
    await page.evaluate(() => document.fonts.ready);
    const results = await new AxeBuilder({ page })
      .withTags(['wcag2a','wcag2aa','wcag21a','wcag21aa'])
      .analyze();
    expect(results.violations).toEqual([]);
  });
}

test('C-002 locating respects reduced motion', async ({ page }) => {
  await page.emulateMedia({ reducedMotion: 'reduce' });
  await page.goto('/location?state=locating&driver=fake');
  await expect(page.locator('[data-screen-id="C-002"]')).toBeVisible();
  const results = await new AxeBuilder({ page }).withTags(['wcag2a','wcag2aa','wcag21a','wcag21aa']).analyze();
  expect(results.violations).toEqual([]);
});
