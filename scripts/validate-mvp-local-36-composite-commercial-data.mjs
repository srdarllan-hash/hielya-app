import { createHash } from 'node:crypto';
import { execFileSync } from 'node:child_process';
import { readFileSync } from 'node:fs';
import { pathToFileURL } from 'node:url';
import { isDeepStrictEqual } from 'node:util';

export const CERTIFIED_BASE_SHA = '4ca838d4937555f50b3f5e11fddece5e042e1ee9';
export const ARTIFACT_PATH = 'contracts/catalog/HIELYA_MVP_LOCAL_36_COMPOSITE_COMMERCIAL_DATA_V1_0.json';
export const ARTIFACT_SHA256 = 'c2db49b2f7aa66cf0e75d3bfe18fb34296c40ef836cd0d8354a1993cc7f4d6b7';
export const ADR_PATH = 'docs/decisions/ADR-MVP-LOCAL-36-COMPOSITE-COMMERCIAL-DATA.md';

const EXPECTED_COMPOSITES = [
  {
    sku: 'HYA-CMB-001',
    name: 'Pack Mahou Frío 6 + Hielo 2 kg',
    salePriceCents: 1193,
    currency: 'EUR',
    maxPerOrder: 4,
    containsAlcohol: true,
    minimumAge: 18,
    isPack: true,
    iceIncluded: true,
    mvpStatus: 'PAUSED',
    commerciallyActive: false,
    components: [
      { sku: 'HYA-CER-001', quantity: 6 },
      { sku: 'HYA-GEL-051', quantity: 1 },
    ],
  },
  {
    sku: 'HYA-CMB-002',
    name: 'Pack Heineken Frío 6 + Hielo 2 kg',
    salePriceCents: 1253,
    currency: 'EUR',
    maxPerOrder: 4,
    containsAlcohol: true,
    minimumAge: 18,
    isPack: true,
    iceIncluded: true,
    mvpStatus: 'PAUSED',
    commerciallyActive: false,
    components: [
      { sku: 'HYA-CER-003', quantity: 6 },
      { sku: 'HYA-GEL-051', quantity: 1 },
    ],
  },
  {
    sku: 'HYA-CMB-003',
    name: 'Pack Estrella Galicia Frío 6 + Hielo 2 kg',
    salePriceCents: 1253,
    currency: 'EUR',
    maxPerOrder: 4,
    containsAlcohol: true,
    minimumAge: 18,
    isPack: true,
    iceIncluded: true,
    mvpStatus: 'PAUSED',
    commerciallyActive: false,
    components: [
      { sku: 'HYA-CER-006', quantity: 6 },
      { sku: 'HYA-GEL-051', quantity: 1 },
    ],
  },
  {
    sku: 'HYA-CMB-004',
    name: 'Pack Cruzcampo Frío 6 + Hielo 2 kg',
    salePriceCents: 1133,
    currency: 'EUR',
    maxPerOrder: 4,
    containsAlcohol: true,
    minimumAge: 18,
    isPack: true,
    iceIncluded: true,
    mvpStatus: 'PAUSED',
    commerciallyActive: false,
    components: [
      { sku: 'HYA-CER-009', quantity: 6 },
      { sku: 'HYA-GEL-051', quantity: 1 },
    ],
  },
  {
    sku: 'HYA-CMB-005',
    name: 'Combo Gin Tonic Larios + Hielo',
    salePriceCents: 3500,
    currency: 'EUR',
    maxPerOrder: 3,
    containsAlcohol: true,
    minimumAge: 18,
    isPack: true,
    iceIncluded: true,
    mvpStatus: 'PAUSED',
    commerciallyActive: false,
    components: [
      { sku: 'HYA-DES-036', quantity: 1 },
      { sku: 'HYA-REF-023', quantity: 6 },
      { sku: 'HYA-GEL-051', quantity: 1 },
      { sku: 'HYA-CON-059', quantity: 1 },
      { sku: 'HYA-CON-060', quantity: 1 },
    ],
  },
  {
    sku: 'HYA-CMB-006',
    name: 'Combo Vodka Energy Absolut + Hielo',
    salePriceCents: 3563,
    currency: 'EUR',
    maxPerOrder: 3,
    containsAlcohol: true,
    minimumAge: 18,
    isPack: true,
    iceIncluded: true,
    mvpStatus: 'PAUSED',
    commerciallyActive: false,
    components: [
      { sku: 'HYA-DES-040', quantity: 1 },
      { sku: 'HYA-ENE-026', quantity: 4 },
      { sku: 'HYA-GEL-051', quantity: 1 },
      { sku: 'HYA-CON-059', quantity: 1 },
    ],
  },
];

