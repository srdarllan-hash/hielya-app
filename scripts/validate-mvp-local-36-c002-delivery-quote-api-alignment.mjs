import { createHash } from 'node:crypto';
import { execFileSync } from 'node:child_process';
import { existsSync, mkdirSync, readFileSync, readdirSync, writeFileSync } from 'node:fs';
import { dirname, join, sep } from 'node:path';
import { isDeepStrictEqual } from 'node:util';

import {
  C002_DELIVERY_QUOTE_ALIGNMENT_CHANGED_FILES,
  C002_DELIVERY_QUOTE_ALIGNMENT_VISUAL_SNAPSHOT_PATHS,
} from './mvp-local-36-c002-delivery-quote-api-alignment-changed-files.mjs';

export const FROZEN_PARENT_SHA = '1470e294404084119308812b049d94601926ce55';
export const FROZEN_PARENT_BRANCH = 'hielya/mvp-local-36-product-detail-api-integration';
export const CHILD_BRANCH = 'hielya/mvp-local-36-c002-delivery-quote-api-alignment';
export const MANIFEST_PATH = 'manifests/C-002-DELIVERY-QUOTE-API-ALIGNMENT-V1.json';
export const BASELINE_REVIEW_PATH =
  'manifests/C-002-DELIVERY-QUOTE-API-ALIGNMENT-V1-BASELINE-REVIEW.json';
export const EVIDENCE_PATH =
  'qa/screen-gates/C-002-DELIVERY-QUOTE-API-ALIGNMENT-V1/scope-validation.json';

const OPENAPI_V1_0_PATH = 'contracts/openapi/HIELYA_OPENAPI_V1_0.yaml';
const OPENAPI_V1_0_SHA256 = 'a2c027c6294b44c94cf4be21d18fbd251b0323102e3c9ba2cba912a96d810ae9';
const OPENAPI_V1_1_PATH = 'contracts/openapi/HIELYA_OPENAPI_MVP_LOCAL_36_V1_1.yaml';
const OPENAPI_V1_1_SHA256 = '92e1ebcc1d817718a7f2fe9ef1ce93df60194e049d3e0349855bd4ddd24d2ec8';
const SNAPSHOT_ROOT =
  'tests/visual/c002-delivery-quote-api-alignment.visual.spec.ts-snapshots';
const EXPECTED_STATES = [
  'checking_service_area',
  'success',
  'out_of_area',
  'network_error',
  'timeout',
];
const EXPECTED_VISUAL_STATES = [
  'checking-service-area',
  'success-2-5km-350c',
  'out-of-area',
  'network-error',
  'timeout',
];
const EXPECTED_SERVER_VALUES = [
  { routeDistanceKm: 0, feeCents: 200 },
  { routeDistanceKm: 1, feeCents: 260 },
  { routeDistanceKm: 2, feeCents: 320 },
  { routeDistanceKm: 2.5, feeCents: 350 },
  { routeDistanceKm: 3, feeCents: 380 },
  { routeDistanceKm: 4, feeCents: 440 },
  { routeDistanceKm: 4.01, result: 'OUT_OF_AREA' },
];

const FROZEN_PATHS = [
  '.github/workflows/c002-gate.yml',
  '.github/workflows/mvp-local-36-home-catalog-api-integration-gate.yml',
  '.github/workflows/mvp-local-36-product-detail-api-integration-gate.yml',
  '.github/workflows/reusable-screen-gate.yml',
  'contracts/openapi',
  'manifests/C-001-assets.json',
  'manifests/C-001-visual-baseline.json',
  'manifests/C-001.json',
  'manifests/C-002-assets.json',
  'manifests/C-002-visual-baseline.json',
  'manifests/C-002.json',
  'manifests/C-005-HOME-CATALOG-API-INTEGRATION-V1-BASELINE-REVIEW.json',
  'manifests/C-005-HOME-CATALOG-API-INTEGRATION-V1.json',
  'manifests/C-005.json',
  'manifests/PRODUCT-DETAIL-PUBLIC-API-INTEGRATION-V1-BASELINE-REVIEW.json',
  'manifests/PRODUCT-DETAIL-PUBLIC-API-INTEGRATION-V1.json',
  'packages/application',
  'packages/persistence',
  'playwright.home-catalog-api-integration.config.ts',
  'playwright.product-detail-api-integration.config.ts',
  'tests/accessibility/home-catalog-api-integration.a11y.spec.ts',
  'tests/accessibility/product-detail-api-integration.a11y.spec.ts',
  'tests/functional/home-catalog-api-integration.functional.spec.ts',
  'tests/functional/product-detail-api-integration.functional.spec.ts',
  'tests/visual/home.visual.spec.ts-snapshots',
  'tests/visual/location.visual.spec.ts',
  'tests/visual/location.visual.spec.ts-snapshots',
  'tests/visual/home-catalog-api-integration.visual.spec.ts-snapshots',
  'tests/visual/product-detail-api-integration.visual.spec.ts-snapshots',
];

