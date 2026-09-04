import { describe, expect, it } from 'vitest';

import {
  GetPublicProduct,
  ListPublicCategories,
  ListPublicProducts,
  PublicApiError,
  QuoteSimulatedDelivery,
  type CatalogQueryPort,
  type PublicCategory,
  type PublicProduct,
} from '../../packages/application/src';

const categories: PublicCategory[] = [
  { id: '10000000-0000-4000-8000-000000000002', slug: 'refrescos', name: 'Refrescos', sortOrder: 2 },
  { id: '10000000-0000-4000-8000-000000000001', slug: 'cervezas', name: 'Cervezas', sortOrder: 1 },
];

const products: PublicProduct[] = [
  {
    id: '20000000-0000-4000-8000-000000000001',
    sku: 'TST-CER-001',
    name: 'Cerveza fría',
    categoryId: categories[1].id,
    salePriceCents: 250,
    currency: 'EUR',
    availability: 'AVAILABLE',
    isPack: false,
    iceIncluded: false,
    maxPerOrder: 12,
    containsAlcohol: true,
    minimumAge: 18,
  },
  {
    id: '20000000-0000-4000-8000-000000000002',
    sku: 'TST-REF-001',
    name: 'Tónica',
    categoryId: categories[0].id,
    salePriceCents: 180,
    currency: 'EUR',
    availability: 'TEMPORARILY_UNAVAILABLE',
    isPack: false,
    iceIncluded: false,
    maxPerOrder: 10,
    containsAlcohol: false,
    minimumAge: null,
  },
  {
    id: '20000000-0000-4000-8000-000000000003',
    sku: 'TST-PACK-001',
    name: 'Pack cerveza con hielo',
    categoryId: categories[1].id,
    salePriceCents: 1550,
    currency: 'EUR',
    availability: 'UNAVAILABLE',
    isPack: true,
    iceIncluded: true,
    maxPerOrder: 2,
    containsAlcohol: true,
    minimumAge: 18,
    bundleComponents: [
      {
        productId: '20000000-0000-4000-8000-000000000001',
        sku: 'TST-CER-001',
        name: 'Cerveza fría',
        quantity: 6,
      },
      {
        productId: '20000000-0000-4000-8000-000000000004',
        sku: 'TST-ICE-001',
        name: 'Hielo',
        quantity: 1,
      },
    ],
  },
];

const catalog: CatalogQueryPort = {
  async listPublicCategories() { return categories; },
  async listPublicProducts() { return products; },
  async findPublicProductById(productId) { return products.find((product) => product.id === productId); },
};

describe('MVP Local 36 application services', () => {
  it('orders categories without mutating the persisted order source', async () => {
    await expect(new ListPublicCategories(catalog).execute()).resolves.toEqual([categories[1], categories[0]]);
    expect(categories.map((category) => category.sortOrder)).toEqual([2, 1]);
  });

  it('filters by persisted category id or slug, q and public availability', async () => {
    const service = new ListPublicProducts(catalog);
    await expect(service.execute({ category: 'cervezas', q: 'cerveza', availableOnly: true }))
      .resolves.toMatchObject({ items: [products[0]], total: 1 });
    await expect(service.execute({ category: categories[0].id }))
      .resolves.toMatchObject({ items: [products[1]], total: 1 });
  });

  it('paginates and validates page inputs', async () => {
    const service = new ListPublicProducts(catalog);
    await expect(service.execute({ page: 2, pageSize: 1 }))
      .resolves.toEqual({ items: [products[1]], page: 2, pageSize: 1, total: 3 });
    await expect(service.execute({ page: 0 })).rejects.toMatchObject({ code: 'INVALID_INPUT', field: 'page' });
    await expect(service.execute({ pageSize: 101 })).rejects.toMatchObject({ code: 'INVALID_INPUT', field: 'pageSize' });
  });

  it('keeps stable ids between listing and detail and hides missing products', async () => {
    const detail = new GetPublicProduct(catalog);
    await expect(detail.execute(products[0].id)).resolves.toBe(products[0]);
    await expect(detail.execute('20000000-0000-4000-8000-999999999999'))
      .rejects.toMatchObject({ code: 'PRODUCT_NOT_FOUND', httpStatus: 404 });
  });

  it.each([
    [0, 200],
    [1, 260],
    [2, 320],
    [2.5, 350],
    [3, 380],
    [4, 440],
  ])('quotes %s km from persisted settings as %s cents', async (distanceKm, feeCents) => {
    const service = new QuoteSimulatedDelivery(
      { async getDeliverySettings() { return { deliveryBaseFeeCents: 200, deliveryFeePerKmCents: 60, maximumRoadDistanceKm: 4 }; } },
      { async getRoadDistanceKm() { return distanceKm; } },
    );
    await expect(service.execute({ latitude: 36.54, longitude: -4.62 }))
      .resolves.toEqual({ withinArea: true, routeDistanceKm: distanceKm, feeCents });
  });

  it('rejects invalid coordinates and distances outside the persisted radius', async () => {
    const service = new QuoteSimulatedDelivery(
      { async getDeliverySettings() { return { deliveryBaseFeeCents: 200, deliveryFeePerKmCents: 60, maximumRoadDistanceKm: 4 }; } },
      { async getRoadDistanceKm() { return 4.01; } },
    );
    await expect(service.execute({ latitude: 91, longitude: 0 }))
      .rejects.toMatchObject({ code: 'INVALID_INPUT', field: 'latitude' });
    await expect(service.execute({ latitude: 36.54, longitude: -4.62 }))
      .rejects.toMatchObject({ code: 'OUT_OF_AREA' });
  });

  it('maps missing settings and routing failures to the contract error', async () => {
    const missingSettings = new QuoteSimulatedDelivery(
      { async getDeliverySettings() { throw new Error('internal database detail'); } },
      { async getRoadDistanceKm() { return 1; } },
    );
    const missingRouting = new QuoteSimulatedDelivery(
      { async getDeliverySettings() { return { deliveryBaseFeeCents: 200, deliveryFeePerKmCents: 60, maximumRoadDistanceKm: 4 }; } },
      { async getRoadDistanceKm() { throw new Error('provider detail'); } },
    );
    await expect(missingSettings.execute({ latitude: 36.54, longitude: -4.62 }))
      .rejects.toBeInstanceOf(PublicApiError);
    await expect(missingRouting.execute({ latitude: 36.54, longitude: -4.62 }))
      .rejects.toMatchObject({ code: 'CONFIGURATION_UNAVAILABLE' });
  });
});
