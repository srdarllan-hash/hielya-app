import { OrderFoundationError } from '../../application/src/orders';
import type { HandoverOutcome, HandoverRepository, HandoverTransaction, TerminalDelivery } from '../../application/src/orders/handover';
import { SqliteOrderFoundationRepository } from './order-foundation';
import type { MvpPersistenceDatabase } from './index';
export type TerminalRow = { delivery_id: string; order_id: string; revision: number; outcome: TerminalDelivery['outcome']; recorded_at: string; courier_id: string; age_status: TerminalDelivery['ageStatus']; age_method: TerminalDelivery['ageMethod']; pin_digest: string | null; recipient_present: number };
export const terminalRecord = (r: TerminalRow): TerminalDelivery => ({ deliveryId: r.delivery_id, orderId: r.order_id, revision: r.revision, outcome: r.outcome, recordedAt: r.recorded_at, courierId: r.courier_id, ageStatus: r.age_status, ageMethod: r.age_method, pinDigest: r.pin_digest, recipientPresent: r.recipient_present === 1 });
export class SqliteHandoverRepository implements HandoverRepository {
  constructor(private readonly persistence: MvpPersistenceDatabase) {}
  transaction<T>(operation: (tx: HandoverTransaction) => T): T {
    const { db } = this.persistence;
    return this.persistence.transaction(() => operation({
      load: id => {
        const delivery = db.prepare('SELECT order_id FROM delivery_foundation WHERE delivery_id=?').get<{ order_id: string }>(id);
        if (!delivery) return undefined;
        const repository = new SqliteOrderFoundationRepository(this.persistence, { load: () => { throw new Error('checkout unavailable in handover'); } });
        return repository.transaction(tx => tx.get(delivery.order_id));
      },
      terminal: id => { const row = db.prepare('SELECT * FROM delivery_terminal_events WHERE delivery_id=?').get<TerminalRow>(id); return row ? terminalRecord(row) : undefined; },
      pin: id => db.prepare('SELECT digest,attempts,maximum FROM handover_pins WHERE delivery_id=?').get<{ digest: string; attempts: number; maximum: number }>(id),
      issuePin: (id, digest) => {
        if (db.prepare('SELECT delivery_id FROM handover_pins WHERE delivery_id=?').get(id)) throw new OrderFoundationError('PIN_ALREADY_ISSUED');
        db.prepare('INSERT INTO handover_pins(delivery_id,digest,maximum) VALUES (?,?,?)').run(id, digest, this.persistence.settings().maximumPinAttempts);
      },
      wrongPin: id => { db.prepare('UPDATE handover_pins SET attempts=attempts+1 WHERE delivery_id=? AND attempts<maximum').run(id); },
      complete: t => {
        db.prepare('INSERT INTO delivery_terminal_events(delivery_id,order_id,revision,outcome,recorded_at,courier_id,age_status,age_method,pin_digest,recipient_present) VALUES (?,?,?,?,?,?,?,?,?,?)').run(t.deliveryId, t.orderId, t.revision, t.outcome, t.recordedAt, t.courierId, t.ageStatus, t.ageMethod, t.pinDigest, Number(t.recipientPresent));
      },
      replay: (scope, key, fingerprint) => {
        const r = db.prepare('SELECT fingerprint,result_json FROM handover_command_receipts WHERE scope=? AND idempotency_key=?').get<{ fingerprint: string; result_json: string }>(scope, key);
        if (r && r.fingerprint !== fingerprint) throw new OrderFoundationError('IDEMPOTENCY_CONFLICT');
        return r ? JSON.parse(r.result_json) as HandoverOutcome : undefined;
      },
      remember: (scope, key, fingerprint, result) => { db.prepare('INSERT INTO handover_command_receipts VALUES (?,?,?,?)').run(scope, key, fingerprint, JSON.stringify(result)); },
    }));
  }
}
