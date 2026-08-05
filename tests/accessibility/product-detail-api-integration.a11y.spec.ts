import AxeBuilder from '@axe-core/playwright';
import { expect, test, type Page } from '@playwright/test';

import {
  collectRuntimeErrors,
  installPausedProductDetailRoute,
  installProductDetailErrorRoute,
  installSyntheticProductDetailRoute,
  readCanonicalPausedProductId,
  SYNTHETIC_PACK_ID,
  type RuntimeErrorCollector,
} from '../integration/product-detail-api-integration.fixtures';

let runtimeErrors: RuntimeErrorCollector;

test.beforeEach(async ({ page }) => {
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

test('product detail READY is WCAG 2.1 AA clean', async ({ page }) => {
  await installSyntheticProductDetailRoute(page);
  await page.goto(`/products/${SYNTHETIC_PACK_ID}`);
  await expect(page.locator('[data-product-detail-state="PRODUCT_DETAIL_READY"]')).toBeVisible();
  await assertAccessible(page);
});

test('canonical product detail NOT_FOUND is WCAG 2.1 AA clean', async ({ page }) => {
  runtimeErrors.allowHttpStatus(404);
  await page.goto(`/products/${readCanonicalPausedProductId()}`);
  await expect(page.locator('[data-product-detail-state="PRODUCT_DETAIL_NOT_FOUND"]')).toBeVisible();
  await assertAccessible(page);
});

test('product detail ERROR is WCAG 2.1 AA clean', async ({ page }) => {
  runtimeErrors.allowHttpStatus(500);
  await installProductDetailErrorRoute(page, 500);
  await page.goto(`/products/${SYNTHETIC_PACK_ID}`);
  await expect(page.locator('[data-product-detail-state="PRODUCT_DETAIL_ERROR"]')).toBeVisible();
  await assertAccessible(page);
});

test('product detail LOADING is WCAG 2.1 AA clean', async ({ page }) => {
  const pausedRoute = await installPausedProductDetailRoute(page);
  await page.goto(`/products/${SYNTHETIC_PACK_ID}`, { waitUntil: 'domcontentloaded' });
  try {
    await expect(page.locator('[data-product-detail-state="PRODUCT_DETAIL_LOADING"]')).toBeVisible();
    await assertAccessible(page);
  } finally {
    pausedRoute.release();
  }
  await expect(page.locator('[data-product-detail-state="PRODUCT_DETAIL_READY"]')).toBeVisible();
});
