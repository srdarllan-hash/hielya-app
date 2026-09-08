# HIELYA_CHECKPOINT_2026-08-15_v3.6

## 1. Metadata

VERSION = 3.6
DATE = 2026-08-15
TIME = 19:15
TIMEZONE = Europe/Dublin
PREVIOUS_CHECKPOINT = HIELYA_CHECKPOINT_2026-08-13_v3.5.md
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
DRIVE_DELTA_BOUNDARY_UTC = 2026-08-13T19:00:47.033Z

## 2. Inconsistencies before canonicalization

### 2.1 Drive visual scope exceeds the currently authorized implementation scope

Google Drive now contains concrete visual artifacts for catalog, cart/checkout, payment, order/delivery, account/support and store/error states. The current GitHub authority remains Issue #16 / PR #17 / OpenAPI MVP Local 36 V1.2, which explicitly does not implement or authorize client authentication UI, cart, checkout, orders, payments, Admin, bearer consumers, real SMS, production or merge.

RESOLUTION = Current GitHub/CI remains authoritative for implementation. Post-v3.5 Drive visuals are DESIGN_CANDIDATE / PRODUCT_REFERENCE_ONLY / PENDING_FORMAL_APPROVAL. Their presence does not authorize implementation, API expansion, database work, payment integration, production activation or merge.

### 2.2 Active versus superseded visual identity is increasingly ambiguous

The Drive now contains active-looking V2 assets alongside files explicitly named DUPLICATE_SUPERSEDED and older V1 assets placed in Archive_Superseded. This is visible for Support, Saved Addresses, Order In Transit, Cart Coupon Applied, Store Closed and Out Of Stock.

RESOLUTION = Filename and V1/V2 suffix alone are insufficient for canonical promotion. Any future visual approval must identify exact Drive item ID, active path, version and approval status. Archive_Superseded remains historical/reference unless explicitly restored.

### 2.3 Minor v3.5 timestamp metadata drift

The v3.5 document body records TIME = 19:50 Europe/Dublin, while Drive provider metadata records creation at 2026-08-13T18:56:04.678Z and last modification at 2026-08-13T19:00:47.033Z. This is a documentation-timestamp drift only and does not affect technical state.

RESOLUTION = Use the provider modification timestamp 2026-08-13T19:00:47.033Z as the objective Drive delta boundary for this checkpoint.

## 3. Executive summary

Meaningful project evolution occurred after v3.5, entirely on the Google Drive product/design side. The previously created downstream functional taxonomy was materially populated with client visual artifacts across catalog/home/search/categories/product detail, cart and checkout, payments, order/delivery states, profile/account/support, and store/error states. Several assets also received V2 revisions and duplicate/superseded cleanup through 2026-08-14.

No GitHub implementation evolution occurred after v3.5. Repository push time remains 2026-08-10T21:54:47Z. PR #17 remains open, draft and unmerged at ef2ec10508aec07ac41f4b4d1079644b229b4214. Its base remains 68d5f5422a9dff560b301c17fe1bce466ac7281a. Main remains 91e603d94cc0c5499d96eeca7954a19c4e3a2811. The latest workflow remains run 31436009572 / workflow ID 331453214 with SUCCESS.

Because the post-v3.5 Drive work materially expands the visual/product definition, the checkpoint policy requires a new checkpoint. This checkpoint records that evolution without promoting the new visuals to implementation authority.

## 4. GitHub validation

### 4.1 Active PR

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

The current PR body still explicitly excludes C-003, C-004, login/OTP UI, cookies, client storage, bearer middleware, logout, refresh, /me, cart, checkout, orders, payments, Admin, real SMS, production, deployment and merge.

### 4.2 Current open PR stack relevant to the certified chain

The repository search still returns the established open PR stack, including #17, #15, #13, #11, #9, #7, #6, #5, #4, #3, #2 and #1. No later open PR superseding #17 was found.

### 4.3 Current branches

