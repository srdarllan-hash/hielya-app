# KNOWN_DEBT

Tracked, accepted technical debt that is known, bounded, and must not be mistaken for expected product behavior.

## 2026-09-08 — Authentication UI Validation WebKit flakiness

- **Area:** `Authentication UI Validation` / Playwright / `webkit-390`.
- **Observed:** On PR #64 at HEAD `f3015fc79de006ea731ee4a265b9830496eff1c5`, one run failed in `tests/auth-flow/auth-flow.spec.ts` (`invalid result clears group and focuses first input, keyboard exits once`) because the `Continuar` button remained disabled until the 30 s timeout. The same run passed 59/60 tests.
- **Reproduction check:** Re-running only the failed `auth-flow` job on the exact same HEAD completed successfully, including the auth-flow test step and `git diff --exit-code`.
- **Prior evidence:** The same `Authentication UI Validation` workflow passed on the immediately preceding reviewed automation HEAD `b0e949886d1a524a648d1776e715914d990b7535`.
- **Relation to PR #64:** No application/authentication UI code changes are present in PR #64; its functional change is limited to switching Claude GitHub Action authentication from `CLAUDE_CODE_OAUTH_TOKEN` to `ANTHROPIC_API_KEY`.
- **Classification:** Known CI flakiness / non-deterministic WebKit timing. Not treated as a PR #64 regression based on the same-SHA successful rerun.
- **Follow-up:** If this test fails again, capture recurrence frequency and isolate the WebKit enablement/timing condition before changing production authentication behavior or weakening the test.
