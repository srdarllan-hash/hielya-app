-- HIELYA MVP Local 36 inventory reservation lifecycle for development and tests only.
-- Forward-only and additive: no production connection, destructive rebuild or data deletion.
PRAGMA foreign_keys = ON;

ALTER TABLE inventory_reservations ADD COLUMN expires_at TEXT;
ALTER TABLE inventory_reservations ADD COLUMN released_at TEXT;
ALTER TABLE inventory_reservations ADD COLUMN converted_at TEXT;
ALTER TABLE inventory_reservations ADD COLUMN release_reason TEXT
  CHECK (release_reason IS NULL OR release_reason IN ('MANUAL', 'EXPIRED'));
ALTER TABLE inventory_reservations ADD COLUMN request_fingerprint TEXT;
ALTER TABLE inventory_reservations ADD COLUMN updated_at TEXT;

ALTER TABLE operational_settings ADD COLUMN inventory_reservation_ttl_seconds INTEGER
  NOT NULL DEFAULT 600
  CHECK (
    typeof(inventory_reservation_ttl_seconds) = 'integer'
    AND inventory_reservation_ttl_seconds > 0
  );

ALTER TABLE inventory_movements ADD COLUMN reservation_id TEXT
  REFERENCES inventory_reservations(reservation_id) ON DELETE RESTRICT;

-- Legacy rows retain their identifiers, references and items. Their expiry is
-- derived deterministically from the persisted creation instant plus the
-- certified initial TTL. The legacy fingerprint is deliberately not a
-- request-v1 fingerprint because the original request cannot be reconstructed.
UPDATE inventory_reservations
SET
  expires_at = strftime('%Y-%m-%dT%H:%M:%fZ', created_at, '+600 seconds'),
  released_at = CASE
    WHEN status = 'RELEASED' THEN strftime('%Y-%m-%dT%H:%M:%fZ', created_at)
    ELSE NULL
  END,
  converted_at = CASE
    WHEN status = 'CONVERTED' THEN strftime('%Y-%m-%dT%H:%M:%fZ', created_at)
    ELSE NULL
  END,
  request_fingerprint = 'legacy-v1:' || lower(hex(reference_id || ':' || reservation_id)),
  updated_at = strftime('%Y-%m-%dT%H:%M:%fZ', created_at);

CREATE INDEX IF NOT EXISTS inventory_reservations_active_expiry
  ON inventory_reservations(status, expires_at);

CREATE INDEX IF NOT EXISTS inventory_movements_reservation_id
  ON inventory_movements(reservation_id, created_at);

CREATE TRIGGER IF NOT EXISTS inventory_reservations_require_lifecycle_fields
BEFORE INSERT ON inventory_reservations
WHEN NEW.expires_at IS NULL
  OR NEW.request_fingerprint IS NULL
  OR NEW.updated_at IS NULL
  OR (
    NEW.request_fingerprint NOT LIKE 'request-v1:%'
    AND NEW.request_fingerprint NOT LIKE 'legacy-v1:%'
  )
BEGIN SELECT RAISE(ABORT, 'reservation lifecycle fields are required'); END;

CREATE TRIGGER IF NOT EXISTS inventory_reservations_require_lifecycle_fields_on_update
BEFORE UPDATE OF expires_at,request_fingerprint,updated_at ON inventory_reservations
WHEN NEW.expires_at IS NULL
  OR NEW.request_fingerprint IS NULL
  OR NEW.updated_at IS NULL
  OR (
    NEW.request_fingerprint NOT LIKE 'request-v1:%'
    AND NEW.request_fingerprint NOT LIKE 'legacy-v1:%'
  )
BEGIN SELECT RAISE(ABORT, 'reservation lifecycle fields are required'); END;

CREATE TRIGGER IF NOT EXISTS inventory_reservations_terminal_state_is_irreversible
BEFORE UPDATE OF status ON inventory_reservations
WHEN OLD.status IN ('RELEASED', 'CONVERTED') AND NEW.status <> OLD.status
BEGIN SELECT RAISE(ABORT, 'terminal reservation state is irreversible'); END;