main = 91e603d94cc0c5499d96eeca7954a19c4e3a2811
hielya/mvp-local-36-auth-http-opaque-session = ef2ec10508aec07ac41f4b4d1079644b229b4214
hielya/mvp-local-36-customer-authentication-foundation = 68d5f5422a9dff560b301c17fe1bce466ac7281a
hielya/mvp-local-36-inventory-reservation-lifecycle-foundation = 970b6ae295ff205d214afe6fe4f24ff073fcde27
hielya/mvp-local-36-c002-prequote-continuation-contract = 01afcd0891b2b1da6c5bb595b9387300e3a4366f
hielya/mvp-local-36-c002-delivery-quote-api-alignment = 60d556e5ae088f2bf98101dcf37cbf854bcc2eff
hielya/mvp-local-36-product-detail-api-integration = 1470e294404084119308812b049d94601926ce55
hielya/mvp-local-36-home-catalog-api-integration = 274d72db6babbf2605d7fecc9946adb28fbd6593
hielya/mvp-local-36-implementation = fe62966daca8bda94610aa1a63702a1e543b0ce6
hielya/c002-location-gate2 = 6d4773403fad4788b11ef6a7277f77171caf0c0a
hielya/pre-gate2-architecture-consolidation = c2857afe538b2cf5ba44635edd56dbd422c0e2f0
hielya/c001-splash-gate1b = c838cfc26176b2e748bdbd037147a7f362d5a3c2
hielya/codefirst-batch01 = be61e1168b93d973101496cc66cb54d006aba9cc

No new post-v3.5 implementation branch was found.

### 4.4 CI

LATEST_WORKFLOW_NAME = MVP Local 36 Opaque Session OTP HTTP Transport Gate
LATEST_WORKFLOW_RUN = 31436009572
LATEST_WORKFLOW_ID = 331453214
LATEST_WORKFLOW_HEAD = ef2ec10508aec07ac41f4b4d1079644b229b4214
LATEST_WORKFLOW_STATUS = COMPLETED
LATEST_WORKFLOW_CONCLUSION = SUCCESS

No newer workflow run was found.

### 4.5 GitHub delta since v3.5

GITHUB_FILES_CREATED_SINCE_V3_5 = 0 confirmed
GITHUB_FILES_MODIFIED_SINCE_V3_5 = 0 confirmed
GITHUB_FILES_REMOVED_SINCE_V3_5 = 0 confirmed
NEW_BRANCHES_SINCE_V3_5 = 0 confirmed
NEW_PRS_SINCE_V3_5 = 0 confirmed
PR_HEAD_CHANGED = FALSE
MAIN_CHANGED = FALSE
MERGE_PERFORMED = FALSE
PRODUCTION_CHANGED = FALSE

## 5. Canonical contracts preserved

CANONICAL_OPENAPI = contracts/openapi/HIELYA_OPENAPI_MVP_LOCAL_36_V1_2.yaml
OPENAPI_VERSION = 1.2.0
OPENAPI_GIT_BLOB_SHA = 7ec86235cd079244f219a53fb0202cc09d62cdc1

The current OpenAPI at the certified HEAD remains OpenAPI 3.1.1 / version 1.2.0. It retains the certified catalog and delivery paths, keeps POST /carts/{cartId}/validate explicitly deferred as DEFERRED_AUTH_CART_LAYER, and authorizes only the two authentication transport operations POST /auth/otp/request and POST /auth/otp/verify for the current auth Gate. Its own description explicitly states that it does not authorize production, UI, checkout, payments, Admin or merge.

CANONICAL_AUTH_PROFILE = contracts/openapi/MVP_LOCAL_36_AUTH_IMPLEMENTATION_PROFILE_V1_2.json
AUTH_PROFILE_GIT_BLOB_SHA = 841b94253dac5a1d306406171fb4ab6cc1613cbb

CANONICAL_AUTH_ADR = docs/decisions/ADR-MVP-LOCAL-36-OPAQUE-CUSTOMER-SESSION-V1-2.md
AUTH_ADR_GIT_BLOB_SHA = 15a81feb243f864102860f47a0b5b7bcc212f7ac

The certified session remains one opaque, revocable server session with absolute 30-day lifetime, without JWT or refresh semantics. No new contract or ADR was promoted after v3.5.

## 6. Drive delta since v3.5

The top-level 02_Catalogo through 08_Admin taxonomy already existed before v3.5 and was recorded there. The meaningful delta is that downstream folders were subsequently populated with actual client screen/state imagery and then partially revised/archived.

### 6.1 Catalog, Home, Search and Product visuals observed after the v3.5 boundary

