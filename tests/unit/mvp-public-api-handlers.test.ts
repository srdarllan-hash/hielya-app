import { DatabaseSync } from 'node:sqlite';

import { describe, expect, it } from 'vitest';

import {
  GetPublicProduct,
  ListPublicCategories,
  ListPublicProducts,
  QuoteSimulatedDelivery,
  type CatalogQueryPort,
  type OperationalSettingsReadPort,
  type PublicCategory,
  type PublicProduct,
  type RoutingDistancePort,
} from '../../packages/application/src/index';
import { createPublicApiHandlers } from '../../apps/ui-lab/src/server/mvp-local-36/http';

const category: PublicCategory = {
  id: '11111111-1111-5111-8111-111111111111',
  slug: 'Cervejas',
  name: 'Cervezas',
  sortOrder: 0,
};

const products: readonly PublicProduct[] = [
  {
    id: '22222222-2222-5222-8222-222222222222',
    sku: 'TST-CER-001',
    name: 'Cerveza de prueba',
    categoryId: category.id,
    salePriceCents: 149,
    currency: 'EUR',
    availability: 'AVAILABLE',
    isPack: false,
    iceIncluded: false,
    maxPerOrder: 12,
    containsAlcohol: true,
    minimumAge: 18,
    bundleComponents: [],
  },
  {
    id: '33333333-3333-5333-8333-333333333333',
    sku: 'TST-CMB-001',
    name: 'Pack aislado con hielo',
    categoryId: category.id,
    salePriceCents: 1200,
    currency: 'EUR',
    availability: 'UNAVAILABLE',
    isPack: true,
    iceIncluded: true,
    maxPerOrder: 2,
    containsAlcohol: true,
    minimumAge: 18,
    bundleComponents: [{
      productId: '22222222-2222-5222-8222-222222222222',
      sku: 'TST-CER-001',
      name: 'Cerveza de prueba',
      quantity: 6,
    }],
  },
];

class TemporarySqliteCatalogPort implements CatalogQueryPort {
  readonly db = new DatabaseSync(':memory:');

  constructor() {
    this.db.exec(`
      CREATE TABLE public_category_fixture (
        id TEXT PRIMARY KEY,
        payload TEXT NOT NULL
      );
      CREATE TABLE public_product_fixture (
        id TEXT PRIMARY KEY,
        sku TEXT NOT NULL UNIQUE,
        payload TEXT NOT NULL
      );
    `);
    this.db.prepare(
      'INSERT INTO public_category_fixture (id,payload) VALUES (?,?)',
    ).run(category.id, JSON.stringify(category));
    for (const product of products) {
      this.db.prepare(
        'INSERT INTO public_product_fixture (id,sku,payload) VALUES (?,?,?)',
      ).run(product.id, product.sku, JSON.stringify(product));
    }
  }

  listPublicCategories(): readonly PublicCategory[] {
    return this.db.prepare(
      'SELECT payload FROM public_category_fixture ORDER BY id',
    ).all().map(({ payload }) => JSON.parse(String(payload)) as PublicCategory);
  }

  listPublicProducts(): readonly PublicProduct[] {
    return this.db.prepare(
      'SELECT payload FROM public_product_fixture ORDER BY rowid',
    ).all().map(({ payload }) => JSON.parse(String(payload)) as PublicProduct);
  }

  findPublicProductById(productId: string) {
    const row = this.db.prepare(
      'SELECT payload FROM public_product_fixture WHERE id = ?',
    ).get(productId) as { payload: string } | undefined;
    return row ? JSON.parse(row.payload) as PublicProduct : undefined;
  }
}

class FixtureSettingsPort implements OperationalSettingsReadPort {
  getDeliverySettings() {
    return {
      deliveryBaseFeeCents: 200,
      deliveryFeePerKmCents: 60,
      maximumRoadDistanceKm: 4,
    };
  }
}

class FixtureRoutingPort implements RoutingDistancePort {
  distanceKm = 0;
  failure = false;

  getRoadDistanceKm() {
    if (this.failure) throw new Error('private routing failure');
    return this.distanceKm;
  }
}

