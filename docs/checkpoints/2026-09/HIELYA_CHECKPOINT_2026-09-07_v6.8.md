# HIELYA CHECKPOINT v6.8 — PHASE_5_C005_ALCOHOL_INTEGRATION

2026-09-07 UTC. Previous:v6.7. Issue43, branch hielya/c005-alcohol-domain-integration. Base main2b02d459678e7fbc857214ae8260469db5e7f958 after authorized PR42 merge, tree2d390154c76771e346ef76dfe180c2f0f756b5d8. Phase4 CI34118318166/34118318195 SUCCESS960tests. Candidate PR requires individual approval; main is not changed by Phase5.

## Implementation and decision log

GET /api/v1/store/state activates the public query already in V1.3. Server StoreAvailability invokes dynamic-SLA domain logic. No client cutoff calculation. Server freshness lease bounded by15seconds/estimate expiry/cutoff; client monotonic time deducts network latency, invalidates before refresh and revalidates purchase intentions. HIGH and alcohol UNAVAILABLE render simultaneously in existing C005 notice components. Alcohol cards/packs block while unknown/unavailable; browsing remains possible. No new screens/tokens/migrations or authenticated HTTP/cart activation. Existing OrderFoundation creation continues authoritative transactional checkout blocking. C005 emits intentions only; real cart/checkout remains an integration dependency. See docs/contracts/ALCOHOL_DOMAIN_PHASE_5.md and Phase5 runtime profile.

## Validation at creation

434unit tests PASS (13new),16contract tests PASS, typecheck PASS; lint zeroerrors/eight existingwarnings. Initial architecture failure was exactly the seventh authorized route missing from historical allowlist, documented before precise extension. Browser attempt local failed to launch because required Chromium1234 was absent; no browser case executed locally. Full exact-SHA CI/build/visual/accessibility certification is PENDING and must be recorded in the PR without rewriting this file. Existing snapshots not changed. New browser cases cover live expiry/stale purchase intent and simultaneous-state accessibility.

## Documentary routing

CLAUDE mandatory checkpoint-reading rule preserved byte-for-byte. Added short routing to CONSTRAINTS/KNOWN_DEBT/INTEGRATIONS, decisions and requirements. Verified the three named files absent locally and404 on GitHub main; requirements directory absent in base tree. Explicitly disclose missing references and historical migration-era CLAUDE statements in PR. Do not invent reference contents or treat them as state sources. No historical checkpoint modified.

## Known production prerequisites

Physical disposal after retention remains unimplemented; retaining alone does not close disposal obligations. Real payment/Stripe provider must execute and reconcile pending refunds. Authoritative SLA and authenticated checkout adapters remain required: development-only HIELYA_OPERATIONAL_STATE_PATH input never substitutes for production integration and never renews expired estimates. These are nonblocking for this development gate, required before production. No real money, disposal, deployment or production activation.

## Changed artifacts and next step

New application availability query/guard, server HTTP adapter/route, client lease/session logic, integration profile and documentation/tests. Home runtime/presentation, exact route allowlist, browser fixtures/API allowlists, CLAUDE and INDEX updated. v6.7/v6.8 new checkpoints. No baseline authored, historical contracts/migrations/checkpoints untouched. Next: publish Phase5 draft PR, full CI, owner review; no Phase6/C003/C004 or new screens.
