import { createHash } from 'node:crypto';
import { execFileSync } from 'node:child_process';
import { readFileSync } from 'node:fs';
import { isDeepStrictEqual } from 'node:util';

const PARENT_SHA = '68d5f5422a9dff560b301c17fe1bce466ac7281a';
const CHILD_BRANCH = 'hielya/mvp-local-36-auth-http-opaque-session';
const V10 = 'contracts/openapi/HIELYA_OPENAPI_V1_0.yaml';
const V11 = 'contracts/openapi/HIELYA_OPENAPI_MVP_LOCAL_36_V1_1.yaml';
const V12 = 'contracts/openapi/HIELYA_OPENAPI_MVP_LOCAL_36_V1_2.yaml';
const PROFILE = 'contracts/openapi/MVP_LOCAL_36_AUTH_IMPLEMENTATION_PROFILE_V1_2.json';
const ADR = 'docs/decisions/ADR-MVP-LOCAL-36-OPAQUE-CUSTOMER-SESSION-V1-2.md';

const assert = (condition, message) => {
  if (!condition) throw new Error(message);
};
const source = (path) => readFileSync(path, 'utf8');
const json = (path) => JSON.parse(source(path));
const sha256 = (path) => createHash('sha256').update(readFileSync(path)).digest('hex');

assert(sha256(V10) === 'a2c027c6294b44c94cf4be21d18fbd251b0323102e3c9ba2cba912a96d810ae9', 'OpenAPI V1.0 changed');
assert(sha256(V11) === '92e1ebcc1d817718a7f2fe9ef1ce93df60194e049d3e0349855bd4ddd24d2ec8', 'OpenAPI V1.1 changed');

const v11 = json(V11);
const v12 = json(V12);
assert(v12.openapi === '3.1.1', 'V1.2 must use OpenAPI 3.1.1');
assert(v12.jsonSchemaDialect === 'https://json-schema.org/draft/2020-12/schema', 'V1.2 JSON Schema dialect changed');
assert(v12.info?.version === '1.2.0', 'V1.2 contract version is invalid');
assert(v12.servers?.length === 1 && v12.servers[0]?.url === '/api/v1', 'V1.2 server base is invalid');

for (const [path, value] of Object.entries(v11.paths)) {
  assert(isDeepStrictEqual(v12.paths[path], value), `V1.1 path changed in V1.2: ${path}`);
}
for (const [name, value] of Object.entries(v11.components.schemas)) {
  assert(isDeepStrictEqual(v12.components.schemas[name], value), `V1.1 schema changed in V1.2: ${name}`);
}
const addedPaths = Object.keys(v12.paths).filter((path) => !(path in v11.paths)).sort();
assert(isDeepStrictEqual(addedPaths, ['/auth/otp/request', '/auth/otp/verify']), 'V1.2 must add exactly two auth paths');
assert(v12.paths['/auth/otp/request']?.post?.operationId === 'requestCustomerOtp', 'request operationId invalid');
assert(v12.paths['/auth/otp/verify']?.post?.operationId === 'verifyCustomerOtp', 'verify operationId invalid');
assert(v12.paths['/carts/{cartId}/validate']?.post?.['x-hielya-implementation-status'] === 'DEFERRED_AUTH_CART_LAYER', 'cart validation is no longer deferred');

const operationIds = Object.values(v12.paths).flatMap((path) => (
  Object.values(path).flatMap((operation) => operation?.operationId ? [operation.operationId] : [])
));
assert(operationIds.length === new Set(operationIds).size, 'operationIds must be unique');

const localReferences = [];
const collectReferences = (value) => {
  if (Array.isArray(value)) return value.forEach(collectReferences);
  if (!value || typeof value !== 'object') return;
  for (const [key, child] of Object.entries(value)) {
    if (key === '$ref') localReferences.push(child);
    else collectReferences(child);
  }
};
collectReferences(v12);
for (const reference of localReferences) {
  assert(typeof reference === 'string' && reference.startsWith('#/'), `non-local reference: ${reference}`);
  const resolved = reference.slice(2).split('/').reduce((value, segment) => (
    value?.[segment.replaceAll('~1', '/').replaceAll('~0', '~')]
  ), v12);
  assert(resolved !== undefined, `unresolved reference: ${reference}`);
}

const requestSchema = v12.components.schemas.OtpRequest;
assert(requestSchema?.additionalProperties === false, 'OtpRequest must be strict');
assert(isDeepStrictEqual(requestSchema.required, ['phoneE164', 'locale']), 'OtpRequest required fields invalid');
assert(requestSchema.properties?.phoneE164?.pattern === '^\\+34[0-9]{9}$', 'OtpRequest phone pattern invalid');
assert(isDeepStrictEqual(requestSchema.properties?.locale?.enum, ['es-ES', 'en-GB', 'pt-BR']), 'OtpRequest locale enum invalid');
const verifySchema = v12.components.schemas.OtpVerify;
assert(verifySchema?.additionalProperties === false, 'OtpVerify must be strict');
assert(isDeepStrictEqual(verifySchema.required, ['challengeId', 'code']), 'OtpVerify required fields invalid');
assert(isDeepStrictEqual(Object.keys(verifySchema.properties), ['challengeId', 'code']), 'OtpVerify accepts an unauthorized field');
assert(v12.components.schemas.OpaqueSessionAuthentication?.required?.join(',') === 'sessionToken,expiresInSeconds,customer', 'opaque session response invalid');
assert(v12.components.securitySchemes.customerBearer?.bearerFormat === 'OpaqueSessionToken', 'customerBearer is not opaque');

