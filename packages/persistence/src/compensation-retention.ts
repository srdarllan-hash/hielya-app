import type { CompensationJob, CompensationPlan, CompensationRepository } from '../../application/src/orders/compensation';
import type { AccountingRetentionAnchor, RetentionDecision, RetentionRepository } from '../../application/src/orders/retention';
import type { MvpPersistenceDatabase } from './index';
type JobRow = { order_id: string; state: CompensationJob['state']; plan_json: string | null; lease_token: string | null; lease_until: string | null; attempt: number; operation_reference: string | null; failure_code: string | null; completed_at: string | null; next_attempt_at: string };
const job = (r: JobRow): CompensationJob => ({ orderId: r.order_id, state: r.state, plan: r.plan_json ? JSON.parse(r.plan_json) : null, leaseToken: r.lease_token, leaseUntil: r.lease_until, attempt: r.attempt, operationReference: r.operation_reference, failureCode: r.failure_code, completedAt: r.completed_at });
export class SqliteCompensationRepository implements CompensationRepository {
  constructor(private readonly persistence: MvpPersistenceDatabase) {}
  find(id: string): CompensationJob | undefined { const row = this.persistence.db.prepare('SELECT * FROM compensation_jobs WHERE order_id=?').get<JobRow>(id); return row ? job(row) : undefined; }
  pending(now: string, limit: number): string[] {
    return this.persistence.db.prepare(`SELECT i.order_id FROM alcohol_compensation_intents i LEFT JOIN compensation_jobs j ON j.order_id=i.order_id
      WHERE j.order_id IS NULL OR (j.state IN ('WAITING_PROVIDER','RETRY_REQUIRED') AND j.next_attempt_at<=?) OR (j.state='PROCESSING' AND j.lease_until<=?) ORDER BY i.created_at,i.order_id LIMIT ?`).all<{ order_id: string }>(now, now, limit).map(r => r.order_id);
  }
  claim(id: string, now: string, until: string, token: string, configured: boolean): CompensationJob | undefined {
    return this.persistence.transaction(() => {
      const db = this.persistence.db;
      if (!db.prepare("SELECT order_id FROM alcohol_compensation_intents WHERE order_id=? AND policy='FULL_NO_CUSTOMER_COST'").get(id)) return undefined;
      const current = db.prepare('SELECT * FROM compensation_jobs WHERE order_id=?').get<JobRow>(id);
      if (current && (['COMPLETED','FAILED'].includes(current.state) || (current.state === 'PROCESSING' && current.lease_until! > now) || (current.state !== 'PROCESSING' && current.next_attempt_at > now))) return job(current);
      const state = configured ? 'PROCESSING' : 'WAITING_PROVIDER';
      if (!current) db.prepare('INSERT INTO compensation_jobs(order_id,state,lease_token,lease_until,attempt,failure_code,next_attempt_at) VALUES (?,?,?,?,?,?,?)').run(id,state,configured?token:null,configured?until:null,configured?1:0,configured?null:'PAYMENT_PROVIDER_NOT_CONFIGURED',now);
      else db.prepare('UPDATE compensation_jobs SET state=?,lease_token=?,lease_until=?,attempt=attempt+?,failure_code=? WHERE order_id=?').run(state,configured?token:null,configured?until:null,configured?1:0,configured?null:'PAYMENT_PROVIDER_NOT_CONFIGURED',id);
      return this.find(id);
    });
  }
  savePlan(id: string, token: string, plan: CompensationPlan, now: string): boolean {
    return this.persistence.transaction(() => {
      const result = this.persistence.db.prepare("UPDATE compensation_jobs SET plan_json=? WHERE order_id=? AND lease_token=? AND state='PROCESSING' AND lease_until>?").run(JSON.stringify(plan),id,token,now) as { changes: number }; return result.changes===1;
    });
  }
  finish(id: string, token: string, now: string, update: Parameters<CompensationRepository['finish']>[3]): boolean {
    return this.persistence.transaction(() => {
      const result = this.persistence.db.prepare("UPDATE compensation_jobs SET state=?,lease_token=NULL,lease_until=NULL,operation_reference=?,failure_code=?,completed_at=?,next_attempt_at=? WHERE order_id=? AND lease_token=? AND state='PROCESSING' AND lease_until>?").run(update.state,update.operationReference,update.failureCode,update.state==='COMPLETED'?now:null,new Date(Date.parse(now)+60_000).toISOString(),id,token,now) as { changes: number }; return result.changes===1;
    });
  }
}
export class SqliteRetentionRepository implements RetentionRepository {
  constructor(private readonly persistence: MvpPersistenceDatabase) {}
  compensationCompletedAt(id: string): string | null { return new SqliteCompensationRepository(this.persistence).find(id)?.completedAt ?? null; }
  compensationComplete(id: string): boolean {
    const db = this.persistence.db;
    if (!db.prepare('SELECT order_id FROM order_foundation WHERE order_id=?').get(id)) return false;
    const intent = db.prepare('SELECT order_id FROM alcohol_compensation_intents WHERE order_id=?').get(id);
    return !intent || new SqliteCompensationRepository(this.persistence).find(id)?.state==='COMPLETED';
  }
  record(id: string, anchor: AccountingRetentionAnchor | null, decision: RetentionDecision, now: string): void {
    this.persistence.transaction(() => {
      const db = this.persistence.db;
      if (decision.reason==='INVALID_ACCOUNTING_ANCHOR') anchor = null;
      const previous = db.prepare('SELECT last_accounting_entry_at FROM order_retention_assessments WHERE order_id=?').get<{ last_accounting_entry_at: string | null }>(id);
      if (anchor && previous?.last_accounting_entry_at && Date.parse(anchor.lastEntryAt)<Date.parse(previous.last_accounting_entry_at)) throw new Error('ACCOUNTING_ANCHOR_REGRESSION');
      if (decision.status==='ELIGIBLE_FOR_DISPOSAL' && !this.compensationComplete(id)) throw new Error('COMPENSATION_NOT_COMPLETE');
      db.prepare(`INSERT INTO order_retention_assessments(order_id,ledger_reference,ledger_version,last_accounting_entry_at,status,reason,retention_until_date,assessed_at) VALUES (?,?,?,?,?,?,?,?)
        ON CONFLICT(order_id) DO UPDATE SET ledger_reference=COALESCE(excluded.ledger_reference,order_retention_assessments.ledger_reference),ledger_version=COALESCE(excluded.ledger_version,order_retention_assessments.ledger_version),last_accounting_entry_at=COALESCE(excluded.last_accounting_entry_at,order_retention_assessments.last_accounting_entry_at),status=excluded.status,reason=excluded.reason,retention_until_date=excluded.retention_until_date,assessed_at=excluded.assessed_at`).run(id,anchor?.ledgerReference??null,anchor?.version??null,anchor?.lastEntryAt??null,decision.status,decision.reason,decision.retentionUntilDate,now);
    });
  }
}