const assert = (condition, message) => {
  if (!condition) throw new Error(message);
};
const sha256 = (path) => createHash('sha256').update(readFileSync(path)).digest('hex');
const runGit = (args) => execFileSync('git', args, { encoding: 'utf8' }).trim();
const commitParents = (sha) => runGit(['rev-list', '--parents', '-n', '1', sha])
  .split(' ')
  .slice(1);

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
  const authorized = new Set(C002_DELIVERY_QUOTE_ALIGNMENT_CHANGED_FILES);
  const unauthorized = files.filter((file) => !authorized.has(file));
  assert(unauthorized.length === 0, `Unauthorized C-002 alignment changes: ${unauthorized.join(', ')}`);
  return files;
};

const validateFrozenArtifacts = () => {
  if (process.env.GITHUB_ACTIONS === 'true') {
    execFileSync('git', ['diff', '--exit-code', FROZEN_PARENT_SHA, '--', ...FROZEN_PATHS]);
    assert(
      runGit(['rev-parse', `HEAD:packages/application`])
        === runGit(['rev-parse', `${FROZEN_PARENT_SHA}:packages/application`]),
      'The certified application package changed',
    );
    assert(
      runGit(['rev-parse', `HEAD:packages/persistence`])
        === runGit(['rev-parse', `${FROZEN_PARENT_SHA}:packages/persistence`]),
      'The certified persistence package changed',
    );
    assert(
      runGit(['rev-parse', `HEAD:pnpm-lock.yaml`])
        === runGit(['rev-parse', `${FROZEN_PARENT_SHA}:pnpm-lock.yaml`]),
      'The lockfile changed; new dependencies are prohibited',
    );
    assert(
      runGit(['rev-parse', `HEAD:package.json`])
        === runGit(['rev-parse', `${FROZEN_PARENT_SHA}:package.json`]),
      'The root package contract changed',
    );
    const frozenObjects = new Map([
      ['manifests/C-002.json', '20a8980659774590c2a42a27fcc74f5c0d3015c3'],
      ['manifests/C-002-assets.json', 'cadb916200edda1dba1515ce1d75abd3e19647e6'],
      ['manifests/C-002-visual-baseline.json', '5b655732d5df284b2336565ee1e2e2eee4774848'],
      ['tests/visual/location.visual.spec.ts-snapshots', 'ab35f0e0495c19a6cb765be7610cfbb99859d589'],
      ['manifests/PRODUCT-DETAIL-PUBLIC-API-INTEGRATION-V1.json', 'b3940d5edb5b18400d0e1bd1b6c907aae71345df'],
      ['manifests/PRODUCT-DETAIL-PUBLIC-API-INTEGRATION-V1-BASELINE-REVIEW.json', '7e5e7c9ec1c4309489e3e77442c031ccf8348320'],
      ['tests/visual/product-detail-api-integration.visual.spec.ts-snapshots', '1236e8eb4047c60bac22efd8d5716acf2e26f964'],
    ]);
    for (const [path, expected] of frozenObjects) {
      assert(runGit(['rev-parse', `HEAD:${path}`]) === expected, `Frozen Git object differs: ${path}`);
    }
  }
  assert(sha256(OPENAPI_V1_0_PATH) === OPENAPI_V1_0_SHA256, 'OpenAPI V1.0 changed');
  assert(sha256(OPENAPI_V1_1_PATH) === OPENAPI_V1_1_SHA256, 'OpenAPI V1.1 changed');
  assert(
    sha256('manifests/C-002.json')
      === 'ab45a0dab50bc3a6cb93c07930f16e59b739463a15845824555c8d8fbc79af5c',
    'Frozen C-002 manifest changed',
  );
  assert(
    sha256('manifests/C-005-HOME-CATALOG-API-INTEGRATION-V1.json')
      === 'd351d920950ba112b622d22fe5f512a3756ef0e402622b4c82dfde350e7d07f3',
    'Frozen Home integration manifest changed',
  );
  assert(
    sha256('manifests/PRODUCT-DETAIL-PUBLIC-API-INTEGRATION-V1.json')
      === 'a8f6da2a14aa067f3d05c47c3bb4977f98b4885f0a8a637109321a863be7c9e0',
    'Frozen Product Detail manifest changed',
  );
};

