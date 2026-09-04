# CLAUDE.md — HIELYA repository operating guide

## Mandatory start-of-work rule

Before any relevant work, read `docs/checkpoints/HIELYA_CHECKPOINT_POLICY.md`, then `docs/checkpoints/INDEX.md`, then the checkpoint with the highest version. Validate its GitHub branch, PR, SHA and CI claims against live GitHub before structural changes. Never edit an existing historical checkpoint; create the next version as a new file and add it to the index.

## Repository architecture

HIELYA is a pnpm monorepo running a modular TypeScript monolith:

- `apps/ui-lab`: Next.js 16 application, browser UI and the authorized `/api/v1` Route Handlers.
- `packages/application`: framework-independent application use cases and ports, including customer authentication.
- `packages/persistence`: SQLite development/test adapters and migrations; depends on the application boundary.
- `packages/location`: C-002 location, delivery-quote and prequote-continuation domain/runtime.
- `packages/design-tokens`: generated CSS/JSON/TypeScript design tokens.
- `packages/ui`: canonical React components and the implemented screen compositions.
- `contracts/openapi`: versioned public API contracts.
- `tests`: Vitest unit suites plus Playwright accessibility, functional and visual regressions.
- `scripts`, `manifests` and `.github/workflows`: validation, traceability and Gate automation.

Keep application use cases independent from Next.js, React and SQLite. Compose adapters in `apps/ui-lab`.

## Checkpoints

- Official location after the migration PR is merged: `docs/checkpoints/`.
- Monthly historical files: `docs/checkpoints/YYYY-MM/`.
- Canonical index and Drive traceability: `docs/checkpoints/INDEX.md`.
- Google Drive remains historical storage and the location for binary assets and evidence that were not migrated.

## Toolchain and commands

Requirements: Node.js `>=24 <25`, pnpm `10.15.0`.

```bash
corepack enable
corepack prepare pnpm@10.15.0 --activate
pnpm install --frozen-lockfile
pnpm test
pnpm test:coverage
pnpm lint
pnpm type-check
pnpm build
pnpm build-storybook
pnpm audit:all
```

Playwright suites are available through `pnpm test:a11y`, `pnpm test:functional` and `pnpm test:visual`. Gate-specific commands and exact-SHA requirements live in the applicable workflow and latest checkpoint.

## Environment variables

Public non-secret configuration is documented in `.env.example`:

- `NEXT_PUBLIC_HIELYA_API_BASE_URL`
- `NEXT_PUBLIC_HIELYA_DEFAULT_LOCALE`
- `NEXT_PUBLIC_HIELYA_STORE_TIMEZONE`
- `NEXT_PUBLIC_HIELYA_ASSET_BASE_URL`

The development/test OTP HTTP runtime additionally fails closed unless both are present:

- `HIELYA_MVP_LOCAL_36_DATABASE_PATH`: existing, migrated, readable and writable SQLite database path.
- `HIELYA_OTP_PEPPER`: required secret pepper; there is no default and it must not be persisted.

Never commit secrets. `BASELINE_MODE=GATE_VALIDATION` is used by visual Gate validation and must not author baselines.

## Production block

Production activation and deployment are not authorized. The simulated SMS gateway is prohibited in `NODE_ENV=production`, and the authentication runtime intentionally returns configuration unavailable there. Do not introduce real SMS, payment, production data or deployment without a separately authorized Gate.

## Current certified state

- Certified `main`: `df912c101b3db5c910a8c575fb2e2e687a54f4f5`.
- Current documentation Gate: `CHECKPOINT_REPOSITORY_MIGRATION_GATE`.
- Previous checkpoint: `HIELYA_CHECKPOINT_2026-09-04_v4.9.md`.
- Implemented/certified chain includes C-001 Splash, C-002 location and delivery quote/prequote continuation, C-005 Home, public catalog and product detail integration, persistence foundations, inventory reservation lifecycle, customer-authentication foundation, OpenAPI V1.2 and the opaque-session OTP request/verify HTTP transport.
- The opaque session is server-side, revocable and absolute-expiry; only its hash is persisted. Client session consumption is not implemented.
- Design System code-first direction has been analyzed but not formally approved. Selected visual assets remain pending Design System approval.
- Not implemented/authorized: C-003 Login UI, C-004 OTP UI, bearer middleware/client session storage, real SMS, cart/checkout/order/payment/admin layers, production activation or deployment.
- No screen may be created as part of the checkpoint migration.

The normal governance flow remains: Issue → branch → implementation/documentation → tests and validations → Pull Request → review → separately authorized merge.
