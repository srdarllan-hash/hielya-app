# HIELYA_CHECKPOINT_2026-08-13_v3.5

## 1. Metadata
VERSION = 3.5
DATE = 2026-08-13
TIME = 19:50
TIMEZONE = Europe/Dublin
PREVIOUS_CHECKPOINT = HIELYA_CHECKPOINT_2026-08-12_v3.4.md
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

## 2. Inconsistencies before canonicalization
The current GitHub contract still marks C-003, C-004, login UI and OTP UI as DEFERRED, while Google Drive now contains a substantially expanded set of visual states for those screens plus new Design System, Splash, Onboarding and Location artifacts. Therefore Drive visual material is evidence of product/design evolution, not certified implementation authority.

A second ambiguity exists in 01_Acesso/Login_Telefone: Archive_Superseded contains files with names also used by active candidates, including PHONE_LOGIN_EMPTY and PHONE_LOGIN_TYPING. A future canonical decision must identify the exact Drive item/path, not only the filename.

RESOLUTION = GitHub/CI remains authoritative for implementation. New visual files are DESIGN_CANDIDATE / PENDING_FORMAL_APPROVAL unless a durable approval explicitly promotes them.

## 3. Executive summary
Meaningful evolution occurred after v3.4 in Google Drive. HIELYA gained an expanded visual information architecture, new Design System assets, new initial-flow/location screens, and detailed C-003/C-004 state assets. This is a structural Design/Product change and satisfies the checkpoint policy requirement for a new checkpoint.

No new GitHub commit, branch, PR, workflow, merge or contract change occurred. PR #17 remains open, draft and unmerged at ef2ec10508aec07ac41f4b4d1079644b229b4214. Main remains 91e603d94cc0c5499d96eeca7954a19c4e3a2811. The latest workflow remains 31436009572 / workflow 331453214 with SUCCESS.

## 4. GitHub validation
PR #17: feat(auth): add opaque-session OTP HTTP transport.
Base: hielya/mvp-local-36-customer-authentication-foundation @ 68d5f5422a9dff560b301c17fe1bce466ac7281a.
Head: hielya/mvp-local-36-auth-http-opaque-session @ ef2ec10508aec07ac41f4b4d1079644b229b4214.
Commits: 3. Changed files: 16. Merged: false. Draft: true.

Current branches still include the certified chain and main. No later C-003/C-004 implementation branch was found.

Latest workflow: MVP Local 36 Opaque Session OTP HTTP Transport Gate, run 31436009572, workflow ID 331453214, head ef2ec10508aec07ac41f4b4d1079644b229b4214, SUCCESS. No newer workflow was found.

Issue #16 remains open and limits the current Gate to the opaque-session OTP HTTP transport. Client UI, bearer consumer, cart, checkout, payments, Admin, real SMS, production and merge remain outside the certified scope.

GITHUB_FILES_CREATED_SINCE_V3_4 = 0
GITHUB_FILES_MODIFIED_SINCE_V3_4 = 0
GITHUB_FILES_REMOVED_SINCE_V3_4 = 0

## 5. Canonical contracts preserved
CANONICAL_OPENAPI = contracts/openapi/HIELYA_OPENAPI_MVP_LOCAL_36_V1_2.yaml
OPENAPI_VERSION = 1.2.0
OPENAPI_GIT_BLOB_SHA = 7ec86235cd079244f219a53fb0202cc09d62cdc1

OpenAPI V1.2 remains the public MVP Local 36 contract. It retains the existing catalog/delivery contracts and adds only POST /api/v1/auth/otp/request and POST /api/v1/auth/otp/verify for the auth Gate. The opaque session remains revocable with absolute 30-day lifetime, without JWT/refresh semantics. Cart validation remains deferred.

CANONICAL_AUTH_PROFILE = contracts/openapi/MVP_LOCAL_36_AUTH_IMPLEMENTATION_PROFILE_V1_2.json
AUTH_PROFILE_GIT_BLOB_SHA = 841b94253dac5a1d306406171fb4ab6cc1613cbb
The profile still declares C-003, C-004, login UI, OTP UI, session renewal, logout, bearer middleware, /me, cart, checkout, orders, payments, Admin, real SMS, production and merge as DEFERRED.

CANONICAL_AUTH_ADR = docs/decisions/ADR-MVP-LOCAL-36-OPAQUE-CUSTOMER-SESSION-V1-2.md
AUTH_ADR_GIT_BLOB_SHA = 15a81feb243f864102860f47a0b5b7bcc212f7ac
No new runtime architecture was promoted in this checkpoint.

## 6. Drive delta since v3.4
Top-level structure expanded with 02_Catalogo, 03_Carrinho_Checkout, 04_Pagamento, 05_Pedido_Entrega, 06_Conta, 07_Estados_Erros and 08_Admin. These folders describe visual/product organization only; they do not prove implementation.

00_Design_System was expanded with Logo, Cores, Tipografia, Botoes, Campos, Cards, Icones, Navegacao and Estados.
01_Acesso was expanded with Splash, Onboarding, Localizacao and Perfil_Inicial in addition to Login_Telefone, Codigo_SMS and Boards_Review.

