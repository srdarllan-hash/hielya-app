import { execFileSync } from 'node:child_process';
import { createHash } from 'node:crypto';
import { existsSync, readFileSync } from 'node:fs';

const PARENT_SHA = '970b6ae295ff205d214afe6fe4f24ff073fcde27';
const CHILD_BRANCH = 'hielya/mvp-local-36-customer-authentication-foundation';
const OPENAPI_V1_SHA256 = 'a2c027c6294b44c94cf4be21d18fbd251b0323102e3c9ba2cba912a96d810ae9';
const OPENAPI_V1_1_SHA256 = '92e1ebcc1d817718a7f2fe9ef1ce93df60194e049d3e0349855bd4ddd24d2ec8';
const FROZEN_MIGRATIONS = new Map([
  ['.dev-migrations/0001_mvp_local_36_persistence.sql', 'ed360af8faec4d49bce41390d40c914d311acecafccf5abd54565709a80eb601'],
  ['.dev-migrations/0002_mvp_local_36_catalog_read_model.sql', 'be0ffd436c224a027992c4900523b5dc7c658fc465a775fcfcb3722a5fe0173b'],
  ['.dev-migrations/0003_mvp_local_36_inventory_reservation_lifecycle.sql', 'f6facd84bea224113412e23747de81d1c6ce32f40f44b6bfbec8482f93e0ec4c'],
]);
const FROZEN_0004_SHA256 = 'ef45d8bfe4b153da40f8be73948047a78d24402057e84238ff69891c0ec854e9';
const ALLOWED_CHANGED_FILES = new Set([
  '.dev-migrations/0004_mvp_local_36_customer_authentication_foundation.sql',
  '.github/workflows/mvp-local-36-customer-authentication-foundation-gate.yml',
  'packages/persistence/src/customer-auth.ts',
  'packages/persistence/src/index.ts',
  'packages/application/src/index.ts',
  'packages/application/src/auth/index.ts',
  'scripts/validate-mvp-local-36-customer-authentication-foundation.mjs',
  'scripts/validate-mvp-local-36-public-service-api.mjs',
  'scripts/validate-mvp-persistence-schema.mjs',
  'tests/unit/mvp-customer-authentication-concurrency.test.ts',
  'tests/unit/mvp-customer-authentication-foundation.test.ts',
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
const untracked = git('ls-files', '--others', '--exclude-standard').split('\n').filter(Boolean);
const changedFiles = [...new Set([...committed, ...worktree, ...untracked])].sort();
const unauthorized = changedFiles.filter((path) => !ALLOWED_CHANGED_FILES.has(path));
assert(unauthorized.length === 0, `Unauthorized files changed: ${unauthorized.join(', ')}`);

if (process.env.GITHUB_ACTIONS === 'true') {
  assert(process.env.GITHUB_REF_NAME === CHILD_BRANCH, 'Workflow is not on the authorized child branch');
  assert(git('merge-base', PARENT_SHA, 'HEAD') === PARENT_SHA, 'Certified parent is not the merge base');
  const commitCount = Number(git('rev-list', '--count', `${PARENT_SHA}..HEAD`));
  assert(commitCount >= 1 && commitCount <= 5, `Expected one to five commits; found ${commitCount}`);
  assert(git('rev-list', '--merges', `${PARENT_SHA}..HEAD`) === '', 'Merge commits are prohibited');
}

assert(sha256('contracts/openapi/HIELYA_OPENAPI_V1_0.yaml') === OPENAPI_V1_SHA256,
  'OpenAPI V1.0 was modified');
assert(sha256('contracts/openapi/HIELYA_OPENAPI_MVP_LOCAL_36_V1_1.yaml') === OPENAPI_V1_1_SHA256,
  'OpenAPI MVP V1.1 was modified');
for (const [path, expected] of FROZEN_MIGRATIONS) {
  assert(sha256(path) === expected, `Certified migration was modified: ${path}`);
}
assert(sha256('.dev-migrations/0004_mvp_local_36_customer_authentication_foundation.sql') === FROZEN_0004_SHA256,
  'Migration 0004 was modified');
for (const path of ALLOWED_CHANGED_FILES) assert(existsSync(path), `Required Gate file is missing: ${path}`);

const migration = readFileSync('.dev-migrations/0004_mvp_local_36_customer_authentication_foundation.sql', 'utf8');
const implementation = readFileSync('packages/application/src/auth/index.ts', 'utf8');
const persistence = readFileSync('packages/persistence/src/index.ts', 'utf8');
const persistenceAdapter = readFileSync('packages/persistence/src/customer-auth.ts', 'utf8');
const lifecycleTests = readFileSync('tests/unit/mvp-customer-authentication-foundation.test.ts', 'utf8');
const concurrencyTests = readFileSync('tests/unit/mvp-customer-authentication-concurrency.test.ts', 'utf8');

for (const value of [
  "phoneScope: 'ES'", "countryCallingCode: '+34'", 'nationalNumberLength: 9',
  'otpLength: 6', 'otpTtlSeconds: 300', 'otpResendCooldownSeconds: 60',
  'otpMaxVerificationAttempts: 5', "smsProvider: 'SIMULATED'",
  'customerSessionTtlSeconds: 2_592_000', "customerSessionExpiryMode: 'ABSOLUTE'",
  'publicBrowsingRequiresLogin: false', 'checkoutRequiresLogin: true',
]) assert(lifecycleTests.includes(value), `Missing owner-policy evidence: ${value}`);

for (const value of [
  'scryptSync', 'timingSafeEqual', 'createHmac', 'challengeId}:${otp}',
  'AUTH_CONFIGURATION_UNAVAILABLE', 'OtpDeliveryPort', 'OtpPepperPort',
  'CustomerAuthenticationRepositoryPort', 'tokenHash(token)',
]) {
  assert(implementation.includes(value), `Missing application authentication contract: ${value}`);
}
assert(persistence.includes('BEGIN IMMEDIATE'), 'Persistence write transactions are missing');
assert(persistenceAdapter.includes('SqliteCustomerAuthenticationRepository'), 'SQLite authentication adapter is missing');
assert(!persistence.includes('CustomerAuthenticationService') && !persistenceAdapter.includes('CustomerAuthenticationService'), 'Persistence exports an authentication service');
assert(!/packages\/persistence|MvpPersistenceDatabase|DatabaseSync|\bSELECT\b|\bINSERT\b|\bUPDATE\b|\btransaction\b/.test(implementation), 'Application leaks persistence or SQL');
for (const value of [
  'customer_otp_one_pending_per_phone', 'phone_e164 TEXT NOT NULL UNIQUE',
  'otp_salt TEXT NOT NULL', 'otp_hash TEXT NOT NULL', 'token_hash TEXT NOT NULL UNIQUE',
  "DEFAULT 'SIMULATED'", "status IN ('PENDING', 'DELIVERED', 'FAILED')",
  'simulated_sms_delivery_terminal_state_is_irreversible',
  'NOT NULL DEFAULT 2592000',
]) assert(migration.includes(value), `Missing authentication persistence contract: ${value}`);

for (const forbidden of ['jsonwebtoken', 'jose', 'bcrypt', 'argon2', 'twilio', 'otp_code', 'session_token']) {
  assert(!`${migration}\n${implementation}`.toLowerCase().includes(forbidden),
    `Forbidden dependency or plaintext field detected: ${forbidden}`);
}
for (const evidence of [
  'never persists the raw OTP or raw session token',
  'locks on the fifth invalid attempt',
  'counts resend cooldown from a late lock, not challenge creation',
  'dispatches simulated SMS outside the write transaction and records failures safely',
  'rejects malformed entropy before persisting an OTP or session',
  'expires challenges and sessions at the exact absolute deadline',
]) assert(lifecycleTests.includes(evidence), `Missing lifecycle evidence: ${evidence}`);
for (const evidence of [
  'BEGIN IMMEDIATE', 'one pending challenge and delivery',
  'verified only once', 'atomically increments failed attempts',
]) assert(concurrencyTests.includes(evidence), `Missing concurrency evidence: ${evidence}`);

const changedForbiddenRoots = changedFiles.filter((path) => (
  path.startsWith('apps/')
  || path.startsWith('contracts/')
  || path.startsWith('packages/ui/')
  || path.startsWith('packages/location/')
  || path.startsWith('manifests/')
));
assert(changedForbiddenRoots.length === 0,
  `Forbidden public/UI/application area changed: ${changedForbiddenRoots.join(', ')}`);

console.log(`PARENT_SHA=${PARENT_SHA}`);
console.log(`CHANGED_FILES=${changedFiles.join(',')}`);
console.log('PHONE_SCOPE=ES');
console.log('COUNTRY_CALLING_CODE=+34');
console.log('OTP_LENGTH=6');
console.log('OTP_TTL_SECONDS=300');
console.log('OTP_RESEND_COOLDOWN_SECONDS=60');
console.log('OTP_MAX_VERIFICATION_ATTEMPTS=5');
console.log('SMS_PROVIDER=SIMULATED');
console.log('CUSTOMER_SESSION_TTL_SECONDS=2592000');
console.log('SESSION_EXPIRY_MODE=ABSOLUTE');
console.log('OPENAPI_MODIFIED=false');
console.log('PUBLIC_ENDPOINTS_CREATED=false');
console.log('UI_CHANGED=false');
console.log('NEW_DEPENDENCIES=false');
console.log('CUSTOMER_AUTHENTICATION_FOUNDATION_GATE_VALID=true');
