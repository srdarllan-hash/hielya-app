CREATE TABLE runtime_carts (
  cart_id TEXT PRIMARY KEY,
  customer_id TEXT REFERENCES customers(customer_id),
  revision INTEGER NOT NULL CHECK(revision > 0),
  items_json TEXT NOT NULL CHECK(json_valid(items_json)),
  reservation_id TEXT REFERENCES inventory_reservations(reservation_id),
  address_id TEXT REFERENCES runtime_addresses(address_id)
);
CREATE TABLE runtime_addresses (
  address_id TEXT PRIMARY KEY,
  customer_id TEXT NOT NULL REFERENCES customers(customer_id),
  formatted TEXT NOT NULL,
  latitude REAL NOT NULL CHECK(latitude BETWEEN -90 AND 90),
  longitude REAL NOT NULL CHECK(longitude BETWEEN -180 AND 180),
  kind TEXT NOT NULL
);
CREATE TABLE cart_command_receipts (
  scope TEXT NOT NULL,
  idempotency_key TEXT NOT NULL,
  fingerprint TEXT NOT NULL,
  result_json TEXT NOT NULL CHECK(json_valid(result_json)),
  PRIMARY KEY(scope,idempotency_key)
);
