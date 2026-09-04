import { createHash } from 'node:crypto';
import { execFileSync } from 'node:child_process';
import { existsSync, mkdirSync, readFileSync, readdirSync, writeFileSync } from 'node:fs';
import { dirname, join, sep } from 'node:path';
import { isDeepStrictEqual } from 'node:util';

import {
  C002_PREQUOTE_CONTINUATION_CANDIDATE_FILES,
  C002_PREQUOTE_CONTINUATION_FINAL_FILES,
  C002_PREQUOTE_CONTINUATION_SNAPSHOT_PATHS,
} from './mvp-local-36-c002-prequote-continuation-contract-changed-files.mjs';

export const FROZEN_PARENT_SHA = '60d556e5ae088f2bf98101dcf37cbf854bcc2eff';
export const FROZEN_PARENT_BRANCH = 'hielya/mvp-local-36-c002-delivery-quote-api-alignment';
export const CHILD_BRANCH = 'hielya/mvp-local-36-c002-prequote-continuation-contract';
export const MANIFEST_PATH = 'manifests/C-002-PREQUOTE-CONTINUATION-CONTRACT-V1.json';
export const REVIEW_PATH =
  'manifests/C-002-PREQUOTE-CONTINUATION-CONTRACT-V1-BASELINE-REVIEW.json';
export const SNAPSHOT_ROOT =
  'tests/visual/c002-prequote-continuation-contract.visual.spec.ts-snapshots';
export const SCOPE_EVIDENCE_PATH =
  'qa/screen-gates/C-002-PREQUOTE-CONTINUATION-CONTRACT-V1/scope-validation.json';

const assert = (condition, message) => {
  if (!condition) throw new Error(message);
};
const runGit = (args) => execFileSync('git', args, { encoding: 'utf8' }).trim();
const sha256 = (path) => createHash('sha256').update(readFileSync(path)).digest('hex');
const parents = (sha) => runGit(['rev-list', '--parents', '-n', '1', sha]).split(' ').slice(1);

const walk = (directory, files = []) => {
  if (!existsSync(directory)) return files;
  for (const entry of readdirSync(directory, { withFileTypes: true })) {
    const path = join(directory, entry.name);
    if (entry.isDirectory()) walk(path, files);
    else files.push(path.split(sep).join('/'));
  }
  return files;
};

const validateGitScope = () => {
  if (process.env.GITHUB_ACTIONS !== 'true') return [];
  execFileSync('git', ['merge-base', '--is-ancestor', FROZEN_PARENT_SHA, 'HEAD']);
  assert(process.env.GITHUB_REF_NAME === CHILD_BRANCH, 'Unexpected Gate branch');
  assert(runGit(['rev-parse', 'HEAD']) === process.env.GITHUB_SHA, 'Checkout differs from github.sha');
  const changed = runGit(['diff', '--name-only', FROZEN_PARENT_SHA, '--'])
    .split('\n').filter(Boolean).sort();
  const snapshotsExist = C002_PREQUOTE_CONTINUATION_SNAPSHOT_PATHS.every(existsSync);
  const allowed = new Set(snapshotsExist
    ? C002_PREQUOTE_CONTINUATION_FINAL_FILES
    : C002_PREQUOTE_CONTINUATION_CANDIDATE_FILES);
  const unauthorized = changed.filter((path) => !allowed.has(path));
  assert(unauthorized.length === 0, `Unauthorized Gate changes: ${unauthorized.join(', ')}`);
  return changed;
};

