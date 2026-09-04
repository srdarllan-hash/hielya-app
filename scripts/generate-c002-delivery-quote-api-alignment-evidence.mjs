import { createHash } from 'node:crypto';
import { existsSync, mkdirSync, readFileSync, readdirSync, writeFileSync } from 'node:fs';
import { join, relative, sep } from 'node:path';

const root = process.cwd();
const parentSha = '1470e294404084119308812b049d94601926ce55';
const evidenceRoot = join(root, 'qa/screen-gates/C-002-DELIVERY-QUOTE-API-ALIGNMENT-V1');
const excludedOutputs = new Set(['EVIDENCE_MANIFEST.json', 'GATE_REPORT.md', 'SHA256SUMS.txt']);
const allowedStatuses = new Set([
  'BASELINE_CANDIDATE',
  'QA_FAILED_OR_INCOMPLETE',
  'QA_PASSED_CANDIDATE',
]);
const evidenceStatus = process.env.EVIDENCE_STATUS ?? 'QA_FAILED_OR_INCOMPLETE';

if (!allowedStatuses.has(evidenceStatus)) {
  throw new Error(`Unsupported EVIDENCE_STATUS: ${evidenceStatus}`);
}

const files = [];
const addDirectory = (path) => {
  if (!existsSync(path)) return;
  for (const entry of readdirSync(path, { withFileTypes: true })) {
    const target = join(path, entry.name);
    if (entry.isDirectory()) addDirectory(target);
    else if (!excludedOutputs.has(entry.name)) files.push(target);
  }
};

for (const path of [
  'tests/visual/c002-delivery-quote-api-alignment.visual.spec.ts-snapshots',
  'screenshots/C-002-DELIVERY-QUOTE-API-ALIGNMENT-V1',
  'playwright-report/C-002-DELIVERY-QUOTE-API-ALIGNMENT-V1',
  'test-results/C-002-DELIVERY-QUOTE-API-ALIGNMENT-V1',
  'qa/screen-gates/C-002-DELIVERY-QUOTE-API-ALIGNMENT-V1',
]) addDirectory(join(root, path));

for (const path of [
  'manifests/C-002-DELIVERY-QUOTE-API-ALIGNMENT-V1-BASELINE-REVIEW.json',
  'manifests/C-002-DELIVERY-QUOTE-API-ALIGNMENT-V1.json',
  'playwright.c002-delivery-quote-api-alignment.config.ts',
  'scripts/validate-c002-delivery-quote-api-alignment-baseline-artifact.mjs',
  'scripts/validate-mvp-local-36-c002-delivery-quote-api-alignment.mjs',
  'tests/accessibility/c002-delivery-quote-api-alignment.a11y.spec.ts',
  'tests/functional/c002-delivery-quote-api-alignment.functional.spec.ts',
  'tests/integration/c002-delivery-quote-api-alignment.fixtures.ts',
  'tests/visual/c002-delivery-quote-api-alignment.visual.spec.ts',
]) {
  const target = join(root, path);
  if (existsSync(target)) files.push(target);
}

const hashes = [...new Set(files)]
  .sort()
  .map((file) => ({
    path: relative(root, file).split(sep).join('/'),
    sha256: createHash('sha256').update(readFileSync(file)).digest('hex'),
  }));

const manifest = {
  gate: 'C-002-DELIVERY-QUOTE-API-ALIGNMENT-V1',
  status: evidenceStatus,
  sourceSha: process.env.GATE_SOURCE_SHA ?? process.env.GITHUB_SHA ?? 'LOCAL_NOT_OFFICIAL',
  sourceBranch: process.env.GATE_SOURCE_BRANCH ?? process.env.GITHUB_REF_NAME ?? 'local',
  issueNumber: 8,
  parentFrozenSha: parentSha,
  route: '/location',
  endpoint: 'POST /api/v1/delivery/quote',
  runtimeServiceAreaSource: 'HTTP_PUBLIC_DELIVERY_QUOTE',
  requestFields: ['latitude', 'longitude'],
  states: [
    'checking_service_area',
    'success',
    'out_of_area',
    'network_error',
    'timeout',
  ],
  viewports: ['360x800', '390x844', '1170x2532'],
  expectedSnapshotCount: 15,
  successEvidence: { routeDistanceKm: 2.5, feeCents: 350 },
  serverValuesValidatedBy: [
    'tests/unit/mvp-public-application.test.ts',
    'tests/unit/mvp-public-api-handlers.test.ts',
  ],
  visualFixturePolicy: 'PLAYWRIGHT_DELIVERY_QUOTE_INTERCEPTION_ONLY',
  fakeMode: 'EXPLICIT_DRIVER_FAKE_ONLY',
  fakeRuntimeFallback: false,
  quoteId: null,
  correlationIdUsedAsQuoteId: false,
  continueInScope: false,
  continueDisabledWithoutQuoteId: true,
  originalC002BaselinePreserved: true,
  c001BaselinePreserved: true,
  c005BaselinePreserved: true,
  homeIntegrationEvidencePreserved: true,
  productDetailEvidencePreserved: true,
  openApiModified: false,
  persistenceModified: false,
  applicationModified: false,
  commercialSkusActivated: 0,
  persistenceMutations: 0,
  productionAuthorized: false,
  generatedAt: new Date().toISOString(),
  files: hashes,
};

mkdirSync(evidenceRoot, { recursive: true });
writeFileSync(join(evidenceRoot, 'EVIDENCE_MANIFEST.json'), `${JSON.stringify(manifest, null, 2)}\n`);
writeFileSync(
  join(evidenceRoot, 'SHA256SUMS.txt'),
  `${hashes.map(({ path, sha256 }) => `${sha256}  ${path}`).join('\n')}\n`,
);
writeFileSync(
  join(evidenceRoot, 'GATE_REPORT.md'),
  '# C-002 Delivery Quote API Alignment V1\n\n'
    + `- Parent frozen SHA: ${parentSha}\n`
    + `- Candidate SHA: ${manifest.sourceSha}\n`
    + `- Branch: ${manifest.sourceBranch}\n`
    + '- Runtime service-area source: POST /api/v1/delivery/quote\n'
    + '- Request fields: latitude, longitude\n'
    + '- Visual states: checking, success 2.5 km/350 cents, out-of-area, network error, timeout\n'
    + '- Quote ID: null; CONTINUE is not certified by this Gate\n'
    + '- Original C-002 and prior integration baselines: preserved\n'
    + `- Result: ${evidenceStatus}\n`,
);

console.log(JSON.stringify(manifest, null, 2));
