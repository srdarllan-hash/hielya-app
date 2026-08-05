import { createHash } from 'node:crypto';
import { execFileSync } from 'node:child_process';
import {
  existsSync,
  mkdirSync,
  readFileSync,
  readdirSync,
  writeFileSync,
} from 'node:fs';
import { dirname, join, sep } from 'node:path';
import { isDeepStrictEqual } from 'node:util';

import {
  PRODUCT_DETAIL_API_INTEGRATION_CHANGED_FILES,
  PRODUCT_DETAIL_API_INTEGRATION_VISUAL_SNAPSHOT_PATHS,
} from './mvp-local-36-product-detail-api-integration-changed-files.mjs';

export const FROZEN_PARENT_SHA = '274d72db6babbf2605d7fecc9946adb28fbd6593';
export const FROZEN_PARENT_BRANCH = 'hielya/mvp-local-36-home-catalog-api-integration';
export const CHILD_BRANCH = 'hielya/mvp-local-36-product-detail-api-integration';
export const MANIFEST_PATH = 'manifests/PRODUCT-DETAIL-PUBLIC-API-INTEGRATION-V1.json';
export const BASELINE_REVIEW_PATH =
  'manifests/PRODUCT-DETAIL-PUBLIC-API-INTEGRATION-V1-BASELINE-REVIEW.json';
export const EVIDENCE_PATH =
  'qa/screen-gates/PRODUCT-DETAIL-PUBLIC-API-INTEGRATION-V1/scope-validation.json';

const OPENAPI_V1_0_PATH = 'contracts/openapi/HIELYA_OPENAPI_V1_0.yaml';
const OPENAPI_V1_0_SHA256 = 'a2c027c6294b44c94cf4be21d18fbd251b0323102e3c9ba2cba912a96d810ae9';
const OPENAPI_V1_1_PATH = 'contracts/openapi/HIELYA_OPENAPI_MVP_LOCAL_36_V1_1.yaml';
const OPENAPI_V1_1_SHA256 = '92e1ebcc1d817718a7f2fe9ef1ce93df60194e049d3e0349855bd4ddd24d2ec8';

const FROZEN_SCREEN_AND_INTEGRATION_PATHS = [
  '.github/workflows/mvp-local-36-home-catalog-api-integration-gate.yml',
  'manifests/C-001-assets.json',
  'manifests/C-001-visual-baseline.json',
  'manifests/C-001.json',
  'manifests/C-002-assets.json',
  'manifests/C-002-visual-baseline.json',
  'manifests/C-002.json',
  'manifests/C-005-HOME-CATALOG-API-INTEGRATION-V1-BASELINE-REVIEW.json',
  'manifests/C-005-HOME-CATALOG-API-INTEGRATION-V1.json',
  'manifests/C-005.json',
  'manifests/certifications.json',
  'manifests/screens.json',
  'playwright.home-catalog-api-integration.config.ts',
  'scripts/generate-c005-home-catalog-api-integration-evidence.mjs',
  'scripts/mvp-local-36-home-catalog-api-integration-changed-files.mjs',
  'scripts/validate-c005-home-catalog-api-integration-baseline-artifact.mjs',
  'scripts/validate-mvp-local-36-home-catalog-api-integration.mjs',
  'tests/accessibility/home-catalog-api-integration.a11y.spec.ts',
  'tests/accessibility/home.a11y.spec.ts',
  'tests/functional/home-catalog-api-integration.functional.spec.ts',
  'tests/functional/home.functional.spec.ts',
  'tests/integration/home-catalog-api-integration.database.ts',
  'tests/integration/home-catalog-api-integration.fixtures.ts',
  'tests/integration/home-catalog-api-integration.global-setup.ts',
  'tests/integration/home-catalog-api-integration.global-teardown.ts',
  'tests/visual/home-catalog-api-integration.visual.spec.ts',
  'tests/visual/home-catalog-api-integration.visual.spec.ts-snapshots',
  'tests/visual/home.visual.spec.ts',
  'tests/visual/home.visual.spec.ts-snapshots',
  'tests/visual/location.visual.spec.ts-snapshots',
  'tests/visual/splash.visual.spec.ts-snapshots',
];

