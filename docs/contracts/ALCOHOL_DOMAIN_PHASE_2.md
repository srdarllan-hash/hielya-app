# Phase 2 — Order/delivery foundation

Issue #37; base main 5bbf0b0a24a01effb5d21f17f4b1352c122ad89c after authorized merge #36.

## Observed validation delta (before correction)
Initial full unit run: 310 PASS, 2 failures. Both compare the complete migration list to four files; additive migration0005 makes it five. Update only exact list/count expectations, preserve existing hash checks and verify old migrations byte-identical to base. No visual baseline change justified or made.

## Boundary
Internal application cases and development SQLite adapter, not HTTP activation. Required authoritative checkout source validates cart/address ownership, eligibility, minimum spend, road distance and fees inside the same transaction. Canonical catalog storage overrides line price/alcohol flags and expands bundle inventory. The checkout adapter, real SLA provider and workforce identity provider remain mandatory integration dependencies, not fabricated production services. Production remains blocked.

Creation atomically persists immutable checkout/alcohol/promise snapshots, order and delivery plus actor/operation/object/payload-bound idempotency receipt. Active reservation must match quantities and cannot back another order. Creation does not consume stock or claim payment authorization. An authenticated payment-adapter event (not a client assertion) converts reservation exactly once together with PAYMENT_AUTHORIZED; nested savepoints preserve the existing inventory conversion and outer rollback. No gateway capture/refund execution is added.

Dynamic availability uses Europe/Madrid, floor45 and real upper SLA with strict cutoff. Unknown/stale estimate fails closed for alcohol. Every later stage uses a valid remaining-time estimate against original promise/deadline, not a new full SLA or retroactive new-order cutoff. HIGH demand and alcohol UNAVAILABLE coexist. No substitution command is introduced; checkout revision/new decision required before creation, snapshots immutable afterward.

Delivery stops at ARRIVED, age remains PENDING; no age approval, PIN mutation, handover, refusal, retry, document fields or money movement. These belong to phases3/4. UI belongs to phase5; no C003/C004 or new screens.
