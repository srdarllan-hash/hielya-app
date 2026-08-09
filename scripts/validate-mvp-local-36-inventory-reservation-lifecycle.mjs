import { execFileSync } from 'node:child_process';
import { createHash } from 'node:crypto';
import { existsSync, readFileSync } from 'node:fs';

const PARENT_SHA = '01afcd0891b2b1da6c5bb595b9387300e3a4366f';
const CHILD_BRANCH = 'hielya/mvp-local-36-inventory-reservation-lifecycle-foundation';
const OPENAPI_V1_SHA256 = 'a2c027c6294b44c94cf4be21d18fbd251b0323102e3c9ba2cba912a96d810ae9';
const OPENAPI_V1_1_SHA256 = '92e1ebcc1d817718a7f2fe9ef1ce93df60194e049d3e0349855bd4ddd24d2ec8';
const MIGRATION_0001_SHA256 = 'ed360af8faec4d49bce41390d40c914d311acecafccf5abd54565709a80eb601';
const MIGRATION_0002_SHA256 = 'be0ffd436c224a027992c4900523b5dc7c658fc465a775fcfcb3722a5fe0173b';

const ALLOWED_CHANGED_FILES = new Set([
  '.dev-migrations/0003_mvp_local_36_inventory_reservation_lifecycle.sql',
  '.github/workflows/mvp-local-36-inventory-reservation-lifecycle-foundation-gate.yml',
  'packages/persistence/src/index.ts',
  'scripts/validate-mvp-local-36-inventory-reservation-lifecycle.mjs',
  'scripts/validate-mvp-persistence-schema.mjs',
  'tests/unit/mvp-catalog-read-model.test.ts',
  'tests/unit/mvp-inventory-reservation-concurrency.test.ts',
  'tests/unit/mvp-inventory-reservation-lifecycle.test.ts',
  'tests/unit/mvp-persistence.test.ts',
]);

const assert = (condition, message) => {
  if (!condition) throw new Error(message);
};
const git = (...args) => execFileSync('git', args, { encoding: 'utf8' }).trim();
const sha256 = (path) => createHash('sha256').update(readFileSync(path)).digest('hex');

const committed = git('diff', '--name-only', `${PARENT_SHA}..HEAD`).split('\n').filter(Boolean);
const worktree = git('diff', '--name-only').split('\n').filter(Boolean);
const untracked = git('ls-files', '--others', '--exclude-standard')
  .split('\n')
  .filter(Boolean)
  .filter((path) => path !== 'tsconfig.tsbuildinfo');
const changedFiles = [...new Set([...committed, ...worktree, ...untracked])].sort();
const unauthorized = changedFiles.filter((path) => !ALLOWED_CHANGED_FILES.has(path));
assert(unauthorized.length === 0, `Unauthorized files changed: ${unauthorized.join(', ')}`);

if (process.env.GITHUB_ACTIONS === 'true') {
  assert(process.env.GITHUB_REF_NAME === CHILD_BRANCH, 'Workflow is not running on the authorized child branch');
  assert(git('merge-base', PARENT_SHA, 'HEAD') === PARENT_SHA, 'Certified parent is not the merge base');
  const commitCount = Number(git('rev-list', '--count', `${PARENT_SHA}..HEAD`));
  assert(commitCount >= 1 && commitCount <= 2, `Expected one or two commits over parent; found ${commitCount}`);
  assert(git('rev-list', '--merges', `${PARENT_SHA}..HEAD`) === '', 'Merge commits are prohibited in the Gate');
}

assert(sha256('contracts/openapi/HIELYA_OPENAPI_V1_0.yaml') === OPENAPI_V1_SHA256,
  'OpenAPI V1.0 was modified');
assert(sha256('contracts/openapi/HIELYA_OPENAPI_MVP_LOCAL_36_V1_1.yaml') === OPENAPI_V1_1_SHA256,
  'OpenAPI MVP V1.1 was modified');
assert(sha256('.dev-migrations/0001_mvp_local_36_persistence.sql') === MIGRATION_0001_SHA256,
  'Migration 0001 was modified');
assert(sha256('.dev-migrations/0002_mvp_local_36_catalog_read_model.sql') === MIGRATION_0002_SHA256,
  'Migration 0002 was modified');

for (const path of ALLOWED_CHANGED_FILES) assert(existsSync(path), `Required Gate file is missing: ${path}`);

const persistence = readFileSync('packages/persistence/src/index.ts', 'utf8');
const migration = readFileSync(
  '.dev-migrations/0003_mvp_local_36_inventory_reservation_lifecycle.sql',
  'utf8',
);
const lifecycleTests = readFileSync('tests/unit/mvp-inventory-reservation-lifecycle.test.ts', 'utf8');
const concurrencyTests = readFileSync('tests/unit/mvp-inventory-reservation-concurrency.test.ts', 'utf8');

for (const value of [
  'reserveInventory(',
  'releaseReservation(',
  'expireDueReservations(',
  'convertReservation(',
  "REQUEST_FINGERPRINT_PREFIX = 'request-v1:'",
  "LEGACY_FINGERPRINT_PREFIX = 'legacy-v1:'",
  'inventoryReservationTtlSeconds',
  "reservation.status = 'ACTIVE'",
  'reservation.expires_at > ?',
  'inventory adjustment would fall below active reservations',
  'RESERVATION_CONVERTED',
]) assert(persistence.includes(value), `Missing reservation lifecycle implementation contract: ${value}`);

assert(!persistence.includes('quantityAvailable: Math.max'), 'Negative availability must not be masked');
assert(migration.includes('NOT NULL DEFAULT 600'), 'Certified persisted TTL is missing');
assert(migration.includes('reservation_id TEXT'), 'Movement reservation linkage is missing');
assert(lifecycleTests.includes('request-v1:'), 'Request fingerprint tests are missing');
assert(lifecycleTests.includes('legacy-v1:'), 'Legacy fingerprint tests are missing');
for (const value of [
  'BEGIN IMMEDIATE',
  'locked|busy',
  'convert versus release',
  'expiration win over conversion',
  'same-reference replay',
]) assert(concurrencyTests.includes(value), `Missing multi-connection evidence: ${value}`);

const publicAdapter = readFileSync('packages/persistence/src/public-api-read-adapter.ts', 'utf8');
for (const forbidden of [
  'quantityOnHand',
  'quantityReserved',
  'quantityAvailable',
  'requestFingerprint',
  'expiresAt',
  'reservationId',
]) assert(!publicAdapter.includes(forbidden), `Public adapter exposes an internal field: ${forbidden}`);

console.log(`PARENT_SHA=${PARENT_SHA}`);
console.log(`CHANGED_FILES=${changedFiles.join(',')}`);
console.log('MIGRATION_TYPE=ADDITIVE_FORWARD_ONLY_DEVELOPMENT_TEST');
console.log('TTL_SECONDS=600');
console.log('TIME_REPRESENTATION=UTC_ISO_8601_MILLISECONDS_Z');
console.log('REQUEST_FINGERPRINT_PREFIX=request-v1:');
console.log('LEGACY_FINGERPRINT_PREFIX=legacy-v1:');
console.log('PUBLIC_NUMERIC_STOCK_FIELDS=false');
console.log('OPENAPI_MODIFIED=false');
console.log('NEW_DEPENDENCIES=false');
console.log('INVENTORY_RESERVATION_LIFECYCLE_GATE_VALID=true');
