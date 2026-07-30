import { expect, test } from '@playwright/test';
import AxeBuilder from '@axe-core/playwright';

const states = [
  'initial',
  'loading',
  'transition',
  'offline',
  'error',
  'timeout',
  'maintenance',
  'ready-location',
  'ready-home',
  'reduced-motion',
] as const;

for (const state of states) {
  test(`C-001 ${state} has no WCAG 2.1 A/AA axe violations`, async ({ page }) => {
    if (state === 'reduced-motion') await page.emulateMedia({ reducedMotion: 'reduce' });
    await page.goto(`/splash?state=${state}`);
    await page.evaluate(() => document.fonts.ready);
    const results = await new AxeBuilder({ page })
      .withTags(['wcag2a', 'wcag2aa', 'wcag21a', 'wcag21aa'])
      .analyze();
    expect(results.violations).toEqual([]);
  });
}
