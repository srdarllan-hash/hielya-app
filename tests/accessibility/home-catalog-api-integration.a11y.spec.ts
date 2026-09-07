import AxeBuilder from '@axe-core/playwright';
import { expect, test, type Page } from '@playwright/test';

import {
  collectRuntimeErrors,
  installCatalogErrorRoutes,
  installPausedCatalogRoutes,
  installSyntheticCatalogRoutes,
  installNormalStoreRoute,
  type RuntimeErrorCollector,
} from '../integration/home-catalog-api-integration.fixtures';

let runtimeErrors: RuntimeErrorCollector;

test.beforeEach(async ({ page }) => {
  await installNormalStoreRoute(page);
  runtimeErrors = collectRuntimeErrors(page);
});

test.afterEach(async () => {
  expect(runtimeErrors.errors).toEqual([]);
});

const assertAccessible = async (page: Page) => {
  const results = await new AxeBuilder({ page })
    .withTags(['wcag2a', 'wcag2aa', 'wcag21a', 'wcag21aa'])
    .analyze();
  expect(results.violations).toEqual([]);
};

test('C-005 integration READY is WCAG 2.1 AA clean', async ({ page }) => {
  await installSyntheticCatalogRoutes(page);
  await page.goto('/');
  await expect(page.locator('[data-home-catalog-state="HOME_CATALOG_READY"]')).toBeVisible();
  await assertAccessible(page);
});

test('C-005 integration canonical EMPTY is WCAG 2.1 AA clean', async ({ page }) => {
  await page.goto('/');
  await expect(page.locator('[data-home-catalog-state="HOME_CATALOG_EMPTY"]')).toBeVisible();
  await assertAccessible(page);
});

test('C-005 integration ERROR is WCAG 2.1 AA clean', async ({ page }) => {
  runtimeErrors.allowHttpStatus(400);
  await installCatalogErrorRoutes(page);
  await page.goto('/');
  await expect(page.locator('[data-home-catalog-state="HOME_CATALOG_ERROR"]')).toBeVisible();
  await assertAccessible(page);
});

test('C-005 integration LOADING is WCAG 2.1 AA clean', async ({ page }) => {
  const pausedRoutes = await installPausedCatalogRoutes(page);
  await page.goto('/', { waitUntil: 'domcontentloaded' });
  try {
    await expect(page.locator('[data-home-catalog-state="HOME_CATALOG_LOADING"]')).toBeVisible();
    await assertAccessible(page);
  } finally {
    pausedRoutes.release();
  }
  await expect(page.locator('[data-home-catalog-state="HOME_CATALOG_READY"]')).toBeVisible();
});

test('C005 simultaneous high demand and alcohol restriction remains accessible', async ({page}) => {
  await installSyntheticCatalogRoutes(page);
  const {readFileSync}=await import('node:fs');
  const examples=JSON.parse(readFileSync('contracts/openapi/HIELYA_OPENAPI_MVP_LOCAL_36_V1_3.yaml','utf8')).paths['/store/state'].get.responses['200'].content['application/json'].examples;
  await page.route('**/api/v1/store/state',async route=>route.fulfill({json:examples['high60-and-alcohol-blocked'].value,headers:{'x-hielya-refresh-after-ms':'15000'}}));
  await page.goto('/');await expect(page.getByText('Alcohol no disponible después de las 21:00 hoy')).toBeVisible();
  await expect(page.getByText(/Alta demanda/)).toBeVisible();await assertAccessible(page);
});
