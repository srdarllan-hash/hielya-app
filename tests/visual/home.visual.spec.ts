import { expect, test } from '@playwright/test';
import fs from 'node:fs';
import path from 'node:path';

const states = [
  'ready',
  'loading',
  'closed',
  'high-demand',
  'error',
  'empty-cart',
  'alcohol-cutoff',
  'out-of-area',
] as const;

for (const state of states) {
  test(`C-005 ${state} visual baseline`, async ({ page }, testInfo) => {
    await page.goto(`/?state=${state}`);
    await page.waitForLoadState('networkidle');
    await page.evaluate(async () => {
      await document.fonts.ready;
    });

    await expect(page).toHaveScreenshot(`C-005-${state}.png`, {
      animations: 'disabled',
      fullPage: false,
    });

    const directory = path.join('screenshots', testInfo.project.name);
    fs.mkdirSync(directory, { recursive: true });
    await page.screenshot({
      path: path.join(directory, `C-005_HOME_${state.toUpperCase()}.png`),
      fullPage: false,
    });

    if (state === 'ready') {
      await page.locator('.hly-bottom-nav').evaluate((element) => {
        (element as HTMLElement).style.display = 'none';
      });
      await page.screenshot({
        path: path.join(directory, 'C-005_HOME_READY_FULLPAGE.png'),
        fullPage: true,
      });
    }
  });
}
