import { createHash } from 'node:crypto';
import { execFileSync } from 'node:child_process';
import {
  existsSync,
  readFileSync,
  readdirSync,
} from 'node:fs';
import { join, sep } from 'node:path';
import { pathToFileURL } from 'node:url';

export const CERTIFIED_BASE_SHA = '5c9c1e632102ba902fb8858eb2ae8b5e118d2497';
export const UNIT_CATALOG_PATH = 'contracts/catalog/HIELYA_MVP_LOCAL_36_UNIT_COMMERCIAL_DATA_V1_1.json';
export const UNIT_CATALOG_ARTIFACT_SHA256 = 'c0563388f5f7fff90cc4cef2e7eaad3a6648a43f6c56ddb98ffbdff256654baf';
export const UNIT_CATALOG_SOURCE_SHA256 = 'ea0cbd6294973242fa3b9aeda1cbf7c33e5233ff705fc014ac4a9113bd39807a';
export const COMPOSITE_CATALOG_PATH = 'contracts/catalog/HIELYA_MVP_LOCAL_36_COMPOSITE_COMMERCIAL_DATA_V1_0.json';
export const COMPOSITE_CATALOG_SHA256 = 'c2db49b2f7aa66cf0e75d3bfe18fb34296c40ef836cd0d8354a1993cc7f4d6b7';
export const OPENAPI_V1_0_PATH = 'contracts/openapi/HIELYA_OPENAPI_V1_0.yaml';
export const OPENAPI_V1_0_SHA256 = 'a2c027c6294b44c94cf4be21d18fbd251b0323102e3c9ba2cba912a96d810ae9';
export const OPENAPI_V1_1_PATH = 'contracts/openapi/HIELYA_OPENAPI_MVP_LOCAL_36_V1_1.yaml';
export const OPENAPI_V1_1_SHA256 = '92e1ebcc1d817718a7f2fe9ef1ce93df60194e049d3e0349855bd4ddd24d2ec8';
export const ADR_PATH = 'docs/decisions/ADR-MVP-LOCAL-36-API-HOST-ARCHITECTURE.md';
export const PUBLIC_API_ADR_PATH = 'docs/decisions/ADR-MVP-LOCAL-36-PUBLIC-SERVICE-API-LAYER.md';
export const ARCHITECTURE_PROFILE_PATH = 'docs/architecture/MVP_LOCAL_36_API_HOST_PROFILE.json';

const AUTHORIZED_ROUTE_HANDLERS = [
  { method: 'GET', path: '/catalog/categories', file: 'apps/ui-lab/app/api/v1/catalog/categories/route.ts' },
  { method: 'GET', path: '/catalog/products', file: 'apps/ui-lab/app/api/v1/catalog/products/route.ts' },
  { method: 'GET', path: '/catalog/products/{productId}', file: 'apps/ui-lab/app/api/v1/catalog/products/[productId]/route.ts' },
  { method: 'POST', path: '/delivery/quote', file: 'apps/ui-lab/app/api/v1/delivery/quote/route.ts' },
];

