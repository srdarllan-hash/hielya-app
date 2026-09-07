import type { TerminalRow } from './handover';
import { OrderFoundationError } from '../../application/src/orders';
import type { Aggregate, CheckoutContext, CreateOrderCommand, FoundationRepository, FoundationTransaction, OrderRecord, DeliveryRecord } from '../../application/src/orders';
import type { MvpPersistenceDatabase } from './index';

/** Authoritative checkout integration: synchronous read in the same SQLite transaction.
 * No HTTP implementation exists yet. Ownership, address eligibility, minimum spend,
 * road-distance/fee and cart validation belong to this required server-side adapter.
 */
export interface AuthoritativeCheckoutSource {
  load(command: CreateOrderCommand, customerId: string, now: string): CheckoutContext;
}
type OrderRow = { order_id: string; customer_id: string; revision: number; status: OrderRecord['status']; contains_alcohol: number; snapshot_json: string | null; promise_at: string | null; checkout_json: string; created_at: string };
type DeliveryRow = { delivery_id: string; order_id: string; revision: number; courier_id: string | null; status: DeliveryRecord['status'] };
const fail = (code: string): never => { throw new OrderFoundationError(code); };
export class SqliteOrderFoundationRepository implements FoundationRepository {
  constructor(private readonly persistence: MvpPersistenceDatabase, private readonly source: AuthoritativeCheckoutSource) {}
  transaction<T>(operation: (tx: FoundationTransaction) => T): T {
    const { db } = this.persistence;
    return this.persistence.transaction(() => operation({
      checkout: (command, customerId, now) => {
        const context = structuredClone(this.source.load(command, customerId, now));
        const reservation = this.persistence.findReservationById(command.reservationId);
        if (!reservation || reservation.status !== 'ACTIVE' || Date.parse(reservation.expiresAt) <= Date.parse(now)) return fail('RESERVATION_UNAVAILABLE');
        const required = new Map<string, number>();
        for (const item of context.items) {
          const product = db.prepare('SELECT contains_alcohol,sale_price_cents FROM product_commercial_data WHERE product_sku=?').get<{ contains_alcohol: number; sale_price_cents: number }>(item.productSku);
          if (!product) return fail('INVALID_REQUEST');
          // Never trust alcohol or price flags supplied by the checkout adapter/client.
          item.containsAlcohol = product.contains_alcohol === 1; item.unitPriceCents = product.sale_price_cents;
          const components = db.prepare('SELECT b.component_sku,b.quantity,p.contains_alcohol FROM product_bundle_components b JOIN product_commercial_data p ON p.product_sku=b.component_sku WHERE b.bundle_sku=?').all<{ component_sku: string; quantity: number; contains_alcohol: number }>(item.productSku);
          if (components.length) for (const component of components) {
            required.set(component.component_sku, (required.get(component.component_sku) ?? 0) + item.quantity * component.quantity);
            item.containsAlcohol ||= component.contains_alcohol === 1;
          } else required.set(item.productSku, (required.get(item.productSku) ?? 0) + item.quantity);
        }
        if (reservation.items.length !== required.size || reservation.items.some(i => required.get(i.productSku) !== i.quantity)) fail('RESERVATION_MISMATCH');
        return context;
      },
      get: orderId => this.read(orderId),
      insert: ({ order, delivery }) => {
        if (db.prepare('SELECT order_id FROM order_foundation WHERE cart_id=? OR reservation_id=?').get(order.checkout.cartId, order.checkout.reservationId)) fail('ORDER_ALREADY_EXISTS');
        db.prepare(`INSERT INTO order_foundation (order_id,customer_id,cart_id,reservation_id,revision,status,contains_alcohol,requires_age_verification,snapshot_json,promise_at,checkout_json,created_at) VALUES (?,?,?,?,?,?,?,?,?,?,?,?)`).run(order.id, order.customerId, order.checkout.cartId, order.checkout.reservationId, order.revision, order.status, Number(order.containsAlcohol), Number(order.requiresAgeVerification), order.alcoholSnapshot ? JSON.stringify(order.alcoholSnapshot) : null, order.promisedLatestHandoverAt, JSON.stringify(order.checkout), order.createdAt);
        db.prepare('INSERT INTO delivery_foundation (delivery_id,order_id,revision,courier_id,status) VALUES (?,?,?,?,?)').run(delivery.id, order.id, delivery.revision, delivery.courierId, delivery.status);
      },
      save: ({ order, delivery }, previous) => {
        const result = db.prepare('UPDATE order_foundation SET revision=?,status=? WHERE order_id=? AND revision=?').run(order.revision, order.status, order.id, previous) as { changes: number };
        if (result.changes !== 1) fail('STALE_REVISION');
        const changed = db.prepare('UPDATE delivery_foundation SET revision=?,status=?,courier_id=? WHERE order_id=? AND revision=?').run(delivery.revision, delivery.status, delivery.courierId, order.id, previous) as { changes: number };
        if (changed.changes !== 1) fail('STALE_REVISION');
      },
      replay: (scope, key, fingerprint) => {
        const receipt = db.prepare('SELECT fingerprint,result_json FROM order_command_receipts WHERE scope=? AND idempotency_key=?').get<{ fingerprint: string; result_json: string }>(scope, key);
        if (receipt && receipt.fingerprint !== fingerprint) fail('IDEMPOTENCY_CONFLICT');
        return receipt ? JSON.parse(receipt.result_json) as Aggregate : undefined;
      },
      remember: (scope, key, fingerprint, result) => { db.prepare('INSERT INTO order_command_receipts VALUES (?,?,?,?)').run(scope, key, fingerprint, JSON.stringify(result)); },
      convertReservation: (id, now) => {
        const before = this.persistence.findReservationById(id);
        if (!before || before.status !== 'ACTIVE' || Date.parse(before.expiresAt) <= Date.parse(now)) return fail('RESERVATION_UNAVAILABLE');
        if (this.persistence.convertReservation(id, now).status !== 'CONVERTED') fail('RESERVATION_UNAVAILABLE');
      },
    }));
  }
  private read(orderId: string): Aggregate | undefined {
    const row = this.persistence.db.prepare('SELECT * FROM order_foundation WHERE order_id=?').get<OrderRow>(orderId);
    if (!row) return undefined;
    const delivery = this.persistence.db.prepare('SELECT * FROM delivery_foundation WHERE order_id=?').get<DeliveryRow>(orderId);
    if (!delivery) return fail('DELIVERY_MISSING');
    const terminal = this.persistence.db.prepare('SELECT * FROM delivery_terminal_events WHERE order_id=?').get<TerminalRow>(orderId);
    return { order: { id: row.order_id, customerId: row.customer_id, revision: terminal?.revision ?? row.revision, status: terminal ? (terminal.outcome === 'DELIVERED' ? 'DELIVERED' : 'DELIVERY_FAILED') : row.status,
      containsAlcohol: row.contains_alcohol === 1, requiresAgeVerification: row.contains_alcohol === 1,
      alcoholSnapshot: row.snapshot_json ? JSON.parse(row.snapshot_json) : null, promisedLatestHandoverAt: row.promise_at,
      checkout: JSON.parse(row.checkout_json), createdAt: row.created_at },
    delivery: { id: delivery.delivery_id, orderId, revision: terminal?.revision ?? delivery.revision, courierId: delivery.courier_id,
      status: terminal ? (terminal.outcome === 'DELIVERED' ? 'DELIVERED' : 'FAILED') : delivery.status, ageVerificationStatus: terminal?.age_status ?? 'PENDING', ageVerificationMethod: terminal?.age_method ?? null, verifiedAt: terminal?.age_status === 'VERIFIED_18_PLUS' ? terminal.recorded_at : null, verifiedByCourierId: terminal?.age_status === 'VERIFIED_18_PLUS' ? terminal.courier_id : null } };
  }
}
