import { expect, test, type Page } from '@playwright/test';
import { mkdirSync } from 'node:fs';
import { join } from 'node:path';

import {
  collectRuntimeErrors,
  installPausedProductDetailRoute,
  installProductDetailErrorRoute,
  installSyntheticProductDetailRoute,
  readCanonicalPausedProductId,
  SYNTHETIC_PACK_ID,
  type RuntimeErrorCollector,
} from '../integration/product-detail-api-integration.fixtures';

const namespace = 'PRODUCT-DETAIL-PUBLIC-API-INTEGRATION-V1';

let runtimeErrors: RuntimeErrorCollector;

test.beforeEach(async ({ page }) => {
  runtimeErrors = collectRuntimeErrors(page);
});

test.afterEach(async () => {
  expect(runtimeErrors.errors).toEqual([]);
});

const stabilize = async (page: Page) => {
  await page.evaluate(async () => document.fonts.ready);
};

const capture = async (
  page: Page,
  projectName: string,
  state: 'loading' | 'ready' | 'not-found' | 'error',
) => {
  await stabilize(page);
  await expect(page).toHaveScreenshot(`${namespace}-${state}.png`, {
    animations: 'disabled',
    fullPage: false,
    scale: 'device',
  });
  const directory = join('screenshots', namespace, projectName);
  mkdirSync(directory, { recursive: true });
  await page.screenshot({
    path: join(directory, `${namespace}-${state}.png`),
    fullPage: false,
    animations: 'disabled',
  });
};

test('Product Detail LOADING visual', async ({ page }, testInfo) => {
  const pausedRoute = await installPausedProductDetailRoute(page);
  await page.goto(`/products/${SYNTHETIC_PACK_ID}`, { waitUntil: 'domcontentloaded' });
  try {
    await expect(page.locator('[data-product-detail-state="PRODUCT_DETAIL_LOADING"]')).toBeVisible();
    await capture(page, testInfo.project.name, 'loading');
  } finally {
    pausedRoute.release();
  }
  await expect(page.locator('[data-product-detail-state="PRODUCT_DETAIL_READY"]')).toBeVisible();
});

test('Product Detail READY visual', async ({ page }, testInfo) => {
  await installSyntheticProductDetailRoute(page);
  await page.goto(`/products/${SYNTHETIC_PACK_ID}`);
  await expect(page.locator('[data-product-detail-state="PRODUCT_DETAIL_READY"]')).toBeVisible();
  await capture(page, testInfo.project.name, 'ready');
});

test('Product Detail canonical NOT_FOUND visual', async ({ page }, testInfo) => {
  runtimeErrors.allowHttpStatus(404);
  await page.goto(`/products/${readCanonicalPausedProductId()}`);
  await expect(page.locator('[data-product-detail-state="PRODUCT_DETAIL_NOT_FOUND"]')).toBeVisible();
  await capture(page, testInfo.project.name, 'not-found');
});

test('Product Detail ERROR visual', async ({ page }, testInfo) => {
  runtimeErrors.allowHttpStatus(500);
  await installProductDetailErrorRoute(page, 500);
  await page.goto(`/products/${SYNTHETIC_PACK_ID}`);
  await expect(page.locator('[data-product-detail-state="PRODUCT_DETAIL_ERROR"]')).toBeVisible();
  await capture(page, testInfo.project.name, 'error');
});
