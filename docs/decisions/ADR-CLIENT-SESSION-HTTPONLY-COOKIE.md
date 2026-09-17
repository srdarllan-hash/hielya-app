# ADR: Customer session in an httpOnly cookie

- Status: owner-authorized development/test scope, Issue [#75](https://github.com/srdarllan-hash/hielya-app/issues/75).
- Contract: `contracts/openapi/HIELYA_OPENAPI_CLIENT_SESSION_V1_5.yaml`, scoped successor after cart runtime V1.4.
- Precedent: Issue #53 authorized C-003/C-004 beyond the historical V1.2 scope.

## Decision and rationale

Successful OTP verification sends the opaque credential only in `Set-Cookie`. The JSON body contains only `customer` and `expiresInSeconds`. Browser JavaScript never receives or stores the credential. An httpOnly cookie prevents direct token exfiltration through JavaScript during XSS, unlike localStorage or sessionStorage. It does not prevent malicious script from making authenticated requests while executing in the origin.

Cookie: `hielya_session`, with exactly `HttpOnly; Secure; SameSite=Strict; Path=/; Max-Age=<remaining seconds>`. There is no Domain attribute. Max-Age is calculated from the session's existing absolute expiry at response construction, using the existing seconds-until convention, clamped to zero. It does not create a new lifetime. Secure remains enabled in development; the browser host must support secure cookies (HTTPS or a browser-supported local development host).

`GET /api/v1/auth/session` reads this cookie and delegates to `ValidateCustomerSession`. It returns customer and remaining expiry, or the existing error envelope with `SESSION_INVALID` and HTTP 401 for absent, expired, malformed or revoked credentials. It neither renews the session nor emits a credential. `POST /api/v1/auth/logout` delegates to `RevokeCustomerSession`, returns an empty 204 and clears the cookie with the same attributes and `Max-Age=0`. Missing or invalid sessions are idempotent successes; infrastructure failures remain safe 503 errors.

CSRF protection combines `SameSite=Strict` with JSON-content-type POST mutations. Logout requires an empty JSON object. Existing OTP JSON validation remains enforced; cart mutations also require `application/json`. No permissive CORS policy is added. This posture is not a general defense against same-origin XSS or compromised same-site origins.

The client uses `credentials: 'same-origin'`. AuthProvider restores state on mount, ignores cancelled or stale hydration, and leaves the cache empty on 401 or unavailable hydration. Its memory store holds customer/expiry state only. `useIsAuthenticated` returns only a boolean. Existing cart requests use the cookie, with the same server validation, ownership checks and revalidation after routing; bearer support remains for the historical cart transport. The cart ID still lives only in memory and is not restored by this decision.

All authentication responses use no-store/no-cache and safe correlation IDs. Raw credentials must not appear in response bodies, logs, errors, test diagnostics, browser storage or client authentication state.

The new thin route adapters are `apps/ui-lab/app/api/v1/auth/session/route.ts` and `apps/ui-lab/app/api/v1/auth/logout/route.ts`.

## Precisely superseded historical scope

ADR `ADR-MVP-LOCAL-36-OPAQUE-CUSTOMER-SESSION-V1-2.md` remains immutable evidence. This decision supersedes:

- Decision 1 and only the raw-token response portion of Decision 2: no `sessionToken` in JSON; the sole credential delivery is the cookie header.
- Decision 6 and its “únicos adaptadores HTTP autorizados” list: session lookup and logout are now authorized in addition to the two OTP endpoints.
- Consequências exclusions for cookies, logout and `/me`: authenticated customer lookup is implemented as `/auth/session`; no separate `/me` alias is added.

The historical bearer scheme remains historical contract evidence; the new authentication contract declares `customerSession` as an apiKey in cookie. V1.0–V1.4 files remain byte-for-byte unchanged. V1.5 is scoped to authentication and the cookie transport of existing cart consumers, without changing their business contracts.

## Invariants and exclusions

Still in force: 32 bytes of entropy; only SHA-256 persisted; revocable sessions; 2,592,000-second absolute expiry; no token pair, renewal, rotation or signing key; development/test runtime only; existing writable database; required `HIELYA_OTP_PEPPER` without default; simulated SMS without network or OTP disclosure. Application remains independent of HTTP, Next.js, React and SQLite.

No migrations, commercial activation, production gate changes, alcohol domain changes, new SKUs/prices/coupons, real SMS, orders, payments, deployment or merge. No cross-device session management, logout UI, cart recovery, refresh endpoint or production authorization is introduced.
