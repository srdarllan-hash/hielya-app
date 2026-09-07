import { afterEach, describe, expect, it } from 'vitest';
import { randomUUID } from 'node:crypto';
import { mkdtempSync, rmSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { MvpPersistenceDatabase, SqliteHandoverRepository } from '../../packages/persistence/src';
import { SqliteOrderFoundationRepository } from '../../packages/persistence/src/order-foundation';
import { operationalAvailability, OrderFoundation } from '../../packages/application/src/orders';
import type { CheckoutContext, Stage } from '../../packages/application/src/orders';
import { AtomicDeliveryHandover } from '../../packages/application/src/orders/handover';
import type { AgeRefusal, AtomicHandoverCommand, HandoverPorts, TerminalDelivery } from '../../packages/application/src/orders/handover';
const pepper = 'test-only-handover-pepper-at-least-32-bytes';
const key = 'handover-idempotency-0001';
const dbs: MvpPersistenceDatabase[] = []; const dirs: string[] = [];
afterEach(() => { for (const db of dbs.splice(0)) db.close(); for (const dir of dirs.splice(0)) rmSync(dir, { recursive: true, force: true }); });
function fixture(alcohol = true, file = ':memory:', upper = 60) {
  const db = new MvpPersistenceDatabase(file); dbs.push(db); db.migrate();
  db.seed({ minimumProductSubtotalCents: 2500, deliveryBaseFeeCents: 200, deliveryFeePerKmCents: 60, maximumRoadDistanceKm: 4, maximumPinAttempts: 3, tipsEnabled: true });
  let now = '2026-09-07T18:00:00.000Z';
  const estimate = (maximum = upper) => ({ estimateId: 'e1', source: 'TEST', version: 'v1', calculatedAt: now, validUntil: new Date(Date.parse(now) + 300_000).toISOString(), minimumMinutes: 1, upperBoundMinutes: maximum });
  const product = db.db.prepare("SELECT c.product_sku FROM product_commercial_data c JOIN products p ON p.sku=c.product_sku WHERE c.contains_alcohol=? AND p.kind='UNIT' LIMIT 1").get<{ product_sku: string }>(Number(alcohol))!.product_sku;
  db.adjustInventory(product, 10, 'TEST', now);
  const reservation = db.reserveInventory({ referenceId: 'cart', items: [{ productSku: product, quantity: 1 }], now });
  db.db.prepare('INSERT INTO customers(customer_id,phone_e164,phone_verified_at,created_at,updated_at) VALUES (?,?,?,?,?)').run('customer', '+34600000000', now, now, now);
  const snapshot = operationalAvailability({ now, storeStatus: 'OPEN', demand: { level: 'HIGH', estimate: estimate() }, decisionId: 'decision' }).alcohol.snapshot;
  const checkout: CheckoutContext = { cartId: 'cart', customerId: 'customer', addressId: 'address', cartRevision: 1, reservationId: reservation.reservationId, acceptedSnapshot: snapshot, items: [{ productSku: product, quantity: 1, unitPriceCents: 0, containsAlcohol: false }] };
  const orders = new OrderFoundation({ repository: new SqliteOrderFoundationRepository(db, { load: () => checkout }), now: () => now, id: randomUUID,
    availability: () => ({ storeStatus: 'OPEN', demand: { level: 'HIGH', estimate: estimate() } }), remainingEstimate: () => estimate(1), authorize: () => true });
  let aggregate = orders.create('customer', key, { cartId: 'cart', addressId: 'address', reservationId: reservation.reservationId, expectedCartRevision: 1, acceptedAlcoholDecisionId: 'decision', ageDeclarationsAccepted: true });
  for (const stage of ['PAYMENT_AUTHORIZED','PREPARING','READY','OUT_FOR_DELIVERY','ARRIVED'] as Stage[]) aggregate = orders.advance('courier', aggregate.order.id, key + stage, { expectedRevision: aggregate.order.revision, stage });
  const ports: HandoverPorts = { repository: new SqliteHandoverRepository(db), now: () => now, authorize: (actor, role) => role === 'PIN_ISSUER' ? actor === 'issuer' : actor === 'courier' };
  const handover = new AtomicDeliveryHandover(ports, pepper); const pin = handover.issuePin('issuer', aggregate.delivery.id);
  const command: AtomicHandoverCommand = { expectedRevision: aggregate.delivery.revision, pin, adultDocumentVisuallyVerified: true, recipientPresent: true };
  return { db, orders, aggregate, ports, handover, pin, command, setNow: (value: string) => { now = value; } };
}
function noTerminal(db: MvpPersistenceDatabase) {
  expect(db.db.prepare('SELECT * FROM delivery_terminal_events').all()).toHaveLength(0);
  expect(db.db.prepare('SELECT * FROM alcohol_compensation_intents').all()).toHaveLength(0);
  expect(db.db.prepare('SELECT age_verification_status FROM delivery_foundation').get<{ age_verification_status: string }>()!.age_verification_status).toBe('PENDING');
}
const combinations = Array.from({ length: 8 }, (_, n) => [Boolean(n & 4), Boolean(n & 2), Boolean(n & 1)]);
describe('all three conditions are required together', () => {
  it.each(combinations)('deadline=%s age=%s PIN=%s', (deadline, age, pin) => {
    const f = fixture(); if (!deadline) f.setNow('2026-09-07T20:00:00Z');
    f.command.adultDocumentVisuallyVerified = age;
    if (!pin) f.command.pin = f.pin === '0000' ? '0001' : '0000';
    const action = () => f.handover.handover('courier', f.aggregate.delivery.id, key, f.command);
    if (deadline && age && pin) {
      expect(action().terminal.outcome).toBe('DELIVERED');
      const read = f.orders.findOwned('customer', f.aggregate.order.id)!;
      expect(read.status).toBe('DELIVERED'); expect(read.revision).toBe(7);
      expect(f.db.db.prepare('SELECT age_status FROM delivery_terminal_events').get<{ age_status: string }>()!.age_status).toBe('VERIFIED_18_PLUS');
    } else { expect(action).toThrow(); noTerminal(f.db); }
  });
  it('rechecks the clock after PIN matching, before terminal persistence', () => {
    const f = fixture(); let reads = 0;
    f.ports.now = () => ++reads === 1 ? '2026-09-07T18:30:00Z' : '2026-09-07T20:00:00Z';
    expect(() => f.handover.handover('courier', f.aggregate.delivery.id, key, f.command)).toThrow('DELIVERY_DEADLINE_EXCEEDED'); noTerminal(f.db);
  });
  it('does not retroactively apply new-order cutoff to an accepted feasible delivery', () => {
    const f = fixture(true, ':memory:', 90); f.setNow('2026-09-07T18:45:00Z'); // cutoff18:30Z; promise19:30Z
    expect(f.handover.handover('courier', f.aggregate.delivery.id, key, f.command).terminal.outcome).toBe('DELIVERED');
  });
  it('does not permit a silent extension of the original promise', () => {
    const f = fixture(); f.setNow('2026-09-07T19:00:00.001Z');
    expect(() => f.handover.handover('courier', f.aggregate.delivery.id, key, f.command)).toThrow('DELIVERY_DEADLINE_EXCEEDED'); noTerminal(f.db);
  });
  it.each(['recipientPresent','courierId','verifiedAt','documentNumber','dateOfBirth','documentPhoto','ageVerificationStatus'])('rejects missing presence or spoofed %s', field => {
    const f = fixture(); const command = { ...f.command, [field]: field === 'recipientPresent' ? false : 'spoof' };
    expect(() => f.handover.handover('courier', f.aggregate.delivery.id, key, command as AtomicHandoverCommand)).toThrow('INVALID_REQUEST'); noTerminal(f.db);
  });
  it('does not accept string truthiness as visual age verification', () => {
    const f = fixture(); expect(() => f.handover.handover('courier', f.aggregate.delivery.id, key, { ...f.command, adultDocumentVisuallyVerified: 'true' } as unknown as AtomicHandoverCommand)).toThrow('INVALID_REQUEST');
  });
  it('nonalcohol requires presence and PIN but does not invent an age check', () => {
    const f = fixture(false); f.command.adultDocumentVisuallyVerified = false;
    expect(f.handover.handover('courier', f.aggregate.delivery.id, key, f.command).terminal.ageStatus).toBe('PENDING');
  });
});
describe('PIN, authorization and replay', () => {
  it('legacy PIN success cannot satisfy or reset the Phase3 PIN', () => {
    const f = fixture(); const wrong = f.pin === '0000' ? '0001' : '0000';
    f.db.createDeliveryPin(f.aggregate.order.id, wrong); expect(f.db.verifyDeliveryPin(f.aggregate.order.id, wrong)).toBe(true);
    expect(() => f.handover.handover('courier', f.aggregate.delivery.id, key, { ...f.command, pin: wrong })).toThrow('PIN_INVALID'); noTerminal(f.db);
  });
  it('counts wrong attempts once per command, locks, and cannot reissue or reset', () => {
    const f = fixture(); const wrong = { ...f.command, pin: f.pin === '0000' ? '0001' : '0000' };
    for (let n=0;n<3;n++) {
      expect(() => f.handover.handover('courier', f.aggregate.delivery.id, key+n, wrong)).toThrow(n===2 ? 'PIN_BLOCKED' : 'PIN_INVALID');
      expect(() => f.handover.handover('courier', f.aggregate.delivery.id, key+n, wrong)).toThrow();
    }
    expect(f.db.db.prepare('SELECT attempts FROM handover_pins').get<{ attempts: number }>()!.attempts).toBe(3);
    expect(() => f.handover.handover('courier', f.aggregate.delivery.id, key+'correct', f.command)).toThrow('PIN_BLOCKED');
    expect(() => f.handover.issuePin('issuer', f.aggregate.delivery.id)).toThrow('PIN_ALREADY_ISSUED');
    expect(() => f.db.db.prepare('UPDATE handover_pins SET attempts=0').run()).toThrow('cannot reset'); noTerminal(f.db);
  });
  it('replays success without a second handover, rejects changed payload and revoked actor', () => {
    const f = fixture(); const first = f.handover.handover('courier', f.aggregate.delivery.id, key, f.command);
    f.setNow('2026-09-08T20:00:00Z');
    expect(f.handover.handover('courier', f.aggregate.delivery.id, key, f.command)).toEqual(first);
    expect(() => f.handover.handover('courier', f.aggregate.delivery.id, key, { ...f.command, adultDocumentVisuallyVerified: false })).toThrow('IDEMPOTENCY_CONFLICT');
    expect(() => f.handover.handover('courier', f.aggregate.delivery.id, key+'new', f.command)).toThrow('TERMINAL_DELIVERY');
    f.ports.authorize = () => false;
    expect(() => f.handover.handover('courier', f.aggregate.delivery.id, key, f.command)).toThrow('FORBIDDEN');
    expect(f.db.db.prepare('SELECT * FROM delivery_terminal_events').all()).toHaveLength(1);
    expect(JSON.stringify(first)).not.toContain('pinDigest');
  });
  it('rejects another courier, stale revision and weak pepper', () => {
    const f = fixture();
    expect(() => f.handover.handover('other', f.aggregate.delivery.id, key, f.command)).toThrow('FORBIDDEN');
    expect(() => f.handover.handover('courier', f.aggregate.delivery.id, key, { ...f.command, expectedRevision: 5 })).toThrow('STALE_REVISION');
    expect(() => f.handover.issuePin('courier', f.aggregate.delivery.id)).toThrow('FORBIDDEN');
    expect(() => new AtomicDeliveryHandover(f.ports, 'weak')).toThrow('HANDOVER_PEPPER_REQUIRED'); noTerminal(f.db);
  });
  it('does not store plaintext PIN in receipts', () => {
    const f = fixture(); f.handover.handover('courier', f.aggregate.delivery.id, key, f.command);
    const row = f.db.db.prepare('SELECT fingerprint,result_json FROM handover_command_receipts').get<{ fingerprint: string; result_json: string }>()!;
    expect(row.fingerprint).toMatch(/^[a-f0-9]{64}$/); expect(row.result_json).not.toContain('"pin"'); expect(row.result_json).not.toContain('pinDigest');
  });
});
describe('terminal refusal and atomic persistence', () => {
  it.each(['REFUSED_NO_ID','REFUSED_MINOR','REFUSED_DOUBTFUL_ID'] as AgeRefusal[])('records %s once and forbids every reopening path', status => {
    const f = fixture(); const command = { expectedRevision: 6, status };
    const result = f.handover.refuse('courier', f.aggregate.delivery.id, key, command);
    expect(result.terminal.ageStatus).toBe(status); expect(result.terminal.ageMethod).toBe(status === 'REFUSED_NO_ID' ? null : 'IN_PERSON_DOCUMENT_VISUAL_CHECK');
    expect(result.compensationIntent).toBe('PENDING_FULL_COMPENSATION');
    expect(f.handover.refuse('courier', f.aggregate.delivery.id, key, command)).toEqual(result);
    expect(f.orders.findOwned('customer', f.aggregate.order.id)!.status).toBe('DELIVERY_FAILED');
    expect(() => f.handover.handover('courier', f.aggregate.delivery.id, key, f.command)).toThrow('TERMINAL_DELIVERY');
    expect(() => f.handover.refuse('courier', f.aggregate.delivery.id, key+'new', command)).toThrow('TERMINAL_DELIVERY');
    expect(() => f.orders.advance('courier', f.aggregate.order.id, key+'advance', { expectedRevision: 7, stage: 'ARRIVED' })).toThrow('TERMINAL_DELIVERY');
    expect(() => f.handover.issuePin('issuer', f.aggregate.delivery.id)).toThrow('TERMINAL_DELIVERY');
    expect(() => f.db.db.prepare('DELETE FROM delivery_terminal_events').run()).toThrow('cannot reopen');
    expect(() => f.db.db.prepare("UPDATE delivery_foundation SET status='ASSIGNED'").run()).toThrow('cannot reopen');
    expect(f.db.db.prepare('SELECT * FROM alcohol_compensation_intents').all()).toHaveLength(1);
  });
  it.each(['VERIFIED_18_PLUS','APPROVED','PENDING'])('isolated age-check cannot approve %s', status => {
    const f = fixture(); expect(() => f.handover.refuse('courier', f.aggregate.delivery.id, key, { expectedRevision: 6, status } as { expectedRevision: number; status: AgeRefusal })).toThrow('INVALID_REQUEST'); noTerminal(f.db);
  });
  it.each(['HANDOVER','REFUSAL'])('rolls back %s event and compensation if receipt insertion fails', mode => {
    const f = fixture(); f.db.db.exec("CREATE TRIGGER test_fault BEFORE INSERT ON handover_command_receipts BEGIN SELECT RAISE(ABORT,'injected fault'); END");
    const action = () => mode === 'HANDOVER' ? f.handover.handover('courier', f.aggregate.delivery.id, key, f.command) : f.handover.refuse('courier', f.aggregate.delivery.id, key, { expectedRevision: 6, status: 'REFUSED_MINOR' });
    expect(action).toThrow('injected fault'); noTerminal(f.db); expect(f.orders.findOwned('customer', f.aggregate.order.id)!.revision).toBe(6);
  });
  it.each(['age','pin','deadline','presence'])('database independently rejects incomplete %s evidence', missing => {
    const f = fixture();
    const digest = f.db.db.prepare('SELECT digest FROM handover_pins').get<{ digest: string }>()!.digest;
    const record: TerminalDelivery = { deliveryId: f.aggregate.delivery.id, orderId: f.aggregate.order.id, revision: 7, outcome: 'DELIVERED', recordedAt: '2026-09-07T18:00:00Z', courierId: 'courier', ageStatus: 'VERIFIED_18_PLUS', ageMethod: 'IN_PERSON_DOCUMENT_VISUAL_CHECK', pinDigest: digest, recipientPresent: true };
    if (missing === 'age') { record.ageStatus = 'PENDING'; record.ageMethod = null; }
    if (missing === 'pin') record.pinDigest = '0'.repeat(64);
    if (missing === 'deadline') record.recordedAt = '2026-09-07T20:00:00Z';
    if (missing === 'presence') record.recipientPresent = false;
    expect(() => new SqliteHandoverRepository(f.db).transaction(tx => tx.complete(record))).toThrow(); noTerminal(f.db);
  });
  it('database rejects a refusal with missing visual-check method', () => {
    const f = fixture();
    const record: TerminalDelivery = { deliveryId: f.aggregate.delivery.id, orderId: f.aggregate.order.id, revision: 7, outcome: 'REFUSED_MINOR', recordedAt: '2026-09-07T18:00:00Z', courierId: 'courier', ageStatus: 'REFUSED_MINOR', ageMethod: null, pinDigest: null, recipientPresent: false };
    expect(() => new SqliteHandoverRepository(f.db).transaction(tx => tx.complete(record))).toThrow(); noTerminal(f.db);
  });
  it('blocks INSERT OR REPLACE and parent deletion, not only ordinary updates', () => {
    const f = fixture();
    expect(() => f.db.db.exec('INSERT OR REPLACE INTO handover_pins SELECT delivery_id,digest,0,maximum FROM handover_pins')).toThrow('cannot replace');
    f.handover.refuse('courier', f.aggregate.delivery.id, key, { expectedRevision: 6, status: 'REFUSED_MINOR' });
    expect(() => f.db.db.exec('INSERT OR REPLACE INTO delivery_terminal_events SELECT * FROM delivery_terminal_events')).toThrow('cannot replace');
    expect(() => f.db.db.exec('DELETE FROM order_foundation')).toThrow('cannot delete');
    expect(() => f.db.db.exec('DELETE FROM delivery_foundation')).toThrow('cannot delete');
    expect(f.orders.findOwned('customer', f.aggregate.order.id)!.status).toBe('DELIVERY_FAILED');
  });
  it('serializes competing handover/refusal with a real SQLite write lock', () => {
    const dir = mkdtempSync(join(tmpdir(), 'hielya-p3-lock-')); dirs.push(dir); const file = join(dir, 'test.sqlite'); const f = fixture(true, file);
    const otherDb = new MvpPersistenceDatabase(file); dbs.push(otherDb); otherDb.migrate();
    const other = new AtomicDeliveryHandover({ ...f.ports, repository: new SqliteHandoverRepository(otherDb) }, pepper);
    f.db.db.exec('BEGIN IMMEDIATE');
    try {
      expect(() => other.refuse('courier', f.aggregate.delivery.id, key, { expectedRevision: 6, status: 'REFUSED_NO_ID' })).toThrow(/locked|busy/i);
      expect(otherDb.db.prepare('SELECT * FROM delivery_terminal_events').all()).toHaveLength(0);
    } finally { f.db.db.exec('ROLLBACK'); }
    f.handover.handover('courier', f.aggregate.delivery.id, key, f.command);
    expect(() => other.refuse('courier', f.aggregate.delivery.id, key, { expectedRevision: 6, status: 'REFUSED_NO_ID' })).toThrow('TERMINAL_DELIVERY');
    expect(otherDb.db.prepare('SELECT * FROM delivery_terminal_events').all()).toHaveLength(1);
  });
  it.each(['DELIVERED','REFUSED'])('another connection observes durable %s and cannot take the opposite outcome', outcome => {
    const dir = mkdtempSync(join(tmpdir(), 'hielya-p3-')); dirs.push(dir); const file = join(dir, 'test.sqlite'); const f = fixture(true, file);
    const otherDb = new MvpPersistenceDatabase(file); dbs.push(otherDb); otherDb.migrate();
    const other = new AtomicDeliveryHandover({ ...f.ports, repository: new SqliteHandoverRepository(otherDb) }, pepper);
    const deliver = (service: AtomicDeliveryHandover) => service.handover('courier', f.aggregate.delivery.id, key, f.command);
    const refuse = (service: AtomicDeliveryHandover) => service.refuse('courier', f.aggregate.delivery.id, key, { expectedRevision: 6, status: 'REFUSED_NO_ID' });
    if (outcome === 'DELIVERED') { deliver(f.handover); expect(() => refuse(other)).toThrow('TERMINAL_DELIVERY'); }
    else { refuse(other); expect(() => deliver(f.handover)).toThrow('TERMINAL_DELIVERY'); }
    expect(otherDb.db.prepare('SELECT * FROM delivery_terminal_events').all()).toHaveLength(1);
    expect(otherDb.db.prepare('PRAGMA foreign_key_check').all()).toEqual([]);
  });
});
