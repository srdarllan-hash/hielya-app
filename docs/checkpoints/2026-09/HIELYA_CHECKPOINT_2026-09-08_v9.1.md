# HIELYA CHECKPOINT v9.1 — PHASE_4A_SANITIZED_DIAGNOSIS_CANDIDATE

Date: 2026-09-08, UTC. Issue #66. Previous main checkpoint: v9.0, preserved.

## State and provenance

Owner authorized Phase 4A only: the diagnostic script and its tests, plus policy-required checkpoint documentation. Branch `hielya/claude-diagnostic-phase4a` starts from main `0e9200e37a146e0ebf9a2e4d6dbbf2f07d96801e`. Fresh checkout was clean. The unrelated cart worktree was preserved. Open PRs #57/#58 remain outside this task. Version v9.1 was reserved in Issue #66 after inspecting open PRs.

Live GitHub supersedes the historical candidate state in v9.0: PRs #63 and #64 are merged. Main uses the API-key path already introduced by #64; this task does not change authentication. Run 34283497754 failed after Claude initialization, with filtered category UNKNOWN. No root cause is established.

## Changes and decisions

- `scripts/automation/diagnose-claude-failure.mjs`: explicitly inspect known result/system/assistant error envelopes; subtype remains metadata; recognize bounded integer HTTP statuses in known fields; remove whole-document stringify fallback. Preserve legacy signature precedence, file size/path/symlink checks and diagnostic exit zero.
- Closed additive output fields: error_type (recognized and unambiguous only), evidence_source (RESULT/SYSTEM/ASSISTANT/MULTIPLE), evidence_kind (INFERRED for category classification), message_code (fixed unknown-message notice). All output values are checked again at serialization. No free message, model, boundary or phase is echoed or guessed.
- Assistant text is inspected only for an explicitly marked assistant error or a failed terminal result. Classification remains heuristic: a failed transcript can contain incidental signature text; it is not a provider root-cause attestation.
- `scripts/automation/diagnose-claude-failure.test.mjs`: retain original regression cases, extend exact key assertions for approved additive fields, add parser and disclosure regressions. CLI tests check stdout, GitHub output/summary, empty stderr, exit zero and unchanged input bytes.
- This checkpoint and an appended INDEX row are the only documentary changes. Existing checkpoints are not edited.

## Validation

Node v24.19.0. Baseline analyzer suite: PASS, 28 tests. Candidate analyzer suite: PASS, 44 tests, zero failed/skipped. Immutable-history guard suite: PASS, 19 tests. Node syntax checks: PASS. Targeted ESLint: PASS using the existing unchanged repository configuration and installed dependencies from the adjacent checkout; Next/React discovery warnings are unrelated to these MJS files. Typecheck is not applicable to the modified files: tsconfig excludes MJS and has allowJs false. Remote CI is pending publication of the candidate commit; verify the PR's current exact HEAD before owner review. No reruns or provider smoke tests were dispatched.

## Limits, blockers and next steps

Esta alteração não determina retroativamente a causa do run 34283497754.

The original SDK execution file was not available as an artifact; parsing synthetic fixtures does not establish the old provider error. Any new controlled Claude run requires the separately reviewed/merged instrumentation and subsequent authorization. No Codex installation, paid model calls, roles/contracts changes, controller or second review gate is included. `/orquestrar-hielya` remains BLOCKED.

Next: publish an isolated PR, inspect all current CI attempts, request owner review only with adequate evidence. Merge requires explicit separate owner authorization. Technical readiness is not merge authorization.

## Confirmation and publication review

Main, production, migration 0001, application authentication, secrets, permissions, branch protection, all workflows (including claude.yml), automation contracts and roles are unchanged. No provider invocation or recovery behavior added. Only synthetic secret fixtures occur in tests; no real credentials, OTP values, personal data or operational secrets are included. The output vocabulary adds bounded diagnostic metadata, not arbitrary SDK text. No automatic merge is authorized.
