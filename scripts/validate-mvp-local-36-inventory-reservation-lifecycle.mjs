import { execFileSync } from 'node:child_process';
import { createHash } from 'node:crypto';
import { existsSync, readFileSync } from 'node:fs';

const PARENT_SHA = '01afcd0891b2b1da6c5bb595b9387300e3a4366f';
const CHILD_BRANCH = 'hielya/mvp-local-36-inventory-reservation-lifecycle-foundation';
const C002_DELIVERY_QUOTE_ALIGNMENT_CERTIFIED_SHA = '60d556e5ae088f2bf98101dcf37cbf854bcc2eff';
const COMMIT_COUNT_MINIMUM = 1;
const COMMIT_COUNT_MAXIMUM = 3;
const WORKFLOW_PATH = '.github/workflows/mvp-local-36-inventory-reservation-lifecycle-foundation-gate.yml';
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

const THIRD_COMMIT_ALLOWED_FILES = new Set([
  WORKFLOW_PATH,
  'scripts/validate-mvp-local-36-inventory-reservation-lifecycle.mjs',
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

const commitCount = Number(git('rev-list', '--count', `${PARENT_SHA}..HEAD`));
const thirdCommitFiles = commitCount === 3
  ? git('diff', '--name-only', 'HEAD^..HEAD').split('\n').filter(Boolean).sort()
  : [];
const unauthorizedThirdCommitFiles = thirdCommitFiles
  .filter((path) => !THIRD_COMMIT_ALLOWED_FILES.has(path));

if (process.env.GITHUB_ACTIONS === 'true') {
  assert(process.env.GITHUB_REF_NAME === CHILD_BRANCH, 'Workflow is not running on the authorized child branch');
  assert(git('merge-base', PARENT_SHA, 'HEAD') === PARENT_SHA, 'Certified parent is not the merge base');
  assert(commitCount >= COMMIT_COUNT_MINIMUM && commitCount <= COMMIT_COUNT_MAXIMUM,
    `Expected one to three commits over parent; found ${commitCount}`);
  assert(git('rev-list', '--merges', `${PARENT_SHA}..HEAD`) === '', 'Merge commits are prohibited in the Gate');
  if (commitCount === COMMIT_COUNT_MAXIMUM) {
    assert(unauthorizedThirdCommitFiles.length === 0,
      `Unauthorized third-commit files: ${unauthorizedThirdCommitFiles.join(', ')}`);
    assert(thirdCommitFiles.length === THIRD_COMMIT_ALLOWED_FILES.size
      && thirdCommitFiles.every((path) => THIRD_COMMIT_ALLOWED_FILES.has(path)),
    `Third commit must contain exactly the two authorized CI/governance files; found ${thirdCommitFiles.join(', ')}`);
  }
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
const workflow = readFileSync(WORKFLOW_PATH, 'utf8');

assert(workflow.includes(
  `C002_DELIVERY_QUOTE_ALIGNMENT_CERTIFIED_SHA: ${C002_DELIVERY_QUOTE_ALIGNMENT_CERTIFIED_SHA}`,
), 'Workflow is missing the certified C-002 Delivery Quote Alignment SHA');

const childJobStart = workflow.indexOf('  frozen-and-integration-regressions:');
const alignmentJobStart = workflow.indexOf('  c002-delivery-quote-alignment-frozen-regression:');
const c005JobStart = workflow.indexOf('  c005-frozen-regression:');
assert(childJobStart >= 0 && alignmentJobStart > childJobStart && c005JobStart > alignmentJobStart,
  'Workflow job boundaries are missing or out of order');

const childRegressionJob = workflow.slice(childJobStart, alignmentJobStart);
const alignmentFrozenJob = workflow.slice(alignmentJobStart, c005JobStart);

for (const value of [
  'ref: ${{ github.sha }}',
  'C-001 regression',
  'C-002 frozen regression',
  'C-002 Prequote Continuation regression',
  'Home Catalog integration regression',
  'Product Detail integration regression',
]) assert(childRegressionJob.includes(value), `Child regression job is missing: ${value}`);

for (const forbidden of [
  'tests/accessibility/c002-delivery-quote-api-alignment.a11y.spec.ts',
  'tests/functional/c002-delivery-quote-api-alignment.functional.spec.ts',
  'tests/visual/c002-delivery-quote-api-alignment.visual.spec.ts',
]) assert(!childRegressionJob.includes(forbidden),
  `Alignment regression still executes on the child SHA: ${forbidden}`);

for (const value of [
  'ref: ${{ env.C002_DELIVERY_QUOTE_ALIGNMENT_CERTIFIED_SHA }}',
  'test "$(git rev-parse HEAD)" = "$C002_DELIVERY_QUOTE_ALIGNMENT_CERTIFIED_SHA"',
  'version: 10.15.0',
  'node-version: 24',
  'pnpm install --frozen-lockfile',
  'pnpm build',
  'pnpm exec playwright install --with-deps chromium',
  'tests/accessibility/c002-delivery-quote-api-alignment.a11y.spec.ts',
  'tests/functional/c002-delivery-quote-api-alignment.functional.spec.ts',
  'tests/visual/c002-delivery-quote-api-alignment.visual.spec.ts',
  'playwright.c002-delivery-quote-api-alignment.config.ts',
]) assert(alignmentFrozenJob.includes(value), `Frozen Alignment job is missing: ${value}`);

assert(!alignmentFrozenJob.includes('${{ github.sha }}'),
  'Frozen Alignment job must not execute against the child SHA');
assert(workflow.includes(
  'needs: [persistence-validation, frozen-and-integration-regressions, c002-delivery-quote-alignment-frozen-regression, c005-frozen-regression]',
), 'Gate summary does not require every mandatory job');

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
console.log(`C002_DELIVERY_QUOTE_ALIGNMENT_CERTIFIED_SHA=${C002_DELIVERY_QUOTE_ALIGNMENT_CERTIFIED_SHA}`);
console.log(`COMMIT_COUNT=${commitCount}`);
console.log(`COMMIT_COUNT_MAXIMUM=${COMMIT_COUNT_MAXIMUM}`);
console.log(`THIRD_COMMIT_FILES=${thirdCommitFiles.join(',')}`);
console.log(`UNAUTHORIZED_THIRD_COMMIT_FILES=${unauthorizedThirdCommitFiles.join(',')}`);
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
