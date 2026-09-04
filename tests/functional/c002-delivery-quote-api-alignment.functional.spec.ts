import { expect, test } from '@playwright/test';

import {
  collectRuntimeErrors,
  DELIVERY_QUOTE_PATH,
  driveManualAddressToQuote,
  expectOnlyCoordinatesRequest,
  installConfigurationUnavailableRoute,
  installOutOfAreaDeliveryQuoteRoute,
  installRetryableDeliveryQuoteRoute,
  installSuccessfulDeliveryQuoteRoute,
  installTimedOutDeliveryQuoteRoute,
  type CapturedDeliveryQuoteRequest,
  type RuntimeErrorCollector,
} from '../integration/c002-delivery-quote-api-alignment.fixtures';

let runtimeErrors: RuntimeErrorCollector;

test.beforeEach(async ({ page }) => {
  runtimeErrors = collectRuntimeErrors(page);
});

test.afterEach(async () => {
  expect(runtimeErrors.errors).toEqual([]);
});

test('normal C-002 runtime consumes the real local HTTP endpoint and persisted server fee', async ({ page }) => {
  const requests: CapturedDeliveryQuoteRequest[] = [];
  page.on('request', (request) => {
    if (new URL(request.url()).pathname !== DELIVERY_QUOTE_PATH) return;
    requests.push({
      method: request.method(),
      contentType: request.headers()['content-type'] ?? null,
      body: request.postDataJSON(),
    });
  });

  await driveManualAddressToQuote(page);
  await expect(page.locator('[data-screen-id="C-002"]')).toHaveAttribute('data-state', 'success');
  await expect(page.getByText('2.5 km', { exact: true })).toBeVisible();
  await expect(page.getByText('€3.50', { exact: true })).toBeVisible();
  await expect(page.getByText('Pendiente', { exact: true })).toBeVisible();
  expect(requests).toHaveLength(1);
  expectOnlyCoordinatesRequest(requests[0]);
  await expect.poll(
    () => page.evaluate(() => sessionStorage.getItem('hielya.location.confirmed.v1') !== null),
  ).toBe(true);
  const stored = await page.evaluate(() => {
    const raw = sessionStorage.getItem('hielya.location.confirmed.v1');
    return raw ? JSON.parse(raw) as {
      value: { serviceArea: { quoteId: unknown; deliveryFeeCents: unknown } };
      expiresAt: number;
    } : null;
  });
  expect(stored?.value.serviceArea.quoteId).toBeNull();
  expect(stored?.value.serviceArea.deliveryFeeCents).toBe(350);
  expect(stored?.expiresAt).toBeGreaterThan(Date.now());
});

test('OUT_OF_AREA becomes out_of_area and never persists a confirmed location', async ({ page }) => {
  runtimeErrors.allowHttpStatus(400);
  const route = await installOutOfAreaDeliveryQuoteRoute(page);
  await driveManualAddressToQuote(page);

  await expect(page.locator('[data-screen-id="C-002"]')).toHaveAttribute('data-state', 'out_of_area');
  await expect(page.getByRole('heading', { name: 'Fuera del área de entrega' })).toBeVisible();
  expect(route.calls).toHaveLength(1);
  expectOnlyCoordinatesRequest(route.calls[0]);
  expect(await page.evaluate(() => sessionStorage.getItem('hielya.location.confirmed.v1'))).toBeNull();
});

test('CONFIGURATION_UNAVAILABLE becomes network_error, never invalid_address', async ({ page }) => {
  runtimeErrors.allowHttpStatus(400);
  const route = await installConfigurationUnavailableRoute(page);
  await driveManualAddressToQuote(page);

  await expect(page.locator('[data-screen-id="C-002"]')).toHaveAttribute('data-state', 'network_error');
  await expect(page.locator('[data-screen-id="C-002"]')).not.toHaveAttribute('data-state', 'invalid_address');
  expect(route.calls).toHaveLength(1);
  expect(await page.evaluate(() => sessionStorage.getItem('hielya.location.confirmed.v1'))).toBeNull();
});

test('retry repeats the server quote and persists only the certified successful response', async ({ page }) => {
  runtimeErrors.allowHttpStatus(400);
  const route = await installRetryableDeliveryQuoteRoute(page);
  await driveManualAddressToQuote(page);
  await expect(page.locator('[data-state="network_error"]')).toBeVisible();
  expect(await page.evaluate(() => sessionStorage.getItem('hielya.location.confirmed.v1'))).toBeNull();

  await page.getByRole('button', { name: 'Intentar de nuevo' }).click();
  await expect(page.locator('[data-state="success"]')).toBeVisible();
  await expect(page.getByText('2.5 km', { exact: true })).toBeVisible();
  await expect(page.getByText('€3.50', { exact: true })).toBeVisible();
  expect(route.calls).toHaveLength(2);
  route.calls.forEach(expectOnlyCoordinatesRequest);

  await expect.poll(
    () => page.evaluate(() => sessionStorage.getItem('hielya.location.confirmed.v1') !== null),
  ).toBe(true);
  const stored = await page.evaluate(() => {
    const raw = sessionStorage.getItem('hielya.location.confirmed.v1');
    return raw ? JSON.parse(raw) as {
      value: { serviceArea: { quoteId: unknown; deliveryFeeCents: unknown } };
    } : null;
  });
  expect(stored?.value.serviceArea.quoteId).toBeNull();
  expect(stored?.value.serviceArea.deliveryFeeCents).toBe(350);
});

test('service-area request timeout becomes timeout and remains retryable', async ({ page }, testInfo) => {
  test.skip(testInfo.project.name !== 'mobile-390', 'One browser project proves the timed HTTP boundary');
  runtimeErrors.allowRequestAbort();
  const route = await installTimedOutDeliveryQuoteRoute(page);
  await driveManualAddressToQuote(page);

  await expect(page.locator('[data-screen-id="C-002"]')).toHaveAttribute('data-state', 'timeout', {
    timeout: 12_000,
  });
  await expect(page.getByRole('button', { name: 'Intentar de nuevo' })).toBeVisible();
  expect(route.calls).toHaveLength(1);
  expect(await page.evaluate(() => sessionStorage.getItem('hielya.location.confirmed.v1'))).toBeNull();
});

test('fake service area remains available only through explicit driver=fake mode', async ({ page }) => {
  const quoteRequests: string[] = [];
  page.on('request', (request) => {
    if (new URL(request.url()).pathname === DELIVERY_QUOTE_PATH) quoteRequests.push(request.url());
  });
  await page.goto('/location?state=idle&driver=fake&scenario=serviceable');
  await page.getByRole('button', { name: 'Introducir dirección' }).click();
  await page.getByRole('combobox', { name: 'Dirección de entrega' }).fill('Paseo');
  await page.getByRole('button', { name: 'Buscar dirección' }).click();
  await page.getByText('Paseo Marítimo Rey de España, 65').click();
  await page.getByRole('button', { name: 'Confirmar dirección' }).click();
  await expect(page.locator('[data-screen-id="C-002"]')).toHaveAttribute('data-state', 'success');
  expect(quoteRequests).toEqual([]);
});

test('intercepted success remains contract-only evidence and does not certify CONTINUE', async ({ page }) => {
  const route = await installSuccessfulDeliveryQuoteRoute(page);
  await driveManualAddressToQuote(page);
  await expect(page.locator('[data-screen-id="C-002"]')).toHaveAttribute('data-state', 'success');
  expect(route.calls).toHaveLength(1);
  expectOnlyCoordinatesRequest(route.calls[0]);
  await expect(page.locator('[data-outcome-emitted="true"]')).toHaveCount(0);
});