- HLY_CLIENT_05_HOME_V1.png
- HLY_CLIENT_SEARCH_RESULTS_V1.png
- HLY_CLIENT_CATEGORIES_V1.png
- HLY_CLIENT_CATEGORY_BEER_V1.png
- HLY_CLIENT_CATEGORY_SOFT_DRINKS_V1.png
- HLY_CLIENT_CATEGORY_ICE_V1.png
- HLY_CLIENT_PRODUCT_DETAIL_V1.png

These map into existing 02_Catalogo subfolders such as Home, Busca, Categorias, Cervejas, Refrigerantes, Gelo and Produto. They are visual candidates only and do not replace frozen GitHub baselines or activate catalog products.

### 6.2 Access, location, profile and account/support visuals observed after the boundary

- HLY_CLIENT_PROFILE_INITIAL_V1.png
- HLY_CLIENT_02_LOCATION_DENIED_V1.png
- HLY_CLIENT_PROFILE_V1.png
- HLY_CLIENT_SAVED_ADDRESSES_V2.png
- HLY_CLIENT_NOTIFICATIONS_V1.png
- HLY_CLIENT_SUPPORT_V2.png

### 6.3 Cart and checkout visuals observed after the boundary

- HLY_CLIENT_CART_MAIN_V1.png
- HLY_CLIENT_COUPONS_PROMOTIONS_V1.png
- HLY_CLIENT_CART_COUPON_APPLIED_V2.png
- HLY_CLIENT_CHECKOUT_SUMMARY_V1.png

These are product/design references only. No cart persistence, cart API, authenticated cart consumer, checkout runtime or order creation implementation is certified.

### 6.4 Payment visuals observed after the boundary

- HLY_CLIENT_PAYMENT_METHODS_V1.png
- HLY_CLIENT_PAYMENT_PROCESSING_V1.png
- HLY_CLIENT_PAYMENT_REJECTED_V1.png
- HLY_CLIENT_ORDER_CONFIRMED_V1.png

The Confirmacao parent folder is currently under 04_Pagamento. These images do not authorize Stripe, Apple Pay, Google Pay, payment providers, credentials, payment persistence or production processing.

### 6.5 Order and delivery visuals observed after the boundary

- HLY_CLIENT_ORDER_READY_V1.png
- HLY_CLIENT_ORDER_IN_TRANSIT_V2.png
- HLY_CLIENT_ORDER_DELIVERED_V1.png
- HLY_CLIENT_ORDER_ISSUE_V1.png
- HLY_CLIENT_ORDER_HISTORY_V1.png

No order lifecycle, tracking, rider integration, delivery worker or production delivery state machine is certified by these assets.

### 6.6 Store/error state visuals observed after the boundary

- HLY_STATE_STORE_CLOSED_V2.png
- HLY_STATE_OUT_OF_STOCK_V2.png
- HLY_STATE_OUT_OF_AREA_V1.png

### 6.7 Confirmed later revisions

The following active-looking V2 assets have confirmed provider modifications on 2026-08-14 after initial creation:

- HLY_STATE_STORE_CLOSED_V2.png — updated 2026-08-14T14:35:59.719Z
- HLY_CLIENT_SUPPORT_V2.png — updated 2026-08-14T14:35:30.478Z
- HLY_CLIENT_CART_COUPON_APPLIED_V2.png — updated 2026-08-14T14:34:45.848Z

This confirms that the Drive evolution continued after the v3.5 checkpoint rather than being only an indexing artifact.

### 6.8 Superseded/archive material observed after the boundary

- HLY_CLIENT_FAVORITES_SUPERSEDED_V1.png
- HLY_CLIENT_SUPPORT_V2_DUPLICATE_SUPERSEDED_2026-08-13.png
- HLY_CLIENT_SAVED_ADDRESSES_V2_DUPLICATE_SUPERSEDED_2026-08-13.png
- HLY_CLIENT_ORDER_IN_TRANSIT_V2_DUPLICATE_SUPERSEDED_2026-08-13.png
- HLY_CLIENT_CART_COUPON_APPLIED_V2_DUPLICATE_SUPERSEDED_2026-08-13.png
- HLY_CLIENT_SUPPORT_V1.png
- HLY_CLIENT_ORDER_IN_TRANSIT_V1.png
- HLY_CLIENT_SAVED_ADDRESSES_V1.png
- HLY_CLIENT_CART_COUPON_APPLIED_V1.png
- HLY_STATE_STORE_CLOSED_V2_DUPLICATE_SUPERSEDED_2026-08-13.png
- HLY_STATE_OUT_OF_STOCK_V2_DUPLICATE_SUPERSEDED_2026-08-13.png
- HLY_STATE_STORE_CLOSED_V1.png
- HLY_STATE_OUT_OF_STOCK_V1.png

