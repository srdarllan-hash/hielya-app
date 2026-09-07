import { readFileSync } from 'node:fs';
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

export const CATEGORY_BEER_ID = '11111111-1111-4111-8111-111111111111';
export const CATEGORY_WATER_ID = '22222222-2222-4222-8222-222222222222';

export const syntheticCategories = [
  {
    id: CATEGORY_BEER_ID,
    slug: 'cervezas-test',
    name: 'Cervezas de prueba',
    sortOrder: 1,
    imageUrl: null,
  },
  {
    id: CATEGORY_WATER_ID,
    slug: 'aguas-test',
    name: 'Aguas de prueba',
    sortOrder: 2,
    imageUrl: null,
  },
] as const;

export const syntheticProducts = [
  {
    id: '33333333-3333-4333-8333-333333333333',
    sku: 'TST-UNIT-WATER-001',
    name: 'Agua sintética fría',
    categoryId: CATEGORY_WATER_ID,
    salePriceCents: 175,
    currency: 'EUR',
    availability: 'AVAILABLE',
    isPack: false,
    iceIncluded: false,
    maxPerOrder: 12,
    containsAlcohol: false,
    minimumAge: null,
    bundleComponents: [],
  },
  {
    id: '44444444-4444-4444-8444-444444444444',
    sku: 'TST-UNIT-BEER-001',
    name: 'Cerveza sintética fría',
    categoryId: CATEGORY_BEER_ID,
    salePriceCents: 225,
    currency: 'EUR',
    availability: 'TEMPORARILY_UNAVAILABLE',
    isPack: false,
    iceIncluded: false,
    maxPerOrder: 12,
    containsAlcohol: true,
    minimumAge: 18,
    bundleComponents: [],
  },
  {
    id: '55555555-5555-4555-8555-555555555555',
    sku: 'TST-PACK-BEER-001',
    name: 'Pack sintético frío con hielo',
    categoryId: CATEGORY_BEER_ID,
    salePriceCents: 1499,
    currency: 'EUR',
    availability: 'AVAILABLE',
    isPack: true,
    iceIncluded: true,
    maxPerOrder: 3,
    containsAlcohol: true,
    minimumAge: 18,
    bundleComponents: [
      {
        productId: '44444444-4444-4444-8444-444444444444',
        sku: 'TST-UNIT-BEER-001',
        name: 'Cerveza sintética fría',
        quantity: 6,
      },
      {
        productId: '66666666-6666-4666-8666-666666666666',
        sku: 'TST-UNIT-ICE-001',
        name: 'Hielo sintético',
        quantity: 1,
      },
    ],
  },
] as const;

export interface SyntheticCatalogRoutes {
  calls: string[];
}

export interface PausedCatalogRoutes extends SyntheticCatalogRoutes {
  release(): void;
}

export interface SyntheticRouteOptions {
  categories?: unknown;
  products?: readonly (typeof syntheticProducts)[number][];
  waitFor?: Promise<void>;
}

const responseHeaders = {
  'content-type': 'application/json',
  'x-correlation-id': '77777777-7777-4777-8777-777777777777',
};

const fulfillJson = async (route: Route, body: unknown, status = 200) => {
  await route.fulfill({
    status,
    headers: responseHeaders,
    body: JSON.stringify(body),
  });
};

export async function installNormalStoreRoute(page: Page) {
  await page.route('**/api/v1/store/state', async route => {
    const contract = JSON.parse(readFileSync('contracts/openapi/HIELYA_OPENAPI_MVP_LOCAL_36_V1_3.yaml','utf8'));
    await route.fulfill({ json: contract.paths['/store/state'].get.responses['200'].content['application/json'].examples.normal45.value, headers: { 'x-hielya-refresh-after-ms':'15000' } });
  });
}

export async function installSyntheticCatalogRoutes(
  page: Page,
  options: SyntheticRouteOptions = {},
): Promise<SyntheticCatalogRoutes> {
  const calls: string[] = [];
  await installNormalStoreRoute(page);

  await page.route(/\/api\/v1\/catalog\/categories(?:\?.*)?$/, async (route) => {
    calls.push(route.request().url());
    await options.waitFor;
    await fulfillJson(route, options.categories ?? syntheticCategories);
  });

  await page.route(/\/api\/v1\/catalog\/products(?:\?.*)?$/, async (route) => {
    const requestUrl = route.request().url();
    calls.push(requestUrl);
    await options.waitFor;

    const url = new URL(requestUrl);
    const q = url.searchParams.get('q')?.toLocaleLowerCase('es') ?? '';
    const category = url.searchParams.get('category');
    const source = options.products ?? syntheticProducts;
    const items = source.filter((product) => (
      (!q || product.name.toLocaleLowerCase('es').includes(q) || product.sku.toLowerCase().includes(q))
      && (!category || product.categoryId === category)
    ));
    await fulfillJson(route, {
      items,
      page: Number(url.searchParams.get('page') ?? 1),
      pageSize: Number(url.searchParams.get('pageSize') ?? 20),
      total: items.length,
    });
  });

  return { calls };
}

export async function installPausedCatalogRoutes(page: Page): Promise<PausedCatalogRoutes> {
  let releasePendingRoutes = () => {};
  const waitFor = new Promise<void>((resolve) => {
    releasePendingRoutes = resolve;
  });
  const routes = await installSyntheticCatalogRoutes(page, { waitFor });
  let released = false;
  return {
    ...routes,
    release() {
      if (released) return;
      released = true;
      releasePendingRoutes();
    },
  };
}

export async function installCatalogErrorRoutes(
  page: Page,
  status = 400,
  message = 'Solicitud de catálogo inválida.',
) {
  await installNormalStoreRoute(page);
  const error = {
    code: status === 400 ? 'INVALID_INPUT' : 'CONFIGURATION_UNAVAILABLE',
    message,
    correlationId: '88888888-8888-4888-8888-888888888888',
  };
  await page.route(/\/api\/v1\/catalog\/(?:categories|products)(?:\?.*)?$/, async (route) => {
    await fulfillJson(route, error, status);
  });
}
