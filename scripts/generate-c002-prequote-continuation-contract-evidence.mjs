import { createHash } from 'node:crypto';
import { existsSync, mkdirSync, readFileSync, readdirSync, writeFileSync } from 'node:fs';
import { join, relative, sep } from 'node:path';

const root = process.cwd();
const evidenceRoot = join(root, 'qa/screen-gates/C-002-PREQUOTE-CONTINUATION-CONTRACT-V1');
const status = process.env.EVIDENCE_STATUS ?? 'QA_FAILED_OR_INCOMPLETE';
if (!['BASELINE_CANDIDATE', 'QA_FAILED_OR_INCOMPLETE', 'QA_PASSED_CANDIDATE'].includes(status)) {
  throw new Error(`Unsupported EVIDENCE_STATUS: ${status}`);
}

const files = [];
const addDirectory = (path) => {
  if (!existsSync(path)) return;
  for (const entry of readdirSync(path, { withFileTypes: true })) {
    const target = join(path, entry.name);
    if (entry.isDirectory()) addDirectory(target);
    else if (!['EVIDENCE_MANIFEST.json', 'SHA256SUMS.txt', 'GATE_REPORT.md'].includes(entry.name)) files.push(target);
  }
};
for (const path of [
  'tests/visual/c002-prequote-continuation-contract.visual.spec.ts-snapshots',
  'screenshots/C-002-PREQUOTE-CONTINUATION-CONTRACT-V1',
  'playwright-report/C-002-PREQUOTE-CONTINUATION-CONTRACT-V1',
  'test-results/C-002-PREQUOTE-CONTINUATION-CONTRACT-V1',
  'qa/screen-gates/C-002-PREQUOTE-CONTINUATION-CONTRACT-V1',
]) addDirectory(join(root, path));
for (const path of [
  'manifests/C-002-PREQUOTE-CONTINUATION-CONTRACT-V1.json',
  'playwright.c002-prequote-continuation-contract.config.ts',
  'scripts/validate-mvp-local-36-c002-prequote-continuation-contract.mjs',
  'tests/accessibility/c002-prequote-continuation-contract.a11y.spec.ts',
  'tests/functional/c002-prequote-continuation-contract.functional.spec.ts',
  'tests/visual/c002-prequote-continuation-contract.visual.spec.ts',
]) if (existsSync(path)) files.push(join(root, path));

const hashes = [...new Set(files)].sort().map((file) => ({
  path: relative(root, file).split(sep).join('/'),
  sha256: createHash('sha256').update(readFileSync(file)).digest('hex'),
}));
const manifest = {
  gate: 'C-002-PREQUOTE-CONTINUATION-CONTRACT-V1',
  status,
  sourceSha: process.env.GATE_SOURCE_SHA ?? process.env.GITHUB_SHA ?? 'LOCAL_NOT_OFFICIAL',
  sourceBranch: process.env.GATE_SOURCE_BRANCH ?? process.env.GITHUB_REF_NAME ?? 'local',
  issueNumber: 10,
  parentPr: 9,
  parentSha: '60d556e5ae088f2bf98101dcf37cbf854bcc2eff',
  classification: 'PRELIMINARY_NON_BINDING_DELIVERY_PREQUOTE',
  validPrequote: { routeDistanceKm: 2.5, feeCents: 350, quoteId: null, deliveryQuoteId: null },
  continueEnabled: true,
  outcome: 'LOCATION_CONFIRMED',
  directNavigationAdded: false,
  checkoutRequoteRequired: true,
  expectedSnapshotCount: 3,
  viewports: ['360x800', '390x844', '1170x2532'],
  priorBaselinesPreserved: true,
  openApiModified: false,
  persistenceModified: false,
  newDependencies: [],
  generatedAt: new Date().toISOString(),
  files: hashes,
};
mkdirSync(evidenceRoot, { recursive: true });
writeFileSync(join(evidenceRoot, 'EVIDENCE_MANIFEST.json'), `${JSON.stringify(manifest, null, 2)}\n`);
writeFileSync(join(evidenceRoot, 'SHA256SUMS.txt'), `${hashes.map(({ path, sha256 }) => `${sha256}  ${path}`).join('\n')}\n`);
writeFileSync(join(evidenceRoot, 'GATE_REPORT.md'), `# C-002 Prequote Continuation Contract V1\n\n- Classification: PRELIMINARY_NON_BINDING_DELIVERY_PREQUOTE\n- Valid prequote: 2.5 km / 350 cents\n- quoteId: null\n- deliveryQuoteId: null\n- Outcome: LOCATION_CONFIRMED\n- Checkout requote required: true\n- Direct navigation: none\n- Result: ${status}\n`);
console.log(JSON.stringify(manifest, null, 2));