These are treated as archived/superseded reference, not deletion.

### 6.9 Areas without confirmed post-v3.5 material evolution

DESIGN_SYSTEM_POST_V3_5_DELTA = NONE CONFIRMED
HLY_BLOCK_POST_V3_5_DELTA = NONE CONFIRMED
ADMIN_POST_V3_5_VISUAL_DELTA = NONE CONFIRMED

The 08_Admin taxonomy exists, but no post-v3.5 HLY_ADMIN visual asset was found. A sampled leaf folder, 08_Admin/Hoje, is empty. Admin therefore remains taxonomy/reference only, not an implemented or materially visualized post-v3.5 layer.

### 6.10 File removal status

DRIVE_FILES_REMOVED_SINCE_V3_5 = NONE CONFIRMED

Moving or copying assets into Archive_Superseded is treated as archival/supersession, not deletion.

## 7. Architectural and governance decisions

1. No new API, persistence, runtime session, payment, order, delivery or production architecture is promoted by v3.6.
2. Current GitHub/CI factual state remains the first implementation authority under HIELYA checkpoint policy.
3. All post-v3.5 downstream Drive screen/state assets remain DESIGN_CANDIDATE / PRODUCT_REFERENCE_ONLY / PENDING_FORMAL_APPROVAL until explicitly approved.
4. Visual existence does not authorize a functional layer, branch, Issue, API, migration, payment provider, order engine or production behavior.
5. Any future visual canonicalization must use Drive ID + active path + version + approval status, not filename alone.
6. V2 assets with corresponding duplicate-superseded or archived V1 assets require explicit active/superseded mapping before implementation.
7. Catalog visuals must not be interpreted as commercial activation; the certified catalog/implementation contract remains unchanged.
8. Payment and order visuals must not be interpreted as implemented money movement or order lifecycle.
9. The v3.5 C-003/C-004/client-session formalization requirement remains unresolved and is not bypassed by downstream visual work.
10. No merge, main change, deployment or production activation is authorized by this checkpoint.

## 8. Delta from v3.5

V3.5 recorded a broadened folder taxonomy, Design System expansion and detailed C-003/C-004 access-state materialization. V3.6 records the next major Drive-side step: broad downstream client-flow visualization across catalog, cart/checkout, payment, order/delivery, account/support and operational states, plus V2 revisions and superseded cleanup.

DRIVE_CLIENT_FLOW_VISUAL_READINESS = BROADLY_MATERIALIZED_PENDING_FORMAL_APPROVAL
CATALOG_VISUAL_READINESS = EXPANDED_PENDING_FORMAL_APPROVAL
CART_CHECKOUT_VISUAL_READINESS = MATERIALIZED_REFERENCE_ONLY
PAYMENT_VISUAL_READINESS = MATERIALIZED_REFERENCE_ONLY
ORDER_DELIVERY_VISUAL_READINESS = MATERIALIZED_REFERENCE_ONLY
ACCOUNT_SUPPORT_VISUAL_READINESS = MATERIALIZED_REFERENCE_ONLY
STORE_ERROR_STATE_VISUAL_READINESS = EXPANDED_PENDING_FORMAL_APPROVAL
ADMIN_VISUAL_READINESS = TAXONOMY_ONLY_NO_POST_V3_5_ASSET_CONFIRMED
GITHUB_IMPLEMENTATION_DELTA = NONE
CANONICAL_CONTRACT_DELTA = NONE

## 9. Current status

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
DRIVE_DOWNSTREAM_VISUAL_LIBRARY = SIGNIFICANTLY_EXPANDED

## 10. Pending items and priorities

