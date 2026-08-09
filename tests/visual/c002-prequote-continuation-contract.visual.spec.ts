import { mkdirSync } from 'node:fs';
import { join } from 'node:path';

import { expect, test } from '@playwright/test';

import {
  collectRuntimeErrors,
  driveManualAddressToQuote,
  installSuccessfulDeliveryQuoteRoute,
  type RuntimeErrorCollector,
} from '../integration/c002-delivery-quote-api-alignment.fixtures';

const namespace = 'C-002-PREQUOTE-CONTINUATION-CONTRACT-V1';
let runtimeErrors: RuntimeErrorCollector;

test.beforeEach(async ({ page }) => {
  runtimeErrors = collectRuntimeErrors(page);
});

test.afterEach(async () => {
  expect(runtimeErrors.errors).toEqual([]);
});

test('success 2.5 km / €3.50 with enabled Continue', async ({ page }, testInfo) => {
  await installSuccessfulDeliveryQuoteRoute(page);
  await driveManualAddressToQuote(page);
  await expect(page.locator('[data-state="success"]')).toBeVisible();
  await expect(page.getByRole('button', { name: 'Continuar' })).toBeEnabled();
  await page.evaluate(async () => document.fonts.ready);
  await expect(page).toHaveScreenshot(`${namespace}-success-enabled.png`, {
    animations: 'disabled',
    fullPage: false,
    scale: 'device',
  });
  const directory = join('screenshots', namespace, testInfo.project.name);
  mkdirSync(directory, { recursive: true });
  await page.screenshot({
    path: join(directory, `${namespace}-success-enabled.png`),
    animations: 'disabled',
    fullPage: false,
  });
});
