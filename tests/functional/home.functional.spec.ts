import { expect, test } from '@playwright/test';

const states = ['ready', 'loading', 'closed', 'high-demand', 'error', 'empty-cart', 'alcohol-cutoff', 'out-of-area'] as const;

for (const state of states) {
  test(`C-005 ${state} renders without console errors and exposes generic screen state`, async ({ page }) => {
    const errors: string[] = [];
    page.on('console', (message) => {
      if (message.type() === 'error') errors.push(message.text());
    });
    page.on('pageerror', (error) => errors.push(error.message));
    await page.goto(`/?state=${state}`);
    await expect(page.locator('.hly-app-shell')).toHaveAttribute('data-screen-state', state);
    expect(await page.locator('.hly-app-shell').getAttribute('data-home-state')).toBeNull();
    expect(errors).toEqual([]);
  });
}

test('C-005 interactive controls emit typed UI actions', async ({ page }) => {
  await page.goto('/?state=ready');
  await page.evaluate(() => {
    (window as typeof window & { __hielyaActions?: unknown[] }).__hielyaActions = [];
    window.addEventListener('hielya:ui-action', (event) => {
      (window as typeof window & { __hielyaActions?: unknown[] }).__hielyaActions?.push((event as CustomEvent).detail);
    });
  });
  await page.getByRole('button', { name: 'Abrir carrito' }).click();
  await page.getByRole('button', { name: 'Cambiar dirección de entrega' }).click();
  await page.getByRole('button', { name: 'Cervezas' }).click();
  await page.getByRole('button', { name: 'Añadir Victoria Málaga al carrito' }).click();
  const actions = await page.evaluate(() => (window as typeof window & { __hielyaActions?: unknown[] }).__hielyaActions);
  expect(actions).toEqual(expect.arrayContaining([
    expect.objectContaining({ action: 'open-cart' }),
    expect.objectContaining({ action: 'change-address' }),
    expect.objectContaining({ action: 'select-category' }),
    expect.objectContaining({ action: 'add-product' }),
  ]));
});
