import { createHash } from 'node:crypto';
import { readFileSync } from 'node:fs';

const CORE_MIGRATION_PATH = '.dev-migrations/0001_mvp_local_36_persistence.sql';
const CORE_MIGRATION_SHA256 = 'ed360af8faec4d49bce41390d40c914d311acecafccf5abd54565709a80eb601';
const READ_MODEL_MIGRATION_PATH = '.dev-migrations/0002_mvp_local_36_catalog_read_model.sql';

const assert = (condition, message) => {
  if (!condition) throw new Error(message);
};

const sha256 = (value) => createHash('sha256').update(value).digest('hex');
const coreSchema = readFileSync(CORE_MIGRATION_PATH, 'utf8');
const readModelSchema = readFileSync(READ_MODEL_MIGRATION_PATH, 'utf8');

assert(sha256(coreSchema) === CORE_MIGRATION_SHA256, 'Certified core persistence migration was modified');

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

console.log(`CORE_MIGRATION_SHA256=${CORE_MIGRATION_SHA256}`);
console.log(`READ_MODEL_MIGRATION_SHA256=${sha256(readModelSchema)}`);
console.log('MIGRATION_TYPE=ADDITIVE_FORWARD_ONLY_DEVELOPMENT_TEST');
console.log('MVP_PERSISTENCE_SCHEMA_VALID=true');
console.log('MVP_CATALOG_READ_MODEL_SCHEMA_VALID=true');
