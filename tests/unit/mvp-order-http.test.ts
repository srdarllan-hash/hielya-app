import { createHash, randomUUID } from 'node:crypto';
import { readFileSync } from 'node:fs';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { CartService, type CartPorts, type CartView } from '../../packages/application/src/cart';
import { OrderFoundation, OrderFoundationError } from '../../packages/application/src/orders';
import { ValidateCustomerSession } from '../../packages/application/src/auth';
import { MvpPersistenceDatabase, SqliteCustomerAuthenticationRepository } from '../../packages/persistence/src';
import { DevTestCatalogAdapter } from '../../packages/persistence/src/dev-test-catalog';
import { SqliteCartRepository } from '../../packages/persistence/src/cart';
import { SqliteOrderFoundationRepository } from '../../packages/persistence/src/order-foundation';
import { createOrderHttpHandler, type OrderHttpDependencies } from '../../apps/ui-lab/src/server/mvp-local-36/order-http';
import { MaterializedCheckoutSource } from '../../apps/ui-lab/src/server/mvp-local-36/order-checkout';
import { runtimeOrderHandler } from '../../apps/ui-lab/src/server/mvp-local-36/order-container';

const databases: MvpPersistenceDatabase[] = [];
afterEach(() => { databases.splice(0).forEach(db => db.close()); vi.unstubAllEnvs(); });
function setup() {
  vi.stubEnv('HIELYA_DEV_TEST_CATALOG', '1');
  const db = new MvpPersistenceDatabase(); databases.push(db); db.migrate();
  db.seed({ minimumProductSubtotalCents: 2500, deliveryBaseFeeCents: 200, deliveryFeePerKmCents: 60, maximumRoadDistanceKm: 4, maximumPinAttempts: 3, tipsEnabled: false });
  let now = '2030-01-01T12:00:00.000Z'; let distance = 4; let authenticated = true;
  const customer = randomUUID(); const other = randomUUID();
  db.db.prepare('INSERT INTO customers VALUES (?,?,?,?,?)').run(customer, '+34600000001', now, now, now);
  db.db.prepare('INSERT INTO customers VALUES (?,?,?,?,?)').run(other, '+34600000002', now, now, now);
  const catalog = new DevTestCatalogAdapter(db).listPublicProducts();
  for (const p of catalog.filter(p => !p.isPack)) db.adjustInventory(p.sku, 100, 'TEST_STOCK', now);
  const repo = new SqliteCartRepository(db);
  const operational: CartPorts['operational'] = () => ({ storeStatus: 'OPEN', demand: { level: 'NORMAL', estimate: {
    estimateId: randomUUID(), version: 'test', source: 'synthetic', calculatedAt: '2030-01-01T00:00:00Z', validUntil: '2030-01-02T00:00:00Z', minimumMinutes: 30, upperBoundMinutes: 45 } } });
  const ports: CartPorts = { transaction: f => repo.transaction(f), now: () => now, id: randomUUID, operational, roadDistance: async () => distance };
  const cart = new CartService(ports);
  const address = cart.saveAddress(customer, randomUUID(), { formatted: 'Synthetic test address', latitude: 36.5, longitude: -4.6, kind: 'residential' });
  const unavailable = (): never => { throw new Error('UNREACHABLE'); };
  const dependencies: OrderHttpDependencies = { cart, customer: token => authenticated ? token === 'owner' ? customer : token === 'other' ? other : null : null,
    orders: source => new OrderFoundation({ repository: new SqliteOrderFoundationRepository(db, source ?? { load: unavailable }),
      now: () => now, id: randomUUID, availability: () => operational(null, now), authorize: unavailable, remainingEstimate: unavailable }) };
  const handle = createOrderHttpHandler(() => dependencies);
  const make = (alcohol = false, belowMinimum = false) => {
    let view = cart.create(randomUUID(), customer);
    const products = catalog.filter(p => !p.isPack && p.containsAlcohol === alcohol).sort((a, b) => a.salePriceCents - b.salePriceCents);
    for (const product of products) {
      const quantity = belowMinimum ? 1 : Math.min(product.maxPerOrder, Math.ceil((2500 - view.productSubtotalCents) / product.salePriceCents));
      view = cart.mutate(view.id, customer, randomUUID(), { productId: product.id, quantity, revision: view.revision });
      if (belowMinimum || view.minimumReached) break;
    }
    return view;
  };
  const reserve = async (view = make()) => (await cart.validate(view.id, customer, address.id, randomUUID(), view.revision)).cart;
  const command = (view: CartView) => ({ cartId: view.id, reservationId: view.reservation?.id ?? randomUUID(), addressId: address.id,
    expectedCartRevision: view.revision, acceptedAlcoholDecisionId: null, ageDeclarationsAccepted: false });
  const post = (body: unknown, key: string = randomUUID(), cookie = 'hielya_session=owner') => handle(new Request('http://local/api/v1/orders', {
    method: 'POST', headers: { cookie, 'content-type': 'application/json', 'idempotency-key': key }, body: JSON.stringify(body) }));
  const get = (id: string, cookie = 'hielya_session=owner') => handle(new Request(`http://local/api/v1/orders/${id}`, { headers: { cookie } }));
  const count = () => db.db.prepare('SELECT COUNT(*) AS n FROM order_foundation').get();
  return { db, cart, ports, dependencies, customer, address, make, reserve, command, post, get, count,
    setDistance: (v: number) => { distance = v; }, setTime: (v: string) => { now = v; }, revoke: () => { authenticated = false; } };
}
describe('customer order HTTP', () => {
  it.each(['', 'hielya_session=invalid', 'hielya_session=owner; hielya_session=other'])('rejects unauthenticated create and read: %s', async cookie => {
    const f = setup(); expect((await f.post({}, randomUUID(), cookie)).status).toBe(401); expect((await f.get(randomUUID(), cookie)).status).toBe(401); expect(f.count()).toEqual({ n: 0 });
  });
  it('creates and replays one awaiting-payment order without a second reservation or cart receipt', async () => {
    const f = setup(); const view = await f.reserve(); const key = randomUUID();
    const before = f.db.db.prepare('SELECT COUNT(*) AS n FROM cart_command_receipts').get();
    const validate = vi.spyOn(f.cart, 'validate');
    const first = await f.post(f.command(view), key); const second = await f.post(f.command(view), key);
    expect([first.status, second.status]).toEqual([201, 201]); const order = await first.json(); expect(await second.json()).toEqual(order);
    expect(order).toMatchObject({ status: 'AWAITING_PAYMENT', containsAlcohol: false, requiresAgeVerification: false, alcoholSnapshot: null });
    const read = await f.get(order.id); expect(read.status).toBe(200); expect(await read.json()).toEqual(order);
    expect(validate).toHaveBeenCalledWith(view.id, f.customer, f.address.id);
    expect(f.count()).toEqual({ n: 1 }); expect(f.db.db.prepare('SELECT COUNT(*) AS n FROM inventory_reservations').get()).toEqual({ n: 1 });
    expect(f.db.db.prepare('SELECT COUNT(*) AS n FROM cart_command_receipts').get()).toEqual(before);
    const schema = JSON.parse(readFileSync('contracts/openapi/HIELYA_OPENAPI_ORDERS_HTTP_V1_6.yaml', 'utf8')).components.schemas.OrderCompliance;
    expect(Object.keys(order).sort()).toEqual(schema.required.slice().sort());
  });
  it('rejects below-minimum checkout without inserting an order', async () => {
    const f = setup(); const view = f.make(false, true); expect(view.minimumReached).toBe(false);
    const response = await f.post(f.command(view)); expect(response.status).toBe(409); expect((await response.json()).violations).toContain('MINIMUM_NOT_REACHED'); expect(f.count()).toEqual({ n: 0 });
  });
  it('reconfirms the road distance before order creation', async () => {
    const f = setup(); const view = await f.reserve(); f.setDistance(4.001);
    const response = await f.post(f.command(view)); expect(response.status).toBe(409); expect((await response.json()).violations).toContain('OUTSIDE_AREA'); expect(f.count()).toEqual({ n: 0 });
  });
  it('maps a stale expected revision to 409', async () => {
    const f = setup(); const view = await f.reserve(); const response = await f.post({ ...f.command(view), expectedCartRevision: view.revision - 1 });
    expect(response.status).toBe(409); expect(await response.json()).toMatchObject({ code: 'STALE_REVISION' }); expect(f.count()).toEqual({ n: 0 });
  });
  it('makes foreign and missing order responses byte-identical, including headers', async () => {
    const f = setup(); const order = await (await f.post(f.command(await f.reserve()))).json();
    const foreign = await f.get(order.id, 'hielya_session=other'); const missing = await f.get(randomUUID(), 'hielya_session=other');
    expect([foreign.status, missing.status]).toEqual([404, 404]); expect(await foreign.text()).toBe(await missing.text()); expect([...foreign.headers]).toEqual([...missing.headers]);
  });
  it('rejects a malformed order id before querying the order repository', async () => {
    const f = setup(); const orders = vi.spyOn(f.dependencies, 'orders');
    const response = await f.get('not-a-uuid');
    expect(response.status).toBe(400); expect(await response.json()).toMatchObject({ code: 'INVALID_REQUEST' }); expect(orders).not.toHaveBeenCalled();
  });
  it('refuses alcohol without an authoritative accepted snapshot', async () => {
    const f = setup(); const view = await f.reserve(f.make(true));
    const response = await f.post({ ...f.command(view), ageDeclarationsAccepted: true, acceptedAlcoholDecisionId: randomUUID() });
    expect(response.status).toBe(409); expect(await response.json()).toMatchObject({ code: 'PROMISE_RECONFIRMATION_REQUIRED' }); expect(f.count()).toEqual({ n: 0 });
  });
  it.each(['missing', 'expired'] as const)('refuses a %s reservation', async mode => {
    const f = setup(); const view = mode === 'missing' ? f.make() : await f.reserve();
    if (mode === 'expired') f.setTime(view.reservation!.expiresAt);
    const response = await f.post(f.command(view)); expect(response.status).toBe(409); expect(await response.json()).toMatchObject({ code: 'RESERVATION_UNAVAILABLE' }); expect(f.count()).toEqual({ n: 0 });
  });
  it('rechecks the session after asynchronous routing', async () => {
    const f = setup(); const view = await f.reserve(); f.ports.roadDistance = async () => { f.revoke(); return 1; };
    expect((await f.post(f.command(view))).status).toBe(401); expect((await f.get(randomUUID())).status).toBe(401); expect(f.count()).toEqual({ n: 0 });
  });
  it.each(['expired', 'revoked'])('rejects a persisted %s cookie session for create and read', async mode => {
    const f = setup(); const token = 'a'.repeat(64); const now = '2030-01-01T12:00:00.000Z';
    const repo = new SqliteCustomerAuthenticationRepository(f.db); const id = randomUUID();
    f.db.db.prepare("INSERT INTO customer_sessions (session_id,customer_id,token_hash,status,created_at,expires_at,updated_at) VALUES (?,?,?,'ACTIVE',?,?,?)")
      .run(id, f.customer, createHash('sha256').update(token).digest('hex'), '2029-12-31T12:00:00.000Z', mode === 'expired' ? now : '2030-01-02T12:00:00.000Z', now);
    if (mode === 'revoked') repo.revokeSession(id, now);
    const auth = new ValidateCustomerSession(repo); f.dependencies.customer = value => auth.execute(value, now)?.customer.customerId ?? null;
    const cookie = `hielya_session=${token}`;
    expect((await f.post({}, randomUUID(), cookie)).status).toBe(401); expect((await f.get(randomUUID(), cookie)).status).toBe(401); expect(f.count()).toEqual({ n: 0 });
  });
  it('requires strict schema fields and a valid idempotency key before routing', async () => {
    const f = setup(); const body = f.command(await f.reserve()); const validate = vi.spyOn(f.cart, 'validate');
    for (const invalid of [null, [], {}, { ...body, customerId: f.customer }, { ...body, cartId: 1 }, { ...body, expectedCartRevision: 1.5 }, { ...body, acceptedAlcoholDecisionId: 'bad' }, { ...body, ageDeclarationsAccepted: 'true' }]) expect((await f.post(invalid)).status).toBe(400);
    for (const key of ['', 'short', 'a'.repeat(129), 'space in idempotency key']) expect((await f.post(body, key)).status).toBe(400);
    expect(validate).not.toHaveBeenCalled(); expect(f.count()).toEqual({ n: 0 });
  });
  it.each([['INVALID_REQUEST',400], ['FORBIDDEN',403], ['NOT_FOUND',404], ['RESERVATION_MISMATCH',409], ['STORE_NOT_OPEN',409], ['SLA_UNAVAILABLE',409], ['CUTOFF_REACHED',409], ['AGE_NOT_VERIFIED',409]])('maps %s to %i', async (code, status) => {
    const f = setup(); const body = f.command(await f.reserve()); f.dependencies.orders = () => ({ create: () => { throw new OrderFoundationError(String(code)); }, findOwned: () => undefined });
    expect((await f.post(body)).status).toBe(status);
  });
  it('fails safely for unavailable routing and runtime configuration', async () => {
    const f = setup(); const body = f.command(await f.reserve()); f.ports.roadDistance = async () => { throw new Error('private provider detail'); };
    const response = await f.post(body); expect(response.status).toBe(503); expect(await response.text()).not.toContain('private provider detail'); expect(f.count()).toEqual({ n: 0 });
    vi.stubEnv('HIELYA_MVP_LOCAL_36_DATABASE_PATH', '');
    expect((await runtimeOrderHandler(new Request('http://local/api/v1/orders/missing', { headers: { cookie: 'hielya_session=owner' } }))).status).toBe(503);
  });
  it('distinguishes malformed request JSON from malformed infrastructure data', async () => {
    const f = setup(); const handler = createOrderHttpHandler(() => f.dependencies);
    const request = new Request('http://local/api/v1/orders', { method: 'POST', headers: { cookie: 'hielya_session=owner', 'content-type': 'application/json', 'idempotency-key': randomUUID() }, body: '{' });
    expect((await handler(request)).status).toBe(400);
    const body = f.command(await f.reserve()); f.ports.operational = () => { throw new SyntaxError('private configuration'); };
    expect((await f.post(body)).status).toBe(503); expect(f.count()).toEqual({ n: 0 });
  });
  it('materializes a detached checkout without accepting an alcohol snapshot', async () => {
    const f = setup(); const view = await f.reserve(); const source = new MaterializedCheckoutSource(view, f.customer, f.address.id);
    expect(source.load()).toEqual({ customerId: f.customer, cartId: view.id, addressId: f.address.id, cartRevision: view.revision, reservationId: view.reservation!.id, acceptedSnapshot: null,
      items: view.items.map(i => ({ productSku: i.product.sku, quantity: i.quantity, unitPriceCents: i.unitPriceCents, containsAlcohol: i.product.containsAlcohol })) });
    source.load().items.length = 0; expect(source.load().items.length).toBeGreaterThan(0);
  });
});