const FORBIDDEN_CHANGE_PREFIXES = [
  '.dev-migrations/',
  'contracts/catalog/',
  'contracts/openapi/',
  'packages/application/',
  'packages/persistence/',
  'packages/location/',
  'packages/ui/src/screens/location/',
  'packages/ui/src/screens/splash/',
  'apps/ui-lab/app/api/',
  'apps/ui-lab/src/server/',
];

const EXPECTED_STATES = [
  'PRODUCT_DETAIL_LOADING',
  'PRODUCT_DETAIL_READY',
  'PRODUCT_DETAIL_NOT_FOUND',
  'PRODUCT_DETAIL_ERROR',
];
const EXPECTED_ENDPOINTS = ['GET /api/v1/catalog/products/{productId}'];
const EXPECTED_ROUTE_HANDLERS = [
  'apps/ui-lab/app/api/v1/catalog/categories/route.ts',
  'apps/ui-lab/app/api/v1/catalog/products/[productId]/route.ts',
  'apps/ui-lab/app/api/v1/catalog/products/route.ts',
  'apps/ui-lab/app/api/v1/delivery/quote/route.ts',
];
const SNAPSHOT_ROOT = 'tests/visual/product-detail-api-integration.visual.spec.ts-snapshots';

const assert = (condition, message) => {
  if (!condition) throw new Error(message);
};

const sha256 = (path) => createHash('sha256').update(readFileSync(path)).digest('hex');
const runGit = (args) => execFileSync('git', args, { encoding: 'utf8' }).trim();

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

const changedFiles = () => {
  if (process.env.GITHUB_ACTIONS !== 'true') return [];
  return runGit(['diff', '--name-only', FROZEN_PARENT_SHA, '--'])
    .split('\n')
    .filter(Boolean)
    .sort();
};

const validateAncestryAndBranch = () => {
  if (process.env.GITHUB_ACTIONS !== 'true') return;
  execFileSync('git', ['merge-base', '--is-ancestor', FROZEN_PARENT_SHA, 'HEAD']);
  assert(process.env.GITHUB_REF_NAME === CHILD_BRANCH, `Unexpected branch: ${process.env.GITHUB_REF_NAME}`);
  assert(runGit(['rev-parse', 'HEAD']) === process.env.GITHUB_SHA, 'Checkout differs from github.sha');
};

const validateScope = () => {
  const files = changedFiles();
  if (files.length === 0) return files;

  const authorized = new Set(PRODUCT_DETAIL_API_INTEGRATION_CHANGED_FILES);
  const unauthorized = files.filter((file) => !authorized.has(file));
  assert(unauthorized.length === 0, `Unauthorized Product Detail changes: ${unauthorized.join(', ')}`);

  const forbidden = files.filter((file) => FORBIDDEN_CHANGE_PREFIXES.some(
    (prefix) => file.startsWith(prefix),
  ));
  assert(forbidden.length === 0, `A frozen layer changed: ${forbidden.join(', ')}`);

  const frozen = files.filter((file) => FROZEN_SCREEN_AND_INTEGRATION_PATHS.some(
    (path) => file === path || file.startsWith(`${path}/`),
  ));
  assert(frozen.length === 0, `Frozen screen or Home integration evidence changed: ${frozen.join(', ')}`);
  return files;
};

const validateFrozenEvidence = () => {
  if (process.env.GITHUB_ACTIONS === 'true') {
    execFileSync('git', [
      'diff',
      '--exit-code',
      FROZEN_PARENT_SHA,
      '--',
      ...FROZEN_SCREEN_AND_INTEGRATION_PATHS,
    ]);
  }
  assert(
    sha256('manifests/C-005-HOME-CATALOG-API-INTEGRATION-V1.json')
      === 'd351d920950ba112b622d22fe5f512a3756ef0e402622b4c82dfde350e7d07f3',
    'Frozen Home integration manifest hash differs',
  );
  assert(
    sha256('manifests/C-005-HOME-CATALOG-API-INTEGRATION-V1-BASELINE-REVIEW.json')
      === '223d245c95890a291a8d6eff769a9dacb612ef3511359f0c3875d83d2b46d671',
    'Frozen Home integration baseline review hash differs',
  );
  const homeSnapshots = walkFiles('tests/visual/home-catalog-api-integration.visual.spec.ts-snapshots')
    .filter((path) => path.endsWith('.png'));
  assert(homeSnapshots.length === 12, 'Frozen Home integration must retain exactly 12 snapshots');
};

