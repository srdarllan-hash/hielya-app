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

for (const state of states) {
  test(`C-001 ${state} renders without console errors`, async ({ page }) => {
    const errors: string[] = [];
    page.on('console', (message) => {
      if (message.type() === 'error') errors.push(message.text());
    });
    page.on('pageerror', (error) => errors.push(error.message));

    if (state === 'reduced-motion') await page.emulateMedia({ reducedMotion: 'reduce' });
    await page.goto(`/splash?state=${state}`);
    await expect(page.locator('[data-screen-id="C-001"]')).toHaveAttribute('data-state', state);
    await expect(page.locator('.hly-bottom-nav')).toHaveCount(0);
    await expect(page.locator('.hly-app-header__actions')).toBeHidden();
    expect(errors).toEqual([]);
  });
}

test('C-001 contracts first access to C-002 only', async ({ page }) => {
  await page.goto('/splash?state=ready-location');
  const splash = page.locator('[data-screen-id="C-001"]');
  await expect(splash).toHaveAttribute('data-next-screen', 'C-002');
  await expect(page.locator('[data-screen-id="C-002"]')).toHaveCount(0);
});

test('C-001 contracts returning context to frozen C-005', async ({ page }) => {
  await page.goto('/splash?state=ready-home');
  await expect(page.locator('[data-screen-id="C-001"]')).toHaveAttribute('data-next-screen', 'C-005');
});

test('C-001 does not route to phone login or OTP', async ({ page }) => {
  await page.goto('/splash?state=loading');
  const next = await page.locator('[data-screen-id="C-001"]').getAttribute('data-next-screen');
  expect(next).not.toBe('C-003');
  expect(next).not.toBe('C-004');
});

test.each(['offline', 'error', 'timeout'] as const)('C-001 %s exposes a keyboard reachable retry', async ({ page }, state) => {
  await page.goto(`/splash?state=${state}`);
  const retry = page.getByRole('button', { name: 'Intentar de nuevo' });
  await expect(retry).toBeVisible();
  await retry.focus();
  await expect(retry).toBeFocused();
});