export const GATE_CHANGED_FILES = [
  '.dev-migrations/0002_mvp_local_36_catalog_read_model.sql',
  '.github/workflows/mvp-local-36-policy-gate.yml',
  UNIT_CATALOG_PATH,
  ARCHITECTURE_PROFILE_PATH,
  ADR_PATH,
  'packages/persistence/src/catalog-data.ts',
  'packages/persistence/src/index.ts',
  'scripts/validate-mvp-local-36-catalog-read-model.mjs',
  'scripts/validate-mvp-local-36-composite-commercial-data.mjs',
  'scripts/validate-mvp-local-36-openapi.mjs',
  'scripts/validate-mvp-persistence-schema.mjs',
  'tests/unit/mvp-catalog-read-model.test.ts',
  'tests/unit/mvp-local-36-api-host-architecture.test.ts',
  'tests/unit/mvp-persistence.test.ts',
  'apps/ui-lab/app/api/v1/catalog/categories/route.ts',
  'apps/ui-lab/app/api/v1/catalog/products/[productId]/route.ts',
  'apps/ui-lab/app/api/v1/catalog/products/route.ts',
  'apps/ui-lab/app/api/v1/delivery/quote/route.ts',
  'apps/ui-lab/package.json',
  'apps/ui-lab/src/server/mvp-local-36/container.ts',
  'apps/ui-lab/src/server/mvp-local-36/http.ts',
  'next.config.mjs',
  'contracts/openapi/MVP_LOCAL_36_IMPLEMENTATION_PROFILE.json',
  PUBLIC_API_ADR_PATH,
  'packages/application/package.json',
  'packages/application/src/index.ts',
  'packages/persistence/package.json',
  'packages/persistence/src/public-api-read-adapter.ts',
  'pnpm-lock.yaml',
  'scripts/validate-mvp-local-36-public-service-api.mjs',
  'tests/unit/mvp-public-api-adapters.test.ts',
  'tests/unit/mvp-public-api-handlers.test.ts',
  'tests/unit/mvp-public-api-integration.test.ts',
  'tests/unit/mvp-public-application.test.ts',
  'docs/decisions/ADR-MVP-LOCAL-36-PUBLIC-SERVICE-API-FINAL-FREEZE.md',
  'tests/unit/mvp-public-api-openapi-conformance.test.ts',
];

const ALLOWED_CHANGED_FILES = new Set(GATE_CHANGED_FILES);
const CERTIFIED_PAUSED_UNIT_SKUS = new Set([
  'HYA-CER-001', 'HYA-CER-003', 'HYA-CER-006', 'HYA-CER-009',
  'HYA-REF-016', 'HYA-REF-017', 'HYA-REF-018', 'HYA-REF-019', 'HYA-REF-020', 'HYA-REF-023',
  'HYA-ENE-026', 'HYA-ENE-027', 'HYA-ENE-029',
  'HYA-AGU-032', 'HYA-AGU-034',
  'HYA-DES-036', 'HYA-DES-040', 'HYA-DES-044',
  'HYA-VIN-046', 'HYA-VIN-047', 'HYA-VIN-049',
  'HYA-GEL-051', 'HYA-GEL-052',
  'HYA-SNA-053', 'HYA-SNA-054', 'HYA-SNA-055', 'HYA-SNA-056',
  'HYA-CON-058', 'HYA-CON-059', 'HYA-CON-060',
]);
const FORBIDDEN_PUBLIC_FIELDS = new Set([
  'physicalStock',
  'availableStock',
  'reservedStock',
  'safetyStock',
  'minimumStock',
  'remainingQuantity',
  'bundleAvailabilityCount',
  'quantityOnHand',
  'quantityReserved',
  'quantityAvailable',
  'purchaseCost',
  'inventoryBatch',
  'reorderPoint',
  'margin',
]);
const MICROSERVICE_DEPENDENCIES = new Set([
  'express',
  'fastify',
  'hono',
  'koa',
  '@nestjs/common',
  '@nestjs/core',
]);

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

const walkObjectKeys = (value, visit) => {
  if (Array.isArray(value)) {
    value.forEach((item) => walkObjectKeys(item, visit));
    return;
  }
  if (!value || typeof value !== 'object') return;
  for (const [key, item] of Object.entries(value)) {
    visit(key);
    walkObjectKeys(item, visit);
  }
};

const validateNoPublicStockFields = (documents, persistenceSource) => {
  const leaked = new Set();
  documents.forEach((document) => walkObjectKeys(document, (key) => {
    if (FORBIDDEN_PUBLIC_FIELDS.has(key)) leaked.add(key);
  }));

  for (const match of persistenceSource.matchAll(/export interface Public(?:CatalogProductDto|CategoryReadModel|BundleComponentReadModel|ProductReadModel)\s*\{([\s\S]*?)\n\}/g)) {
    for (const field of FORBIDDEN_PUBLIC_FIELDS) {
      if (new RegExp(`\\b${field}\\b`).test(match[1])) leaked.add(field);
    }
  }
  assert(leaked.size === 0, `Public catalog read model leaks internal fields: ${[...leaked].join(', ')}`);
  return [...leaked];
};

