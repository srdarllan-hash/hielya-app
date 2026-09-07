import { expect, test, type Page } from '@playwright/test';
import { mkdirSync } from 'node:fs';
import { join } from 'node:path';

import {
  collectRuntimeErrors,
  installCatalogErrorRoutes,
  installPausedCatalogRoutes,
  installSyntheticCatalogRoutes,
  installNormalStoreRoute,
  type RuntimeErrorCollector,
} from '../integration/home-catalog-api-integration.fixtures';

const namespace = 'C-005-HOME-CATALOG-API-INTEGRATION-V1';

let runtimeErrors: RuntimeErrorCollector;

test.beforeEach(async ({ page }) => {
  await installNormalStoreRoute(page);
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
  state: 'loading' | 'ready' | 'empty' | 'error',
) => {
  await stabilize(page);
  await expect(page).toHaveScreenshot(`${namespace}-${state}.png`, {
    animations: 'disabled',
    fullPage: false,
  });
  const directory = join('screenshots', namespace, projectName);
  mkdirSync(directory, { recursive: true });
  await page.screenshot({
    path: join(directory, `${namespace}-${state}.png`),
    fullPage: false,
    animations: 'disabled',
  });
};

test('C-005 Home Catalog API Integration LOADING visual', async ({ page }, testInfo) => {
  const pausedRoutes = await installPausedCatalogRoutes(page);
  await page.goto('/', { waitUntil: 'domcontentloaded' });
  try {
    await expect(page.locator('[data-home-catalog-state="HOME_CATALOG_LOADING"]')).toBeVisible();
    await capture(page, testInfo.project.name, 'loading');
  } finally {
    pausedRoutes.release();
  }
  await expect(page.locator('[data-home-catalog-state="HOME_CATALOG_READY"]')).toBeVisible();
});

test('C-005 Home Catalog API Integration READY visual', async ({ page }, testInfo) => {
  await installSyntheticCatalogRoutes(page);
  await page.goto('/');
  await expect(page.locator('[data-home-catalog-state="HOME_CATALOG_READY"]')).toBeVisible();
  await capture(page, testInfo.project.name, 'ready');
});

test('C-005 Home Catalog API Integration EMPTY visual', async ({ page }, testInfo) => {
  await page.goto('/');
  await expect(page.locator('[data-home-catalog-state="HOME_CATALOG_EMPTY"]')).toBeVisible();
  await capture(page, testInfo.project.name, 'empty');
});

test('C-005 Home Catalog API Integration ERROR visual', async ({ page }, testInfo) => {
  runtimeErrors.allowHttpStatus(400);
  await installCatalogErrorRoutes(page);
  await page.goto('/');
  await expect(page.locator('[data-home-catalog-state="HOME_CATALOG_ERROR"]')).toBeVisible();
  await capture(page, testInfo.project.name, 'error');
});
