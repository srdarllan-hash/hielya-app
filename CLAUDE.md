# CLAUDE.md — HIELYA repository operating guide

## Mandatory start-of-work rule

Before any relevant work, read `docs/checkpoints/HIELYA_CHECKPOINT_POLICY.md`, then `docs/checkpoints/INDEX.md`, then the checkpoint with the highest version. Validate its GitHub branch, PR, SHA and CI claims against live GitHub before structural changes. Never edit an existing historical checkpoint; create the next version as a new file and add it to the index.

## Active Phase 2 gate (2026-09-07)

PR #36 merged by owner authorization. Main `5bbf0b0a24a01effb5d21f17f4b1352c122ad89c`, exact certified tree `d070a88f24d538dc2c13a3ecd0353165776d6495`. Full CI34111172377 + contract34111172419 SUCCESS.

Issue #37 / branch `hielya/alcohol-order-delivery-foundation`: internal order/delivery foundation, dynamic SLA policy and additive SQLite migration0005. See `docs/contracts/ALCOHOL_DOMAIN_PHASE_2.md`. HTTP still V1.2; V1.3 is not activated. Required authoritative checkout/SLA/workforce adapters are integration dependencies. No production credentials, no handover or financial execution, no C-003/C-004 or new screens. Phase2 PR requires separate owner merge approval. Phases3–6 remain unstarted; PRs #32/#34 remain independent. Checkpoints v6.0 (merge) and next phase closure preserve v5.9 unchanged.

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


## Product context

HIELYA is a local convenience-delivery MVP for cold beverages and related catalog items in Fuengirola, Spain. The product is designed for quick, mobile-first ordering: customers may browse the catalogue before authenticating, then authenticate only when entering the purchase flow. The intended operating area is up to 4 km from the store, using the `Europe/Madrid` timezone.

The operational source of truth takes precedence over mockups. The current certified store schedule is 10:00–22:00. A visual, fixture or candidate asset must never override an approved operational value.

## Canonical business rules

- Public: catalogue, categories, product detail and preliminary delivery quote.
- Authentication required: saved address, cart validation, stock reservation, checkout, payment, order creation and order tracking.
- Minimum order: €25. A cart below this minimum must be blocked from purchase.
- Delivery eligibility is bounded to the current 4 km operating area.
- Delivery quote shown before checkout is preliminary. The server must recalculate it from the exact address and persisted configuration at checkout.
- Stock reservations are atomic, last 10 minutes, must prevent negative stock and must be released on expiry or failed flow.
- A technical record may exist in `AWAITING_PAYMENT`, but an order is not confirmed before simulated payment authorization. The canonical progression is `AWAITING_PAYMENT → PAYMENT_AUTHORIZED → AWAITING_PICKING → PREPARING → DELIVERY`.
- No canonical SKU, price, coupon or commercial fact may be invented to satisfy a screen, fixture or test. In particular, `WELCOME10` is not a certified coupon contract, and substitute-product prices remain pending commercial traceability.

## Product decisions already made

- Catalogue navigation is public; `PHONE_LOGIN_EMPTY` preserves “Ahora no”. Login is required at purchase, not for browsing.
- The current authentication contract is server-side opaque session only: revocable, 30-day absolute expiry, with only a token hash persisted. No JWT, refresh token, bearer middleware or client session storage is implemented.
- Live delivery tracking and a live courier map are outside the MVP. The selected transit direction is timeline/status plus support, without promising a live map.
- Visual asset selection does not equal formal approval. Selected assets remain pending the formal Design System approval path and any operational-data remediation.

## Alcohol compliance and safety boundary

Alcohol handling is a controlled future checkout/delivery concern, not an implemented production capability.

- The alcohol cutoff must be enforced by the server using `Europe/Madrid` and must occur before the 22:00 store close. Do not infer or hard-code a new cutoff time from a mockup.
- Age confirmation belongs in the authenticated purchase flow; physical age verification belongs at handoff/delivery. If age cannot be verified, the alcohol portion must not be handed over.
- Any future payment, delivery, real SMS, alcohol-sale activation or production rollout requires a separately authorized Gate and applicable local legal/operational review. This repository does not certify legal compliance or authorize production sale of alcohol.
- Displayed hours, fees, delivery radius, minimum order, prices and alcohol notices must be checked against the certified operational configuration before visual approval.

## Current blockers and pending work

- C-003 Login UI and C-004 OTP UI remain blocked. No screen may be created until the required visual and component approvals are complete.
- `Input`, `PhoneInput` and `OtpInput` still need approved behavior, accessibility, validation, state and sizing specifications before implementation.
- Design Tokens 1.2.0 and the current component layer are candidates, not `APPROVED_FROZEN`. The code-first Design System direction is not yet a formal approval.
- Selected assets are `SELECTED / PENDING_DESIGN_SYSTEM`, not `APPROVED`; CART and OUT_OF_STOCK also require operational-data remediation.
- Client session storage, session restoration, logout, expiry handling and bearer middleware are intentionally not implemented.
- Real SMS, payment, checkout, ordering, admin, deployment and production activation remain blocked.
- A future, separately authorized CI guardrail must fail when an existing file inside `docs/checkpoints/` is modified instead of a new checkpoint file being added. Do not implement that guardrail as part of this migration.
