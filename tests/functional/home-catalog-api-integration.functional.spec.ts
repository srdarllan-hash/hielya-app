import { expect, test } from '@playwright/test';

import {
  CATEGORY_BEER_ID,
  collectRuntimeErrors,
  installCatalogErrorRoutes,
  installSyntheticCatalogRoutes,
  syntheticCategories,
  syntheticProducts,
  type RuntimeErrorCollector,
} from '../integration/home-catalog-api-integration.fixtures';

const forbiddenPublicFields = [
  'physicalStock',
  'availableStock',
  'reservedStock',
  'safetyStock',
  'remainingQuantity',
  'bundleAvailabilityCount',
  'purchaseCost',
  'margin',
  'inventoryBatch',
  'reorderPoint',
];

const allowedApiPaths = new Set([
  'GET /api/v1/catalog/categories',
  'GET /api/v1/catalog/products',
]);

let apiRequests: string[];
let runtimeErrors: RuntimeErrorCollector;

test.beforeEach(async ({ page }) => {
  apiRequests = [];
  runtimeErrors = collectRuntimeErrors(page);
  page.on('request', (request) => {
    const url = new URL(request.url());
    if (url.pathname.startsWith('/api/v1/')) {
      apiRequests.push(`${request.method()} ${url.pathname}`);
    }
  });
});

test.afterEach(async () => {
  expect(new Set(apiRequests)).toEqual(allowedApiPaths);
  expect(runtimeErrors.errors).toEqual([]);
});

test('canonical Next HTTP path renders EMPTY without synthetic fallback or mutations', async ({ page }) => {
  await page.goto('/');

  await expect(page.locator('[data-home-catalog-state="HOME_CATALOG_EMPTY"]')).toBeVisible();
  await expect(page.getByText('Catálogo temporalmente vacío')).toBeVisible();
  await expect(page.getByText('Agua sintética fría')).toHaveCount(0);
  expect(new Set(apiRequests)).toEqual(allowedApiPaths);
});

test('synthetic fixtures exercise READY, unit, pack, ice, alcohol and availability presentation', async ({ page }) => {
  await installSyntheticCatalogRoutes(page);
  await page.goto('/');

  await expect(page.locator('[data-home-catalog-state="HOME_CATALOG_READY"]')).toBeVisible();
  await expect(page.getByText('Agua sintética fría')).toBeVisible();
  await expect(page.getByText('Pack sintético frío con hielo')).toBeVisible();
  await expect(page.getByText('Hielo incluido')).toBeVisible();
  await expect(page.getByText('Venta 18+').first()).toBeVisible();
  await expect(page.getByText('Temporalmente no disponible')).toBeVisible();

  const requestsBeforeNonAuthorizedActions = apiRequests.length;
  await page.getByRole('button', { name: 'Abrir perfil' }).click();
  await page.getByRole('button', { name: 'Abrir carrito' }).click();
  await page.getByRole('button', { name: 'Añadir Agua sintética fría al carrito' }).click();
  await page.getByRole('button', { name: 'Añadir Pack sintético frío con hielo al carrito' }).click();
  await page.waitForTimeout(100);
  expect(apiRequests).toHaveLength(requestsBeforeNonAuthorizedActions);

  const body = await page.locator('body').innerText();
  for (const field of forbiddenPublicFields) expect(body).not.toContain(field);
});

test('search and category selection call the products API with the certified query contract', async ({ page }) => {
  const routes = await installSyntheticCatalogRoutes(page);
  await page.goto('/');
  await expect(page.locator('[data-home-catalog-state="HOME_CATALOG_READY"]')).toBeVisible();

  const search = page.getByRole('searchbox', { name: 'Busca productos' });
  await search.fill('Agua');
  await search.press('Enter');
  await expect(page.getByText('Agua sintética fría')).toBeVisible();
  await expect.poll(() => routes.calls.some((value) => {
    const url = new URL(value);
    return url.pathname === '/api/v1/catalog/products'
      && url.searchParams.get('q') === 'Agua'
      && url.searchParams.get('page') === '1'
      && url.searchParams.get('pageSize') === '20';
  })).toBe(true);

  await search.fill('');
  await search.press('Enter');
  await expect(page.getByText('Pack sintético frío con hielo')).toBeVisible();
  await page.getByRole('button', { name: 'Cervezas de prueba' }).click();
  await expect(page.getByText('Pack sintético frío con hielo')).toBeVisible();
  await expect.poll(() => routes.calls.some((value) => {
    const url = new URL(value);
    return url.pathname === '/api/v1/catalog/products'
      && url.searchParams.get('category') === CATEGORY_BEER_ID;
  })).toBe(true);
});

