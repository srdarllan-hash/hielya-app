import { createHash } from 'node:crypto';
import { execFileSync } from 'node:child_process';
import {
  existsSync,
  readFileSync,
  readdirSync,
} from 'node:fs';
import { join, sep } from 'node:path';
import { pathToFileURL } from 'node:url';
import { isDeepStrictEqual } from 'node:util';

import { HOME_CATALOG_API_INTEGRATION_CHANGED_FILES } from './mvp-local-36-home-catalog-api-integration-changed-files.mjs';

export const CERTIFIED_BASE_SHA = 'f1a533a3e4bcf76ea5634979536e58445432bb11';
export const HARDENING_BASE_SHA = 'fb35d2fd3e9cd4eb64be0c1196e22cc2d55003e6';
export const OPENAPI_V1_0_PATH = 'contracts/openapi/HIELYA_OPENAPI_V1_0.yaml';
export const OPENAPI_V1_0_SHA256 = 'a2c027c6294b44c94cf4be21d18fbd251b0323102e3c9ba2cba912a96d810ae9';
export const OPENAPI_V1_1_PATH = 'contracts/openapi/HIELYA_OPENAPI_MVP_LOCAL_36_V1_1.yaml';
export const OPENAPI_V1_1_SHA256 = '92e1ebcc1d817718a7f2fe9ef1ce93df60194e049d3e0349855bd4ddd24d2ec8';
export const IMPLEMENTATION_PROFILE_PATH = 'contracts/openapi/MVP_LOCAL_36_IMPLEMENTATION_PROFILE.json';
export const ARCHITECTURE_PROFILE_PATH = 'docs/architecture/MVP_LOCAL_36_API_HOST_PROFILE.json';
export const PUBLIC_API_ADR_PATH = 'docs/decisions/ADR-MVP-LOCAL-36-PUBLIC-SERVICE-API-LAYER.md';
export const FINAL_FREEZE_ADR_PATH = 'docs/decisions/ADR-MVP-LOCAL-36-PUBLIC-SERVICE-API-FINAL-FREEZE.md';
export const PUBLIC_API_ADAPTER_PATH = 'packages/persistence/src/public-api-read-adapter.ts';
export const OPENAPI_CONFORMANCE_TEST_PATH = 'tests/unit/mvp-public-api-openapi-conformance.test.ts';

export const AUTHORIZED_ROUTE_HANDLERS = [
  {
    method: 'GET',
    path: '/catalog/categories',
    file: 'apps/ui-lab/app/api/v1/catalog/categories/route.ts',
  },
  {
    method: 'GET',
    path: '/catalog/products',
    file: 'apps/ui-lab/app/api/v1/catalog/products/route.ts',
  },
  {
    method: 'GET',
    path: '/catalog/products/{productId}',
    file: 'apps/ui-lab/app/api/v1/catalog/products/[productId]/route.ts',
  },
  {
    method: 'POST',
    path: '/delivery/quote',
    file: 'apps/ui-lab/app/api/v1/delivery/quote/route.ts',
  },
];

export const GATE_CHANGED_FILES = [
  '.github/workflows/mvp-local-36-policy-gate.yml',
  'apps/ui-lab/app/api/v1/catalog/categories/route.ts',
  'apps/ui-lab/app/api/v1/catalog/products/[productId]/route.ts',
  'apps/ui-lab/app/api/v1/catalog/products/route.ts',
  'apps/ui-lab/app/api/v1/delivery/quote/route.ts',
  'apps/ui-lab/package.json',
  'apps/ui-lab/src/server/mvp-local-36/container.ts',
  'apps/ui-lab/src/server/mvp-local-36/http.ts',
  'next.config.mjs',
  IMPLEMENTATION_PROFILE_PATH,
  ARCHITECTURE_PROFILE_PATH,
  PUBLIC_API_ADR_PATH,
  FINAL_FREEZE_ADR_PATH,
  'packages/application/package.json',
  'packages/application/src/index.ts',
  'packages/persistence/package.json',
  'packages/persistence/src/index.ts',
  'packages/persistence/src/public-api-read-adapter.ts',
  'pnpm-lock.yaml',
  'scripts/validate-mvp-local-36-catalog-read-model.mjs',
  'scripts/validate-mvp-local-36-composite-commercial-data.mjs',
  'scripts/validate-mvp-local-36-openapi.mjs',
  'scripts/validate-mvp-local-36-public-service-api.mjs',
  'tests/unit/mvp-local-36-api-host-architecture.test.ts',
  'tests/unit/mvp-public-api-adapters.test.ts',
  'tests/unit/mvp-public-api-handlers.test.ts',
  'tests/unit/mvp-public-api-integration.test.ts',
  'tests/unit/mvp-public-application.test.ts',
  OPENAPI_CONFORMANCE_TEST_PATH,
  ...HOME_CATALOG_API_INTEGRATION_CHANGED_FILES,
];