const validateManifest = () => {
  const manifest = JSON.parse(readFileSync(MANIFEST_PATH, 'utf8'));
  assert(manifest.screenId === 'PRODUCT-DETAIL-PUBLIC-API-INTEGRATION', 'Product Detail screen identity differs');
  assert(manifest.version === '1.0.0', 'Product Detail manifest version differs');
  assert(manifest.parentFrozenSha === FROZEN_PARENT_SHA, 'Product Detail parent SHA differs');
  assert(manifest.parentManifest === 'manifests/C-005-HOME-CATALOG-API-INTEGRATION-V1.json', 'Parent manifest differs');
  assert(manifest.route === '/products/{productId}', 'Canonical Product Detail visual route differs');
  assert(manifest.runtimeDataSource === 'HTTP_PUBLIC_API', 'Product Detail runtime source must be HTTP_PUBLIC_API');
  assert(isDeepStrictEqual(manifest.endpoints, EXPECTED_ENDPOINTS), 'Product Detail endpoint set differs');
  assert(isDeepStrictEqual(manifest.states, EXPECTED_STATES), 'Product Detail state set differs');
  assert(manifest.viewports?.length === 3, 'Product Detail Gate requires three viewports');
  assert(manifest.baselineMode === 'GATE_VALIDATION', 'Push Gate cannot certify authoring mode');
  assert(manifest.canonicalProductDetailResult === 'NOT_FOUND', 'Canonical paused product must resolve to NOT_FOUND');
  assert(manifest.canonicalCatalogEmpty === true, 'Canonical public catalog must remain empty');
  assert(manifest.commercialSkusActivated === 0, 'Commercial SKU activation is prohibited');
  assert(manifest.persistenceMutations === 0, 'Persistence mutations are prohibited');
  assert(manifest.syntheticRuntimeFallback === false, 'Synthetic runtime fallback is prohibited');
  assert(manifest.homeNavigationToDetail === true, 'Home navigation to Product Detail is missing');
  assert(
    manifest.baselineReviewManifest === BASELINE_REVIEW_PATH,
    'Product Detail baseline review manifest path differs',
  );
  return manifest;
};

