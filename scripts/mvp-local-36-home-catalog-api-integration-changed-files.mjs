const visualStates = ['loading', 'ready', 'empty', 'error'];
const visualProjects = ['mobile-360', 'mobile-390', 'hires-1170'];
const visualSnapshotRoot =
  'tests/visual/home-catalog-api-integration.visual.spec.ts-snapshots';
const visualSnapshotPrefix = 'C-005-HOME-CATALOG-API-INTEGRATION-V1';

export const HOME_CATALOG_API_INTEGRATION_CHANGED_FILES = [
  '.github/workflows/mvp-local-36-home-catalog-api-integration-gate.yml',
  'apps/ui-lab/app/page.tsx',
  'apps/ui-lab/src/client/mvp-local-36/HomeCatalogRuntime.tsx',
  'apps/ui-lab/src/client/mvp-local-36/catalog-client.ts',
  'apps/ui-lab/src/client/mvp-local-36/catalog-contracts.ts',
  'apps/ui-lab/src/client/mvp-local-36/home-catalog-mapper.ts',
  'manifests/C-005-HOME-CATALOG-API-INTEGRATION-V1-BASELINE-REVIEW.json',
  'manifests/C-005-HOME-CATALOG-API-INTEGRATION-V1.json',
  'packages/ui/src/components/CategoryChip.tsx',
  'packages/ui/src/components/PackCard.tsx',
  'packages/ui/src/components/ProductCard.tsx',
  'packages/ui/src/screens/home/HomeScreen.stories.tsx',
  'packages/ui/src/screens/home/HomeScreen.tsx',
  'packages/ui/src/screens/home/home.data.ts',
  'packages/ui/src/screens/home/home.types.ts',
  'playwright.home-catalog-api-integration.config.ts',
  'scripts/generate-c005-home-catalog-api-integration-evidence.mjs',
  'scripts/mvp-local-36-home-catalog-api-integration-changed-files.mjs',
  'scripts/validate-c005-home-catalog-api-integration-baseline-artifact.mjs',
  'scripts/validate-mvp-local-36-home-catalog-api-integration.mjs',
  'tests/accessibility/home-catalog-api-integration.a11y.spec.ts',
  'tests/functional/home-catalog-api-integration.functional.spec.ts',
  'tests/integration/home-catalog-api-integration.database.ts',
  'tests/integration/home-catalog-api-integration.fixtures.ts',
  'tests/integration/home-catalog-api-integration.global-setup.ts',
  'tests/integration/home-catalog-api-integration.global-teardown.ts',
  'tests/unit/home-catalog-presentation.test.tsx',
  'tests/unit/mvp-home-catalog-client.test.ts',
  'tests/unit/mvp-home-catalog-runtime-boundary.test.ts',
  'tests/unit/mvp-home-catalog-runtime.test.tsx',
  'tests/visual/home-catalog-api-integration.visual.spec.ts',
  ...visualStates.flatMap((state) => visualProjects.map((project) => (
    `${visualSnapshotRoot}/${visualSnapshotPrefix}-${state}-${project}-linux.png`
  ))),
];
