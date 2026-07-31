# HIELYA — C-002 Location and Service Area Technical Plan

```text
IMPLEMENTATION_STATUS = NOT_STARTED
RELEASE_CONDITION = READY_FOR_GATE_2 = TRUE
```

This document is a technical plan only. No C-002 route, component, test, asset or implementation is created by the consolidation branch.

## 1. Objective

Capture GPS or a manually entered address, validate the destination, obtain store status and a delivery quote, and block destinations that are outside the service area or unsuitable public-space delivery points.

## 2. Official traceability

### Stories

- `US-011` — Design tokens and shared shell.
- `US-012` — Customer navigation shell.
- `US-018` — Public store status.
- `US-019` — Manage customer addresses.
- `US-020` — Quote delivery route.
- `US-091` — Installable PWA/session continuity.
- `US-094` — ES, EN and PT localization.
- `US-096` — Critical end-to-end automation.

### Endpoint contracts

- `GET /store/status` (`getStoreStatus`)
- `GET /addresses` (`listAddresses`)
- `POST /addresses` (`createAddress`)
- `PATCH /addresses/{addressId}` (`updateAddress`)
- `DELETE /addresses/{addressId}` (`deleteAddress`)
- `POST /delivery/quote` (`quoteDelivery`)

### Models

- `Store`
- `StoreSchedule`
- `StoreConfiguration`
- `Incident`
- `Address`
- `Customer`
- `CustomerSession`
- `DeviceToken`

### Events

- `store.status.viewed.v1`
- `address.created.v1`
- `address.validated.v1`
- `address.rejected.v1`
- `delivery.quote.created.v1`
- `delivery.quote.rejected.v1`
- `qa.e2e.completed.v1`

## 3. Navigation contract

- Entry from C-001 when no valid location context exists.
- Successful serviceable address produces a navigation contract to frozen C-005.
- C-002 must not force C-003/C-004 authentication merely to browse the catalogue.
- Actual navigation remains controlled by the app router and state machine, not by invented timers.

## 4. Candidate states to map before implementation

The implementation Gate must confirm each state against official Acceptance Criteria before coding:

- permission prompt required;
- geolocation requesting;
- geolocation granted;
- geolocation denied;
- manual-address entry;
- address-search loading;
- address selected;
- address validation loading;
- serviceable quote;
- out of area;
- invalid/public-space destination;
- store open;
- store paused;
- store closed;
- offline;
- recoverable error;
- non-recoverable error;
- reduced motion.

Any state not supported by the official contracts at implementation time must be classified `REQUIRES_VALIDATION`, not silently invented.

## 5. Reuse-first component map

The Gate 2 implementation should first test whether the consolidated contracts satisfy:

- `AppShell`
- `BrandLockup` or internal `AppHeader` variant as justified by the approved visual reference
- `FeedbackState`
- `SearchField`
- `StatusBadge`
- `IconButton`

The legacy reference names `LocationPermission`, `AddressSearch`, `MapPin` and `StoreStatusBanner` are functional concepts, not permission to create duplicate visual primitives. New canonical components are allowed only after a documented reuse analysis.

## 6. Proposed file scope after authorization

```text
apps/ui-lab/app/location/page.tsx
packages/ui/src/screens/location/LocationScreen.tsx
packages/ui/src/screens/location/LocationScreen.module.css
packages/ui/src/screens/location/location.types.ts
packages/ui/src/screens/location/location.copy.ts
packages/ui/src/screens/location/LocationScreen.stories.tsx
tests/unit/location.unit.test.tsx
tests/accessibility/location.a11y.spec.ts
tests/functional/location.functional.spec.ts
tests/visual/location.visual.spec.ts
manifests/C-002.json
manifests/C-002-assets.json
docs/c002/*
```

This list is a plan and must be revalidated against the Gate 2 approved architecture before creation.

## 7. Gate requirements

- exact branch SHA checkout;
- clean frozen install;
- lint and strict type-check;
- unit tests and measured coverage;
- Next.js and Storybook builds;
- Axe in 360×800, 390×844 and 1170×2532;
- functional/console tests;
- strict visual regression in `GATE_VALIDATION` mode;
- manifest, screenshots, logs and SHA-256 evidence bound to the same commit;
- no changes to C-005 or C-001 frozen source commits;
- no C-003/C-004 implementation.
