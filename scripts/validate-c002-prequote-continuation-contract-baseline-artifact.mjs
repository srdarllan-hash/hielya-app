import { createHash } from 'node:crypto';
import { existsSync, readFileSync, readdirSync } from 'node:fs';
import { join, relative, resolve, sep } from 'node:path';
import { isDeepStrictEqual } from 'node:util';

import { C002_PREQUOTE_CONTINUATION_SNAPSHOT_PATHS } from './mvp-local-36-c002-prequote-continuation-contract-changed-files.mjs';

const assert = (condition, message) => { if (!condition) throw new Error(message); };
const sha256 = (path) => createHash('sha256').update(readFileSync(path)).digest('hex');
const root = resolve(process.argv[2] ?? '');
assert(process.argv[2] && existsSync(root), 'Artifact directory is required');
const files = [];
const walk = (directory) => {
  for (const entry of readdirSync(directory, { withFileTypes: true })) {
    const target = join(directory, entry.name);
    if (entry.isDirectory()) walk(target); else files.push(target);
  }
};
walk(root);
const normalized = files.map((absolute) => ({
  absolute,
  relative: relative(root, absolute).split(sep).join('/'),
}));
const find = (suffix) => {
  const matches = normalized.filter((entry) => entry.relative === suffix || entry.relative.endsWith(`/${suffix}`));
  assert(matches.length === 1, `Expected one artifact entry for ${suffix}; found ${matches.length}`);
  return matches[0].absolute;
};

const evidencePath = find('qa/screen-gates/C-002-PREQUOTE-CONTINUATION-CONTRACT-V1/EVIDENCE_MANIFEST.json');
const evidence = JSON.parse(readFileSync(evidencePath, 'utf8'));
assert(evidence.gate === 'C-002-PREQUOTE-CONTINUATION-CONTRACT-V1', 'Artifact Gate differs');
assert(evidence.status === 'BASELINE_CANDIDATE', 'Artifact is not a baseline candidate');
assert(evidence.sourceBranch === 'hielya/mvp-local-36-c002-prequote-continuation-contract', 'Artifact branch differs');
assert(evidence.expectedSnapshotCount === 3, 'Artifact snapshot count differs');
assert(evidence.validPrequote?.quoteId === null && evidence.validPrequote?.deliveryQuoteId === null, 'Artifact invented quote IDs');
assert(evidence.continueEnabled === true && evidence.outcome === 'LOCATION_CONFIRMED', 'Artifact continuation differs');
assert(evidence.checkoutRequoteRequired === true, 'Artifact omitted checkout requote');

const auditPath = find('qa/screen-gates/C-002-PREQUOTE-CONTINUATION-CONTRACT-V1/canonical-database-audit.json');
const audit = JSON.parse(readFileSync(auditPath, 'utf8'));
for (const key of ['commerciallyActive', 'publiclyVisible', 'inventoryMovements', 'inventoryReservations', 'persistenceMutations']) {
  assert(audit[key] === 0, `Database audit requires ${key}=0`);
}
assert(audit.quoteId === null && audit.deliveryQuoteId === null, 'Database audit invented IDs');
assert(audit.continuationCertified === true && audit.checkoutRequoteRequired === true, 'Database audit continuation differs');

const review = JSON.parse(readFileSync('manifests/C-002-PREQUOTE-CONTINUATION-CONTRACT-V1-BASELINE-REVIEW.json', 'utf8'));
assert(review.candidateCommitSha === evidence.sourceSha, 'Review candidate differs');
assert(Array.isArray(review.entries) && review.entries.length === 3, 'Review requires three entries');
assert(isDeepStrictEqual(review.entries.map(({ path }) => path).sort(), C002_PREQUOTE_CONTINUATION_SNAPSHOT_PATHS), 'Review paths differ');
const evidenceHashes = new Map(evidence.files.map((entry) => [entry.path, entry.sha256]));
for (const entry of review.entries) {
  assert(sha256(entry.path) === entry.sha256, `Checkout PNG differs: ${entry.path}`);
  assert(sha256(find(entry.path)) === entry.sha256, `Artifact PNG differs: ${entry.path}`);
  assert(evidenceHashes.get(entry.path) === entry.sha256, `Evidence hash differs: ${entry.path}`);
}
assert(evidenceHashes.get('qa/screen-gates/C-002-PREQUOTE-CONTINUATION-CONTRACT-V1/canonical-database-audit.json') === sha256(auditPath), 'Audit is not hash-bound');
console.log(JSON.stringify({ gate: evidence.gate, candidate: evidence.sourceSha, snapshots: 3, artifactValidated: true }, null, 2));
