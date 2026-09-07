import { createHash } from 'node:crypto';
import { mkdtempSync, readFileSync, rmSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';

import { describe, expect, it } from 'vitest';
import {
  DEFAULT_INVENTORY_RESERVATION_TTL_SECONDS,
  DEVELOPMENT_MIGRATIONS,
  LEGACY_FINGERPRINT_PREFIX,
  MvpPersistenceDatabase,
  REQUEST_FINGERPRINT_PREFIX,
} from '../../packages/persistence/src/index';

const NOW = '2030-01-01T12:00:00.000Z';
const BEFORE_EXPIRY = '2030-01-01T12:09:59.999Z';
const AT_EXPIRY = '2030-01-01T12:10:00.000Z';
const AFTER_EXPIRY = '2030-01-01T12:10:01.000Z';
const settings = {
  minimumProductSubtotalCents: 2500,
  deliveryBaseFeeCents: 200,
  deliveryFeePerKmCents: 60,
  maximumRoadDistanceKm: 4,
  maximumPinAttempts: 3,
  tipsEnabled: true,
};

const createDb = (filename = ':memory:') => {
  const persistence = new MvpPersistenceDatabase(filename);
  persistence.migrate();
  persistence.seed(settings);
  return persistence;
};

const addStock = (persistence: MvpPersistenceDatabase, sku: string, quantity: number) => {
  persistence.adjustInventory(sku, quantity, 'TEST_STOCK', NOW);
};

describe('MVP Local 36 inventory reservation migration', () => {
  it('keeps migrations 0001 and 0002 byte-stable and applies 0003 once with its checksum', () => {
    expect(DEVELOPMENT_MIGRATIONS).toEqual([
      '0001_mvp_local_36_persistence.sql',
      '0002_mvp_local_36_catalog_read_model.sql',
      '0003_mvp_local_36_inventory_reservation_lifecycle.sql',
      '0004_mvp_local_36_customer_authentication_foundation.sql',
      '0005_mvp_local_36_order_delivery_foundation.sql',
    ]);
    expect(createHash('sha256').update(readFileSync(join(
      process.cwd(),
      '.dev-migrations/0001_mvp_local_36_persistence.sql',
    ))).digest('hex')).toBe('ed360af8faec4d49bce41390d40c914d311acecafccf5abd54565709a80eb601');
    expect(createHash('sha256').update(readFileSync(join(
      process.cwd(),
      '.dev-migrations/0002_mvp_local_36_catalog_read_model.sql',
    ))).digest('hex')).toBe('be0ffd436c224a027992c4900523b5dc7c658fc465a775fcfcb3722a5fe0173b');

    const persistence = createDb();
    const first = persistence.db.prepare(
      'SELECT version,sha256 FROM development_schema_migrations ORDER BY version',
    ).all();
    expect(first).toHaveLength(5);
    persistence.migrate();
    expect(persistence.db.prepare(
      'SELECT version,sha256 FROM development_schema_migrations ORDER BY version',
    ).all()).toEqual(first);
    expect(persistence.db.prepare('PRAGMA foreign_key_check').all()).toEqual([]);
    persistence.close();
  });

  it('preserves and deterministically backfills a legacy active reservation', () => {
    const persistence = new MvpPersistenceDatabase();
    persistence.db.exec(readFileSync(join(process.cwd(), '.dev-migrations/0001_mvp_local_36_persistence.sql'), 'utf8'));
    persistence.db.exec(readFileSync(join(process.cwd(), '.dev-migrations/0002_mvp_local_36_catalog_read_model.sql'), 'utf8'));
    persistence.db.prepare(
      'INSERT INTO categories (slug,name_es,sort_order) VALUES (?,?,?)',
    ).run('Legacy', 'Legacy', 1);
    persistence.db.prepare(`
      INSERT INTO products (sku,category_slug,kind,mvp_status)
      VALUES ('LEG-UNIT-1','Legacy','UNIT','PAUSED')
    `).run();
    persistence.db.prepare(`
      INSERT INTO inventory_reservations (reservation_id,reference_id,status,created_at)
      VALUES ('legacy-reservation','legacy-reference','ACTIVE','2030-01-01 12:00:00')
    `).run();
    persistence.db.prepare(`
      INSERT INTO inventory_reservation_items (reservation_id,product_sku,quantity)
      VALUES ('legacy-reservation','LEG-UNIT-1',2)
    `).run();

    persistence.migrate();

    expect(persistence.findReservationById('legacy-reservation')).toMatchObject({
      reservationId: 'legacy-reservation',
      referenceId: 'legacy-reference',
      status: 'ACTIVE',
      expiresAt: AT_EXPIRY,
      requestFingerprint: expect.stringMatching(/^legacy-v1:/),
      items: [{ productSku: 'LEG-UNIT-1', quantity: 2 }],
    });
    expect(persistence.getActiveReservedQuantity('LEG-UNIT-1', BEFORE_EXPIRY)).toBe(2);
    expect(persistence.getActiveReservedQuantity('LEG-UNIT-1', AT_EXPIRY)).toBe(0);
    expect(persistence.db.prepare('PRAGMA foreign_key_check').all()).toEqual([]);
    persistence.close();
  });

  it('persists the certified 600-second TTL and validates integer storage', () => {
    const persistence = createDb();
    expect(persistence.getOperationalSettings().inventoryReservationTtlSeconds)
      .toBe(DEFAULT_INVENTORY_RESERVATION_TTL_SECONDS);
    expect(() => persistence.db.prepare(`
      UPDATE operational_settings SET inventory_reservation_ttl_seconds=1.5 WHERE id=1
    `).run()).toThrow();
    expect(() => persistence.db.prepare(`
      INSERT INTO inventory_balances (product_sku,quantity_on_hand)
      VALUES ('HYA-CER-001',1.5)
    `).run()).toThrow('inventory quantity must be an integer');
    persistence.close();
  });

  it('reads a changed TTL from storage and preserves it across unrelated settings updates', () => {
    const persistence = createDb();
    persistence.updateSettings({ ...settings, inventoryReservationTtlSeconds: 120 });
    persistence.updateSettings({ ...settings, deliveryBaseFeeCents: 300 });
    addStock(persistence, 'HYA-CER-001', 1);
    const reservation = persistence.reserveInventory({
      referenceId: 'stored-ttl',
      items: [{ productSku: 'HYA-CER-001', quantity: 1 }],
      now: NOW,
    });
    expect(persistence.getOperationalSettings().inventoryReservationTtlSeconds).toBe(120);
    expect(reservation.expiresAt).toBe('2030-01-01T12:02:00.000Z');
    persistence.close();
  });
});

describe('MVP Local 36 generic inventory reservation', () => {
  it('reserves unit quantities with deterministic UTC timestamps and request-v1 fingerprint', () => {
    const persistence = createDb();
    addStock(persistence, 'HYA-CER-001', 10);

    const reservation = persistence.reserveInventory({
      referenceId: ' unit-reference ',
      items: [{ productSku: 'HYA-CER-001', quantity: 3 }],
      now: NOW,
    });

    expect(reservation).toMatchObject({
      referenceId: 'unit-reference',
      status: 'ACTIVE',
      createdAt: NOW,
      expiresAt: AT_EXPIRY,
      releasedAt: null,
      convertedAt: null,
      releaseReason: null,
      requestFingerprint: expect.stringMatching(/^request-v1:[0-9a-f]{64}$/),
      updatedAt: NOW,
      items: [{ productSku: 'HYA-CER-001', quantity: 3 }],
    });
    expect(persistence.internalInventory('HYA-CER-001', NOW)).toEqual({
      sku: 'HYA-CER-001',
      quantityOnHand: 10,
      quantityReserved: 3,
      quantityAvailable: 7,
    });
    persistence.close();
  });

  it('normalizes duplicates before fingerprinting and replays idempotently without writes', () => {
    const persistence = createDb();
    addStock(persistence, 'HYA-CER-001', 10);
    const first = persistence.reserveInventory({
      referenceId: 'same-reference',
      items: [
        { productSku: 'HYA-CER-001', quantity: 1 },
        { productSku: 'HYA-CER-001', quantity: 2 },
      ],
      now: NOW,
    });
    const before = persistence.db.prepare(`
      SELECT
        (SELECT COUNT(*) FROM inventory_reservations) AS reservations,
        (SELECT COUNT(*) FROM inventory_reservation_items) AS items,
        (SELECT COUNT(*) FROM inventory_movements) AS movements
    `).get();

    const replay = persistence.reserveInventory({
      referenceId: 'same-reference',
      items: [{ productSku: 'HYA-CER-001', quantity: 3 }],
      now: AFTER_EXPIRY,
    });

    expect(replay).toEqual(first);
    expect(persistence.db.prepare(`
      SELECT
        (SELECT COUNT(*) FROM inventory_reservations) AS reservations,
        (SELECT COUNT(*) FROM inventory_reservation_items) AS items,
        (SELECT COUNT(*) FROM inventory_movements) AS movements
    `).get()).toEqual(before);
    expect(() => persistence.reserveInventory({
      referenceId: 'same-reference',
      items: [{ productSku: 'HYA-CER-001', quantity: 4 }],
      now: NOW,
    })).toThrow('different request fingerprint');
    expect(persistence.findReservationByReferenceId('same-reference')).toEqual(first);
    persistence.close();
  });

  it('expands multiple composites, quantities and shared components deterministically', () => {
    const persistence = createDb();
    addStock(persistence, 'HYA-CER-001', 20);
    addStock(persistence, 'HYA-CER-003', 20);
    addStock(persistence, 'HYA-GEL-051', 10);

    const reservation = persistence.reserveInventory({
      referenceId: 'shared-components',
      items: [
        { productSku: 'HYA-CMB-002', quantity: 1 },
        { productSku: 'HYA-CMB-001', quantity: 2 },
      ],
      now: NOW,
    });

    expect(reservation.items).toEqual([
      { productSku: 'HYA-CER-001', quantity: 12 },
      { productSku: 'HYA-CER-003', quantity: 6 },
      { productSku: 'HYA-GEL-051', quantity: 3 },
    ]);
    expect(persistence.db.prepare(
      "SELECT product_sku FROM inventory_balances WHERE product_sku LIKE 'HYA-CMB-%'",
    ).all()).toEqual([]);
    persistence.close();
  });

  it('supports mixed unit and composite requests and rolls back all unavailable items', () => {
    const persistence = createDb();
    addStock(persistence, 'HYA-CER-001', 8);
    addStock(persistence, 'HYA-GEL-051', 1);
    const mixed = persistence.reserveInventory({
      referenceId: 'mixed',
      items: [
        { productSku: 'HYA-CMB-001', quantity: 1 },
        { productSku: 'HYA-CER-001', quantity: 2 },
      ],
      now: NOW,
    });
    expect(mixed.items).toEqual([
      { productSku: 'HYA-CER-001', quantity: 8 },
      { productSku: 'HYA-GEL-051', quantity: 1 },
    ]);

    const before = persistence.db.prepare('SELECT COUNT(*) AS count FROM inventory_reservations').get();
    expect(() => persistence.reserveInventory({
      referenceId: 'unavailable',
      items: [
        { productSku: 'HYA-CER-003', quantity: 1 },
        { productSku: 'HYA-CER-006', quantity: 1 },
      ],
      now: NOW,
    })).toThrow('component unavailable');
    expect(persistence.db.prepare('SELECT COUNT(*) AS count FROM inventory_reservations').get())
      .toEqual(before);
    expect(persistence.findReservationByReferenceId('unavailable')).toBeUndefined();
    persistence.close();
  });

  it('rejects malformed requests and composites without valid components before writing', () => {
    const persistence = createDb();
    for (const input of [
      { referenceId: '', items: [{ productSku: 'HYA-CER-001', quantity: 1 }] },
      { referenceId: 'empty', items: [] },
      { referenceId: 'missing-sku', items: [{ productSku: '', quantity: 1 }] },
      { referenceId: 'zero', items: [{ productSku: 'HYA-CER-001', quantity: 0 }] },
      { referenceId: 'negative', items: [{ productSku: 'HYA-CER-001', quantity: -1 }] },
      { referenceId: 'decimal', items: [{ productSku: 'HYA-CER-001', quantity: 1.5 }] },
      { referenceId: 'unknown', items: [{ productSku: 'HYA-NOT-FOUND', quantity: 1 }] },
    ]) {
      expect(() => persistence.reserveInventory({ ...input, now: NOW })).toThrow();
    }
    persistence.db.prepare(
      "DELETE FROM product_bundle_components WHERE bundle_sku='HYA-CMB-006'",
    ).run();
    expect(() => persistence.reserveInventory({
      referenceId: 'invalid-composite',
      items: [{ productSku: 'HYA-CMB-006', quantity: 1 }],
      now: NOW,
    })).toThrow('bundle components missing');
    expect(persistence.db.prepare('SELECT COUNT(*) AS count FROM inventory_reservations')
      .get<{ count: number }>()?.count).toBe(0);
    persistence.close();
  });

  it('keeps reserveBundle as a quantity-one wrapper and recognizes unambiguous legacy items only', () => {
    const persistence = createDb();
    addStock(persistence, 'HYA-CER-001', 12);
    addStock(persistence, 'HYA-GEL-051', 2);
    const id = persistence.reserveBundle('HYA-CMB-001', 'wrapper', NOW);
    expect(persistence.findReservationById(id)?.items).toEqual([
      { productSku: 'HYA-CER-001', quantity: 6 },
      { productSku: 'HYA-GEL-051', quantity: 1 },
    ]);
    expect(persistence.reserveBundle('HYA-CMB-001', 'wrapper', AFTER_EXPIRY)).toBe(id);
    expect(persistence.findReservationById(id)?.requestFingerprint)
      .toMatch(new RegExp(`^${REQUEST_FINGERPRINT_PREFIX}`));
    persistence.close();
  });
});

describe('MVP Local 36 reservation lifecycle and inventory invariants', () => {
  it('excludes expired reservations at the TTL boundary without requiring a sweep', () => {
    const persistence = createDb();
    addStock(persistence, 'HYA-CER-001', 5);
    const reservation = persistence.reserveInventory({
      referenceId: 'expiry-boundary',
      items: [{ productSku: 'HYA-CER-001', quantity: 3 }],
      now: NOW,
    });
    expect(persistence.internalInventory('HYA-CER-001', BEFORE_EXPIRY).quantityReserved).toBe(3);
    expect(persistence.internalInventory('HYA-CER-001', AT_EXPIRY)).toEqual({
      sku: 'HYA-CER-001', quantityOnHand: 5, quantityReserved: 0, quantityAvailable: 5,
    });
    expect(persistence.findReservationById(reservation.reservationId)?.status).toBe('ACTIVE');
    persistence.close();
  });

  it('expires due reservations exactly once without changing on-hand stock', () => {
    const persistence = createDb();
    addStock(persistence, 'HYA-CER-001', 5);
    const reservation = persistence.reserveInventory({
      referenceId: 'expire',
      items: [{ productSku: 'HYA-CER-001', quantity: 2 }],
      now: NOW,
    });
    expect(persistence.expireDueReservations(BEFORE_EXPIRY)).toEqual([]);
    expect(persistence.expireDueReservations(AT_EXPIRY)).toEqual([
      expect.objectContaining({
        reservationId: reservation.reservationId,
        status: 'RELEASED',
        releaseReason: 'EXPIRED',
        releasedAt: AT_EXPIRY,
      }),
    ]);
    expect(persistence.expireDueReservations(AFTER_EXPIRY)).toEqual([]);
    expect(persistence.internalInventory('HYA-CER-001', AFTER_EXPIRY).quantityOnHand).toBe(5);
    persistence.close();
  });

  it('releases manually, treats an expired manual release as EXPIRED and is idempotent', () => {
    const persistence = createDb();
    addStock(persistence, 'HYA-CER-001', 5);
    const manual = persistence.reserveInventory({
      referenceId: 'manual', items: [{ productSku: 'HYA-CER-001', quantity: 1 }], now: NOW,
    });
    const released = persistence.releaseReservation(manual.reservationId, 'MANUAL', BEFORE_EXPIRY);
    expect(released).toMatchObject({
      status: 'RELEASED', releaseReason: 'MANUAL', releasedAt: BEFORE_EXPIRY,
    });
    expect(persistence.releaseReservation(manual.reservationId, 'MANUAL', AFTER_EXPIRY))
      .toEqual(released);

    const expired = persistence.reserveInventory({
      referenceId: 'expired-release', items: [{ productSku: 'HYA-CER-001', quantity: 1 }], now: NOW,
    });
    expect(persistence.releaseReservation(expired.reservationId, 'MANUAL', AT_EXPIRY))
      .toMatchObject({ status: 'RELEASED', releaseReason: 'EXPIRED', releasedAt: AT_EXPIRY });
    persistence.close();
  });

  it('converts once with reservation-linked movements and preserves sellable availability', () => {
    const persistence = createDb();
    addStock(persistence, 'HYA-CER-001', 10);
    const reservation = persistence.reserveInventory({
      referenceId: 'convert', items: [{ productSku: 'HYA-CER-001', quantity: 3 }], now: NOW,
    });
    expect(persistence.internalInventory('HYA-CER-001', NOW).quantityAvailable).toBe(7);

    const converted = persistence.convertReservation(reservation.reservationId, BEFORE_EXPIRY);

    expect(converted).toMatchObject({
      status: 'CONVERTED', convertedAt: BEFORE_EXPIRY, updatedAt: BEFORE_EXPIRY,
    });
    expect(persistence.internalInventory('HYA-CER-001', BEFORE_EXPIRY)).toEqual({
      sku: 'HYA-CER-001', quantityOnHand: 7, quantityReserved: 0, quantityAvailable: 7,
    });
    const movements = persistence.db.prepare(`
      SELECT delta_quantity,quantity_after,reason,correlation_id,reservation_id,created_at
      FROM inventory_movements WHERE reservation_id=?
    `).all<{
      delta_quantity: number;
      quantity_after: number;
      reason: string;
      correlation_id: string;
      reservation_id: string;
      created_at: string;
    }>(reservation.reservationId);
    expect(movements).toEqual([expect.objectContaining({
      delta_quantity: -3,
      quantity_after: 7,
      reason: 'RESERVATION_CONVERTED',
      reservation_id: reservation.reservationId,
      created_at: BEFORE_EXPIRY,
    })]);
    expect(movements[0]?.correlation_id).toMatch(/^[0-9a-f-]{36}$/);

    expect(persistence.convertReservation(reservation.reservationId, AFTER_EXPIRY)).toEqual(converted);
    expect(persistence.db.prepare(
      'SELECT COUNT(*) AS count FROM inventory_movements WHERE reservation_id=?',
    ).get<{ count: number }>(reservation.reservationId)?.count).toBe(1);
    persistence.close();
  });

  it('uses one correlation ID for all component movements and never consumes an expired reservation', () => {
    const persistence = createDb();
    addStock(persistence, 'HYA-CER-001', 6);
    addStock(persistence, 'HYA-GEL-051', 1);
    const bundle = persistence.reserveInventory({
      referenceId: 'bundle-convert', items: [{ productSku: 'HYA-CMB-001', quantity: 1 }], now: NOW,
    });
    persistence.convertReservation(bundle.reservationId, BEFORE_EXPIRY);
    const movements = persistence.db.prepare(`
      SELECT correlation_id,reservation_id FROM inventory_movements WHERE reservation_id=?
    `).all<{ correlation_id: string; reservation_id: string }>(bundle.reservationId);
    expect(movements).toHaveLength(2);
    expect(new Set(movements.map(({ correlation_id }) => correlation_id)).size).toBe(1);

    addStock(persistence, 'HYA-CER-003', 2);
    const expired = persistence.reserveInventory({
      referenceId: 'expired-convert', items: [{ productSku: 'HYA-CER-003', quantity: 2 }], now: NOW,
    });
    expect(persistence.convertReservation(expired.reservationId, AT_EXPIRY))
      .toMatchObject({ status: 'RELEASED', releaseReason: 'EXPIRED' });
    expect(persistence.internalInventory('HYA-CER-003', AFTER_EXPIRY).quantityOnHand).toBe(2);
    expect(persistence.db.prepare(
      'SELECT COUNT(*) AS count FROM inventory_movements WHERE reservation_id=?',
    ).get<{ count: number }>(expired.reservationId)?.count).toBe(0);
    persistence.close();
  });

  it('rolls back every balance and movement when conversion validation fails mid-transaction', () => {
    const persistence = createDb();
    addStock(persistence, 'HYA-CER-001', 6);
    addStock(persistence, 'HYA-GEL-051', 1);
    const reservation = persistence.reserveInventory({
      referenceId: 'conversion-rollback',
      items: [{ productSku: 'HYA-CMB-001', quantity: 1 }],
      now: NOW,
    });
    persistence.db.prepare(
      "DELETE FROM inventory_balances WHERE product_sku='HYA-GEL-051'",
    ).run();

    expect(() => persistence.convertReservation(reservation.reservationId, BEFORE_EXPIRY))
      .toThrow('inventory balance missing: HYA-GEL-051');

    expect(persistence.findReservationById(reservation.reservationId)?.status).toBe('ACTIVE');
    expect(persistence.internalInventory('HYA-CER-001', BEFORE_EXPIRY).quantityOnHand).toBe(6);
    expect(persistence.db.prepare(
      'SELECT COUNT(*) AS count FROM inventory_movements WHERE reservation_id=?',
    ).get<{ count: number }>(reservation.reservationId)?.count).toBe(0);
    persistence.close();
  });

  it('converts one reservation without consuming stock held for another active reservation', () => {
    const persistence = createDb();
    addStock(persistence, 'HYA-CER-001', 5);
    const first = persistence.reserveInventory({
      referenceId: 'first-active', items: [{ productSku: 'HYA-CER-001', quantity: 2 }], now: NOW,
    });
    persistence.reserveInventory({
      referenceId: 'second-active', items: [{ productSku: 'HYA-CER-001', quantity: 3 }], now: NOW,
    });

    persistence.convertReservation(first.reservationId, BEFORE_EXPIRY);

    expect(persistence.internalInventory('HYA-CER-001', BEFORE_EXPIRY)).toEqual({
      sku: 'HYA-CER-001', quantityOnHand: 3, quantityReserved: 3, quantityAvailable: 0,
    });
    persistence.close();
  });

  it('rejects decimal adjustments and adjustments below active reservations atomically', () => {
    const persistence = createDb();
    expect(() => persistence.adjustInventory('HYA-CER-001', 1.5, 'INVALID', NOW))
      .toThrow('non-zero integer');
    addStock(persistence, 'HYA-CER-001', 10);
    persistence.reserveInventory({
      referenceId: 'adjust-invariant', items: [{ productSku: 'HYA-CER-001', quantity: 6 }], now: NOW,
    });
    const movementCount = persistence.db.prepare(
      'SELECT COUNT(*) AS count FROM inventory_movements',
    ).get<{ count: number }>()?.count;
    expect(() => persistence.adjustInventory('HYA-CER-001', -5, 'LOSS', BEFORE_EXPIRY))
      .toThrow('below active reservations');
    expect(persistence.internalInventory('HYA-CER-001', BEFORE_EXPIRY).quantityOnHand).toBe(10);
    expect(persistence.db.prepare(
      'SELECT COUNT(*) AS count FROM inventory_movements',
    ).get<{ count: number }>()?.count).toBe(movementCount);
    persistence.adjustInventory('HYA-CER-001', -4, 'LOSS', BEFORE_EXPIRY);
    expect(persistence.internalInventory('HYA-CER-001', BEFORE_EXPIRY).quantityAvailable).toBe(0);
    persistence.close();
  });

  it('keeps public DTOs free of numeric stock and reservation lifecycle fields', () => {
    const persistence = createDb();
    addStock(persistence, 'HYA-CER-001', 1);
    const dto = persistence.publicCatalogDto('HYA-CER-001');
    expect(dto).toEqual({ sku: 'HYA-CER-001', availability: 'AVAILABLE' });
    expect(JSON.stringify(dto)).not.toMatch(/quantity|stock|reservation|expires|fingerprint/i);
    expect(LEGACY_FINGERPRINT_PREFIX).toBe('legacy-v1:');
    persistence.close();
  });
});

describe('MVP Local 36 legacy reserveBundle compatibility', () => {
  it('accepts only an operationally identical legacy bundle replay', () => {
    const directory = mkdtempSync(join(tmpdir(), 'hielya-legacy-wrapper-'));
    const filename = join(directory, 'legacy.sqlite');
    try {
      const persistence = new MvpPersistenceDatabase(filename);
      persistence.db.exec(readFileSync(join(process.cwd(), '.dev-migrations/0001_mvp_local_36_persistence.sql'), 'utf8'));
      persistence.db.exec(readFileSync(join(process.cwd(), '.dev-migrations/0002_mvp_local_36_catalog_read_model.sql'), 'utf8'));
      persistence.db.prepare(
        "INSERT INTO categories (slug,name_es,sort_order) VALUES ('Legacy','Legacy',1)",
      ).run();
      for (const [sku, kind] of [['LEG-COMP', 'COMPOSITE'], ['LEG-UNIT', 'UNIT']] as const) {
        persistence.db.prepare(`
          INSERT INTO products (sku,category_slug,kind,mvp_status) VALUES (?,'Legacy',?,'PAUSED')
        `).run(sku, kind);
      }
      persistence.db.prepare("INSERT INTO product_bundles (product_sku) VALUES ('LEG-COMP')").run();
      persistence.db.prepare(`
        INSERT INTO product_bundle_components (bundle_sku,component_sku,quantity)
        VALUES ('LEG-COMP','LEG-UNIT',2)
      `).run();
      persistence.db.prepare(`
        INSERT INTO inventory_reservations (reservation_id,reference_id,status,created_at)
        VALUES ('legacy-id','legacy-wrapper','ACTIVE','2030-01-01 12:00:00')
      `).run();
      persistence.db.prepare(`
        INSERT INTO inventory_reservation_items (reservation_id,product_sku,quantity)
        VALUES ('legacy-id','LEG-UNIT',2)
      `).run();
      persistence.migrate();
      expect(persistence.reserveBundle('LEG-COMP', 'legacy-wrapper', NOW)).toBe('legacy-id');
      expect(() => persistence.reserveInventory({
        referenceId: 'legacy-wrapper', items: [{ productSku: 'LEG-COMP', quantity: 1 }], now: NOW,
      })).toThrow('different request fingerprint');
      persistence.close();
    } finally {
      rmSync(directory, { recursive: true, force: true });
    }
  });
});
