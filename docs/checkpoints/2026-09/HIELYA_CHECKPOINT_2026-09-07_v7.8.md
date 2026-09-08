# HIELYA CHECKPOINT v7.8 — FORM_DECISIONS_CLOSED / OTP_RETRY_BACKEND_BLOCKER

2026-09-07 UTC. Previousv7.7. Issue48/PR49; priorhead3b0991503314feede73e65d0b25d9a6629f3ce18. Main37dc523013ac13088fffdd70d8d8c6be7292a612, tokens1.2.0 APPROVED_FROZEN. Policy/INDEX/latestcheckpoint and livePR validated. No merge authorized.

Owner ratified all remaining proposedA choices except single-tab-entryB, full-widthdigitsB, conditionalautofocus(loginfalse/OTPtrue via prop). OTP48x56,gap8,radius12,border1,type24/32weight600center; below328container wraps3+3. Full/partial/excess paste specified, lettersrejectentirepaste, separatorsremoved, partialclearsoldcode. RemainingmicrocopyA approved. Revision4 replaces obsolete options with one consolidated normative specification; history remains inGit. Visualdecisionmatrix closed.

Directed code investigation: route delegatesHTTP; applicationtokenrandom/hash; SQLitetransaction marks challengeVERIFIED and inserts oneACTIVE session; repeatVERIFIEDreturnsOTP_UNAVAILABLE; HTTP400. Successfulresponse lost thenretry does NOT return same session or create another. Originalsessionremainsactive; onlyhashpersisted,no plaintextrecoverypath. Existingconcurrencytest asserts replayfailure/sessioncount1. Evidence code-read only, no new networkloss experiment/testclaim.

Created backendblockingIssue50 beforeOtpInput implementation. ExplicitretryUI requirement preserved, but cannot promise sessionrecovery/idempotency; no componentworkaround, contract/backendchange or tokenplaintextstorage. Status DESIGN_DECISIONS_RATIFIED / BACKEND_DEPENDENCY_BLOCKED. Documentreadyformergereview; componentimplementationnotready.

Changedspecification,KNOWN_DEBT(sourcedIssue50),INDEX,newv7.8only. Existingcheckpoints preserved; noUI/code/tests/baselines/values/CLAUDEchanged. PR49 remainsunmerged awaitingapproval; main/production/deployment/realintegrationsunchanged. C003/C004notstarted. Next: ownerreviewdocument; separatelyauthorizebackendresolution50 beforeOtpInputimplementation. CurrentdocCIpendingatcreation, no historicalCIattributed to unimplementedcomponents.
