import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';

import type { Page, Route } from '@playwright/test';

export interface RuntimeErrorCollector {
  errors: string[];
  allowHttpStatus(status: number): void;
}

export const collectRuntimeErrors = (page: Page): RuntimeErrorCollector => {
  const errors: string[] = [];
  const allowedHttpStatuses = new Set<number>();
  page.on('console', (message) => {
    if (message.type() !== 'error') return;
    const text = message.text();
    const expectedHttpFailure = text.match(
      /^Failed to load resource: the server responded with a status of (\d{3}) \(/,
    );
    if (expectedHttpFailure && allowedHttpStatuses.has(Number(expectedHttpFailure[1]))) return;
    errors.push(`console: ${text}`);
  });
  page.on('pageerror', (error) => errors.push(`pageerror: ${error.message}`));
  return {
    errors,
    allowHttpStatus(status) {
      allowedHttpStatuses.add(status);
    },
  };
};

export const SYNTHETIC_CATEGORY_ID = '11111111-1111-4111-8111-111111111111';
export const SYNTHETIC_UNIT_ID = '33333333-3333-4333-8333-333333333333';
export const SYNTHETIC_UNAVAILABLE_ID = '44444444-4444-4444-8444-444444444444';
export const SYNTHETIC_PACK_ID = '55555555-5555-4555-8555-555555555555';

export const syntheticAvailableUnit = {
  id: SYNTHETIC_UNIT_ID,
  sku: 'TST-DETAIL-WATER-001',
  ean: null,
  name: 'Agua sintética fría',
  description: 'Bebida sintética preparada para validar el detalle público.',
  brand: 'Marca de prueba',
  categoryId: SYNTHETIC_CATEGORY_ID,
  subcategory: null,
  volumeLabel: '500 ml',
  grossWeightKg: 0.5,
  estimatedVolumeLiters: 0.5,
  salePriceCents: 175,
  currency: 'EUR',
  unitPriceLabel: '3,50 €/l',
  availability: 'AVAILABLE',
  isPack: false,
  iceIncluded: false,
  maxPerOrder: 12,
  temperatureProfile: 'CHILLED',
  readyToConsume: true,
  containsAlcohol: false,
  minimumAge: null,
  alcoholPercentage: null,
  imageUrl: null,
  keywords: ['prueba', 'agua'],
  bundleComponents: [],
} as const;

export const syntheticUnavailableUnit = {
  ...syntheticAvailableUnit,
  id: SYNTHETIC_UNAVAILABLE_ID,
  sku: 'TST-DETAIL-SODA-001',
  name: 'Refresco sintético temporal',
  availability: 'TEMPORARILY_UNAVAILABLE',
} as const;

export const syntheticAlcoholicPack = {
  id: SYNTHETIC_PACK_ID,
  sku: 'TST-DETAIL-PACK-001',
  ean: null,
  name: 'Pack sintético frío con hielo',
  description: 'Pack sintético completo para validar composición comercial.',
  brand: null,
  categoryId: SYNTHETIC_CATEGORY_ID,
  subcategory: null,
  volumeLabel: null,
  grossWeightKg: null,
  estimatedVolumeLiters: null,
  salePriceCents: 1499,
  currency: 'EUR',
  unitPriceLabel: null,
  availability: 'AVAILABLE',
  isPack: true,
  iceIncluded: true,
  maxPerOrder: 3,
  temperatureProfile: 'CHILLED',
  readyToConsume: true,
  containsAlcohol: true,
  minimumAge: 18,
  alcoholPercentage: 5,
  imageUrl: null,
  keywords: ['prueba', 'pack'],
  bundleComponents: [
    {
      productId: '66666666-6666-4666-8666-666666666666',
      sku: 'TST-DETAIL-BEER-001',
      name: 'Cerveza sintética fría',
      quantity: 6,
    },
    {
      productId: '77777777-7777-4777-8777-777777777777',
      sku: 'TST-DETAIL-ICE-001',
      name: 'Hielo sintético',
      quantity: 1,
    },
  ],
} as const;

export type SyntheticDetailProduct =
  | typeof syntheticAvailableUnit
  | typeof syntheticUnavailableUnit
  | typeof syntheticAlcoholicPack;

export interface SyntheticDetailRoutes {
  calls: string[];
}

export interface PausedDetailRoutes extends SyntheticDetailRoutes {
  release(): void;
}

const responseHeaders = {
  'content-type': 'application/json',
  'x-correlation-id': '88888888-8888-4888-8888-888888888888',
};

const detailPathPattern = /\/api\/v1\/catalog\/products\/[0-9a-f-]+(?:\?.*)?$/i;

const fulfillJson = async (route: Route, body: unknown, status = 200) => {
  await route.fulfill({
    status,
    headers: responseHeaders,
    body: JSON.stringify(body),
  });
};

export async function installSyntheticProductDetailRoute(
  page: Page,
  product: SyntheticDetailProduct = syntheticAlcoholicPack,
): Promise<SyntheticDetailRoutes> {
  const calls: string[] = [];
  await page.route(detailPathPattern, async (route) => {
    calls.push(route.request().url());
    await fulfillJson(route, product);
  });
  return { calls };
}

export async function installPausedProductDetailRoute(
  page: Page,
  product: SyntheticDetailProduct = syntheticAlcoholicPack,
): Promise<PausedDetailRoutes> {
  let releasePendingRoute = () => {};
  const waitFor = new Promise<void>((resolvePending) => {
    releasePendingRoute = resolvePending;
  });
  const calls: string[] = [];
  await page.route(detailPathPattern, async (route) => {
    calls.push(route.request().url());
    await waitFor;
    await fulfillJson(route, product);
  });
  let released = false;
  return {
    calls,
    release() {
      if (released) return;
      released = true;
      releasePendingRoute();
    },
  };
}

export async function installProductDetailErrorRoute(
  page: Page,
  status: 404 | 500,
) {
  const error = status === 404
    ? {
        code: 'PRODUCT_NOT_FOUND',
        message: 'The requested product was not found.',
        correlationId: '99999999-9999-4999-8999-999999999999',
        field: 'productId',
      }
    : {
        code: 'CONFIGURATION_UNAVAILABLE',
        message: 'Internal synthetic detail failure must not be rendered.',
        correlationId: '99999999-9999-4999-8999-999999999999',
      };
  await page.route(detailPathPattern, async (route) => fulfillJson(route, error, status));
}

export async function installInvalidProductDetailRoute(page: Page) {
  await page.route(detailPathPattern, async (route) => fulfillJson(route, {
    ...syntheticAvailableUnit,
    physicalStock: 99,
    purchaseCost: 12,
  }));
}

export const readCanonicalPausedProductId = (): string => {
  const referencePath = resolve(
    '.tmp/product-detail-api-integration/canonical-paused-product.json',
  );
  const reference = JSON.parse(readFileSync(referencePath, 'utf8')) as {
    productId?: unknown;
    expectedResult?: unknown;
  };
  if (
    typeof reference.productId !== 'string'
    || reference.expectedResult !== 'NOT_FOUND'
  ) {
    throw new Error('Canonical paused product reference is invalid');
  }
  return reference.productId;
};
