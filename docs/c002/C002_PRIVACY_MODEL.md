# C-002 Privacy Model

## Data minimisation

The browser position is requested only after a user action. Device coordinates remain in memory until the user confirms the resolved address. The repository may persist only confirmed location context in session-scoped storage.

## Logs

The implementation contains no application log of latitude, longitude, full address, floor, door, hotel name or access instructions.

## External services

All external integrations are ports. Fake adapters are the implementation default for deterministic development. Any future provider adapter must keep credentials outside the browser bundle and normalise vendor responses into the HIELYA domain schema.

## Retention

Retention values are configuration and remain a product/legal decision. The default adapter uses session storage and a configurable expiry rather than permanent account storage.
