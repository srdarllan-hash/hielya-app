import { openHomePresentation, presentationStates } from '../integration/home-presentation.fixtures';
import { expect, test } from '@playwright/test';
import { collectRuntimeErrors, installPausedCatalogRoutes, installSyntheticCatalogRoutes } from '../integration/home-catalog-api-integration.fixtures';

// The public route has catalog states, not the historical ?state= presentation API.
// Run these against Next; the scenarios below retain component-only coverage in Storybook.
for (const state of ['READY', 'EMPTY', 'ERROR'] as const) {
  test(`C-005 runtime ${state} completes catalog requests without unexpected console errors`, async ({ page }) => {
    const errors = collectRuntimeErrors(page);
    const unexpectedResponses: string[] = [];
    page.on('response', (response) => {
      if (response.status() >= 400) unexpectedResponses.push(`${response.status()} ${response.url()}`);
    });
    await installSyntheticCatalogRoutes(page, state === 'EMPTY'
      ? { categories: [], products: [] }
      // A successful HTTP response with an invalid schema exercises controlled ERROR
      // without accepting/suppressing any browser console errors.
      : state === 'ERROR' ? { categories: { invalid: true } } : {});
    const responses = Promise.all(['categories', 'products'].map((resource) =>
      page.waitForResponse((response) => new URL(response.url()).pathname === `/api/v1/catalog/${resource}`),
    ));
    await page.goto('/');
    await Promise.all((await responses).map((response) => response.finished()));
    await expect(page.locator('.hly-app-shell')).toHaveAttribute('data-home-catalog-state', `HOME_CATALOG_${state}`);
    expect(await page.locator('.hly-app-shell').getAttribute('data-home-state')).toBeNull();
    expect(unexpectedResponses).toEqual([]);
    expect(errors.errors).toEqual([]);
  });
}

test('C-005 runtime loading waits for both responses before checking READY and console errors', async ({ page }) => {
  const errors = collectRuntimeErrors(page);
  const routes = await installPausedCatalogRoutes(page);
  const responses = Promise.all(['categories', 'products'].map((resource) =>
    page.waitForResponse((response) => new URL(response.url()).pathname === `/api/v1/catalog/${resource}`),
  ));
  await page.goto('/', { waitUntil: 'domcontentloaded' });
  try {
    await expect(page.locator('.hly-app-shell')).toHaveAttribute('data-home-catalog-state', 'HOME_CATALOG_LOADING');
    // This was the old false readiness signal behind the mobile-360 race.
    await expect(page.locator('.hly-app-shell')).toHaveAttribute('data-screen-state', 'ready');
  } finally {
    routes.release();
  }
  for (const response of await responses) {
    expect(response.status()).toBe(200);
    await response.finished();
  }
  await expect(page.locator('.hly-app-shell')).toHaveAttribute('data-home-catalog-state', 'HOME_CATALOG_READY');
  expect(errors.errors).toEqual([]);
});

const states = presentationStates;

for (const state of states) {
  test(`C-005 presentation ${state} renders without console errors and exposes generic screen state`, async ({ page }) => {
    const errors: string[] = [];
    page.on('console', (message) => {
      if (message.type() === 'error') errors.push(message.text());
    });
    page.on('pageerror', (error) => errors.push(error.message));
    await openHomePresentation(page, state);
    await expect(page.locator('.hly-app-shell')).toHaveAttribute('data-screen-state', state);
    expect(await page.locator('.hly-app-shell').getAttribute('data-home-state')).toBeNull();
    expect(errors).toEqual([]);
  });
}

test('C-005 presentation interactive controls emit typed UI actions', async ({ page }) => {
  await openHomePresentation(page, 'ready');
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
