# HIELYA_CHECKPOINT_2026-08-22_v3.7

## 1. Metadata
VERSION = 3.7
DATE = 2026-08-22
TIME = 14:16
TIMEZONE = Europe/Dublin
PREVIOUS_CHECKPOINT = HIELYA_CHECKPOINT_2026-08-15_v3.6.md
REPOSITORY = srdarllan-hash/hielya-app
ACTIVE_ISSUE = #16
ACTIVE_PR = #17
ACTIVE_PR_STATE = OPEN / DRAFT / NOT MERGED
ACTIVE_BASE_SHA = 68d5f5422a9dff560b301c17fe1bce466ac7281a
ACTIVE_HEAD_SHA = ef2ec10508aec07ac41f4b4d1079644b229b4214
MAIN_SHA = 91e603d94cc0c5499d96eeca7954a19c4e3a2811
LATEST_WORKFLOW_RUN = 31436009572
LATEST_WORKFLOW_ID = 331453214
CI_STATUS = SUCCESS
CERTIFIED_GATE = CUSTOMER_AUTHENTICATION_PUBLIC_CONTRACT_V1_2_AND_HTTP_TRANSPORT_GATE_CERTIFIED
CHECKPOINT_POLICY = ACTIVE
CHECKPOINT_CADENCE = RESUMED_EXPLICITLY_BY_OWNER

## 2. Executive summary
The owner explicitly requested that HIELYA return to creating checkpoints as part of the active project workflow. This does not create a new implementation layer or modify the repository. It reaffirms enforcement of the already-active HIELYA checkpoint policy: preserve prior checkpoints, create new checkpoints when there is relevant activity or structural change, and validate the latest checkpoint against current GitHub/CI before continuing work.

The latest existing checkpoint before this document is HIELYA_CHECKPOINT_2026-08-15_v3.6.md. The current GitHub implementation authority remains unchanged: PR #17 is open, draft and unmerged at HEAD ef2ec10508aec07ac41f4b4d1079644b229b4214, based on 68d5f5422a9dff560b301c17fe1bce466ac7281a. Main remains 91e603d94cc0c5499d96eeca7954a19c4e3a2811. Workflow run 31436009572 remains completed with SUCCESS.

No merge, production activation, deployment, new implementation branch, API expansion, persistence change or payment/order implementation is authorized by this checkpoint.

## 3. Governance resumption decision
The permanent checkpoint policy was verified and remains ACTIVE. The owner has now explicitly reaffirmed that checkpoint creation must again be applied during the active HIELYA workflow.

Effective immediately:
1. The latest validated checkpoint must be read before significant new work.
2. A checkpoint must be created at the end of a workday when relevant activity occurred.
3. A checkpoint must be created immediately after a structural change in architecture, PRD, flows, business rules, Design System, contracts, persistence, API, critical implementation, CI or governance.
4. Existing checkpoints must never be overwritten.
5. GitHub/CI factual state remains first implementation authority.
6. Checkpoints record state and decisions; they do not independently authorize merge, production or a new functional layer.

## 4. GitHub validation
PR #17 = feat(auth): add opaque-session OTP HTTP transport
STATE = OPEN
DRAFT = TRUE
MERGED = FALSE
MERGEABLE = TRUE
BASE_BRANCH = hielya/mvp-local-36-customer-authentication-foundation
BASE_SHA = 68d5f5422a9dff560b301c17fe1bce466ac7281a
HEAD_BRANCH = hielya/mvp-local-36-auth-http-opaque-session
HEAD_SHA = ef2ec10508aec07ac41f4b4d1079644b229b4214
COMMITS = 3
CHANGED_FILES = 16

main = 91e603d94cc0c5499d96eeca7954a19c4e3a2811

LATEST_WORKFLOW_NAME = MVP Local 36 Opaque Session OTP HTTP Transport Gate
LATEST_WORKFLOW_RUN = 31436009572
LATEST_WORKFLOW_ID = 331453214
LATEST_WORKFLOW_HEAD = ef2ec10508aec07ac41f4b4d1079644b229b4214
LATEST_WORKFLOW_STATUS = COMPLETED
LATEST_WORKFLOW_CONCLUSION = SUCCESS

GITHUB_IMPLEMENTATION_DELTA_FROM_V3_6 = NONE CONFIRMED
PR_HEAD_CHANGED = FALSE
MAIN_CHANGED = FALSE
MERGE_PERFORMED = FALSE
PRODUCTION_CHANGED = FALSE

