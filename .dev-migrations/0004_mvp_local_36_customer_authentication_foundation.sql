-- HIELYA MVP Local 36 customer authentication foundation for development and tests only.
-- Forward-only and additive: no public endpoint, production connection or destructive rewrite.
PRAGMA foreign_keys = ON;

ALTER TABLE operational_settings ADD COLUMN phone_scope TEXT
  NOT NULL DEFAULT 'ES' CHECK (phone_scope = 'ES');
ALTER TABLE operational_settings ADD COLUMN country_calling_code TEXT
  NOT NULL DEFAULT '+34' CHECK (country_calling_code = '+34');
ALTER TABLE operational_settings ADD COLUMN national_number_length INTEGER
  NOT NULL DEFAULT 9 CHECK (national_number_length = 9);
ALTER TABLE operational_settings ADD COLUMN otp_length INTEGER
  NOT NULL DEFAULT 6 CHECK (otp_length = 6);
ALTER TABLE operational_settings ADD COLUMN otp_ttl_seconds INTEGER
  NOT NULL DEFAULT 300 CHECK (otp_ttl_seconds > 0);
ALTER TABLE operational_settings ADD COLUMN otp_resend_cooldown_seconds INTEGER
  NOT NULL DEFAULT 60 CHECK (otp_resend_cooldown_seconds > 0);
ALTER TABLE operational_settings ADD COLUMN otp_max_verification_attempts INTEGER
  NOT NULL DEFAULT 5 CHECK (otp_max_verification_attempts > 0);
ALTER TABLE operational_settings ADD COLUMN sms_provider TEXT
  NOT NULL DEFAULT 'SIMULATED' CHECK (sms_provider = 'SIMULATED');
ALTER TABLE operational_settings ADD COLUMN customer_session_ttl_seconds INTEGER
  NOT NULL DEFAULT 2592000 CHECK (customer_session_ttl_seconds > 0);
ALTER TABLE operational_settings ADD COLUMN customer_session_expiry_mode TEXT
  NOT NULL DEFAULT 'ABSOLUTE' CHECK (customer_session_expiry_mode = 'ABSOLUTE');
ALTER TABLE operational_settings ADD COLUMN public_browsing_requires_login INTEGER
  NOT NULL DEFAULT 0 CHECK (public_browsing_requires_login = 0);
ALTER TABLE operational_settings ADD COLUMN checkout_requires_login INTEGER
  NOT NULL DEFAULT 1 CHECK (checkout_requires_login = 1);

CREATE TABLE IF NOT EXISTS customers (
  customer_id TEXT PRIMARY KEY,
  phone_e164 TEXT NOT NULL UNIQUE,
  phone_verified_at TEXT NOT NULL,
  created_at TEXT NOT NULL,
  updated_at TEXT NOT NULL,
  CHECK (phone_e164 GLOB '+34[0-9][0-9][0-9][0-9][0-9][0-9][0-9][0-9][0-9]')
);

CREATE TABLE IF NOT EXISTS customer_otp_challenges (
  challenge_id TEXT PRIMARY KEY,
  phone_e164 TEXT NOT NULL,
  otp_salt TEXT NOT NULL,
  otp_hash TEXT NOT NULL,
  status TEXT NOT NULL CHECK (
    status IN ('PENDING', 'VERIFIED', 'LOCKED', 'EXPIRED', 'SUPERSEDED')
  ),
  attempts_used INTEGER NOT NULL DEFAULT 0 CHECK (attempts_used >= 0),
  expires_at TEXT NOT NULL,
  resend_available_at TEXT NOT NULL,
  created_at TEXT NOT NULL,
  verified_at TEXT,
  updated_at TEXT NOT NULL,
  CHECK (length(otp_salt) = 32),
  CHECK (length(otp_hash) = 64)
);

CREATE UNIQUE INDEX IF NOT EXISTS customer_otp_one_pending_per_phone
  ON customer_otp_challenges(phone_e164) WHERE status = 'PENDING';
CREATE INDEX IF NOT EXISTS customer_otp_challenges_phone_created
  ON customer_otp_challenges(phone_e164, created_at DESC);