1. Build a canonical active/superseded Drive asset registry using exact Drive ID, full path, version and status.
2. Complete the still-pending formal approval of Design System and C-003/C-004 visual contracts.
3. Formalize client session storage/restore/expiry/logout behavior in a durable ADR/contract before authenticated client implementation.
4. Decide whether each new downstream visual is APPROVED_PRODUCT_DIRECTION, DESIGN_CANDIDATE, REFERENCE_ONLY or SUPERSEDED.
5. Reconcile new Home/Catalog/Product visuals with the frozen GitHub Home/Product baselines and current canonical catalog/commercial rules before any baseline replacement.
6. Define cart persistence, validation and checkout contracts before implementing the cart/checkout visuals.
7. Define payment, order and delivery lifecycle contracts and security boundaries before implementing corresponding visuals.
8. Clarify roadmap sequencing so downstream mockups do not bypass the authentication/client-session Gate.
9. Keep Admin, production providers, real SMS, payment credentials and deployment blocked until separately authorized.

## 11. Next steps

NEXT_EXACT_STEP = EXTEND_FORMALIZE_DESIGN_SYSTEM_AND_C003_C004_VISUAL_CONTRACT_INTO_CANONICAL_ASSET_REGISTRY

- Create an authoritative asset matrix covering active and Archive_Superseded items.
- Record exact Drive ID, path, semantic screen/state, version and status for each candidate.
- Resolve V1/V2 and duplicate-superseded ambiguity.
- Finish C-003/C-004 and client-session lifecycle decisions before authenticated UI implementation.
- Map downstream catalog/cart/payment/order/account visuals to current certified contracts and identify which require future new contracts.
- Only after formal approval, open a separately authorized Issue/child branch/Gate for the next implementation layer.
- Preserve PR #17, main and production until that authorization exists.

## 12. Risks

- Broad visual coverage may be mistaken for working software or authorized scope.
- V1/V2 naming may be mistaken for canonical approval.
- Duplicate/superseded assets may cause the wrong image to be implemented.
- Payment screens may imply money movement despite no payment implementation or provider authorization.
- Order/delivery screens may imply lifecycle/tracking behavior that is not yet contracted.
- Catalog and product imagery may imply active inventory or commercial activation despite unchanged canonical implementation state.
- Profile/account visuals may imply authenticated bearer consumption and client session storage that do not exist.
- Downstream visual work may accidentally bypass unresolved C-003/C-004/session decisions.
- Frozen C-001/C-002/C-005 and API-integration baselines could drift if Drive assets are substituted without a new Gate.
- Archived duplicate cleanup may be misread as file deletion.
- Production remains blocked and real providers remain outside the current Gate.

## 13. Blockers

BLOCKER_01 = CANONICAL_DRIVE_ASSET_REGISTRY_MISSING
BLOCKER_02 = DESIGN_SYSTEM_FORMAL_APPROVAL_MISSING
BLOCKER_03 = C003_C004_VISUAL_CANONICAL_APPROVAL_MISSING
BLOCKER_04 = ACTIVE_VS_SUPERSEDED_ASSET_IDENTITY_REQUIRES_EXPLICIT_MAPPING
BLOCKER_05 = CLIENT_SESSION_STORAGE_LIFECYCLE_ADR_MISSING
BLOCKER_06 = BEARER_CONSUMER_NOT_IMPLEMENTED
BLOCKER_07 = CART_PERSISTENCE_AND_RUNTIME_CONTRACT_NOT_IMPLEMENTED
BLOCKER_08 = CHECKOUT_RUNTIME_NOT_IMPLEMENTED
BLOCKER_09 = PAYMENT_AND_ORDER_CONTRACTS_NOT_IMPLEMENTED
BLOCKER_10 = REAL_SMS_PAYMENT_PROVIDERS_AND_PRODUCTION_NOT_AUTHORIZED
BLOCKER_11 = NO_IMPLEMENTATION_GATES_EXIST_FOR_NEW_DOWNSTREAM_VISUAL_AREAS

## 14. Canonical documents

