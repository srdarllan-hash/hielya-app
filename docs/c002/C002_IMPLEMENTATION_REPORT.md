# C-002 Localización — Implementation Candidate

## Base

- Repository: `srdarllan-hash/hielya-app`
- Base SHA: `c2857afe538b2cf5ba44635edd56dbd422c0e2f0`
- Branch: `hielya/c002-location-gate2`
- Status: `AUTHORIZED_FOR_IMPLEMENTATION`

## Architecture

The implementation separates domain rules, events, effects and policies in `@hielya/location`. React consumes only typed ports and a dependency-injected controller. No external geocoding provider, API key or backend secret is required.

The screen never routes directly to C-003 or C-005. It emits the typed outcome `LOCATION_CONFIRMED` through `LocationCompletionPort`.

## Privacy defaults

- geolocation starts only after explicit interaction;
- no background tracking;
- unconfirmed coordinates are not persisted as current location;
- no exact coordinates are logged;
- privacy copy is configurable;
- confirmed guest location uses transient session storage only.

## Visual status

C-002 screenshots and visual baselines are candidates generated in `BASELINE_AUTHORING`. This implementation does not declare `APPROVED_FROZEN`.
