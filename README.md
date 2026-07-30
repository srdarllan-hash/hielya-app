# HIELYA_BATCH_01_FOUNDATION_ACCESS_HOME_CODEFIRST

Executable, code-first reconstruction of the HIELYA **C-005 Home Master Screen**. The approved visual reference is preserved, while text, controls, responsive layout and states are real React components.

## Canonical sources

1. HIELYA Foundation Pack V1.1
2. Frozen Design Tokens V1.1.0
3. HLY-DS-001 Design System Freeze Decision
4. HLY-UI-004 Canonical Production Sequence

No business rule was changed.

## Requirements

- Node.js 24
- pnpm 10.15.0

## Install and run in Work

```bash
corepack enable
corepack prepare pnpm@10.15.0 --activate
pnpm install --no-frozen-lockfile
pnpm dev
```

The pre-dev script creates deterministic local SVG assets in `public/assets`; no external design tool or paid image service is required.

Open `http://localhost:3000`. State examples:

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

## Storybook

```bash
pnpm storybook
```

## Tests

```bash
pnpm lint
pnpm typecheck
pnpm test:unit
pnpm test:a11y
pnpm test:visual
pnpm build
pnpm build-storybook
```

## Package map

- `apps/ui-lab`: Next.js application.
- `packages/design-tokens`: frozen tokens and generated CSS/TS bindings.
- `packages/ui`: reusable React components and C-005 screen.
- `.storybook`: Storybook configuration and stories.
- `tests`: Axe, visual and unit tests.
- `scripts/materialize-assets.mjs`: deterministic, source-controlled SVG asset generator.
- `manifests`: traceability and component inventory.

## Gate status

The batch is integrated in `hielya/codefirst-batch01`, but C-005 only becomes `APPROVED_FROZEN` after the exact commit passes the complete GitHub Actions Gate with screenshots, accessibility, responsive and visual evidence.
