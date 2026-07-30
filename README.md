# HIELYA — Code-First UI Lab

Executable HIELYA interface built with Next.js, React, TypeScript, frozen Design Tokens and canonical components. Approved visual references guide composition; executable code, browser rendering, tests and QA are the editable source of truth.

## Canonical state

- C-005 Home Master Screen: `APPROVED_FROZEN`
- Frozen C-005 commit: `be61e1168b93d973101496cc66cb54d006aba9cc`
- C-001 Splash: Gate 1B candidate on `hielya/c001-splash-gate1b`
- C-002, C-003, C-004 and all other modules: blocked
- `main`: not updated by this Gate

## Canonical sources

1. HIELYA Foundation Pack V1.1
2. Frozen Design Tokens V1.1.0
3. Component Library V1.1.1
4. HLY-DS-001 Design System Freeze Decision
5. HLY-UI-004 Canonical Production Sequence

No business rule is changed by C-001.

## Requirements

- Node.js 24
- pnpm 10.15.0

## Install and run

```bash
corepack enable
corepack prepare pnpm@10.15.0 --activate
pnpm install --frozen-lockfile
pnpm dev
```

The asset preparation scripts create deterministic local SVG assets in `public/assets`; no external design tool or paid image service is required.

## Routes

### C-005 Home frozen reference

```text
/?state=ready
/?state=loading
/?state=closed
/?state=high-demand
/?state=error
/?state=empty-cart
/?state=alcohol-cutoff
/?state=out-of-area
```

### C-001 Splash Gate 1B

```text
/splash?state=initial
/splash?state=loading
/splash?state=transition&next=C-002
/splash?state=transition&next=C-005
/splash?state=offline
/splash?state=error
/splash?state=timeout
/splash?state=maintenance
/splash?state=ready-location
/splash?state=ready-home
/splash?state=reduced-motion
```

The Splash exposes navigation contracts through `data-next-screen`; it does not implement C-002, C-003 or C-004 and does not invent a timer or API.

## Storybook

```bash
pnpm storybook
```

## Checks

```bash
pnpm lint
pnpm typecheck
pnpm test:unit
pnpm build
pnpm build-storybook
pnpm test:c001:a11y
pnpm test:c001:functional
pnpm test:c001:visual
pnpm collect:c001:visual
pnpm audit:c001:scope
pnpm audit:c001:manifest
pnpm gate:c001:manifest
```

## Package map

- `apps/ui-lab`: Next.js application and `/splash` route.
- `packages/design-tokens`: frozen tokens and generated CSS/TS bindings.
- `packages/ui`: canonical React components, frozen C-005 and candidate C-001.
- `.storybook`: component and screen stories.
- `tests`: unit, Axe, functional, visual and responsive tests.
- `scripts`: asset materialization and Gate audits.
- `manifests`: traceability, assets and Gate records.
- `docs/c001`: requirements, assets, plan and checklist for C-001.

## Gate status

C-001 only becomes `APPROVED_FROZEN` after the exact PR head commit passes the complete `C-001 Splash Gate 1B` workflow and its uploaded evidence is inspected. The PR must remain draft and no merge to `main` is allowed without explicit authorization.
