import AxeBuilder from '@axe-core/playwright';
import { expect, test, type Page } from '@playwright/test';

import {
  collectRuntimeErrors,
  driveManualAddressToQuote,
  installConfigurationUnavailableRoute,
  installOutOfAreaDeliveryQuoteRoute,
  installPausedDeliveryQuoteRoute,
  installSuccessfulDeliveryQuoteRoute,
  installTimedOutDeliveryQuoteRoute,
  type RuntimeErrorCollector,
} from '../integration/c002-delivery-quote-api-alignment.fixtures';

let runtimeErrors: RuntimeErrorCollector;

test.beforeEach(async ({ page }) => {
  runtimeErrors = collectRuntimeErrors(page);
});

test.afterEach(async () => {
  expect(runtimeErrors.errors).toEqual([]);
});

const assertAccessible = async (page: Page) => {
  await page.evaluate(async () => document.fonts.ready);
  const results = await new AxeBuilder({ page })
    .withTags(['wcag2a', 'wcag2aa', 'wcag21a', 'wcag21aa'])
    .analyze();
  expect(results.violations).toEqual([]);
};

test('checking_service_area is WCAG 2.1 A/AA clean', async ({ page }) => {
  const route = await installPausedDeliveryQuoteRoute(page);
  await driveManualAddressToQuote(page);
  await expect(page.locator('[data-state="checking_service_area"]')).toBeVisible();
  try {
    await assertAccessible(page);
  } finally {
    route.release?.();
  }
});

test('success 2.5 km / €3.50 is WCAG 2.1 A/AA clean', async ({ page }) => {
  await installSuccessfulDeliveryQuoteRoute(page);
  await driveManualAddressToQuote(page);
  await expect(page.locator('[data-state="success"]')).toBeVisible();
  await assertAccessible(page);
});

test('out_of_area is WCAG 2.1 A/AA clean', async ({ page }) => {
  runtimeErrors.allowHttpStatus(400);
  await installOutOfAreaDeliveryQuoteRoute(page);
  await driveManualAddressToQuote(page);
  await expect(page.locator('[data-state="out_of_area"]')).toBeVisible();
  await assertAccessible(page);
});

test('network_error is WCAG 2.1 A/AA clean', async ({ page }) => {
  runtimeErrors.allowHttpStatus(400);
  await installConfigurationUnavailableRoute(page);
  await driveManualAddressToQuote(page);
  await expect(page.locator('[data-state="network_error"]')).toBeVisible();
  await assertAccessible(page);
});

test('timeout is WCAG 2.1 A/AA clean', async ({ page }) => {
  runtimeErrors.allowRequestAbort();
  await installTimedOutDeliveryQuoteRoute(page);
  await driveManualAddressToQuote(page);
  await expect(page.locator('[data-state="timeout"]')).toBeVisible({ timeout: 12_000 });
  await assertAccessible(page);
});
