import { runtimeCatalogAdapter } from './dev-test-catalog';
import type { CartAddress, CartRecord, CartReservation, CartTransaction } from '../../application/src/cart';
import { MvpPersistenceDatabase, type InventoryReservationReadModel } from './index';
const reservationView = (r: InventoryReservationReadModel): CartReservation => ({ id: r.reservationId, status: r.status === 'ACTIVE' ? 'ACTIVE' : r.releaseReason === 'EXPIRED' ? 'EXPIRED' : 'CANCELLED', expiresAt: r.expiresAt, items: r.items });
export class SqliteCartRepository {
  constructor(private readonly persistence: MvpPersistenceDatabase) {}
  transaction<T>(operation: (tx: CartTransaction) => T): T {
    const p = this.persistence; const db = p.db;
    return p.transaction(() => operation({
      load: id => { const row = db.prepare('SELECT * FROM runtime_carts WHERE cart_id=?').get<{ cart_id: string; customer_id: string | null; revision: number; items_json: string; reservation_id: string | null; address_id: string | null }>(id); return row ? { id: row.cart_id, customerId: row.customer_id, revision: row.revision, addressId: row.address_id, items: JSON.parse(row.items_json), reservationId: row.reservation_id } : undefined; },
      save: (cart: CartRecord) => { db.prepare('INSERT INTO runtime_carts VALUES (?,?,?,?,?,?) ON CONFLICT(cart_id) DO UPDATE SET customer_id=excluded.customer_id,revision=excluded.revision,items_json=excluded.items_json,reservation_id=excluded.reservation_id,address_id=excluded.address_id').run(cart.id, cart.customerId, cart.revision, JSON.stringify(cart.items), cart.reservationId, cart.addressId); },
      address: id => db.prepare('SELECT address_id AS id,customer_id AS customerId,formatted,latitude,longitude,kind FROM runtime_addresses WHERE address_id=?').get<CartAddress>(id),
      saveAddress: a => { db.prepare('INSERT INTO runtime_addresses VALUES (?,?,?,?,?,?)').run(a.id, a.customerId, a.formatted, a.latitude, a.longitude, a.kind); },
      product: id => runtimeCatalogAdapter(p).findPublicProductById(id),
      available: (sku, now) => p.internalInventory(sku, now).quantityAvailable,
      settings: () => p.settings(),
      reservation: (id, now) => { const r = p.findReservationById(id); if (!r) return undefined; if (r.status === 'ACTIVE' && r.expiresAt <= now) return reservationView(p.releaseReservation(id, 'MANUAL', now)); return reservationView(r); },
      reserve: (referenceId, items, now) => reservationView(p.reserveInventory({ referenceId, items, now })),
      release: (id, now) => { p.releaseReservation(id, 'MANUAL', now); },
      receipt: (scope, key) => { const row = db.prepare('SELECT fingerprint,result_json FROM cart_command_receipts WHERE scope=? AND idempotency_key=?').get<{ fingerprint: string; result_json: string }>(scope, key); return row ? { fingerprint: row.fingerprint, value: JSON.parse(row.result_json) } : undefined; },
      remember: (scope, key, fingerprint, value) => { db.prepare('INSERT INTO cart_command_receipts VALUES (?,?,?,?)').run(scope, key, fingerprint, JSON.stringify(value)); },
    }));
  }
}
