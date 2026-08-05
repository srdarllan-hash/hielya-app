import { createHash } from 'node:crypto';
import { execFileSync } from 'node:child_process';
import { readFileSync } from 'node:fs';
import { pathToFileURL } from 'node:url';

export const CERTIFIED_BASE_SHA = 'abc9380c968c7533316bd27cd3f85a73f7020b8f';
export const ORIGINAL_PATH = 'contracts/openapi/HIELYA_OPENAPI_V1_0.yaml';
export const ORIGINAL_SHA256 = 'a2c027c6294b44c94cf4be21d18fbd251b0323102e3c9ba2cba912a96d810ae9';
export const CONTRACT_PATH = 'contracts/openapi/HIELYA_OPENAPI_MVP_LOCAL_36_V1_1.yaml';
export const PROFILE_PATH = 'contracts/openapi/MVP_LOCAL_36_IMPLEMENTATION_PROFILE.json';

const EXPECTED_ROUTES = new Map([
  ['/catalog/categories', ['get']],
  ['/catalog/products', ['get']],
  ['/catalog/products/{productId}', ['get']],
  ['/delivery/quote', ['post']],
  ['/carts/{cartId}/validate', ['post']],
]);
const FORBIDDEN_ROUTES = ['/catalog', '/products/{id}', '/checkout/validate'];
const FORBIDDEN_PUBLIC_FIELDS = [
  'availableQuantity',
  'physicalStock',
  'availableStock',
  'reservedStock',
  'safetyStock',
  'minimumStock',
  'remainingQuantity',
  'bundleAvailabilityCount',
  'purchaseCost',
  'inventoryBatch',
  'reorderPoint',
  'margin',
];
const PUBLIC_SCHEMAS = [
  'PublicCategory',
  'PublicProduct',
  'PublicProductPage',
  'PublicBundleComponent',
  'PublicAvailability',
];
const ALLOWED_CHANGED_FILES = new Set([
  '.github/workflows/mvp-local-36-policy-gate.yml',
  ORIGINAL_PATH,
  CONTRACT_PATH,
  PROFILE_PATH,
  'docs/decisions/ADR-MVP-LOCAL-36-OPENAPI-V1-1.md',
  'scripts/validate-mvp-local-36-openapi.mjs',
  'tests/unit/mvp-local-36-openapi.test.ts',
  'contracts/catalog/HIELYA_MVP_LOCAL_36_COMPOSITE_COMMERCIAL_DATA_V1_0.json',
  'docs/decisions/ADR-MVP-LOCAL-36-COMPOSITE-COMMERCIAL-DATA.md',
  'scripts/validate-mvp-local-36-composite-commercial-data.mjs',
  'tests/unit/mvp-local-36-composite-commercial-data.test.ts',
]);
const HTTP_METHODS = new Set(['get', 'post', 'put', 'patch', 'delete', 'options', 'head', 'trace']);

const assert = (condition, message) => {
  if (!condition) throw new Error(message);
};

const sha256 = (value) => createHash('sha256').update(value).digest('hex');

const parseJsonYaml = (path) => {
  const source = readFileSync(path, 'utf8');
  try {
    return { source, document: JSON.parse(source) };
  } catch (error) {
    throw new Error(`${path} is not valid JSON-compatible YAML: ${error.message}`);
  }
};

const resolvePointer = (document, ref) => {
  assert(ref.startsWith('#/'), `Only local references are allowed: ${ref}`);
  return ref.slice(2).split('/').reduce((value, part) => {
    const key = part.replaceAll('~1', '/').replaceAll('~0', '~');
    assert(value && Object.hasOwn(value, key), `Unresolved local reference: ${ref}`);
    return value[key];
  }, document);
};

const walk = (value, visit, path = '$') => {
  visit(value, path);
  if (Array.isArray(value)) value.forEach((item, index) => walk(item, visit, `${path}[${index}]`));
  else if (value && typeof value === 'object') {
    Object.entries(value).forEach(([key, item]) => walk(item, visit, `${path}.${key}`));
  }
};

const validateReferences = (document) => {
  let count = 0;
  walk(document, (value) => {
    if (value && typeof value === 'object' && typeof value.$ref === 'string') {
      resolvePointer(document, value.$ref);
      count += 1;
    }
  });
  return count;
};

