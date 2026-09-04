import { expect, test } from '@playwright/test';

import {
  installSyntheticCatalogRoutes,
  syntheticProducts,
} from '../integration/home-catalog-api-integration.fixtures';
import {
  collectRuntimeErrors,
  installInvalidProductDetailRoute,
  installProductDetailErrorRoute,
  installSyntheticProductDetailRoute,
  readCanonicalPausedProductId,
  SYNTHETIC_PACK_ID,
  SYNTHETIC_UNAVAILABLE_ID,
  SYNTHETIC_UNIT_ID,
  syntheticAlcoholicPack,
  syntheticAvailableUnit,
  syntheticUnavailableUnit,
  type RuntimeErrorCollector,
} from '../integration/product-detail-api-integration.fixtures';

const forbiddenPublicFields = [
  'physicalStock',
  'availableStock',
  'reservedStock',
  'safetyStock',
  'minimumStock',
  'remainingQuantity',
  'bundleAvailabilityCount',
  'purchaseCost',
  'margin',
  'inventoryBatch',
  'reorderPoint',
  'inventoryMovements',
  'inventoryReservations',
];

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
  expect(runtimeErrors.errors).toEqual([]);
  expect(apiRequests.every((request) => request.startsWith('GET '))).toBe(true);
  expect(apiRequests.every((request) => (
    request === 'GET /api/v1/catalog/categories'
    || request === 'GET /api/v1/catalog/products'
    || /^GET \/api\/v1\/catalog\/products\/[0-9a-f-]+$/i.test(request)
  ))).toBe(true);
});

