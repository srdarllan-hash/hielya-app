# C-003 / C-004 — application integration scope

Issue #53. Owner-authorized after PR #52 merge. Components follow [FORM_COMPONENTS_SPECIFICATION](FORM_COMPONENTS_SPECIFICATION.md); tokens 1.2.0 APPROVED_FROZEN, PNGs REFERENCE_ONLY. This record resolves the questions in checkpoint v8.3, without rewriting it.

## Ratified decisions

- Session token stays only in application memory in this scope. Reload loses login. Secure persistent storage requires a future formal ADR. `SessionPort` is the integration seam; only the memory adapter is supplied. No localStorage, sessionStorage, cookies, IndexedDB, JWT, renewal, middleware or real SMS.
- `/login` is the explicit temporary entry. Public Home/catalog remain anonymous-accessible. No add-to-cart action is repurposed as authentication and no cart/checkout is implemented. Successful verify writes the memory session and uses Next client navigation to `/`, preserving the root provider; Home consumes the authenticated boolean. The temporary entry/continuation is marked in code for replacement when checkout exists.
- C-003 uses PhoneInput with autofocus false, fixed +34, Spanish contract normalization and Ahora no returning to Home. C-004 uses OtpInput with autofocus true on the first real cell and automatic submit at six digits. No Verificar button or accessibility fallback button is added.
- Application owns challengeId, request sequencing, cancellation, cooldown, expiry display and session. Reusable screen components receive presentation values/callbacks. OTP and session tokens never enter logs, analytics, URLs, persistence, Storybook args/actions or session replay.
- C-004 displays the masked phone (last three digits, matching the base reference), expiration countdown, resend countdown, Nunca compartas este código and Cambiar número. Countdown updates have no live region. Cambiar número cancels local in-flight work and returns to the preserved phone; the server remains authoritative and an already committed operation is not undone.

## Transport and lifecycle

Existing `/api/v1/auth/otp/request`: `{phoneE164, locale: 'es-ES'}`; accepted 202 `{challengeId, expiresInSeconds, resendAfterSeconds}`. Existing verify: `{challengeId, code}`; 200 opaque session and minimal customer. No OpenAPI/backend changes. The browser adapter validates response shapes, uses no-store, omits cookies, rejects redirects and translates errors to safe constant codes without reflecting response bodies.

Submission locks synchronously before awaiting. Old responses after cancellation/change-number/unmount do not change UI or install a session. The current challenge's code remains ephemeral; retry intent is separate from automatic completion. Each accepted new challenge remounts a fresh empty OTP editor. Failed resend retains the existing challenge.

Expiration displays an absolute deadline derived from the server interval and request start; reaching zero does not locally declare server rejection. The server decides OTP_EXPIRED. Cooldown uses response arrival plus the server interval, conservatively avoiding early enablement. Retry-After may extend the deadline. Missing/invalid Retry-After on a lock does not invent an unlock duration. Known cooldown survives change-number while the flow remains mounted. Reload starts fresh application state, and server limits still apply. There is no automatic resend.

Verify network failure preserves digits and focuses canonical secondary/md/automatic-width Reintentar. Explicit retry may use the same code. OTP_UNAVAILABLE displays exactly “Este código no está disponible. Solicita otro cuando puedas.” and disables verification; resend becomes available only when the application deadline allows it. Invalid code clears and refocuses; expired/locked clear and focus the error summary. Service-unavailable offers the same canonical retry action, not a new verification submit control. Issue #50 stays deferred medium debt; no recovery promise or backend workaround.

## Reference provenance and implementation authority

C-003 option A: Drive `1RodSJwcZPzcxeyff1C3B544EQOCdMw9e`. C-004 folder Codigo_SMS: `1WSkdwoOYkMDjoAHad5FEMwyYcGGanimN`.

| State | Drive reference |
|---|---|
| Base | 1XogKE4KrcxT0NW0D57XCQS9SYZV8vtGV |
| Disabled | 1bEfgexitcoEjLrOmGiD4Ww1dUosDV7HP |
| Partial | 1r40Ei8YrRc5M2n_gOGGF9It028oPiLBN |
| Complete | 1siiR0MNp3_uBcomIskSjRXTKxDsPdOjc |
| Verifying | 1Zdr7giSEXuiO5OZU8ioBjaZncYIinW6K |
| Invalid | 17TLMrb351Xb3S-5kMukkS6YZjlNl2ZHX |
| Expired | 1Wc1LbPEn_-yvv1GzYsPsoJh5l4-WzhAZ |
| Locked | 1HQudxShJHqNXSYrsVAiO0AX1WOKvOqAo |
| Network error | 1qoQf3l43QmChFpUeJ68dmkaK8kPi17MI |
| Resend cooldown | 1YEhQiyGGXY3lYoWEVzMkdN_5gsQRTrxE |
| Resend available | 1D4B4RECn9cBj7Kc-5LMipe_hXf32BPIe |
| Success | 1sICrFW0v2OeobXUiQCXSL3VwC4rf9fhi |

Base, network error, resend available and success references were visually inspected. PNG button styles, simulated device chrome, illustrative phone values, fixed countdowns, cart-preservation promises and verification buttons do not override the code-first contract or authorized scope. Screen composition uses AppShell/BrandLockup and existing C-002 typography/shell tokens; fields and actions use certified components. No PNG-derived measurements, new token values or illustration reconstruction.

## Validation and limits

Unit tests cover application/HTTP errors, deadlines, explicit retry, session isolation and stale response suppression. Browser tests cover public Home, Ahora no, automatic completion, return to authenticated Home, reload losing state, network/unavailable/resend, keyboard navigation and cancellation; HTTP fixtures are synthetic. Axe scans cover 24 Storybook states in Chromium360 and WebKit390. Trace/video/screenshots are off for authentication tests. Existing component and Design System regressions remain required.

This scope does not certify physical iOS/Android SMS autofill, manual screen readers, SMS delivery or authenticated checkout. The existing runtime remains fail-closed without configured development/test dependencies and in production. CI evidence is recorded on the PR's exact head before requesting owner approval; merge requires separate authorization.
