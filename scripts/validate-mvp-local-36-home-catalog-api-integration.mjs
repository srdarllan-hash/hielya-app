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

export const FROZEN_PARENT_SHA = 'fe62966daca8bda94610aa1a63702a1e543b0ce6';
export const CHILD_BRANCH = 'hielya/mvp-local-36-home-catalog-api-integration';
export const MANIFEST_PATH = 'manifests/C-005-HOME-CATALOG-API-INTEGRATION-V1.json';
export const BASELINE_REVIEW_PATH =
  'manifests/C-005-HOME-CATALOG-API-INTEGRATION-V1-BASELINE-REVIEW.json';
export const EVIDENCE_PATH =
  'qa/screen-gates/C-005-HOME-CATALOG-API-INTEGRATION-V1/scope-validation.json';

const OPENAPI_V1_0_PATH = 'contracts/openapi/HIELYA_OPENAPI_V1_0.yaml';
const OPENAPI_V1_0_SHA256 = 'a2c027c6294b44c94cf4be21d18fbd251b0323102e3c9ba2cba912a96d810ae9';
const OPENAPI_V1_1_PATH = 'contracts/openapi/HIELYA_OPENAPI_MVP_LOCAL_36_V1_1.yaml';
const OPENAPI_V1_1_SHA256 = '92e1ebcc1d817718a7f2fe9ef1ce93df60194e049d3e0349855bd4ddd24d2ec8';