const lineage = v12['x-hielya-lineage'];
assert(lineage?.length === 2, 'V1.2 lineage is incomplete');
assert(lineage[0]?.sha256 === sha256(V10) && lineage[0]?.modified === false, 'V1.0 lineage invalid');
assert(lineage[1]?.sha256 === sha256(V11) && lineage[1]?.modified === false, 'V1.1 lineage invalid');

const v12Source = source(V12);
for (const forbidden of ['TokenPair', 'accessToken', 'refreshToken', 'bearerFormat": "JWT', '/auth/refresh']) {
  assert(!v12Source.includes(forbidden), `V1.2 contains forbidden contract: ${forbidden}`);
}
const profile = json(PROFILE);
assert(profile.contractVersion === '1.2.0', 'auth implementation profile version invalid');
assert(profile.session?.strategy === 'OPAQUE_SERVER_SESSION', 'opaque session profile missing');
assert(profile.session?.ttlSeconds === 2_592_000, 'session TTL invalid');
assert(profile.securityScheme?.bearerFormat === 'OpaqueSessionToken', 'profile bearer format invalid');
assert(profile.IMPLEMENT_NOW?.length === 2, 'profile must authorize exactly two endpoints');
assert(source(ADR).includes('POST /api/v1/auth/otp/verify'), 'ADR is incomplete');

const application = source('packages/application/src/auth/index.ts');
const persistence = source('packages/persistence/src/customer-auth.ts');
const http = source('apps/ui-lab/src/server/mvp-local-36/auth-http.ts');
const container = source('apps/ui-lab/src/server/mvp-local-36/auth-container.ts');
assert(application.includes('findChallengeById(challengeId'), 'challenge lookup port is missing');
assert(application.includes("execute(input: { challengeId: string; otp: string;"), 'verify application input is invalid');
assert(!application.includes('challengeId: string; phone: string; otp:'), 'verify still accepts phone');
assert(persistence.includes('findChallengeById(challengeId'), 'SQLite challenge lookup is missing');
assert(http.includes("strictFields(input, ['challengeId', 'code'])"), 'HTTP verify fields are not strict');
assert(http.includes("'cache-control': 'no-store'") && http.includes("pragma: 'no-cache'"), 'auth cache headers missing');
assert(!/console\.(?:log|info|warn|error)/.test(http + container), 'auth runtime logs sensitive transport');
assert(container.includes("process.env.NODE_ENV === 'production'"), 'production block missing');
assert(container.includes('HIELYA_MVP_LOCAL_36_DATABASE_PATH') && container.includes('HIELYA_OTP_PEPPER'), 'runtime configuration missing');

if (process.env.GITHUB_ACTIONS === 'true') {
  const branch = process.env.GITHUB_REF_NAME;
  assert(branch === CHILD_BRANCH, `wrong workflow branch: ${branch}`);
  const mergeBase = execFileSync('git', ['merge-base', PARENT_SHA, 'HEAD'], { encoding: 'utf8' }).trim();
  assert(mergeBase === PARENT_SHA, 'branch does not descend from exact parent');
  const commits = Number(execFileSync('git', ['rev-list', '--count', `${PARENT_SHA}..HEAD`], { encoding: 'utf8' }).trim());
  assert(commits >= 1 && commits <= 2, 'commit count outside Gate limit');
  assert(!execFileSync('git', ['rev-list', '--merges', `${PARENT_SHA}..HEAD`], { encoding: 'utf8' }).trim(), 'merge commit prohibited');

  const changed = execFileSync('git', ['diff', '--name-only', `${PARENT_SHA}..HEAD`], { encoding: 'utf8' })
    .trim().split(/\r?\n/).filter(Boolean);
  const allowed = [
    /^contracts\/openapi\/HIELYA_OPENAPI_MVP_LOCAL_36_V1_2\.yaml$/,
    /^contracts\/openapi\/MVP_LOCAL_36_AUTH_IMPLEMENTATION_PROFILE_V1_2\.json$/,
    /^docs\/decisions\/ADR-MVP-LOCAL-36-OPAQUE-CUSTOMER-SESSION-V1-2\.md$/,
    /^packages\/application\/src\/auth\//,
    /^packages\/persistence\/src\/customer-auth\.ts$/,
    /^apps\/ui-lab\/app\/api\/v1\/auth\/otp\/(?:request|verify)\/route\.ts$/,
    /^apps\/ui-lab\/src\/server\/mvp-local-36\/auth-(?:http|container)\.ts$/,
    /^tests\/unit\/mvp-(?:auth|customer-authentication)/,
    /^tests\/unit\/mvp-local-36-api-host-architecture\.test\.ts$/,
    /^scripts\/validate-mvp-local-36-auth-http-opaque-session\.mjs$/,
    /^\.github\/workflows\/mvp-local-36-auth-http-opaque-session-gate\.yml$/,
  ];
  const outside = changed.filter((path) => !allowed.some((pattern) => pattern.test(path)));
  assert(outside.length === 0, `files outside Gate scope: ${outside.join(', ')}`);
  assert(!changed.some((path) => path.startsWith('.dev-migrations/')), 'migration changed');
  assert(!changed.some((path) => path.startsWith('packages/ui/') || path.startsWith('apps/ui-lab/app/') && !path.includes('/api/v1/auth/')), 'UI changed');
  assert(!changed.some((path) => /(?:package\.json|pnpm-lock\.yaml)$/.test(path)), 'dependency manifest changed');
}

console.log('CUSTOMER_AUTHENTICATION_PUBLIC_CONTRACT_V1_2_AND_HTTP_TRANSPORT_GATE=PASS');
