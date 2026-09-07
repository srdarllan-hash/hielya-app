# Phase 1 — Alcohol domain contract V1.3

Issue #35. Base main: `4d32cebcc7f68832940f6825177d5348d63f245a`.
Owner authorizes six sequential gates, each independently reviewed/merged. **This PR implements only Phase1 contract and validation.** No runtime endpoint, persistence migration or new screen is implemented.

## Sources and versioning

Requirements: [approved dynamic-cutoff direction / checkpoint v5.8](https://github.com/srdarllan-hash/hielya-app/blob/b96b2907f132d006072b216030353b5352441049/docs/checkpoints/2026-09/HIELYA_CHECKPOINT_2026-09-07_v5.8.md), PR #34 still separate/unmerged. No implicit incorporation/merge of PR #32 or #34.

New contract: `contracts/openapi/HIELYA_OPENAPI_MVP_LOCAL_36_V1_3.yaml` (JSON serialization, valid YAML), OpenAPI3.1.1 / JSON Schema2020-12. New implementation profile makes runtime V1.2 explicit. V1.0/V1.1/V1.2 files and existing profiles remain byte-identical and are checked by hash. Catalog/auth operations and all prior schemas except the two intentionally extended response schemas are preserved in V1.3.

The document version is1.3.0; `/api/v1` remains the proposed major API base. This does NOT activate the new responses on existing routes. Adding required operationalAvailability to quote/cart and changing the historical age-check/verify-pin payloads are intentional contract changes: deploy only after dependent phases and compatibility review. Existing runtime conformance still targets V1.2. A client cannot assume V1.3 is live because this file exists.

Format reference: [OpenAPI3.1.1](https://spec.openapis.org/oas/v3.1.1.html). Validation uses [jsonschema Draft202012Validator](https://python-jsonschema.readthedocs.io/en/stable/validate/) plus openapi-spec-validator, with versions pinned in test requirements.

## Concurrent C-005 dimensions and dynamic cutoff

`OperationalAvailability` contains **storeStatus**, **demand** and **alcohol** independently. Examples include OPEN + HIGH(45–60) + UNAVAILABLE(CUTOFF_REACHED,21:00). No single exclusive screen-state enum replaces those three dimensions. Phase5 must display both notices on the same screen; loading/error of catalog remains a separate dimension.

`effectiveSlaMinutes = MAX(45, authoritative estimate.upperBoundMinutes)`.
`alcoholOrderCutoffAt = local service-date22:00 - effectiveSlaMinutes`.

Examples: upper45 →21:15; upper60 →21:00; upper90 →20:30; upper30 →floor45/21:15. Timezone Europe/Madrid; winter/summer offsets are explicit in fixtures. Strict boundary: at cutoff, do not create alcohol order. Deadline22:00 never moves with demand.

Estimate covers queue, acceptance, preparation, travel, hotel encounter, age inspection and PIN. Includes version/source/calculatedAt/validUntil; unknown/stale invalid estimate fails closed, never optimistic fallback. A browser timer only refreshes UI. Destination-aware quote and atomic submit must re-evaluate server estimate. Changed promise returns409 PROMISE_RECONFIRMATION_REQUIRED with current availability, before creation/capture, for explicit reconfirmation. Missing authoritative service returns503. Neither a screenshot nor an old quote authorizes purchase.

Snapshot records decision/estimate/SLA/deadline/cutoff/version per order, not fixed21:15 global configuration. After order creation, acceptance/preparation/dispatch re-evaluate **remaining** time, retain original promise and prevent late handover. New-order cutoff changing does not itself retroactively cancel an already accepted feasible order. No silent extension of promise or deadline.

## Endpoint map and future implementation ownership

| V1.3 surface | Delta | Future phase |
|---|---|---|
| GET /store/state | Public concurrent operational dimensions; no customer/age identity | P2 decision source, P5 UI |
| POST /delivery/quote; /carts/{cartId}/validate | Required operationalAvailability on existing response schema; quote metadata and validity | P2 foundation, P5 consumption |
| POST /orders; GET /orders/{orderId} | New narrow compliance order contract, derived alcohol flag/age requirement and snapshot; owned customer access | P2 |
| POST /admin/orders/{orderId}/start-picking | Formal acceptance + preparation start mapped to one historical transition, with guarded status/revision | P2 |
| POST /admin/orders/{orderId}/mark-ready | Preparation completion rechecks window/remaining ETA | P2 |
| POST /admin/deliveries/{deliveryId}/start; /arrive | Dispatch/arrival guarded; arrival does not complete handover | P2/P3 |
| POST /admin/deliveries/{deliveryId}/verify-pin | ONE final atomic handover; PIN+contemporaneous age attestation+presence+actual deadline+actor/revision | P3 |
| POST /admin/deliveries/{deliveryId}/age-check | Terminal refusal only; historical standalone APPROVED is removed in this version | P3 |
| POST /admin/deliveries/{deliveryId}/fail | Terminal logistical failure without invented age result/notes; no redelivery endpoint | P3/P4 |

Future item substitution/confirmation must run the same server-derived alcohol aggregation and temporal guards before committing its mutation; this focused contract does not authorize arbitrary item-edit/payment APIs from historical V1.0. No full order/payment runtime is implied. Reservation/payment transitions must be mapped in the P2 foundation before any route is activated; technical AWAITING_PAYMENT is not confirmation of a paid order.

Customer opaque bearer is inherited; future courier/operator credentials are separate schemes, no customer-to-courier privilege escalation. Assigned-courier/object authorization and server-owned actor/time are mandatory, not inferred from possession of any bearer. Store operator cannot remotely override age. Workforce authentication implementation is deferred; this phase creates no token issuer or JWT.

## Atomic handover, refusal, privacy and retention

Final command accepts revision, PIN, recipientPresent=true and transient adultDocumentVisuallyVerified attestation. For alcohol, all conditions must hold together in one transaction; non-alcohol does not fabricate adult verification. Separate successful age/PIN calls cannot release delivery. Server writes minimal successful evidence and consumes PIN/completes once only if all guards pass; no partial success. Invalid PIN attempt accounting/refusal is a failure event, not reusable success. Atomicity is of software decision, not physical world; courier cannot transfer after deadline even with earlier authorization.

DNI/passport or NIE accompanied by sufficient document must show matching **photo and DOB visibly**; no photo/number/DOB is submitted or persisted. NIE alone →REFUSED_DOUBTFUL_ID. Age record stores only result/method/one timestamp/courierId under operational linkage; ageVerificationStatus/ageVerificationMethod project the single record under the requested delivery field names; verifiedAt/verifiedByCourierId are response projections for success, not extra identity storage. No free-text or document-type storage. Customer order view does not expose courier age evidence.

Refusal is terminal: no same-order retry or third-party/reception handover. Same-key technical replay returns the original outcome; it is not a new physical attempt. Whole verification-refused order, including mixed order, gets automatic full compensation incl fees; void uncaptured amount/refund captured outstanding amount, no customer cost.202 indicates committed intent, not bank settlement. Phase4 uses transactional outbox and idempotent provider reconciliation; it cannot promise a database/payment distributed transaction. Restock requires returned-goods inspection. Other operational failures retain explicit policy boundary rather than inventing age status or fees.

RetentionPolicyV13 anchors at LAST_ACCOUNTING_ENTRY, general commercial6years, inherits dossier retention and legal holds/special rules; never order.createdAt. No independent age TTL or marketing use. Record necessity/legal basis and restricted archival/deletion in P4. This phase does not implement a purge job or certify production alcohol operations.

## Schema versus runtime invariants

Schema enforces required/extra fields, enum values, formats, no standalone successful age-check, derived boolean consistency, pending-versus-completed evidence and refusal states. It cannot verify actual physical age, compare arbitrary fields/timestamps, authenticate an actor or provide database atomicity. Cross-field arithmetic and transaction obligations are explicitly documented; example arithmetic tests are independent witnesses, **not production enforcement**. P2/P3 must implement/test those invariants before runtime activation.

Tests: `python -m pip install -r tests/contracts/requirements.txt` then `python -m unittest discover -s tests/contracts -p 'test_*.py' -v`. Added dedicated read-only CI; existing Design System Validation runs full unit/lint/typecheck/build and five browser regression suites unmodified. Neither workflow updates baselines. Local contract suite passed. A network approval cancellation error occurred while polling installations and was reported immediately; dependencies subsequently became available and all312 local unit tests with coverage passed. Full browser/application certification remains based on the exact-SHA CI result.

No phase2 implementation or merge before individual Phase1 approval. C-003/C-004/new screens/production remain blocked. Selected assets are not modified or promoted by this contract.