const validateCatalogs = () => {
  const unitBytes = readFileSync(UNIT_CATALOG_PATH);
  const compositeBytes = readFileSync(COMPOSITE_CATALOG_PATH);
  assert(sha256(unitBytes) === UNIT_CATALOG_ARTIFACT_SHA256, 'Unit catalog artifact hash differs from the certified extract');
  assert(sha256(compositeBytes) === COMPOSITE_CATALOG_SHA256, 'Composite catalog hash differs from the certified frozen artifact');

  const unitResult = parseJson(UNIT_CATALOG_PATH);
  const compositeResult = parseJson(COMPOSITE_CATALOG_PATH);
  const unit = unitResult.document;
  const composite = compositeResult.document;

  assert(unit.profile === 'MVP_LOCAL_36', 'Unit catalog profile is invalid');
  assert(unit.version === '1.1.0', 'Unit catalog version is invalid');
  assert(unit.status === 'CANONICAL_XLSX_EXTRACT', 'Unit catalog status is invalid');
  assert(unit.source?.sha256 === UNIT_CATALOG_SOURCE_SHA256, 'Unit catalog source hash is not the certified Master Package hash');
  assert(unit.currency === 'EUR', 'Unit catalog currency must be EUR');
  assert(Array.isArray(unit.units) && unit.units.length === 60, 'Unit catalog must preserve exactly 60 baseline products');

  const unitSkus = unit.units.map((product) => product.sku);
  assert(new Set(unitSkus).size === 60, 'Unit catalog SKUs must be unique');
  const pausedUnits = unit.units.filter((product) => product.mvpStatus === 'PAUSED');
  const deferredUnits = unit.units.filter((product) => product.mvpStatus === 'DEFERRED_AFTER_MVP');
  assert(pausedUnits.length === 30, 'Exactly 30 baseline unit products must remain PAUSED for the MVP');
  assert(deferredUnits.length === 30, 'Exactly 30 baseline unit products must remain DEFERRED_AFTER_MVP');
  assert(
    pausedUnits.every((product) => CERTIFIED_PAUSED_UNIT_SKUS.has(product.sku))
      && [...CERTIFIED_PAUSED_UNIT_SKUS].every((sku) => pausedUnits.some((product) => product.sku === sku)),
    'The selected 30 MVP unit SKUs differ from the certified policy layer',
  );
  assert(unit.units.every((product) => (
    typeof product.name === 'string'
      && product.name.trim().length > 0
      && Number.isInteger(product.salePriceCents)
      && product.salePriceCents >= 0
      && Number.isInteger(product.maxPerOrder)
      && product.maxPerOrder > 0
      && product.kind === 'UNIT'
      && product.isPack === false
      && product.iceIncluded === false
      && product.commerciallyActive === false
  )), 'A baseline unit product is commercially incomplete or activated');
  assert(unit.units.every((product) => (
    product.containsAlcohol === true
      ? product.minimumAge >= 18
      : product.minimumAge === 0
  )), 'Unit catalog alcohol and minimum-age flags are inconsistent');

  assert(composite.profile === 'MVP_LOCAL_36', 'Composite catalog profile is invalid');
  assert(composite.version === '1.0.0', 'Composite catalog version is invalid');
  assert(composite.status === 'OWNER_APPROVED_FROZEN', 'Composite catalog status is not frozen');
  assert(composite.commercialActivationAuthorized === false, 'Composite commercial activation must remain blocked');
  assert(Array.isArray(composite.composites) && composite.composites.length === 6, 'Exactly six composites are required');
  assert(composite.composites.every((product) => (
    product.mvpStatus === 'PAUSED'
      && product.commerciallyActive === false
      && product.isPack === true
      && product.iceIncluded === true
      && product.components.some((component) => component.sku === 'HYA-GEL-051')
  )), 'A composite differs from the frozen paused/ice-included contract');
  assert(composite.composites.every((product) => (
    product.components.every((component) => unitSkus.includes(component.sku))
  )), 'A composite references a component outside the canonical baseline catalog');

  const combined = [...unit.units, ...composite.composites];
  const active = combined.filter((product) => product.commerciallyActive === true);
  const paused = combined.filter((product) => product.mvpStatus === 'PAUSED');
  const deferred = combined.filter((product) => product.mvpStatus === 'DEFERRED_AFTER_MVP');
  assert(combined.length === 66, 'The persistent catalog seed must preserve 60 baseline products plus six composites');
  assert(paused.length === 36, 'The persistent catalog seed must contain exactly 36 paused MVP products');
  assert(deferred.length === 30, 'The persistent catalog seed must preserve exactly 30 deferred products');
  assert(active.length === 0, 'No commercial SKU may be activated in this Gate');

  return {
    unit: unitResult,
    composite: compositeResult,
    unitCount: unit.units.length,
    compositeCount: composite.composites.length,
    pausedCount: paused.length,
    deferredCount: deferred.length,
    activeCount: active.length,
  };
};

