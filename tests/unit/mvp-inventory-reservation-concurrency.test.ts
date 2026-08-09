import { mkdtempSync, rmSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';

import { afterEach, describe, expect, it } from 'vitest';
import { MvpPersistenceDatabase } from '../../packages/persistence/src/index';

const NOW = '2030-01-01T12:00:00.000Z';
const BEFORE_EXPIRY = '2030-01-01T12:09:59.999Z';
const AT_EXPIRY = '2030-01-01T12:10:00.000Z';
const settings = {
  minimumProductSubtotalCents: 2500,
  deliveryBaseFeeCents: 200,
  deliveryFeePerKmCents: 60,
  maximumRoadDistanceKm: 4,
  maximumPinAttempts: 3,
  tipsEnabled: true,
};

const directories: string[] = [];
const connections = () => {
  const directory = mkdtempSync(join(tmpdir(), 'hielya-reservation-concurrency-'));
  directories.push(directory);
  const filename = join(directory, 'inventory.sqlite');
  const first = new MvpPersistenceDatabase(filename);
  first.migrate();
  first.seed(settings);
  const second = new MvpPersistenceDatabase(filename);
  second.migrate();
  return { first, second };
};

afterEach(() => {
  for (const directory of directories.splice(0)) {
    rmSync(directory, { recursive: true, force: true });
  }
});

describe('MVP Local 36 multi-connection inventory reservation concurrency', () => {
  it('exercises SQLite write locking and permits only one reservation for the last item', () => {
    const { first, second } = connections();
    first.adjustInventory('HYA-CER-001', 1, 'STOCK', NOW);
    first.db.exec('BEGIN IMMEDIATE');
    try {
      expect(() => second.reserveInventory({
        referenceId: 'locked', items: [{ productSku: 'HYA-CER-001', quantity: 1 }], now: NOW,
      })).toThrow(/locked|busy/i);
    } finally {
      first.db.exec('ROLLBACK');
    }

    const winner = first.reserveInventory({
      referenceId: 'winner', items: [{ productSku: 'HYA-CER-001', quantity: 1 }], now: NOW,
    });
    expect(winner.status).toBe('ACTIVE');
    expect(() => second.reserveInventory({
      referenceId: 'loser', items: [{ productSku: 'HYA-CER-001', quantity: 1 }], now: NOW,
    })).toThrow('component unavailable');
    expect(second.internalInventory('HYA-CER-001', NOW).quantityAvailable).toBe(0);
    expect(second.db.prepare('SELECT COUNT(*) AS count FROM inventory_reservations')
      .get<{ count: number }>()?.count).toBe(1);
    first.close();
    second.close();
  });

  it('serializes same-reference replay and rejects a different concurrent fingerprint', () => {
    const { first, second } = connections();
    first.adjustInventory('HYA-CER-001', 5, 'STOCK', NOW);
    const created = first.reserveInventory({
      referenceId: 'shared-reference', items: [{ productSku: 'HYA-CER-001', quantity: 2 }], now: NOW,
    });
    expect(second.reserveInventory({
      referenceId: 'shared-reference', items: [{ productSku: 'HYA-CER-001', quantity: 2 }], now: NOW,
    }).reservationId).toBe(created.reservationId);
    expect(() => second.reserveInventory({
      referenceId: 'shared-reference', items: [{ productSku: 'HYA-CER-001', quantity: 3 }], now: NOW,
    })).toThrow('different request fingerprint');
    expect(second.db.prepare('SELECT COUNT(*) AS count FROM inventory_reservations')
      .get<{ count: number }>()?.count).toBe(1);
    first.close();
    second.close();
  });

  it('prevents an adjustment racing below an active reservation', () => {
    const { first, second } = connections();
    first.adjustInventory('HYA-CER-001', 10, 'STOCK', NOW);
    first.reserveInventory({
      referenceId: 'reserve-six', items: [{ productSku: 'HYA-CER-001', quantity: 6 }], now: NOW,
    });
    expect(() => second.adjustInventory('HYA-CER-001', -5, 'LOSS', BEFORE_EXPIRY))
      .toThrow('below active reservations');
    expect(first.internalInventory('HYA-CER-001', BEFORE_EXPIRY)).toEqual({
      sku: 'HYA-CER-001', quantityOnHand: 10, quantityReserved: 6, quantityAvailable: 4,
    });
    first.close();
    second.close();
  });

  it('makes convert versus release and double conversion terminal and idempotent', () => {
    const { first, second } = connections();
    first.adjustInventory('HYA-CER-001', 6, 'STOCK', NOW);
    const convertedFirst = first.reserveInventory({
      referenceId: 'convert-first', items: [{ productSku: 'HYA-CER-001', quantity: 2 }], now: NOW,
    });
    expect(first.convertReservation(convertedFirst.reservationId, BEFORE_EXPIRY).status)
      .toBe('CONVERTED');
    expect(second.releaseReservation(convertedFirst.reservationId, 'MANUAL', BEFORE_EXPIRY).status)
      .toBe('CONVERTED');
    expect(second.convertReservation(convertedFirst.reservationId, BEFORE_EXPIRY).status)
      .toBe('CONVERTED');
    expect(first.db.prepare(
      'SELECT COUNT(*) AS count FROM inventory_movements WHERE reservation_id=?',
    ).get<{ count: number }>(convertedFirst.reservationId)?.count).toBe(1);

    const releasedFirst = first.reserveInventory({
      referenceId: 'release-first', items: [{ productSku: 'HYA-CER-001', quantity: 1 }], now: NOW,
    });
    expect(second.releaseReservation(releasedFirst.reservationId, 'MANUAL', BEFORE_EXPIRY).status)
      .toBe('RELEASED');
    expect(first.convertReservation(releasedFirst.reservationId, BEFORE_EXPIRY).status)
      .toBe('RELEASED');
    expect(first.db.prepare(
      'SELECT COUNT(*) AS count FROM inventory_movements WHERE reservation_id=?',
    ).get<{ count: number }>(releasedFirst.reservationId)?.count).toBe(0);
    first.close();
    second.close();
  });

  it('makes expiration win over conversion at the exact TTL without partial consumption', () => {
    const { first, second } = connections();
    first.adjustInventory('HYA-CER-001', 3, 'STOCK', NOW);
    const reservation = first.reserveInventory({
      referenceId: 'expire-vs-convert', items: [{ productSku: 'HYA-CER-001', quantity: 3 }], now: NOW,
    });
    expect(second.expireDueReservations(AT_EXPIRY)).toEqual([
      expect.objectContaining({ reservationId: reservation.reservationId, releaseReason: 'EXPIRED' }),
    ]);
    expect(first.convertReservation(reservation.reservationId, AT_EXPIRY))
      .toMatchObject({ status: 'RELEASED', releaseReason: 'EXPIRED' });
    expect(first.internalInventory('HYA-CER-001', AT_EXPIRY).quantityOnHand).toBe(3);
    expect(first.db.prepare(
      'SELECT COUNT(*) AS count FROM inventory_movements WHERE reservation_id=?',
    ).get<{ count: number }>(reservation.reservationId)?.count).toBe(0);
    first.close();
    second.close();
  });
});
