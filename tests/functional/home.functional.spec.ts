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
      : {});
    const categoryResponse = page.waitForResponse((response) => new URL(response.url()).pathname === '/api/v1/catalog/categories');
    const productResponse = page.waitForResponse((response) => new URL(response.url()).pathname === '/api/v1/catalog/products');
    if (state === 'ERROR') {
      await page.route(/\/api\/v1\/catalog\/products(?:\?.*)?$/, async (route) => {
        // Finish the valid sibling before rejecting the schema. The runtime correctly
        // aborts outstanding siblings on error; awaiting an aborted response would race.
        await (await categoryResponse).finished();
        await route.fulfill({ json: { invalid: true } });
      });
    }
    const responses = Promise.all([categoryResponse, productResponse]);
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
    const notices = {
      closed: 'Tienda cerrada · Volvemos mañana a las 10:00',
      'high-demand': 'Alta demanda · La estimación actual es de 45–60 min',
      'alcohol-cutoff': 'Alcohol no disponible: la entrega debe finalizar antes de las 22:00',
      'out-of-area': 'Esta dirección está fuera del área actual de 4 km',
      'empty-cart': 'Tu carrito está vacío. Añade productos para continuar.',
    };
    if (state in notices) {
      await expect(page.getByText(notices[state as keyof typeof notices], { exact: true })).toBeVisible();
    }
    if (state === 'closed' || state === 'out-of-area') {
      await expect(page.getByRole('searchbox', { name: 'Busca productos' })).toBeDisabled();
      await expect(page.getByRole('button', { name: 'Cervezas', exact: true })).toBeDisabled();
      await expect(page.getByRole('button', { name: 'Victoria Málaga no disponible', exact: true })).toBeDisabled();
    }
    if (state === 'high-demand') {
      await expect(page.getByText('45–60 min', { exact: true })).toBeVisible();
    }
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
