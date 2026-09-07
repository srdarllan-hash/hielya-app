# Issue #28 — deltas rejeitados pelas listas históricas

Comparação estática da main `54998abe407ca2694b3c35e1fd02f846f3e81eb3`; não é uma ampliação de permissões. Cada linha é um caminho rejeitado, com o último commit que o alterou. Os hashes e controles dos artefatos congelados permanecem validados pela suíte de regressão.

## 170 caminhos rejeitados em ambos os validadores

- OpenAPI, base histórica: `abc9380c968c7533316bd27cd3f85a73f7020b8f`.
- Composite, base histórica: `4ca838d4937555f50b3f5e11fddece5e042e1ee9`.
- As listas de caminhos rejeitados são idênticas; a tabela é apresentada uma única vez.
- Há deltas posteriores de inventário/auth, produto/entrega, segurança/dependências, documentação e CI. São diferenças acumuladas contra a admissão antiga, e não falhas dos hashes, schemas ou valores comerciais congelados.
- Aprovações/certificações correspondentes: checkpoints v2.8, v2.9, v3.1, v3.2, v3.3, v3.9 (ratificação do PR #11), v4.0, v4.2, v5.0 e registro do merge do PR #26 (v5.2, PR #29 pendente).

| Caminho | Última alteração integrada |
|---|---|
| `.dev-migrations/0003_mvp_local_36_inventory_reservation_lifecycle.sql` | fa7ca6f feat(inventory): complete reservation lifecycle foundation |
| `.dev-migrations/0004_mvp_local_36_customer_authentication_foundation.sql` | 511577e fix(auth): harden OTP cooldown and SMS delivery state |
| `.github/workflows/design-system-validation.yml` | aca0eba ci: fetch full history required by contract regression tests |
| `.github/workflows/mvp-local-36-auth-http-opaque-session-gate.yml` | 81cb538 fix(location): resume controller after strict remount |
| `.github/workflows/mvp-local-36-c002-delivery-quote-api-alignment-gate.yml` | 412e47f feat(location): align C-002 with delivery quote API |
| `.github/workflows/mvp-local-36-c002-prequote-continuation-contract-gate.yml` | cdad195 feat(location): allow continuation after validated delivery prequote |
| `.github/workflows/mvp-local-36-customer-authentication-foundation-gate.yml` | 68d5f54 fix(auth): isolate application boundary and require OTP pepper |
| `.github/workflows/mvp-local-36-inventory-reservation-lifecycle-foundation-gate.yml` | 970b6ae ci(inventory): run frozen C-002 alignment at certified SHA |
| `.github/workflows/mvp-local-36-product-detail-api-integration-gate.yml` | 65a65da feat(product): integrate public product detail candidate |
| `CLAUDE.md` | fe4f784 docs: add product and compliance context to Claude guide |
| `apps/ui-lab/app/api/v1/auth/otp/request/route.ts` | a978e38 feat(auth): add opaque-session OTP HTTP transport |
| `apps/ui-lab/app/api/v1/auth/otp/verify/route.ts` | a978e38 feat(auth): add opaque-session OTP HTTP transport |
| `apps/ui-lab/app/location/page.tsx` | 412e47f feat(location): align C-002 with delivery quote API |
| `apps/ui-lab/app/products/[productId]/page.tsx` | 65a65da feat(product): integrate public product detail candidate |
| `apps/ui-lab/src/client/mvp-local-36/LocationRuntime.tsx` | 412e47f feat(location): align C-002 with delivery quote API |
| `apps/ui-lab/src/client/mvp-local-36/ProductDetailRuntime.tsx` | 65a65da feat(product): integrate public product detail candidate |
| `apps/ui-lab/src/client/mvp-local-36/delivery-quote-client.ts` | 412e47f feat(location): align C-002 with delivery quote API |
| `apps/ui-lab/src/client/mvp-local-36/delivery-quote-service-area-adapter.ts` | 412e47f feat(location): align C-002 with delivery quote API |
| `apps/ui-lab/src/client/mvp-local-36/product-detail-mapper.ts` | 65a65da feat(product): integrate public product detail candidate |
| `apps/ui-lab/src/server/mvp-local-36/auth-container.ts` | a978e38 feat(auth): add opaque-session OTP HTTP transport |
| `apps/ui-lab/src/server/mvp-local-36/auth-http.ts` | a978e38 feat(auth): add opaque-session OTP HTTP transport |
| `contracts/openapi/HIELYA_OPENAPI_MVP_LOCAL_36_V1_2.yaml` | a978e38 feat(auth): add opaque-session OTP HTTP transport |
| `contracts/openapi/MVP_LOCAL_36_AUTH_IMPLEMENTATION_PROFILE_V1_2.json` | a978e38 feat(auth): add opaque-session OTP HTTP transport |
| `docs/checkpoints/2026-08/HIELYA_CHECKPOINT_2026-08-05_v2.1.md` | 9ac639c docs(governance): migrate checkpoints to repository |
| `docs/checkpoints/2026-08/HIELYA_CHECKPOINT_2026-08-05_v2.2.md` | 9ac639c docs(governance): migrate checkpoints to repository |
| `docs/checkpoints/2026-08/HIELYA_CHECKPOINT_2026-08-05_v2.3.md` | 9ac639c docs(governance): migrate checkpoints to repository |
| `docs/checkpoints/2026-08/HIELYA_CHECKPOINT_2026-08-05_v2.4.md` | 9ac639c docs(governance): migrate checkpoints to repository |
| `docs/checkpoints/2026-08/HIELYA_CHECKPOINT_2026-08-05_v2.5.md` | 9ac639c docs(governance): migrate checkpoints to repository |
| `docs/checkpoints/2026-08/HIELYA_CHECKPOINT_2026-08-05_v2.6.md` | 9ac639c docs(governance): migrate checkpoints to repository |
| `docs/checkpoints/2026-08/HIELYA_CHECKPOINT_2026-08-06_v2.7.md` | 9ac639c docs(governance): migrate checkpoints to repository |
| `docs/checkpoints/2026-08/HIELYA_CHECKPOINT_2026-08-06_v2.8.md` | 9ac639c docs(governance): migrate checkpoints to repository |
| `docs/checkpoints/2026-08/HIELYA_CHECKPOINT_2026-08-09_v2.9.md` | 9ac639c docs(governance): migrate checkpoints to repository |
| `docs/checkpoints/2026-08/HIELYA_CHECKPOINT_2026-08-09_v3.0.md` | 9ac639c docs(governance): migrate checkpoints to repository |
| `docs/checkpoints/2026-08/HIELYA_CHECKPOINT_2026-08-09_v3.1.md` | 9ac639c docs(governance): migrate checkpoints to repository |
| `docs/checkpoints/2026-08/HIELYA_CHECKPOINT_2026-08-10_v3.2.md` | 9ac639c docs(governance): migrate checkpoints to repository |
| `docs/checkpoints/2026-08/HIELYA_CHECKPOINT_2026-08-10_v3.3.md` | 9ac639c docs(governance): migrate checkpoints to repository |
| `docs/checkpoints/2026-08/HIELYA_CHECKPOINT_2026-08-12_v3.4.md` | 9ac639c docs(governance): migrate checkpoints to repository |
| `docs/checkpoints/2026-08/HIELYA_CHECKPOINT_2026-08-13_v3.5.md` | 9ac639c docs(governance): migrate checkpoints to repository |
| `docs/checkpoints/2026-08/HIELYA_CHECKPOINT_2026-08-15_v3.6.md` | 9ac639c docs(governance): migrate checkpoints to repository |
| `docs/checkpoints/2026-08/HIELYA_CHECKPOINT_2026-08-22_v3.7.md` | 9ac639c docs(governance): migrate checkpoints to repository |
| `docs/checkpoints/2026-08/HIELYA_CHECKPOINT_2026-08-22_v3.8.md` | 9ac639c docs(governance): migrate checkpoints to repository |
| `docs/checkpoints/2026-09/HIELYA_CHECKPOINT_2026-09-04_v3.9.md` | 9ac639c docs(governance): migrate checkpoints to repository |
| `docs/checkpoints/2026-09/HIELYA_CHECKPOINT_2026-09-04_v4.0.md` | 9ac639c docs(governance): migrate checkpoints to repository |
| `docs/checkpoints/2026-09/HIELYA_CHECKPOINT_2026-09-04_v4.1.md` | 9ac639c docs(governance): migrate checkpoints to repository |
| `docs/checkpoints/2026-09/HIELYA_CHECKPOINT_2026-09-04_v4.2.md` | 9ac639c docs(governance): migrate checkpoints to repository |
| `docs/checkpoints/2026-09/HIELYA_CHECKPOINT_2026-09-04_v4.3.md` | 9ac639c docs(governance): migrate checkpoints to repository |
| `docs/checkpoints/2026-09/HIELYA_CHECKPOINT_2026-09-04_v4.4.md` | 9ac639c docs(governance): migrate checkpoints to repository |
| `docs/checkpoints/2026-09/HIELYA_CHECKPOINT_2026-09-04_v4.5.md` | 9ac639c docs(governance): migrate checkpoints to repository |
| `docs/checkpoints/2026-09/HIELYA_CHECKPOINT_2026-09-04_v4.6.md` | 9ac639c docs(governance): migrate checkpoints to repository |
| `docs/checkpoints/2026-09/HIELYA_CHECKPOINT_2026-09-04_v4.7.md` | 9ac639c docs(governance): migrate checkpoints to repository |
| `docs/checkpoints/2026-09/HIELYA_CHECKPOINT_2026-09-04_v4.8.md` | 9ac639c docs(governance): migrate checkpoints to repository |
| `docs/checkpoints/2026-09/HIELYA_CHECKPOINT_2026-09-04_v4.9.md` | 9ac639c docs(governance): migrate checkpoints to repository |
| `docs/checkpoints/2026-09/HIELYA_CHECKPOINT_2026-09-04_v5.0.md` | f8b9f01 docs(governance): record checkpoint migration v5.0 |
| `docs/checkpoints/HIELYA_CHECKPOINT_POLICY.md` | 9ac639c docs(governance): migrate checkpoints to repository |
| `docs/checkpoints/HIELYA_CURADORIA_96_ASSETS_2026-09-04.md` | 9ac639c docs(governance): migrate checkpoints to repository |
| `docs/checkpoints/HIELYA_RECOMENDACOES_ESTRATEGICAS_2026-08-05.md` | 9ac639c docs(governance): migrate checkpoints to repository |
| `docs/checkpoints/INDEX.md` | f8b9f01 docs(governance): record checkpoint migration v5.0 |
| `docs/decisions/ADR-MVP-LOCAL-36-OPAQUE-CUSTOMER-SESSION-V1-2.md` | a978e38 feat(auth): add opaque-session OTP HTTP transport |
| `manifests/C-002-DELIVERY-QUOTE-API-ALIGNMENT-V1-BASELINE-REVIEW.json` | 60d556e test(location): freeze reviewed C-002 quote baselines |
| `manifests/C-002-DELIVERY-QUOTE-API-ALIGNMENT-V1.json` | 412e47f feat(location): align C-002 with delivery quote API |
| `manifests/C-002-PREQUOTE-CONTINUATION-CONTRACT-V1-BASELINE-REVIEW.json` | 01afcd0 test(location): materialize reviewed prequote continuation baseline |
| `manifests/C-002-PREQUOTE-CONTINUATION-CONTRACT-V1.json` | cdad195 feat(location): allow continuation after validated delivery prequote |
| `manifests/PRODUCT-DETAIL-PUBLIC-API-INTEGRATION-V1-BASELINE-REVIEW.json` | 1470e29 test(product): materialize reviewed product detail baselines |
| `manifests/PRODUCT-DETAIL-PUBLIC-API-INTEGRATION-V1.json` | 65a65da feat(product): integrate public product detail candidate |
| `package.json` | 35dcd5f chore(deps): apply React and Next security updates |
| `packages/application/src/auth/index.ts` | a978e38 feat(auth): add opaque-session OTP HTTP transport |
| `packages/design-tokens/src/tokens-flat.csv` | 1ada833 fix(ui): separate accessible danger button background (#25) |
| `packages/design-tokens/src/tokens.css` | 1ada833 fix(ui): separate accessible danger button background (#25) |
| `packages/design-tokens/src/tokens.json` | 1ada833 fix(ui): separate accessible danger button background (#25) |
| `packages/design-tokens/src/tokens.ts` | 1ada833 fix(ui): separate accessible danger button background (#25) |
| `packages/location/src/domain/location.machine.ts` | 412e47f feat(location): align C-002 with delivery quote API |
| `packages/location/src/domain/location.rules.ts` | cdad195 feat(location): allow continuation after validated delivery prequote |
| `packages/location/src/domain/location.types.ts` | 412e47f feat(location): align C-002 with delivery quote API |
| `packages/location/src/factory.ts` | 81cb538 fix(location): resume controller after strict remount |
| `packages/persistence/src/customer-auth.ts` | a978e38 feat(auth): add opaque-session OTP HTTP transport |
| `packages/ui/package.json` | 35dcd5f chore(deps): apply React and Next security updates |
| `packages/ui/src/index.ts` | 65a65da feat(product): integrate public product detail candidate |
| `packages/ui/src/screens/location/LocationScreen.tsx` | 412e47f feat(location): align C-002 with delivery quote API |
| `packages/ui/src/screens/location/useLocationController.ts` | 81cb538 fix(location): resume controller after strict remount |
| `packages/ui/src/screens/product-detail/ProductDetailScreen.tsx` | 65a65da feat(product): integrate public product detail candidate |
| `packages/ui/src/screens/product-detail/product-detail.types.ts` | 65a65da feat(product): integrate public product detail candidate |
| `packages/ui/src/styles.css` | 65a65da feat(product): integrate public product detail candidate |
| `packages/ui/src/styles/actions.css` | 1ada833 fix(ui): separate accessible danger button background (#25) |
| `packages/ui/src/styles/commerce.css` | 65a65da feat(product): integrate public product detail candidate |
| `packages/ui/src/styles/product-detail.css` | 65a65da feat(product): integrate public product detail candidate |
| `playwright.c002-delivery-quote-api-alignment.config.ts` | 412e47f feat(location): align C-002 with delivery quote API |
| `playwright.c002-prequote-continuation-contract.config.ts` | cdad195 feat(location): allow continuation after validated delivery prequote |
| `playwright.home-catalog-api-integration.config.ts` | 9e216a8 feat(home): integrate public catalog API |
| `playwright.product-detail-api-integration.config.ts` | 65a65da feat(product): integrate public product detail candidate |
| `scripts/generate-c002-delivery-quote-api-alignment-evidence.mjs` | 412e47f feat(location): align C-002 with delivery quote API |
| `scripts/generate-c002-prequote-continuation-contract-evidence.mjs` | cdad195 feat(location): allow continuation after validated delivery prequote |
| `scripts/generate-product-detail-api-integration-evidence.mjs` | 65a65da feat(product): integrate public product detail candidate |
| `scripts/mvp-local-36-c002-delivery-quote-api-alignment-changed-files.mjs` | 412e47f feat(location): align C-002 with delivery quote API |
| `scripts/mvp-local-36-c002-prequote-continuation-contract-changed-files.mjs` | cdad195 feat(location): allow continuation after validated delivery prequote |
| `scripts/mvp-local-36-product-detail-api-integration-changed-files.mjs` | 65a65da feat(product): integrate public product detail candidate |
| `scripts/validate-c002-delivery-quote-api-alignment-baseline-artifact.mjs` | 412e47f feat(location): align C-002 with delivery quote API |
| `scripts/validate-c002-prequote-continuation-contract-baseline-artifact.mjs` | cdad195 feat(location): allow continuation after validated delivery prequote |
| `scripts/validate-mvp-local-36-auth-http-opaque-session.mjs` | a978e38 feat(auth): add opaque-session OTP HTTP transport |
| `scripts/validate-mvp-local-36-c002-delivery-quote-api-alignment.mjs` | 412e47f feat(location): align C-002 with delivery quote API |
| `scripts/validate-mvp-local-36-c002-prequote-continuation-contract.mjs` | cdad195 feat(location): allow continuation after validated delivery prequote |
| `scripts/validate-mvp-local-36-customer-authentication-foundation.mjs` | 68d5f54 fix(auth): isolate application boundary and require OTP pepper |
| `scripts/validate-mvp-local-36-inventory-reservation-lifecycle.mjs` | 970b6ae ci(inventory): run frozen C-002 alignment at certified SHA |
| `scripts/validate-mvp-local-36-product-detail-api-integration.mjs` | 65a65da feat(product): integrate public product detail candidate |
| `scripts/validate-product-detail-api-integration-baseline-artifact.mjs` | 65a65da feat(product): integrate public product detail candidate |
| `tests/accessibility/c002-delivery-quote-api-alignment.a11y.spec.ts` | 412e47f feat(location): align C-002 with delivery quote API |
| `tests/accessibility/c002-prequote-continuation-contract.a11y.spec.ts` | cdad195 feat(location): allow continuation after validated delivery prequote |
| `tests/accessibility/product-detail-api-integration.a11y.spec.ts` | 65a65da feat(product): integrate public product detail candidate |
| `tests/functional/c002-delivery-quote-api-alignment.functional.spec.ts` | 412e47f feat(location): align C-002 with delivery quote API |
| `tests/functional/c002-prequote-continuation-contract.functional.spec.ts` | cdad195 feat(location): allow continuation after validated delivery prequote |
| `tests/functional/product-detail-api-integration.functional.spec.ts` | 65a65da feat(product): integrate public product detail candidate |
| `tests/integration/c002-delivery-quote-api-alignment.database.ts` | 412e47f feat(location): align C-002 with delivery quote API |
| `tests/integration/c002-delivery-quote-api-alignment.fixtures.ts` | 412e47f feat(location): align C-002 with delivery quote API |
| `tests/integration/c002-delivery-quote-api-alignment.global-setup.ts` | 412e47f feat(location): align C-002 with delivery quote API |
| `tests/integration/c002-delivery-quote-api-alignment.global-teardown.ts` | 412e47f feat(location): align C-002 with delivery quote API |
| `tests/integration/c002-prequote-continuation-contract.database.ts` | cdad195 feat(location): allow continuation after validated delivery prequote |
| `tests/integration/c002-prequote-continuation-contract.global-setup.ts` | cdad195 feat(location): allow continuation after validated delivery prequote |
| `tests/integration/c002-prequote-continuation-contract.global-teardown.ts` | cdad195 feat(location): allow continuation after validated delivery prequote |
| `tests/integration/product-detail-api-integration.database.ts` | 65a65da feat(product): integrate public product detail candidate |
| `tests/integration/product-detail-api-integration.fixtures.ts` | 65a65da feat(product): integrate public product detail candidate |
| `tests/integration/product-detail-api-integration.global-setup.ts` | 65a65da feat(product): integrate public product detail candidate |
| `tests/integration/product-detail-api-integration.global-teardown.ts` | 65a65da feat(product): integrate public product detail candidate |
| `tests/unit/location.adapters.test.ts` | 412e47f feat(location): align C-002 with delivery quote API |
| `tests/unit/location.components.test.tsx` | 81cb538 fix(location): resume controller after strict remount |
| `tests/unit/location.machine.test.ts` | cdad195 feat(location): allow continuation after validated delivery prequote |
| `tests/unit/location.rules.test.ts` | cdad195 feat(location): allow continuation after validated delivery prequote |
| `tests/unit/mvp-auth-http.test.ts` | a978e38 feat(auth): add opaque-session OTP HTTP transport |
| `tests/unit/mvp-auth-openapi-v1-2.test.ts` | a978e38 feat(auth): add opaque-session OTP HTTP transport |
| `tests/unit/mvp-customer-authentication-concurrency.test.ts` | a978e38 feat(auth): add opaque-session OTP HTTP transport |
| `tests/unit/mvp-customer-authentication-foundation.test.ts` | a978e38 feat(auth): add opaque-session OTP HTTP transport |
| `tests/unit/mvp-inventory-reservation-concurrency.test.ts` | fa7ca6f feat(inventory): complete reservation lifecycle foundation |
| `tests/unit/mvp-inventory-reservation-lifecycle.test.ts` | 1cbc336 feat(auth): establish customer authentication foundation |
| `tests/unit/mvp-location-delivery-quote-client.test.ts` | 412e47f feat(location): align C-002 with delivery quote API |
| `tests/unit/mvp-location-delivery-quote-runtime.test.tsx` | cdad195 feat(location): allow continuation after validated delivery prequote |
| `tests/unit/mvp-product-detail-client.test.ts` | 65a65da feat(product): integrate public product detail candidate |
| `tests/unit/mvp-product-detail-mapper.test.ts` | 65a65da feat(product): integrate public product detail candidate |
| `tests/unit/mvp-product-detail-runtime.test.tsx` | 65a65da feat(product): integrate public product detail candidate |
| `tests/unit/product-detail-presentation.test.tsx` | 65a65da feat(product): integrate public product detail candidate |
| `tests/visual/c002-delivery-quote-api-alignment.visual.spec.ts` | 412e47f feat(location): align C-002 with delivery quote API |
| `tests/visual/c002-delivery-quote-api-alignment.visual.spec.ts-snapshots/C-002-DELIVERY-QUOTE-API-ALIGNMENT-V1-checking-service-area-hires-1170-linux.png` | 60d556e test(location): freeze reviewed C-002 quote baselines |
| `tests/visual/c002-delivery-quote-api-alignment.visual.spec.ts-snapshots/C-002-DELIVERY-QUOTE-API-ALIGNMENT-V1-checking-service-area-mobile-360-linux.png` | 60d556e test(location): freeze reviewed C-002 quote baselines |
| `tests/visual/c002-delivery-quote-api-alignment.visual.spec.ts-snapshots/C-002-DELIVERY-QUOTE-API-ALIGNMENT-V1-checking-service-area-mobile-390-linux.png` | 60d556e test(location): freeze reviewed C-002 quote baselines |
| `tests/visual/c002-delivery-quote-api-alignment.visual.spec.ts-snapshots/C-002-DELIVERY-QUOTE-API-ALIGNMENT-V1-network-error-hires-1170-linux.png` | 60d556e test(location): freeze reviewed C-002 quote baselines |
| `tests/visual/c002-delivery-quote-api-alignment.visual.spec.ts-snapshots/C-002-DELIVERY-QUOTE-API-ALIGNMENT-V1-network-error-mobile-360-linux.png` | 60d556e test(location): freeze reviewed C-002 quote baselines |
| `tests/visual/c002-delivery-quote-api-alignment.visual.spec.ts-snapshots/C-002-DELIVERY-QUOTE-API-ALIGNMENT-V1-network-error-mobile-390-linux.png` | 60d556e test(location): freeze reviewed C-002 quote baselines |
| `tests/visual/c002-delivery-quote-api-alignment.visual.spec.ts-snapshots/C-002-DELIVERY-QUOTE-API-ALIGNMENT-V1-out-of-area-hires-1170-linux.png` | 60d556e test(location): freeze reviewed C-002 quote baselines |
| `tests/visual/c002-delivery-quote-api-alignment.visual.spec.ts-snapshots/C-002-DELIVERY-QUOTE-API-ALIGNMENT-V1-out-of-area-mobile-360-linux.png` | 60d556e test(location): freeze reviewed C-002 quote baselines |
| `tests/visual/c002-delivery-quote-api-alignment.visual.spec.ts-snapshots/C-002-DELIVERY-QUOTE-API-ALIGNMENT-V1-out-of-area-mobile-390-linux.png` | 60d556e test(location): freeze reviewed C-002 quote baselines |
| `tests/visual/c002-delivery-quote-api-alignment.visual.spec.ts-snapshots/C-002-DELIVERY-QUOTE-API-ALIGNMENT-V1-success-2-5km-350c-hires-1170-linux.png` | 60d556e test(location): freeze reviewed C-002 quote baselines |
| `tests/visual/c002-delivery-quote-api-alignment.visual.spec.ts-snapshots/C-002-DELIVERY-QUOTE-API-ALIGNMENT-V1-success-2-5km-350c-mobile-360-linux.png` | 60d556e test(location): freeze reviewed C-002 quote baselines |
| `tests/visual/c002-delivery-quote-api-alignment.visual.spec.ts-snapshots/C-002-DELIVERY-QUOTE-API-ALIGNMENT-V1-success-2-5km-350c-mobile-390-linux.png` | 60d556e test(location): freeze reviewed C-002 quote baselines |
| `tests/visual/c002-delivery-quote-api-alignment.visual.spec.ts-snapshots/C-002-DELIVERY-QUOTE-API-ALIGNMENT-V1-timeout-hires-1170-linux.png` | 60d556e test(location): freeze reviewed C-002 quote baselines |
| `tests/visual/c002-delivery-quote-api-alignment.visual.spec.ts-snapshots/C-002-DELIVERY-QUOTE-API-ALIGNMENT-V1-timeout-mobile-360-linux.png` | 60d556e test(location): freeze reviewed C-002 quote baselines |
| `tests/visual/c002-delivery-quote-api-alignment.visual.spec.ts-snapshots/C-002-DELIVERY-QUOTE-API-ALIGNMENT-V1-timeout-mobile-390-linux.png` | 60d556e test(location): freeze reviewed C-002 quote baselines |
| `tests/visual/c002-prequote-continuation-contract.visual.spec.ts` | cdad195 feat(location): allow continuation after validated delivery prequote |
| `tests/visual/c002-prequote-continuation-contract.visual.spec.ts-snapshots/C-002-PREQUOTE-CONTINUATION-CONTRACT-V1-success-enabled-hires-1170-linux.png` | 01afcd0 test(location): materialize reviewed prequote continuation baseline |
| `tests/visual/c002-prequote-continuation-contract.visual.spec.ts-snapshots/C-002-PREQUOTE-CONTINUATION-CONTRACT-V1-success-enabled-mobile-360-linux.png` | 01afcd0 test(location): materialize reviewed prequote continuation baseline |
| `tests/visual/c002-prequote-continuation-contract.visual.spec.ts-snapshots/C-002-PREQUOTE-CONTINUATION-CONTRACT-V1-success-enabled-mobile-390-linux.png` | 01afcd0 test(location): materialize reviewed prequote continuation baseline |
| `tests/visual/product-detail-api-integration.visual.spec.ts` | 65a65da feat(product): integrate public product detail candidate |
| `tests/visual/product-detail-api-integration.visual.spec.ts-snapshots/PRODUCT-DETAIL-PUBLIC-API-INTEGRATION-V1-error-hires-1170-linux.png` | 1470e29 test(product): materialize reviewed product detail baselines |
| `tests/visual/product-detail-api-integration.visual.spec.ts-snapshots/PRODUCT-DETAIL-PUBLIC-API-INTEGRATION-V1-error-mobile-360-linux.png` | 1470e29 test(product): materialize reviewed product detail baselines |
| `tests/visual/product-detail-api-integration.visual.spec.ts-snapshots/PRODUCT-DETAIL-PUBLIC-API-INTEGRATION-V1-error-mobile-390-linux.png` | 1470e29 test(product): materialize reviewed product detail baselines |
| `tests/visual/product-detail-api-integration.visual.spec.ts-snapshots/PRODUCT-DETAIL-PUBLIC-API-INTEGRATION-V1-loading-hires-1170-linux.png` | 1470e29 test(product): materialize reviewed product detail baselines |
| `tests/visual/product-detail-api-integration.visual.spec.ts-snapshots/PRODUCT-DETAIL-PUBLIC-API-INTEGRATION-V1-loading-mobile-360-linux.png` | 1470e29 test(product): materialize reviewed product detail baselines |
| `tests/visual/product-detail-api-integration.visual.spec.ts-snapshots/PRODUCT-DETAIL-PUBLIC-API-INTEGRATION-V1-loading-mobile-390-linux.png` | 1470e29 test(product): materialize reviewed product detail baselines |
| `tests/visual/product-detail-api-integration.visual.spec.ts-snapshots/PRODUCT-DETAIL-PUBLIC-API-INTEGRATION-V1-not-found-hires-1170-linux.png` | 1470e29 test(product): materialize reviewed product detail baselines |
| `tests/visual/product-detail-api-integration.visual.spec.ts-snapshots/PRODUCT-DETAIL-PUBLIC-API-INTEGRATION-V1-not-found-mobile-360-linux.png` | 1470e29 test(product): materialize reviewed product detail baselines |
| `tests/visual/product-detail-api-integration.visual.spec.ts-snapshots/PRODUCT-DETAIL-PUBLIC-API-INTEGRATION-V1-not-found-mobile-390-linux.png` | 1470e29 test(product): materialize reviewed product detail baselines |
| `tests/visual/product-detail-api-integration.visual.spec.ts-snapshots/PRODUCT-DETAIL-PUBLIC-API-INTEGRATION-V1-ready-hires-1170-linux.png` | 1470e29 test(product): materialize reviewed product detail baselines |
| `tests/visual/product-detail-api-integration.visual.spec.ts-snapshots/PRODUCT-DETAIL-PUBLIC-API-INTEGRATION-V1-ready-mobile-360-linux.png` | 1470e29 test(product): materialize reviewed product detail baselines |
| `tests/visual/product-detail-api-integration.visual.spec.ts-snapshots/PRODUCT-DETAIL-PUBLIC-API-INTEGRATION-V1-ready-mobile-390-linux.png` | 1470e29 test(product): materialize reviewed product detail baselines |
