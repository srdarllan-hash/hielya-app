import { createHash } from 'node:crypto';
import { existsSync, readFileSync, readdirSync } from 'node:fs';
import { join, relative, resolve, sep } from 'node:path';
import { isDeepStrictEqual } from 'node:util';

import { C002_DELIVERY_QUOTE_ALIGNMENT_VISUAL_SNAPSHOT_PATHS } from './mvp-local-36-c002-delivery-quote-api-alignment-changed-files.mjs';

const CHILD_BRANCH = 'hielya/mvp-local-36-c002-delivery-quote-api-alignment';
const REVIEW_PATH = 'manifests/C-002-DELIVERY-QUOTE-API-ALIGNMENT-V1-BASELINE-REVIEW.json';
const EVIDENCE_SUFFIX =
  'qa/screen-gates/C-002-DELIVERY-QUOTE-API-ALIGNMENT-V1/EVIDENCE_MANIFEST.json';

const assert = (condition, message) => {
  if (!condition) throw new Error(message);
};
const sha256 = (path) => createHash('sha256').update(readFileSync(path)).digest('hex');

const walk = (directory, files = []) => {
  if (!existsSync(directory)) return files;
  for (const entry of readdirSync(directory, { withFileTypes: true })) {
    const target = join(directory, entry.name);
    if (entry.isDirectory()) walk(target, files);
    else files.push(target);
  }
  return files;
};

const artifactRoot = resolve(process.argv[2] ?? '');
assert(process.argv[2], 'Artifact directory argument is required');
assert(existsSync(artifactRoot), `Artifact directory does not exist: ${artifactRoot}`);
const artifactFiles = walk(artifactRoot);
const normalized = artifactFiles.map((path) => ({
  absolute: path,
  relative: relative(artifactRoot, path).split(sep).join('/'),
}));
const findSuffix = (suffix) => {
  const matches = normalized.filter(({ relative: path }) => path === suffix || path.endsWith(`/${suffix}`));
  assert(matches.length === 1, `Expected one artifact file ending in ${suffix}; found ${matches.length}`);
  return matches[0].absolute;
};

const evidencePath = findSuffix(EVIDENCE_SUFFIX);
const evidence = JSON.parse(readFileSync(evidencePath, 'utf8'));
assert(evidence.gate === 'C-002-DELIVERY-QUOTE-API-ALIGNMENT-V1', 'Artifact Gate identity differs');
assert(evidence.status === 'BASELINE_CANDIDATE', 'Downloaded artifact is not a baseline candidate');
assert(evidence.sourceBranch === CHILD_BRANCH, 'Artifact source branch differs');
assert(/^[0-9a-f]{40}$/.test(evidence.sourceSha), 'Artifact source SHA is invalid');
assert(evidence.expectedSnapshotCount === 15, 'Artifact snapshot count contract differs');
assert(evidence.runtimeServiceAreaSource === 'HTTP_PUBLIC_DELIVERY_QUOTE', 'Artifact runtime source differs');
assert(isDeepStrictEqual(evidence.requestFields, ['latitude', 'longitude']), 'Artifact request fields differ');
assert(evidence.quoteId === null, 'Artifact invented a quote ID');
assert(evidence.continueInScope === false, 'Artifact unexpectedly certifies CONTINUE');
assert(
  evidence.continueDisabledWithoutQuoteId === true,
  'Artifact does not prove the disabled CONTINUE state without a quote ID',
);
assert(evidence.originalC002BaselinePreserved === true, 'Artifact does not preserve original C-002');

const databaseAuditSuffix =
  'qa/screen-gates/C-002-DELIVERY-QUOTE-API-ALIGNMENT-V1/canonical-database-audit.json';
const databaseAuditPath = findSuffix(databaseAuditSuffix);
const databaseAudit = JSON.parse(readFileSync(databaseAuditPath, 'utf8'));
for (const field of [
  'commerciallyActive',
  'publiclyVisible',
  'inventoryMovements',
  'inventoryReservations',
  'persistenceMutations',
]) {
  assert(databaseAudit[field] === 0, `Candidate database audit must retain ${field}=0`);
}
assert(databaseAudit.settings?.deliveryBaseFeeCents === 200, 'Candidate base fee setting differs');
assert(databaseAudit.settings?.deliveryFeePerKmCents === 60, 'Candidate per-km setting differs');
assert(databaseAudit.settings?.maximumRoadDistanceKm === 4, 'Candidate maximum radius setting differs');
assert(databaseAudit.deterministicRoadDistanceKm === 2.5, 'Candidate deterministic distance differs');
assert(databaseAudit.expectedFeeCents === 350, 'Candidate expected fee differs');
assert(databaseAudit.quoteId === null, 'Candidate database evidence invented a quote ID');
assert(databaseAudit.continuationCertified === false, 'Candidate database evidence certifies CONTINUE');

assert(existsSync(REVIEW_PATH), 'Current checkout is missing the reviewed baseline manifest');
const review = JSON.parse(readFileSync(REVIEW_PATH, 'utf8'));
assert(review.candidateCommitSha === evidence.sourceSha, 'Review candidate SHA differs from artifact');
assert(Array.isArray(review.entries) && review.entries.length === 15, 'Review must contain 15 entries');

const reviewedPaths = review.entries.map(({ path }) => path).sort();
assert(
  isDeepStrictEqual(reviewedPaths, C002_DELIVERY_QUOTE_ALIGNMENT_VISUAL_SNAPSHOT_PATHS),
  'Reviewed snapshot filename set differs',
);

for (const entry of review.entries) {
  assert(/^[0-9a-f]{64}$/.test(entry.sha256), `Reviewed hash is invalid: ${entry.path}`);
  assert(existsSync(entry.path), `Reviewed checkout PNG is missing: ${entry.path}`);
  assert(sha256(entry.path) === entry.sha256, `Reviewed checkout PNG hash differs: ${entry.path}`);
  const artifactPng = findSuffix(entry.path);
  assert(sha256(artifactPng) === entry.sha256, `Candidate artifact PNG differs: ${entry.path}`);
}

const evidenceFiles = new Map((evidence.files ?? []).map((entry) => [entry.path, entry.sha256]));
assert(
  evidenceFiles.get(databaseAuditSuffix) === sha256(databaseAuditPath),
  'Evidence manifest does not bind the canonical database audit',
);
for (const path of C002_DELIVERY_QUOTE_ALIGNMENT_VISUAL_SNAPSHOT_PATHS) {
  assert(evidenceFiles.get(path) === sha256(path), `Evidence manifest hash differs: ${path}`);
}

console.log(JSON.stringify({
  gate: evidence.gate,
  candidateCommitSha: evidence.sourceSha,
  reviewedSnapshotCount: review.entries.length,
  artifactValidated: true,
}, null, 2));