New Design System/review assets observed:
- HLY_DS_01_LOGO_COMPACT_V1.png
- HLY_DS_02_APP_ICON_V1.png
- HLY_DS_03_COLOR_PALETTE_V1.png
- HLY_DS_04_TYPOGRAPHY_V1.png
- HLY_DS_05_BUTTONS_V1.png
- HLY_DS_06_FORM_FIELDS_V1.png
- HLY_BLOCK_01_DESIGN_ACCESS_REVIEW_V1.png

New initial flow/location assets observed:
- HLY_CLIENT_01_SPLASH_V1.png
- HLY_CLIENT_01_ONBOARDING_V1.png
- HLY_CLIENT_02_LOCATION_PERMISSION_V1.png
- HLY_CLIENT_02_MANUAL_ADDRESS_V1.png

C-003 active state assets created/refined after v3.4 include EMPTY, TYPING, INVALID_PHONE, LOADING, NETWORK_ERROR, CONFIGURATION_ERROR and DISABLED variants. The base HLY_CLIENT_03_PHONE_LOGIN_V1.png already existed before this checkpoint.

C-004 state assets materialized after v3.4 include DISABLED, PARTIAL, RESEND_COOLDOWN, RESEND_AVAILABLE, SUCCESS, VERIFYING, INVALID_CODE, COMPLETE, ATTEMPTS_EXHAUSTED, NETWORK_ERROR and EXPIRED_CODE variants. The base HLY_CLIENT_04_CODIGO_SMS_V1.png already existed before this checkpoint.

Archive_Superseded now contains older/alternate C-003 assets, including duplicate-name EMPTY/TYPING candidates and HLY_CLIENT_03_PHONE_LOGIN_STATE_07_V1.png.

DRIVE_FILES_REMOVED_SINCE_V3_4 = none confirmed. Moving material into Archive_Superseded is treated as archival, not deletion.

## 7. Architectural and governance decisions
1. No new API, persistence, runtime session or production architecture is promoted.
2. GitHub/CI remains first authority for implementation state.
3. New Design System and client-flow PNGs remain design candidates pending explicit approval.
4. Drive folder organization is operational taxonomy, not functional authorization.
5. Active-versus-archived duplicate filenames must be resolved by Drive ID/path before canonical promotion.
6. The client session-storage proposal from v3.4 remains proposed; no new ADR was found.
7. No merge or C-003/C-004 implementation is authorized by this checkpoint.

## 8. Delta from v3.4
V3.4 recorded visual readiness for C-003/C-004 as MATERIALIZED_PENDING_FORMAL_APPROVAL. V3.5 expands that readiness into individual screen-state coverage and adds a more complete Design System plus initial-flow/location material and a broader functional folder taxonomy.

VISUAL_READINESS_C003_C004 = EXPANDED_STATE_COVERAGE_PENDING_FORMAL_APPROVAL
DESIGN_SYSTEM_VISUAL_READINESS = MATERIALIZED_PENDING_FORMAL_APPROVAL
GITHUB_IMPLEMENTATION_DELTA = NONE

## 9. Current status
GITHUB_GATE = CUSTOMER_AUTHENTICATION_PUBLIC_CONTRACT_V1_2_AND_HTTP_TRANSPORT_GATE_CERTIFIED
C003_IMPLEMENTATION = NOT_STARTED
C004_IMPLEMENTATION = NOT_STARTED
LOGIN_UI_IMPLEMENTATION = NOT_STARTED
OTP_UI_IMPLEMENTATION = NOT_STARTED
CLIENT_SESSION_STORAGE_IMPLEMENTATION = NOT_STARTED
BEARER_MIDDLEWARE = NOT_STARTED
REAL_SMS = NOT_STARTED
CART = NOT_STARTED
CHECKOUT = NOT_STARTED
PAYMENTS = NOT_STARTED
ADMIN = NOT_STARTED
PRODUCTION = BLOCKED
MERGE = BLOCKED
MAIN = UNCHANGED
DRIVE_DESIGN_SYSTEM = EXPANDED
DRIVE_ACCESS_STATE_LIBRARY = EXPANDED

## 10. Pending items and priorities
1. Formally approve or reject the new Design System visual set and map approved elements to existing code tokens/baselines.
2. Approve one unambiguous set of C-003/C-004 states using path + Drive ID + status.
3. Formalize client session storage/lifecycle in a durable ADR/contract before authenticated UI implementation.
4. Reconcile new Splash/Onboarding/Location visuals with frozen C-001/C-002 behavior before replacing any baseline.
5. Clarify whether the new 02_Catalogo through 08_Admin tree is design taxonomy only or a formally approved roadmap.
6. Only after those decisions, open a separate Issue/child branch/Gate for client authentication UI.

## 11. Next steps
NEXT_EXACT_STEP = FORMALIZE_DESIGN_SYSTEM_AND_C003_C004_VISUAL_CONTRACT