test('an empty filtered result preserves controls and can recover without a fallback', async ({ page }) => {
  await installSyntheticCatalogRoutes(page);
  await page.goto('/');
  await expect(page.locator('[data-home-catalog-state="HOME_CATALOG_READY"]')).toBeVisible();

  const search = page.getByRole('searchbox', { name: 'Busca productos' });
  await search.fill('sin coincidencia');
  await search.press('Enter');

  await expect(page.locator('[data-home-catalog-state="HOME_CATALOG_READY"]')).toBeVisible();
  await expect(page.getByRole('heading', { name: 'No encontramos productos' })).toBeVisible();
  await expect(page.getByText('Agua sintética fría')).toHaveCount(0);

  await page.getByRole('button', { name: 'Limpiar filtros' }).click();
  await expect(page.getByText('Agua sintética fría')).toBeVisible();
  await expect(page.getByText('Pack sintético frío con hielo')).toBeVisible();
  await expect(search).toHaveValue('');
});

test('HTTP 400 exposes only the safe public message', async ({ page }) => {
  await installCatalogErrorRoutes(page, 400, 'Solicitud de catálogo inválida.');
  await page.goto('/');
  await expect(page.locator('[data-home-catalog-state="HOME_CATALOG_ERROR"]')).toBeVisible();
  await expect(page.getByText('Solicitud de catálogo inválida.')).toBeVisible();
  await expect(page.locator('body')).not.toContainText(/stack|sqlite|select\s|\/workspace\//i);
});

test('unexpected server failure is controlled and does not expose internal details', async ({ page }) => {
  await page.route(/\/api\/v1\/catalog\/(?:categories|products)(?:\?.*)?$/, async (route) => {
    await route.fulfill({
      status: 500,
      contentType: 'application/json',
      body: JSON.stringify({ internal: 'runtime database is not configured' }),
    });
  });
  await page.goto('/');
  await expect(page.locator('[data-home-catalog-state="HOME_CATALOG_ERROR"]')).toBeVisible();
  await expect(page.getByText('No pudimos cargar el catálogo. Inténtalo de nuevo.')).toBeVisible();
  await expect(page.getByText('runtime database is not configured')).toHaveCount(0);
});

test('invalid payload fails closed without rendering injected data', async ({ page }) => {
  await installSyntheticCatalogRoutes(page, {
    categories: [{ ...syntheticCategories[0], physicalStock: 99 }],
  });
  await page.goto('/');
  await expect(page.locator('[data-home-catalog-state="HOME_CATALOG_ERROR"]')).toBeVisible();
  await expect(page.getByText('Cervezas de prueba')).toHaveCount(0);
});

test('a later search wins when an older response completes out of order', async ({ page }) => {
  await page.route(/\/api\/v1\/catalog\/categories(?:\?.*)?$/, async (route) => {
    await route.fulfill({ json: syntheticCategories });
  });
  await page.route(/\/api\/v1\/catalog\/products(?:\?.*)?$/, async (route) => {
    const url = new URL(route.request().url());
    const query = url.searchParams.get('q');
    if (query === 'primera') await new Promise((resolve) => setTimeout(resolve, 500));
    const items = query === 'segunda' ? [syntheticProducts[0]] : syntheticProducts;
    try {
      await route.fulfill({ json: { items, page: 1, pageSize: 20, total: items.length } });
    } catch {
      // An aborted stale request is the expected outcome for the first search.
    }
  });
  await page.goto('/');
  await expect(page.locator('[data-home-catalog-state="HOME_CATALOG_READY"]')).toBeVisible();

  const search = page.getByRole('searchbox', { name: 'Busca productos' });
  await search.fill('primera');
  await search.press('Enter');
  await search.fill('segunda');
  await search.press('Enter');
  await expect(page.getByText('Agua sintética fría')).toBeVisible();
  await page.waitForTimeout(600);
  await expect(page.locator('[data-home-catalog-state="HOME_CATALOG_READY"]')).toBeVisible();
  await expect(page.getByText('Pack sintético frío con hielo')).toHaveCount(0);
});