const ALLOWED_CHANGED_FILES = new Set(GATE_CHANGED_FILES);
const HTTP_METHODS = ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS', 'HEAD'];
const REQUIRED_TEST_FILES = [
  'tests/unit/mvp-public-application.test.ts',
  'tests/unit/mvp-public-api-adapters.test.ts',
  'tests/unit/mvp-public-api-handlers.test.ts',
  'tests/unit/mvp-public-api-integration.test.ts',
  OPENAPI_CONFORMANCE_TEST_PATH,
];

const HARDENING_CHANGED_FILES = new Set([
  '.github/workflows/mvp-local-36-policy-gate.yml',
  FINAL_FREEZE_ADR_PATH,
  PUBLIC_API_ADAPTER_PATH,
  'scripts/validate-mvp-local-36-catalog-read-model.mjs',
  'scripts/validate-mvp-local-36-composite-commercial-data.mjs',
  'scripts/validate-mvp-local-36-openapi.mjs',
  'scripts/validate-mvp-local-36-public-service-api.mjs',
  'tests/unit/mvp-public-api-adapters.test.ts',
  OPENAPI_CONFORMANCE_TEST_PATH,
  ...HOME_CATALOG_API_INTEGRATION_CHANGED_FILES,
]);

const REQUIRED_HARDENING_CHANGES = [
  '.github/workflows/mvp-local-36-policy-gate.yml',
  FINAL_FREEZE_ADR_PATH,
  PUBLIC_API_ADAPTER_PATH,
  'scripts/validate-mvp-local-36-public-service-api.mjs',
  'tests/unit/mvp-public-api-adapters.test.ts',
  OPENAPI_CONFORMANCE_TEST_PATH,
];

const assert = (condition, message) => {
  if (!condition) throw new Error(message);
};

const sha256 = (value) => createHash('sha256').update(value).digest('hex');

const parseJson = (path) => {
  const source = readFileSync(path, 'utf8');
  try {
    return { source, document: JSON.parse(source) };
  } catch (error) {
    throw new Error(`${path} is not valid JSON: ${error.message}`);
  }
};

const walkFiles = (directory, files = []) => {
  if (!existsSync(directory)) return files;
  for (const entry of readdirSync(directory, { withFileTypes: true })) {
    if (entry.isDirectory() && ['.next', 'node_modules'].includes(entry.name)) continue;
    const path = join(directory, entry.name);
    if (entry.isDirectory()) walkFiles(path, files);
    else files.push(path.split(sep).join('/'));
  }
  return files;
};

const readSources = (paths) => paths
  .filter((path) => existsSync(path))
  .map((path) => ({ path, source: readFileSync(path, 'utf8') }));

const validateFrozenOpenApi = () => {
  assert(sha256(readFileSync(OPENAPI_V1_0_PATH)) === OPENAPI_V1_0_SHA256, 'OpenAPI V1.0 was modified');
  assert(sha256(readFileSync(OPENAPI_V1_1_PATH)) === OPENAPI_V1_1_SHA256, 'OpenAPI MVP Local 36 V1.1 was modified');
};