const validateOperations = (document) => {
  const operationIds = new Set();
  let operationCount = 0;
  for (const [path, item] of Object.entries(document.paths)) {
    for (const [method, operation] of Object.entries(item)) {
      if (!HTTP_METHODS.has(method)) continue;
      assert(typeof operation.operationId === 'string' && operation.operationId.length > 0, `${method.toUpperCase()} ${path} lacks operationId`);
      assert(!operationIds.has(operation.operationId), `Duplicate operationId: ${operation.operationId}`);
      assert(operation.responses && Object.keys(operation.responses).some((status) => /^2\d\d$/.test(status)), `${operation.operationId} lacks 2xx response`);
      operationIds.add(operation.operationId);
      operationCount += 1;
    }
  }
  return { operationIds, operationCount };
};

const validateRoutes = (document) => {
  assert(JSON.stringify(Object.keys(document.paths).sort()) === JSON.stringify([...EXPECTED_ROUTES.keys()].sort()), 'Contract paths differ from the authorized route set');
  for (const [path, methods] of EXPECTED_ROUTES) {
    assert(document.paths[path], `Missing canonical route: ${path}`);
    for (const method of methods) assert(document.paths[path][method], `Missing canonical operation: ${method.toUpperCase()} ${path}`);
  }
  for (const path of FORBIDDEN_ROUTES) assert(!document.paths[path], `Parallel route is prohibited: ${path}`);
};

const validatePublicSchemas = (document) => {
  const schemas = document.components?.schemas;
  assert(schemas, 'components.schemas is required');
  for (const name of PUBLIC_SCHEMAS) assert(schemas[name], `Missing public schema: ${name}`);
  assert(JSON.stringify(schemas.PublicAvailability.enum) === JSON.stringify(['AVAILABLE', 'UNAVAILABLE', 'TEMPORARILY_UNAVAILABLE']), 'PublicAvailability has unauthorized values');
  assert(!Object.keys(schemas).some((name) => name.startsWith('Internal') || name.startsWith('Admin')), 'Internal or Admin schemas must not be exposed by the public contract');
  const leaked = new Set();
  walk(schemas, (value) => {
    if (!value || typeof value !== 'object' || Array.isArray(value)) return;
    for (const key of Object.keys(value.properties ?? {})) {
      if (FORBIDDEN_PUBLIC_FIELDS.includes(key)) leaked.add(key);
    }
  });
  assert(leaked.size === 0, `Public numeric stock fields leaked: ${[...leaked].join(', ')}`);
  const pack = schemas.PublicProduct;
  assert(pack.properties?.bundleComponents?.items?.$ref === '#/components/schemas/PublicBundleComponent', 'PublicProduct bundle components are not separated');
  assert(pack.properties?.iceIncluded?.type === 'boolean', 'PublicProduct must expose iceIncluded');
  return [...leaked];
};

const validateDeliveryQuote = (document) => {
  const request = document.components.schemas.DeliveryQuoteRequest;
  const keys = Object.keys(request.properties ?? {}).sort();
  assert(JSON.stringify(keys) === JSON.stringify(['addressType', 'latitude', 'longitude']), 'DeliveryQuoteRequest accepts unauthorized fields');
  assert(request.additionalProperties === false, 'DeliveryQuoteRequest must reject client-supplied fee or distance fields');
  assert(request.required.includes('latitude') && request.required.includes('longitude'), 'DeliveryQuoteRequest must require coordinates');
};

const validateDeferredCart = (document, profile) => {
  const operation = document.paths['/carts/{cartId}/validate'].post;
  assert(operation['x-hielya-implementation-status'] === 'DEFERRED_AUTH_CART_LAYER', 'Cart validation is not marked deferred');
  assert(JSON.stringify(operation.security) === JSON.stringify([{ customerBearer: [] }]), 'Cart validation must retain customerBearer');
  assert(operation.parameters.some((parameter) => parameter.in === 'path' && parameter.name === 'cartId' && parameter.required === true), 'Cart validation must retain cartId');
  const request = document.components.schemas.CartValidationRequest;
  assert(request.required.includes('addressId'), 'Cart validation must retain addressId');
  const deferred = profile.DEFERRED.find((item) => item.method === 'POST' && item.path === '/carts/{cartId}/validate');
  assert(deferred?.IMPLEMENTATION_STATUS === 'DEFERRED_AUTH_CART_LAYER', 'Implementation profile does not defer cart validation');
};

