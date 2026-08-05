import { mkdtempSync, rmSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';

import { describe, expect, it } from 'vitest';

import {
  MvpCatalogReadAdapter,
  MvpOperationalSettingsReadAdapter,
  MvpPersistenceDatabase,
} from '../../packages/persistence/src/index';

const settings = {
  minimumProductSubtotalCents: 2500,
  deliveryBaseFeeCents: 200,
  deliveryFeePerKmCents: 60,
  maximumRoadDistanceKm: 4,
  maximumPinAttempts: 3,
  tipsEnabled: true,
};

const createCanonicalDatabase = (): MvpPersistenceDatabase => {
  const persistence = new MvpPersistenceDatabase();
  persistence.migrate();
  persistence.seed(settings);
  return persistence;
};

const databaseState = (persistence: MvpPersistenceDatabase) => ({
  products: persistence.db.prepare(`
    SELECT COUNT(*) AS total, SUM(commercially_active) AS active
    FROM products
  `).get(),
  productVisibility: persistence.db.prepare(`
    SELECT COUNT(*) AS total, SUM(public_visible) AS visible
    FROM product_commercial_data
  `).get(),
  categoryVisibility: persistence.db.prepare(`
    SELECT COUNT(*) AS total, SUM(public_visible) AS visible
    FROM category_commercial_data
  `).get(),
  inventoryBalances: persistence.db.prepare(
    'SELECT COUNT(*) AS total FROM inventory_balances',
  ).get(),
  reservations: persistence.db.prepare(
    'SELECT COUNT(*) AS total FROM inventory_reservations',
  ).get(),
  movements: persistence.db.prepare(
    'SELECT COUNT(*) AS total FROM inventory_movements',
  ).get(),
  settings: persistence.getOperationalSettings(),
});

describe('MVP Local 36 public read adapters', () => {
  it('keeps the certified inactive catalog empty without mutating persistence', () => {
    const persistence = createCanonicalDatabase();
    const adapter = new MvpCatalogReadAdapter(persistence);
    const before = databaseState(persistence);

    expect(adapter.listPublicCategories()).toEqual([]);
    expect(adapter.listPublicProducts()).toEqual([]);
    expect(adapter.findPublicProductById(
      persistence.findProductBySku('HYA-CER-001')?.id ?? '',
    )).toBeUndefined();

    expect(databaseState(persistence)).toEqual(before);
    persistence.close();
  });

  it('strips internal category flags and preserves only certified public product fields', () => {
    const source = {
      listCategoriesInDisplayOrder: () => [
        {
          id: '11111111-1111-5111-8111-111111111111',
          slug: 'Visible',
          name: 'Visible',
          sortOrder: 1,
          isActive: true,
          publicVisible: true,
        },
        {
          id: '22222222-2222-5222-8222-222222222222',
          slug: 'Hidden',
          name: 'Hidden',
          sortOrder: 2,
          isActive: true,
          publicVisible: false,
        },
      ],
      listPubliclyEligibleProducts: () => [{
        id: '33333333-3333-5333-8333-333333333333',
        sku: 'TST-UNIT-001',
        name: 'Producto aislado',
        categoryId: '11111111-1111-5111-8111-111111111111',
        salePriceCents: 100,
        currency: 'EUR' as const,
        availability: 'AVAILABLE' as const,
        isPack: false,
        iceIncluded: false,
        maxPerOrder: 2,
        containsAlcohol: false,
        minimumAge: null,
        bundleComponents: [],
      }],
    };
    const adapter = new MvpCatalogReadAdapter(source);

    expect(adapter.listPublicCategories()).toEqual([{
      id: '11111111-1111-5111-8111-111111111111',
      slug: 'Visible',
      name: 'Visible',
      sortOrder: 1,
    }]);
    expect(adapter.listPublicProducts()).toEqual(source.listPubliclyEligibleProducts());
    expect(adapter.findPublicProductById(
      '33333333-3333-5333-8333-333333333333',
    )).toEqual(source.listPubliclyEligibleProducts()[0]);
  });

  it('reads operational settings through a mutation-free narrow adapter', () => {
    const persistence = createCanonicalDatabase();
    const adapter = new MvpOperationalSettingsReadAdapter(persistence);
    const before = databaseState(persistence);

    expect(adapter.getDeliverySettings()).toEqual({
      deliveryBaseFeeCents: 200,
      deliveryFeePerKmCents: 60,
      maximumRoadDistanceKm: 4,
    });
    expect(databaseState(persistence)).toEqual(before);
    persistence.close();
  });

  it('opens the runtime source in SQLite read-only mode', () => {
    const directory = mkdtempSync(join(tmpdir(), 'hielya-public-read-'));
    const filename = join(directory, 'catalog.sqlite');
    try {
      const setup = new MvpPersistenceDatabase(filename);
      setup.migrate();
      setup.seed(settings);
      setup.close();

      const readOnly = new MvpPersistenceDatabase(filename, undefined, { readOnly: true });
      const catalog = new MvpCatalogReadAdapter(readOnly);
      const before = databaseState(readOnly);

      expect(catalog.listPublicProducts()).toEqual([]);
      expect(() => readOnly.adjustInventory('HYA-CER-001', 1)).toThrow(/readonly/i);
      expect(databaseState(readOnly)).toEqual(before);
      readOnly.close();
    } finally {
      rmSync(directory, { recursive: true, force: true });
    }
  });
});
