import { createHmac, randomInt, timingSafeEqual } from 'node:crypto';
import { OrderFoundationError } from './index';
import type { Aggregate, OrderRecord } from './index';
export type AgeRefusal = 'REFUSED_NO_ID' | 'REFUSED_MINOR' | 'REFUSED_DOUBTFUL_ID';
export interface TerminalDelivery {
  deliveryId: string; orderId: string; revision: number; outcome: 'DELIVERED' | AgeRefusal;
  recordedAt: string; courierId: string;
  ageStatus: 'PENDING' | 'VERIFIED_18_PLUS' | AgeRefusal;
  ageMethod: 'IN_PERSON_DOCUMENT_VISUAL_CHECK' | null;
  pinDigest: string | null; recipientPresent: boolean;
}
export type HandoverResult = { terminal: Omit<TerminalDelivery, 'pinDigest'>; redeliveryAllowed: false; compensationIntent: 'PENDING_FULL_COMPENSATION' | null };
const resultView = (t: TerminalDelivery): Omit<TerminalDelivery, 'pinDigest'> => ({ deliveryId: t.deliveryId, orderId: t.orderId, revision: t.revision, outcome: t.outcome, recordedAt: t.recordedAt, courierId: t.courierId, ageStatus: t.ageStatus, ageMethod: t.ageMethod, recipientPresent: t.recipientPresent });
export type HandoverOutcome = { value: HandoverResult } | { error: string };
export interface HandoverTransaction {
  load(deliveryId: string): Aggregate | undefined;
  terminal(deliveryId: string): TerminalDelivery | undefined;
  pin(deliveryId: string): { digest: string; attempts: number; maximum: number } | undefined;
  issuePin(deliveryId: string, digest: string): void;
  wrongPin(deliveryId: string): void;
  complete(record: TerminalDelivery): void;
  replay(scope: string, key: string, fingerprint: string): HandoverOutcome | undefined;
  remember(scope: string, key: string, fingerprint: string, result: HandoverOutcome): void;
}
export interface HandoverRepository { transaction<T>(operation: (tx: HandoverTransaction) => T): T }
export interface HandoverPorts {
  repository: HandoverRepository; now(): string;
  authorize(actorId: string, role: 'COURIER' | 'PIN_ISSUER', order: OrderRecord): boolean;
}
export interface AtomicHandoverCommand { expectedRevision: number; pin: string; adultDocumentVisuallyVerified: boolean; recipientPresent: true }
const fail = (code: string): never => { throw new OrderFoundationError(code); };
const validRevision = (n: number) => Number.isSafeInteger(n) && n >= 1;
function exactKeys(value: object, keys: string[]): boolean {
  return Object.keys(value).length === keys.length && Object.keys(value).every(key => keys.includes(key));
}
function time(value: string): number {
  if (!/(Z|[+-]\d{2}:\d{2})$/.test(value) || !Number.isFinite(Date.parse(value))) return fail('INVALID_SERVER_TIME');
  return Date.parse(value);
}
/** Pure domain guard: admission cutoff is historical, handover deadline is actual.
 * An accepted feasible order is not retroactively blocked by today's new-order cutoff.
 */
