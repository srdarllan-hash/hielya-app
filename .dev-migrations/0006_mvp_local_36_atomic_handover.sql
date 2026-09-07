-- Additive development/test migration. Existing foundation rows stay frozen;
-- one terminal event is the sole authority for final order/delivery projections.
CREATE TABLE handover_pins (
 delivery_id TEXT PRIMARY KEY REFERENCES delivery_foundation(delivery_id),
 digest TEXT NOT NULL CHECK(length(digest)=64),
 attempts INTEGER NOT NULL DEFAULT 0 CHECK(attempts>=0),
 maximum INTEGER NOT NULL CHECK(maximum>0)
);
CREATE TABLE delivery_terminal_events (
 delivery_id TEXT PRIMARY KEY REFERENCES delivery_foundation(delivery_id),
 order_id TEXT NOT NULL UNIQUE REFERENCES order_foundation(order_id),
 revision INTEGER NOT NULL CHECK(revision>1),
 outcome TEXT NOT NULL CHECK(outcome IN ('DELIVERED','REFUSED_NO_ID','REFUSED_MINOR','REFUSED_DOUBTFUL_ID')),
 recorded_at TEXT NOT NULL CHECK(julianday(recorded_at) IS NOT NULL),
 courier_id TEXT NOT NULL,
 age_status TEXT NOT NULL CHECK(age_status IN ('PENDING','VERIFIED_18_PLUS','REFUSED_NO_ID','REFUSED_MINOR','REFUSED_DOUBTFUL_ID')),
 age_method TEXT CHECK(age_method IS NULL OR age_method='IN_PERSON_DOCUMENT_VISUAL_CHECK'),
 pin_digest TEXT,
 recipient_present INTEGER NOT NULL CHECK(recipient_present IN (0,1)),
 CHECK((outcome='DELIVERED' AND pin_digest IS NOT NULL AND recipient_present=1)
   OR (outcome!='DELIVERED' AND age_status=outcome AND pin_digest IS NULL)),
 CHECK((age_status IN ('PENDING','REFUSED_NO_ID') AND age_method IS NULL)
   OR (age_status NOT IN ('PENDING','REFUSED_NO_ID') AND age_method IS NOT NULL AND age_method='IN_PERSON_DOCUMENT_VISUAL_CHECK'))
);
CREATE TABLE alcohol_compensation_intents (
 order_id TEXT PRIMARY KEY REFERENCES delivery_terminal_events(order_id),
 policy TEXT NOT NULL DEFAULT 'FULL_NO_CUSTOMER_COST' CHECK(policy='FULL_NO_CUSTOMER_COST'),
 status TEXT NOT NULL DEFAULT 'PENDING' CHECK(status='PENDING'),
 created_at TEXT NOT NULL
);
CREATE TABLE handover_command_receipts (
 scope TEXT NOT NULL, idempotency_key TEXT NOT NULL, fingerprint TEXT NOT NULL CHECK(length(fingerprint)=64),
 result_json TEXT NOT NULL CHECK(json_valid(result_json)), PRIMARY KEY(scope,idempotency_key)
);
CREATE TRIGGER terminal_delivery_guards BEFORE INSERT ON delivery_terminal_events
BEGIN
 SELECT CASE WHEN (SELECT count(*) FROM order_foundation o JOIN delivery_foundation d ON d.order_id=o.order_id
   WHERE o.order_id=NEW.order_id AND d.delivery_id=NEW.delivery_id AND d.status='ARRIVED'
   AND o.status='OUT_FOR_DELIVERY' AND d.courier_id=NEW.courier_id
   AND o.revision+1=NEW.revision AND d.revision+1=NEW.revision
   AND julianday(NEW.recorded_at)>=julianday(o.created_at)) != 1
 THEN RAISE(ABORT,'terminal actor/state/revision guard') END;
 SELECT CASE WHEN NEW.outcome='DELIVERED' AND (SELECT count(*) FROM handover_pins p
   WHERE p.delivery_id=NEW.delivery_id AND p.digest=NEW.pin_digest AND p.attempts<p.maximum) != 1
 THEN RAISE(ABORT,'terminal PIN guard') END;
 SELECT CASE WHEN NEW.outcome='DELIVERED' AND (SELECT count(*) FROM order_foundation o
   WHERE o.order_id=NEW.order_id AND (
     (o.contains_alcohol=0 AND NEW.age_status='PENDING' AND NEW.age_method IS NULL)
     OR (o.contains_alcohol=1 AND o.requires_age_verification=1 AND NEW.age_status='VERIFIED_18_PLUS'
       AND NEW.age_method='IN_PERSON_DOCUMENT_VISUAL_CHECK'
       AND julianday(o.created_at)<julianday(json_extract(o.snapshot_json,'$.alcoholOrderCutoffAt'))
       AND julianday(NEW.recorded_at)<julianday(json_extract(o.snapshot_json,'$.alcoholHandoverDeadlineAt'))
       AND julianday(NEW.recorded_at)<=julianday(o.promise_at)))) != 1
 THEN RAISE(ABORT,'terminal alcohol deadline/age guard') END;
 SELECT CASE WHEN NEW.outcome!='DELIVERED' AND (SELECT contains_alcohol FROM order_foundation WHERE order_id=NEW.order_id)!=1
 THEN RAISE(ABORT,'age refusal requires alcohol') END;
END;
CREATE TRIGGER terminal_refusal_compensation AFTER INSERT ON delivery_terminal_events
WHEN NEW.outcome!='DELIVERED'
BEGIN INSERT INTO alcohol_compensation_intents(order_id,created_at) VALUES(NEW.order_id,NEW.recorded_at); END;
CREATE TRIGGER terminal_event_no_update BEFORE UPDATE ON delivery_terminal_events
BEGIN SELECT RAISE(ABORT,'terminal delivery is immutable'); END;
CREATE TRIGGER terminal_event_no_delete BEFORE DELETE ON delivery_terminal_events
BEGIN SELECT RAISE(ABORT,'terminal delivery cannot reopen'); END;
CREATE TRIGGER terminal_order_no_update BEFORE UPDATE ON order_foundation
WHEN EXISTS(SELECT 1 FROM delivery_terminal_events WHERE order_id=OLD.order_id)
BEGIN SELECT RAISE(ABORT,'terminal order cannot reopen'); END;
CREATE TRIGGER terminal_delivery_no_update BEFORE UPDATE ON delivery_foundation
WHEN EXISTS(SELECT 1 FROM delivery_terminal_events WHERE delivery_id=OLD.delivery_id)
BEGIN SELECT RAISE(ABORT,'terminal delivery cannot reopen'); END;
CREATE TRIGGER handover_pin_no_reset BEFORE UPDATE ON handover_pins
WHEN NEW.digest!=OLD.digest OR NEW.maximum!=OLD.maximum OR NEW.attempts!=OLD.attempts+1
 OR EXISTS(SELECT 1 FROM delivery_terminal_events WHERE delivery_id=OLD.delivery_id)
BEGIN SELECT RAISE(ABORT,'handover PIN cannot reset'); END;
CREATE TRIGGER handover_pin_no_delete BEFORE DELETE ON handover_pins
BEGIN SELECT RAISE(ABORT,'handover PIN cannot reissue'); END;