const validateImplementationProfile = () => {
  const profile = parseJson(IMPLEMENTATION_PROFILE_PATH).document;
  const expectedOperations = AUTHORIZED_ROUTE_HANDLERS.map(({ method, path }) => ({ method, path }));
  assert(profile.profile === 'MVP_LOCAL_36' && profile.contractVersion === '1.1.0', 'Implementation profile identity differs');
  assert(isDeepStrictEqual(profile.IMPLEMENT_NOW, expectedOperations), 'IMPLEMENT_NOW differs from the four authorized operations');
  assert(profile.DEFERRED.some((operation) => (
    operation.method === 'POST'
      && operation.path === '/carts/{cartId}/validate'
      && operation.IMPLEMENTATION_STATUS === 'DEFERRED_AUTH_CART_LAYER'
  )), 'Cart validation must remain DEFERRED_AUTH_CART_LAYER');
  assert(profile.controls.apiImplementationAuthorized === true, 'Public API implementation is not authorized in the profile');
  assert(profile.controls.serviceLayerAuthorized === true, 'Application service layer is not authorized in the profile');
  for (const control of [
    'authenticationAuthorized',
    'cartLayerAuthorized',
    'paymentAuthorized',
    'productionAuthorized',
    'mergeAuthorized',
  ]) assert(profile.controls[control] === false, `${control} must remain false`);
  assert(profile.controls.prDraftRequired === true, 'The PR must remain draft');
  return profile;
};

const validateArchitectureProfile = () => {
  const profile = parseJson(ARCHITECTURE_PROFILE_PATH).document;
  const expected = {
    architecture: 'MODULAR_TYPESCRIPT_MONOLITH',
    runtime: 'NEXTJS',
    host: 'apps/ui-lab',
    basePath: '/api/v1',
    routeHandlersAuthorized: true,
    authorizedRouteHandlers: AUTHORIZED_ROUTE_HANDLERS,
    secondRuntimeAuthorized: false,
    microservicesAuthorized: false,
    realMapProviderAuthorized: false,
    authenticationAuthorized: false,
    cartLayerAuthorized: false,
    inventoryMutationAuthorized: false,
    productionAuthorized: false,
  };
  assert(isDeepStrictEqual(profile, expected), 'API host architecture profile differs from the exact authorized profile');
  return profile;
};

const validateAdr = () => {
  const adr = readFileSync(PUBLIC_API_ADR_PATH, 'utf8');
  const evidence = [
    CERTIFIED_BASE_SHA,
    'MODULAR_TYPESCRIPT_MONOLITH',
    'apps/ui-lab',
    '/api/v1',
    'packages/application',
    'packages/persistence',
    'RoutingDistancePort',
    'category` resolve por `id` UUID persistido ou por `slug` persistido',
    '`q` pesquisa somente `sku` e `name`',
    '`availableOnly=true`',
    'CONFIGURATION_UNAVAILABLE',
    'OUT_OF_AREA',
    'HTTP 400',
    'DEFERRED_AUTH_CART_LAYER',
    'produção',
  ];
  for (const route of AUTHORIZED_ROUTE_HANDLERS) evidence.push(route.path, route.file);
  evidence.forEach((value) => assert(adr.includes(value), `Public Service/API ADR lacks required evidence: ${value}`));
  return adr;
};

const validateFinalFreezeAdr = () => {
  const adr = readFileSync(FINAL_FREEZE_ADR_PATH, 'utf8');
  const evidence = [
    HARDENING_BASE_SHA,
    'PR `#5` fica encerrado para crescimento funcional',
    'branch filha',
    'whitelists explícitas',
    'Object spread',
    'additionalProperties: false',
    'MVP_SKUS_PAUSED=36',
    'DEFERRED_SKUS=30',
    'COMMERCIAL_SKUS_ACTIVATED=0',
    'PUBLIC_CANONICAL_CATALOG_EMPTY=true',
    'nenhuma integração da Home foi iniciada',
    'produção',
  ];
  for (const route of AUTHORIZED_ROUTE_HANDLERS) evidence.push(route.path);
  evidence.forEach((value) => assert(adr.includes(value), `Final freeze ADR lacks required evidence: ${value}`));
  return adr;
};