const validateFrozenState = () => {
  const frozen = [
    '.dev-migrations',
    'contracts/openapi',
    'contracts/catalog',
    'package.json',
    'pnpm-lock.yaml',
    'packages/application',
    'packages/persistence',
    'apps/ui-lab/app/location/page.tsx',
    'apps/ui-lab/src/client/mvp-local-36/LocationRuntime.tsx',
    'apps/ui-lab/src/client/mvp-local-36/delivery-quote-client.ts',
    'apps/ui-lab/src/client/mvp-local-36/delivery-quote-service-area-adapter.ts',
    'packages/location/src/domain/location.machine.ts',
    'packages/ui/src/screens/location/LocationScreen.tsx',
    '.github/workflows/mvp-local-36-c002-delivery-quote-api-alignment-gate.yml',
    'manifests/C-001.json',
    'manifests/C-002.json',
    'manifests/C-005.json',
    'manifests/C-002-DELIVERY-QUOTE-API-ALIGNMENT-V1.json',
    'manifests/C-002-DELIVERY-QUOTE-API-ALIGNMENT-V1-BASELINE-REVIEW.json',
    'manifests/C-005-HOME-CATALOG-API-INTEGRATION-V1.json',
    'manifests/PRODUCT-DETAIL-PUBLIC-API-INTEGRATION-V1.json',
    'tests/visual/location.visual.spec.ts-snapshots',
    'tests/visual/c002-delivery-quote-api-alignment.visual.spec.ts-snapshots',
    'tests/visual/home-catalog-api-integration.visual.spec.ts-snapshots',
    'tests/visual/product-detail-api-integration.visual.spec.ts-snapshots',
  ];
  if (process.env.GITHUB_ACTIONS === 'true') {
    execFileSync('git', ['diff', '--exit-code', FROZEN_PARENT_SHA, '--', ...frozen]);
  }
  assert(
    sha256('contracts/openapi/HIELYA_OPENAPI_V1_0.yaml')
      === 'a2c027c6294b44c94cf4be21d18fbd251b0323102e3c9ba2cba912a96d810ae9',
    'OpenAPI V1.0 changed',
  );
  assert(
    sha256('contracts/openapi/HIELYA_OPENAPI_MVP_LOCAL_36_V1_1.yaml')
      === '92e1ebcc1d817718a7f2fe9ef1ce93df60194e049d3e0349855bd4ddd24d2ec8',
    'OpenAPI V1.1 changed',
  );
};

const validateManifest = () => {
  const manifest = JSON.parse(readFileSync(MANIFEST_PATH, 'utf8'));
  assert(manifest.gate === 'C-002-PREQUOTE-CONTINUATION-CONTRACT-V1', 'Gate identity differs');
  assert(manifest.issueNumber === 10 && manifest.relatedIssue === 8, 'Issue linkage differs');
  assert(manifest.parentPr === 9, 'Parent PR differs');
  assert(manifest.parentFrozenSha === FROZEN_PARENT_SHA, 'Parent SHA differs');
  assert(manifest.childBranch === CHILD_BRANCH, 'Child branch differs');
  assert(
    manifest.classification === 'PRELIMINARY_NON_BINDING_DELIVERY_PREQUOTE',
    'Prequote classification differs',
  );
  assert(isDeepStrictEqual(manifest.validPrequote, {
    routeDistanceKm: 2.5,
    feeCents: 350,
    quoteId: null,
    deliveryQuoteId: null,
    continueEnabled: true,
    outcome: 'LOCATION_CONFIRMED',
  }), 'Valid prequote contract differs');
  assert(manifest.correlationIdUsedAsQuoteId === false, 'Correlation ID cannot be quote ID');
  assert(manifest.syntheticQuoteIdCreated === false, 'Synthetic quote ID is prohibited');
  assert(manifest.checkoutRequoteRequired === true, 'Checkout requote must remain mandatory');
  assert(manifest.directNavigationAuthorized === false, 'Direct navigation is prohibited');
  assert(manifest.baselineCount === 3, 'Exactly three snapshots are required');
  assert(manifest.priorBaselinesPreserved === true, 'Prior evidence must be preserved');
  assert(manifest.openApiModified === false && manifest.persistenceModified === false, 'Frozen contracts changed');
  assert(Array.isArray(manifest.newDependencies) && manifest.newDependencies.length === 0, 'New dependencies prohibited');
};

const validateRuleAndTests = () => {
  const rule = readFileSync('packages/location/src/domain/location.rules.ts', 'utf8');
  for (const evidence of [
    "serviceArea.reason === 'SERVICEABLE'",
    "serviceArea.distanceMethod === 'route'",
    'Number.isFinite(serviceArea.distanceMeters)',
    'Number.isInteger(serviceArea.deliveryFeeCents)',
    'Number.isFinite(Date.parse(confirmedAt))',
  ]) assert(rule.includes(evidence), `Continuation rule is missing: ${evidence}`);
  assert(!/quoteId\s*[,)]/.test(rule), 'Continuation rule still requires quoteId');
  assert(!/router\.push|location\.assign|redirect\s*\(/.test(rule), 'Direct navigation added');

  const tests = [
    'tests/unit/location.rules.test.ts',
    'tests/unit/location.machine.test.ts',
    'tests/unit/mvp-location-delivery-quote-runtime.test.tsx',
    'tests/functional/c002-prequote-continuation-contract.functional.spec.ts',
  ].map((path) => readFileSync(path, 'utf8')).join('\n');
  for (const evidence of [
    'LOCATION_CONFIRMED',
    'deliveryQuoteId: null',
    'quoteId: null',
    '2_500',
    '350',
    'data-outcome-emitted',
    'toBeEnabled',
  ]) assert(tests.includes(evidence), `Test evidence is missing: ${evidence}`);
  assert(!/correlationId[^\n]{0,80}(?:quoteId|deliveryQuoteId)\s*[:=]/i.test(tests), 'Correlation ID is promoted');
};

