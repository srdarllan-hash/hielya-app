-- HIELYA MVP Local 36 development/test migration.
-- Forward-only and additive: no production connection, credentials or data deletion.
PRAGMA foreign_keys = ON;

CREATE TABLE IF NOT EXISTS categories (
  slug TEXT PRIMARY KEY,
  name_es TEXT NOT NULL,
  sort_order INTEGER NOT NULL,
  is_active INTEGER NOT NULL DEFAULT 1 CHECK (is_active IN (0, 1))
);

CREATE TABLE IF NOT EXISTS products (
  sku TEXT PRIMARY KEY,
  category_slug TEXT NOT NULL REFERENCES categories(slug),
  kind TEXT NOT NULL CHECK (kind IN ('UNIT', 'COMPOSITE')),
  mvp_status TEXT NOT NULL CHECK (mvp_status IN ('PAUSED', 'DEFERRED_AFTER_MVP')),
  commercially_active INTEGER NOT NULL DEFAULT 0 CHECK (commercially_active = 0),
  created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS product_bundles (
  product_sku TEXT PRIMARY KEY REFERENCES products(sku) ON DELETE RESTRICT,
  is_active INTEGER NOT NULL DEFAULT 1 CHECK (is_active IN (0, 1))
);

CREATE TABLE IF NOT EXISTS product_bundle_components (
  bundle_sku TEXT NOT NULL REFERENCES product_bundles(product_sku) ON DELETE CASCADE,
  component_sku TEXT NOT NULL REFERENCES products(sku) ON DELETE RESTRICT,
  quantity INTEGER NOT NULL CHECK (quantity > 0),
  PRIMARY KEY (bundle_sku, component_sku),
  CHECK (bundle_sku <> component_sku)
);

CREATE TABLE IF NOT EXISTS operational_settings (
  id INTEGER PRIMARY KEY CHECK (id = 1),
  minimum_product_subtotal_cents INTEGER NOT NULL CHECK (minimum_product_subtotal_cents >= 0),
  delivery_base_fee_cents INTEGER NOT NULL CHECK (delivery_base_fee_cents >= 0),
  delivery_fee_per_km_cents INTEGER NOT NULL CHECK (delivery_fee_per_km_cents >= 0),
  maximum_road_distance_km REAL NOT NULL CHECK (maximum_road_distance_km >= 0),
  maximum_pin_attempts INTEGER NOT NULL CHECK (maximum_pin_attempts > 0),
  tips_enabled INTEGER NOT NULL CHECK (tips_enabled IN (0, 1)),
  updated_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS inventory_balances (
  product_sku TEXT PRIMARY KEY REFERENCES products(sku) ON DELETE RESTRICT,
  quantity_on_hand INTEGER NOT NULL DEFAULT 0 CHECK (quantity_on_hand >= 0),
  updated_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS inventory_reservations (
  reservation_id TEXT PRIMARY KEY,
  reference_id TEXT NOT NULL UNIQUE,
  status TEXT NOT NULL CHECK (status IN ('ACTIVE', 'RELEASED', 'CONVERTED')),
  created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS inventory_reservation_items (
  reservation_id TEXT NOT NULL REFERENCES inventory_reservations(reservation_id) ON DELETE CASCADE,
  product_sku TEXT NOT NULL REFERENCES products(sku) ON DELETE RESTRICT,
  quantity INTEGER NOT NULL CHECK (quantity > 0),
  PRIMARY KEY (reservation_id, product_sku)
);

CREATE TABLE IF NOT EXISTS inventory_movements (
  movement_id TEXT PRIMARY KEY,
  product_sku TEXT NOT NULL REFERENCES products(sku) ON DELETE RESTRICT,
  delta_quantity INTEGER NOT NULL CHECK (delta_quantity <> 0),
  quantity_after INTEGER NOT NULL CHECK (quantity_after >= 0),
  reason TEXT NOT NULL,
  correlation_id TEXT NOT NULL,
  created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS delivery_pins (
  order_reference TEXT PRIMARY KEY,
  pin_hash TEXT NOT NULL,
  attempts_used INTEGER NOT NULL DEFAULT 0 CHECK (attempts_used >= 0),
  verified_at TEXT
);

CREATE TABLE IF NOT EXISTS order_simulation_amounts (
  order_reference TEXT PRIMARY KEY,
  product_subtotal_cents INTEGER NOT NULL CHECK (product_subtotal_cents >= 0),
  simulated_tip_cents INTEGER NOT NULL DEFAULT 0 CHECK (simulated_tip_cents >= 0)
);

CREATE TRIGGER IF NOT EXISTS product_bundle_requires_composite
BEFORE INSERT ON product_bundles
WHEN (SELECT kind FROM products WHERE sku = NEW.product_sku) <> 'COMPOSITE'
BEGIN SELECT RAISE(ABORT, 'bundle product must be composite'); END;

CREATE TRIGGER IF NOT EXISTS inventory_rejects_composite
BEFORE INSERT ON inventory_balances
WHEN (SELECT kind FROM products WHERE sku = NEW.product_sku) = 'COMPOSITE'
BEGIN SELECT RAISE(ABORT, 'composite products have no independent inventory'); END;
