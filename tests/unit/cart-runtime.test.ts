import { mkdtempSync, rmSync, readFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { randomUUID } from 'node:crypto';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { CartService, type CartView, type CartPorts } from '../../packages/application/src/cart';
import { MvpPersistenceDatabase } from '../../packages/persistence/src/index';
import { DevTestCatalogAdapter } from '../../packages/persistence/src/dev-test-catalog';
import { MvpCatalogReadAdapter } from '../../packages/persistence/src/public-api-read-adapter';
import { SqliteCartRepository } from '../../packages/persistence/src/cart';
import { createCartHttpHandler } from '../../apps/ui-lab/src/server/mvp-local-36/cart-http';
const directories: string[] = [];
const databases: MvpPersistenceDatabase[] = [];
afterEach(() => { databases.splice(0).forEach(db => db.close()); vi.unstubAllEnvs(); directories.splice(0).forEach(p => rmSync(p, { recursive: true, force: true })); });
function setup(filename = ':memory:') {
  vi.stubEnv('HIELYA_DEV_TEST_CATALOG', '1');
  const db = new MvpPersistenceDatabase(filename); databases.push(db); db.migrate(); db.seed({ minimumProductSubtotalCents: 2500, deliveryBaseFeeCents: 200, deliveryFeePerKmCents: 60, maximumRoadDistanceKm: 4, maximumPinAttempts: 3, tipsEnabled: false });
  let now = '2030-01-01T12:00:00.000Z'; let distance = 4; let upper = 45;
  const customer = randomUUID();
  db.db.prepare('INSERT INTO customers VALUES (?,?,?,?,?)').run(customer, '+34600000001', now, now, now);
  const catalog = new DevTestCatalogAdapter(db).listPublicProducts();
  const unit = catalog.find(p => !p.isPack && !p.containsAlcohol)!; const alcohol = catalog.find(p => !p.isPack && p.containsAlcohol)!; const pack = catalog.find(p => p.isPack)!;
  // Synthetic pricing only for exact boundary tests; never a new commercial seed.
  db.db.prepare('UPDATE product_commercial_data SET sale_price_cents=2500 WHERE product_sku=?').run(unit.sku);
  for (const p of catalog.filter(p => !p.isPack)) db.adjustInventory(p.sku, 100, 'TEST_STOCK', now);
  const repo = new SqliteCartRepository(db);
  const ports: CartPorts = { transaction: f => repo.transaction(f), id: randomUUID, now: () => now,
    roadDistance: async () => distance,
    operational: () => ({ storeStatus: 'OPEN', demand: { level: upper > 45 ? 'HIGH' : 'NORMAL', estimate: { estimateId: 'test-estimate', version: 'test', source: 'synthetic', calculatedAt: '2030-01-01T00:00:00Z', validUntil: '2030-01-02T00:00:00Z', minimumMinutes: 30, upperBoundMinutes: upper } } }) };
  const service = new CartService(ports);
  const address = service.saveAddress(customer, randomUUID(), { formatted: 'Synthetic test address', latitude: 36.5, longitude: -4.6, kind: 'residential' });
  const make = (product = unit, quantity = 1) => { const empty = service.create(randomUUID(), customer); return service.mutate(empty.id, customer, randomUUID(), { revision: empty.revision, productId: product.id, quantity }); };
  const reserve = (cart: CartView, key = randomUUID()) => service.validate(cart.id, customer, address.id, key, cart.revision);
  return { db, ports, service, customer, unit, alcohol, pack, address, make, reserve, setTime: (v: string) => { now = v; }, setDistance: (v: number) => { distance = v; }, setUpper: (v: number) => { upper = v; } };
}
describe('cart runtime', () => {
  it('dev projection exposes exactly 30 units and 6 packs without activating commercial records', () => {
    const f = setup(); const adapter = new DevTestCatalogAdapter(f.db); const products = adapter.listPublicProducts();
    expect(products.filter(p => !p.isPack)).toHaveLength(30); expect(products.filter(p => p.isPack)).toHaveLength(6);
    expect(new MvpCatalogReadAdapter(f.db).listPublicProducts()).toEqual([]);
    expect(f.db.db.prepare('SELECT SUM(commercially_active) AS active FROM products').get()).toEqual({ active: 0 });
    expect(() => f.db.db.prepare('UPDATE products SET commercially_active=1').run()).toThrow();
    vi.stubEnv('NODE_ENV', 'production'); expect(() => adapter.listPublicProducts()).toThrow('DEV_TEST_CATALOG_PROHIBITED');
    expect(() => new DevTestCatalogAdapter(f.db)).toThrow('DEV_TEST_CATALOG_PROHIBITED');
  });
  it('dev projection fails without explicit opt-in and in unknown environments', () => { const f = setup(); vi.stubEnv('HIELYA_DEV_TEST_CATALOG', ''); expect(() => new DevTestCatalogAdapter(f.db)).toThrow(); vi.stubEnv('HIELYA_DEV_TEST_CATALOG', '1'); vi.stubEnv('NODE_ENV', 'staging'); expect(() => new DevTestCatalogAdapter(f.db)).toThrow(); });
  it.each([2499,2500,2501])('minimum counts products only: %i cents', async price => { const f = setup(); f.db.db.prepare('UPDATE product_commercial_data SET sale_price_cents=? WHERE product_sku=?').run(price, f.unit.sku); const cart = f.make(); const v = await f.reserve(cart); expect(v.valid).toBe(price >= 2500); expect(v.cart.deliveryFeeCents).toBe(440); expect(v.cart.totalCents).toBe(price + 440); });
  it.each([3.999,4,4.001])('road radius boundary %f', async d => { const f = setup(); f.setDistance(d); const v = await f.reserve(f.make()); expect(v.violations.includes('OUTSIDE_AREA')).toBe(d > 4); });
  it.each([['08:59:59',false],['09:00:00',true],['20:59:59',true],['21:00:00',false]] as const)('Madrid operation boundary %s', async (time, valid) => { const f = setup(); const c = f.make(); f.setTime(`2030-01-01T${time}.000Z`); expect((await f.reserve(c)).valid).toBe(valid); });
  it('rejects adding above available stock without changing the cart', () => { const f = setup(); const empty = f.service.create(randomUUID(), f.customer); f.db.adjustInventory(f.unit.sku, -100, 'TEST_ZERO'); expect(() => f.service.mutate(empty.id, f.customer, randomUUID(), { productId: f.unit.id, quantity: 1, revision: empty.revision })).toThrow('OUT_OF_STOCK'); expect(f.service.read(empty.id, f.customer).items).toHaveLength(0); });
  it('claims anonymous cart once and denies access by a different/anonymous principal', () => { const f = setup(); const cart = f.service.create(randomUUID(), null); f.service.claim(cart.id, f.customer); expect(() => f.service.read(cart.id, null)).toThrow('NOT_FOUND'); expect(() => f.service.claim(cart.id, randomUUID())).toThrow('NOT_FOUND'); });
  it('never duplicates an add after a lost response and rejects a changed payload', () => { const f = setup(); const cart = f.service.create(randomUUID(), null); const key = randomUUID(); const command = { productId: f.unit.id, quantity: 1, revision: cart.revision }; f.service.mutate(cart.id, null, key, command); expect(f.service.mutate(cart.id, null, key, command).items[0].quantity).toBe(1); expect(() => f.service.mutate(cart.id, null, key, { ...command, quantity: 2 })).toThrow('IDEMPOTENCY_CONFLICT'); });
  it('only one competing checkout reserves the last available unit', async () => { const f = setup(); f.db.adjustInventory(f.unit.sku, -99, 'LAST_UNIT'); const a = f.make(); const b = f.make(); const results = await Promise.all([f.reserve(a), f.reserve(b)]); expect(results.filter(r => r.valid)).toHaveLength(1); expect(results.find(r => !r.valid)?.violations).toContain('OUT_OF_STOCK'); expect(f.db.internalInventory(f.unit.sku, '2030-01-01T12:00:00Z').quantityAvailable).toBe(0); });
  it('packs reserve components and calculate certified pack price', async () => { const f = setup(); let cart = f.make(f.pack); cart = f.service.mutate(cart.id, f.customer, randomUUID(), { productId: f.unit.id, quantity: 1, revision: cart.revision }); const result = await f.reserve(cart); expect(result.valid).toBe(true); expect(result.cart.productSubtotalCents).toBe(f.pack.salePriceCents + 2500); const components = f.pack.bundleComponents!; for (const c of components) expect(f.db.internalInventory(c.sku, '2030-01-01T12:00:00Z').quantityReserved).toBe(c.quantity + (c.sku === f.unit.sku ? 1 : 0)); });
  it('packs cannot exceed a shared component stock', () => { const f = setup(); const component = f.pack.bundleComponents![0]; f.db.adjustInventory(component.sku, -100, 'NO_COMPONENT'); expect(() => f.make(f.pack)).toThrow('OUT_OF_STOCK'); });
  it.each(['2030-01-01T12:09:59.999Z','2030-01-01T12:10:00.000Z','2030-01-01T12:10:00.001Z'])('editing at %s releases once, keeps items, never auto-reserves', async now => { const f = setup(); const result = await f.reserve(f.make()); const held = result.cart.reservation!; f.setTime(now); const cart = f.service.mutate(result.cart.id, f.customer, randomUUID(), { itemId: result.cart.items[0].id, quantity: 2, revision: result.cart.revision }); expect(cart.status).toBe('ACTIVE'); expect(cart.reservation).toBeNull(); expect(cart.items[0].quantity).toBe(2); expect(f.db.internalInventory(f.unit.sku, now).quantityReserved).toBe(0); const r = f.db.findReservationById(held.id)!; expect(r.releaseReason).toBe(now >= held.expiresAt ? 'EXPIRED' : 'MANUAL'); });
  it('expiry retains items; replay does not renew; explicit new key fully validates again', async () => { const f = setup(); const before = f.make(); const key = randomUUID(); const reserved = await f.reserve(before, key); f.setTime(reserved.cart.reservation!.expiresAt); const expired = f.service.read(before.id, f.customer); expect(expired.reservation?.status).toBe('EXPIRED'); expect(expired.items).toHaveLength(1); expect((await f.reserve(before, key)).cart.reservation?.status).toBe('EXPIRED'); f.setDistance(4.1); expect((await f.reserve(expired)).violations).toContain('OUTSIDE_AREA'); f.setDistance(4); expect((await f.reserve(expired)).cart.reservation?.status).toBe('ACTIVE'); });
  it('alcohol expiry and high demand coexist; cannot renew after cutoff', async () => { const f = setup(); f.setUpper(60); f.setTime('2030-01-01T19:55:00.000Z'); const cart = f.make(f.alcohol, 2); const at = f.service.read(cart.id, f.customer); expect(at.availability.alcohol.status).toBe('AVAILABLE'); f.setTime('2030-01-01T20:05:00.000Z'); const v = await f.reserve(cart); expect(v.cart.availability.demand.level).toBe('HIGH'); expect(v.violations).toContain('ALCOHOL_CUTOFF'); expect(() => f.make(f.alcohol)).toThrow('ALCOHOL_CUTOFF'); });

  it('independent SQLite connections serialize edits and prevent stale writes', () => {
    const dir = mkdtempSync(join(tmpdir(), 'hielya-cart-')); directories.push(dir); const path = join(dir, 'cart.sqlite');
    const f = setup(path); const db2 = new MvpPersistenceDatabase(path); databases.push(db2); const repo2 = new SqliteCartRepository(db2);
    const second = new CartService({ ...f.ports, transaction: operation => repo2.transaction(operation) }); const cart = f.make();
    f.db.db.exec('BEGIN IMMEDIATE');
    try { expect(() => second.mutate(cart.id, f.customer, randomUUID(), { itemId: cart.items[0].id, quantity: 2, revision: cart.revision })).toThrow(/locked|busy/); } finally { f.db.db.exec('ROLLBACK'); }
    f.service.mutate(cart.id, f.customer, randomUUID(), { itemId: cart.items[0].id, quantity: 2, revision: cart.revision });
    expect(() => second.mutate(cart.id, f.customer, randomUUID(), { itemId: cart.items[0].id, quantity: 3, revision: cart.revision })).toThrow('STALE_REVISION');
    expect(second.read(cart.id, f.customer).items[0].quantity).toBe(2);
  });
  it('unit plus pack cannot oversubscribe a shared component', () => {
    const f = setup(); const c = f.pack.bundleComponents![0]; const component = new DevTestCatalogAdapter(f.db).findPublicProductById(c.productId)!;
    f.db.adjustInventory(c.sku, c.quantity - 100, 'LIMIT_COMPONENT'); const cart = f.make(f.pack);
    expect(() => f.service.mutate(cart.id, f.customer, randomUUID(), { productId: component.id, quantity: 1, revision: cart.revision })).toThrow('OUT_OF_STOCK');
    expect(f.service.read(cart.id, f.customer).items).toHaveLength(1);
  });
  it.each(['add','remove'] as const)('%s cancels an active reservation without renewal', async action => {
    const f = setup(); const result = await f.reserve(f.make()); const cart = result.cart;
    const updated = f.service.mutate(cart.id, f.customer, randomUUID(), action === 'add' ? { productId: f.unit.id, quantity: 1, revision: cart.revision } : { itemId: cart.items[0].id, quantity: 0, revision: cart.revision });
    expect(updated.reservation).toBeNull(); expect(f.db.findReservationById(cart.reservation!.id)?.releaseReason).toBe('MANUAL');
    expect(f.db.db.prepare('SELECT COUNT(*) AS n FROM inventory_reservations').get()).toEqual({ n: 1 });
  });
  it('expired reservation at 21:05 cannot be renewed across the dynamic alcohol cutoff', async () => {
    const f = setup(); f.setUpper(60); f.setTime('2030-01-01T19:55:00.000Z'); let cart = f.make(f.alcohol);
    cart = f.service.mutate(cart.id, f.customer, randomUUID(), { productId: f.unit.id, quantity: 1, revision: cart.revision });
    const before = await f.reserve(cart); expect(before.cart.reservation?.status).toBe('ACTIVE');
    f.setTime('2030-01-01T20:05:00.000Z'); const expired = f.service.read(cart.id, f.customer);
    expect(expired.reservation?.status).toBe('EXPIRED'); const after = await f.reserve(expired);
    expect(after.violations).toContain('ALCOHOL_CUTOFF'); expect(after.cart.items).toHaveLength(2);
    expect(f.db.db.prepare('SELECT COUNT(*) AS n FROM inventory_reservations').get()).toEqual({ n: 1 });
  });
  it.each(['2030-01-01T19:59:59.999Z','2030-01-01T20:00:00.000Z'])('server guards additions at cutoff %s', time => { const f = setup(); f.setUpper(60); f.setTime(time); if (time.endsWith('59.999Z')) expect(f.make(f.alcohol).items).toHaveLength(1); else expect(() => f.make(f.alcohol)).toThrow('ALCOHOL_CUTOFF'); });
  it('rechecks stock after validation before reservation and denies foreign addresses', async () => { const f = setup(); const cart = f.make(); expect((await f.service.validate(cart.id,f.customer,f.address.id)).valid).toBe(true); f.db.adjustInventory(f.unit.sku,-100,'STOCK_CHANGED'); expect((await f.reserve(cart)).violations).toContain('OUT_OF_STOCK'); await expect(f.service.validate(cart.id,randomUUID(),f.address.id)).rejects.toThrow('NOT_FOUND'); });

  it('an explicit request while already reserved consumes its key without extending the deadline', async () => {
    const f = setup(); const first = await f.reserve(f.make()); const key = randomUUID(); const replay = await f.reserve(first.cart, key);
    expect(replay.cart.reservation).toEqual(first.cart.reservation);
    f.setTime(first.cart.reservation!.expiresAt); const after = await f.reserve(first.cart, key);
    expect(after.cart.reservation?.status).toBe('EXPIRED'); expect(f.db.db.prepare('SELECT COUNT(*) AS n FROM inventory_reservations').get()).toEqual({ n: 1 });
  });
  it('session revoked while routing is in flight cannot create a reservation', async () => {
    const f = setup(); const cart = f.make(); let allowed = true;
    f.ports.roadDistance = async () => { allowed = false; return 1; };
    const handle = createCartHttpHandler(() => ({ service: f.service, customer: () => allowed ? f.customer : null }));
    const result = await handle(new Request('http://local/api/v1/checkout/reservations', { method: 'POST', headers: { authorization: 'Bearer synthetic', 'idempotency-key': randomUUID() }, body: JSON.stringify({ cartId: cart.id, addressId: f.address.id, revision: cart.revision }) }));
    expect(result.status).toBe(401); expect(f.db.db.prepare('SELECT COUNT(*) AS n FROM inventory_reservations').get()).toEqual({ n: 0 });
  });
  it('HTTP cart responses match the dedicated public field contract without persistence fields', async () => {
    const f = setup(); const cart = f.make();
    const contract = JSON.parse(readFileSync('contracts/openapi/HIELYA_OPENAPI_CART_RUNTIME_V1_4.yaml', 'utf8'));
    const schema = contract.components.schemas.CartView;
    const handle = createCartHttpHandler(() => ({ service: f.service, customer: () => f.customer }));
    const response = await handle(new Request(`http://local/api/v1/carts/${cart.id}`, { headers: { authorization: 'Bearer synthetic' } }));
    expect(response.status).toBe(200); expect(response.headers.get('cache-control')).toBe('no-store');
    const body = await response.json();
    expect(Object.keys(body).sort()).toEqual(Object.keys(schema.properties).sort());
    expect(Object.keys(body.items[0]).sort()).toEqual(Object.keys(schema.properties.items.items.properties).sort());
    expect(body.items[0].product.id).toBe(f.unit.id);
    expect(body).not.toHaveProperty('customerId'); expect(body).not.toHaveProperty('addressId');
  });
  it('HTTP denies validation without a session and rejects client prices', async () => { const f = setup(); const handle = createCartHttpHandler(() => ({ service: f.service, customer: () => null })); expect((await handle(new Request('http://local/api/v1/checkout/reservations', { method: 'POST', body: JSON.stringify({ cartId: randomUUID(), addressId: randomUUID(), revision: 1 }) }))).status).toBe(401); expect((await handle(new Request('http://local/api/v1/carts', { method: 'POST', body: '{"price":1}' }))).status).toBe(400); });
});
