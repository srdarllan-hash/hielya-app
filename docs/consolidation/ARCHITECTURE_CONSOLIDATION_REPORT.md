# HIELYA — Pre-Gate 2 Architecture Consolidation

**Branch:** `hielya/pre-gate2-architecture-consolidation`
**Frozen base:** `c838cfc26176b2e748bdbd037147a7f362d5a3c2`
**C-005 frozen source:** `be61e1168b93d973101496cc66cb54d006aba9cc`
**C-001 frozen source:** `c838cfc26176b2e748bdbd037147a7f362d5a3c2`
**C-002 implementation:** `NOT_STARTED`

## Purpose

Consolidate the shared architecture before C-002 without rewriting either frozen source commit and without merging into `main`.

## Implemented corrections

1. Design-token compilation is deterministic and emits valid CSS shadows.
2. Runtime UI styling consumes Design Tokens; only documented responsive breakpoints remain as technical literals.
3. `AppShell` is screen-agnostic through `screenState` / `data-screen-state`.
4. `BrandLockup` is canonical and shared by `AppHeader` and Splash.
5. `FeedbackState` is canonical; error/empty remain thin adapters.
6. `HomeLoadingState` names the Home-specific skeleton explicitly.
7. Interactive components expose typed data, actions, disabled and loading contracts.
8. Public package exports replace cross-package filesystem imports.
9. Three duplicate product/category SVG pairs are represented by shared physical assets plus semantic aliases.
10. Global manifests record components, primitives, assets, screens, certifications, workflows, artifacts and versions.
11. Reusable screen validation separates explicit baseline authoring from immutable Gate validation.
12. Coverage is measured with V8; threshold remains `PENDING_DECISION`.

## Invariants

- The original C-005 and C-001 branches and commits remain immutable.
- C-002, C-003 and C-004 are not implemented in this branch.
- `WORK_INTEGRATED = FALSE`.
- `BASELINE_AUTHORING` requires an explicit manual authorization string.
- `GATE_VALIDATION` never creates a baseline; missing or different baseline fails.

## Candidate versions

- Design Tokens: `1.2.0` consolidation candidate, derived from frozen `1.1.0`.
- Component Library: `1.2.0` consolidation candidate, derived from frozen `1.1.1`.
- Runtime: Node 24, pnpm 10.15.0, Next.js 16.2.7, React 19.2.7, TypeScript 5.8.3.

## Gate decision

The repository does not declare `READY_FOR_GATE_2 = TRUE` merely from source changes. The final decision is generated only by an exact-SHA GitHub Actions run after architecture, coverage, build, Storybook, C-005 regression and C-001 regression all pass and same-SHA evidence is hashed into the final artifact.