const validateProfile = (profile) => {
  assert(profile.profile === 'MVP_LOCAL_36', 'Incorrect implementation profile');
  assert(profile.contractVersion === '1.1.0', 'Incorrect implementation profile version');
  assert(profile.baseline.file === ORIGINAL_PATH && profile.baseline.sha256 === ORIGINAL_SHA256 && profile.baseline.modified === false, 'Profile baseline identity differs');
  assert(profile.IMPLEMENT_NOW.length === 4, 'IMPLEMENT_NOW must contain exactly four operations');
  assert(profile.controls && Object.values(profile.controls).every((value) => value === false || value === true), 'Profile controls are invalid');
  assert(profile.controls.apiImplementationAuthorized === false, 'API implementation must remain blocked');
};

const validateScope = () => {
  if (process.env.GITHUB_ACTIONS !== 'true') return [];
  const files = execFileSync('git', ['diff', '--name-only', `${CERTIFIED_BASE_SHA}..HEAD`], { encoding: 'utf8' }).trim().split('\n').filter(Boolean);
  const unauthorized = files.filter((file) => !ALLOWED_CHANGED_FILES.has(file));
  assert(unauthorized.length === 0, `Unauthorized files changed in contract Gate: ${unauthorized.join(', ')}`);
  return files;
};

const validateNoCredentials = (sources) => {
  const realCredentialPattern = /\b(?:sk|rk|pk)_live_[A-Za-z0-9]{8,}\b/;
  assert(!sources.some((source) => realCredentialPattern.test(source)), 'A production credential pattern was found');
};

export const validateMvpLocal36OpenApi = () => {
  const original = readFileSync(ORIGINAL_PATH);
  const actualHash = sha256(original);
  assert(actualHash === ORIGINAL_SHA256, `Original OpenAPI hash mismatch: ${actualHash}`);

  const contractResult = parseJsonYaml(CONTRACT_PATH);
  const profileResult = parseJsonYaml(PROFILE_PATH);
  const contract = contractResult.document;
  const profile = profileResult.document;

  assert(contract.openapi === '3.1.1', 'OpenAPI version must be 3.1.1');
  assert(contract.info?.version === '1.1.0', 'Derived contract version must be 1.1.0');
  assert(contract['x-hielya-profile'] === 'MVP_LOCAL_36', 'Derived contract profile is missing');
  assert(contract['x-hielya-baseline']?.sha256 === ORIGINAL_SHA256 && contract['x-hielya-baseline']?.modified === false, 'Derived contract baseline identity differs');
  assert(contract.paths && contract.components, 'OpenAPI paths and components are required');

  validateRoutes(contract);
  const operationReport = validateOperations(contract);
  const referenceCount = validateReferences(contract);
  const leakedFields = validatePublicSchemas(contract);
  validateDeliveryQuote(contract);
  validateProfile(profile);
  validateDeferredCart(contract, profile);
  validateNoCredentials([contractResult.source, profileResult.source]);
  const changedFiles = validateScope();

  return {
    originalActualSha256: actualHash,
    yamlValidation: 'SUCCESS',
    openApiValidation: 'SUCCESS',
    localReferences: referenceCount,
    operationIds: operationReport.operationIds.size,
    operationCount: operationReport.operationCount,
    parallelRoutesFound: [],
    publicNumericStockFields: leakedFields,
    publicInternalDtoSeparation: true,
    deliveryQuoteContract: 'SERVER_CALCULATED',
    cartValidationStatus: 'DEFERRED_AUTH_CART_LAYER',
    changedFiles,
  };
};

if (process.argv[1] && import.meta.url === pathToFileURL(process.argv[1]).href) {
  const report = validateMvpLocal36OpenApi();
  console.log(`ORIGINAL_ACTUAL_SHA256=${report.originalActualSha256}`);
  console.log(`YAML_VALIDATION=${report.yamlValidation}`);
  console.log(`OPENAPI_VALIDATION=${report.openApiValidation}`);
  console.log(`LOCAL_REFERENCES=${report.localReferences}`);
  console.log(`OPERATION_IDS=${report.operationIds}`);
  console.log('CANONICAL_ROUTES_PRESERVED=true');
  console.log('PARALLEL_ROUTES_FOUND=0');
  console.log('PUBLIC_NUMERIC_STOCK_FIELDS=0');
  console.log('PUBLIC_INTERNAL_DTO_SEPARATION=true');
  console.log('DELIVERY_QUOTE_CONTRACT=SERVER_CALCULATED');
  console.log('CART_VALIDATION_STATUS=DEFERRED_AUTH_CART_LAYER');
  console.log('API_IMPLEMENTATION_STARTED=false');
}
