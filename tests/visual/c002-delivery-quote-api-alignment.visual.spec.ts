import { mkdirSync } from 'node:fs';
import { join } from 'node:path';

import { expect, test, type Page } from '@playwright/test';

import {
  C002_ALIGNMENT_NAMESPACE,
  collectRuntimeErrors,
  driveManualAddressToQuote,
  installConfigurationUnavailableRoute,
  installOutOfAreaDeliveryQuoteRoute,
  installPausedDeliveryQuoteRoute,
  installSuccessfulDeliveryQuoteRoute,
  installTimedOutDeliveryQuoteRoute,
  type RuntimeErrorCollector,
} from '../integration/c002-delivery-quote-api-alignment.fixtures';

type AlignmentState =
  | 'checking-service-area'
  | 'success-2-5km-350c'
  | 'out-of-area'
  | 'network-error'
  | 'timeout';

let runtimeErrors: RuntimeErrorCollector;

test.beforeEach(async ({ page }) => {
  runtimeErrors = collectRuntimeErrors(page);
});

test.afterEach(async () => {
  expect(runtimeErrors.errors).toEqual([]);
});

const capture = async (page: Page, projectName: string, state: AlignmentState) => {
  await page.evaluate(async () => document.fonts.ready);
  await expect(page).toHaveScreenshot(`${C002_ALIGNMENT_NAMESPACE}-${state}.png`, {
    animations: 'disabled',
    fullPage: false,
    scale: 'device',
  });
  const directory = join('screenshots', C002_ALIGNMENT_NAMESPACE, projectName);
  mkdirSync(directory, { recursive: true });
  await page.screenshot({
    path: join(directory, `${C002_ALIGNMENT_NAMESPACE}-${state}.png`),
    animations: 'disabled',
    fullPage: false,
  });
};

test('checking_service_area visual', async ({ page }, testInfo) => {
  const route = await installPausedDeliveryQuoteRoute(page);
  await driveManualAddressToQuote(page);
  await expect(page.locator('[data-state="checking_service_area"]')).toBeVisible();
  try {
    await capture(page, testInfo.project.name, 'checking-service-area');
  } finally {
    route.release?.();
  }
});

test('success 2.5 km / €3.50 visual', async ({ page }, testInfo) => {
  await installSuccessfulDeliveryQuoteRoute(page);
  await driveManualAddressToQuote(page);
  await expect(page.locator('[data-state="success"]')).toBeVisible();
  await expect(page.getByText('2.5 km', { exact: true })).toBeVisible();
  await expect(page.getByText('€3.50', { exact: true })).toBeVisible();
  await capture(page, testInfo.project.name, 'success-2-5km-350c');
});

test('out_of_area visual', async ({ page }, testInfo) => {
  runtimeErrors.allowHttpStatus(400);
  await installOutOfAreaDeliveryQuoteRoute(page);
  await driveManualAddressToQuote(page);
  await expect(page.locator('[data-state="out_of_area"]')).toBeVisible();
  await capture(page, testInfo.project.name, 'out-of-area');
});

test('network_error visual', async ({ page }, testInfo) => {
  runtimeErrors.allowHttpStatus(400);
  await installConfigurationUnavailableRoute(page);
  await driveManualAddressToQuote(page);
  await expect(page.locator('[data-state="network_error"]')).toBeVisible();
  await capture(page, testInfo.project.name, 'network-error');
});

test('timeout visual', async ({ page }, testInfo) => {
  runtimeErrors.allowRequestAbort();
  await installTimedOutDeliveryQuoteRoute(page);
  await driveManualAddressToQuote(page);
  await expect(page.locator('[data-state="timeout"]')).toBeVisible({ timeout: 12_000 });
  await capture(page, testInfo.project.name, 'timeout');
});
