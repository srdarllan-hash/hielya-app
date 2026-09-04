import { mkdtempSync, rmSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';

import { afterAll, beforeAll, describe, expect, it, vi } from 'vitest';

import { MvpPersistenceDatabase } from '../../packages/persistence/src/index';
import { GET as listCategories } from '../../apps/ui-lab/app/api/v1/catalog/categories/route';
import { GET as listProducts } from '../../apps/ui-lab/app/api/v1/catalog/products/route';
import { GET as getProduct } from '../../apps/ui-lab/app/api/v1/catalog/products/[productId]/route';
import { POST as quoteDelivery } from '../../apps/ui-lab/app/api/v1/delivery/quote/route';
import {
  SimulatedRoutingDistanceAdapter,
  createRuntimePublicApiHandlers,
} from '../../apps/ui-lab/src/server/mvp-local-36/container';

const settings = {
  minimumProductSubtotalCents: 2500,
  deliveryBaseFeeCents: 200,
  deliveryFeePerKmCents: 60,
  maximumRoadDistanceKm: 4,
  maximumPinAttempts: 3,
  tipsEnabled: true,
};

const directory = mkdtempSync(join(tmpdir(), 'hielya-public-api-integration-'));
const filename = join(directory, 'catalog.sqlite');
let productId = '';

describe('MVP Local 36 Route Handler read-only integration', () => {
  beforeAll(() => {
    const setup = new MvpPersistenceDatabase(filename);
    setup.migrate();
    setup.seed(settings);
    productId = setup.findProductBySku('HYA-CER-001')?.id ?? '';
    setup.close();
    process.env.HIELYA_MVP_LOCAL_36_DATABASE_PATH = filename;
  });

  afterAll(() => {
    delete process.env.HIELYA_MVP_LOCAL_36_DATABASE_PATH;
    rmSync(directory, { recursive: true, force: true });
  });

  it('serves the certified empty public catalog without activating canonical data', async () => {
    const categories = await listCategories(new Request('http://localhost/api/v1/catalog/categories'));
    const productPage = await listProducts(new Request('http://localhost/api/v1/catalog/products'));

    expect(categories.status).toBe(200);
    expect(await categories.json()).toEqual([]);
    expect(productPage.status).toBe(200);
    expect(await productPage.json()).toEqual({ items: [], page: 1, pageSize: 20, total: 0 });

    const audit = new MvpPersistenceDatabase(filename, undefined, { readOnly: true });
    expect(audit.db.prepare('SELECT SUM(commercially_active) AS active FROM products').get()).toEqual({ active: 0 });
    expect(audit.db.prepare('SELECT SUM(public_visible) AS visible FROM product_commercial_data').get()).toEqual({ visible: 0 });
    expect(audit.db.prepare('SELECT COUNT(*) AS total FROM inventory_movements').get()).toEqual({ total: 0 });
    expect(audit.db.prepare('SELECT COUNT(*) AS total FROM inventory_reservations').get()).toEqual({ total: 0 });
    audit.close();
  });

  it('does not reveal an existing but ineligible product', async () => {
    const response = await getProduct(
      new Request(`http://localhost/api/v1/catalog/products/${productId}`),
      { params: Promise.resolve({ productId }) },
    );
    expect(response.status).toBe(404);
    expect(await response.json()).toMatchObject({ code: 'PRODUCT_NOT_FOUND' });
  });

  it('keeps the real host controlled while no routing adapter is configured', async () => {
    const response = await quoteDelivery(new Request(
      'http://localhost/api/v1/delivery/quote',
      { method: 'POST', body: JSON.stringify({ latitude: 36.54, longitude: -4.62 }) },
    ));
    expect(response.status).toBe(400);
    expect(await response.json()).toMatchObject({ code: 'CONFIGURATION_UNAVAILABLE' });
  });

  it('enables deterministic simulated routing only through explicit non-production configuration', async () => {
    process.env.HIELYA_SIMULATED_ROUTE_DISTANCE_KM = '2.5';
    try {
      const handlers = createRuntimePublicApiHandlers();
      const response = await handlers.quoteDelivery(new Request(
        'http://localhost/api/v1/delivery/quote',
        { method: 'POST', body: JSON.stringify({ latitude: 36.54, longitude: -4.62 }) },
      ));
      expect(response.status).toBe(200);
      expect(await response.json()).toEqual({ withinArea: true, routeDistanceKm: 2.5, feeCents: 350 });
    } finally {
      delete process.env.HIELYA_SIMULATED_ROUTE_DISTANCE_KM;
    }
  });

  it('blocks the deterministic routing adapter in production', () => {
    vi.stubEnv('NODE_ENV', 'production');
    try {
      expect(() => new SimulatedRoutingDistanceAdapter(1)).toThrow(/prohibited in production/);
    } finally {
      vi.unstubAllEnvs();
    }
  });

  it('maps an invalid simulation setting to controlled unavailability', async () => {
    process.env.HIELYA_SIMULATED_ROUTE_DISTANCE_KM = 'not-a-distance';
    try {
      const handlers = createRuntimePublicApiHandlers();
      const response = await handlers.quoteDelivery(new Request(
        'http://localhost/api/v1/delivery/quote',
        { method: 'POST', body: JSON.stringify({ latitude: 36.54, longitude: -4.62 }) },
      ));
      expect(response.status).toBe(400);
      expect(await response.json()).toMatchObject({ code: 'CONFIGURATION_UNAVAILABLE' });
    } finally {
      delete process.env.HIELYA_SIMULATED_ROUTE_DISTANCE_KM;
    }
  });
});
