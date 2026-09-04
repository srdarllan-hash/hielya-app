import { createHash } from 'node:crypto';
import {
  existsSync,
  mkdirSync,
  readFileSync,
  readdirSync,
  writeFileSync,
} from 'node:fs';
import { join, relative, sep } from 'node:path';

const root = process.cwd();
const parentSha = 'fe62966daca8bda94610aa1a63702a1e543b0ce6';
const evidenceRoot = join(root, 'qa/screen-gates/C-005-HOME-CATALOG-API-INTEGRATION-V1');
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
const add = (path) => {
  if (!existsSync(path)) return;
  for (const entry of readdirSync(path, { withFileTypes: true })) {
    const target = join(path, entry.name);
    if (entry.isDirectory()) add(target);
    else if (!excludedOutputs.has(entry.name)) files.push(target);
  }
};

for (const path of [
  'tests/visual/home-catalog-api-integration.visual.spec.ts-snapshots',
  'screenshots/C-005-HOME-CATALOG-API-INTEGRATION-V1',
  'playwright-report/C-005-HOME-CATALOG-API-INTEGRATION-V1',
  'test-results/C-005-HOME-CATALOG-API-INTEGRATION-V1',
  'qa/screen-gates/C-005-HOME-CATALOG-API-INTEGRATION-V1',
]) add(join(root, path));

for (const path of [
  'manifests/C-005-HOME-CATALOG-API-INTEGRATION-V1-BASELINE-REVIEW.json',
  'manifests/C-005-HOME-CATALOG-API-INTEGRATION-V1.json',
  'scripts/validate-c005-home-catalog-api-integration-baseline-artifact.mjs',
  'tests/accessibility/home-catalog-api-integration.a11y.spec.ts',
  'tests/functional/home-catalog-api-integration.functional.spec.ts',
  'tests/visual/home-catalog-api-integration.visual.spec.ts',
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
  gate: 'C-005-HOME-CATALOG-API-INTEGRATION-V1',
  status: evidenceStatus,
  sourceSha: process.env.GATE_SOURCE_SHA ?? process.env.GITHUB_SHA ?? 'LOCAL_NOT_OFFICIAL',
  sourceBranch: process.env.GATE_SOURCE_BRANCH ?? process.env.GITHUB_REF_NAME ?? 'local',
  parentFrozenSha: parentSha,
  endpoints: [
    'GET /api/v1/catalog/categories',
    'GET /api/v1/catalog/products',
  ],
  states: [
    'HOME_CATALOG_LOADING',
    'HOME_CATALOG_READY',
    'HOME_CATALOG_EMPTY',
    'HOME_CATALOG_ERROR',
  ],
  viewports: ['360x800', '390x844', '1170x2532'],
  oldC005BaselinesPreserved: true,
  canonicalPublicCatalogEmpty: true,
  syntheticRuntimeFallback: false,
  commercialSkusActivated: 0,
  persistenceMutations: 0,
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
  `# C-005 Home Catalog API Integration V1\n\n`
    + `- Parent frozen SHA: ${parentSha}\n`
    + `- Candidate SHA: ${manifest.sourceSha}\n`
    + `- Branch: ${manifest.sourceBranch}\n`
    + '- Runtime source: public HTTP catalog API\n'
    + '- Canonical catalog: deliberately empty\n'
    + '- Synthetic fixtures: Playwright interception only\n'
    + '- Legacy C-005 baselines: preserved\n'
    + `- Result: ${evidenceStatus}\n`,
);

console.log(JSON.stringify(manifest, null, 2));