const validateArchitecture = () => {
  const profileResult = parseJson(ARCHITECTURE_PROFILE_PATH);
  const profile = profileResult.document;
  const expectedProfile = {
    architecture: 'MODULAR_TYPESCRIPT_MONOLITH',
    runtime: 'NEXTJS',
    host: 'apps/ui-lab',
    basePath: '/api/v1',
    routeHandlersAuthorized: true,
    secondRuntimeAuthorized: false,
    microservicesAuthorized: false,
    realMapProviderAuthorized: false,
    authenticationAuthorized: false,
    cartLayerAuthorized: false,
    inventoryMutationAuthorized: false,
    productionAuthorized: false,
  };
  for (const [key, value] of Object.entries(expectedProfile)) {
    assert(profile[key] === value, `API host architecture profile differs at ${key}`);
  }
  assert(
    JSON.stringify(profile.authorizedRouteHandlers) === JSON.stringify(AUTHORIZED_ROUTE_HANDLERS),
    'API host architecture profile differs at authorizedRouteHandlers',
  );

  const adr = readFileSync(ADR_PATH, 'utf8');
  const requiredAdrEvidence = [
    'MODULAR_TYPESCRIPT_MONOLITH',
    'NEXTJS',
    'apps/ui-lab',
    '/api/v1',
    'apps/ui-lab/app/api/v1/**/route.ts',
    'packages/application',
    'packages/persistence',
    'packages/ui',
    'contracts/openapi',
    'microserviço',
    'segundo runtime',
    'produção',
  ];
  requiredAdrEvidence.forEach((value) => assert(adr.includes(value), `API host ADR lacks required evidence: ${value}`));
  const publicApiAdr = readFileSync(PUBLIC_API_ADR_PATH, 'utf8');
  for (const route of AUTHORIZED_ROUTE_HANDLERS) {
    assert(publicApiAdr.includes(route.path) && publicApiAdr.includes(route.file), `Public Service/API ADR lacks route evidence: ${route.path}`);
  }
  assert(publicApiAdr.includes('RoutingDistancePort'), 'Public Service/API ADR lacks the routing port decision');

  const applications = readdirSync('apps', { withFileTypes: true })
    .filter((entry) => entry.isDirectory())
    .map((entry) => entry.name)
    .sort();
  assert(JSON.stringify(applications) === JSON.stringify(['ui-lab']), `A second runtime application exists: ${applications.join(', ')}`);

  const rootPackage = JSON.parse(readFileSync('package.json', 'utf8'));
  for (const script of ['dev', 'build', 'start']) {
    assert(rootPackage.scripts?.[script]?.includes('apps/ui-lab'), `Root ${script} script does not use the approved Next.js host`);
  }
  const packageFiles = ['package.json', ...walkFiles('apps'), ...walkFiles('packages')]
    .filter((path) => path.endsWith('package.json'));
  const microserviceDependencies = [];
  for (const path of packageFiles) {
    const manifest = JSON.parse(readFileSync(path, 'utf8'));
    const dependencies = {
      ...manifest.dependencies,
      ...manifest.devDependencies,
      ...manifest.peerDependencies,
    };
    Object.keys(dependencies).forEach((dependency) => {
      if (MICROSERVICE_DEPENDENCIES.has(dependency)) microserviceDependencies.push(`${path}:${dependency}`);
    });
  }
  assert(microserviceDependencies.length === 0, `A parallel microservice dependency exists: ${microserviceDependencies.join(', ')}`);

  const routeHandlers = walkFiles('apps').filter((path) => /\/app\/api\/(?:.*\/)?route\.(?:ts|tsx|js|jsx|mjs|cjs)$/.test(path));
  const expectedRouteHandlers = AUTHORIZED_ROUTE_HANDLERS.map((route) => route.file).sort();
  assert(
    JSON.stringify(routeHandlers.sort()) === JSON.stringify(expectedRouteHandlers),
    `Route Handler set differs from the four authorized operations: ${routeHandlers.join(', ')}`,
  );
  assert(existsSync('packages/application/src/index.ts'), 'Authorized application services package is missing');
  const applicationSource = readFileSync('packages/application/src/index.ts', 'utf8');
  assert(!/from\s+['"](?:next(?:\/|['"])|react(?:\/|['"])|node:sqlite|apps\/ui-lab)/.test(applicationSource), 'Application services depend on a forbidden runtime or host');

  const persistencePackage = JSON.parse(readFileSync('packages/persistence/package.json', 'utf8'));
  const persistenceDependencies = {
    ...persistencePackage.dependencies,
    ...persistencePackage.devDependencies,
    ...persistencePackage.peerDependencies,
  };
  assert(!Object.keys(persistenceDependencies).some((dependency) => ['next', 'react', 'react-dom'].includes(dependency)), 'Persistence depends on HTTP or UI runtime packages');

  const uiSource = walkFiles('packages/ui')
    .filter((path) => /\.(?:ts|tsx)$/.test(path))
    .map((path) => readFileSync(path, 'utf8'))
    .join('\n');
  assert(!uiSource.includes('@hielya/persistence') && !uiSource.includes('node:sqlite'), 'UI package accesses persistence directly');

  return {
    profileSource: profileResult.source,
    adr: `${adr}\n${publicApiAdr}`,
    applications,
    routeHandlers,
    microserviceDependencies,
  };
};

