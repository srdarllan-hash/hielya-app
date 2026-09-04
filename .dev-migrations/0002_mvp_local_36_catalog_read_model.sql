-- HIELYA MVP Local 36 catalog read model for development and tests only.
-- Forward-only and additive: certified core tables remain unchanged.
PRAGMA foreign_keys = ON;

CREATE TABLE IF NOT EXISTS category_commercial_data (
  category_slug TEXT PRIMARY KEY REFERENCES categories(slug) ON DELETE RESTRICT,
  id TEXT NOT NULL UNIQUE CHECK (
    length(id) = 36
    AND substr(id, 9, 1) = '-'
    AND substr(id, 14, 1) = '-'
    AND substr(id, 19, 1) = '-'
    AND substr(id, 24, 1) = '-'
  ),
  public_visible INTEGER NOT NULL DEFAULT 0 CHECK (public_visible IN (0, 1)),
  created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS product_commercial_data (
  product_sku TEXT PRIMARY KEY REFERENCES products(sku) ON DELETE RESTRICT,
  id TEXT NOT NULL UNIQUE CHECK (
    length(id) = 36
    AND substr(id, 9, 1) = '-'
    AND substr(id, 14, 1) = '-'
    AND substr(id, 19, 1) = '-'
    AND substr(id, 24, 1) = '-'
  ),
  category_id TEXT NOT NULL REFERENCES category_commercial_data(id) ON DELETE RESTRICT,
  name TEXT NOT NULL CHECK (length(trim(name)) > 0),
  sale_price_cents INTEGER NOT NULL CHECK (sale_price_cents >= 0),
  currency TEXT NOT NULL CHECK (currency = 'EUR'),
  max_per_order INTEGER NOT NULL CHECK (max_per_order > 0),
  contains_alcohol INTEGER NOT NULL CHECK (contains_alcohol IN (0, 1)),
  minimum_age INTEGER NOT NULL CHECK (minimum_age >= 0),
  is_pack INTEGER NOT NULL CHECK (is_pack IN (0, 1)),
  ice_included INTEGER NOT NULL CHECK (ice_included IN (0, 1)),
  public_visible INTEGER NOT NULL DEFAULT 0 CHECK (public_visible IN (0, 1)),
  sort_order INTEGER NOT NULL CHECK (sort_order >= 0),
  created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CHECK (
    (contains_alcohol = 0 AND minimum_age = 0)
    OR (contains_alcohol = 1 AND minimum_age >= 18)
  )
);

CREATE INDEX IF NOT EXISTS product_commercial_data_category_id
  ON product_commercial_data(category_id, sort_order);

CREATE INDEX IF NOT EXISTS product_bundle_components_component_sku
  ON product_bundle_components(component_sku);

CREATE INDEX IF NOT EXISTS inventory_reservation_items_product_sku
  ON inventory_reservation_items(product_sku);

CREATE TRIGGER IF NOT EXISTS product_commercial_category_matches_core
BEFORE INSERT ON product_commercial_data
WHEN (
  SELECT category_slug
  FROM category_commercial_data
  WHERE id = NEW.category_id
) <> (
  SELECT category_slug
  FROM products
  WHERE sku = NEW.product_sku
)
BEGIN SELECT RAISE(ABORT, 'commercial category must match core product category'); END;

CREATE TRIGGER IF NOT EXISTS product_commercial_category_matches_core_on_update
BEFORE UPDATE OF category_id, product_sku ON product_commercial_data
WHEN (
  SELECT category_slug
  FROM category_commercial_data
  WHERE id = NEW.category_id
) <> (
  SELECT category_slug
  FROM products
  WHERE sku = NEW.product_sku
)
BEGIN SELECT RAISE(ABORT, 'commercial category must match core product category'); END;

CREATE TRIGGER IF NOT EXISTS product_commercial_pack_matches_kind
BEFORE INSERT ON product_commercial_data
WHEN NEW.is_pack <> CASE
  WHEN (SELECT kind FROM products WHERE sku = NEW.product_sku) = 'COMPOSITE' THEN 1
  ELSE 0
END
BEGIN SELECT RAISE(ABORT, 'commercial pack flag must match product kind'); END;

CREATE TRIGGER IF NOT EXISTS product_commercial_pack_matches_kind_on_update
BEFORE UPDATE OF is_pack, product_sku ON product_commercial_data
WHEN NEW.is_pack <> CASE
  WHEN (SELECT kind FROM products WHERE sku = NEW.product_sku) = 'COMPOSITE' THEN 1
  ELSE 0
END
BEGIN SELECT RAISE(ABORT, 'commercial pack flag must match product kind'); END;

CREATE TRIGGER IF NOT EXISTS product_commercial_ice_requires_pack
BEFORE INSERT ON product_commercial_data
WHEN NEW.ice_included = 1 AND NEW.is_pack = 0
BEGIN SELECT RAISE(ABORT, 'ice inclusion requires a pack'); END;

CREATE TRIGGER IF NOT EXISTS product_commercial_ice_requires_pack_on_update
BEFORE UPDATE OF ice_included, is_pack ON product_commercial_data
WHEN NEW.ice_included = 1 AND NEW.is_pack = 0
BEGIN SELECT RAISE(ABORT, 'ice inclusion requires a pack'); END;

CREATE TRIGGER IF NOT EXISTS category_commercial_id_is_stable
BEFORE UPDATE OF id ON category_commercial_data
WHEN NEW.id <> OLD.id
BEGIN SELECT RAISE(ABORT, 'category public id is immutable'); END;

CREATE TRIGGER IF NOT EXISTS product_commercial_id_is_stable
BEFORE UPDATE OF id ON product_commercial_data
WHEN NEW.id <> OLD.id
BEGIN SELECT RAISE(ABORT, 'product public id is immutable'); END;