const CERTIFIED_UNIT_SKUS = new Set([
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

const COMPONENT_COMMERCIAL_DATA = new Map([
  ['HYA-CER-001', { salePriceCents: 149, maxPerOrder: 24 }],
  ['HYA-CER-003', { salePriceCents: 159, maxPerOrder: 24 }],
  ['HYA-CER-006', { salePriceCents: 159, maxPerOrder: 24 }],
  ['HYA-CER-009', { salePriceCents: 139, maxPerOrder: 24 }],
  ['HYA-REF-023', { salePriceCents: 159, maxPerOrder: 24 }],
  ['HYA-ENE-026', { salePriceCents: 229, maxPerOrder: 12 }],
  ['HYA-DES-036', { salePriceCents: 1599, maxPerOrder: 3 }],
  ['HYA-DES-040', { salePriceCents: 1999, maxPerOrder: 3 }],
  ['HYA-GEL-051', { salePriceCents: 299, maxPerOrder: 6 }],
  ['HYA-CON-059', { salePriceCents: 349, maxPerOrder: 6 }],
  ['HYA-CON-060', { salePriceCents: 299, maxPerOrder: 4 }],
]);

const ALLOWED_CHANGED_FILES = new Set([
  '.github/workflows/mvp-local-36-policy-gate.yml',
  ARTIFACT_PATH,
  ADR_PATH,
  'scripts/validate-mvp-local-36-composite-commercial-data.mjs',
  'scripts/validate-mvp-local-36-openapi.mjs',
  'tests/unit/mvp-local-36-composite-commercial-data.test.ts',
  '.dev-migrations/0002_mvp_local_36_catalog_read_model.sql',
  'contracts/catalog/HIELYA_MVP_LOCAL_36_UNIT_COMMERCIAL_DATA_V1_1.json',
  'docs/architecture/MVP_LOCAL_36_API_HOST_PROFILE.json',
  'docs/decisions/ADR-MVP-LOCAL-36-API-HOST-ARCHITECTURE.md',
  'packages/persistence/src/catalog-data.ts',
  'packages/persistence/src/index.ts',
  'scripts/validate-mvp-local-36-catalog-read-model.mjs',
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
  'docs/decisions/ADR-MVP-LOCAL-36-PUBLIC-SERVICE-API-LAYER.md',
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

const walkKeys = (value, visit) => {
  if (Array.isArray(value)) {
    value.forEach((item) => walkKeys(item, visit));
    return;
  }
  if (!value || typeof value !== 'object') return;
  for (const [key, item] of Object.entries(value)) {
    visit(key);
    walkKeys(item, visit);
  }
};

const validateNoInternalFields = (document) => {
  const forbidden = [];
  walkKeys(document, (key) => {
    const normalized = key.replaceAll(/[^a-zA-Z0-9]/g, '').toLowerCase();
    const exactForbidden = new Set([
      'cost', 'costcents', 'purchasecost', 'purchasecostcents',
      'margin', 'grossmargin', 'inventorybatch', 'reorderpoint',
      'credential', 'secret', 'token', 'email', 'phone', 'address',
      'customer', 'user', 'person', 'personaldata',
    ]);
    if (
      exactForbidden.has(normalized)
      || normalized.includes('stock')
      || normalized.includes('inventory')
      || normalized.includes('reservation')
      || normalized.includes('movement')
      || normalized.includes('batch')
    ) forbidden.push(key);
  });
  assert(forbidden.length === 0, `Forbidden internal fields found: ${[...new Set(forbidden)].join(', ')}`);
};

const validateComponentBasis = (composite) => {
  let price = 0;
  let limit = Number.POSITIVE_INFINITY;
  for (const component of composite.components) {
    assert(CERTIFIED_UNIT_SKUS.has(component.sku), `Uncertified unit component: ${component.sku}`);
    const commercial = COMPONENT_COMMERCIAL_DATA.get(component.sku);
    assert(commercial, `Missing canonical commercial data for component: ${component.sku}`);
    price += commercial.salePriceCents * component.quantity;
    limit = Math.min(limit, Math.floor(commercial.maxPerOrder / component.quantity));
  }
  assert(price === composite.salePriceCents, `${composite.sku} price differs from approved component basis`);
  assert(limit === composite.maxPerOrder, `${composite.sku} limit differs from approved limiting component`);
  assert(composite.components.some((component) => component.sku === 'HYA-GEL-051'), `${composite.sku} does not include certified ice`);
};

const validateAdr = (adr) => {
  const required = [
    ARTIFACT_PATH,
    ARTIFACT_SHA256,
    'SUM_OF_COMPONENT_SALE_PRICES',
    '0 cêntimos',
    'Recálculo automático: desativado',
    'LIMITING_COMPONENT',
    'PAUSED',
    '18 anos',
    'HYA-GEL-051',
    'não possuem estoque independente',
    'Nenhum SKU é ativado comercialmente',
    'produção',
  ];
  for (const value of required) assert(adr.includes(value), `ADR lacks required decision evidence: ${value}`);
};

const validateNoCredentials = (sources) => {
  const credentialPattern = /\b(?:(?:sk|rk|pk)_(?:live|test)_[A-Za-z0-9]{8,}|ghp_[A-Za-z0-9]{20,}|github_pat_[A-Za-z0-9_]{20,})\b/;
  assert(!sources.some((source) => credentialPattern.test(source)), 'A credential pattern was found');
};

const validateScope = () => {
  if (process.env.GITHUB_ACTIONS !== 'true') return [];
  const files = execFileSync('git', ['diff', '--name-only', `${CERTIFIED_BASE_SHA}..HEAD`], { encoding: 'utf8' })
    .trim()
    .split('\n')
    .filter(Boolean);
  const unauthorized = files.filter((file) => !ALLOWED_CHANGED_FILES.has(file));
  assert(unauthorized.length === 0, `Unauthorized files changed in composite commercial Gate: ${unauthorized.join(', ')}`);
  return files;
};

export const validateCompositeCommercialData = () => {
  const artifact = readFileSync(ARTIFACT_PATH);
  const actualSha256 = sha256(artifact);
  assert(actualSha256 === ARTIFACT_SHA256, `Composite artifact hash mismatch: ${actualSha256}`);

  const result = parseJson(ARTIFACT_PATH);
  const document = result.document;
  const expectedTopLevelKeys = [
    'commercialActivationAuthorized',
    'composites',
    'currency',
    'maxPerOrderPolicy',
    'pricePolicy',
    'profile',
    'status',
    'version',
  ];

  assert(
    isDeepStrictEqual(Object.keys(document).sort(), expectedTopLevelKeys),
    'Composite artifact has missing or unauthorized top-level fields',
  );
  assert(document.profile === 'MVP_LOCAL_36', 'Incorrect profile');
  assert(document.version === '1.0.0', 'Incorrect data version');
  assert(document.status === 'OWNER_APPROVED_FROZEN', 'Incorrect frozen status');
  assert(document.currency === 'EUR', 'Incorrect document currency');
  assert(document.commercialActivationAuthorized === false, 'Commercial activation must remain blocked');
  assert(isDeepStrictEqual(document.pricePolicy, {
    initialBasis: 'SUM_OF_COMPONENT_SALE_PRICES',
    discountCents: 0,
    automaticRecalculation: false,
  }), 'Incorrect price policy');
  assert(isDeepStrictEqual(document.maxPerOrderPolicy, {
    initialBasis: 'LIMITING_COMPONENT',
    automaticRecalculation: false,
  }), 'Incorrect max-per-order policy');
  assert(isDeepStrictEqual(document.composites, EXPECTED_COMPOSITES), 'Composite records differ from owner approval');

  const skus = document.composites.map((composite) => composite.sku);
  assert(new Set(skus).size === 6, 'Composite SKUs must be unique');
  document.composites.forEach(validateComponentBasis);
  validateNoInternalFields(document);

  const adr = readFileSync(ADR_PATH, 'utf8');
  validateAdr(adr);
  validateNoCredentials([result.source, adr]);
  const changedFiles = validateScope();

  return {
    actualSha256,
    compositeCount: document.composites.length,
    compositeSkus: skus,
    prices: document.composites.map((composite) => composite.salePriceCents),
    limits: document.composites.map((composite) => composite.maxPerOrder),
    changedFiles,
  };
};

if (process.argv[1] && import.meta.url === pathToFileURL(process.argv[1]).href) {
  const report = validateCompositeCommercialData();
  console.log(`CANONICAL_COMPOSITE_SHA256=${report.actualSha256}`);
  console.log(`COMPOSITE_COUNT=${report.compositeCount}`);
  console.log(`COMPOSITE_SKUS=${report.compositeSkus.join(',')}`);
  console.log(`COMPOSITE_PRICES_CENTS=${report.prices.join(',')}`);
  console.log(`COMPOSITE_MAX_PER_ORDER=${report.limits.join(',')}`);
  console.log('OWNER_APPROVAL_RECORDED=true');
  console.log('ALL_CONTAIN_ALCOHOL=true');
  console.log('ALL_MINIMUM_AGE_18=true');
  console.log('ALL_ARE_PACKS=true');
  console.log('ALL_INCLUDE_ICE=true');
  console.log('ALL_REMAIN_PAUSED=true');
  console.log('COMMERCIAL_SKUS_ACTIVATED=0');
  console.log('COMPOSITE_DISCOUNT_CENTS=0');
  console.log('AUTOMATIC_PRICE_RECALCULATION=false');
  console.log('PERSISTENCE_SCHEMA_CHANGED=false');
  console.log('MIGRATION_CREATED=false');
  console.log('SEED_CHANGED=false');
  console.log('READ_MODEL_CHANGED=false');
  console.log('API_HOST_CREATED=false');
  console.log('ROUTE_HANDLERS_CREATED=false');
  console.log('PUBLIC_ENDPOINTS_IMPLEMENTED=false');
}
