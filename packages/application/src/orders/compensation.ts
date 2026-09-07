import { randomUUID } from 'node:crypto';
export type CompensationState = 'WAITING_PROVIDER' | 'PROCESSING' | 'RETRY_REQUIRED' | 'COMPLETED' | 'FAILED';
export interface PaymentPosition {
  paymentReference: string; currency: 'EUR';
  /** Authoritative amounts include all customer charges, including delivery fees/tips. */
  capturedCents: number; refundedCents: number; authorizationRemainingCents: number;
}
export interface CompensationPlan {
  orderId: string; paymentReference: string; currency: 'EUR'; policy: 'FULL_NO_CUSTOMER_COST';
  refundCents: number; voidCents: number;
  mode: 'REFUND_CAPTURE' | 'VOID_AUTHORIZATION' | 'REFUND_AND_VOID' | 'NO_PAYMENT';
}
export interface PaymentCompensationPort {
  readonly configured: boolean;
  inspect(orderId: string): Promise<PaymentPosition>;
  /** Same key MUST reconcile/replay the same logical operation after timeout/retry.
   * CONFIRMED means provider confirmation of both refund and void, not request acceptance.
   * Confirmation amounts are cumulative for this key, not just this HTTP attempt.
   */
  compensate(plan: CompensationPlan, idempotencyKey: string): Promise<{
    status: 'PENDING' | 'CONFIRMED'; refundCents: number; voidCents: number; operationReference: string;
  }>;
}
export class UnconfiguredPaymentCompensationPort implements PaymentCompensationPort {
  readonly configured = false;
  inspect(): Promise<PaymentPosition> { return Promise.reject(new Error('PAYMENT_PROVIDER_NOT_CONFIGURED')); }
  compensate(): ReturnType<PaymentCompensationPort['compensate']> { return Promise.reject(new Error('PAYMENT_PROVIDER_NOT_CONFIGURED')); }
}
export interface CompensationJob {
  orderId: string; state: CompensationState; plan: CompensationPlan | null;
  leaseToken: string | null; leaseUntil: string | null; attempt: number;
  operationReference: string | null; failureCode: string | null; completedAt: string | null;
}
export interface CompensationRepository {
  pending(now: string, limit: number): string[];
  claim(orderId: string, now: string, leaseUntil: string, token: string, configured: boolean): CompensationJob | undefined;
  savePlan(orderId: string, token: string, plan: CompensationPlan, now: string): boolean;
  finish(orderId: string, token: string, now: string, update: { state: Exclude<CompensationState, 'PROCESSING' | 'WAITING_PROVIDER'>; failureCode: string | null; operationReference: string | null }): boolean;
  find(orderId: string): CompensationJob | undefined;
}
function amount(n: number): boolean { return Number.isSafeInteger(n) && n >= 0; }
export function fullCompensationPlan(orderId: string, p: PaymentPosition): CompensationPlan {
  if (!p.paymentReference || p.currency !== 'EUR' || ![p.capturedCents,p.refundedCents,p.authorizationRemainingCents].every(amount) || p.refundedCents > p.capturedCents) throw new Error('INVALID_PAYMENT_POSITION');
  const refundCents = p.capturedCents - p.refundedCents; const voidCents = p.authorizationRemainingCents;
  return { orderId, paymentReference: p.paymentReference, currency: 'EUR', policy: 'FULL_NO_CUSTOMER_COST', refundCents, voidCents,
    mode: refundCents ? (voidCents ? 'REFUND_AND_VOID' : 'REFUND_CAPTURE') : (voidCents ? 'VOID_AUTHORIZATION' : 'NO_PAYMENT') };
}
/** Internal scheduled-worker entry point. External calls never occur inside a DB transaction. */
export class AutomaticCompensation {
  constructor(private readonly repository: CompensationRepository,
    private readonly provider: PaymentCompensationPort = new UnconfiguredPaymentCompensationPort(),
    private readonly now: () => string = () => new Date().toISOString()) {}
  async runPending(limit = 100): Promise<CompensationJob[]> {
    if (!Number.isSafeInteger(limit) || limit < 1 || limit > 1000) throw new Error('INVALID_BATCH_LIMIT');
    const results: CompensationJob[] = [];
    for (const id of this.repository.pending(this.now(), limit)) {
      const result = await this.process(id); if (result) results.push(result);
    }
    return results;
  }
  async process(orderId: string): Promise<CompensationJob | undefined> {
    const token = randomUUID(); const now = this.now();
    const leaseUntil = new Date(Date.parse(now) + 60_000).toISOString();
    const job = this.repository.claim(orderId, now, leaseUntil, token, this.provider.configured);
    if (!job || job.state !== 'PROCESSING' || job.leaseToken !== token) return this.repository.find(orderId);
    try {
      const plan = job.plan ?? fullCompensationPlan(orderId, await this.provider.inspect(orderId));
      if (!this.repository.savePlan(orderId, token, plan, this.now())) return this.repository.find(orderId);
      const result = plan.mode === 'NO_PAYMENT'
        ? { status: 'CONFIRMED' as const, refundCents: 0, voidCents: 0, operationReference: `no-payment:${orderId}` }
        : await this.provider.compensate(plan, `hielya:age-refusal:${orderId}:v1`);
      const valid = result.status === 'CONFIRMED' && result.refundCents === plan.refundCents && result.voidCents === plan.voidCents && Boolean(result.operationReference);
      this.repository.finish(orderId, token, this.now(), { state: valid ? 'COMPLETED' : result.status === 'PENDING' ? 'RETRY_REQUIRED' : 'FAILED',
        failureCode: valid ? null : result.status === 'PENDING' ? 'PROVIDER_PENDING' : 'PROVIDER_CONFIRMATION_MISMATCH', operationReference: valid ? result.operationReference : null });
    } catch (error) {
      this.repository.finish(orderId, token, this.now(), { state: error instanceof Error && error.message === 'INVALID_PAYMENT_POSITION' ? 'FAILED' : 'RETRY_REQUIRED',
        failureCode: error instanceof Error && error.message === 'INVALID_PAYMENT_POSITION' ? 'INVALID_PAYMENT_POSITION' : 'PROVIDER_UNAVAILABLE_OR_UNCERTAIN', operationReference: null });
    }
    return this.repository.find(orderId);
  }
}
