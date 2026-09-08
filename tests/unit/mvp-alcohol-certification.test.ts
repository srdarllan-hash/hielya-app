import { afterEach, describe, expect, it } from 'vitest';
import { randomUUID } from 'node:crypto';
import { MvpPersistenceDatabase, SqliteHandoverRepository, SqliteCompensationRepository, SqliteRetentionRepository } from '../../packages/persistence/src';
import { SqliteOrderFoundationRepository } from '../../packages/persistence/src/order-foundation';
import { operationalAvailability, OrderFoundation } from '../../packages/application/src/orders';
import type { CheckoutContext, Stage } from '../../packages/application/src/orders';
import { AtomicDeliveryHandover } from '../../packages/application/src/orders/handover';
import type { AtomicHandoverCommand, HandoverPorts } from '../../packages/application/src/orders/handover';
import { AutomaticCompensation, UnconfiguredPaymentCompensationPort } from '../../packages/application/src/orders/compensation';
import type { PaymentCompensationPort } from '../../packages/application/src/orders/compensation';
import { OrderDossierRetention } from '../../packages/application/src/orders/retention';
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

// Controlled adapters only. This is not an authenticated browser-to-payment production journey.
describe('Phase6 cross-phase certification with controlled dependencies', () => {
  it.each(['REFUSED_NO_ID','REFUSED_MINOR','REFUSED_DOUBTFUL_ID'] as const)('canonical order → terminal %s → automatic full compensation → retention', async status => {
    const f=fixture();
    // A malicious false alcohol flag in the checkout source cannot override catalog storage.
    expect(f.aggregate.order.containsAlcohol).toBe(true);
    expect(f.aggregate.order.requiresAgeVerification).toBe(true);
    const balance=()=>f.db.db.prepare('SELECT product_sku,quantity_on_hand FROM inventory_balances ORDER BY product_sku').all();
    const before=balance();
    const refused=f.handover.refuse('courier',f.aggregate.delivery.id,'phase6-certification-refusal',{expectedRevision:f.aggregate.delivery.revision,status});
    expect(refused.terminal.ageStatus).toBe(status);expect(refused.redeliveryAllowed).toBe(false);
    expect(f.orders.findOwned('customer',f.aggregate.order.id)?.status).toBe('DELIVERY_FAILED');
    expect(()=>f.handover.handover('courier',f.aggregate.delivery.id,'phase6-certification-bypass',f.command)).toThrow();
    const jobs=new SqliteCompensationRepository(f.db);
    const [pending]=await new AutomaticCompensation(jobs,new UnconfiguredPaymentCompensationPort(),()=> '2026-09-07T18:00:00Z').runPending();
    expect(pending.state).toBe('WAITING_PROVIDER');
    const effects=new Map<string, {status:'CONFIRMED';refundCents:number;voidCents:number;operationReference:string}>();
    const provider:PaymentCompensationPort={configured:true,inspect:async()=>({paymentReference:'controlled-payment',currency:'EUR',capturedCents:3200,refundedCents:0,authorizationRemainingCents:2400}),compensate:async(plan,id)=>{let result=effects.get(id);if(!result){result={status:'CONFIRMED',refundCents:plan.refundCents,voidCents:plan.voidCents,operationReference:'controlled-confirmation'};effects.set(id,result);}return result;}};
    const service=new AutomaticCompensation(jobs,provider,()=> '2026-09-08T00:00:00Z');
    const [complete]=await service.runPending();expect(complete.state).toBe('COMPLETED');expect(complete.plan).toMatchObject({refundCents:3200,voidCents:2400,policy:'FULL_NO_CUSTOMER_COST'});
    await new AutomaticCompensation(jobs,provider,()=> '2026-09-08T00:01:00Z').runPending();expect(effects.size).toBe(1);
    expect(balance()).toEqual(before); // No unsafe automatic stock replenishment; return inspection flow remains a documented gap.
    const retention=new OrderDossierRetention(new SqliteRetentionRepository(f.db),{readDossierAnchor:async()=>({ledgerReference:'controlled-ledger',version:'v2',lastEntryAt:'2026-09-09T12:00:00Z',legalHold:false,requiredUntilDate:null,dossierClosed:true,financiallyReconciled:true})},()=> '2032-09-10T12:00:00Z');
    expect((await retention.assess(f.aggregate.order.id)).status).toBe('ELIGIBLE_FOR_DISPOSAL');
    expect(f.db.db.prepare('SELECT * FROM delivery_terminal_events').all()).toHaveLength(1); // Assessment is not deletion.
    expect(f.orders.findOwned('other-customer',f.aggregate.order.id)).toBeUndefined();
    expect(Object.keys(refused.terminal)).not.toContain('pinDigest');
  });
  it('successful atomic handover never generates a refusal refund and cannot be replaced by refusal',async()=>{
    const f=fixture();const result=f.handover.handover('courier',f.aggregate.delivery.id,'phase6-certification-delivered',f.command);
    expect(result.terminal.outcome).toBe('DELIVERED');expect(f.orders.findOwned('customer',f.aggregate.order.id)?.status).toBe('DELIVERED');
    expect(await new AutomaticCompensation(new SqliteCompensationRepository(f.db)).runPending()).toEqual([]);
    expect(()=>f.handover.refuse('courier',f.aggregate.delivery.id,'phase6-certification-late-refusal',{expectedRevision:result.terminal.revision,status:'REFUSED_NO_ID'})).toThrow();
  });
  it('recipient absence or a reception/third-party field cannot partially complete delivery',()=>{
    const f=fixture();
    expect(()=>f.handover.handover('courier',f.aggregate.delivery.id,'phase6-certification-absent',{...f.command,recipientPresent:false} as unknown as AtomicHandoverCommand)).toThrow();
    expect(()=>f.handover.handover('courier',f.aggregate.delivery.id,'phase6-certification-reception',{...f.command,leaveWithReception:true} as unknown as AtomicHandoverCommand)).toThrow();
    expect(f.db.db.prepare('SELECT * FROM delivery_terminal_events').all()).toHaveLength(0);
    expect(f.db.db.prepare('SELECT * FROM alcohol_compensation_intents').all()).toHaveLength(0);
  });
});