- Build an authoritative active/superseded asset map.
- Approve/reject HLY_DS_01..06 and HLY_BLOCK_01_DESIGN_ACCESS_REVIEW_V1.png.
- Approve the C-003/C-004 state set.
- Produce/update the client-session lifecycle ADR.
- Verify Splash/Onboarding/Location compatibility with C-001/C-002.
- Preserve PR #17, main and production until a new layer is explicitly authorized.

## 12. Risks
- V1 filenames may be mistaken for canonical approval.
- Duplicate active/archive names may select the wrong asset.
- PNG Design System material may drift from code tokens and frozen baselines.
- New Splash/Location visuals may conflict with certified C-001/C-002 if used without review.
- Visual auth success can suggest end-to-end authentication even though no bearer consumer is implemented.
- Client session lifecycle remains non-canonical.
- SMS and production remain outside the current Gate.
- Functional folder names such as checkout/payment/Admin may be misread as implemented scope.

## 13. Blockers
BLOCKER_01 = DESIGN_SYSTEM_FORMAL_APPROVAL_MISSING
BLOCKER_02 = C003_C004_VISUAL_CANONICAL_APPROVAL_MISSING
BLOCKER_03 = ACTIVE_VS_SUPERSEDED_ASSET_IDENTITY_NEEDS_EXPLICIT_MAPPING
BLOCKER_04 = CLIENT_SESSION_STORAGE_ADR_MISSING
BLOCKER_05 = SESSION_RESTORE_EXPIRY_LOGOUT_BEHAVIOR_NOT_CANONICAL
BLOCKER_06 = BEARER_CONSUMER_NOT_IMPLEMENTED
BLOCKER_07 = REAL_SMS_AND_PRODUCTION_NOT_AUTHORIZED
BLOCKER_08 = NO_AUTH_UI_IMPLEMENTATION_GATE_EXISTS

## 14. Canonical documents
CANONICAL_GOVERNANCE = HIELYA_CHECKPOINT_POLICY.md
CANONICAL_IMPLEMENTATION_STATE = current GitHub/CI at ef2ec10508aec07ac41f4b4d1079644b229b4214
CANONICAL_OPENAPI = contracts/openapi/HIELYA_OPENAPI_MVP_LOCAL_36_V1_2.yaml
CANONICAL_AUTH_PROFILE = contracts/openapi/MVP_LOCAL_36_AUTH_IMPLEMENTATION_PROFILE_V1_2.json
CANONICAL_AUTH_ADR = docs/decisions/ADR-MVP-LOCAL-36-OPAQUE-CUSTOMER-SESSION-V1-2.md
PRIMARY_PRIOR_CONTEXT = HIELYA_CHECKPOINT_2026-08-12_v3.4.md
NEW_LATEST_CHECKPOINT = HIELYA_CHECKPOINT_2026-08-13_v3.5.md

New Drive visual assets listed above remain DESIGN_CANDIDATE / PENDING_FORMAL_APPROVAL. Archive_Superseded material remains reference/history unless explicitly restored.

## 15. Decision Log v3.5
D-3.5-01 — Create a new checkpoint because post-v3.4 Drive evolution is structurally meaningful.
D-3.5-02 — Preserve PR #17 / HEAD ef2ec10508aec07ac41f4b4d1079644b229b4214 / workflow 31436009572 as the certified implementation state.
D-3.5-03 — Classify new visual artifacts as candidates, not implementation authority.
D-3.5-04 — Require Drive ID/path-aware promotion when duplicate filenames exist across active and archive areas.
D-3.5-05 — Keep the client-session storage decision proposed until a durable ADR/contract exists.
D-3.5-06 — Do not interpret checkout/payment/order/account/Admin folders as implemented or authorized functionality.
D-3.5-07 — Preserve frozen C-001/C-002 and other certified Gates until explicit replacement authorization.
D-3.5-08 — Do not merge, deploy or start a new functional layer as a consequence of this checkpoint.

## 16. Evidence sources
Google Drive: v3.4 checkpoint, checkpoint policy, HIELYA root and current subfolders, 00_Design_System, 01_Acesso, Login_Telefone, Codigo_SMS, Boards_Review and Archive_Superseded, plus the visual assets identified above.

GitHub: repository srdarllan-hash/hielya-app, PR #17, Issue #16, current branches, workflow run 31436009572 / workflow ID 331453214, OpenAPI V1.2, Auth Implementation Profile V1.2 and opaque-session ADR.

## 17. Preservation
SENSITIVE_VALUES_INCLUDED = FALSE
OVERWRITE_PREVIOUS_CHECKPOINT = FALSE
PROJECT_REPOSITORY_CHANGED_BY_CHECKPOINT = FALSE
PROJECT_PR_CHANGED_BY_CHECKPOINT = FALSE
PROJECT_CI_CHANGED_BY_CHECKPOINT = FALSE
NEXT_LAYER_STARTED_BY_CHECKPOINT = FALSE

No prior checkpoint was overwritten. No sensitive values are included.

## 18. Closing
CHECKPOINT_STATUS = CREATED_AND_VERIFIED

The technical certified state remains PR #17. V3.5 records Drive-side Design System, artifact organization and visual-readiness evolution only; it does not change the technical contract, Gate, main branch, production state or implementation authorization.
