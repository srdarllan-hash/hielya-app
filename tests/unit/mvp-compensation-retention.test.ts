import { afterEach, describe, expect, it } from 'vitest';
import { randomUUID } from 'node:crypto';
import { MvpPersistenceDatabase, SqliteHandoverRepository, SqliteCompensationRepository, SqliteRetentionRepository } from '../../packages/persistence/src';
import { SqliteOrderFoundationRepository } from '../../packages/persistence/src/order-foundation';
import { operationalAvailability, OrderFoundation } from '../../packages/application/src/orders';
import type { CheckoutContext, Stage } from '../../packages/application/src/orders';
import { AtomicDeliveryHandover } from '../../packages/application/src/orders/handover';
import type { AtomicHandoverCommand, HandoverPorts } from '../../packages/application/src/orders/handover';
import { AutomaticCompensation, fullCompensationPlan, UnconfiguredPaymentCompensationPort } from '../../packages/application/src/orders/compensation';
import type { PaymentCompensationPort, PaymentPosition } from '../../packages/application/src/orders/compensation';
import { retentionDecision, OrderDossierRetention } from '../../packages/application/src/orders/retention';
import type { AccountingRetentionAnchor } from '../../packages/application/src/orders/retention';
const pepper = 'test-only-handover-pepper-at-least-32-bytes';
const key = 'handover-idempotency-0001';
const dbs: MvpPersistenceDatabase[] = [];
afterEach(() => { for (const db of dbs.splice(0)) db.close(); });
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
const payment: PaymentPosition = { paymentReference: 'payment1', currency: 'EUR', capturedCents: 5600, refundedCents: 0, authorizationRemainingCents: 0 };
function refused(status: 'REFUSED_NO_ID' | 'REFUSED_MINOR' | 'REFUSED_DOUBTFUL_ID' = 'REFUSED_MINOR') {
  const f = fixture(); f.handover.refuse('courier', f.aggregate.delivery.id, key, { expectedRevision: 6, status });
  const repository = new SqliteCompensationRepository(f.db); let now = '2026-09-07T18:00:00.000Z';
  let inspections=0; const calls: string[] = []; const effects = new Map<string, { status: 'CONFIRMED'; refundCents: number; voidCents: number; operationReference: string }>();
  const provider: PaymentCompensationPort = { configured: true, inspect: async () => { inspections++; return { ...payment }; }, compensate: async (plan, id) => { calls.push(id); let result = effects.get(id); if (!result) { result = { status: 'CONFIRMED', refundCents: plan.refundCents, voidCents: plan.voidCents, operationReference: 'op1' }; effects.set(id,result); } return result; } };
  const clock = () => now; const service = new AutomaticCompensation(repository, provider, clock);
  return { ...f, repository, provider, service, calls, effects, inspections: () => inspections, clock, tick: (value = '2026-09-07T18:01:01.000Z') => { now=value; } };
}
describe('full compensation policy', () => {
  it.each([[5600,0,0,'REFUND_CAPTURE',5600,0],[0,0,5600,'VOID_AUTHORIZATION',0,5600],[2000,0,3600,'REFUND_AND_VOID',2000,3600],[5600,1000,0,'REFUND_CAPTURE',4600,0],[0,0,0,'NO_PAYMENT',0,0],[5600,5600,0,'NO_PAYMENT',0,0]])('plans captured%s refunded%s authorized%s', (captured, refunded, auth, mode, refund, cancel) => {
    const plan = fullCompensationPlan('order', { ...payment, capturedCents: captured as number, refundedCents: refunded as number, authorizationRemainingCents: auth as number });
    expect(plan.mode).toBe(mode); expect(plan.refundCents).toBe(refund); expect(plan.voidCents).toBe(cancel); expect(plan.policy).toBe('FULL_NO_CUSTOMER_COST');
  });
  it.each([-1,1.5,Number.MAX_SAFE_INTEGER+1])('rejects invalid monetary input %s', amount => { expect(() => fullCompensationPlan('o', { ...payment, capturedCents: amount })).toThrow('INVALID_PAYMENT_POSITION'); });
  it('rejects refund above captured amount or another currency', () => {
    expect(() => fullCompensationPlan('o', { ...payment, refundedCents: 5601 })).toThrow();
    expect(() => fullCompensationPlan('o', { ...payment, currency: 'USD' } as unknown as PaymentPosition)).toThrow();
  });
  it.each(['REFUSED_NO_ID','REFUSED_MINOR','REFUSED_DOUBTFUL_ID'] as const)('automatically discovers and compensates %s without per-refund approval', async status => {
    const f = refused(status); const result = await f.service.runPending();
    expect(result).toHaveLength(1); expect(result[0].state).toBe('COMPLETED'); expect(result[0].plan!.refundCents).toBe(5600); // all captured charges, not product-only subtotal
    expect(await f.service.runPending()).toEqual([]); await f.service.process(f.aggregate.order.id); expect(f.effects.size).toBe(1); expect(f.calls).toHaveLength(1);
  });
  it('unconfigured default never fabricates a successful refund or zero payment position', async () => {
    const f = refused(); const service = new AutomaticCompensation(f.repository, undefined, f.clock);
    const [result] = await service.runPending(); expect(result.state).toBe('WAITING_PROVIDER'); expect(result.plan).toBeNull(); expect(result.completedAt).toBeNull();
    expect(result.failureCode).toBe('PAYMENT_PROVIDER_NOT_CONFIGURED'); expect(f.calls).toHaveLength(0);
    await expect(new UnconfiguredPaymentCompensationPort().inspect()).rejects.toThrow('NOT_CONFIGURED');
  });
  it('does not create jobs for delivered orders or arbitrary references', async () => {
    const f = fixture(); f.handover.handover('courier',f.aggregate.delivery.id,key,f.command);
    const repo = new SqliteCompensationRepository(f.db); const service = new AutomaticCompensation(repo);
    expect(await service.runPending()).toEqual([]); expect(await service.process(f.aggregate.order.id)).toBeUndefined(); expect(await service.process('fake')).toBeUndefined();
  });
  it('keeps provider acceptance PENDING and rejects mismatched confirmation', async () => {
    const f = refused(); f.provider.compensate = async () => ({ status: 'PENDING', refundCents: 0, voidCents: 0, operationReference: 'accepted' });
    expect((await f.service.process(f.aggregate.order.id))!.state).toBe('RETRY_REQUIRED');
    f.tick(); f.provider.compensate = async () => ({ status: 'CONFIRMED', refundCents: 100, voidCents: 0, operationReference: 'partial' });
    expect((await f.service.process(f.aggregate.order.id))!.state).toBe('FAILED'); expect(f.repository.find(f.aggregate.order.id)!.completedAt).toBeNull();
  });
  it('retries an uncertain timeout using the persisted plan and same provider key, with one effect', async () => {
    const f = refused(); const execute = f.provider.compensate; let attempts=0;
    f.provider.compensate = async (plan,key) => { const response = await execute(plan,key); if (++attempts===1) throw new Error('timeout after provider commit'); return response; };
    expect((await f.service.process(f.aggregate.order.id))!.state).toBe('RETRY_REQUIRED');
    expect(f.effects.size).toBe(1); f.tick(); expect((await f.service.process(f.aggregate.order.id))!.state).toBe('COMPLETED');
    expect(f.calls[0]).toBe(f.calls[1]); expect(f.inspections()).toBe(1); expect(f.effects.size).toBe(1);
  });
  it('prevents simultaneous workers from owning the same job while external I/O is pending', async () => {
    const f = refused(); let release!: () => void; const wait = new Promise<void>(resolve => { release=resolve; });
    const inspect = f.provider.inspect; f.provider.inspect = async id => { await wait; return inspect(id); };
    const first = f.service.process(f.aggregate.order.id); const second = await new AutomaticCompensation(f.repository,f.provider,f.clock).process(f.aggregate.order.id);
    expect(second!.state).toBe('PROCESSING'); expect(f.calls).toHaveLength(0); release(); await first; expect(f.calls).toHaveLength(1);
  });
  it('recovers an expired lease without a second provider effect', async () => {
    const f = refused(); const execute = f.provider.compensate;
    f.provider.compensate = async (plan,key) => { const r=await execute(plan,key); f.tick(); return r; };
    expect((await f.service.process(f.aggregate.order.id))!.state).toBe('PROCESSING');
    f.provider.compensate = execute; expect((await f.service.process(f.aggregate.order.id))!.state).toBe('COMPLETED'); expect(f.effects.size).toBe(1); expect(f.calls[0]).toBe(f.calls[1]);
  });
  it('immutable completion/plan cannot be reset or replaced', async () => {
    const f=refused(); await f.service.runPending();
    expect(() => f.db.db.exec("UPDATE compensation_jobs SET state='WAITING_PROVIDER'")).toThrow();
    expect(() => f.db.db.exec('DELETE FROM compensation_jobs')).toThrow();
    expect(() => f.db.db.exec('INSERT OR REPLACE INTO compensation_jobs SELECT * FROM compensation_jobs')).toThrow();
  });
});
const anchor: AccountingRetentionAnchor = { ledgerReference:'ledger1',version:'v1',lastEntryAt:'2026-09-07T18:00:00Z',legalHold:false,requiredUntilDate:null,dossierClosed:true,financiallyReconciled:true };
describe('accounting anchored dossier retention', () => {
  it('uses latest accounting entry, never order creation, retaining the entire Madrid anniversary day', () => {
    expect(retentionDecision(anchor,'2032-09-07T21:59:59Z',true).status).toBe('RETAIN');
    expect(retentionDecision(anchor,'2032-09-07T22:00:00Z',true).status).toBe('ELIGIBLE_FOR_DISPOSAL');
    expect(retentionDecision({ ...anchor,lastEntryAt:'2027-01-01T12:00:00Z' },'2032-09-08T00:00:00Z',true).retentionUntilDate).toBe('2033-01-01');
  });
  it('uses calendar years for leap day and Madrid date across UTC midnight', () => {
    expect(retentionDecision({ ...anchor,lastEntryAt:'2024-02-29T12:00:00Z' },'2026-09-08T00:00:00Z',true).retentionUntilDate).toBe('2030-02-28');
    expect(retentionDecision({ ...anchor,lastEntryAt:'2026-09-07T23:30:00Z' },'2026-09-08T12:00:00Z',true).retentionUntilDate).toBe('2032-09-08');
  });
  it.each(['hold','open','unreconciled','compensation','missing','future','special'])('retains when %s prevents disposal', reason => {
    const a={ ...anchor }; if(reason==='hold')a.legalHold=true; if(reason==='open')a.dossierClosed=false; if(reason==='unreconciled')a.financiallyReconciled=false; if(reason==='future')a.lastEntryAt='2040-01-01T00:00:00Z'; if(reason==='special')a.requiredUntilDate='2040-01-01';
    expect(retentionDecision(reason==='missing'?null:a,'2033-01-01T00:00:00Z',reason!=='compensation').status).toBe('RETAIN');
  });
  it('does not interpret malformed anchor/boolean data as disposal authorization', () => {
    expect(retentionDecision({ ...anchor,legalHold:undefined } as unknown as AccountingRetentionAnchor,'2033-01-01T00:00:00Z',true).status).toBe('RETAIN');
    expect(retentionDecision({ ...anchor,lastEntryAt:'garbage' },'2033-01-01T00:00:00Z',true).status).toBe('RETAIN');
  });
  it('persists one dossier assessment, blocks unresolved compensation, and does not delete age evidence', async () => {
    const f=refused(); const repository=new SqliteRetentionRepository(f.db);
    const policy=new OrderDossierRetention(repository,{ readDossierAnchor:async()=>anchor },()=> '2033-01-01T00:00:00Z');
    expect((await policy.assess(f.aggregate.order.id)).reason).toBe('DOSSIER_OR_COMPENSATION_OPEN');
    await f.service.runPending(); const decision=await policy.assess(f.aggregate.order.id);
    expect(decision.status).toBe('ELIGIBLE_FOR_DISPOSAL'); expect(decision.independentAgeEvidenceTtl).toBe(false);
    expect(f.db.db.prepare('SELECT * FROM delivery_terminal_events').all()).toHaveLength(1);
    expect(f.db.db.prepare('SELECT * FROM order_retention_assessments').all()).toHaveLength(1);
  });
  it('unconfigured accounting retains, preserves known anchor and rejects later regression', async () => {
    const f=refused(); const repo=new SqliteRetentionRepository(f.db);
    const policy=new OrderDossierRetention(repo,{ readDossierAnchor:async()=>anchor },()=> '2033-01-01T00:00:00Z'); await policy.assess(f.aggregate.order.id);
    const unknown=new OrderDossierRetention(repo,undefined,()=> '2033-01-01T00:00:00Z'); expect((await unknown.assess(f.aggregate.order.id)).reason).toBe('ACCOUNTING_ANCHOR_UNAVAILABLE');
    const row=f.db.db.prepare('SELECT last_accounting_entry_at FROM order_retention_assessments').get<{ last_accounting_entry_at:string }>()!; expect(row.last_accounting_entry_at).toBe(anchor.lastEntryAt);
    const older=new OrderDossierRetention(repo,{readDossierAnchor:async()=>({...anchor,lastEntryAt:'2025-01-01T00:00:00Z'})},()=> '2033-01-01T00:00:00Z');
    await expect(older.assess(f.aggregate.order.id)).rejects.toThrow('ACCOUNTING_ANCHOR_REGRESSION');
  });
  it('does not use an accounting anchor that predates confirmed compensation', async () => {
    const f=refused(); await f.service.runPending();
    const repo=new SqliteRetentionRepository(f.db);
    const stale=new OrderDossierRetention(repo,{readDossierAnchor:async()=>({...anchor,lastEntryAt:'2026-01-01T00:00:00Z'})},()=> '2033-01-01T00:00:00Z');
    expect((await stale.assess(f.aggregate.order.id)).reason).toBe('ACCOUNTING_NOT_UPDATED');
    const current=new OrderDossierRetention(repo,{readDossierAnchor:async()=>({...anchor,lastEntryAt:'2026-09-08T00:00:00Z',version:'v2'})},()=> '2033-01-01T00:00:00Z');
    expect((await current.assess(f.aggregate.order.id)).status).toBe('ELIGIBLE_FOR_DISPOSAL');
  });
  it('no new identity-document fields are introduced by compensation or retention storage', () => {
    const f=refused(); for(const table of ['compensation_jobs','order_retention_assessments']) {
      const columns=f.db.db.prepare(`PRAGMA table_info(${table})`).all<{ name:string }>().map(r=>r.name);
      expect(columns.some(name=>/photo|document_number|date_of_birth|dob/.test(name))).toBe(false);
    }
  });
});
