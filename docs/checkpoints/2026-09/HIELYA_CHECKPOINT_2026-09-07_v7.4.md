# HIELYA CHECKPOINT v7.4 — FORM_COMPONENTS_SPECIFICATION

2026-09-07 UTC. Issue48. Branch hielya/form-components-specification, main base5aca80958afcafd75e91665c4556593e8bdcefaf, tree747c4e38525c1f1529c944fa8bec0d691dd5eb97. Previous highest versionv7.3 in open PR47/d7204fedce06e766f74793e752b75b1055dad70a; latest in mainv7.2. Read policy/INDEX/checkpoints and validated PR34/46 merges plus CI34136321712/34136321715 SUCCESS987tests. No implicit merge47 or32; branch directly frommain.

Created docs/requirements/FORM_COMPONENTS_SPECIFICATION.md: full topic coverage for Input/PhoneInput/OtpInput, sources, token values, states/API/accessibility, ES phone normalization, OTP6, application/UI boundaries, decision matrix and future verification criteria. No implementation. PNGs reference only. No new visual values adopted; unapproved microcopy explicitly candidate, behaviors without authority explicitly pending.

Divergences reported before document publication: requested APPROVED_FROZEN conflicts with main tokens.json/tokens.ts1.2.0 CONSOLIDATION_CANDIDATE; PR32/27bb14c47e3513143c1b103655334da1bedab119 still open/unmerged. SearchField radius16/elevated/leftpadding12 differs from ManualAddressForm radius12/primary/padding12x16. User explicitly selects latter geometry for newInput; SearchField unchanged. OTP cell arrangement cannot be inferred from token existence.

Decision log: user fixes Spain+34/9digits, OTP6, baseline measures, normalized phone, no requests/challenge/session responsibility in components, no OTP logging. Pending D0 freeze reconciliation; D2 state/slot/API/a11y presentation; D3 phone mask/paste/caret/partialcallback/validation timing; D4 Spanish copy; D5 OTP structure/navigation/paste/submit/errorreset; D6 cell geometry/narrowcontainers. No defaults selected on owner's behalf. NOT_READY_FOR_IMPLEMENTATION until explicit decisions and review.

Validation: source/token inspection, local relative links and diff whitespace checked; only new specification/checkpoint plus INDEX addition. No local product tests warranted for documentation only; no claim that previous987tests certify new components. PR CI status pending at creation, final evidence belongs to PR without rewriting this file.

Main unchanged. Existing checkpoints preserved. PR to be opened for review; merge not authorized. C003/C004/telas/production/deployment/integrations unchanged and blocked. Next: owner decisions, revise same specification in PR, approve before implementation. No new canonical authority created by this draft.