const validateBaselineReview = () => {
  const actualSnapshotPaths = walkFiles(SNAPSHOT_ROOT)
    .filter((path) => path.endsWith('.png'))
    .sort();
  assert(
    actualSnapshotPaths.length === 0 || actualSnapshotPaths.length === 12,
    `Expected zero bootstrap snapshots or exactly 12 reviewed snapshots; found ${actualSnapshotPaths.length}`,
  );

  if (actualSnapshotPaths.length === 0) {
    assert(!existsSync(BASELINE_REVIEW_PATH), 'Baseline review is prohibited before visual authoring');
    if (process.env.GITHUB_ACTIONS === 'true') {
      assert(
        runGit(['rev-parse', 'HEAD^']) === FROZEN_PARENT_SHA,
        'The baseline-authoring commit must descend directly from the frozen parent SHA',
      );
    }
    return { mode: 'BASELINE_AUTHORING', reviewed: false };
  }

  assert(
    isDeepStrictEqual(actualSnapshotPaths, PRODUCT_DETAIL_API_INTEGRATION_VISUAL_SNAPSHOT_PATHS),
    'Product Detail snapshot filename set differs',
  );
  assert(existsSync(BASELINE_REVIEW_PATH), 'The 12 snapshots require a baseline review manifest');

  const review = JSON.parse(readFileSync(BASELINE_REVIEW_PATH, 'utf8'));
  assert(
    typeof review.candidateCommitSha === 'string' && /^[0-9a-f]{40}$/.test(review.candidateCommitSha),
    'Baseline review candidateCommitSha must be a full SHA',
  );
  if (process.env.GITHUB_ACTIONS === 'true') {
    execFileSync('git', ['cat-file', '-e', `${review.candidateCommitSha}^{commit}`]);
    assert(review.candidateCommitSha === runGit(['rev-parse', 'HEAD^']), 'Baseline candidate must be exactly HEAD^');
    assert(
      runGit(['rev-parse', `${review.candidateCommitSha}^`]) === FROZEN_PARENT_SHA,
      'The baseline candidate must descend directly from the frozen parent SHA',
    );
    const materializationChanges = runGit([
      'diff', '--name-only', review.candidateCommitSha, 'HEAD', '--',
    ]).split('\n').filter(Boolean).sort();
    assert(
      isDeepStrictEqual(
        materializationChanges,
        [...PRODUCT_DETAIL_API_INTEGRATION_VISUAL_SNAPSHOT_PATHS, BASELINE_REVIEW_PATH].sort(),
      ),
      'The materialization commit may contain only 12 Product Detail PNGs and the review manifest',
    );
  }
  assert(
    Number.isSafeInteger(Number(review.candidateWorkflowRunId))
      && Number(review.candidateWorkflowRunId) > 0,
    'Baseline review requires a workflow run id',
  );
  assert(
    review.candidateArtifactName
      === `product-detail-public-api-integration-v1-${review.candidateCommitSha}`,
    'Baseline artifact name differs',
  );
  assert(
    typeof review.candidateArtifactDigest === 'string'
      && /^sha256:[0-9a-f]{64}$/.test(review.candidateArtifactDigest),
    'Baseline artifact digest must be SHA-256',
  );
  assert(review.reviewMethod === 'WORK_VISUAL_INSPECTION', 'Baseline review requires WORK_VISUAL_INSPECTION');
  assert(Array.isArray(review.entries) && review.entries.length === 12, 'Baseline review requires 12 entries');

  const entries = review.entries
    .map((entry) => ({ path: entry.path, sha256: entry.sha256 }))
    .sort((left, right) => left.path.localeCompare(right.path));
  assert(
    isDeepStrictEqual(entries.map(({ path }) => path), PRODUCT_DETAIL_API_INTEGRATION_VISUAL_SNAPSHOT_PATHS),
    'Baseline review entry paths differ',
  );
  for (const entry of entries) {
    assert(/^[0-9a-f]{64}$/.test(entry.sha256), `Invalid snapshot SHA-256: ${entry.path}`);
    assert(sha256(entry.path) === entry.sha256, `Reviewed snapshot hash differs: ${entry.path}`);
  }
  return {
    mode: 'GATE_VALIDATION',
    reviewed: true,
    candidateCommitSha: review.candidateCommitSha,
    candidateWorkflowRunId: Number(review.candidateWorkflowRunId),
    candidateArtifactName: review.candidateArtifactName,
    candidateArtifactDigest: review.candidateArtifactDigest,
  };
};

const validateFrozenContractsAndRoutes = () => {
  assert(sha256(OPENAPI_V1_0_PATH) === OPENAPI_V1_0_SHA256, 'OpenAPI V1.0 changed');
  assert(sha256(OPENAPI_V1_1_PATH) === OPENAPI_V1_1_SHA256, 'OpenAPI V1.1 changed');
  const handlers = walkFiles('apps/ui-lab/app/api/v1')
    .filter((path) => path.endsWith('/route.ts'))
    .sort();
  assert(isDeepStrictEqual(handlers, [...EXPECTED_ROUTE_HANDLERS].sort()), 'Public API handler set changed');

  assert(existsSync('apps/ui-lab/app/products/[productId]/page.tsx'), 'Canonical Product Detail route is missing');
  for (const forbiddenRoute of [
    'apps/ui-lab/app/product',
    'apps/ui-lab/app/catalog/product',
    'apps/ui-lab/app/item',
  ]) {
    assert(!existsSync(forbiddenRoute), `Parallel visual route exists: ${forbiddenRoute}`);
  }
};

