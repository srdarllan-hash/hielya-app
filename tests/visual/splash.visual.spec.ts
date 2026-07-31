import { createHash } from 'node:crypto';
import fs from 'node:fs';
import path from 'node:path';
import { expect, test } from '@playwright/test';

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

const baselinePath = path.join(process.cwd(), 'manifests', 'C-001-visual-baseline.json');
const baselineMode = process.env.BASELINE_MODE ?? 'GATE_VALIDATION';
const authoringMode = baselineMode === 'BASELINE_AUTHORING';
if (!authoringMode && !fs.existsSync(baselinePath)) {
  throw new Error('C-001 approved visual baseline is missing in GATE_VALIDATION mode');
}
const expected = fs.existsSync(baselinePath)
  ? (JSON.parse(fs.readFileSync(baselinePath, 'utf8')) as { hashes: Record<string, string> })
  : null;

for (const state of states) {
  test(`C-001 ${state} visual and responsive contract`, async ({ page }, testInfo) => {
    if (state === 'reduced-motion') await page.emulateMedia({ reducedMotion: 'reduce' });
    await page.goto(`/splash?state=${state}`);
    await page.evaluate(() => document.fonts.ready);

    const splash = page.locator('[data-screen-id="C-001"]');
    await expect(splash).toBeVisible();

    const buffer = await splash.screenshot({ animations: 'disabled' });
    const hash = createHash('sha256').update(buffer).digest('hex');
    const key = `${testInfo.project.name}:${state}`;

    const screenshotDir = path.join('screenshots', 'c001', testInfo.project.name);
    fs.mkdirSync(screenshotDir, { recursive: true });
    fs.writeFileSync(path.join(screenshotDir, `C-001_SPLASH_${state.toUpperCase()}.png`), buffer);

    if (state === 'loading') {
      await page.screenshot({
        path: path.join(screenshotDir, 'C-001_SPLASH_LOADING_FULLPAGE.png'),
        fullPage: true,
        animations: 'disabled',
      });
    }

    const candidateDir = path.join('qa', 'c001', 'visual-candidates', testInfo.project.name);
    fs.mkdirSync(candidateDir, { recursive: true });
    fs.writeFileSync(
      path.join(candidateDir, `${state}.json`),
      JSON.stringify({ key, hash, state, project: testInfo.project.name }, null, 2),
    );

    if (!authoringMode) {
      expect(expected?.hashes[key], `Approved visual hash missing for ${key}`).toBeTruthy();
      expect(hash, `Visual hash mismatch for ${key}`).toBe(expected?.hashes[key]);
    }

    const geometry = await page.evaluate(() => {
      const root = document.querySelector<HTMLElement>('[data-screen-id="C-001"]');
      const brand = root?.querySelector<HTMLElement>('[role="img"]');
      const status = root?.querySelector<HTMLElement>('[role="status"], [role="alert"]');
      const indicator = root?.querySelector<HTMLElement>('[aria-hidden="true"][class*="indicator"]');
      if (!root || !brand || !status || !indicator) throw new Error('C-001 geometry nodes missing');
      const rootRect = root.getBoundingClientRect();
      const brandRect = brand.getBoundingClientRect();
      const statusRect = status.getBoundingClientRect();
      const indicatorStyle = getComputedStyle(indicator);
      return {
        viewport: { width: innerWidth, height: innerHeight },
        root: { width: rootRect.width, height: rootRect.height },
        brandCenter: { x: brandRect.x + brandRect.width / 2, y: brandRect.y + brandRect.height / 2 },
        statusBottom: statusRect.bottom,
        background: getComputedStyle(root).backgroundColor,
        animationName: indicatorStyle.animationName,
        scrollWidth: document.documentElement.scrollWidth,
      };
    });

    expect(geometry.background).toBe('rgb(0, 0, 0)');
    expect(Math.abs(geometry.brandCenter.x - geometry.viewport.width / 2)).toBeLessThanOrEqual(3);
    expect(geometry.brandCenter.y).toBeGreaterThanOrEqual(geometry.viewport.height * 0.25);
    expect(geometry.brandCenter.y).toBeLessThanOrEqual(geometry.viewport.height * 0.5);
    expect(geometry.statusBottom).toBeLessThanOrEqual(geometry.viewport.height);
    expect(geometry.scrollWidth).toBeLessThanOrEqual(geometry.viewport.width);
    if (state === 'reduced-motion') expect(geometry.animationName).toBe('none');

    const geometryDir = path.join('qa', 'c001', 'responsive', testInfo.project.name);
    fs.mkdirSync(geometryDir, { recursive: true });
    fs.writeFileSync(path.join(geometryDir, `${state}.json`), JSON.stringify(geometry, null, 2));
  });
}