export function handoverWindow(order: OrderRecord, now: string): boolean {
  const current = time(now);
  if (current < time(order.createdAt)) return false;
  if (!order.containsAlcohol) return true;
  const snapshot = order.alcoholSnapshot;
  if (!snapshot || !order.requiresAgeVerification || !order.promisedLatestHandoverAt) return false;
  const created = time(order.createdAt); const deadline = time(snapshot.alcoholHandoverDeadlineAt);
  const cutoff = time(snapshot.alcoholOrderCutoffAt);
  const effective = Math.max(45, snapshot.estimate.upperBoundMinutes);
  const localDeadline = new Intl.DateTimeFormat('en-GB', { timeZone: 'Europe/Madrid', hour: '2-digit', minute: '2-digit', second: '2-digit', hourCycle: 'h23' }).format(deadline);
  const serviceDate = new Intl.DateTimeFormat('en-CA', { timeZone: 'Europe/Madrid', year: 'numeric', month: '2-digit', day: '2-digit' });
  const localNow = new Intl.DateTimeFormat('en-GB', { timeZone: 'Europe/Madrid', hour: '2-digit', hourCycle: 'h23' }).format(current);
  return snapshot.timezone === 'Europe/Madrid' && snapshot.standardSlaMinutes === 45
    && snapshot.effectiveSlaMinutes === effective && Number.isSafeInteger(effective)
    && snapshot.estimate.minimumMinutes > 0 && snapshot.estimate.minimumMinutes <= snapshot.estimate.upperBoundMinutes
    && time(snapshot.estimate.calculatedAt) <= created && created < time(snapshot.estimate.validUntil)
    && serviceDate.format(created) === serviceDate.format(deadline)
    && time(order.promisedLatestHandoverAt) === created + effective * 60_000
    && localDeadline === '22:00:00' && deadline - cutoff === effective * 60_000
    && created < cutoff && current < deadline && current <= time(order.promisedLatestHandoverAt)
    && Number(localNow) >= 10 && Number(localNow) < 22;
}
export class AtomicDeliveryHandover {
  private readonly secret: Buffer;
  constructor(private readonly ports: HandoverPorts, pepper: string) {
    if (Buffer.byteLength(pepper, 'utf8') < 32) fail('HANDOVER_PEPPER_REQUIRED');
    this.secret = Buffer.from(pepper, 'utf8');
  }
  private digest(domain: string, value: unknown): string { return createHmac('sha256', this.secret).update(JSON.stringify([domain, value])).digest('hex'); }
  /** Trusted issuer only. Never return this value from a courier-facing operation. No reset/reissue path. */
  issuePin(actorId: string, deliveryId: string): string {
    return this.ports.repository.transaction(tx => {
      const value = tx.load(deliveryId); if (!value) return fail('NOT_FOUND');
      if (!this.ports.authorize(actorId, 'PIN_ISSUER', value.order)) return fail('FORBIDDEN');
      if (tx.terminal(deliveryId)) return fail('TERMINAL_DELIVERY');
      const pin = randomInt(0, 10_000).toString().padStart(4, '0');
      tx.issuePin(deliveryId, this.digest('delivery-pin-v1', [deliveryId, pin])); return pin;
    });
  }
  private execute(actorId: string, deliveryId: string, key: string, revision: number, operation: string, payload: unknown,
    action: (tx: HandoverTransaction, aggregate: Aggregate) => HandoverOutcome): HandoverResult {
    if (!actorId || !validRevision(revision) || !/^[\x21-\x7e]{16,128}$/.test(key)) return fail('INVALID_REQUEST');
    const fingerprint = this.digest('handover-command-v1', [operation, payload]);
    const scope = JSON.stringify([actorId, operation, deliveryId]);
    const outcome = this.ports.repository.transaction(tx => {
      const aggregate = tx.load(deliveryId); if (!aggregate) return fail('NOT_FOUND');
      if (!this.ports.authorize(actorId, 'COURIER', aggregate.order) || aggregate.delivery.courierId !== actorId) return fail('FORBIDDEN');
      const replay = tx.replay(scope, key, fingerprint); if (replay) return replay;
      if (tx.terminal(deliveryId)) return fail('TERMINAL_DELIVERY');
      if (aggregate.delivery.revision !== revision || aggregate.order.revision !== revision) return fail('STALE_REVISION');
      if (aggregate.delivery.status !== 'ARRIVED' || aggregate.order.status !== 'OUT_FOR_DELIVERY') return fail('INVALID_TRANSITION');
      const result = action(tx, aggregate);
      tx.remember(scope, key, fingerprint, result); return result;
    });
    if ('error' in outcome) return fail(outcome.error);
    return outcome.value;
  }
  handover(actorId: string, deliveryId: string, key: string, command: AtomicHandoverCommand): HandoverResult {
    if (!exactKeys(command, ['expectedRevision', 'pin', 'adultDocumentVisuallyVerified', 'recipientPresent'])
      || typeof command.pin !== 'string' || !/^\d{4}$/.test(command.pin)
      || typeof command.adultDocumentVisuallyVerified !== 'boolean' || command.recipientPresent !== true) return fail('INVALID_REQUEST');
    return this.execute(actorId, deliveryId, key, command.expectedRevision, 'HANDOVER',
      [command.expectedRevision, command.pin, command.adultDocumentVisuallyVerified, command.recipientPresent], (tx, aggregate) => {
        if (aggregate.order.containsAlcohol && command.adultDocumentVisuallyVerified !== true) return { error: 'AGE_NOT_VERIFIED' };
        if (!handoverWindow(aggregate.order, this.ports.now())) return { error: 'DELIVERY_DEADLINE_EXCEEDED' };
        const pin = tx.pin(deliveryId); if (!pin) return { error: 'PIN_UNAVAILABLE' };
        if (pin.attempts >= pin.maximum) return { error: 'PIN_BLOCKED' };
        const candidate = this.digest('delivery-pin-v1', [deliveryId, command.pin]);
        if (!timingSafeEqual(Buffer.from(pin.digest, 'hex'), Buffer.from(candidate, 'hex'))) {
          tx.wrongPin(deliveryId); return { error: pin.attempts + 1 >= pin.maximum ? 'PIN_BLOCKED' : 'PIN_INVALID' };
        }
        // Re-read trusted clock immediately before the terminal write, not at request arrival.
        const now = this.ports.now(); if (!handoverWindow(aggregate.order, now)) return { error: 'DELIVERY_DEADLINE_EXCEEDED' };
        const terminal: TerminalDelivery = { deliveryId, orderId: aggregate.order.id, revision: command.expectedRevision + 1,
          outcome: 'DELIVERED', recordedAt: new Date(time(now)).toISOString(), courierId: actorId,
          ageStatus: aggregate.order.containsAlcohol ? 'VERIFIED_18_PLUS' : 'PENDING',
          ageMethod: aggregate.order.containsAlcohol ? 'IN_PERSON_DOCUMENT_VISUAL_CHECK' : null,
          pinDigest: candidate, recipientPresent: true };
        tx.complete(terminal); return { value: { terminal: resultView(terminal), redeliveryAllowed: false, compensationIntent: null } };
      });
  }
  refuse(actorId: string, deliveryId: string, key: string, command: { expectedRevision: number; status: AgeRefusal }): HandoverResult {
    if (!exactKeys(command, ['expectedRevision', 'status']) || !['REFUSED_NO_ID','REFUSED_MINOR','REFUSED_DOUBTFUL_ID'].includes(command.status)) return fail('INVALID_REQUEST');
    return this.execute(actorId, deliveryId, key, command.expectedRevision, 'REFUSE', [command.expectedRevision, command.status], (tx, aggregate) => {
      if (!aggregate.order.containsAlcohol) return { error: 'AGE_VERIFICATION_NOT_REQUIRED' };
      const terminal: TerminalDelivery = { deliveryId, orderId: aggregate.order.id, revision: command.expectedRevision + 1,
        outcome: command.status, recordedAt: new Date(time(this.ports.now())).toISOString(), courierId: actorId,
        ageStatus: command.status, ageMethod: command.status === 'REFUSED_NO_ID' ? null : 'IN_PERSON_DOCUMENT_VISUAL_CHECK', pinDigest: null, recipientPresent: false };
      tx.complete(terminal); return { value: { terminal: resultView(terminal), redeliveryAllowed: false, compensationIntent: 'PENDING_FULL_COMPENSATION' } };
    });
  }
}
