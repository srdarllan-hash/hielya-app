import { describe, expect, it } from 'vitest';
import { BUNDLE_COMPONENTS, INITIAL_SEED, MvpPersistenceDatabase, resolveDevelopmentMigrationPath } from '../../packages/persistence/src/index';

const settings = { minimumProductSubtotalCents: 2500, deliveryBaseFeeCents: 200, deliveryFeePerKmCents: 60, maximumRoadDistanceKm: 4, maximumPinAttempts: 3, tipsEnabled: true };
const createDb = () => { const persistence = new MvpPersistenceDatabase(); persistence.migrate(); persistence.seed(settings); return persistence; };

describe('MVP Local 36 persistence contracts', () => {
  it('resolves the development migration without requiring a file URL', () => {
    expect(resolveDevelopmentMigrationPath('http://vitest.invalid/module.ts')).toMatch(/\.dev-migrations\/0001_mvp_local_36_persistence\.sql$/);
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

  it('applies the migration to an empty database and preserves an existing development table', () => {
    const empty = new MvpPersistenceDatabase(); empty.migrate(); expect(empty.db.prepare("SELECT name FROM sqlite_master WHERE type='table' AND name='products'").get()).toBeTruthy(); empty.close();
    const existing = new MvpPersistenceDatabase(); existing.db.exec('CREATE TABLE legacy_development_data (id INTEGER PRIMARY KEY, note TEXT)'); existing.db.prepare('INSERT INTO legacy_development_data (note) VALUES (?)').run('preserve'); existing.migrate(); expect(existing.db.prepare('SELECT note FROM legacy_development_data').get<{ note:string }>()?.note).toBe('preserve'); existing.close();
  });
});
