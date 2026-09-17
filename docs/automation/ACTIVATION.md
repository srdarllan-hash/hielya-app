# Activation checklist — Work ↔ Claude Code

Status: NOT ACTIVATED. Foundation implementation is tracked in Issue #59. Do not enable automatic execution merely because the documentation or tests exist.

## Prerequisites, in order

1. Review/merge the foundation only with separate owner authorization. Reconcile stale current-state sections in CLAUDE.md against live GitHub, without changing historical checkpoints or product decisions. Pending PRs remain outside this authorization.
2. Configure server-side protection of main: require PRs and applicable checks, invalidate stale approvals and require owner review on protected areas. Prevent force pushes/deletion and automation bypass. Validate that an automation identity cannot update main directly or merge via API. Do not impose a self-approval deadlock: PRs authored through the owner's connection cannot be independently approved by that same owner account; use a distinct executor identity and verify reviewer eligibility.
3. Install a trusted, read-only immutable-history check using the reviewed guard and complete Git objects. It must inspect current base/head, fail closed on missing objects and run for all relevant PRs without path-filter gaps. Require this check from its known app/workflow identity. Do not run the candidate's replacement guard. Bootstrap installation is a separately reviewed governance change; no active workflow is installed by this foundation.
4. Establish distinct executor/reviewer/controller identities, a human-only approval boundary, explicit per-task path restrictions and external durable state. Merely checking that a comment author equals the owner's username is unsafe when agents use the same connection. Changes to `.github/`, `.claude/`, CLAUDE.md, governance/ADRs, automation scripts and integrations require owner handling. Sensitive application files must be inventoried from the real tree, not guessed top-level folders.
5. Configure Claude Code GitHub Actions with the selected, owner-approved authentication/billing method. Claude API keys and subscription tokens are alternative methods, not unlimited/free execution. Store secrets only through the provider/GitHub secret interface. Never paste keys into chat, issues, files or logs. No production credentials. Configure explicit bot/event allowlists and bounded execution. Pin the reviewed Action version to a full commit SHA at activation time.
6. In eligible ChatGPT Work, create a task for supported PR activity in this repository using WORK_REVIEW.md, conditioned on the pilot PR/branch and CI completion. Verify the actual account supports the event, can read the exact diff/checks and can publish the technical review under the chosen approval policy. A prompt file does not create a scheduled task. Never disable all action approvals to make the pilot appear automatic.
7. Implement and test the deterministic controller/lease/event ledger specified in AGENT_PROTOCOL.md. First run in observation-only mode: it may report intended transitions but dispatch no code changes. Only then permit bounded in-scope correction of one approved test task. Preserve owner-only merge and all production Gates.

## Event-chain checks

GitHub documents restrictions on events generated with GITHUB_TOKEN: some PR events enter an approval-required state, while other events do not start a new run. Do not assume comments/labels/pushes will wake another workflow. A separately scoped GitHub App token or an explicit dispatch may be necessary; prove the exact chain in the pilot. Claude's Action also checks bot actors: allow only the verified controller identity, never all bots.

Required pilot cases: duplicate/out-of-order event; changed head during review; missing or skipped check; diagnostic success with unresolved defect; spoofed owner comment; edited contract; untrusted fork; sensitive path change; expired lease/local writer; service/quota outage; cancellation; third correction attempt; failed direct main push; failed unauthorized merge. A healthy pilot must hand work across agents without transporting response text manually, while still stopping at real owner decisions.

## Acceptance evidence

Record repository and task IDs, contract digest, base/head, authenticated actor IDs, workflow/run/check IDs, ledger transitions, correction count and owner-visible result. Do not record credentials, prompts containing secrets, OTPs, session tokens or personal data. The pilot is not complete until evidence of both successful handoff and negative safety cases is reviewed.

The foundation does not create repository labels, branch protection, provider secrets, a running controller, a Work task or an autonomous Claude workflow. Current tools allow repository-content changes but expose no administrative-write or scheduled-task-creation action. Keep configuration pending rather than presenting a document as an active integration. Recheck capabilities before activation.

## Primary documentation verified 2026-09-08

- OpenAI, GitHub/Work event tasks: https://help.openai.com/en/articles/11145903-connecting-github-to-chatgpt
- OpenAI, Work and Codex: https://help.openai.com/en/articles/20001275-chatgpt-work-and-codex
- Anthropic, Claude Code GitHub Actions: https://code.claude.com/docs/en/github-actions
- GitHub, event chaining: https://docs.github.com/en/actions/how-tos/write-workflows/choose-when-workflows-run/trigger-a-workflow
- GitHub, protected branches: https://docs.github.com/en/repositories/configuring-branches-and-merges-in-your-repository/managing-protected-branches/about-protected-branches
- GitHub, secure workflow use: https://docs.github.com/en/actions/reference/security/secure-use

These references describe platform capabilities, not proof of configuration in this account. Revalidate them during activation.