## 5. Canonical contracts preserved
CANONICAL_OPENAPI = contracts/openapi/HIELYA_OPENAPI_MVP_LOCAL_36_V1_2.yaml
OPENAPI_VERSION = 1.2.0
CANONICAL_AUTH_PROFILE = contracts/openapi/MVP_LOCAL_36_AUTH_IMPLEMENTATION_PROFILE_V1_2.json
CANONICAL_AUTH_ADR = docs/decisions/ADR-MVP-LOCAL-36-OPAQUE-CUSTOMER-SESSION-V1-2.md
CANONICAL_GOVERNANCE = HIELYA_CHECKPOINT_POLICY.md

The certified session model remains one opaque, revocable server session with absolute 30-day lifetime, without JWT or refresh-token semantics. C-003/C-004 client UI, client session lifecycle, bearer consumer, cart, checkout, orders, payments, Admin, real SMS, production and merge remain outside the certified implementation scope unless separately authorized.

## 6. Drive and visual state
The broad visual/product library recorded in v3.6 remains design/product material and must not be interpreted as implementation authority. Existing active and Archive_Superseded ambiguity still requires an authoritative registry based on exact Drive ID, active path, semantic screen/state, version and approval status.

The current visual production rule is reaffirmed:
- create final screen candidates one screen at a time;
- create each screen from origin rather than by cropping a board or reusing enlarged fragments;
- preserve HIELYA visual identity and canonical business rules;
- use individual PNG files at the required production dimensions when approved;
- save each file in its corresponding Google Drive functional folder;
- keep superseded or duplicate material out of active folders;
- do not mark V1/V2 assets FINAL without explicit approval.

No downstream visual asset is promoted to implementation authority by v3.7.

## 7. Delta from v3.6
The material change recorded by v3.7 is governance continuity:
CHECKPOINT_CREATION_WORKFLOW = RESUMED
CHECKPOINT_POLICY_STATUS = ACTIVE
OVERWRITE_EXISTING_CHECKPOINTS = FORBIDDEN
LATEST_PRIOR_CHECKPOINT = HIELYA_CHECKPOINT_2026-08-15_v3.6.md
NEW_LATEST_CHECKPOINT = HIELYA_CHECKPOINT_2026-08-22_v3.7.md

REPOSITORY_FILES_CREATED_BY_V3_7 = 0
REPOSITORY_FILES_MODIFIED_BY_V3_7 = 0
REPOSITORY_FILES_REMOVED_BY_V3_7 = 0
DRIVE_FILES_CREATED_BY_V3_7 = HIELYA_CHECKPOINT_2026-08-22_v3.7.md
DRIVE_FILES_REMOVED_BY_V3_7 = 0

## 8. Current status
GITHUB_GATE = CUSTOMER_AUTHENTICATION_PUBLIC_CONTRACT_V1_2_AND_HTTP_TRANSPORT_GATE_CERTIFIED
C003_IMPLEMENTATION = NOT_STARTED
C004_IMPLEMENTATION = NOT_STARTED
LOGIN_UI_IMPLEMENTATION = NOT_STARTED
OTP_UI_IMPLEMENTATION = NOT_STARTED
CLIENT_SESSION_STORAGE_IMPLEMENTATION = NOT_STARTED
BEARER_MIDDLEWARE = NOT_STARTED
REAL_SMS = NOT_STARTED
CART_IMPLEMENTATION = NOT_STARTED
CHECKOUT_IMPLEMENTATION = NOT_STARTED
ORDER_IMPLEMENTATION = NOT_STARTED
PAYMENT_IMPLEMENTATION = NOT_STARTED
ADMIN_IMPLEMENTATION = NOT_STARTED
PRODUCTION = BLOCKED
MERGE = BLOCKED
MAIN = UNCHANGED

## 9. Pending items and priorities
1. Build the canonical Drive asset registry with exact Drive ID, active path, version, semantic state and approval status.
2. Resolve active versus Archive_Superseded ambiguity.
3. Complete formal Design System and C-003/C-004 visual contract approval.
4. Formalize client session storage/restore/expiry/logout behavior in a durable ADR or equivalent contract.
5. Preserve PR #17, main and production while those decisions remain unresolved.
6. Resume remaining screen production only under the one-screen-at-a-time, from-origin quality rule and keep visual work separate from implementation authorization.

## 10. Next exact step
NEXT_EXACT_STEP = CANONICAL_ASSET_REGISTRY_AND_DESIGN_SYSTEM_C003_C004_VISUAL_CONTRACT_REVIEW