CREATE TABLE IF NOT EXISTS simulated_sms_deliveries (
  delivery_id TEXT PRIMARY KEY,
  challenge_id TEXT NOT NULL UNIQUE
    REFERENCES customer_otp_challenges(challenge_id) ON DELETE RESTRICT,
  phone_e164 TEXT NOT NULL,
  provider TEXT NOT NULL CHECK (provider = 'SIMULATED'),
  status TEXT NOT NULL CHECK (status IN ('PENDING', 'DELIVERED', 'FAILED')),
  created_at TEXT NOT NULL,
  delivered_at TEXT,
  failed_at TEXT,
  updated_at TEXT NOT NULL,
  CHECK (
    (status = 'PENDING' AND delivered_at IS NULL AND failed_at IS NULL)
    OR (status = 'DELIVERED' AND delivered_at IS NOT NULL AND failed_at IS NULL)
    OR (status = 'FAILED' AND delivered_at IS NULL AND failed_at IS NOT NULL)
  )
);

CREATE TABLE IF NOT EXISTS customer_sessions (
  session_id TEXT PRIMARY KEY,
  customer_id TEXT NOT NULL REFERENCES customers(customer_id) ON DELETE RESTRICT,
  token_hash TEXT NOT NULL UNIQUE,
  status TEXT NOT NULL CHECK (status IN ('ACTIVE', 'REVOKED', 'EXPIRED')),
  created_at TEXT NOT NULL,
  expires_at TEXT NOT NULL,
  revoked_at TEXT,
  updated_at TEXT NOT NULL,
  CHECK (length(token_hash) = 64),
  CHECK (
    (status = 'ACTIVE' AND revoked_at IS NULL)
    OR (status = 'EXPIRED' AND revoked_at IS NULL)
    OR (status = 'REVOKED' AND revoked_at IS NOT NULL)
  )
);

CREATE INDEX IF NOT EXISTS customer_sessions_customer_status
  ON customer_sessions(customer_id, status, expires_at);

CREATE TRIGGER IF NOT EXISTS customer_phone_is_immutable
BEFORE UPDATE OF phone_e164 ON customers
WHEN NEW.phone_e164 <> OLD.phone_e164
BEGIN SELECT RAISE(ABORT, 'customer phone is immutable'); END;

CREATE TRIGGER IF NOT EXISTS customer_otp_secret_material_is_immutable
BEFORE UPDATE OF otp_salt,otp_hash,phone_e164 ON customer_otp_challenges
WHEN NEW.otp_salt <> OLD.otp_salt
  OR NEW.otp_hash <> OLD.otp_hash
  OR NEW.phone_e164 <> OLD.phone_e164
BEGIN SELECT RAISE(ABORT, 'OTP challenge identity is immutable'); END;

CREATE TRIGGER IF NOT EXISTS customer_otp_terminal_state_is_irreversible
BEFORE UPDATE OF status ON customer_otp_challenges
WHEN OLD.status <> 'PENDING' AND NEW.status <> OLD.status
BEGIN SELECT RAISE(ABORT, 'OTP challenge terminal state is irreversible'); END;

CREATE TRIGGER IF NOT EXISTS simulated_sms_delivery_identity_is_immutable
BEFORE UPDATE OF challenge_id,phone_e164,provider,created_at ON simulated_sms_deliveries
WHEN NEW.challenge_id <> OLD.challenge_id
  OR NEW.phone_e164 <> OLD.phone_e164
  OR NEW.provider <> OLD.provider
  OR NEW.created_at <> OLD.created_at
BEGIN SELECT RAISE(ABORT, 'simulated SMS delivery identity is immutable'); END;

CREATE TRIGGER IF NOT EXISTS simulated_sms_delivery_terminal_state_is_irreversible
BEFORE UPDATE OF status ON simulated_sms_deliveries
WHEN OLD.status <> 'PENDING' AND NEW.status <> OLD.status
BEGIN SELECT RAISE(ABORT, 'simulated SMS delivery terminal state is irreversible'); END;

CREATE TRIGGER IF NOT EXISTS customer_session_hash_is_immutable
BEFORE UPDATE OF token_hash,customer_id,created_at,expires_at ON customer_sessions
WHEN NEW.token_hash <> OLD.token_hash
  OR NEW.customer_id <> OLD.customer_id
  OR NEW.created_at <> OLD.created_at
  OR NEW.expires_at <> OLD.expires_at
BEGIN SELECT RAISE(ABORT, 'customer session identity is immutable'); END;

CREATE TRIGGER IF NOT EXISTS customer_session_terminal_state_is_irreversible
BEFORE UPDATE OF status ON customer_sessions
WHEN OLD.status IN ('REVOKED', 'EXPIRED') AND NEW.status <> OLD.status
BEGIN SELECT RAISE(ABORT, 'customer session terminal state is irreversible'); END;
