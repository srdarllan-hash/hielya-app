export interface AccountingRetentionAnchor {
  ledgerReference: string; version: string; lastEntryAt: string;
  /** Authoritative order dossier policy, including special rules and legal holds. */
  legalHold: boolean; requiredUntilDate: string | null; dossierClosed: boolean; financiallyReconciled: boolean;
}
export interface AccountingRetentionPort {
  readDossierAnchor(orderId: string): Promise<AccountingRetentionAnchor | null>;
}
export class UnconfiguredAccountingRetentionPort implements AccountingRetentionPort {
  readDossierAnchor(): Promise<AccountingRetentionAnchor | null> { return Promise.reject(new Error('ACCOUNTING_PORT_NOT_CONFIGURED')); }
}
export interface RetentionDecision {
  status: 'RETAIN' | 'ELIGIBLE_FOR_DISPOSAL'; reason: string;
  anchor: 'LAST_ACCOUNTING_ENTRY'; retentionUntilDate: string | null;
  independentAgeEvidenceTtl: false; scope: 'ORDER_DOSSIER_INCLUDING_AGE_EVIDENCE';
}
const localDate = (instant: string) => {
  if (!/(Z|[+-]\d{2}:\d{2})$/.test(instant) || !Number.isFinite(Date.parse(instant))) throw new Error('INVALID_ACCOUNTING_DATE');
  const parts = Object.fromEntries(new Intl.DateTimeFormat('en-GB', { timeZone: 'Europe/Madrid', year: 'numeric', month: '2-digit', day: '2-digit' }).formatToParts(new Date(instant)).map(p => [p.type,p.value]));
  return `${parts.year}-${parts.month}-${parts.day}`;
};
function plusSixYears(date: string): string {
  const [year, month, day] = date.split('-').map(Number);
  const y = year + 6; const d = Math.min(day, new Date(Date.UTC(y,month,0)).getUTCDate());
  return `${y}-${String(month).padStart(2,'0')}-${String(d).padStart(2,'0')}`;
}
export function retentionDecision(anchor: AccountingRetentionAnchor | null, now: string, compensationComplete: boolean): RetentionDecision {
  const base = { anchor: 'LAST_ACCOUNTING_ENTRY' as const, independentAgeEvidenceTtl: false as const, scope: 'ORDER_DOSSIER_INCLUDING_AGE_EVIDENCE' as const };
  const retain = (reason: string, retentionUntilDate: string | null = null): RetentionDecision => ({ ...base, status: 'RETAIN', reason, retentionUntilDate });
  if (!anchor) return retain('ACCOUNTING_ANCHOR_UNAVAILABLE');
  let until: string; let today: string;
  try {
    today = localDate(now); until = plusSixYears(localDate(anchor.lastEntryAt));
    if (typeof anchor.legalHold !== 'boolean' || typeof anchor.dossierClosed !== 'boolean' || typeof anchor.financiallyReconciled !== 'boolean' || !anchor.ledgerReference || !anchor.version || Date.parse(anchor.lastEntryAt) > Date.parse(now)) return retain('INVALID_ACCOUNTING_ANCHOR');
    if (anchor.requiredUntilDate !== null) {
      if (!/^\d{4}-\d{2}-\d{2}$/.test(anchor.requiredUntilDate) || new Date(anchor.requiredUntilDate).toISOString().slice(0,10) !== anchor.requiredUntilDate) return retain('INVALID_ACCOUNTING_ANCHOR');
      if (anchor.requiredUntilDate > until) until = anchor.requiredUntilDate;
    }
  } catch { return retain('INVALID_ACCOUNTING_ANCHOR'); }
  if (anchor.legalHold) return retain('LEGAL_HOLD', until);
  if (!anchor.dossierClosed || !anchor.financiallyReconciled || !compensationComplete) return retain('DOSSIER_OR_COMPENSATION_OPEN', until);
  // Retain the complete anniversary day in Madrid; no 365-day approximation.
  return today > until ? { ...base, status: 'ELIGIBLE_FOR_DISPOSAL', reason: 'DOSSIER_PERIOD_EXPIRED', retentionUntilDate: until } : retain('COMMERCIAL_PERIOD', until);
}
export interface RetentionRepository {
  compensationComplete(orderId: string): boolean;
  compensationCompletedAt(orderId: string): string | null;
  record(orderId: string, anchor: AccountingRetentionAnchor | null, decision: RetentionDecision, assessedAt: string): void;
}
/** Assessment only; disposal of the entire dossier/backups requires a separate storage adapter.
 * No age-only purge and no deletion/reopening of immutable handover evidence here.
 */
export class OrderDossierRetention {
  constructor(private readonly repository: RetentionRepository, private readonly accounting: AccountingRetentionPort = new UnconfiguredAccountingRetentionPort(), private readonly now: () => string = () => new Date().toISOString()) {}
  async assess(orderId: string): Promise<RetentionDecision> {
    let anchor: AccountingRetentionAnchor | null;
    try { anchor = await this.accounting.readDossierAnchor(orderId); } catch { anchor = null; }
    const now = this.now(); const decision = retentionDecision(anchor, now, this.repository.compensationComplete(orderId));
    const completedAt = this.repository.compensationCompletedAt(orderId);
    if (completedAt && anchor && Date.parse(anchor.lastEntryAt) < Date.parse(completedAt)) {
      decision.status = 'RETAIN'; decision.reason = 'ACCOUNTING_NOT_UPDATED';
    }
    this.repository.record(orderId, anchor, decision, now); return decision;
  }
}