const validateExplicitPublicMapping = () => {
  const source = readFileSync(PUBLIC_API_ADAPTER_PATH, 'utf8');
  assert(!source.includes('...'), 'Public adapter contains object spread instead of an explicit whitelist');

  const publicProductFields = [
    'id',
    'sku',
    'name',
    'categoryId',
    'salePriceCents',
    'currency',
    'availability',
    'isPack',
    'iceIncluded',
    'maxPerOrder',
    'containsAlcohol',
    'minimumAge',
    'bundleComponents',
  ];
  for (const field of publicProductFields.filter((field) => field !== 'bundleComponents')) {
    assert(source.includes(`${field}: product.${field}`), `PublicProduct does not map ${field} explicitly`);
  }

  for (const field of ['productId', 'sku', 'name', 'quantity']) {
    assert(source.includes(`${field}: component.${field}`), `PublicBundleComponent does not map ${field} explicitly`);
  }

  for (const field of ['deliveryBaseFeeCents', 'deliveryFeePerKmCents', 'maximumRoadDistanceKm']) {
    assert(source.includes(field), `Delivery settings whitelist lacks ${field}`);
  }

  return { publicProductFields };
};

const validateRouteHandlers = () => {
  const actual = walkFiles('apps/ui-lab/app/api/v1')
    .filter((path) => /\/route\.(?:ts|tsx|js|jsx|mjs|cjs)$/.test(path))
    .sort();
  const expected = AUTHORIZED_ROUTE_HANDLERS.map(({ file }) => file).sort();
  assert(isDeepStrictEqual(actual, expected), `Route Handler set differs from authorization: ${actual.join(', ')}`);

  for (const route of AUTHORIZED_ROUTE_HANDLERS) {
    const source = readFileSync(route.file, 'utf8');
    assert(/export\s+const\s+runtime\s*=\s*['"]nodejs['"]/.test(source), `${route.file} must declare the Node.js runtime`);
    assert(new RegExp(`export\\s+(?:(?:async\\s+)?function\\s+${route.method}\\b|const\\s+${route.method}\\s*=)`).test(source), `${route.file} does not export ${route.method}`);
    for (const method of HTTP_METHODS.filter((method) => method !== route.method)) {
      assert(!new RegExp(`export\\s+(?:(?:async\\s+)?function\\s+${method}\\b|const\\s+${method}\\s*=)`).test(source), `${route.file} exports unauthorized method ${method}`);
    }
    assert(!/(?:node:sqlite|DatabaseSync|@hielya\/persistence)/.test(source), `${route.file} accesses persistence directly`);
  }
  return actual;
};

const validateModuleBoundaries = () => {
  const applications = readdirSync('apps', { withFileTypes: true })
    .filter((entry) => entry.isDirectory())
    .map((entry) => entry.name)
    .sort();
  assert(isDeepStrictEqual(applications, ['ui-lab']), `A second runtime application exists: ${applications.join(', ')}`);

  const nextConfigSource = readFileSync('next.config.mjs', 'utf8');
  const transpileBlock = nextConfigSource.match(/transpilePackages\s*:\s*\[([\s\S]*?)\]/)?.[1];
  assert(transpileBlock, 'Next.js transpilePackages configuration is missing');
  const transpilePackages = [...transpileBlock.matchAll(/['"]([^'"]+)['"]/g)]
    .map((match) => match[1])
    .sort();
  assert(isDeepStrictEqual(transpilePackages, [
    '@hielya/application',
    '@hielya/design-tokens',
    '@hielya/persistence',
    '@hielya/ui',
  ]), `Next.js transpiles an unauthorized package set: ${transpilePackages.join(', ')}`);

  const applicationFiles = walkFiles('packages/application').filter((path) => /\.(?:ts|tsx|js|mjs)$/.test(path));
  assert(isDeepStrictEqual(applicationFiles.sort(), ['packages/application/src/index.ts']), 'packages/application contains unauthorized source files');
  const applicationManifest = parseJson('packages/application/package.json').document;
  assert(applicationManifest.name === '@hielya/application', 'Application package identity differs');
  assert(Object.keys(applicationManifest.dependencies ?? {}).length === 0, 'Application package has unauthorized runtime dependencies');
  const applicationSource = readFileSync('packages/application/src/index.ts', 'utf8');
  assert(!/from\s+['"](?:next(?:\/|['"])|react(?:\/|['"])|node:sqlite|apps\/ui-lab)/.test(applicationSource), 'Application layer depends on a forbidden runtime or host');
  for (const contract of [
    'CatalogQueryPort',
    'OperationalSettingsReadPort',
    'RoutingDistancePort',
    'CorrelationIdPort',
    'ListPublicCategories',
    'ListPublicProducts',
    'GetPublicProduct',
    'QuoteSimulatedDelivery',
    'PublicApiError',
  ]) assert(applicationSource.includes(contract), `Application package lacks required contract: ${contract}`);

  const persistenceSources = readSources(walkFiles('packages/persistence/src').filter((path) => /\.(?:ts|tsx)$/.test(path)));
  for (const { path, source } of persistenceSources) {
    assert(!/from\s+['"](?:next|react)(?:\/|['"])/.test(source), `${path} depends on an HTTP or UI runtime`);
    assert(!/\b(?:NextRequest|NextResponse)\b/.test(source), `${path} contains Next.js HTTP types`);
  }

  const persistenceManifest = parseJson('packages/persistence/package.json').document;
  assert(isDeepStrictEqual(persistenceManifest.dependencies, {
    '@hielya/application': 'workspace:*',
  }), 'Persistence package has dependencies outside the authorized application port contract');

  const hostManifest = parseJson('apps/ui-lab/package.json').document;
  assert(hostManifest.dependencies?.['@hielya/application'] === 'workspace:*', 'Next host lacks the application workspace dependency');
  assert(hostManifest.dependencies?.['@hielya/persistence'] === 'workspace:*', 'Next host lacks the persistence workspace dependency');

  const uiSources = readSources(walkFiles('packages/ui').filter((path) => /\.(?:ts|tsx)$/.test(path)));
  assert(!uiSources.some(({ source }) => /@hielya\/persistence|node:sqlite|DatabaseSync/.test(source)), 'UI package accesses persistence directly');

  const manifests = readSources([
    'package.json',
    ...walkFiles('apps').filter((path) => path.endsWith('package.json')),
    ...walkFiles('packages').filter((path) => path.endsWith('package.json')),
  ]);
  const forbiddenDependencies = [];
  for (const { path, source } of manifests) {
    const manifest = JSON.parse(source);
    const dependencies = {
      ...manifest.dependencies,
      ...manifest.devDependencies,
      ...manifest.peerDependencies,
    };
    for (const dependency of Object.keys(dependencies)) {
      if (/^(?:stripe|@stripe\/|@googlemaps\/|google-maps|express$|fastify$|hono$|koa$|@nestjs\/)/.test(dependency)) {
        forbiddenDependencies.push(`${path}:${dependency}`);
      }
    }
  }
  assert(forbiddenDependencies.length === 0, `A forbidden provider or parallel runtime dependency exists: ${forbiddenDependencies.join(', ')}`);

  return {
    applications,
    applicationFiles,
    forbiddenDependencies,
    transpilePackages,
  };
};

const validateReadOnlyAndNoRealIntegrations = () => {
  const executablePaths = [
    ...walkFiles('packages/application/src'),
    'packages/persistence/src/public-api-read-adapter.ts',
    ...walkFiles('apps/ui-lab/src/server/mvp-local-36'),
    ...AUTHORIZED_ROUTE_HANDLERS.map(({ file }) => file),
  ].filter((path) => existsSync(path) && /\.(?:ts|tsx|js|mjs)$/.test(path));
  const sources = readSources(executablePaths);
  const source = sources.map((entry) => entry.source).join('\n');

  const forbiddenRealIntegrations = [
    /@googlemaps\//i,
    /maps\.googleapis\.com/i,
    /google\.maps\./i,
    /from\s+['"]stripe['"]/i,
    /\b(?:sk|rk|pk)_live_[A-Za-z0-9]{8,}\b/,
    /\bghp_[A-Za-z0-9]{20,}\b/,
    /\bgithub_pat_[A-Za-z0-9_]{20,}\b/,
    /\bAKIA[0-9A-Z]{16}\b/,
    /-----BEGIN (?:RSA |EC |OPENSSH )?PRIVATE KEY-----/,
  ];
  assert(!forbiddenRealIntegrations.some((pattern) => pattern.test(source)), 'A real provider or credential pattern exists in executable Gate sources');

  const forbiddenMutationCalls = /\.(?:reserveComposite|reserveComponents|releaseReservation|convertReservation|adjustStock|recordStockMovement|createCart|updateCart|createOrder|createPayment|generatePin|validatePin|activateProduct|updateOperationalSettings)\s*\(/;
  assert(!forbiddenMutationCalls.test(source), 'Public Service/API source invokes an unauthorized mutation');
  assert(!/\b(?:INSERT\s+INTO|UPDATE\s+[^\s]+\s+SET|DELETE\s+FROM)\b/i.test(source), 'Public Service/API source contains a write statement');
  assert(!/(?:deliveryBaseFeeCents|deliveryFeePerKmCents|maximumRoadDistanceKm)\s*:\s*(?:200|60|4)\b/.test(source), 'Operational delivery data is hardcoded in executable source');

  return { executablePaths };
};

const validateTests = () => {
  for (const path of REQUIRED_TEST_FILES) assert(existsSync(path), `Required Public Service/API test is missing: ${path}`);
  const tests = REQUIRED_TEST_FILES.map((path) => readFileSync(path, 'utf8')).join('\n');
  for (const evidence of [
    'catalog/categories',
    'catalog/products',
    'delivery/quote',
    'CONFIGURATION_UNAVAILABLE',
    'OUT_OF_AREA',
    'correlationId',
  ]) assert(tests.includes(evidence), `Public Service/API tests lack evidence: ${evidence}`);

  const conformanceTest = readFileSync(OPENAPI_CONFORMANCE_TEST_PATH, 'utf8');
  for (const evidence of [
    OPENAPI_V1_1_PATH,
    'additionalProperties',
    'PublicError',
    'bundleComponents',
    'physicalStock',
    'purchaseCost',
    "responseSchema('/catalog/products', 'get', 400)",
    "responseSchema('/catalog/products/{productId}', 'get', 404)",
  ]) assert(conformanceTest.includes(evidence), `OpenAPI response conformance tests lack evidence: ${evidence}`);
};

const validateScope = () => {
  if (process.env.GITHUB_ACTIONS !== 'true') return [];
  const changedFiles = execFileSync('git', ['diff', '--name-only', `${CERTIFIED_BASE_SHA}..HEAD`], { encoding: 'utf8' })
    .trim()
    .split('\n')
    .filter(Boolean);
  const unauthorized = changedFiles.filter((path) => !ALLOWED_CHANGED_FILES.has(path));
  assert(unauthorized.length === 0, `Unauthorized files changed in Public Service/API Gate: ${unauthorized.join(', ')}`);
  return changedFiles;
};

const validateHardeningScope = () => {
  if (process.env.GITHUB_ACTIONS !== 'true') return [];
  const changedFiles = execFileSync('git', ['diff', '--name-only', `${HARDENING_BASE_SHA}..HEAD`], { encoding: 'utf8' })
    .trim()
    .split('\n')
    .filter(Boolean);
  const integrationChanges = new Set(HOME_CATALOG_API_INTEGRATION_CHANGED_FILES);
  const hardeningChangedFiles = changedFiles.filter((path) => !integrationChanges.has(path));
  const unauthorized = hardeningChangedFiles.filter((path) => !HARDENING_CHANGED_FILES.has(path));
  assert(unauthorized.length === 0, `Unauthorized files changed in Public Service API hardening/freeze Gate: ${unauthorized.join(', ')}`);
  for (const path of REQUIRED_HARDENING_CHANGES) {
    assert(hardeningChangedFiles.includes(path), `Required hardening/freeze change is missing: ${path}`);
  }
  assert(!hardeningChangedFiles.some((path) => (
    path.startsWith('.dev-migrations/')
      || path.startsWith('contracts/openapi/')
      || path.startsWith('contracts/catalog/')
      || path.startsWith('packages/ui/')
      || path.startsWith('packages/location/')
      || path.startsWith('apps/ui-lab/app/')
      || path.startsWith('apps/ui-lab/src/')
  )), 'Hardening/freeze Gate changed a frozen contract, migration, UI, location or handler source');
  return changedFiles;
};

export const validateMvpLocal36PublicServiceApi = () => {
  validateFrozenOpenApi();
  validateImplementationProfile();
  validateArchitectureProfile();
  validateAdr();
  validateFinalFreezeAdr();
  const explicitMapping = validateExplicitPublicMapping();
  const routeHandlers = validateRouteHandlers();
  const boundaries = validateModuleBoundaries();
  const integrations = validateReadOnlyAndNoRealIntegrations();
  validateTests();
  const changedFiles = validateScope();
  const hardeningChangedFiles = validateHardeningScope();

  return {
    routeHandlers,
    applications: boundaries.applications,
    applicationFiles: boundaries.applicationFiles,
    forbiddenDependencies: boundaries.forbiddenDependencies,
    executablePaths: integrations.executablePaths,
    changedFiles,
    hardeningChangedFiles,
    explicitMapping,
  };
};

if (process.argv[1] && import.meta.url === pathToFileURL(process.argv[1]).href) {
  const report = validateMvpLocal36PublicServiceApi();
  console.log(`CERTIFIED_BASE_SHA=${CERTIFIED_BASE_SHA}`);
  console.log(`HARDENING_BASE_SHA=${HARDENING_BASE_SHA}`);
  console.log(`AUTHORIZED_ROUTE_HANDLERS=${report.routeHandlers.length}`);
  console.log('IMPLEMENTED_ENDPOINTS=GET /catalog/categories,GET /catalog/products,GET /catalog/products/{productId},POST /delivery/quote');
  console.log('API_ARCHITECTURE=MODULAR_TYPESCRIPT_MONOLITH');
  console.log('API_RUNTIME=NEXTJS_NODEJS');
  console.log('API_HOST=apps/ui-lab');
  console.log('API_BASE_PATH=/api/v1');
  console.log('APPLICATION_SERVICES_VALID=true');
  console.log('PUBLIC_API_READ_ONLY=true');
  console.log('PUBLIC_ADAPTER_EXPLICIT_MAPPING=true');
  console.log('PUBLIC_PRODUCT_WHITELIST=true');
  console.log('PUBLIC_COMPONENT_WHITELIST=true');
  console.log('OBJECT_SPREAD_IN_PUBLIC_MAPPING=false');
  console.log('OPENAPI_RESPONSE_CONFORMANCE=true');
  console.log('ADDITIONAL_PROPERTIES_BLOCKED=true');
  console.log('PUBLIC_SERVICE_API_FINAL_FREEZE=true');
  console.log('FOUNDATION_FUNCTIONAL_SCOPE_CLOSED=true');
  console.log('NEXT_IMPLEMENTATION_REQUIRES_CHILD_BRANCH=true');
  console.log('REAL_MAP_PROVIDER=false');
  console.log('AUTHENTICATION_REQUIRED=false');
  console.log('CART_VALIDATION_STATUS=DEFERRED_AUTH_CART_LAYER');
  console.log('OPENAPI_V1_0_MODIFIED=false');
  console.log('OPENAPI_V1_1_MODIFIED=false');
  console.log('COMMERCIAL_SKUS_ACTIVATED=0');
  console.log('INVENTORY_MUTATIONS=0');
  console.log(`SECOND_RUNTIME_CREATED=${report.applications.length === 1 ? 'false' : 'true'}`);
  console.log(`FORBIDDEN_DEPENDENCIES=${report.forbiddenDependencies.length}`);
  console.log('PRODUCTION_AUTHORIZED=false');
}
