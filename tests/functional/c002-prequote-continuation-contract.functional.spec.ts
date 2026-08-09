import { expect, test } from '@playwright/test';

import {
  collectRuntimeErrors,
  driveManualAddressToQuote,
  expectOnlyCoordinatesRequest,
  installConfigurationUnavailableRoute,
  installOutOfAreaDeliveryQuoteRoute,
  installSuccessfulDeliveryQuoteRoute,
  type RuntimeErrorCollector,
} from '../integration/c002-delivery-quote-api-alignment.fixtures';

let runtimeErrors: RuntimeErrorCollector;

test.beforeEach(async ({ page }) => {
  runtimeErrors = collectRuntimeErrors(page);
});

test.afterEach(async () => {
  expect(runtimeErrors.errors).toEqual([]);
});

test('valid non-binding prequote emits LOCATION_CONFIRMED without navigation or another request', async ({ page }) => {
  const route = await installSuccessfulDeliveryQuoteRoute(page);
  await page.addInitScript(() => {
    const target = window as Window & { __hielyaLocationOutcomes?: unknown[] };
    target.__hielyaLocationOutcomes = [];
    window.addEventListener('hielya:location-outcome', (event) => {
      target.__hielyaLocationOutcomes?.push((event as CustomEvent).detail);
    });
  });
  await driveManualAddressToQuote(page);
  const urlBeforeContinue = page.url();

  await expect(page.locator('[data-state="success"]')).toBeVisible();
  await expect(page.getByText('2.5 km', { exact: true })).toBeVisible();
  await expect(page.getByText('€3.50', { exact: true })).toBeVisible();
  const continueButton = page.getByRole('button', { name: 'Continuar' });
  await expect(continueButton).toBeEnabled();
  await expect.poll(() => page.evaluate(() => sessionStorage.getItem(
    'hielya.location.confirmed.v1',
  ) !== null)).toBe(true);

  await continueButton.click();

  await expect(page.locator('[data-outcome-emitted="true"]')).toBeVisible();
  expect(page.url()).toBe(urlBeforeContinue);
  expect(route.calls).toHaveLength(1);
  expectOnlyCoordinatesRequest(route.calls[0]);
  const result = await page.evaluate(() => {
    const target = window as Window & { __hielyaLocationOutcomes?: unknown[] };
    const raw = sessionStorage.getItem('hielya.location.confirmed.v1');
    return { outcomes: target.__hielyaLocationOutcomes, stored: raw ? JSON.parse(raw) : null };
  });
  expect(result.outcomes).toHaveLength(1);
  expect(result.outcomes?.[0]).toMatchObject({
    type: 'LOCATION_CONFIRMED',
    location: { deliveryQuoteId: null, serviceArea: { quoteId: null } },
  });
  expect(result.stored?.value).toMatchObject({
    deliveryQuoteId: null,
    serviceArea: { quoteId: null, distanceMeters: 2_500, deliveryFeeCents: 350 },
  });
});

test('out-of-area and retryable failures never expose Continue', async ({ page }) => {
  runtimeErrors.allowHttpStatus(400);
  await installOutOfAreaDeliveryQuoteRoute(page);
  await driveManualAddressToQuote(page);
  await expect(page.locator('[data-state="out_of_area"]')).toBeVisible();
  await expect(page.getByRole('button', { name: 'Continuar' })).toHaveCount(0);

  await page.unrouteAll({ behavior: 'wait' });
  await installConfigurationUnavailableRoute(page);
  await page.reload();
  await driveManualAddressToQuote(page);
  await expect(page.locator('[data-state="network_error"]')).toBeVisible();
  await expect(page.getByRole('button', { name: 'Continuar' })).toHaveCount(0);
});