CANONICAL_GOVERNANCE = HIELYA_CHECKPOINT_POLICY.md
CANONICAL_IMPLEMENTATION_STATE = current GitHub/CI at ef2ec10508aec07ac41f4b4d1079644b229b4214
CANONICAL_OPENAPI = contracts/openapi/HIELYA_OPENAPI_MVP_LOCAL_36_V1_2.yaml
CANONICAL_AUTH_PROFILE = contracts/openapi/MVP_LOCAL_36_AUTH_IMPLEMENTATION_PROFILE_V1_2.json
CANONICAL_AUTH_ADR = docs/decisions/ADR-MVP-LOCAL-36-OPAQUE-CUSTOMER-SESSION-V1-2.md
PRIMARY_PRIOR_CONTEXT = HIELYA_CHECKPOINT_2026-08-13_v3.5.md
NEW_LATEST_CHECKPOINT = HIELYA_CHECKPOINT_2026-08-15_v3.6.md

Post-v3.5 Drive visual assets listed in this document remain DESIGN_CANDIDATE / PRODUCT_REFERENCE_ONLY / PENDING_FORMAL_APPROVAL unless an explicit future approval promotes a specific Drive item/path.

## 15. Decision Log v3.6

D-3.6-01 — Create v3.6 because post-v3.5 Drive evolution is structurally meaningful under checkpoint policy.
D-3.6-02 — Preserve PR #17 / HEAD ef2ec10508aec07ac41f4b4d1079644b229b4214 / workflow 31436009572 as the certified implementation state.
D-3.6-03 — Classify new catalog, cart/checkout, payment, order/delivery, account/support and state visuals as design/product candidates rather than implementation authority.
D-3.6-04 — Require exact Drive ID + path + version + status for future canonical visual promotion.
D-3.6-05 — Treat Archive_Superseded and DUPLICATE_SUPERSEDED material as historical/reference, not deletion.
D-3.6-06 — Do not infer API, persistence, commercial activation, payment processing, order lifecycle or production behavior from visuals.
D-3.6-07 — Preserve the unresolved C-003/C-004/client-session governance sequence despite downstream visual expansion.
D-3.6-08 — Do not merge, deploy, change main or start a new functional implementation layer as a consequence of this checkpoint.
D-3.6-09 — Record the v3.5 timestamp drift and use the Drive provider modification time as the objective delta boundary.
D-3.6-10 — Keep Admin classified as taxonomy/reference only because no post-v3.5 Admin visual asset was confirmed.

## 16. Evidence sources

Google Drive:
- HIELYA_CHECKPOINT_2026-08-13_v3.5.md
- HIELYA_CHECKPOINT_POLICY.md
- HIELYA root folder
- 02_Catalogo and its Home/Busca/Categorias/Cervejas/Refrigerantes/Gelo/Produto areas
- 03_Carrinho_Checkout
- 04_Pagamento
- 08_Admin and sampled Hoje leaf
- Archive_Superseded
- post-v3.5 HLY_CLIENT_* and HLY_STATE_* assets identified in this checkpoint

GitHub:
- repository srdarllan-hash/hielya-app
- repository metadata and current pushed_at
- current branch list
- current open PR search
- PR #17
- Issue #16
- workflow run 31436009572 / workflow ID 331453214
- OpenAPI MVP Local 36 V1.2 at HEAD ef2ec10508aec07ac41f4b4d1079644b229b4214
- Auth Implementation Profile V1.2 and opaque-session ADR inherited unchanged from the same certified HEAD

## 17. Preservation

SENSITIVE_VALUES_INCLUDED = FALSE
OVERWRITE_PREVIOUS_CHECKPOINT = FALSE
PROJECT_REPOSITORY_CHANGED_BY_CHECKPOINT = FALSE
PROJECT_PR_CHANGED_BY_CHECKPOINT = FALSE
PROJECT_CI_CHANGED_BY_CHECKPOINT = FALSE
MAIN_CHANGED_BY_CHECKPOINT = FALSE
PRODUCTION_CHANGED_BY_CHECKPOINT = FALSE
NEXT_LAYER_STARTED_BY_CHECKPOINT = FALSE

No prior checkpoint was overwritten. No credential, secret, token value, private key or sensitive runtime value is included.

## 18. Closing

CHECKPOINT_STATUS = CREATED_AND_VERIFIED

The certified technical state remains PR #17 at ef2ec10508aec07ac41f4b4d1079644b229b4214 with workflow 31436009572 SUCCESS. V3.6 records significant Drive-side downstream product/design evolution only; it does not change the technical contract, GitHub Gate, main branch, merge state, production state or implementation authorization.
