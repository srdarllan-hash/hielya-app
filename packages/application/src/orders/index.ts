/** Phase 2 internal foundation. No HTTP handler, payment gateway or handover command. */
export interface SlaEstimate {
  estimateId: string; version: string; source: string; calculatedAt: string; validUntil: string;
  minimumMinutes: number; upperBoundMinutes: number;
}
export interface AlcoholSnapshot {
  decisionId: string; policyVersion: string; estimate: SlaEstimate; standardSlaMinutes: 45;
  effectiveSlaMinutes: number; timezone: 'Europe/Madrid';
  alcoholOrderCutoffAt: string; alcoholHandoverDeadlineAt: string;
}
export interface Availability {
  storeStatus: 'OPEN' | 'PAUSED' | 'CLOSED';
  demand: { level: 'NORMAL' | 'HIGH' | 'UNKNOWN'; estimate: SlaEstimate | null };
  alcohol: { status: 'AVAILABLE' | 'UNAVAILABLE'; reason: 'ELIGIBLE' | 'CUTOFF_REACHED' | 'STORE_NOT_OPEN' | 'SLA_UNAVAILABLE'; snapshot: AlcoholSnapshot | null };
}
export class OrderFoundationError extends Error {
  constructor(public readonly code: string, public readonly currentAvailability?: Availability) { super(code); }
}
const fail = (code: string): never => { throw new OrderFoundationError(code); };
const instant = (value: string): number => {
  const n = Date.parse(value);
  if (!/(Z|[+-]\d{2}:\d{2})$/.test(value) || !Number.isFinite(n)) fail('INVALID_REQUEST');
  return n;
};
const localParts = (now: number) => Object.fromEntries(new Intl.DateTimeFormat('en-GB', {
  timeZone: 'Europe/Madrid', year: 'numeric', month: '2-digit', day: '2-digit', hour: '2-digit', hourCycle: 'h23',
}).formatToParts(now).map(p => [p.type, p.value]));
export function validEstimate(estimate: SlaEstimate | null, now: number): estimate is SlaEstimate {
  if (!estimate) return false;
  try {
    return Boolean(estimate.estimateId && estimate.version && estimate.source)
      && Number.isSafeInteger(estimate.minimumMinutes) && estimate.minimumMinutes > 0
      && Number.isSafeInteger(estimate.upperBoundMinutes) && estimate.upperBoundMinutes >= estimate.minimumMinutes
      && instant(estimate.calculatedAt) <= now && now < instant(estimate.validUntil);
  } catch { return false; }
}
export function operationalAvailability(input: {
  now: string; storeStatus: Availability['storeStatus']; demand: Availability['demand']; decisionId: string;
}): Availability {
  const now = instant(input.now); const local = localParts(now);
  const hour = Number(local.hour);
  const storeStatus = hour < 10 || hour >= 22 ? 'CLOSED' : input.storeStatus;
  const reliable = input.demand.level !== 'UNKNOWN' && validEstimate(input.demand.estimate, now);
  const demand: Availability['demand'] = reliable ? input.demand : { level: 'UNKNOWN', estimate: null };
  let snapshot: AlcoholSnapshot | null = null;
  if (reliable && demand.estimate) {
    // Find local 22:00 using its own offset, including DST transition dates.
    const utc22 = Date.UTC(Number(local.year), Number(local.month) - 1, Number(local.day), 22);
    const shifted = localParts(utc22); const offsetHours = Number(shifted.hour) === 0 ? 2 : Number(shifted.hour) - 22;
    const deadline = utc22 - offsetHours * 3_600_000;
    const effective = Math.max(45, demand.estimate.upperBoundMinutes);
    const cutoff = deadline - effective * 60_000;
    if (!Number.isFinite(cutoff) || Math.abs(cutoff) > 8.64e15) fail('SLA_UNAVAILABLE');
    snapshot = { decisionId: input.decisionId, policyVersion: 'alcohol-v1.3', estimate: { ...demand.estimate },
      standardSlaMinutes: 45, effectiveSlaMinutes: effective, timezone: 'Europe/Madrid',
      alcoholOrderCutoffAt: new Date(cutoff).toISOString(), alcoholHandoverDeadlineAt: new Date(deadline).toISOString() };
  }
  const reason = storeStatus !== 'OPEN' ? 'STORE_NOT_OPEN' : !snapshot ? 'SLA_UNAVAILABLE'
    : now >= instant(snapshot.alcoholOrderCutoffAt) ? 'CUTOFF_REACHED' : 'ELIGIBLE';
  return { storeStatus, demand, alcohol: { status: reason === 'ELIGIBLE' ? 'AVAILABLE' : 'UNAVAILABLE', reason, snapshot } };
}
export interface CreateOrderCommand {
  cartId: string; reservationId: string; addressId: string; expectedCartRevision: number;
  acceptedAlcoholDecisionId: string | null; ageDeclarationsAccepted: boolean;
}
export interface CheckoutContext {
  customerId: string; cartId: string; addressId: string; cartRevision: number; reservationId: string;
  items: { productSku: string; quantity: number; unitPriceCents: number; containsAlcohol: boolean }[];
  /** Loaded from authoritative checkout storage, never accepted from a browser payload. */
  acceptedSnapshot: AlcoholSnapshot | null;
}
export interface OrderRecord {
  id: string; customerId: string; revision: number;
  status: 'AWAITING_PAYMENT' | 'PAYMENT_AUTHORIZED' | 'PREPARING' | 'READY' | 'OUT_FOR_DELIVERY';
  containsAlcohol: boolean; requiresAgeVerification: boolean;
  alcoholSnapshot: AlcoholSnapshot | null; promisedLatestHandoverAt: string | null;
  checkout: CheckoutContext; createdAt: string;
}
export interface DeliveryRecord {
  id: string; orderId: string; revision: number; courierId: string | null;
  status: 'ASSIGNED' | 'OUT_FOR_DELIVERY' | 'ARRIVED';
  ageVerificationStatus: 'PENDING'; ageVerificationMethod: null;
  verifiedAt: null; verifiedByCourierId: null;
}
export interface Aggregate { order: OrderRecord; delivery: DeliveryRecord }
export interface FoundationTransaction {
  checkout(command: CreateOrderCommand, customerId: string, now: string): CheckoutContext;
  get(orderId: string): Aggregate | undefined;
  insert(value: Aggregate): void;
  save(value: Aggregate, previousRevision: number): void;
  replay(scope: string, key: string, fingerprint: string): Aggregate | undefined;
  remember(scope: string, key: string, fingerprint: string, result: Aggregate): void;
  convertReservation(reservationId: string, now: string): void;
}
export interface FoundationRepository { transaction<T>(operation: (tx: FoundationTransaction) => T): T }
export interface FoundationPorts {
  repository: FoundationRepository; now(): string; id(): string;
  /** Trusted synchronous provider read while transaction holds its write lock. No network I/O inside transaction. */
  availability(addressId: string, now: string): Pick<Availability, 'storeStatus' | 'demand'>;
  remainingEstimate(order: OrderRecord, stage: Stage, now: string): SlaEstimate | null;
  /** Verified workforce/payment adapter principal. Never derived from customer request fields. */
  authorize(actorId: string, role: 'OPERATOR' | 'COURIER' | 'PAYMENT', order: OrderRecord): boolean;
}
export type Stage = 'PAYMENT_AUTHORIZED' | 'PREPARING' | 'READY' | 'OUT_FOR_DELIVERY' | 'ARRIVED';
function canonical(value: unknown): string {
  if (Array.isArray(value)) return `[${value.map(canonical).join(',')}]`;
  if (value && typeof value === 'object') return `{${Object.keys(value).sort().map(k => `${JSON.stringify(k)}:${canonical((value as Record<string, unknown>)[k])}`).join(',')}}`;
  return JSON.stringify(value);
}
export class OrderFoundation {
  constructor(private readonly ports: FoundationPorts) {}
  private command(actor: string, operation: string, object: string, key: string, payload: unknown, action: (tx: FoundationTransaction) => Aggregate, authorizeReplay?: (tx: FoundationTransaction) => void): Aggregate {
    if (!actor || !/^[\x21-\x7e]{16,128}$/.test(key)) fail('INVALID_REQUEST');
    const scope = canonical([actor, operation, object]); const fingerprint = canonical(payload);
    return this.ports.repository.transaction(tx => {
      authorizeReplay?.(tx);
      const replay = tx.replay(scope, key, fingerprint); if (replay) return replay;
      const result = action(tx); tx.remember(scope, key, fingerprint, result); return result;
    });
  }
  create(customerId: string, key: string, command: CreateOrderCommand): Aggregate {
    if (!Number.isSafeInteger(command.expectedCartRevision) || command.expectedCartRevision < 1) fail('INVALID_REQUEST');
    return this.command(customerId, 'CREATE', command.cartId, key, command, tx => {
      const now = this.ports.now(); const timestamp = instant(now);
      const checkout = tx.checkout(command, customerId, now);
      if (checkout.customerId !== customerId || checkout.addressId !== command.addressId || checkout.cartId !== command.cartId || checkout.reservationId !== command.reservationId) fail('FORBIDDEN');
      if (checkout.cartRevision !== command.expectedCartRevision) fail('STALE_REVISION');
      if (!checkout.items.length || checkout.items.some(i => !Number.isSafeInteger(i.quantity) || i.quantity <= 0 || !Number.isSafeInteger(i.unitPriceCents) || i.unitPriceCents < 0)) fail('INVALID_REQUEST');
      const containsAlcohol = checkout.items.some(i => i.containsAlcohol);
      const availability = operationalAvailability({ now, ...this.ports.availability(command.addressId, now), decisionId: this.ports.id() });
      if (availability.storeStatus !== 'OPEN') throw new OrderFoundationError('STORE_NOT_OPEN', availability);
      let snapshot: AlcoholSnapshot | null = null;
      if (containsAlcohol) {
        if (availability.alcohol.status !== 'AVAILABLE') throw new OrderFoundationError(availability.alcohol.reason, availability);
        if (!command.ageDeclarationsAccepted) fail('AGE_NOT_VERIFIED');
        const accepted = checkout.acceptedSnapshot; const current = availability.alcohol.snapshot!;
        if (!accepted || accepted.decisionId !== command.acceptedAlcoholDecisionId || !validEstimate(accepted.estimate, timestamp)
          || canonical({ ...accepted, decisionId: '' }) !== canonical({ ...current, decisionId: '' })) {
          throw new OrderFoundationError('PROMISE_RECONFIRMATION_REQUIRED', availability);
        }
        snapshot = { ...current, decisionId: accepted.decisionId };
      }
      const order: OrderRecord = { id: this.ports.id(), customerId, revision: 1, status: 'AWAITING_PAYMENT',
        containsAlcohol, requiresAgeVerification: containsAlcohol, alcoholSnapshot: snapshot,
        promisedLatestHandoverAt: snapshot ? new Date(timestamp + snapshot.effectiveSlaMinutes * 60_000).toISOString() : null,
        checkout, createdAt: now };
      const delivery: DeliveryRecord = { id: this.ports.id(), orderId: order.id, revision: 1, status: 'ASSIGNED', courierId: null,
        ageVerificationStatus: 'PENDING', ageVerificationMethod: null, verifiedAt: null, verifiedByCourierId: null };
      const result = { order, delivery }; tx.insert(result); return result;
    });
  }
  findOwned(customerId: string, orderId: string): OrderRecord | undefined {
    return this.ports.repository.transaction(tx => { const value = tx.get(orderId); return value?.order.customerId === customerId ? value.order : undefined; });
  }
  advance(actorId: string, orderId: string, key: string, command: { expectedRevision: number; stage: Stage }): Aggregate {
    return this.command(actorId, 'ADVANCE', orderId, key, command, tx => {
      const aggregate = tx.get(orderId); if (!aggregate) return fail('NOT_FOUND');
      const { order, delivery } = aggregate;
      const role = command.stage === 'PAYMENT_AUTHORIZED' ? 'PAYMENT' : ['OUT_FOR_DELIVERY', 'ARRIVED'].includes(command.stage) ? 'COURIER' : 'OPERATOR';
      if (!this.ports.authorize(actorId, role, order) || (delivery.courierId && role === 'COURIER' && delivery.courierId !== actorId)) fail('FORBIDDEN');
      if (order.revision !== command.expectedRevision) fail('STALE_REVISION');
      const predecessors: Record<Stage, string> = { PAYMENT_AUTHORIZED: 'AWAITING_PAYMENT', PREPARING: 'PAYMENT_AUTHORIZED', READY: 'PREPARING', OUT_FOR_DELIVERY: 'READY', ARRIVED: 'OUT_FOR_DELIVERY' };
      if (order.status !== predecessors[command.stage] || delivery.status === 'ARRIVED') fail('INVALID_TRANSITION');
      const now = this.ports.now(); const timestamp = instant(now);
      if (order.containsAlcohol) {
        const estimate = this.ports.remainingEstimate(order, command.stage, now);
        if (!validEstimate(estimate, timestamp)) return fail('SLA_UNAVAILABLE');
        const latest = timestamp + estimate.upperBoundMinutes * 60_000;
        if (latest > instant(order.promisedLatestHandoverAt!) || latest >= instant(order.alcoholSnapshot!.alcoholHandoverDeadlineAt)) fail('DELIVERY_DEADLINE_EXCEEDED');
        const local = Number(localParts(timestamp).hour); if (local < 10 || local >= 22) fail('DELIVERY_DEADLINE_EXCEEDED');
      }
      if (command.stage === 'PAYMENT_AUTHORIZED') tx.convertReservation(order.checkout.reservationId, now);
      if (command.stage !== 'ARRIVED') order.status = command.stage;
      if (command.stage === 'OUT_FOR_DELIVERY') { delivery.courierId = actorId; delivery.status = 'OUT_FOR_DELIVERY'; }
      if (command.stage === 'ARRIVED') delivery.status = 'ARRIVED';
      order.revision += 1; delivery.revision += 1;
      tx.save(aggregate, command.expectedRevision); return aggregate;
    }, tx => {
      const current = tx.get(orderId); if (!current) return fail('NOT_FOUND');
      const role = command.stage === 'PAYMENT_AUTHORIZED' ? 'PAYMENT' : ['OUT_FOR_DELIVERY', 'ARRIVED'].includes(command.stage) ? 'COURIER' : 'OPERATOR';
      if (!this.ports.authorize(actorId, role, current.order) || (role === 'COURIER' && current.delivery.courierId && current.delivery.courierId !== actorId)) fail('FORBIDDEN');
    });
  }
}
