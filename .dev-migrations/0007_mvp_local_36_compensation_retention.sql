-- Phase4 development/test domain processing. No provider activation or destructive retention job.
CREATE TABLE compensation_jobs (
 order_id TEXT PRIMARY KEY REFERENCES alcohol_compensation_intents(order_id),
 state TEXT NOT NULL CHECK(state IN ('WAITING_PROVIDER','PROCESSING','RETRY_REQUIRED','COMPLETED','FAILED')),
 plan_json TEXT CHECK(plan_json IS NULL OR json_valid(plan_json)),
 lease_token TEXT, lease_until TEXT, attempt INTEGER NOT NULL DEFAULT 0 CHECK(attempt>=0),
 operation_reference TEXT, failure_code TEXT, completed_at TEXT, next_attempt_at TEXT NOT NULL,
 CHECK((state='PROCESSING' AND lease_token IS NOT NULL AND lease_until IS NOT NULL) OR (state!='PROCESSING' AND lease_token IS NULL AND lease_until IS NULL)),
 CHECK(state!='COMPLETED' OR (plan_json IS NOT NULL AND operation_reference IS NOT NULL AND completed_at IS NOT NULL))
);
CREATE TRIGGER compensation_plan_immutable BEFORE UPDATE ON compensation_jobs
WHEN OLD.plan_json IS NOT NULL AND NEW.plan_json IS NOT OLD.plan_json
BEGIN SELECT RAISE(ABORT,'compensation plan immutable'); END;
CREATE TRIGGER compensation_completed_immutable BEFORE UPDATE ON compensation_jobs
WHEN OLD.state='COMPLETED'
BEGIN SELECT RAISE(ABORT,'compensation already completed'); END;
CREATE TRIGGER compensation_job_no_replace BEFORE INSERT ON compensation_jobs
WHEN EXISTS(SELECT 1 FROM compensation_jobs WHERE order_id=NEW.order_id)
BEGIN SELECT RAISE(ABORT,'compensation cannot replace'); END;
CREATE TRIGGER compensation_job_no_delete BEFORE DELETE ON compensation_jobs
BEGIN SELECT RAISE(ABORT,'compensation cannot reset'); END;
CREATE TABLE order_retention_assessments (
 order_id TEXT PRIMARY KEY REFERENCES order_foundation(order_id),
 ledger_reference TEXT, ledger_version TEXT, last_accounting_entry_at TEXT,
 status TEXT NOT NULL CHECK(status IN ('RETAIN','ELIGIBLE_FOR_DISPOSAL')),
 reason TEXT NOT NULL, retention_until_date TEXT, assessed_at TEXT NOT NULL,
 CHECK(status!='ELIGIBLE_FOR_DISPOSAL' OR (last_accounting_entry_at IS NOT NULL AND retention_until_date IS NOT NULL))
);
