const visualStates = ['loading', 'ready', 'not-found', 'error'];
const visualProjects = ['mobile-360', 'mobile-390', 'hires-1170'];
const visualSnapshotRoot =
  'tests/visual/product-detail-api-integration.visual.spec.ts-snapshots';
const visualSnapshotPrefix = 'PRODUCT-DETAIL-PUBLIC-API-INTEGRATION-V1';

export const PRODUCT_DETAIL_API_INTEGRATION_VISUAL_SNAPSHOT_PATHS = visualStates
  .flatMap((state) => visualProjects.map((project) => (
    `${visualSnapshotRoot}/${visualSnapshotPrefix}-${state}-${project}-linux.png`
  )))
  .sort();

export const PRODUCT_DETAIL_API_INTEGRATION_CHANGED_FILES = [
  '.github/workflows/mvp-local-36-product-detail-api-integration-gate.yml',
  'apps/ui-lab/app/products/[productId]/page.tsx',
  'apps/ui-lab/src/client/mvp-local-36/HomeCatalogRuntime.tsx',
  'apps/ui-lab/src/client/mvp-local-36/ProductDetailRuntime.tsx',
  'apps/ui-lab/src/client/mvp-local-36/catalog-client.ts',
  'apps/ui-lab/src/client/mvp-local-36/product-detail-mapper.ts',
  'manifests/PRODUCT-DETAIL-PUBLIC-API-INTEGRATION-V1-BASELINE-REVIEW.json',
  'manifests/PRODUCT-DETAIL-PUBLIC-API-INTEGRATION-V1.json',
  'packages/ui/src/components/PackCard.tsx',
  'packages/ui/src/components/ProductCard.tsx',
  'packages/ui/src/index.ts',
  'packages/ui/src/screens/home/HomeScreen.tsx',
  'packages/ui/src/screens/product-detail/ProductDetailScreen.tsx',
  'packages/ui/src/screens/product-detail/product-detail.types.ts',
  'packages/ui/src/styles.css',
  'packages/ui/src/styles/commerce.css',
  'packages/ui/src/styles/product-detail.css',
  'playwright.product-detail-api-integration.config.ts',
  'scripts/generate-product-detail-api-integration-evidence.mjs',
  'scripts/mvp-local-36-product-detail-api-integration-changed-files.mjs',
  'scripts/validate-mvp-local-36-product-detail-api-integration.mjs',
  'scripts/validate-product-detail-api-integration-baseline-artifact.mjs',
  'tests/accessibility/product-detail-api-integration.a11y.spec.ts',
  'tests/functional/product-detail-api-integration.functional.spec.ts',
  'tests/integration/product-detail-api-integration.database.ts',
  'tests/integration/product-detail-api-integration.fixtures.ts',
  'tests/integration/product-detail-api-integration.global-setup.ts',
  'tests/integration/product-detail-api-integration.global-teardown.ts',
  'tests/unit/mvp-home-catalog-runtime-boundary.test.ts',
  'tests/unit/mvp-product-detail-client.test.ts',
  'tests/unit/mvp-product-detail-mapper.test.ts',
  'tests/unit/mvp-product-detail-runtime.test.tsx',
  'tests/unit/product-detail-presentation.test.tsx',
  'tests/visual/product-detail-api-integration.visual.spec.ts',
  ...PRODUCT_DETAIL_API_INTEGRATION_VISUAL_SNAPSHOT_PATHS,
];
