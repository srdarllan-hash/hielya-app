import { openHomePresentation, presentationStates } from '../integration/home-presentation.fixtures';
import { expect, test } from '@playwright/test';
import fs from 'node:fs';
import path from 'node:path';

const states = presentationStates;

for (const state of states) {
  test(`C-005 presentation ${state} visual baseline`, async ({ page }, testInfo) => {
    await openHomePresentation(page, state);
    await page.waitForLoadState('networkidle');
    await page.evaluate(async () => {
      await document.fonts.ready;
    });

    // Preserve pre-integration PNGs; this namespace records the certified catalog presentation.
    await expect(page).toHaveScreenshot(`C-005-PRESENTATION-CATALOG-V1-${state}.png`, {
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
