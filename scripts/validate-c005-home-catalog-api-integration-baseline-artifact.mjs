import { createHash } from 'node:crypto';
import {
  existsSync,
  readFileSync,
  readdirSync,
} from 'node:fs';
import { join, relative, resolve, sep } from 'node:path';
import { fileURLToPath } from 'node:url';
import { isDeepStrictEqual } from 'node:util';

const CHILD_BRANCH = 'hielya/mvp-local-36-home-catalog-api-integration';
const REVIEW_PATH =
  'manifests/C-005-HOME-CATALOG-API-INTEGRATION-V1-BASELINE-REVIEW.json';
const GATE_MANIFEST_PATH = 'manifests/C-005-HOME-CATALOG-API-INTEGRATION-V1.json';
const SNAPSHOT_ROOT = 'tests/visual/home-catalog-api-integration.visual.spec.ts-snapshots';
const SNAPSHOT_PREFIX = 'C-005-HOME-CATALOG-API-INTEGRATION-V1';
const EVIDENCE_ROOT = 'qa/screen-gates/C-005-HOME-CATALOG-API-INTEGRATION-V1';
const EVIDENCE_MANIFEST_PATH = `${EVIDENCE_ROOT}/EVIDENCE_MANIFEST.json`;
const SCOPE_EVIDENCE_PATH = `${EVIDENCE_ROOT}/scope-validation.json`;
const DATABASE_AUDIT_PATH = `${EVIDENCE_ROOT}/canonical-database-audit.json`;
const VALIDATOR_PATH =
  'scripts/validate-c005-home-catalog-api-integration-baseline-artifact.mjs';

const EXPECTED_SNAPSHOT_PATHS = ['loading', 'ready', 'empty', 'error']
  .flatMap((state) => ['mobile-360', 'mobile-390', 'hires-1170'].map((project) => (
    `${SNAPSHOT_ROOT}/${SNAPSHOT_PREFIX}-${state}-${project}-linux.png`
  )))
  .sort();

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
    isDeepStrictEqual(artifactSnapshotPaths, EXPECTED_SNAPSHOT_PATHS),
    'Candidate artifact must contain exactly the 12 versioned integration snapshot paths',
  );
  assert(
    !artifactFiles.includes(REVIEW_PATH),
    'Bootstrap candidate artifact must not contain the later review manifest',
  );

  const reviewEntries = [...(review.entries ?? [])]
    .map((entry) => ({ path: entry.path, sha256: entry.sha256 }))
    .sort((left, right) => left.path.localeCompare(right.path));
  assert(reviewEntries.length === 12, 'Baseline review manifest must contain 12 hash entries');
  assert(
    isDeepStrictEqual(reviewEntries.map(({ path }) => path), EXPECTED_SNAPSHOT_PATHS),
    'Baseline review snapshot path set differs from the candidate artifact',
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
  assert(evidence.gate === 'C-005-HOME-CATALOG-API-INTEGRATION-V1', 'Evidence Gate identity differs');
  assert(evidence.status === 'BASELINE_CANDIDATE', 'Candidate evidence status must be BASELINE_CANDIDATE');
  assert(evidence.sourceSha === review.candidateCommitSha, 'Candidate evidence source SHA differs');
  assert(evidence.sourceBranch === CHILD_BRANCH, 'Candidate evidence source branch differs');
  assert(evidence.oldC005BaselinesPreserved === true, 'Frozen C-005 preservation evidence is missing');
  assert(evidence.canonicalPublicCatalogEmpty === true, 'Canonical empty catalog evidence is missing');
  assert(evidence.syntheticRuntimeFallback === false, 'Synthetic runtime fallback must remain disabled');
  assert(evidence.commercialSkusActivated === 0, 'Candidate evidence activated commercial SKUs');
  assert(evidence.persistenceMutations === 0, 'Candidate evidence contains persistence mutations');

  const evidenceFiles = new Map(
    (evidence.files ?? []).map((entry) => [entry.path, entry.sha256]),
  );
  for (const entry of reviewEntries) {
    assert(
      evidenceFiles.get(entry.path) === entry.sha256,
      `Candidate evidence manifest does not bind snapshot hash: ${entry.path}`,
    );
  }

  const scope = readJson(resolve(artifactRoot, SCOPE_EVIDENCE_PATH), 'Scope validation evidence');
  assert(scope.passed === true, 'Candidate scope validation did not pass');
  assert(scope.sourceSha === review.candidateCommitSha, 'Scope evidence source SHA differs');
  assert(scope.branch === CHILD_BRANCH, 'Scope evidence source branch differs');
  assert(scope.baselineReview?.mode === 'BASELINE_AUTHORING', 'Scope evidence mode differs');
  assert(scope.baselineReview?.reviewed === false, 'Bootstrap scope cannot claim a completed review');
  assert(
    evidenceFiles.get(SCOPE_EVIDENCE_PATH) === sha256(resolve(artifactRoot, SCOPE_EVIDENCE_PATH)),
    'Evidence manifest does not bind the passing scope validation',
  );

  const databaseAudit = readJson(
    resolve(artifactRoot, DATABASE_AUDIT_PATH),
    'Canonical database audit',
  );
  assert(databaseAudit.commerciallyActive === 0, 'Candidate database audit activated products');
  assert(databaseAudit.publiclyVisible === 0, 'Candidate database audit exposed catalog products');
  assert(databaseAudit.inventoryMovements === 0, 'Candidate database audit recorded inventory movement');
  assert(databaseAudit.inventoryReservations === 0, 'Candidate database audit recorded inventory reservation');
  assert(databaseAudit.persistenceMutations === 0, 'Candidate database audit contains mutations');

  assert(
    sha256(resolve(artifactRoot, GATE_MANIFEST_PATH))
      === sha256(resolve(sourceRoot, GATE_MANIFEST_PATH)),
    'Candidate artifact Gate manifest differs from the materialized repository',
  );
  assert(
    evidenceFiles.get(VALIDATOR_PATH) === sha256(resolve(sourceRoot, VALIDATOR_PATH)),
    'Candidate evidence does not bind the artifact content validator',
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
  const result = validateBaselineArtifact({
    artifactDirectory: process.argv[2] ?? process.env.BASELINE_ARTIFACT_DIRECTORY,
  });
  console.log(JSON.stringify(result, null, 2));
}
