import { createHash } from 'node:crypto';
import { mkdirSync, mkdtempSync, readFileSync, rmSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';

import { describe, expect, it } from 'vitest';
import {
  BUNDLE_COMPONENTS,
  DEVELOPMENT_MIGRATIONS,
  INITIAL_SEED,
  MvpPersistenceDatabase,
  resolveDevelopmentMigrationPath,
} from '../../packages/persistence/src/index';

const settings = { minimumProductSubtotalCents: 2500, deliveryBaseFeeCents: 200, deliveryFeePerKmCents: 60, maximumRoadDistanceKm: 4, maximumPinAttempts: 3, tipsEnabled: true };
const createDb = () => { const persistence = new MvpPersistenceDatabase(); persistence.migrate(); persistence.seed(settings); return persistence; };

describe('MVP Local 36 persistence contracts', () => {
  it('resolves the development migration without requiring a file URL', () => {
    expect(resolveDevelopmentMigrationPath('http://vitest.invalid/module.ts')).toMatch(/\.dev-migrations\/0001_mvp_local_36_persistence\.sql$/);
    expect(resolveDevelopmentMigrationPath(
      'http://vitest.invalid/module.ts',
      DEVELOPMENT_MIGRATIONS[1],
    )).toMatch(/\.dev-migrations\/0002_mvp_local_36_catalog_read_model\.sql$/);
    expect(resolveDevelopmentMigrationPath(
      'http://vitest.invalid/module.ts',
      DEVELOPMENT_MIGRATIONS[2],
    )).toMatch(/\.dev-migrations\/0003_mvp_local_36_inventory_reservation_lifecycle\.sql$/);
    expect(resolveDevelopmentMigrationPath(
      'http://vitest.invalid/module.ts',
      DEVELOPMENT_MIGRATIONS[3],
    )).toMatch(/\.dev-migrations\/0004_mvp_local_36_customer_authentication_foundation\.sql$/);
  });

  it('seeds 30 selected original SKUs, six composites and preserves 30 deferred baseline SKUs', () => {
    const persistence = createDb();
    expect(INITIAL_SEED).toHaveLength(66);
    expect(INITIAL_SEED.filter((product) => product.status === 'PAUSED')).toHaveLength(36);
    expect(INITIAL_SEED.filter((product) => product.status === 'DEFERRED_AFTER_MVP')).toHaveLength(30);
    expect(Object.keys(BUNDLE_COMPONENTS)).toHaveLength(6);
    expect(BUNDLE_COMPONENTS['HYA-CMB-005']).toEqual({ 'HYA-DES-036': 1, 'HYA-REF-023': 6, 'HYA-GEL-051': 1, 'HYA-CON-059': 1, 'HYA-CON-060': 1 });
    expect(BUNDLE_COMPONENTS['HYA-CMB-006']).toEqual({ 'HYA-DES-040': 1, 'HYA-ENE-026': 4, 'HYA-GEL-051': 1, 'HYA-CON-059': 1 });
    persistence.close();
  });

  it('rejects independent composite stock, negative stock and invalid component references', () => {
    const persistence = createDb();
    expect(() => persistence.adjustInventory('HYA-CMB-001', 1)).toThrow('composite products have no independent inventory');
    expect(() => persistence.adjustInventory('HYA-CER-001', -1)).toThrow('negative inventory is prohibited');
    expect(() => persistence.db.prepare('INSERT INTO product_bundle_components (bundle_sku,component_sku,quantity) VALUES (?,?,?)').run('HYA-CMB-001', 'HYA-NOT-FOUND', 1)).toThrow();
    persistence.close();
  });

  it('uses the limiting component and rolls back the entire reservation when any component fails', () => {
    const persistence = createDb();
    persistence.adjustInventory('HYA-DES-036', 1); persistence.adjustInventory('HYA-REF-023', 5); persistence.adjustInventory('HYA-GEL-051', 1); persistence.adjustInventory('HYA-CON-059', 1); persistence.adjustInventory('HYA-CON-060', 1);
    expect(persistence.publicCatalogDto('HYA-CMB-005').availability).toBe('UNAVAILABLE');
    expect(() => persistence.reserveBundle('HYA-CMB-005', 'rollback-case')).toThrow('component unavailable: HYA-REF-023');
    expect(persistence.db.prepare('SELECT COUNT(*) AS count FROM inventory_reservations').get<{ count:number }>()?.count).toBe(0);
    persistence.adjustInventory('HYA-REF-023', 1);
    const id = persistence.reserveBundle('HYA-CMB-005', 'complete-case');
    expect(id).toMatch(/^[0-9a-f-]{36}$/);
    expect(persistence.internalInventory('HYA-REF-023').quantityReserved).toBe(6);
    persistence.close();
  });

  it('reads editable settings from storage for minimum, delivery and PIN policies', () => {
    const persistence = createDb();
    expect(persistence.remainingForMinimum(2400)).toBe(100);
    expect(persistence.quoteDelivery(4)).toEqual({ eligible: true, feeCents: 440 });
    persistence.updateSettings({ ...settings, minimumProductSubtotalCents: 3000, deliveryBaseFeeCents: 300, maximumPinAttempts: 1 });
    expect(persistence.remainingForMinimum(2400)).toBe(600);
    expect(persistence.quoteDelivery(1)).toEqual({ eligible: true, feeCents: 360 });
    persistence.createDeliveryPin('order-1', '1234');
    expect(persistence.verifyDeliveryPin('order-1', '0000')).toBe(false);
    expect(persistence.verifyDeliveryPin('order-1', '1234')).toBe(false);
    persistence.close();
  });

  it('separates public commercial availability from internal operational quantities', () => {
    const persistence = createDb(); persistence.adjustInventory('HYA-CER-001', 2);
    const publicDto = persistence.publicCatalogDto('HYA-CER-001');
    expect(publicDto).toEqual({ sku: 'HYA-CER-001', availability: 'AVAILABLE' });
    expect(Object.keys(publicDto)).toEqual(['sku', 'availability']);
    expect(persistence.internalInventory('HYA-CER-001')).toEqual({ sku: 'HYA-CER-001', quantityOnHand: 2, quantityReserved: 0, quantityAvailable: 2 });
    persistence.close();
  });

  it('applies ordered checksummed migrations to an empty database exactly once', () => {
    const persistence = new MvpPersistenceDatabase();
    persistence.migrate();

    const tables = persistence.db.prepare(
      "SELECT name FROM sqlite_master WHERE type='table' ORDER BY name",
    ).all<{ name: string }>().map(({ name }) => name);
    expect(tables).toEqual(expect.arrayContaining([
      'categories',
      'products',
      'category_commercial_data',
      'product_commercial_data',
      'development_schema_migrations',
    ]));

    const expectedMigrations = DEVELOPMENT_MIGRATIONS.map((version) => ({
      version,
      sha256: createHash('sha256')
        .update(readFileSync(join(process.cwd(), '.dev-migrations', version)))
        .digest('hex'),
    }));
    const firstLedger = persistence.db.prepare(
      'SELECT version,sha256 FROM development_schema_migrations ORDER BY version',
    ).all<{ version: string; sha256: string }>();
    expect(firstLedger).toEqual(expectedMigrations);

    persistence.migrate();
    const secondLedger = persistence.db.prepare(
      'SELECT version,sha256 FROM development_schema_migrations ORDER BY version',
    ).all<{ version: string; sha256: string }>();
    expect(secondLedger).toEqual(firstLedger);
    expect(persistence.db.prepare('PRAGMA foreign_keys').get<{ foreign_keys: number }>()?.foreign_keys).toBe(1);
    expect(persistence.db.prepare('PRAGMA foreign_key_check').all()).toEqual([]);
    persistence.close();
  });

  it('preserves an existing development database while applying the additive read model', () => {
    const persistence = new MvpPersistenceDatabase();
    persistence.db.exec(readFileSync(
      join(process.cwd(), '.dev-migrations', DEVELOPMENT_MIGRATIONS[0]),
      'utf8',
    ));
    persistence.db.prepare(
      'INSERT INTO categories (slug,name_es,sort_order) VALUES (?,?,?)',
    ).run('Legacy', 'Legacy', 99);
    persistence.db.prepare(`
      INSERT INTO products (sku,category_slug,kind,mvp_status)
      VALUES (?,?,?,?)
    `).run('HYA-LEG-001', 'Legacy', 'UNIT', 'DEFERRED_AFTER_MVP');
    persistence.db.exec('CREATE TABLE legacy_development_data (id INTEGER PRIMARY KEY, note TEXT)');
    persistence.db.prepare('INSERT INTO legacy_development_data (note) VALUES (?)').run('preserve');

    persistence.migrate();

    expect(persistence.db.prepare(
      'SELECT note FROM legacy_development_data',
    ).get<{ note: string }>()?.note).toBe('preserve');
    expect(persistence.db.prepare(
      'SELECT category_slug FROM products WHERE sku = ?',
    ).get<{ category_slug: string }>('HYA-LEG-001')?.category_slug).toBe('Legacy');
    expect(persistence.db.prepare(
      "SELECT name FROM sqlite_master WHERE type='table' AND name='product_commercial_data'",
    ).get()).toBeTruthy();
    expect(persistence.db.prepare('PRAGMA foreign_key_check').all()).toEqual([]);
    persistence.close();
  });

  it('rejects a modified migration whose recorded checksum no longer matches', () => {
    const directory = mkdtempSync(join(tmpdir(), 'hielya-migrations-'));
    try {
      mkdirSync(directory, { recursive: true });
      for (const filename of DEVELOPMENT_MIGRATIONS) {
        writeFileSync(
          join(directory, filename),
          readFileSync(join(process.cwd(), '.dev-migrations', filename)),
        );
      }
      const persistence = new MvpPersistenceDatabase(':memory:', directory);
      persistence.migrate();
      writeFileSync(
        join(directory, DEVELOPMENT_MIGRATIONS[1]),
        `${readFileSync(join(directory, DEVELOPMENT_MIGRATIONS[1]), 'utf8')}\n-- forbidden rewrite\n`,
      );

      expect(() => persistence.migrate()).toThrow(
        `development migration checksum mismatch: ${DEVELOPMENT_MIGRATIONS[1]}`,
      );
      expect(persistence.db.prepare('PRAGMA foreign_key_check').all()).toEqual([]);
      persistence.close();
    } finally {
      rmSync(directory, { recursive: true, force: true });
    }
  });
});
