# HIELYA - Design System Freeze Decision V1.0

- Decision ID: HLY-DS-001
- Status: APPROVED AND FROZEN
- Effective: 2026-07-30T02:33:28.541265+00:00
- Scope: Tokens, typography, palette, grid, spacing, base components, variants, states and accessibility rules required before reconstructing C-005 Home.

## Decision

The HIELYA Design System Core is frozen at token version 1.1.0. The previous muted text token `#7A7A7A` is replaced by `#9A9A9A` because the former produced a 4.36:1 contrast ratio on `#121212`, below WCAG AA for normal text. No business rule, User Story, API, event or database contract was changed.

## Home authorization

C-005 Home is authorized to enter code-first reconstruction only when all files in this package pass integrity verification and the gate checklist remains PASS. All downstream screens must use the frozen tokens and canonical base components. Any token or base-component change requires a new semantic version and impact analysis.