const makeHandlers = () => {
  const catalog = new TemporarySqliteCatalogPort();
  const routing = new FixtureRoutingPort();
  const handlers = createPublicApiHandlers({
    listCategories: new ListPublicCategories(catalog),
    listProducts: new ListPublicProducts(catalog),
    getProduct: new GetPublicProduct(catalog),
    quoteDelivery: new QuoteSimulatedDelivery(new FixtureSettingsPort(), routing),
    correlationIds: {
      generate: () => 'aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa',
    },
  });
  return { catalog, handlers, routing };
};

const json = async <T>(response: Response): Promise<T> => response.json() as Promise<T>;

const collectKeys = (value: unknown, keys = new Set<string>()): Set<string> => {
  if (Array.isArray(value)) {
    value.forEach((item) => collectKeys(item, keys));
    return keys;
  }
  if (!value || typeof value !== 'object') return keys;
  for (const [key, child] of Object.entries(value as Record<string, unknown>)) {
    keys.add(key);
    collectKeys(child, keys);
  }
  return keys;
};

describe('MVP Local 36 public HTTP handlers', () => {
  it('uses only synthetic non-canonical records in its isolated temporary SQLite fixture', () => {
    const { catalog } = makeHandlers();
    expect(catalog.db.prepare(
      "SELECT COUNT(*) AS total FROM public_product_fixture WHERE sku LIKE 'HYA-%'",
    ).get()).toEqual({ total: 0 });
    expect(catalog.listPublicProducts()).toHaveLength(2);
    catalog.db.close();
  });

  it('returns ordered categories and filtered, paginated products', async () => {
    const { handlers } = makeHandlers();
    const categories = await handlers.listCategories(new Request('http://localhost/api/v1/catalog/categories'));
    expect(categories.status).toBe(200);
    expect(await json(categories)).toEqual([category]);

    const bySku = await handlers.listProducts(new Request(
      `http://localhost/api/v1/catalog/products?q=tst-cer&category=${category.slug}&availableOnly=true&page=1&pageSize=1`,
    ));
    expect(bySku.status).toBe(200);
    expect(await json(bySku)).toEqual({
      items: [products[0]],
      page: 1,
      pageSize: 1,
      total: 1,
    });

    const secondPage = await handlers.listProducts(new Request(
      'http://localhost/api/v1/catalog/products?page=2&pageSize=1',
    ));
    expect(await json(secondPage)).toEqual({
      items: [products[1]],
      page: 2,
      pageSize: 1,
      total: 2,
    });
  });

  it('returns stable detail identifiers and a safe not-found response', async () => {
    const { handlers } = makeHandlers();
    const found = await handlers.getProduct(
      new Request('http://localhost/api/v1/catalog/products/product'),
      products[0].id,
    );
    expect(found.status).toBe(200);
    expect(await json(found)).toEqual(products[0]);

    const missing = await handlers.getProduct(
      new Request('http://localhost/api/v1/catalog/products/missing'),
      '44444444-4444-5444-8444-444444444444',
    );
    expect(missing.status).toBe(404);
    expect(await json(missing)).toEqual({
      code: 'PRODUCT_NOT_FOUND',
      message: 'The requested product was not found.',
      field: 'productId',
      correlationId: 'aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa',
    });
  });

  it.each([
    [0, 200],
    [1, 260],
    [2, 320],
    [2.5, 350],
    [3, 380],
    [4, 440],
  ])('quotes %s km as %s cents from persisted settings', async (distanceKm, feeCents) => {
    const { handlers, routing } = makeHandlers();
    routing.distanceKm = distanceKm;
    const response = await handlers.quoteDelivery(new Request(
      'http://localhost/api/v1/delivery/quote',
      {
        method: 'POST',
        body: JSON.stringify({ latitude: 36.54, longitude: -4.62, addressType: 'HOME' }),
      },
    ));
    expect(response.status).toBe(200);
    expect(await json(response)).toEqual({
      withinArea: true,
      routeDistanceKm: distanceKm,
      feeCents,
    });
  });

  it('blocks out-of-area, invalid coordinates and client-computed commercial fields', async () => {
    const { handlers, routing } = makeHandlers();
    routing.distanceKm = 4.01;
    const outOfArea = await handlers.quoteDelivery(new Request(
      'http://localhost/api/v1/delivery/quote',
      { method: 'POST', body: JSON.stringify({ latitude: 36.54, longitude: -4.62 }) },
    ));
    expect(outOfArea.status).toBe(400);
    expect((await json<{ code: string }>(outOfArea)).code).toBe('OUT_OF_AREA');

    const invalidCoordinates = await handlers.quoteDelivery(new Request(
      'http://localhost/api/v1/delivery/quote',
      { method: 'POST', body: JSON.stringify({ latitude: 91, longitude: -4.62 }) },
    ));
    expect((await json<{ field: string }>(invalidCoordinates)).field).toBe('latitude');

    const injectedFee = await handlers.quoteDelivery(new Request(
      'http://localhost/api/v1/delivery/quote',
      {
        method: 'POST',
        body: JSON.stringify({ latitude: 36.54, longitude: -4.62, feeCents: 1 }),
      },
    ));
    expect(await json(injectedFee)).toMatchObject({
      code: 'INVALID_INPUT',
      field: 'feeCents',
    });
  });

  it('maps an unavailable routing port to a controlled error without leaking internals', async () => {
    const { handlers, routing } = makeHandlers();
    routing.failure = true;
    const suppliedCorrelationId = 'bbbbbbbb-bbbb-4bbb-8bbb-bbbbbbbbbbbb';
    const response = await handlers.quoteDelivery(new Request(
      'http://localhost/api/v1/delivery/quote',
      {
        method: 'POST',
        headers: { 'x-correlation-id': suppliedCorrelationId },
        body: JSON.stringify({ latitude: 36.54, longitude: -4.62 }),
      },
    ));
    const body = await json<Record<string, unknown>>(response);

    expect(response.status).toBe(400);
    expect(response.headers.get('x-correlation-id')).toBe(suppliedCorrelationId);
    expect(body).toEqual({
      code: 'CONFIGURATION_UNAVAILABLE',
      message: 'The delivery quote is temporarily unavailable.',
      correlationId: suppliedCorrelationId,
    });
    expect(JSON.stringify(body)).not.toMatch(/routing|private|stack|sql|path/i);
  });

  it('never exposes internal stock, reservation, cost or margin fields', async () => {
    const { handlers } = makeHandlers();
    const response = await handlers.listProducts(new Request('http://localhost/api/v1/catalog/products'));
    const keys = [...collectKeys(await json(response))];
    expect(keys.filter((key) => /physicalStock|availableStock|reservedStock|safetyStock|remainingQuantity|bundleAvailabilityCount|purchaseCost|margin|inventoryBatch|reorderPoint|movement|reservation/i.test(key))).toEqual([]);
  });

  it('rejects invalid query values with stable public errors', async () => {
    const { handlers } = makeHandlers();
    const response = await handlers.listProducts(new Request(
      'http://localhost/api/v1/catalog/products?availableOnly=yes&page=zero',
    ));
    expect(response.status).toBe(400);
    expect(await json(response)).toMatchObject({
      code: 'INVALID_INPUT',
      field: 'availableOnly',
    });

    const unsupported = await handlers.listCategories(new Request(
      'http://localhost/api/v1/catalog/categories?internal=true',
    ));
    expect(await json(unsupported)).toMatchObject({
      code: 'INVALID_INPUT',
      field: 'internal',
    });

    const invalidId = await handlers.getProduct(
      new Request('http://localhost/api/v1/catalog/products/not-a-uuid'),
      'not-a-uuid',
    );
    expect(invalidId.status).toBe(404);
    expect(await json(invalidId)).toMatchObject({
      code: 'PRODUCT_NOT_FOUND',
      field: 'productId',
    });

    const duplicatePage = await handlers.listProducts(new Request(
      'http://localhost/api/v1/catalog/products?page=1&page=2',
    ));
    expect(await json(duplicatePage)).toMatchObject({
      code: 'INVALID_INPUT',
      field: 'page',
    });

    const deliveryQueryInjection = await handlers.quoteDelivery(new Request(
      'http://localhost/api/v1/delivery/quote?routeDistanceKm=1',
      { method: 'POST', body: JSON.stringify({ latitude: 36.54, longitude: -4.62 }) },
    ));
    expect(await json(deliveryQueryInjection)).toMatchObject({
      code: 'INVALID_INPUT',
      field: 'routeDistanceKm',
    });
  });
});
