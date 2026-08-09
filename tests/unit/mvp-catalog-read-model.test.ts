import { mkdtempSync, rmSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';

import { describe, expect, it } from 'vitest';
import {
  BUNDLE_COMPONENTS,
  CATEGORY_COMMERCIAL_SEED,
  COMPOSITE_CATALOG,
  MvpPersistenceDatabase,
  PRODUCT_COMMERCIAL_SEED,
  UNIT_CATALOG,
} from '../../packages/persistence/src/index';

const settings = {
  minimumProductSubtotalCents: 2500,
  deliveryBaseFeeCents: 200,
  deliveryFeePerKmCents: 60,
  maximumRoadDistanceKm: 4,
  maximumPinAttempts: 3,
  tipsEnabled: true,
};

const uuidV5Pattern = /^[0-9a-f]{8}-[0-9a-f]{4}-5[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/;

const createDb = (filename = ':memory:'): MvpPersistenceDatabase => {
  const persistence = new MvpPersistenceDatabase(filename);
  persistence.migrate();
  persistence.seed(settings);
  return persistence;
};

const collectKeys = (value: unknown, result = new Set<string>()): Set<string> => {
  if (Array.isArray(value)) {
    value.forEach((item) => collectKeys(item, result));
    return result;
  }
  if (!value || typeof value !== 'object') return result;
  for (const [key, child] of Object.entries(value as Record<string, unknown>)) {
    result.add(key);
    collectKeys(child, result);
  }
  return result;
};

describe('MVP Local 36 persistent catalog read model', () => {
  it('materializes 60 unit records, six composites and the certified MVP statuses', () => {
    const persistence = createDb();
    const counts = persistence.db.prepare(`
      SELECT
        COUNT(*) AS total,
        SUM(CASE WHEN kind = 'UNIT' THEN 1 ELSE 0 END) AS units,
        SUM(CASE WHEN kind = 'COMPOSITE' THEN 1 ELSE 0 END) AS composites,
        SUM(CASE WHEN mvp_status = 'PAUSED' THEN 1 ELSE 0 END) AS paused,
        SUM(CASE WHEN mvp_status = 'DEFERRED_AFTER_MVP' THEN 1 ELSE 0 END) AS deferred,
        SUM(commercially_active) AS active
      FROM products
    `).get<{
      total: number;
      units: number;
      composites: number;
      paused: number;
      deferred: number;
      active: number;
    }>();

    expect(counts).toEqual({
      total: 66,
      units: 60,
      composites: 6,
      paused: 36,
      deferred: 30,
      active: 0,
    });
    expect(persistence.db.prepare(
      'SELECT COUNT(*) AS count FROM product_commercial_data',
    ).get<{ count: number }>()?.count).toBe(66);
    expect(persistence.listMvpCatalogRecords()).toHaveLength(36);
    expect(persistence.listPubliclyEligibleProducts()).toEqual([]);
    persistence.close();
  });

  it('persists complete canonical fields for every MVP product', () => {
    const persistence = createDb();
    const records = persistence.listMvpCatalogRecords();
    const expected = PRODUCT_COMMERCIAL_SEED.filter(({ mvpStatus }) => mvpStatus === 'PAUSED');
    expect(expected).toHaveLength(36);

    for (const product of expected) {
      const record = records.find(({ sku }) => sku === product.sku);
      expect(record, product.sku).toMatchObject({
        id: product.id,
        sku: product.sku,
        name: product.name,
        categoryId: product.categoryId,
        categorySlug: product.category,
        salePriceCents: product.salePriceCents,
        currency: product.currency,
        maxPerOrder: product.maxPerOrder,
        containsAlcohol: product.containsAlcohol,
        minimumAge: product.minimumAge,
        isPack: product.isPack,
        iceIncluded: product.iceIncluded,
        kind: product.kind,
        mvpStatus: product.mvpStatus,
        commerciallyActive: false,
        publicVisible: false,
      });
    }

    const unit = persistence.findProductBySku('HYA-CER-001');
    expect(unit).toMatchObject({
      name: 'Mahou 5 Estrellas lata 33 cl',
      salePriceCents: 149,
      maxPerOrder: 24,
      containsAlcohol: true,
      minimumAge: 18,
    });
    const composite = persistence.findProductBySku('HYA-CMB-005');
    expect(composite).toMatchObject({
      name: 'Combo Gin Tonic Larios + Hielo',
      salePriceCents: 3500,
      maxPerOrder: 3,
      containsAlcohol: true,
      minimumAge: 18,
      isPack: true,
      iceIncluded: true,
    });
    persistence.close();
  });

  it('keeps unique UUIDv5 identifiers stable across repeat seeds and database reopen', () => {
    const directory = mkdtempSync(join(tmpdir(), 'hielya-catalog-'));
    const filename = join(directory, 'catalog.sqlite');
    try {
      const first = createDb(filename);
      const firstCategories = first.listCategoriesInDisplayOrder().map(({ id, slug }) => ({ id, slug }));
      const firstProducts = PRODUCT_COMMERCIAL_SEED.map(({ sku }) => {
        const record = first.findProductBySku(sku);
        if (!record) throw new Error(`missing seeded product: ${sku}`);
        return { id: record.id, sku: record.sku };
      });

      expect(new Set(firstCategories.map(({ id }) => id)).size).toBe(9);
      expect(new Set(firstProducts.map(({ id }) => id)).size).toBe(66);
      expect(firstCategories.every(({ id }) => uuidV5Pattern.test(id))).toBe(true);
      expect(firstProducts.every(({ id }) => uuidV5Pattern.test(id))).toBe(true);

      first.seed(settings);
      expect(first.listCategoriesInDisplayOrder().map(({ id, slug }) => ({ id, slug }))).toEqual(firstCategories);
      expect(PRODUCT_COMMERCIAL_SEED.map(({ sku }) => {
        const record = first.findProductBySku(sku);
        return { id: record?.id, sku: record?.sku };
      })).toEqual(firstProducts);
      first.close();

      const reopened = createDb(filename);
      expect(reopened.listCategoriesInDisplayOrder().map(({ id, slug }) => ({ id, slug }))).toEqual(firstCategories);
      expect(PRODUCT_COMMERCIAL_SEED.map(({ sku }) => {
        const record = reopened.findProductBySku(sku);
        return { id: record?.id, sku: record?.sku };
      })).toEqual(firstProducts);
      expect(reopened.db.prepare('PRAGMA foreign_key_check').all()).toEqual([]);
      reopened.close();
    } finally {
      rmSync(directory, { recursive: true, force: true });
    }
  });

  it('lists categories in canonical order and resolves category, product and settings lookups', () => {
    const persistence = createDb();
    const categories = persistence.listCategoriesInDisplayOrder();

    expect(categories.map(({ slug }) => slug)).toEqual(CATEGORY_COMMERCIAL_SEED.map(({ slug }) => slug));
    expect(categories.map(({ sortOrder }) => sortOrder)).toEqual([0, 1, 2, 3, 4, 5, 6, 7, 8]);
    expect(categories.every(({ isActive, publicVisible }) => isActive && !publicVisible)).toBe(true);
    for (const category of categories) {
      expect(persistence.findCategoryById(category.id)).toEqual(category);
    }

    const bySku = persistence.findProductBySku('HYA-GEL-051');
    expect(bySku).toBeDefined();
    expect(persistence.findProductById(bySku?.id ?? '')).toEqual(bySku);
    expect(persistence.findProductBySku('HYA-NOT-FOUND')).toBeUndefined();
    expect(persistence.findProductById('00000000-0000-5000-8000-000000000000')).toBeUndefined();
    expect(categories.some(({ id }) => id === bySku?.categoryId)).toBe(true);
    expect(persistence.getOperationalSettings()).toEqual({
      ...settings,
      inventoryReservationTtlSeconds: 600,
    });
    persistence.close();
  });

  it('resolves exact bundle composition with persisted component identifiers and names', () => {
    const persistence = createDb();

    expect(COMPOSITE_CATALOG.composites).toHaveLength(6);
    for (const composite of COMPOSITE_CATALOG.composites) {
      const components = persistence.resolveBundleComponents(composite.sku);
      expect(Object.fromEntries(
        components.map(({ sku, quantity }) => [sku, quantity]),
      )).toEqual(BUNDLE_COMPONENTS[composite.sku]);
      expect(components.some(({ sku }) => sku === 'HYA-GEL-051')).toBe(true);

      for (const component of components) {
        const product = persistence.findProductBySku(component.sku);
        expect(product).toBeDefined();
        expect(component).toEqual({
          productId: product?.id,
          sku: product?.sku,
          name: product?.name,
          quantity: BUNDLE_COMPONENTS[composite.sku][component.sku],
        });
        expect(component.productId).toMatch(uuidV5Pattern);
      }
    }
    persistence.close();
  });

  it('derives composite availability from the limiting component without independent stock', () => {
    const persistence = createDb();
    for (const composite of COMPOSITE_CATALOG.composites) {
      expect(persistence.db.prepare(
        'SELECT product_sku FROM inventory_balances WHERE product_sku = ?',
      ).get(composite.sku)).toBeUndefined();
      expect(() => persistence.adjustInventory(composite.sku, 1)).toThrow(
        'composite products have no independent inventory',
      );
    }

    persistence.adjustInventory('HYA-CER-001', 6);
    expect(persistence.getCommercialAvailability('HYA-CMB-001')).toBe('UNAVAILABLE');
    persistence.adjustInventory('HYA-GEL-051', 1);
    expect(persistence.getCommercialAvailability('HYA-CMB-001')).toBe('AVAILABLE');
    persistence.reserveBundle('HYA-CMB-001', 'availability-limit');
    expect(persistence.getCommercialAvailability('HYA-CMB-001')).toBe('UNAVAILABLE');
    persistence.close();
  });

  it('keeps public catalog DTOs free of internal stock, reservation and cost fields', () => {
    const persistence = createDb();
    persistence.adjustInventory('HYA-CER-001', 6);
    persistence.adjustInventory('HYA-GEL-051', 1);

    const publicAvailability = persistence.publicCatalogDto('HYA-CMB-001');
    const publicComponents = persistence.resolveBundleComponents('HYA-CMB-001');
    expect(publicAvailability).toEqual({ sku: 'HYA-CMB-001', availability: 'AVAILABLE' });
    expect(Object.keys(publicAvailability)).toEqual(['sku', 'availability']);
    expect(publicComponents.every((component) => (
      Object.keys(component).sort().join(',') === 'name,productId,quantity,sku'
    ))).toBe(true);

    const keys = [...collectKeys([publicAvailability, publicComponents])];
    expect(keys.filter((key) => /quantityOnHand|quantityReserved|quantityAvailable|physicalStock|availableStock|reservedStock|safetyStock|remainingQuantity|purchaseCost|margin|inventoryBatch|reorderPoint|movement|reservation/i.test(key))).toEqual([]);
    expect(persistence.listPubliclyEligibleProducts()).toEqual([]);
    persistence.close();
  });

  it('keeps all unit catalog records traceable to the certified extracted source', () => {
    expect(UNIT_CATALOG.units).toHaveLength(60);
    expect(UNIT_CATALOG.units.filter(({ mvpStatus }) => mvpStatus === 'PAUSED')).toHaveLength(30);
    expect(UNIT_CATALOG.units.filter(({ mvpStatus }) => mvpStatus === 'DEFERRED_AFTER_MVP')).toHaveLength(30);
    expect(UNIT_CATALOG.units.every((product) => (
      product.name.length > 0
      && Number.isInteger(product.salePriceCents)
      && product.salePriceCents >= 0
      && Number.isInteger(product.maxPerOrder)
      && product.maxPerOrder > 0
      && product.commerciallyActive === false
    ))).toBe(true);
  });
});
