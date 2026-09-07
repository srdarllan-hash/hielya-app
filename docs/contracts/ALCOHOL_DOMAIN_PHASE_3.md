# Phase 3 — Atomic handover and terminal refusal

Issue39. Base main ccdd13492dd8348ea8b59b94c6521fc3b760c790 after authorized merge PR38.

## Root cause before adjusting migration assertions
First full run:382 PASS,2 FAIL. Two historical tests enumerate exactly five migrations; additive0006 makes six. Only exact expected list/count is updated, existing checksum assertions retained. No historical migration or baseline is changed.

## One terminal authority
Application `AtomicDeliveryHandover.handover` performs all checks under the SQLite BEGIN IMMEDIATE transaction: assigned/authorized courier, ARRIVED/revision, original lawful admission and current handover window, visual adult verification, presence of intended recipient, and matching unblocked PIN. It re-reads server time immediately before the terminal write. A single immutable terminal event is the authority for both order/delivery final projections. No separate write can approve age or complete this delivery. Database triggers independently reject missing age, PIN or deadline evidence, incorrect actor/state/revision, and re-opening. Old foundation rows remain preterminal history; consumers must use repository projections, not query the old status column as current state.

The new-order cutoff and handover deadline are distinct: revalidate original admission before dynamic cutoff, actual handover before22:00 Madrid and within immutable promise. Do not retroactively apply the cutoff for new orders to an accepted feasible delivery. No extension of SLA/deadline is introduced.

## PIN and trust boundary
Dedicated per-delivery HMAC-SHA256 PIN verifier, with required external pepper of at least32bytes and constant-time comparison. Cryptographically generated4digits, trusted PIN_ISSUER only; not exposed to couriers, no reissue/reset path. Online attempt limit is snapshotted from existing settings. Failed attempts and idempotent error receipts commit together; no partial age/handover evidence. Command fingerprints are HMACs, never plaintext PINs. Legacy createDeliveryPin/verifyDeliveryPin remains a separate simulation and cannot satisfy Phase3 handover. Auth HTTP/Opaque Session is unchanged.

Actor authorization and clock are trusted server ports, not client fields. Inputs reject unknown identity/time/document fields and string truthiness. Only the assigned courier can attest that the intended adult recipient is physically present and that a document with photo and DOB was visually checked. DNI/passport or NIE with adequate photo document; NIE alone =>REFUSED_DOUBTFUL_ID. No document photo, number, DOB, document type or free text is persisted.

Software enforces the recorded decision atomically; it cannot prove a courier performed an honest physical inspection or prevent physical release outside the system. Production workforce authentication, issuer delivery channel and operating procedure remain required, unimplemented integrations. No HTTPV1.3 activation or new screen in this gate.

## Terminal refusal
Only REFUSED_NO_ID / REFUSED_MINOR / REFUSED_DOUBTFUL_ID accepted by refuse; VERIFIED/APPROVED/PENDING rejected. Record result, method (null for no ID), one server timestamp and courier. No same-order retry, third-party/reception handover or state reset. Refusal and unique FULL_NO_CUSTOMER_COST compensation intent persist in the same transaction. Intent statusPENDING does not mean refunded; payment amounts/provider confirmation/financial execution and retention jobs belong to Phase4. No invented compensation amount and no existing public contract modified.

## Regression and certification
Tests explicitly cover all8combinations, separate SQL guards, deadline boundary/recheck, preserving original promise, replay/changed payload/revoked actor, wrong PIN attempt lock and legacy bypass, every terminal refusal, opposite outcome on another connection, write-lock contention, rollback after event insertion including compensation, and no document/clear PIN data. Full application/browser/contract CI must certify final SHA. No baseline-writing workflow changes.

## Replacement-write hardening
Review found that SQLite INSERT OR REPLACE need not invoke DELETE triggers when recursive_triggers is disabled. Although no application command uses REPLACE here, relying only on DELETE/UPDATE guards would overstate database immutability. Explicit BEFORE INSERT duplicate guards now reject replacing terminal events or PIN credentials, and terminal parent deletions are blocked. A direct-SQL regression verifies this path. No old migration is edited;0006 is still the unmerged Phase3 candidate. Final CI must validate the hardening commit, not just the earlier41-test revision.