const validateFrozenContracts = () => {
  const openApiV10 = readFileSync(OPENAPI_V1_0_PATH);
  const openApiV11 = readFileSync(OPENAPI_V1_1_PATH);
  assert(sha256(openApiV10) === OPENAPI_V1_0_SHA256, 'OpenAPI V1.0 was modified');
  assert(sha256(openApiV11) === OPENAPI_V1_1_SHA256, 'OpenAPI MVP Local 36 V1.1 was modified');
};

const validateScope = () => {
  if (process.env.GITHUB_ACTIONS !== 'true') return [];
  const changedFiles = execFileSync('git', ['diff', '--name-only', `${CERTIFIED_BASE_SHA}..HEAD`], { encoding: 'utf8' })
    .trim()
    .split('\n')
    .filter(Boolean);
  const unauthorized = changedFiles.filter((path) => !ALLOWED_CHANGED_FILES.has(path));
  assert(unauthorized.length === 0, `Unauthorized files changed in catalog/API-host Gate: ${unauthorized.join(', ')}`);
  return changedFiles;
};

const validateNoSecrets = (sources) => {
  const patterns = [
    /\b(?:sk|rk|pk)_live_[A-Za-z0-9]{8,}\b/,
    /\bghp_[A-Za-z0-9]{20,}\b/,
    /\bgithub_pat_[A-Za-z0-9_]{20,}\b/,
    /\bAKIA[0-9A-Z]{16}\b/,
    /AIza[0-9A-Za-z_-]{30,}/,
    /-----BEGIN (?:RSA |EC |OPENSSH )?PRIVATE KEY-----/,
  ];
  const leaked = [];
  for (const { path, source } of sources) {
    if (patterns.some((pattern) => pattern.test(source))) leaked.push(path);
  }
  assert(leaked.length === 0, `A real credential pattern was found in Gate files: ${leaked.join(', ')}`);
  return leaked;
};

