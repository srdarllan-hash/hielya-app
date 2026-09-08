# Phase4 — Full automatic compensation and accounting-anchored retention

Issue41. Base main c45c5702b9bf7ad941113b8b076d593ce1ab7490 after individually authorized PR40 merge.

## Cause before migration test adjustment
Initial full run:418PASS,2FAIL. Both enumerate exactly six migrations; additive0007 requires seven. Update only explicit expected list/count, retain historical checksum assertions, verify0001–0006 byte-identical. No baseline changes.

## Compensation domain and provider port
AutomaticCompensation.runPending is the internal worker entry point. It discovers all Phase3 age-refusal intents automatically, without case-by-case approval. No HTTP worker route or production scheduler is activated in this gate. All three refusal reasons use FULL_NO_CUSTOMER_COST.

The required payment position is authoritative and includes every captured customer charge (products, fees, tips); never infer refundable total from the cart subtotal. Captured-minus-already-refunded money is refunded; remaining authorization is voided. Both can coexist. A zero position is valid only after a configured provider explicitly confirms it, never because the provider is missing.

Default UnconfiguredPaymentCompensationPort follows routing's unconfigured-adapter pattern. Missing provider produces WAITING_PROVIDER / PAYMENT_PROVIDER_NOT_CONFIGURED, never COMPLETED. Stripe is not integrated, no credentials/SDK or real payment requests. In-memory provider exists only in tests.

SQLite persists claim/lease and immutable compensation plan before external I/O, then calls the provider outside the transaction. Stable idempotency key per order/refusal; provider adapter MUST reconcile/replay the same logical effect after uncertain timeout and guarantee idempotent refund/void suboperations. PENDING is not confirmation. COMPLETED requires exact confirmed amounts for both actions. Mismatched confirmation/invalid position =>FAILED for operational review, not a silent success; uncertain network result =>RETRY_REQUIRED with same plan/key and delayed retry. Expired worker lease can be reclaimed, stale workers cannot finalize. This is durable processing with external idempotency, not a distributed atomic transaction guarantee.

Read current compensation via compensation_jobs repository. The original immutable Phase3 intent stays PENDING as historical intent, not the current processing projection. No terminal handover event is edited or reopened.

## Retention authority and calculation
Primary source checked2026-09-07: [BOE Código de Comercio, art30](https://www.boe.es/buscar/act.php?id=BOE-A-1885-6627#a30). General commercial conservation is six years from the last accounting entry, subject to general/special provisions. This is not a legal conclusion that every category of age evidence independently requires six years: owner policy attaches the minimal evidence to the same order dossier, with no independent age TTL.

AccountingRetentionPort supplies the applicable ledger/dossier's authoritative latest entry, version, special-period requirement, hold and reconciliation/closure status. Its anchor must reflect the relevant books, not merely order.createdAt or an arbitrarily selected per-order transaction. Provider confirmation time is NOT automatically booked as an accounting entry. If accounting has not caught up with a known compensation completion, keep the dossier retained.

Use six calendar years (not365*6days); clamp leap-day anniversary and conservatively retain the entire anniversary date in Europe/Madrid. A later posting extends the period. Legal hold, longer special period, open/unreconciled dossier, pending compensation, unknown/invalid accounting data =>RETAIN. Default accounting port is unconfigured and fails closed; previously known anchor cannot regress or disappear when that port is temporarily unavailable.

OrderDossierRetention.assess persists RETAIN/ELIGIBLE_FOR_DISPOSAL for the complete dossier, including age evidence. Eligibility is not proof of deletion and not a permanent disposal authorization. Physical archive/disposal across dossier storage/backups requires an integrated storage procedure with fresh hold/version checks; it is explicitly not executed here. Immutable handover evidence is neither individually purged nor rewritten. No production data exists in this dev/test implementation; actual deletion/archive remains an operational integration requirement for certification.

## Data minimization and boundaries
Age evidence remains result, method, one timestamp, courierId from Phase3; no photo, document number/type or full DOB/free text added. New persistence holds monetary plans/provider references/worker state and accounting metadata only. Full dossier retention applies equally; no separate age expiration clock.

No existing OpenAPI change/activation, Stripe, live scheduler, production or new UI. C003/C004 and Phase5 not started. Final PR requires full CI and separate merge approval; next checkpoint records exact validation limitations.
