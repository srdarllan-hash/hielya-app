import { createHash } from 'node:crypto';
import {
  existsSync,
  readFileSync,
  readdirSync,
} from 'node:fs';
import { join, relative, resolve, sep } from 'node:path';
import { fileURLToPath } from 'node:url';
import { isDeepStrictEqual } from 'node:util';

import { PRODUCT_DETAIL_API_INTEGRATION_VISUAL_SNAPSHOT_PATHS } from './mvp-local-36-product-detail-api-integration-changed-files.mjs';

const CHILD_BRANCH = 'hielya/mvp-local-36-product-detail-api-integration';
const REVIEW_PATH =
  'manifests/PRODUCT-DETAIL-PUBLIC-API-INTEGRATION-V1-BASELINE-REVIEW.json';
const GATE_MANIFEST_PATH = 'manifests/PRODUCT-DETAIL-PUBLIC-API-INTEGRATION-V1.json';
const SNAPSHOT_ROOT = 'tests/visual/product-detail-api-integration.visual.spec.ts-snapshots';
const EVIDENCE_ROOT = 'qa/screen-gates/PRODUCT-DETAIL-PUBLIC-API-INTEGRATION-V1';
const EVIDENCE_MANIFEST_PATH = `${EVIDENCE_ROOT}/EVIDENCE_MANIFEST.json`;
const SCOPE_EVIDENCE_PATH = `${EVIDENCE_ROOT}/scope-validation.json`;
const DATABASE_AUDIT_PATH = `${EVIDENCE_ROOT}/canonical-database-audit.json`;
const VALIDATOR_PATH = 'scripts/validate-product-detail-api-integration-baseline-artifact.mjs';

const assert = (condition, message) => {
  if (!condition) throw new Error(message);
};

const sha256 = (path) => createHash('sha256').update(readFileSync(path)).digest('hex');

const readJson = (path, label) => {
  assert(existsSync(path), `${label} is missing: ${path}`);
  return JSON.parse(readFileSync(path, 'utf8'));
};

const walkFiles = (directory, root = directory, files = []) => {
  assert(existsSync(directory), `Artifact extraction directory is missing: ${directory}`);
  for (const entry of readdirSync(directory, { withFileTypes: true })) {
    const path = join(directory, entry.name);
    if (entry.isDirectory()) walkFiles(path, root, files);
    else files.push(relative(root, path).split(sep).join('/'));
  }
  return files;
};

