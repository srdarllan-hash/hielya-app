-- Development/test only. Phase 2; no handover or financial execution.
CREATE TABLE order_foundation (
  order_id TEXT PRIMARY KEY,
  customer_id TEXT NOT NULL REFERENCES customers(customer_id),
  cart_id TEXT NOT NULL UNIQUE,
  reservation_id TEXT NOT NULL UNIQUE REFERENCES inventory_reservations(reservation_id),
  revision INTEGER NOT NULL CHECK(revision >= 1),
  status TEXT NOT NULL CHECK(status IN ('AWAITING_PAYMENT','PAYMENT_AUTHORIZED','PREPARING','READY','OUT_FOR_DELIVERY')),
  contains_alcohol INTEGER NOT NULL CHECK(contains_alcohol IN (0,1)),
  requires_age_verification INTEGER NOT NULL CHECK(requires_age_verification = contains_alcohol),
  snapshot_json TEXT CHECK(snapshot_json IS NULL OR json_valid(snapshot_json)),
  promise_at TEXT,
  checkout_json TEXT NOT NULL CHECK(json_valid(checkout_json)),
  created_at TEXT NOT NULL,
  CHECK((contains_alcohol=0 AND snapshot_json IS NULL AND promise_at IS NULL) OR
        (contains_alcohol=1 AND snapshot_json IS NOT NULL AND promise_at IS NOT NULL))
);
CREATE TABLE delivery_foundation (
  delivery_id TEXT PRIMARY KEY,
  order_id TEXT NOT NULL UNIQUE REFERENCES order_foundation(order_id),
  revision INTEGER NOT NULL CHECK(revision >= 1),
  courier_id TEXT,
  status TEXT NOT NULL CHECK(status IN ('ASSIGNED','OUT_FOR_DELIVERY','ARRIVED')),
  age_verification_status TEXT NOT NULL DEFAULT 'PENDING' CHECK(age_verification_status='PENDING'),
  CHECK(status='ASSIGNED' OR courier_id IS NOT NULL)
);
CREATE TABLE order_command_receipts (
  scope TEXT NOT NULL,
  idempotency_key TEXT NOT NULL,
  fingerprint TEXT NOT NULL,
  result_json TEXT NOT NULL CHECK(json_valid(result_json)),
  PRIMARY KEY(scope,idempotency_key)
);
CREATE TRIGGER order_foundation_immutable_promise BEFORE UPDATE ON order_foundation
WHEN NEW.snapshot_json IS NOT OLD.snapshot_json OR NEW.promise_at IS NOT OLD.promise_at
 OR NEW.checkout_json IS NOT OLD.checkout_json OR NEW.customer_id != OLD.customer_id
 OR NEW.reservation_id != OLD.reservation_id OR NEW.cart_id != OLD.cart_id
 OR NEW.contains_alcohol != OLD.contains_alcohol OR NEW.created_at != OLD.created_at
BEGIN SELECT RAISE(ABORT, 'immutable order snapshot'); END;
