# HIELYA Batch 01 — Work CI Checklist

This checklist converts the locally executed evidence into the exact dependency-backed verification required in the Work environment.

## Bootstrap

```bash
corepack enable
pnpm install --no-frozen-lockfile
pnpm exec playwright install --with-deps chromium
```

## Required green commands

```bash
pnpm build
pnpm build-storybook
pnpm test:unit
pnpm test:a11y
pnpm test:visual
pnpm audit:source
pnpm audit:manifest
```

## Acceptance checklist

- [ ] Next.js production build completes without warnings promoted to errors.
- [ ] Storybook builds and exposes every Batch 01 canonical component.
- [ ] All eight C-005 states render in Storybook.
- [ ] Axe reports zero WCAG 2.1 AA violations.
- [ ] Playwright visual baselines are reviewed and accepted.
- [ ] 360×800, 390×844 and 1170×2532 screenshots match the packaged dimensions.
- [ ] No duplicate components or Home-exclusive components are introduced.
- [ ] Foundation Pack V1.1 rules remain unchanged.
- [ ] The SHA-256 payload manifest is retained in the integration commit.

## Expected result

All commands green. Any difference must be documented as an environment or dependency delta before the batch is merged.