Sequence:
1. Inventory active Design System assets.
2. Inventory active C-003 assets by Drive ID/path.
3. Inventory active C-004 assets by Drive ID/path.
4. Map Archive_Superseded counterparts.
5. Assign APPROVED / DESIGN_CANDIDATE / REFERENCE_ONLY / SUPERSEDED status.
6. Close the visual-contract decision.
7. Formalize the client-session lifecycle decision.
8. Only then authorize a separate Issue/branch/Gate for authenticated client UI implementation.

## 11. Risks
- A V1 or V2 filename can be mistaken for approval.
- Duplicate or archived files can be selected accidentally if only filenames are used.
- Broad visual coverage can be mistaken for implemented functionality.
- Continuing downstream screens before closing the auth/session visual Gate can bypass governance sequencing.
- Boards, crops or enlarged fragments can introduce quality loss if treated as final screen assets.
- Checkpoint gaps can cause later sessions to rely on chat history instead of durable project state.

## 12. Blockers
BLOCKER_01 = CANONICAL_DRIVE_ASSET_REGISTRY_MISSING
BLOCKER_02 = DESIGN_SYSTEM_FORMAL_APPROVAL_MISSING
BLOCKER_03 = C003_C004_VISUAL_CANONICAL_APPROVAL_MISSING
BLOCKER_04 = ACTIVE_VS_SUPERSEDED_ASSET_IDENTITY_REQUIRES_EXPLICIT_MAPPING
BLOCKER_05 = CLIENT_SESSION_STORAGE_LIFECYCLE_ADR_MISSING
BLOCKER_06 = BEARER_CONSUMER_NOT_IMPLEMENTED
BLOCKER_07 = REAL_SMS_PAYMENT_PROVIDERS_AND_PRODUCTION_NOT_AUTHORIZED
BLOCKER_08 = NO_AUTHENTICATED_CLIENT_UI_IMPLEMENTATION_GATE_EXISTS

## 13. Decision Log v3.7
D-3.7-01 — Reaffirm and resume active checkpoint creation in the HIELYA workflow at the owner's explicit request.
D-3.7-02 — Preserve HIELYA_CHECKPOINT_2026-08-15_v3.6.md and every prior checkpoint unchanged.
D-3.7-03 — Preserve PR #17 / HEAD ef2ec10508aec07ac41f4b4d1079644b229b4214 / workflow 31436009572 as the certified implementation state.
D-3.7-04 — Keep main, merge and production unchanged and blocked.
D-3.7-05 — Reaffirm one-screen-at-a-time, from-origin visual production as the quality rule for future final screen candidates.
D-3.7-06 — Continue requiring exact Drive ID/path/version/status before visual canonical promotion.
D-3.7-07 — Do not start authenticated client UI implementation until the Design System, C-003/C-004 visual contract and client-session lifecycle decisions are closed.

## 14. Evidence sources
Google Drive:
- HIELYA_CHECKPOINT_POLICY.md
- HIELYA_CHECKPOINT_2026-08-15_v3.6.md
- HIELYA root folder and current visual taxonomy

GitHub:
- repository srdarllan-hash/hielya-app
- PR #17 current metadata
- main branch current SHA
- workflow run 31436009572 / workflow ID 331453214

## 15. Preservation
SENSITIVE_VALUES_INCLUDED = FALSE
OVERWRITE_PREVIOUS_CHECKPOINT = FALSE
PROJECT_REPOSITORY_CHANGED_BY_CHECKPOINT = FALSE
PROJECT_PR_CHANGED_BY_CHECKPOINT = FALSE
PROJECT_CI_CHANGED_BY_CHECKPOINT = FALSE
MAIN_CHANGED_BY_CHECKPOINT = FALSE
PRODUCTION_CHANGED_BY_CHECKPOINT = FALSE
NEXT_LAYER_STARTED_BY_CHECKPOINT = FALSE

No prior checkpoint was overwritten. No credential, secret, token, private key or sensitive runtime value is included.

## 16. Closing
CHECKPOINT_STATUS = CREATED_AND_VERIFIED

Checkpoint continuity is active again in the operational workflow. The certified technical state remains PR #17 at ef2ec10508aec07ac41f4b4d1079644b229b4214 with workflow 31436009572 SUCCESS. V3.7 records governance resumption and current verified authority; it does not merge, deploy, change main, activate production or authorize a new implementation layer.