const validateManifest = () => {
  const manifest = JSON.parse(readFileSync(MANIFEST_PATH, 'utf8'));
  assert(manifest.screenId === 'C-002-DELIVERY-QUOTE-API-ALIGNMENT', 'Gate screen identity differs');
  assert(manifest.version === '1.0.0', 'Gate manifest version differs');
  assert(manifest.issueNumber === 8, 'Gate must remain linked to Issue #8');
  assert(manifest.parentFrozenSha === FROZEN_PARENT_SHA, 'Gate parent SHA differs');
  assert(manifest.childBranch === CHILD_BRANCH, 'Gate child branch differs');
  assert(manifest.route === '/location', 'C-002 route differs');
  assert(manifest.runtimeServiceAreaSource === 'HTTP_PUBLIC_DELIVERY_QUOTE', 'Runtime source differs');
  assert(manifest.endpoint === 'POST /api/v1/delivery/quote', 'Delivery quote endpoint differs');
  assert(isDeepStrictEqual(manifest.requestFields, ['latitude', 'longitude']), 'Request field whitelist differs');
  assert(manifest.clientCalculatesDistance === false, 'Client distance calculation is prohibited');
  assert(manifest.clientCalculatesFee === false, 'Client fee calculation is prohibited');
  assert(manifest.clientHardcodesRadius === false, 'Client radius hardcode is prohibited');
  assert(manifest.explicitFakeMode === 'driver=fake', 'Explicit fake mode differs');
  assert(manifest.fakeRuntimeFallback === false, 'Fake runtime fallback is prohibited');
  assert(manifest.quoteId === null, 'The simulated quote must retain quoteId=null');
  assert(manifest.correlationIdUsedAsQuoteId === false, 'Correlation ID cannot be a quote ID');
  assert(manifest.continueInScope === false, 'CONTINUE is outside this Gate');
  assert(
    manifest.continueDisabledWithoutQuoteId === true,
    'CONTINUE must remain disabled when the public API provides no quote ID',
  );
  assert(isDeepStrictEqual(manifest.states, EXPECTED_STATES), 'The five integration states differ');
  assert(
    isDeepStrictEqual(manifest.visualEvidenceStates, EXPECTED_VISUAL_STATES),
    'The five visual evidence states differ',
  );
  assert(manifest.viewports?.length === 3, 'Exactly three viewports are required');
  assert(manifest.baselineCount === 15, 'Exactly 15 reviewed PNGs are required');
  assert(
    isDeepStrictEqual(manifest.certifiedServerValues, EXPECTED_SERVER_VALUES),
    'Certified server-value evidence differs',
  );
  assert(manifest.baselineMode === 'GATE_VALIDATION', 'Push Gate cannot certify authoring mode');
  assert(manifest.originalC002BaselinePreserved === true, 'Original C-002 evidence must be preserved');
  assert(manifest.priorIntegrationBaselinesPreserved === true, 'Prior integration evidence must be preserved');
  assert(manifest.openApiModified === false, 'OpenAPI changes are prohibited');
  assert(manifest.persistenceModified === false, 'Persistence changes are prohibited');
  assert(manifest.applicationModified === false, 'Application changes are prohibited');
  assert(Array.isArray(manifest.newDependencies) && manifest.newDependencies.length === 0, 'New dependencies are prohibited');
  assert(manifest.productionAuthorized === false, 'Production remains blocked');
  assert(manifest.realRoutingProvider === false, 'Real routing remains blocked');
  assert(manifest.futureLayersStarted === false, 'Future layers remain blocked');
  assert(
    manifest.baselineReviewManifest === BASELINE_REVIEW_PATH,
    'Baseline review manifest path differs',
  );
  return manifest;
};