test('canonical paused product follows the real HTTP path and fails closed as NOT_FOUND', async ({ page }) => {
  runtimeErrors.allowHttpStatus(404);
  const productId = readCanonicalPausedProductId();
  await page.goto(`/products/${productId}`);

  await expect(page.locator('[data-product-detail-state="PRODUCT_DETAIL_NOT_FOUND"]')).toBeVisible();
  await expect(page.getByRole('heading', { name: 'Producto no encontrado' })).toBeVisible();
  await expect(page.getByText('Este producto no está disponible en el catálogo público.')).toBeVisible();
  expect(apiRequests.length).toBeGreaterThanOrEqual(1);
  expect(new Set(apiRequests)).toEqual(new Set([
    `GET /api/v1/catalog/products/${productId}`,
  ]));

  const body = await page.locator('body').innerText();
  expect(body).not.toMatch(/stack|sqlite|select\s|\/workspace\//i);
  for (const field of forbiddenPublicFields) expect(body).not.toContain(field);
});

test('available unit renders only explicit PublicProduct presentation fields', async ({ page }) => {
  await installSyntheticProductDetailRoute(page, syntheticAvailableUnit);
  await page.goto(`/products/${SYNTHETIC_UNIT_ID}`);

  await expect(page.locator('[data-product-detail-state="PRODUCT_DETAIL_READY"]')).toBeVisible();
  await expect(page.getByRole('heading', { name: 'Agua sintética fría' })).toBeVisible();
  await expect(page.getByText('Disponible', { exact: true })).toBeVisible();
  await expect(page.getByText('500 ml', { exact: true })).toBeVisible();
  await expect(page.getByText(/1,75/)).toBeVisible();
  await expect(page.getByText('Composición del pack')).toHaveCount(0);
});

test('unavailable product renders the public commercial state without numeric stock', async ({ page }) => {
  await installSyntheticProductDetailRoute(page, syntheticUnavailableUnit);
  await page.goto(`/products/${SYNTHETIC_UNAVAILABLE_ID}`);

  await expect(page.locator('[data-product-detail-state="PRODUCT_DETAIL_READY"]')).toBeVisible();
  await expect(page.getByText('Temporalmente no disponible', { exact: true })).toBeVisible();
  const body = await page.locator('body').innerText();
  for (const field of forbiddenPublicFields) expect(body).not.toContain(field);
});

test('alcoholic pack presents ice and commercial component quantities, never stock', async ({ page }) => {
  await installSyntheticProductDetailRoute(page, syntheticAlcoholicPack);
  await page.goto(`/products/${SYNTHETIC_PACK_ID}`);

  await expect(page.locator('[data-product-detail-state="PRODUCT_DETAIL_READY"]')).toBeVisible();
  await expect(page.getByText('Pack', { exact: true })).toBeVisible();
  await expect(page.getByText('Hielo incluido', { exact: true })).toBeVisible();
  await expect(page.getByText('Venta 18+', { exact: true })).toBeVisible();
  await expect(page.getByRole('heading', { name: 'Composición del pack' })).toBeVisible();
  await expect(page.getByText('Cerveza sintética fría', { exact: true })).toBeVisible();
  await expect(page.getByText('6 × incluido', { exact: true })).toBeVisible();
  await expect(page.getByText('Hielo sintético', { exact: true })).toBeVisible();
  await expect(page.getByText('1 × incluido', { exact: true })).toBeVisible();

  const body = await page.locator('body').innerText();
  for (const field of forbiddenPublicFields) expect(body).not.toContain(field);
});

test('invalid response payload fails closed and does not render injected internal data', async ({ page }) => {
  await installInvalidProductDetailRoute(page);
  await page.goto(`/products/${SYNTHETIC_UNIT_ID}`);

  await expect(page.locator('[data-product-detail-state="PRODUCT_DETAIL_ERROR"]')).toBeVisible();
  await expect(page.getByRole('heading', { name: 'No pudimos cargar el producto' })).toBeVisible();
  await expect(page.getByText('Agua sintética fría')).toHaveCount(0);
  await expect(page.locator('body')).not.toContainText(/physicalStock|purchaseCost|99/);
});

test('unexpected detail failure is controlled and exposes no internal message', async ({ page }) => {
  runtimeErrors.allowHttpStatus(500);
  await installProductDetailErrorRoute(page, 500);
  await page.goto(`/products/${SYNTHETIC_PACK_ID}`);

  await expect(page.locator('[data-product-detail-state="PRODUCT_DETAIL_ERROR"]')).toBeVisible();
  await expect(page.getByRole('heading', { name: 'No pudimos cargar el producto' })).toBeVisible();
  await expect(page.getByText('No pudimos cargar el producto. Inténtalo de nuevo.')).toBeVisible();
  await expect(page.getByRole('button', { name: 'Reintentar' })).toBeVisible();
  await expect(page.getByText('Internal synthetic detail failure must not be rendered.')).toHaveCount(0);
  await expect(page.locator('body')).not.toContainText(/stack|sqlite|select\s|\/workspace\//i);
});

test('Home navigation uses the public product id and then consumes only the detail endpoint', async ({ page }) => {
  const homeRoutes = await installSyntheticCatalogRoutes(page);
  const detailRoutes = await installSyntheticProductDetailRoute(page, syntheticAvailableUnit);
  await page.goto('/');
  await expect(page.locator('[data-home-catalog-state="HOME_CATALOG_READY"]')).toBeVisible();

  await page.getByLabel('Ver detalles de Agua sintética fría').click();
  await expect(page).toHaveURL(`/products/${syntheticProducts[0].id}`);
  await expect(page.locator('[data-product-detail-state="PRODUCT_DETAIL_READY"]')).toBeVisible();
  await expect(page.getByRole('heading', { name: 'Agua sintética fría' })).toBeVisible();

  expect(new Set(homeRoutes.calls.map((url) => new URL(url).pathname))).toEqual(new Set([
    '/api/v1/catalog/categories',
    '/api/v1/catalog/products',
  ]));
  expect(detailRoutes.calls.length).toBeGreaterThanOrEqual(1);
  expect(new Set(detailRoutes.calls.map((url) => new URL(url).pathname))).toEqual(new Set([
    `/api/v1/catalog/products/${syntheticProducts[0].id}`,
  ]));
});
