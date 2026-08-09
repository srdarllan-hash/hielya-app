const snapshotRoot =
  'tests/visual/c002-prequote-continuation-contract.visual.spec.ts-snapshots';

export const C002_PREQUOTE_CONTINUATION_SNAPSHOT_PATHS = [
  'hires-1170',
  'mobile-360',
  'mobile-390',
].map((project) => (
  `${snapshotRoot}/C-002-PREQUOTE-CONTINUATION-CONTRACT-V1-success-enabled-${project}-linux.png`
)).sort();

export const C002_PREQUOTE_CONTINUATION_CANDIDATE_FILES = [
  '.github/workflows/mvp-local-36-c002-prequote-continuation-contract-gate.yml',
  'manifests/C-002-PREQUOTE-CONTINUATION-CONTRACT-V1.json',
  'packages/location/src/domain/location.rules.ts',
  'playwright.c002-prequote-continuation-contract.config.ts',
  'scripts/generate-c002-prequote-continuation-contract-evidence.mjs',
  'scripts/mvp-local-36-c002-prequote-continuation-contract-changed-files.mjs',
  'scripts/validate-c002-prequote-continuation-contract-baseline-artifact.mjs',
  'scripts/validate-mvp-local-36-c002-prequote-continuation-contract.mjs',
  'tests/accessibility/c002-prequote-continuation-contract.a11y.spec.ts',
  'tests/functional/c002-prequote-continuation-contract.functional.spec.ts',
  'tests/integration/c002-prequote-continuation-contract.database.ts',
  'tests/integration/c002-prequote-continuation-contract.global-setup.ts',
  'tests/integration/c002-prequote-continuation-contract.global-teardown.ts',
  'tests/unit/location.machine.test.ts',
  'tests/unit/location.rules.test.ts',
  'tests/unit/mvp-location-delivery-quote-runtime.test.tsx',
  'tests/visual/c002-prequote-continuation-contract.visual.spec.ts',
].sort();

export const C002_PREQUOTE_CONTINUATION_FINAL_FILES = [
  ...C002_PREQUOTE_CONTINUATION_CANDIDATE_FILES,
  ...C002_PREQUOTE_CONTINUATION_SNAPSHOT_PATHS,
  'manifests/C-002-PREQUOTE-CONTINUATION-CONTRACT-V1-BASELINE-REVIEW.json',
].sort();
