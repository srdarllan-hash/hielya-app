import { createHash } from 'node:crypto';
import { readFileSync } from 'node:fs';

const CORE_MIGRATION_PATH = '.dev-migrations/0001_mvp_local_36_persistence.sql';
const CORE_MIGRATION_SHA256 = 'ed360af8faec4d49bce41390d40c914d311acecafccf5abd54565709a80eb601';
const READ_MODEL_MIGRATION_PATH = '.dev-migrations/0002_mvp_local_36_catalog_read_model.sql';
const READ_MODEL_MIGRATION_SHA256 = 'be0ffd436c224a027992c4900523b5dc7c658fc465a775fcfcb3722a5fe0173b';
const LIFECYCLE_MIGRATION_PATH = '.dev-migrations/0003_mvp_local_36_inventory_reservation_lifecycle.sql';

const assert = (condition, message) => {
  if (!condition) throw new Error(message);
};

const sha256 = (value) => createHash('sha256').update(value).digest('hex');
const coreSchema = readFileSync(CORE_MIGRATION_PATH, 'utf8');
const readModelSchema = readFileSync(READ_MODEL_MIGRATION_PATH, 'utf8');
const lifecycleSchema = readFileSync(LIFECYCLE_MIGRATION_PATH, 'utf8');

assert(sha256(coreSchema) === CORE_MIGRATION_SHA256, 'Certified core persistence migration was modified');
assert(sha256(readModelSchema) === READ_MODEL_MIGRATION_SHA256, 'Certified catalog read-model migration was modified');

const requiredCoreContracts = [
  'categories',
  'products',
  'product_bundles',
  'product_bundle_components',
  'operational_settings',
  'inventory_balances',
  'inventory_reservations',
  'inventory_movements',
  'delivery_pins',
  'order_simulation_amounts',
  'inventory_rejects_composite',
];
for (const value of requiredCoreContracts) {
  assert(coreSchema.includes(value), `Missing certified persistence contract: ${value}`);
}
assert(!coreSchema.includes('commercially_active INTEGER NOT NULL DEFAULT 1'), 'Commercial activation must remain blocked');
assert(coreSchema.includes('CHECK (commercially_active = 0)'), 'Core schema must continue blocking commercial activation');

const requiredReadModelContracts = [
  'CREATE TABLE IF NOT EXISTS category_commercial_data',
  'category_slug TEXT PRIMARY KEY REFERENCES categories(slug)',
  'id TEXT NOT NULL UNIQUE',
  'public_visible INTEGER NOT NULL DEFAULT 0',
  'CREATE TABLE IF NOT EXISTS product_commercial_data',
  'product_sku TEXT PRIMARY KEY REFERENCES products(sku)',
  'category_id TEXT NOT NULL REFERENCES category_commercial_data(id)',
  'name TEXT NOT NULL',
  'sale_price_cents INTEGER NOT NULL',
  "currency TEXT NOT NULL CHECK (currency = 'EUR')",
  'max_per_order INTEGER NOT NULL',
  'contains_alcohol INTEGER NOT NULL',
  'minimum_age INTEGER NOT NULL',
  'is_pack INTEGER NOT NULL',
  'ice_included INTEGER NOT NULL',
  'sort_order INTEGER NOT NULL',
  'product_commercial_category_matches_core',
  'product_commercial_pack_matches_kind',
  'product_commercial_ice_requires_pack',
];
for (const value of requiredReadModelContracts) {
  assert(readModelSchema.includes(value), `Missing persistent catalog read-model contract: ${value}`);
}

const destructiveStatements = readModelSchema
  .split('\n')
  .map((line) => line.replace(/--.*$/, '').trim())
  .filter(Boolean)
  .filter((line) => /^(?:DROP|DELETE|TRUNCATE|REPLACE|ALTER\s+TABLE\s+\S+\s+(?:DROP|RENAME))\b/i.test(line));
assert(destructiveStatements.length === 0, `Read-model migration contains destructive SQL: ${destructiveStatements.join(' | ')}`);
assert(!/\b(?:ATTACH|DETACH|VACUUM)\b/i.test(readModelSchema), 'Read-model migration must not access or rewrite an external database');
assert(!/(?:postgres(?:ql)?|mysql|mongodb|production|prod[_-]?db|password|credential|secret)/i.test(
  readModelSchema.replace(/^--.*$/gm, ''),
), 'Read-model migration contains a production/database credential marker');

const requiredLifecycleContracts = [
  'ALTER TABLE inventory_reservations ADD COLUMN expires_at TEXT',
  'ALTER TABLE inventory_reservations ADD COLUMN released_at TEXT',
  'ALTER TABLE inventory_reservations ADD COLUMN converted_at TEXT',
  'ALTER TABLE inventory_reservations ADD COLUMN release_reason TEXT',
  'ALTER TABLE inventory_reservations ADD COLUMN request_fingerprint TEXT',
  'ALTER TABLE inventory_reservations ADD COLUMN updated_at TEXT',
  'inventory_reservation_ttl_seconds INTEGER',
  'NOT NULL DEFAULT 600',
  'ALTER TABLE inventory_movements ADD COLUMN reservation_id TEXT',
  'REFERENCES inventory_reservations(reservation_id)',
  "request_fingerprint = 'legacy-v1:'",
  'inventory_reservations_terminal_state_is_irreversible',
  'inventory_balances_require_integer_quantity',
  'inventory_reservation_items_require_integer_quantity',
  'inventory_movements_require_integer_quantities',
];
for (const value of requiredLifecycleContracts) {
  assert(lifecycleSchema.includes(value), `Missing reservation lifecycle schema contract: ${value}`);
}
const lifecycleWithoutComments = lifecycleSchema.replace(/^--.*$/gm, '');
const destructiveLifecycleStatements = lifecycleWithoutComments
  .split('\n')
  .map((line) => line.trim())
  .filter(Boolean)
  .filter((line) => /^(?:DROP|DELETE|TRUNCATE|REPLACE|ALTER\s+TABLE\s+\S+\s+(?:DROP|RENAME))\b/i.test(line));
assert(destructiveLifecycleStatements.length === 0,
  `Reservation lifecycle migration contains destructive SQL: ${destructiveLifecycleStatements.join(' | ')}`);
assert(!/\b(?:ATTACH|DETACH|VACUUM)\b/i.test(lifecycleWithoutComments),
  'Reservation lifecycle migration must not access or rewrite an external database');
assert(!/(?:postgres(?:ql)?|mysql|mongodb|prod[_-]?db|password|credential|secret)/i.test(
  lifecycleWithoutComments,
), 'Reservation lifecycle migration contains a production/database credential marker');

console.log(`CORE_MIGRATION_SHA256=${CORE_MIGRATION_SHA256}`);
console.log(`READ_MODEL_MIGRATION_SHA256=${READ_MODEL_MIGRATION_SHA256}`);
console.log(`RESERVATION_LIFECYCLE_MIGRATION_SHA256=${sha256(lifecycleSchema)}`);
console.log('MIGRATION_TYPE=ADDITIVE_FORWARD_ONLY_DEVELOPMENT_TEST');
console.log('MVP_PERSISTENCE_SCHEMA_VALID=true');
console.log('MVP_CATALOG_READ_MODEL_SCHEMA_VALID=true');
console.log('MVP_INVENTORY_RESERVATION_LIFECYCLE_SCHEMA_VALID=true');
