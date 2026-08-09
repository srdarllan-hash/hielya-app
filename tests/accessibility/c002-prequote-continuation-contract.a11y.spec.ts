import AxeBuilder from '@axe-core/playwright';
import { expect, test } from '@playwright/test';

import {
  collectRuntimeErrors,
  driveManualAddressToQuote,
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

test('validated prequote with enabled Continue is WCAG 2.1 A/AA clean', async ({ page }) => {
  await installSuccessfulDeliveryQuoteRoute(page);
  await driveManualAddressToQuote(page);
  await expect(page.locator('[data-state="success"]')).toBeVisible();
  await expect(page.getByRole('button', { name: 'Continuar' })).toBeEnabled();
  await page.evaluate(async () => document.fonts.ready);
  const results = await new AxeBuilder({ page })
    .withTags(['wcag2a', 'wcag2aa', 'wcag21a', 'wcag21aa'])
    .analyze();
  expect(results.violations).toEqual([]);
});
