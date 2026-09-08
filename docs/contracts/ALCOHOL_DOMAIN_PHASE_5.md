# Phase 5 — C005 alcohol availability integration

Issue43, base main2b02d459678e7fbc857214ae8260469db5e7f958 (PR42 merged). Owner authorized Phase5 only; new PR requires individual merge approval.

## Authority and runtime boundary

Activates precisely GET /api/v1/store/state already specified by OpenAPI V1.3. Body remains OperationalAvailability with independent storeStatus, demand and alcohol fields. Production remains blocked. The historical Phase1 contract/implementation profiles remain historical; docs/architecture/MVP_LOCAL_36_PHASE_5_PROFILE.json records partial activation, not blanket V1.3 implementation.

StoreAvailability invokes the existing server operationalAvailability rule. There is no browser calculation of 22:00 minus SLA or fallback to 45 minutes. A development-only server input file, HIELYA_OPERATIONAL_STATE_PATH, supplies {storeStatus,demand} with original estimate ID/version/source/calculatedAt/validUntil/minimumMinutes/upperBoundMinutes. Read on every request; stale values are never renewed automatically. This file is an explicit development adapter, not a real SLA production provider. Missing source returns503 SERVICE_UNAVAILABLE; invalid/stale SLA yields unavailable via the domain.

Response cache-control:no-store and x-hielya-refresh-after-ms provide a maximum15second server-issued permission lifetime, shortened at the alcohol cutoff or estimate expiry. The browser deducts network latency using monotonic time measured before the request; browser wall clock is not a domain authority. It formats the server-provided timestamp in Madrid only for display. At expiry the old permission is invalidated before refresh. Focus/visibility return refreshes; action requests always refresh. Abort, generation IDs and cleanup prevent stale replies/unmounted/StrictMode lifecycles from restoring old permission. Failure/invalid payload fails closed.

## Purchase/checkout scope — do not overclaim

C005 currently emits add-product/add-pack intentions; it has no persisted cart or checkout UI. Alcohol cards/packs are disabled while unavailable or eligibility is unknown, and the callback revalidates before emitting. Product detail remains browsable; its purchase button remains disabled as before. No cart persistence or checkout screen is activated.

The internal StoreAvailability.assertProducts guard reloads canonical catalog alcohol flags for purchase intents (including packs); it is an integration point, not a new authenticated cart mutation endpoint. Existing OrderFoundation.create remains the actual implemented checkout-to-order enforcement: canonical lines inside transaction, current destination-specific availability, accepted snapshot/revision and reconfirmation checks. Existing Phase2 tests remain part of the full suite. The public global availability result is never order authorization. Authenticated cart/checkout adapter activation remains required before real purchase; a UI event cannot authorize payment/order creation. No dormant/new checkout endpoint is exposed to bypass this boundary.

## Simultaneous presentation

HomeScreen accepts independent alcohol/store blocking and a list of notices. HIGH with45–60 and alcohol CUTOFF_REACHED with server-provided21:00 render simultaneously using existing notice/StatusBadge presentation. Historical single-state Storybook examples remain regression fixtures, not the runtime source of truth. No new screen or token value was created.

## Validation and legitimate test adaptation

Initial full unit run:433passed,1failed because the architecture allowlist only knew six historical routes. Issue43 authorizes exactly the seventh store-state route; the exact allowlist was extended, with no wildcard or relaxation of package boundaries. Existing catalog browser fixtures now explicitly supply a valid normal server availability response, keeping their isolated catalog scenarios deterministic; the allowed API request list adds only GET /store/state. New tests cover server cutoff45/60, expiry, invalid/stale input, lease/network delay, old-response races, purchase-intent rejection, simultaneous rendering and accessibility. No baseline authored or changed. CI exact-SHA evidence belongs in the candidate PR.

## Mandatory pre-production dependencies (nonblocking this development gate)

1. Physical disposal after dossier retention, including coordinated storage/backups and current holds/reconciliation, is not implemented. Retention assessment alone is insufficient to close disposal obligations.
2. Real payment provider/Stripe integration must execute and reconcile pending full refunds. No money is moved by an unconfigured port.
3. Real authoritative SLA and authenticated cart/checkout/workforce adapters remain unconfigured. Production remains blocked; this gate does not activate them.

No C003/C004, new screens, Phase6 or deployment. Checkpoints are append-only; next gate/merge requires owner approval.

## Documentation routing verification

Owner requested a short CLAUDE routing section. The mandatory checkpoint-reading paragraph was preserved byte-for-byte. CONSTRAINTS.md, KNOWN_DEBT.md and INTEGRATIONS.md were not present in the base tree and returned404 on GitHub main; docs/requirements/ was also absent in that tree. Routes are documented as intended references with explicit absence, not fabricated content or replacements for checkpoint state. Existing CLAUDE historical sections still describe migration-era conditions; its active gate explicitly records their historical status. This divergence is disclosed in the PR rather than silently reinterpreted.
