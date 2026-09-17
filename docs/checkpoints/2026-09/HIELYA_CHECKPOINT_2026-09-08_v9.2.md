# HIELYA CHECKPOINT v9.2 — PHASE_4A_2_DIFFERENTIAL_PREPARATION

Date: 2026-09-08 UTC. Issue #68. Branch: `hielya/claude-differential-preparation`.
Base main: `329f2915b6e752e276e005309de27329b5551dd0`, verified on GitHub. Clean isolated worktree; unrelated work preserved. Previous checkpoint v9.1 remains immutable. PR #67 is merged; its candidate checkpoint is historical.

## Evidence and authorization

Smoke run [34288743306](https://github.com/srdarllan-hash/hielya-app/actions/runs/34288743306), attempt 1 on this base, failed at Claude Code. Filtered diagnostic succeeded: diagnosis_status=OK, is_error=true, error_category=UNKNOWN, evidence_source=MULTIPLE, message_code=UNCLASSIFIED_ERROR — original message withheld. No root cause established and no retry authorized. The Action created an unpublished local branch, showing that a prompt alone does not prevent Action setup writes.

Owner now authorizes preparation and an isolated PR only. Dispatch and merge require separate human authorization. No provider calls, CLI installation or new smoke test occurred in this preparation.

## Change

Add `.github/workflows/claude-differential-diagnostic.yml`, a TEMPORARY manual diagnostic with no checkout, clone, Action wrapper or artifacts. Only the named owner and attempt 1 may run it; permissions are empty. One direct Messages API call uses ANTHROPIC_API_KEY and claude-opus-5. Only transport exit integer (when available), HTTP status, success and duration are emitted. CLI test runs only after completed successful 2xx transport. Install version 2.1.263 without provider credentials; parse its semantic version without requiring literal branding. One tools-disabled CLI turn has a USD 0.50 budget setting, zero configured retries, empty MCP, hooks disabled and no session persistence. Emit only numeric exit code, valid-result boolean, structural is_error boolean and duration. Raw bodies/logs/errors are withheld; unexpected failures emit fixed BLOCKED/UNRESOLVED.

HOME and XDG config/cache/state plus TMPDIR and Claude config are temporary child-process environments; runner HOME is unchanged. Runtime files and stdout/stderr are temporary, not model workspace writes. No repository content or GitHub token is passed to the CLI. API response body is discarded. Temporary files are cleaned normally and the hosted runner discarded afterward.

## Validation

PASS: YAML parsing and structural assertions (manual-only trigger, actor/attempt guards, empty permissions, single inline step, no external Action).
PASS: Bash syntax and embedded Python compilation/AST.
PASS: 18 mocked scenarios covering success, HTTP401/403/429/500, transport failure, timeout, version formatting/mismatch/ambiguity/prerelease, installation failure, CLI error and malformed result; assertions check environment isolation, conditional invocation, withheld synthetic secret and output-key allowlist. No provider or install subprocess runs in these scenarios.
NOT RUN: actionlint and shellcheck are unavailable; no new validation tool was installed.
Remote applicable PR CI: pending publication, verify exact head before owner handoff. Real API/CLI compatibility and efficacy of internal retry settings remain UNVERIFIED. No runtime PASS claimed from static checks.

## Limits and removal

This is one-shot by operational authorization, not a persistent dispatch ledger: run_attempt == 1 blocks reruns but cannot prevent a distinct manual dispatch. Concurrency only serializes runs. USD 0.50 is a CLI stopping threshold, not a hard provider billing cap for an in-flight request. Workflow/job success means diagnostic completion, not test success. CLAUDE_CODE_ACTION_PATH is a direction of investigation, never proof of an Action defect or retrospective cause.

Remove this temporary workflow in a separately reviewed PR after investigation; Issue #68 tracks preparation and cleanup obligation. Do not leave a permanent manual credential-consuming diagnostic. No automatic removal or merge.

## Scope and next gate

Only the new workflow, this checkpoint and appended INDEX row change. Existing claude.yml, secrets/authentication, permissions, contracts, roles, controller, Codex, application and production remain unchanged. Publishing the PR does not authorize dispatch. Review and merge first, then obtain separate authorization for one execution. `/orquestrar-hielya` remains BLOCKED pending Claude cause, Codex capability, independent gate and controller. Public documents contain no credentials, personal data or raw diagnostic payloads.