export const validateMvpLocal36CatalogReadModel = () => {
  const catalogs = validateCatalogs();
  const architecture = validateArchitecture();
  validateFrozenContracts();

  const persistenceSource = readFileSync('packages/persistence/src/index.ts', 'utf8');
  const catalogDataSource = readFileSync('packages/persistence/src/catalog-data.ts', 'utf8');
  assert(catalogDataSource.includes(UNIT_CATALOG_PATH), 'Persistence does not consume the canonical unit catalog artifact');
  assert(catalogDataSource.includes(COMPOSITE_CATALOG_PATH), 'Persistence does not consume the frozen composite catalog artifact');
  assert(!catalogDataSource.includes('mvp-local.contract-fixture'), 'Persistence must not consume the UI contract fixture');
  const publicNumericStockFields = validateNoPublicStockFields(
    [catalogs.unit.document, catalogs.composite.document],
    persistenceSource,
  );

  const changedFiles = validateScope();
  const secretSources = GATE_CHANGED_FILES
    .filter((path) => existsSync(path))
    .map((path) => ({ path, source: readFileSync(path, 'utf8') }));
  const secrets = validateNoSecrets([
    ...secretSources,
    { path: COMPOSITE_CATALOG_PATH, source: catalogs.composite.source },
    { path: OPENAPI_V1_0_PATH, source: readFileSync(OPENAPI_V1_0_PATH, 'utf8') },
    { path: OPENAPI_V1_1_PATH, source: readFileSync(OPENAPI_V1_1_PATH, 'utf8') },
  ]);

  return {
    unitArtifactSha256: UNIT_CATALOG_ARTIFACT_SHA256,
    unitSourceSha256: UNIT_CATALOG_SOURCE_SHA256,
    compositeSha256: COMPOSITE_CATALOG_SHA256,
    unitCount: catalogs.unitCount,
    compositeCount: catalogs.compositeCount,
    pausedCount: catalogs.pausedCount,
    deferredCount: catalogs.deferredCount,
    activeCount: catalogs.activeCount,
    publicNumericStockFields,
    applications: architecture.applications,
    routeHandlers: architecture.routeHandlers,
    microserviceDependencies: architecture.microserviceDependencies,
    changedFiles,
    secrets,
  };
};

if (process.argv[1] && import.meta.url === pathToFileURL(process.argv[1]).href) {
  const report = validateMvpLocal36CatalogReadModel();
  console.log(`UNIT_CATALOG_ARTIFACT_SHA256=${report.unitArtifactSha256}`);
  console.log(`UNIT_CATALOG_SOURCE_SHA256=${report.unitSourceSha256}`);
  console.log(`COMPOSITE_CATALOG_SHA256=${report.compositeSha256}`);
  console.log(`BASELINE_UNIT_PRODUCTS=${report.unitCount}`);
  console.log(`COMPOSITE_PRODUCTS=${report.compositeCount}`);
  console.log(`MVP_PRODUCTS_PAUSED=${report.pausedCount}`);
  console.log(`BASELINE_PRODUCTS_DEFERRED=${report.deferredCount}`);
  console.log(`COMMERCIAL_SKUS_ACTIVATED=${report.activeCount}`);
  console.log(`PUBLIC_NUMERIC_STOCK_FIELDS=${report.publicNumericStockFields.length}`);
  console.log('PERSISTENT_CATALOG_READ_MODEL_VALID=true');
  console.log('API_ARCHITECTURE=MODULAR_TYPESCRIPT_MONOLITH');
  console.log('API_RUNTIME=NEXTJS');
  console.log('API_HOST=apps/ui-lab');
  console.log('API_BASE_PATH=/api/v1');
  console.log(`SECOND_RUNTIME_CREATED=${report.applications.length === 1 ? 'false' : 'true'}`);
  console.log(`MICROSERVICE_CREATED=${report.microserviceDependencies.length === 0 ? 'false' : 'true'}`);
  console.log(`ROUTE_HANDLERS_CREATED=${report.routeHandlers.length === 4 ? 'true' : 'false'}`);
  console.log(`PUBLIC_ENDPOINTS_IMPLEMENTED=${report.routeHandlers.length === 4 ? 'true' : 'false'}`);
  console.log('OPENAPI_V1_0_MODIFIED=false');
  console.log('OPENAPI_V1_1_MODIFIED=false');
  console.log(`SECRETS_FOUND=${report.secrets.length}`);
}
