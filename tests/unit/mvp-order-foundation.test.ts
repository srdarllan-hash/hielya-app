import { afterEach, describe, expect, it } from 'vitest';
import { randomUUID } from 'node:crypto';
import { MvpPersistenceDatabase } from '../../packages/persistence/src';
import { SqliteOrderFoundationRepository } from '../../packages/persistence/src/order-foundation';
import { operationalAvailability, OrderFoundation } from '../../packages/application/src/orders';
import type { CheckoutContext, FoundationPorts, SlaEstimate, Stage } from '../../packages/application/src/orders';
const databases: MvpPersistenceDatabase[] = [];
afterEach(() => { for (const db of databases.splice(0)) db.close(); });
const estimate = (now = '2026-09-07T18:00:00.000Z', upper = 60): SlaEstimate => ({ estimateId: 'e1', source: 'TEST', version: 'v1', calculatedAt: now, validUntil: new Date(Date.parse(now) + 300_000).toISOString(), minimumMinutes: Math.min(30, upper), upperBoundMinutes: upper });
const availability = (now: string, upper = 60) => operationalAvailability({ now, storeStatus: 'OPEN', demand: { level: 'HIGH', estimate: estimate(now, upper) }, decisionId: 'decision1' });
function setup(alcohol = true) {
  const db = new MvpPersistenceDatabase(); databases.push(db); db.migrate();
  db.seed({ minimumProductSubtotalCents: 2500, deliveryBaseFeeCents: 200, deliveryFeePerKmCents: 60, maximumRoadDistanceKm: 4, maximumPinAttempts: 3, tipsEnabled: true });
  let now = '2026-09-07T18:00:00.000Z';
  const sku = db.db.prepare('SELECT c.product_sku FROM product_commercial_data c JOIN products p ON p.sku=c.product_sku WHERE c.contains_alcohol=? AND p.kind=\'UNIT\' LIMIT 1').get<{ product_sku: string }>(Number(alcohol))!.product_sku;
  db.adjustInventory(sku, 10, 'TEST', now);
  const reservation = db.reserveInventory({ referenceId: 'cart1', items: [{ productSku: sku, quantity: 1 }], now });
  db.db.prepare('INSERT INTO customers (customer_id,phone_e164,phone_verified_at,created_at,updated_at) VALUES (?,?,?,?,?)').run('customer1', '+34600000000', now, now, now);
  const context: CheckoutContext = { customerId: 'customer1', cartId: 'cart1', addressId: 'address1', cartRevision: 1, reservationId: reservation.reservationId,
    items: [{ productSku: sku, quantity: 1, unitPriceCents: 0, containsAlcohol: false }], acceptedSnapshot: availability(now).alcohol.snapshot };
  let authorized = true; let currentEstimate = estimate(now);
  let remaining = 5;
  const ports: FoundationPorts = { repository: new SqliteOrderFoundationRepository(db, { load: () => context }), now: () => now, id: randomUUID,
    availability: () => ({ storeStatus: 'OPEN', demand: { level: 'HIGH', estimate: currentEstimate } }),
    remainingEstimate: () => estimate(now, remaining), authorize: () => authorized };
  const service = new OrderFoundation(ports);
  const command = { cartId: 'cart1', reservationId: reservation.reservationId, addressId: 'address1', expectedCartRevision: 1, acceptedAlcoholDecisionId: 'decision1', ageDeclarationsAccepted: true };
  return { db, service, context, command, ports, sku, setNow: (value: string) => { now = value; }, setEstimate: (e: SlaEstimate) => { currentEstimate = e; }, setRemaining: (v: number) => { remaining = v; }, revoke: () => { authorized = false; } };
}
const key = 'idempotency-key-0001';
describe('dynamic availability', () => {
  it.each([[30,'19:15'],[45,'19:15'],[60,'19:00'],[90,'18:30']])('upper %s has UTC summer cutoff %s', (upper, cutoff) => {
    expect(availability('2026-09-07T18:00:00Z', upper as number).alcohol.snapshot!.alcoholOrderCutoffAt).toBe(`2026-09-07T${cutoff}:00.000Z`);
  });
  it.each(['2026-03-29','2026-10-25','2026-12-07'])('uses Madrid offset on %s', day => {
    const deadline = availability(`${day}T12:00:00Z`).alcohol.snapshot!.alcoholHandoverDeadlineAt;
    expect(new Intl.DateTimeFormat('en-GB', { timeZone: 'Europe/Madrid', hour: '2-digit', minute: '2-digit', hourCycle: 'h23' }).format(new Date(deadline))).toBe('22:00');
  });
  it('allows HIGH and UNAVAILABLE simultaneously at exact cutoff', () => {
    const result = availability('2026-09-07T19:00:00Z');
    expect(result.storeStatus).toBe('OPEN'); expect(result.demand.level).toBe('HIGH'); expect(result.alcohol.reason).toBe('CUTOFF_REACHED');
    expect(availability('2026-09-07T18:59:59.999Z').alcohol.status).toBe('AVAILABLE');
  });
  it.each(['2026-09-07T07:59:59Z','2026-09-07T20:00:00Z'])('does not open outside 10–22: %s', now => { expect(availability(now).storeStatus).toBe('CLOSED'); });
  it.each(['expired','future','negative','range','unknown'])('fails closed for %s SLA', mode => {
    const now = '2026-09-07T18:00:00Z'; const e = estimate(now);
    if (mode === 'expired') e.validUntil = now;
    if (mode === 'future') e.calculatedAt = '2026-09-07T18:01:00Z';
    if (mode === 'negative') e.upperBoundMinutes = -1;
    if (mode === 'range') e.minimumMinutes = 61;
    const result = operationalAvailability({ now, storeStatus: 'OPEN', demand: { level: mode === 'unknown' ? 'UNKNOWN' : 'HIGH', estimate: e }, decisionId: 'd' });
    expect(result.alcohol.reason).toBe('SLA_UNAVAILABLE'); expect(result.alcohol.snapshot).toBeNull();
  });
});
describe('transactional foundation', () => {
  it('derives alcohol/price from catalog, persists immutable promise and pending delivery', () => {
    const f = setup(); const result = f.service.create('customer1', key, f.command);
    expect(result.order.requiresAgeVerification).toBe(true); expect(result.order.checkout.items[0].unitPriceCents).toBeGreaterThan(0);
    expect(result.order.promisedLatestHandoverAt).toBe('2026-09-07T19:00:00.000Z'); expect(result.delivery.ageVerificationStatus).toBe('PENDING');
    expect(f.service.findOwned('customer1', result.order.id)).toEqual(result.order);
    expect(f.service.findOwned('another', result.order.id)).toBeUndefined();
    expect(() => f.db.db.prepare("UPDATE order_foundation SET promise_at='later'").run()).toThrow('immutable');
    expect(f.db.findReservationById(f.command.reservationId)!.status).toBe('ACTIVE');
  });
  it('nonalcohol remains age-free even with missing SLA', () => {
    const f = setup(false); f.setEstimate({ ...estimate(), validUntil: '2020-01-01T00:00:00Z' });
    const result = f.service.create('customer1', key, { ...f.command, acceptedAlcoholDecisionId: null, ageDeclarationsAccepted: false });
    expect(result.order.alcoholSnapshot).toBeNull(); expect(result.order.requiresAgeVerification).toBe(false);
  });
  it('replays exactly once and rejects different payload or a second order for same cart', () => {
    const f = setup(); const a = f.service.create('customer1', key, f.command);
    expect(f.service.create('customer1', key, f.command)).toEqual(a);
    expect(() => f.service.create('customer1', key, { ...f.command, addressId: 'other' })).toThrow('IDEMPOTENCY_CONFLICT');
    expect(() => f.service.create('customer1', key + 'new', f.command)).toThrow('ORDER_ALREADY_EXISTS');
    expect(f.db.db.prepare('SELECT * FROM order_foundation').all()).toHaveLength(1);
  });
  it.each(['owner','revision','reservation','age','changed-sla','decision','expiry'])('rejects %s without partial writes', mode => {
    const f = setup();
    if (mode === 'owner') f.context.customerId = 'other';
    if (mode === 'revision') f.context.cartRevision = 2;
    if (mode === 'reservation') f.context.items[0].quantity = 2;
    if (mode === 'age') f.command.ageDeclarationsAccepted = false;
    if (mode === 'changed-sla') f.setEstimate(estimate(undefined, 90));
    if (mode === 'decision') f.command.acceptedAlcoholDecisionId = 'wrong';
    if (mode === 'expiry') f.setNow('2026-09-07T18:10:00Z');
    expect(() => f.service.create('customer1', key, f.command)).toThrow();
    for (const table of ['order_foundation','delivery_foundation','order_command_receipts']) expect(f.db.db.prepare(`SELECT * FROM ${table}`).all()).toHaveLength(0);
  });
  it('advances only ordered stages, consumes stock once, stops at ARRIVED with age PENDING', () => {
    const f = setup(); let result = f.service.create('customer1', key, f.command);
    expect(() => f.service.advance('actor', result.order.id, key, { expectedRevision: 1, stage: 'READY' })).toThrow('INVALID_TRANSITION');
    for (const stage of ['PAYMENT_AUTHORIZED','PREPARING','READY','OUT_FOR_DELIVERY','ARRIVED'] as Stage[]) {
      const command = { expectedRevision: result.order.revision, stage };
      result = f.service.advance('actor', result.order.id, key + stage, command);
      expect(f.service.advance('actor', result.order.id, key + stage, command)).toEqual(result);
    }
    expect(result.delivery.status).toBe('ARRIVED'); expect(result.delivery.ageVerificationStatus).toBe('PENDING');
    expect(f.db.findReservationById(f.command.reservationId)!.status).toBe('CONVERTED');
    expect(() => f.service.advance('actor', result.order.id, key + 'again', { expectedRevision: 6, stage: 'ARRIVED' })).toThrow('INVALID_TRANSITION');
  });
  it('rejects stale revision, revoked role (also on replay) and a different courier', () => {
    const f = setup(); const created = f.service.create('customer1', key, f.command);
    const orderId = created.order.id;
    expect(() => f.service.advance('actor', orderId, key, { expectedRevision: 2, stage: 'PAYMENT_AUTHORIZED' })).toThrow('STALE_REVISION');
    const command = { expectedRevision: 1, stage: 'PAYMENT_AUTHORIZED' as const };
    f.service.advance('actor', orderId, key, command); f.revoke();
    expect(() => f.service.advance('actor', orderId, key, command)).toThrow('FORBIDDEN');
  });
  it('uses remaining time, preserving original promise and allowing progress after new-order cutoff', () => {
    const f = setup(); f.setEstimate(estimate('2026-09-07T18:00:00Z', 90)); f.context.acceptedSnapshot = availability('2026-09-07T18:00:00Z', 90).alcohol.snapshot;
    let result = f.service.create('customer1', key, f.command);
    result = f.service.advance('actor', result.order.id, key, { expectedRevision: 1, stage: 'PAYMENT_AUTHORIZED' });
    f.setNow('2026-09-07T18:40:00Z');
    const next = f.service.advance('actor', result.order.id, key + 'prepare', { expectedRevision: 2, stage: 'PREPARING' });
    expect(next.order.promisedLatestHandoverAt).toBe(result.order.promisedLatestHandoverAt);
    f.setRemaining(60);
    expect(() => f.service.advance('actor', result.order.id, key + 'ready', { expectedRevision: 3, stage: 'READY' })).toThrow('DELIVERY_DEADLINE_EXCEEDED');
  });
  it('rolls back nested inventory conversion when the outer command fails', () => {
    const f = setup(); const result = f.service.create('customer1', key, f.command);
    f.db.db.exec("CREATE TRIGGER force_failure BEFORE INSERT ON order_command_receipts BEGIN SELECT RAISE(ABORT,'test rollback'); END");
    expect(() => f.service.advance('actor', result.order.id, key, { expectedRevision: 1, stage: 'PAYMENT_AUTHORIZED' })).toThrow('test rollback');
    expect(f.db.findReservationById(f.command.reservationId)!.status).toBe('ACTIVE');
    expect(f.service.findOwned('customer1', result.order.id)!.revision).toBe(1);
    expect(f.db.db.prepare("SELECT * FROM inventory_movements WHERE reason='RESERVATION_CONVERTED'").all()).toHaveLength(0);
  });
  it('derives alcohol from bundle components and matches expanded reserved stock', () => {
    const f = setup();
    const bundle = f.db.db.prepare('SELECT bundle_sku FROM product_bundle_components LIMIT 1').get<{ bundle_sku: string }>()!.bundle_sku;
    const components = f.db.db.prepare('SELECT component_sku,quantity FROM product_bundle_components WHERE bundle_sku=?').all<{ component_sku: string; quantity: number }>(bundle);
    for (const c of components) f.db.adjustInventory(c.component_sku, 20, 'TEST', '2026-09-07T18:00:00Z');
    const reservation = f.db.reserveInventory({ referenceId: 'bundle-cart', items: [{ productSku: bundle, quantity: 1 }], now: '2026-09-07T18:00:00Z' });
    f.context.reservationId = reservation.reservationId; f.command.reservationId = reservation.reservationId;
    f.context.items = [{ productSku: bundle, quantity: 1, containsAlcohol: false, unitPriceCents: 0 }];
    const expected = f.db.db.prepare('SELECT contains_alcohol FROM product_commercial_data WHERE product_sku=?').get<{ contains_alcohol: number }>(bundle)!.contains_alcohol === 1 || components.some(c => f.db.db.prepare('SELECT contains_alcohol FROM product_commercial_data WHERE product_sku=?').get<{ contains_alcohol: number }>(c.component_sku)!.contains_alcohol === 1);
    expect(f.service.create('customer1', key, f.command).order.containsAlcohol).toBe(expected);
  });
  it('does not accept a payment event after inventory reservation expires', () => {
    const f = setup(); const created = f.service.create('customer1', key, f.command);
    f.setNow('2026-09-07T18:10:00Z');
    expect(() => f.service.advance('actor', created.order.id, key, { expectedRevision: 1, stage: 'PAYMENT_AUTHORIZED' })).toThrow('RESERVATION_UNAVAILABLE');
    expect(f.service.findOwned('customer1', created.order.id)!.status).toBe('AWAITING_PAYMENT');
  });
  it('refuses a second courier and rejects stale remaining estimates', () => {
    const f = setup(); let result = f.service.create('customer1', key, f.command);
    for (const stage of ['PAYMENT_AUTHORIZED','PREPARING','READY','OUT_FOR_DELIVERY'] as Stage[]) result = f.service.advance('actor', result.order.id, key + stage, { expectedRevision: result.order.revision, stage });
    expect(() => f.service.advance('another', result.order.id, key, { expectedRevision: 5, stage: 'ARRIVED' })).toThrow('FORBIDDEN');
    f.ports.remainingEstimate = () => null;
    expect(() => f.service.advance('actor', result.order.id, key, { expectedRevision: 5, stage: 'ARRIVED' })).toThrow('SLA_UNAVAILABLE');
  });
  it('migration repeats without data loss; database rejects age approval and final delivery', () => {
    const f = setup(); f.service.create('customer1', key, f.command); f.db.migrate();
    expect(f.db.db.prepare('PRAGMA foreign_key_check').all()).toEqual([]);
    expect(() => f.db.db.prepare("UPDATE delivery_foundation SET age_verification_status='VERIFIED_18_PLUS'").run()).toThrow();
    expect(() => f.db.db.prepare("UPDATE delivery_foundation SET status='DELIVERED'").run()).toThrow();
  });
});
