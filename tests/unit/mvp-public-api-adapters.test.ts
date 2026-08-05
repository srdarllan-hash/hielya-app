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
    const internalProduct = {
      id: '33333333-3333-5333-8333-333333333333',
      sku: 'TST-PACK-001',
      name: 'Pack aislado',
      categoryId: '11111111-1111-5111-8111-111111111111',
      salePriceCents: 100,
      currency: 'EUR' as const,
      availability: 'AVAILABLE' as const,
      isPack: true,
      iceIncluded: true,
      maxPerOrder: 2,
      containsAlcohol: false,
      minimumAge: null,
      physicalStock: 99,
      reservedStock: 11,
      purchaseCost: 50,
      inventoryMovements: [{ quantity: 99 }],
      bundleComponents: [{
        productId: '44444444-4444-5444-8444-444444444444',
        sku: 'TST-UNIT-001',
        name: 'Producto aislado',
        quantity: 2,
        physicalStock: 47,
        reservedStock: 3,
        purchaseCost: 25,
      }],
    };
    const source = {
      listCategoriesInDisplayOrder: () => [
        {
          id: '11111111-1111-5111-8111-111111111111',
          slug: 'Visible',
          name: 'Visible',
          sortOrder: 1,
          isActive: true,
          publicVisible: true,
          internalCategoryFlag: 'must-not-leak',
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
      listPubliclyEligibleProducts: () => [internalProduct],
    };
    const adapter = new MvpCatalogReadAdapter(source);
    const categories = adapter.listPublicCategories();
    const products = adapter.listPublicProducts();
    const product = products[0];

    expect(categories).toEqual([{
      id: '11111111-1111-5111-8111-111111111111',
      slug: 'Visible',
      name: 'Visible',
      sortOrder: 1,
    }]);
    expect(Object.keys(categories[0] ?? {}).sort()).toEqual([
      'id',
      'name',
      'slug',
      'sortOrder',
    ]);
    expect(product).toEqual({
      id: internalProduct.id,
      sku: internalProduct.sku,
      name: internalProduct.name,
      categoryId: internalProduct.categoryId,
      salePriceCents: internalProduct.salePriceCents,
      currency: internalProduct.currency,
      availability: internalProduct.availability,
      isPack: internalProduct.isPack,
      iceIncluded: internalProduct.iceIncluded,
      maxPerOrder: internalProduct.maxPerOrder,
      containsAlcohol: internalProduct.containsAlcohol,
      minimumAge: internalProduct.minimumAge,
      bundleComponents: [{
        productId: internalProduct.bundleComponents[0]?.productId,
        sku: internalProduct.bundleComponents[0]?.sku,
        name: internalProduct.bundleComponents[0]?.name,
        quantity: internalProduct.bundleComponents[0]?.quantity,
      }],
    });
    expect(Object.keys(product ?? {}).sort()).toEqual([
      'availability',
      'bundleComponents',
      'categoryId',
      'containsAlcohol',
      'currency',
      'iceIncluded',
      'id',
      'isPack',
      'maxPerOrder',
      'minimumAge',
      'name',
      'salePriceCents',
      'sku',
    ]);
    expect(Object.keys(product?.bundleComponents[0] ?? {}).sort()).toEqual([
      'name',
      'productId',
      'quantity',
      'sku',
    ]);
    expect(JSON.stringify({ categories, products })).not.toMatch(
      /internalCategoryFlag|physicalStock|reservedStock|purchaseCost|inventoryMovements/,
    );
    expect(adapter.findPublicProductById(
      '33333333-3333-5333-8333-333333333333',
    )).toEqual(product);
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
    expect(Object.keys(adapter.getDeliverySettings()).sort()).toEqual([
      'deliveryBaseFeeCents',
      'deliveryFeePerKmCents',
      'maximumRoadDistanceKm',
    ]);
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