const validateRuntimeBoundary = () => {
  const runtimePaths = [
    'apps/ui-lab/app/products/[productId]/page.tsx',
    'apps/ui-lab/src/client/mvp-local-36/ProductDetailRuntime.tsx',
    'apps/ui-lab/src/client/mvp-local-36/catalog-client.ts',
    'apps/ui-lab/src/client/mvp-local-36/product-detail-mapper.ts',
    'packages/ui/src/screens/product-detail/ProductDetailScreen.tsx',
  ];
  for (const path of runtimePaths) assert(existsSync(path), `Product Detail runtime file is missing: ${path}`);
  const source = runtimePaths.map((path) => readFileSync(path, 'utf8')).join('\n');
  assert(
    !/home\.data|contracts\/catalog|contract-fixture|@hielya\/application|@hielya\/persistence|node:sqlite|DatabaseSync/.test(source),
    'Product Detail runtime bypasses the public HTTP boundary',
  );
  assert(source.includes('/api/v1/catalog/products'), 'Product Detail runtime does not consume the detail endpoint');
  assert(!source.includes('/api/v1/delivery/quote'), 'Product Detail consumes delivery quote unexpectedly');
  assert(!/\.\.\.(?:product|component|dto|data)\b/.test(source), 'Product Detail public mapping uses object spread');
  assert(!/physicalStock|reservedStock|availableStock|purchaseCost|inventoryBatch|reorderPoint/.test(source), 'Internal inventory field crossed the UI boundary');
  assert(!/createCart|addToCart|checkout|createOrder|createPayment|PaymentIntent/.test(source), 'A future mutation layer started in Product Detail');

  const homeSource = [
    'apps/ui-lab/src/client/mvp-local-36/HomeCatalogRuntime.tsx',
    'packages/ui/src/screens/home/HomeScreen.tsx',
    'packages/ui/src/components/ProductCard.tsx',
    'packages/ui/src/components/PackCard.tsx',
  ].map((path) => readFileSync(path, 'utf8')).join('\n');
  assert(homeSource.includes('/products/'), 'Home does not expose canonical Product Detail navigation');

  const syntheticPaths = [
    'tests/integration/product-detail-api-integration.fixtures.ts',
    'tests/accessibility/product-detail-api-integration.a11y.spec.ts',
    'tests/functional/product-detail-api-integration.functional.spec.ts',
    'tests/visual/product-detail-api-integration.visual.spec.ts',
    ...walkFiles('tests/unit').filter((path) => path.includes('product-detail')),
  ].filter((path) => existsSync(path));
  const syntheticSource = syntheticPaths.map((path) => readFileSync(path, 'utf8')).join('\n');
  assert(!/\bsku\s*:\s*["'`]HYA-/.test(syntheticSource), 'Synthetic Product Detail fixtures cannot use HYA SKUs');
};

export const validateProductDetailApiIntegration = () => {
  validateAncestryAndBranch();
  const files = validateScope();
  validateFrozenEvidence();
  const manifest = validateManifest();
  const baselineReview = validateBaselineReview();
  validateFrozenContractsAndRoutes();
  validateRuntimeBoundary();

  const result = {
    gate: 'PRODUCT-DETAIL-PUBLIC-API-INTEGRATION-V1',
    sourceSha: process.env.GITHUB_SHA ?? 'LOCAL_NOT_OFFICIAL',
    parentFrozenSha: FROZEN_PARENT_SHA,
    branch: process.env.GITHUB_REF_NAME ?? 'local',
    changedFiles: files,
    route: manifest.route,
    states: manifest.states,
    viewports: manifest.viewports,
    endpoints: manifest.endpoints,
    baselineReview,
    oldBaselinesPreserved: true,
    homeIntegrationEvidencePreserved: true,
    canonicalPublicCatalogEmpty: true,
    canonicalProductDetailResult: 'NOT_FOUND',
    commercialSkusActivated: 0,
    persistenceMutations: 0,
    passed: true,
  };
  mkdirSync(dirname(EVIDENCE_PATH), { recursive: true });
  writeFileSync(EVIDENCE_PATH, `${JSON.stringify(result, null, 2)}\n`);
  return result;
};

if (process.argv[1]?.endsWith('validate-mvp-local-36-product-detail-api-integration.mjs')) {
  console.log(JSON.stringify(validateProductDetailApiIntegration(), null, 2));
}