export const validateBaselineArtifact = ({
  artifactDirectory,
  repositoryRoot = process.cwd(),
  reviewPath = REVIEW_PATH,
} = {}) => {
  assert(artifactDirectory, 'Artifact extraction directory argument is required');
  const artifactRoot = resolve(artifactDirectory);
  const sourceRoot = resolve(repositoryRoot);
  const review = readJson(resolve(sourceRoot, reviewPath), 'Baseline review manifest');
  const artifactFiles = walkFiles(artifactRoot).sort();
  const artifactSnapshotPaths = artifactFiles
    .filter((path) => path.startsWith(`${SNAPSHOT_ROOT}/`) && path.endsWith('.png'))
    .sort();

  assert(
    isDeepStrictEqual(
      artifactSnapshotPaths,
      PRODUCT_DETAIL_API_INTEGRATION_VISUAL_SNAPSHOT_PATHS,
    ),
    'Candidate artifact must contain exactly the 12 Product Detail snapshot paths',
  );
  assert(!artifactFiles.includes(REVIEW_PATH), 'Bootstrap artifact cannot contain the later review manifest');

  const reviewEntries = [...(review.entries ?? [])]
    .map((entry) => ({ path: entry.path, sha256: entry.sha256 }))
    .sort((left, right) => left.path.localeCompare(right.path));
  assert(reviewEntries.length === 12, 'Baseline review must contain 12 hash entries');
  assert(
    isDeepStrictEqual(
      reviewEntries.map(({ path }) => path),
      PRODUCT_DETAIL_API_INTEGRATION_VISUAL_SNAPSHOT_PATHS,
    ),
    'Baseline review snapshot paths differ from the artifact',
  );

  for (const entry of reviewEntries) {
    assert(/^[0-9a-f]{64}$/.test(entry.sha256), `Invalid reviewed SHA-256: ${entry.path}`);
    assert(
      sha256(resolve(artifactRoot, entry.path)) === entry.sha256,
      `Candidate artifact snapshot hash differs: ${entry.path}`,
    );
    assert(
      sha256(resolve(sourceRoot, entry.path)) === entry.sha256,
      `Materialized repository snapshot hash differs: ${entry.path}`,
    );
  }

  const evidence = readJson(
    resolve(artifactRoot, EVIDENCE_MANIFEST_PATH),
    'Candidate evidence manifest',
  );
  assert(evidence.gate === 'PRODUCT-DETAIL-PUBLIC-API-INTEGRATION-V1', 'Evidence Gate identity differs');
  assert(evidence.status === 'BASELINE_CANDIDATE', 'Evidence status must be BASELINE_CANDIDATE');
  assert(evidence.sourceSha === review.candidateCommitSha, 'Evidence source SHA differs');
  assert(evidence.sourceBranch === CHILD_BRANCH, 'Evidence source branch differs');
  assert(evidence.oldBaselinesPreserved === true, 'Frozen screen preservation evidence is missing');
  assert(evidence.homeIntegrationEvidencePreserved === true, 'Frozen Home integration evidence is missing');
  assert(evidence.canonicalPublicCatalogEmpty === true, 'Canonical empty catalog evidence is missing');
  assert(evidence.canonicalProductDetailResult === 'NOT_FOUND', 'Canonical Product Detail result differs');
  assert(evidence.syntheticRuntimeFallback === false, 'Synthetic runtime fallback must remain disabled');
  assert(evidence.commercialSkusActivated === 0, 'Evidence activated commercial SKUs');
  assert(evidence.persistenceMutations === 0, 'Evidence contains persistence mutations');

  const evidenceFiles = new Map((evidence.files ?? []).map((entry) => [entry.path, entry.sha256]));
  for (const entry of reviewEntries) {
    assert(
      evidenceFiles.get(entry.path) === entry.sha256,
      `Evidence manifest does not bind snapshot hash: ${entry.path}`,
    );
  }

  const scope = readJson(resolve(artifactRoot, SCOPE_EVIDENCE_PATH), 'Scope validation evidence');
  assert(scope.passed === true, 'Candidate scope validation did not pass');
  assert(scope.sourceSha === review.candidateCommitSha, 'Scope evidence source SHA differs');
  assert(scope.branch === CHILD_BRANCH, 'Scope evidence branch differs');
  assert(scope.baselineReview?.mode === 'BASELINE_AUTHORING', 'Scope evidence mode differs');
  assert(scope.baselineReview?.reviewed === false, 'Bootstrap scope cannot claim review');
  assert(
    evidenceFiles.get(SCOPE_EVIDENCE_PATH) === sha256(resolve(artifactRoot, SCOPE_EVIDENCE_PATH)),
    'Evidence manifest does not bind passing scope evidence',
  );

  const audit = readJson(resolve(artifactRoot, DATABASE_AUDIT_PATH), 'Canonical database audit');
  assert(audit.commerciallyActive === 0, 'Database audit activated products');
  assert(audit.publiclyVisible === 0, 'Database audit exposed products');
  assert(audit.inventoryMovements === 0, 'Database audit recorded inventory movement');
  assert(audit.inventoryReservations === 0, 'Database audit recorded inventory reservation');
  assert(audit.canonicalProductDetailResult === 'NOT_FOUND', 'Database audit canonical result differs');
  assert(audit.persistenceMutations === 0, 'Database audit contains mutations');
  assert(
    evidenceFiles.get(DATABASE_AUDIT_PATH) === sha256(resolve(artifactRoot, DATABASE_AUDIT_PATH)),
    'Evidence manifest does not bind the canonical database audit',
  );

  assert(
    sha256(resolve(artifactRoot, GATE_MANIFEST_PATH))
      === sha256(resolve(sourceRoot, GATE_MANIFEST_PATH)),
    'Candidate artifact Gate manifest differs from repository',
  );
  assert(
    evidenceFiles.get(VALIDATOR_PATH) === sha256(resolve(sourceRoot, VALIDATOR_PATH)),
    'Candidate evidence does not bind the artifact validator',
  );

  return {
    gate: evidence.gate,
    candidateCommitSha: review.candidateCommitSha,
    candidateWorkflowRunId: review.candidateWorkflowRunId,
    candidateArtifactName: review.candidateArtifactName,
    candidateArtifactDigest: review.candidateArtifactDigest,
    snapshotCount: artifactSnapshotPaths.length,
    snapshotHashesMatched: true,
    scopeEvidencePassed: true,
    evidenceStatus: evidence.status,
    passed: true,
  };
};

const isMain = process.argv[1]
  && resolve(process.argv[1]) === resolve(fileURLToPath(import.meta.url));

if (isMain) {
  console.log(validateBaselineArtifact({
    artifactDirectory: process.argv[2] ?? process.env.BASELINE_ARTIFACT_DIRECTORY,
  }));
}
