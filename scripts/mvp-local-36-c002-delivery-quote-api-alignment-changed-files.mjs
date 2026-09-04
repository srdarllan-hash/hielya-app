const snapshots = [
  'checking-service-area',
  'network-error',
  'out-of-area',
  'success-2-5km-350c',
  'timeout',
].flatMap((state) => [
  `tests/visual/c002-delivery-quote-api-alignment.visual.spec.ts-snapshots/C-002-DELIVERY-QUOTE-API-ALIGNMENT-V1-${state}-hires-1170-linux.png`,
  `tests/visual/c002-delivery-quote-api-alignment.visual.spec.ts-snapshots/C-002-DELIVERY-QUOTE-API-ALIGNMENT-V1-${state}-mobile-360-linux.png`,
  `tests/visual/c002-delivery-quote-api-alignment.visual.spec.ts-snapshots/C-002-DELIVERY-QUOTE-API-ALIGNMENT-V1-${state}-mobile-390-linux.png`,
]);

export const C002_DELIVERY_QUOTE_ALIGNMENT_VISUAL_SNAPSHOT_PATHS = snapshots.sort();

export const C002_DELIVERY_QUOTE_ALIGNMENT_CHANGED_FILES = [
  '.github/workflows/mvp-local-36-c002-delivery-quote-api-alignment-gate.yml',
  'apps/ui-lab/app/location/page.tsx',
  'apps/ui-lab/src/client/mvp-local-36/LocationRuntime.tsx',
  'apps/ui-lab/src/client/mvp-local-36/delivery-quote-client.ts',
  'apps/ui-lab/src/client/mvp-local-36/delivery-quote-service-area-adapter.ts',
  'manifests/C-002-DELIVERY-QUOTE-API-ALIGNMENT-V1-BASELINE-REVIEW.json',
  'manifests/C-002-DELIVERY-QUOTE-API-ALIGNMENT-V1.json',
  'packages/location/src/domain/location.machine.ts',
  'packages/location/src/domain/location.types.ts',
  'packages/location/src/factory.ts',
  'packages/ui/src/screens/location/LocationScreen.tsx',
  'playwright.c002-delivery-quote-api-alignment.config.ts',
  'scripts/generate-c002-delivery-quote-api-alignment-evidence.mjs',
  'scripts/mvp-local-36-c002-delivery-quote-api-alignment-changed-files.mjs',
  'scripts/validate-c002-delivery-quote-api-alignment-baseline-artifact.mjs',
  'scripts/validate-mvp-local-36-c002-delivery-quote-api-alignment.mjs',
  'tests/accessibility/c002-delivery-quote-api-alignment.a11y.spec.ts',
  'tests/functional/c002-delivery-quote-api-alignment.functional.spec.ts',
  'tests/integration/c002-delivery-quote-api-alignment.database.ts',
  'tests/integration/c002-delivery-quote-api-alignment.fixtures.ts',
  'tests/integration/c002-delivery-quote-api-alignment.global-setup.ts',
  'tests/integration/c002-delivery-quote-api-alignment.global-teardown.ts',
  'tests/unit/location.adapters.test.ts',
  'tests/unit/location.machine.test.ts',
  'tests/unit/mvp-location-delivery-quote-client.test.ts',
  'tests/unit/mvp-location-delivery-quote-runtime.test.tsx',
  'tests/visual/c002-delivery-quote-api-alignment.visual.spec.ts',
  ...C002_DELIVERY_QUOTE_ALIGNMENT_VISUAL_SNAPSHOT_PATHS,
].sort();
