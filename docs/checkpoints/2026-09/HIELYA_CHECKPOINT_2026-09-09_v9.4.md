# HIELYA CHECKPOINT v9.4 — CODEX_PROOF_BUDGET_PREPARATION

Date: 2026-09-09 UTC. Issue #72. Branch `hielya/codex-proof-budget`.
Base main verified live: `5eed7ca5f8583dea94803e7494214bf9371c44ec`.

## State and authorization

PR #71 is merged at the base SHA, after independent review, applicable CI and owner approval. Its temporary Claude workflow removal and v9.3 are now on main. Claude API, CLI and Action smoke evidence remains in v9.3; no additional Claude run was made here.

Owner reports saving OPENAI_API_KEY in GitHub; secret presence, validity and model access in the runner remain UNVERIFIED. The owner authorized USD 1 total for the isolated Codex proof, superseding USD 0.01, with no retry. No credential values are read or recorded. Broad instructions to continue do not fabricate independent review or waive PR-specific merge governance.

## Implemented preparation

Add `scripts/automation/codex-proof-budget.mjs` and its Node test file. This offline module reserves worst-case generation cost synchronously before a future transport may send. It uses integer microdollars, checks overflow with BigInt, caps generation reservations at USD 0.80, accepts at most eight unique request slots, caps each output at 1024 tokens and pins the requested model. Input is costed conservatively at USD 5/M tokens (including the currently published cache-write premium); output at USD 20/M. Unused output is never refunded; lost responses retain their full reservation. Invalid input, repeated identity, budget denial or explicit abort closes that instance. Snapshots and errors contain fixed allowed scalar fields only.

These are local building blocks, not an active budget enforcer, orchestration controller or persistent correction ledger. No workflow imports this module. Process recreation would reset its memory: future trusted execution must prevent restart/re-dispatch and retain accounting across the whole proof. An API request counter is not the protocol's correction-round counter. Preserve the canonical two persistent correction rounds independently; this change neither implements nor modifies them.

## Validation

PASS: 11 Node tests covering exact ceiling, one-token overflow, full reservation, lost response, repeated identity, concurrent reservation, finite request slots, invalid input/model/output bounds, integer overflow, snapshot isolation and synthetic-secret non-disclosure. Script syntax and immutable-history checks required before PR publication; exact-head remote CI recorded in the PR. No provider call, CLI installation or dispatch performed. Runtime capability remains UNVERIFIED.

## Required integration work — not completed

Before any paid proof: pin and inspect exact CLI/transport versions; prove root/user and filesystem isolation; use a trusted count of the final complete request including instructions/tool schemas; verify pricing and all ancillary charges (including any counting endpoint) within the owner's TOTAL USD 1 ceiling. USD 0.20 remaining outside generation reservations is not permission for unspecified charges. Prevent model-supplied counts, alternate endpoints/service tiers, hosted billable tools, hidden history, unaccounted retries and restarts. Ensure max_output_tokens reaches the provider and covers reasoning. Errors must fail closed without raw payloads. Validate read-only and workspace-write outcomes externally. Two CLI probes may require multiple model requests; eight slots are only a ceiling, not a promise of success.

The official Action is not assumed compatible: reviewed mutable manifest includes raw output, proxy setup and host privilege/kernel adjustments. No such changes were applied. Its exact pinned behavior requires review before adoption. Existing GitHub connector cannot dispatch workflows or inspect secret metadata; runtime execution therefore still needs a supported execution path. Do not implement alternate triggers merely to evade tool limitations.

## Sources, scope and next gate

- [Model prices](https://developers.openai.com/api/docs/models/gpt-5.6-sol)
- [Output and reasoning limits](https://developers.openai.com/api/docs/guides/reasoning)
- [Input counting](https://developers.openai.com/api/docs/guides/token-counting)
- [Issue #72](https://github.com/srdarllan-hash/hielya-app/issues/72)

Exactly four paths: two new scripts, this new checkpoint and append-only INDEX. No changes to existing workflow, parser, authentication, contracts, roles, application or production. This checkpoint is candidate until separately reviewed and merged. `/orquestrar-hielya` and paid proof execution remain BLOCKED; full Codex runtime proof, independent review gate and persistent controller are not delivered by this module.