const validateBaselineReview = () => {
  const actualSnapshotPaths = walkFiles(SNAPSHOT_ROOT)
    .filter((path) => path.endsWith('.png'))
    .sort();
  assert(
    actualSnapshotPaths.length === 0 || actualSnapshotPaths.length === 15,
    `Expected zero bootstrap snapshots or exactly 15 reviewed snapshots; found ${actualSnapshotPaths.length}`,
  );
  if (actualSnapshotPaths.length === 0) {
    assert(!existsSync(BASELINE_REVIEW_PATH), 'Baseline review is prohibited before visual authoring');
    if (process.env.GITHUB_ACTIONS === 'true') {
      assert(
        runGit(['rev-parse', 'HEAD^']) === FROZEN_PARENT_SHA,
        'The baseline-authoring commit must descend directly from the frozen parent SHA',
      );
      assert(commitParents('HEAD').length === 1, 'The baseline-authoring commit cannot be a merge');
      assert(
        runGit(['rev-list', '--count', `${FROZEN_PARENT_SHA}..HEAD`]) === '1',
        'Baseline authoring must contain exactly one commit after the frozen parent',
      );
    }
    return { mode: 'BASELINE_AUTHORING', reviewed: false };
  }

  assert(
    isDeepStrictEqual(actualSnapshotPaths, C002_DELIVERY_QUOTE_ALIGNMENT_VISUAL_SNAPSHOT_PATHS),
    'C-002 alignment snapshot filename set differs',
  );
  assert(existsSync(BASELINE_REVIEW_PATH), 'The 15 snapshots require a baseline review manifest');
  const review = JSON.parse(readFileSync(BASELINE_REVIEW_PATH, 'utf8'));
  assert(/^[0-9a-f]{40}$/.test(review.candidateCommitSha), 'Review candidate SHA must be full');
  if (process.env.GITHUB_ACTIONS === 'true') {
    execFileSync('git', ['cat-file', '-e', `${review.candidateCommitSha}^{commit}`]);
    assert(review.candidateCommitSha === runGit(['rev-parse', 'HEAD^']), 'Candidate must be HEAD^');
    assert(
      runGit(['rev-parse', `${review.candidateCommitSha}^`]) === FROZEN_PARENT_SHA,
      'Candidate must descend directly from the certified parent',
    );
    assert(commitParents('HEAD').length === 1, 'The materialization commit cannot be a merge');
    assert(
      commitParents(review.candidateCommitSha).length === 1,
      'The candidate commit cannot be a merge',
    );
    assert(
      runGit(['rev-list', '--count', `${FROZEN_PARENT_SHA}..HEAD`]) === '2',
      'The final Gate must contain exactly two commits after the frozen parent',
    );
    const materializationChanges = runGit(['diff', '--name-only', review.candidateCommitSha, 'HEAD', '--'])
      .split('\n')
      .filter(Boolean)
      .sort();
    assert(
      isDeepStrictEqual(
        materializationChanges,
        [...C002_DELIVERY_QUOTE_ALIGNMENT_VISUAL_SNAPSHOT_PATHS, BASELINE_REVIEW_PATH].sort(),
      ),
      'Materialization commit may contain only 15 PNGs and the review manifest',
    );
  }
  assert(Number(review.candidateWorkflowRunId) > 0, 'Review requires workflow run id');
  assert(
    review.candidateArtifactName
      === `c002-delivery-quote-api-alignment-v1-${review.candidateCommitSha}`,
    'Candidate artifact name differs',
  );
  assert(
    /^sha256:[0-9a-f]{64}$/.test(review.candidateArtifactDigest),
    'Candidate artifact digest differs',
  );
  assert(review.reviewMethod === 'WORK_VISUAL_INSPECTION', 'Visual review method differs');
  assert(Array.isArray(review.entries) && review.entries.length === 15, 'Review requires 15 entries');
  const entries = review.entries
    .map((entry) => ({ path: entry.path, sha256: entry.sha256 }))
    .sort((left, right) => left.path.localeCompare(right.path));
  assert(
    isDeepStrictEqual(entries.map(({ path }) => path), C002_DELIVERY_QUOTE_ALIGNMENT_VISUAL_SNAPSHOT_PATHS),
    'Review entry paths differ',
  );
  for (const entry of entries) {
    assert(/^[0-9a-f]{64}$/.test(entry.sha256), `Invalid reviewed SHA-256: ${entry.path}`);
    assert(sha256(entry.path) === entry.sha256, `Reviewed PNG differs: ${entry.path}`);
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

const validateRuntimeBoundary = () => {
  const paths = [
    'apps/ui-lab/app/location/page.tsx',
    'apps/ui-lab/src/client/mvp-local-36/LocationRuntime.tsx',
    'apps/ui-lab/src/client/mvp-local-36/delivery-quote-client.ts',
    'apps/ui-lab/src/client/mvp-local-36/delivery-quote-service-area-adapter.ts',
    'packages/ui/src/screens/location/LocationScreen.tsx',
  ];
  for (const path of paths) assert(existsSync(path), `Runtime file is missing: ${path}`);
  const source = paths.map((path) => readFileSync(path, 'utf8')).join('\n');
  assert(source.includes('/api/v1/delivery/quote'), 'C-002 runtime does not consume delivery quote HTTP');
  assert(!/@hielya\/persistence|node:sqlite|DatabaseSync|contracts\/catalog/.test(source), 'Client runtime bypasses HTTP');
  assert(!/deliveryBaseFeeCents|deliveryFeePerKmCents|maximumRoadDistanceKm/.test(source), 'Client contains commercial delivery settings');
  assert(!/feeCents\s*[:=]\s*200|feeCents\s*[:=]\s*350|0\.6\s*\*/.test(source), 'Client contains a delivery fee calculation or value');
  assert(!/correlationId[^\n]{0,80}quoteId|quoteId[^\n]{0,80}correlationId/i.test(source), 'Correlation ID is used as quote ID');
  assert(
    !/(?:import[^;]*\bFakeServiceAreaService\b|new\s+FakeServiceAreaService\s*\()/s.test(source),
    'Normal app runtime imports or instantiates the fake service-area adapter',
  );
  const runtimeSource = readFileSync('apps/ui-lab/src/client/mvp-local-36/LocationRuntime.tsx', 'utf8');
  assert(
    /serviceArea:\s*new\s+DeliveryQuoteServiceAreaAdapter/.test(runtimeSource),
    'Normal LocationRuntime does not explicitly override serviceArea with the HTTP adapter',
  );
  const explicitFakeSelection = source.includes("driver === 'fake'")
    || source.includes("driver === \"fake\"")
    || source.includes("driver !== 'fake'")
    || source.includes("driver !== \"fake\"");
  assert(explicitFakeSelection, 'Fake mode is not explicit');
  const pageSource = readFileSync('apps/ui-lab/app/location/page.tsx', 'utf8');
  assert(pageSource.includes('LocationRuntime'), 'Normal /location runtime is not HTTP-composed');
  assert(/params\.driver\s*!==\s*['"]fake['"]/.test(pageSource), 'Absent/browser driver must select LocationRuntime');
  const screenSource = readFileSync('packages/ui/src/screens/location/LocationScreen.tsx', 'utf8');
  assert(
    /disabled=\{!canContinue\}/.test(screenSource),
    'CONTINUE is not disabled when the certified API supplies quoteId=null',
  );
  assert(
    /disabled=\{serviceAreaNavigationLocked\}/.test(screenSource),
    'An in-flight service-area quote can still be abandoned through a stale UI action',
  );
  assert(
    /state === ['"]retrying['"][^;]+context\.lastOperation === ['"]service_area['"]/.test(screenSource),
    'A retried service-area quote can still be abandoned through a stale UI action',
  );
};

validateAncestryAndBranch();
const files = validateScope();
validateFrozenArtifacts();
const manifest = validateManifest();
const baseline = validateBaselineReview();
validateRuntimeBoundary();

const result = {
  gate: 'C-002-DELIVERY-QUOTE-API-ALIGNMENT-V1',
  parentFrozenSha: FROZEN_PARENT_SHA,
  childBranch: CHILD_BRANCH,
  issueNumber: 8,
  changedFiles: files,
  baseline,
  runtimeServiceAreaSource: manifest.runtimeServiceAreaSource,
  requestFields: manifest.requestFields,
  quoteId: null,
  continueInScope: false,
  originalC002BaselinePreserved: true,
  priorIntegrationBaselinesPreserved: true,
  openApiModified: false,
  persistenceModified: false,
  applicationModified: false,
  newDependencies: [],
};
mkdirSync(dirname(EVIDENCE_PATH), { recursive: true });
writeFileSync(EVIDENCE_PATH, `${JSON.stringify(result, null, 2)}\n`);
console.log(JSON.stringify(result, null, 2));