CREATE TRIGGER IF NOT EXISTS inventory_reservations_status_fields_are_consistent
BEFORE INSERT ON inventory_reservations
WHEN
  (NEW.status = 'ACTIVE' AND (
    NEW.released_at IS NOT NULL OR NEW.converted_at IS NOT NULL OR NEW.release_reason IS NOT NULL
  ))
  OR (NEW.status = 'RELEASED' AND (
    NEW.released_at IS NULL OR NEW.converted_at IS NOT NULL
    OR (NEW.release_reason IS NULL AND NEW.request_fingerprint NOT LIKE 'legacy-v1:%')
  ))
  OR (NEW.status = 'CONVERTED' AND (
    NEW.converted_at IS NULL OR NEW.released_at IS NOT NULL OR NEW.release_reason IS NOT NULL
  ))
BEGIN SELECT RAISE(ABORT, 'reservation lifecycle state is inconsistent'); END;

CREATE TRIGGER IF NOT EXISTS inventory_reservations_status_fields_are_consistent_on_update
BEFORE UPDATE OF status,released_at,converted_at,release_reason ON inventory_reservations
WHEN
  (NEW.status = 'ACTIVE' AND (
    NEW.released_at IS NOT NULL OR NEW.converted_at IS NOT NULL OR NEW.release_reason IS NOT NULL
  ))
  OR (NEW.status = 'RELEASED' AND (
    NEW.released_at IS NULL OR NEW.converted_at IS NOT NULL
    OR (NEW.release_reason IS NULL AND NEW.request_fingerprint NOT LIKE 'legacy-v1:%')
  ))
  OR (NEW.status = 'CONVERTED' AND (
    NEW.converted_at IS NULL OR NEW.released_at IS NOT NULL OR NEW.release_reason IS NOT NULL
  ))
BEGIN SELECT RAISE(ABORT, 'reservation lifecycle state is inconsistent'); END;

CREATE TRIGGER IF NOT EXISTS inventory_reservation_fingerprint_is_immutable
BEFORE UPDATE OF request_fingerprint ON inventory_reservations
WHEN NEW.request_fingerprint <> OLD.request_fingerprint
BEGIN SELECT RAISE(ABORT, 'reservation request fingerprint is immutable'); END;

CREATE TRIGGER IF NOT EXISTS inventory_balances_require_integer_quantity
BEFORE INSERT ON inventory_balances
WHEN typeof(NEW.quantity_on_hand) <> 'integer'
BEGIN SELECT RAISE(ABORT, 'inventory quantity must be an integer'); END;

CREATE TRIGGER IF NOT EXISTS inventory_balances_require_integer_quantity_on_update
BEFORE UPDATE OF quantity_on_hand ON inventory_balances
WHEN typeof(NEW.quantity_on_hand) <> 'integer'
BEGIN SELECT RAISE(ABORT, 'inventory quantity must be an integer'); END;

CREATE TRIGGER IF NOT EXISTS inventory_reservation_items_require_integer_quantity
BEFORE INSERT ON inventory_reservation_items
WHEN typeof(NEW.quantity) <> 'integer'
BEGIN SELECT RAISE(ABORT, 'reservation quantity must be an integer'); END;

CREATE TRIGGER IF NOT EXISTS inventory_reservation_items_require_integer_quantity_on_update
BEFORE UPDATE OF quantity ON inventory_reservation_items
WHEN typeof(NEW.quantity) <> 'integer'
BEGIN SELECT RAISE(ABORT, 'reservation quantity must be an integer'); END;

CREATE TRIGGER IF NOT EXISTS inventory_movements_require_integer_quantities
BEFORE INSERT ON inventory_movements
WHEN typeof(NEW.delta_quantity) <> 'integer' OR typeof(NEW.quantity_after) <> 'integer'
BEGIN SELECT RAISE(ABORT, 'inventory movement quantities must be integers'); END;

CREATE TRIGGER IF NOT EXISTS inventory_movements_require_integer_quantities_on_update
BEFORE UPDATE OF delta_quantity,quantity_after ON inventory_movements
WHEN typeof(NEW.delta_quantity) <> 'integer' OR typeof(NEW.quantity_after) <> 'integer'
BEGIN SELECT RAISE(ABORT, 'inventory movement quantities must be integers'); END;