const validateBaselines = () => {
  const paths = walk(SNAPSHOT_ROOT).filter((path) => path.endsWith('.png')).sort();
  assert(paths.length === 0 || paths.length === 3, `Expected 0 or 3 PNGs; found ${paths.length}`);
  if (paths.length === 0) {
    assert(!existsSync(REVIEW_PATH), 'Review is prohibited before authoring');
    if (process.env.GITHUB_ACTIONS === 'true') {
      assert(runGit(['rev-parse', 'HEAD^']) === FROZEN_PARENT_SHA, 'Candidate parent differs');
      assert(parents('HEAD').length === 1, 'Candidate cannot be a merge');
      assert(runGit(['rev-list', '--count', `${FROZEN_PARENT_SHA}..HEAD`]) === '1', 'Candidate must be one commit');
    }
    return { mode: 'BASELINE_AUTHORING', reviewed: false };
  }
  assert(isDeepStrictEqual(paths, C002_PREQUOTE_CONTINUATION_SNAPSHOT_PATHS), 'Snapshot set differs');
  assert(existsSync(REVIEW_PATH), 'Review manifest is missing');
  const review = JSON.parse(readFileSync(REVIEW_PATH, 'utf8'));
  assert(review.reviewMethod === 'WORK_VISUAL_INSPECTION', 'Review method differs');
  assert(Array.isArray(review.entries) && review.entries.length === 3, 'Three reviews required');
  if (process.env.GITHUB_ACTIONS === 'true') {
    assert(review.candidateCommitSha === runGit(['rev-parse', 'HEAD^']), 'Candidate must be HEAD^');
    assert(runGit(['rev-parse', `${review.candidateCommitSha}^`]) === FROZEN_PARENT_SHA, 'Candidate parent differs');
    assert(parents('HEAD').length === 1 && parents(review.candidateCommitSha).length === 1, 'Merge commits prohibited');
    assert(runGit(['rev-list', '--count', `${FROZEN_PARENT_SHA}..HEAD`]) === '2', 'Final Gate must be two commits');
    const materialized = runGit(['diff', '--name-only', review.candidateCommitSha, 'HEAD', '--'])
      .split('\n').filter(Boolean).sort();
    assert(isDeepStrictEqual(materialized, [...C002_PREQUOTE_CONTINUATION_SNAPSHOT_PATHS, REVIEW_PATH].sort()), 'Final commit scope differs');
  }
  assert(Number(review.candidateWorkflowRunId) > 0, 'Candidate run is required');
  assert(/^sha256:[0-9a-f]{64}$/.test(review.candidateArtifactDigest), 'Artifact digest is invalid');
  assert(review.entries.every((entry) => sha256(entry.path) === entry.sha256), 'Reviewed PNG hash differs');
  return { mode: 'GATE_VALIDATION', reviewed: true, ...review };
};

const changedFiles = validateGitScope();
validateFrozenState();
validateManifest();
validateRuleAndTests();
const baseline = validateBaselines();

mkdirSync(dirname(SCOPE_EVIDENCE_PATH), { recursive: true });
writeFileSync(SCOPE_EVIDENCE_PATH, `${JSON.stringify({
  gate: 'C-002-PREQUOTE-CONTINUATION-CONTRACT-V1',
  passed: true,
  parentSha: FROZEN_PARENT_SHA,
  childBranch: CHILD_BRANCH,
  changedFiles,
  baselineMode: baseline.mode,
  prequoteClassification: 'PRELIMINARY_NON_BINDING_DELIVERY_PREQUOTE',
  quoteIdRequired: false,
  checkoutRequoteRequired: true,
  directNavigationAdded: false,
  openApiModified: false,
  persistenceModified: false,
  newDependencies: [],
}, null, 2)}\n`);

console.log(`C002_PREQUOTE_CONTINUATION_CONTRACT_VALIDATION=SUCCESS`);
console.log(`BASELINE_MODE=${baseline.mode}`);
console.log(`CHANGED_FILES=${changedFiles.length}`);