const FROZEN_C005_PATHS = [
  'manifests/C-005.json',
  'manifests/certifications.json',
  'manifests/screens.json',
  'tests/unit/home.unit.test.tsx',
  'tests/accessibility/home.a11y.spec.ts',
  'tests/functional/home.functional.spec.ts',
  'tests/visual/home.visual.spec.ts',
  'tests/visual/home.visual.spec.ts-snapshots',
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

const ALLOWED_EXACT_FILES = new Set([
  '.github/workflows/mvp-local-36-home-catalog-api-integration-gate.yml',
  'apps/ui-lab/app/page.tsx',
  'apps/ui-lab/src/client/mvp-local-36/HomeCatalogRuntime.tsx',
  'apps/ui-lab/src/client/mvp-local-36/catalog-client.ts',
  'apps/ui-lab/src/client/mvp-local-36/catalog-contracts.ts',
  'apps/ui-lab/src/client/mvp-local-36/home-catalog-mapper.ts',
  BASELINE_REVIEW_PATH,
  MANIFEST_PATH,
  'playwright.home-catalog-api-integration.config.ts',
  'packages/ui/src/components/CategoryChip.tsx',
  'packages/ui/src/components/PackCard.tsx',
  'packages/ui/src/components/ProductCard.tsx',
  'packages/ui/src/screens/home/HomeScreen.stories.tsx',
  'packages/ui/src/screens/home/HomeScreen.tsx',
  'packages/ui/src/screens/home/home.data.ts',
  'packages/ui/src/screens/home/home.types.ts',
  'scripts/generate-c005-home-catalog-api-integration-evidence.mjs',
  'scripts/mvp-local-36-home-catalog-api-integration-changed-files.mjs',
  'scripts/validate-c005-home-catalog-api-integration-baseline-artifact.mjs',
  'scripts/validate-mvp-local-36-catalog-read-model.mjs',
  'scripts/validate-mvp-local-36-composite-commercial-data.mjs',
  'scripts/validate-mvp-local-36-home-catalog-api-integration.mjs',
  'scripts/validate-mvp-local-36-openapi.mjs',
  'scripts/validate-mvp-local-36-public-service-api.mjs',
  'tests/unit/mvp-home-catalog-client.test.ts',
  'tests/unit/mvp-home-catalog-runtime-boundary.test.ts',
  'tests/unit/mvp-home-catalog-runtime.test.tsx',
]);

const ALLOWED_PREFIXES = [
  'qa/screen-gates/C-005-HOME-CATALOG-API-INTEGRATION-V1/',
  'screenshots/C-005-HOME-CATALOG-API-INTEGRATION-V1/',
  'tests/accessibility/home-catalog-api-integration.',
  'tests/functional/home-catalog-api-integration.',
  'tests/integration/home-catalog-api-integration.',
  'tests/unit/home-catalog',
  'tests/visual/home-catalog-api-integration.',
];

const EXPECTED_STATES = [
  'HOME_CATALOG_LOADING',
  'HOME_CATALOG_READY',
  'HOME_CATALOG_EMPTY',
  'HOME_CATALOG_ERROR',
];

const EXPECTED_ENDPOINTS = [
  'GET /api/v1/catalog/categories',
  'GET /api/v1/catalog/products',
];

const VISUAL_SNAPSHOT_ROOT =
  'tests/visual/home-catalog-api-integration.visual.spec.ts-snapshots';
const VISUAL_SNAPSHOT_PREFIX = 'C-005-HOME-CATALOG-API-INTEGRATION-V1';
const EXPECTED_VISUAL_SNAPSHOT_PATHS = ['loading', 'ready', 'empty', 'error']
  .flatMap((state) => ['mobile-360', 'mobile-390', 'hires-1170'].map((project) => (
    `${VISUAL_SNAPSHOT_ROOT}/${VISUAL_SNAPSHOT_PREFIX}-${state}-${project}-linux.png`
  )))
  .sort();

const EXPECTED_ROUTE_HANDLERS = [
  'apps/ui-lab/app/api/v1/catalog/categories/route.ts',
  'apps/ui-lab/app/api/v1/catalog/products/[productId]/route.ts',
  'apps/ui-lab/app/api/v1/catalog/products/route.ts',
  'apps/ui-lab/app/api/v1/delivery/quote/route.ts',
];

const assert = (condition, message) => {
  if (!condition) throw new Error(message);
};

const sha256 = (path) => createHash('sha256').update(readFileSync(path)).digest('hex');

const runGit = (args) => execFileSync('git', args, { encoding: 'utf8' }).trim();

const walkFiles = (directory, files = []) => {
  if (!existsSync(directory)) return files;
  for (const entry of readdirSync(directory, { withFileTypes: true })) {
    const path = join(directory, entry.name);
    if (entry.isDirectory()) walkFiles(path, files);
    else files.push(path.split(sep).join('/'));
  }
  return files;
};

const changedFiles = () => {
  const tracked = runGit(['diff', '--name-only', FROZEN_PARENT_SHA, '--'])
    .split('\n')
    .filter(Boolean);
  const untracked = runGit(['ls-files', '--others', '--exclude-standard'])
    .split('\n')
    .filter(Boolean);
  return [...new Set([...tracked, ...untracked])].sort();
};

const validateAncestryAndBranch = () => {
  execFileSync('git', ['merge-base', '--is-ancestor', FROZEN_PARENT_SHA, 'HEAD']);
  if (process.env.GITHUB_ACTIONS === 'true') {
    assert(process.env.GITHUB_REF_NAME === CHILD_BRANCH, `Unexpected branch: ${process.env.GITHUB_REF_NAME}`);
    assert(runGit(['rev-parse', 'HEAD']) === process.env.GITHUB_SHA, 'Checkout differs from github.sha');
  }
};

const validateScope = () => {
  const files = changedFiles();
  const frozenChanges = files.filter((file) => FROZEN_C005_PATHS.some(
    (path) => file === path || file.startsWith(`${path}/`),
  ));
  assert(frozenChanges.length === 0, `Frozen C-005 evidence changed: ${frozenChanges.join(', ')}`);

  const forbidden = files.filter((file) => FORBIDDEN_CHANGE_PREFIXES.some(
    (prefix) => file.startsWith(prefix),
  ));
  assert(forbidden.length === 0, `A frozen layer changed: ${forbidden.join(', ')}`);

  const unauthorized = files.filter((file) => (
    !ALLOWED_EXACT_FILES.has(file)
    && !ALLOWED_PREFIXES.some((prefix) => file.startsWith(prefix))
  ));
  assert(unauthorized.length === 0, `Unauthorized Home integration changes: ${unauthorized.join(', ')}`);
  return files;
};

const validateFrozenC005 = () => {
  execFileSync('git', ['diff', '--exit-code', FROZEN_PARENT_SHA, '--', ...FROZEN_C005_PATHS]);
  assert(
    runGit(['rev-parse', `${FROZEN_PARENT_SHA}:tests/visual/home.visual.spec.ts-snapshots`])
      === '7a880906ab511d3c7e71e2e7a2b6c095bf0a5c0c',
    'Frozen C-005 snapshot tree identity differs',
  );
  assert(
    runGit(['rev-parse', `${FROZEN_PARENT_SHA}:manifests/C-005.json`])
      === '136dfbe546a1c37a0f71910e120a7c586ff98961',
    'Frozen C-005 manifest identity differs',
  );
  assert(
    runGit(['rev-parse', `${FROZEN_PARENT_SHA}:tests/visual/home.visual.spec.ts`])
      === '5911d658236c9c66fcbe2e082be3af1f78a5c2f7',
    'Frozen C-005 visual spec identity differs',
  );

  const certification = JSON.parse(readFileSync('manifests/certifications.json', 'utf8'))
    .certifications.find(({ screenId }) => screenId === 'C-005');
  assert(certification?.workflowRunId === 30570688090, 'Frozen C-005 workflow run differs');
  assert(
    certification?.artifactDigest
      === 'sha256:2ab8f6bbfb60a76b41843a4e4d956421f97d751056dc22ff6e6297fadc2d4d11',
    'Frozen C-005 artifact digest differs',
  );
};

const validateManifest = () => {
  const manifest = JSON.parse(readFileSync(MANIFEST_PATH, 'utf8'));
  assert(manifest.screenId === 'C-005-HOME-CATALOG-API-INTEGRATION', 'Integration screen identity differs');
  assert(manifest.version === '1.0.0', 'Integration manifest version differs');
  assert(manifest.parentFrozenSha === FROZEN_PARENT_SHA, 'Integration parent SHA differs');
  assert(manifest.parentManifest === 'manifests/C-005.json', 'Integration parent manifest differs');
  assert(manifest.runtimeDataSource === 'HTTP_PUBLIC_API', 'Home runtime source must be HTTP_PUBLIC_API');
  assert(isDeepStrictEqual(manifest.endpoints, EXPECTED_ENDPOINTS), 'Integration endpoint set differs');
  assert(isDeepStrictEqual(manifest.states, EXPECTED_STATES), 'Integration state set differs');
  assert(manifest.viewports?.length === 3, 'Integration Gate requires three viewports');
  assert(manifest.baselineMode === 'GATE_VALIDATION', 'Push Gate cannot author baselines');
  assert(manifest.canonicalCatalogEmpty === true, 'Canonical catalog must remain empty');
  assert(manifest.commercialSkusActivated === 0, 'Commercial SKU activation is prohibited');
  assert(manifest.syntheticRuntimeFallback === false, 'Synthetic runtime fallback is prohibited');
  assert(
    manifest.baselineReviewManifest === BASELINE_REVIEW_PATH,
    'Integration baseline review manifest path differs',
  );
  assert(
    manifest.artifactValidationScript
      === 'scripts/validate-c005-home-catalog-api-integration-baseline-artifact.mjs',
    'Integration artifact validation script path differs',
  );
  return manifest;
};

const validateBaselineReview = () => {
  const actualSnapshotPaths = walkFiles(VISUAL_SNAPSHOT_ROOT)
    .filter((path) => path.endsWith('.png'))
    .sort();
  assert(
    actualSnapshotPaths.length === 0 || actualSnapshotPaths.length === 12,
    `Expected zero bootstrap snapshots or exactly 12 reviewed snapshots; found ${actualSnapshotPaths.length}`,
  );

  if (actualSnapshotPaths.length === 0) {
    assert(!existsSync(BASELINE_REVIEW_PATH), 'Baseline review manifest is prohibited before authoring');
    return { mode: 'BASELINE_AUTHORING', reviewed: false };
  }

  assert(
    isDeepStrictEqual(actualSnapshotPaths, EXPECTED_VISUAL_SNAPSHOT_PATHS),
    'Integration snapshot filename set differs',
  );
  assert(existsSync(BASELINE_REVIEW_PATH), 'The 12 snapshots require a baseline review manifest');

  const review = JSON.parse(readFileSync(BASELINE_REVIEW_PATH, 'utf8'));
  assert(
    typeof review.candidateCommitSha === 'string'
      && /^[0-9a-f]{40}$/.test(review.candidateCommitSha),
    'Baseline review candidateCommitSha must be a full commit SHA',
  );
  execFileSync('git', ['cat-file', '-e', `${review.candidateCommitSha}^{commit}`]);
  assert(
    review.candidateCommitSha === runGit(['rev-parse', 'HEAD^']),
    'Baseline review candidateCommitSha must be exactly HEAD^',
  );
  const candidateTreeFiles = runGit(['ls-tree', '-r', '--name-only', review.candidateCommitSha])
    .split('\n')
    .filter(Boolean);
  assert(
    candidateTreeFiles.filter((path) => (
      path.startsWith(`${VISUAL_SNAPSHOT_ROOT}/`) && path.endsWith('.png')
    )).length === 0,
    'The bootstrap candidate commit must contain zero integration baseline PNGs',
  );
  assert(
    !candidateTreeFiles.includes(BASELINE_REVIEW_PATH),
    'The bootstrap candidate commit must not contain a baseline review manifest',
  );
  const materializationChanges = runGit([
    'diff',
    '--name-only',
    review.candidateCommitSha,
    'HEAD',
    '--',
  ]).split('\n').filter(Boolean).sort();
  assert(
    isDeepStrictEqual(
      materializationChanges,
      [...EXPECTED_VISUAL_SNAPSHOT_PATHS, BASELINE_REVIEW_PATH].sort(),
    ),
    'The materialization commit may contain only 12 integration PNGs and the review manifest',
  );
  const candidateWorkflowRunId = Number(review.candidateWorkflowRunId);
  assert(
    Number.isSafeInteger(candidateWorkflowRunId) && candidateWorkflowRunId > 0,
    'Baseline review candidateWorkflowRunId must identify the bootstrap run',
  );
  assert(
    review.candidateArtifactName
      === `c005-home-catalog-api-integration-v1-${review.candidateCommitSha}`,
    'Baseline review candidateArtifactName differs from the bootstrap artifact',
  );
  assert(
    typeof review.candidateArtifactDigest === 'string'
      && /^sha256:[0-9a-f]{64}$/.test(review.candidateArtifactDigest),
    'Baseline review candidateArtifactDigest must be a SHA-256 artifact digest',
  );
  assert(
    review.reviewMethod === 'WORK_VISUAL_INSPECTION',
    'Baseline review requires WORK_VISUAL_INSPECTION',
  );
  assert(Array.isArray(review.entries) && review.entries.length === 12, 'Baseline review requires 12 entries');

  const reviewedEntries = review.entries
    .map((entry) => ({ path: entry.path, sha256: entry.sha256 }))
    .sort((left, right) => left.path.localeCompare(right.path));
  assert(
    isDeepStrictEqual(reviewedEntries.map(({ path }) => path), EXPECTED_VISUAL_SNAPSHOT_PATHS),
    'Baseline review entry path set differs',
  );
  for (const entry of reviewedEntries) {
    assert(/^[0-9a-f]{64}$/.test(entry.sha256), `Invalid baseline SHA-256: ${entry.path}`);
    assert(sha256(entry.path) === entry.sha256, `Baseline review hash differs: ${entry.path}`);
  }

  return {
    mode: 'GATE_VALIDATION',
    reviewed: true,
    candidateCommitSha: review.candidateCommitSha,
    candidateWorkflowRunId,
    candidateArtifactName: review.candidateArtifactName,
    candidateArtifactDigest: review.candidateArtifactDigest,
  };
};

const validateFrozenContractsAndHandlers = () => {
  assert(sha256(OPENAPI_V1_0_PATH) === OPENAPI_V1_0_SHA256, 'OpenAPI V1.0 changed');
  assert(sha256(OPENAPI_V1_1_PATH) === OPENAPI_V1_1_SHA256, 'OpenAPI V1.1 changed');
  const handlers = walkFiles('apps/ui-lab/app/api/v1')
    .filter((path) => path.endsWith('/route.ts'))
    .sort();
  assert(isDeepStrictEqual(handlers, [...EXPECTED_ROUTE_HANDLERS].sort()), 'Public endpoint set changed');
};

const validateRuntimeBoundary = () => {
  const runtimeFiles = [
    'apps/ui-lab/app/page.tsx',
    'packages/ui/src/screens/home/HomeScreen.tsx',
    ...walkFiles('apps/ui-lab/src/client/mvp-local-36').filter((path) => /\.(?:ts|tsx)$/.test(path)),
  ].filter((path) => existsSync(path));
  assert(runtimeFiles.length >= 2, 'Home runtime boundary is missing');
  const source = runtimeFiles.map((path) => readFileSync(path, 'utf8')).join('\n');
  assert(!/home\.data/.test(source), 'The Home runtime imports the historical fixture');
  assert(!/@hielya\/persistence|node:sqlite|DatabaseSync/.test(source), 'The Home runtime bypasses HTTP persistence boundaries');
  assert(source.includes('/api/v1/catalog/categories'), 'Home runtime does not consume the category endpoint');
  assert(source.includes('/api/v1/catalog/products'), 'Home runtime does not consume the product endpoint');
  assert(
    !/\/api\/v1\/catalog\/products\/(?:\$\{|[a-z0-9])/i.test(source),
    'Home runtime consumes product detail unexpectedly',
  );
  assert(!source.includes('/api/v1/delivery/quote'), 'Home runtime consumes delivery quote unexpectedly');

  const syntheticSources = [
    'packages/ui/src/screens/home/home.data.ts',
    ...walkFiles('tests/unit').filter((path) => path.includes('mvp-home-catalog')),
    ...walkFiles('tests').filter((path) => path.includes('home-catalog-api-integration')),
  ].filter((path) => existsSync(path));
  const synthetic = syntheticSources.map((path) => readFileSync(path, 'utf8')).join('\n');
  assert(!/\bsku\s*:\s*["'`]HYA-/.test(synthetic), 'Synthetic Home fixtures cannot use canonical HYA SKUs');
};

export const validateHomeCatalogApiIntegration = () => {
  validateAncestryAndBranch();
  const files = validateScope();
  validateFrozenC005();
  const manifest = validateManifest();
  const baselineReview = validateBaselineReview();
  validateFrozenContractsAndHandlers();
  validateRuntimeBoundary();

  const result = {
    gate: 'C-005-HOME-CATALOG-API-INTEGRATION-V1',
    sourceSha: process.env.GITHUB_SHA ?? runGit(['rev-parse', 'HEAD']),
    parentFrozenSha: FROZEN_PARENT_SHA,
    branch: process.env.GITHUB_REF_NAME ?? runGit(['branch', '--show-current']),
    changedFiles: files,
    states: manifest.states,
    viewports: manifest.viewports,
    endpoints: manifest.endpoints,
    baselineReview,
    oldC005BaselinesPreserved: true,
    canonicalPublicCatalogEmpty: true,
    commercialSkusActivated: 0,
    persistenceMutations: 0,
    passed: true,
  };
  mkdirSync(dirname(EVIDENCE_PATH), { recursive: true });
  writeFileSync(EVIDENCE_PATH, `${JSON.stringify(result, null, 2)}\n`);
  return result;
};

if (process.argv[1]?.endsWith('validate-mvp-local-36-home-catalog-api-integration.mjs')) {
  const result = validateHomeCatalogApiIntegration();
  console.log(JSON.stringify(result, null, 2));
}
