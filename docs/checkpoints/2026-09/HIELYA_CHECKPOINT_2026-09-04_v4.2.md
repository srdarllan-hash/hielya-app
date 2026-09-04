HIELYA CHECKPOINT — 2026-09-04 v4.2

Estado: checkpoint oficial pós-integração da cadeia certificada à `main`, subsequente ao v4.1. Nenhum checkpoint anterior foi sobrescrito.

## 1. Metadata

VERSION = 4.2
DATE = 2026-09-04
TIME = 09:52
TIMEZONE = Europe/Dublin
PREVIOUS_CHECKPOINT = HIELYA_CHECKPOINT_2026-09-04_v4.1.md
REPOSITORY = srdarllan-hash/hielya-app
INTEGRATION_ISSUE = #18
INTEGRATION_PR = #19
PRESERVED_AUTH_PR = #17
CERTIFIED_SOURCE_HEAD = 81cb538f5d78b5d73196919d43086b2cee5dcd67
CERTIFIED_SOURCE_TREE = 774f3153add86419f4aa622267e51c7a6f786f3c
NEW_MAIN_SHA = df912c101b3db5c910a8c575fb2e2e687a54f4f5
NEW_MAIN_TREE = 774f3153add86419f4aa622267e51c7a6f786f3c
FULL_GATE_WORKFLOW = 33824314892
FULL_GATE_ATTEMPT = 3
CI_STATUS = SUCCESS

## 2. Resumo executivo

O responsável autorizou explicitamente a Opção 1: integrar toda a cadeia acumulada à `main` por meio de um PR exclusivo de integração, usando exatamente o HEAD certificado `81cb538f5d78b5d73196919d43086b2cee5dcd67` e sem alterações de código na branch de integração.

A autorização foi executada integralmente. Foi criada a Issue #18, criada a branch `hielya/integration-certified-chain-81cb-main` diretamente do SHA certificado, aberto o PR #19 contra `main`, validada a equivalência exata das árvores, reexecutado o Gate completo no SHA certificado e, após todos os jobs verdes, realizado o merge do PR #19.

A nova `main` é `df912c101b3db5c910a8c575fb2e2e687a54f4f5`. A árvore da `main` após o merge é `774f3153add86419f4aa622267e51c7a6f786f3c`, exatamente a mesma árvore do HEAD certificado. Portanto, o merge adicionou apenas o commit de integração/histórico; não introduziu delta de conteúdo em relação ao candidato certificado.

O PR #17 foi preservado, continua aberto e não foi mergeado diretamente. Seu HEAD certificado é agora ancestral/conteúdo da `main` por intermédio do PR #19, conforme mecanismo autorizado. Nenhuma reescrita de base ou histórico foi realizada no PR #17.

Após o merge, não foram iniciados C-003, C-004 ou novas telas. Foi produzido o relatório objetivo de curadoria dos 96 assets e verificado o estado formal do Design System.

## 3. Gate de integração para `main`

### 3.1 Issue e branch

Issue #18: `[Integration] Promote certified accumulated chain to main`
Estado final: CLOSED / COMPLETED

Branch de integração: `hielya/integration-certified-chain-81cb-main`
Origem exata: `81cb538f5d78b5d73196919d43086b2cee5dcd67`
Alterações de código na branch de integração: NONE

### 3.2 PR de integração

PR #19: `integration: promote certified accumulated chain to main`
Base: `main`
Head: `hielya/integration-certified-chain-81cb-main`
Head SHA: `81cb538f5d78b5d73196919d43086b2cee5dcd67`
Estado final: CLOSED / MERGED
Merge commit: `df912c101b3db5c910a8c575fb2e2e687a54f4f5`
Merged at: 2026-09-04T08:44:00Z

### 3.3 Prova de equivalência da árvore

Certified HEAD tree = `774f3153add86419f4aa622267e51c7a6f786f3c`
GitHub merge-ref tree antes do merge = `774f3153add86419f4aa622267e51c7a6f786f3c`
New main tree após o merge = `774f3153add86419f4aa622267e51c7a6f786f3c`

TREE_EQUIVALENCE = EXACT
CONTENT_DELTA_FROM_CERTIFIED_HEAD = NONE
FUNCTIONAL_INTEGRATION_CHANGE = NONE

O commit de merge possui como pais a antiga `main` (`91e603d94cc0c5499d96eeca7954a19c4e3a2811`) e o HEAD certificado (`81cb538f5d78b5d73196919d43086b2cee5dcd67`). A assinatura do commit de merge foi verificada pelo GitHub.

## 4. Validação e CI

O workflow completo `MVP Local 36 Opaque Session OTP HTTP Transport Gate`, run `33824314892`, foi reexecutado em uma nova tentativa 3 sobre o SHA certificado `81cb538f5d78b5d73196919d43086b2cee5dcd67` imediatamente antes do merge.

Todos os cinco jobs concluíram com sucesso:

1. `auth-http-contract-validation` = SUCCESS
   - validação de autorização e história limitada;
   - contratos, migrations e APIs congeladas;
   - testes focados OpenAPI/HTTP/auth/concurrency;
   - full unit regression;
   - lint e typecheck;
   - Next build.

2. `c002-delivery-quote-alignment-frozen-regression` = SUCCESS
   - build;
   - Playwright;
   - acessibilidade, funcional e regressão visual congelada.

3. `c005-frozen-regression / validate-screen` = SUCCESS
   - screen contract;
   - Design Tokens;
   - lint;
   - typecheck;
   - unit tests;
   - Next build;
   - Storybook;
   - Axe, funcional, console e visual regression;
   - evidence upload.

4. `frozen-and-integration-regressions` = SUCCESS
   - C-001 e C-002 congelados;
   - C-002 Prequote Continuation;
   - Home Catalog integration;
   - Product Detail integration.

5. `gate-summary` = SUCCESS.

O workflow é branch-scoped ao Gate de autenticação e não possui um gatilho genérico específico para a branch de integração/main. Não foi alterado o CI apenas para criar um sinal artificial. A validação contra a integração foi estabelecida por três fatos combinados: `main` anterior era ancestral direto da cadeia, a merge-ref tree era idêntica ao HEAD certificado e a nova `main` possui exatamente a mesma tree. Assim, o Gate completo executado sobre o SHA certificado validou os mesmos bytes incorporados à `main`.

CI_GATE_RERUN_ATTEMPT_3 = SUCCESS
MAIN_TREE_MATCHES_TESTED_TREE = TRUE

## 5. Estado da `main` após o merge

OLD_MAIN_SHA = 91e603d94cc0c5499d96eeca7954a19c4e3a2811
NEW_MAIN_SHA = df912c101b3db5c910a8c575fb2e2e687a54f4f5
NEW_MAIN_TREE = 774f3153add86419f4aa622267e51c7a6f786f3c
MAIN_CHANGED = TRUE
MERGE_PERFORMED = TRUE
MERGE_MECHANISM = PR_19_INTEGRATION
PRODUCTION_ACTIVATED = FALSE
DEPLOYMENT_PERFORMED = FALSE

A `main` agora contém a cadeia certificada acumulada, incluindo o conteúdo técnico do PR #17, sem que o PR #17 tenha sido rebaseado, retargeted ou mergeado diretamente.

## 6. Preservação do PR #17

PR #17 = OPEN
DRAFT = FALSE
DIRECTLY_MERGED = FALSE
BASE = hielya/mvp-local-36-customer-authentication-foundation
BASE_SHA = 68d5f5422a9dff560b301c17fe1bce466ac7281a
HEAD = hielya/mvp-local-36-auth-http-opaque-session
HEAD_SHA = 81cb538f5d78b5d73196919d43086b2cee5dcd67

O PR #17 continua como registro histórico/certificado da camada de autenticação. Como seu conteúdo já chegou à `main` pelo PR #19, um merge futuro independente do PR #17 não deve ser realizado automaticamente sem nova análise da relação de commits e objetivo histórico.

## 7. Curadoria dos 96 assets

Fonte granular canônica: `HIELYA_ASSET_REGISTRY_2026-09-04`
Drive ID: `1BkaFcxeouK3B41tZ8-ECPyR2bXuBNl_R8i6r1KRGBVc`

Relatório produzido neste Gate: `HIELYA_CURADORIA_96_ASSETS_2026-09-04.md`
Drive ID: `1yhdE6tStjgQ9RSjl2G8qcUcn6T42Zp-RWoqHLqQU314`

Contagem confirmada:

ASSETS_TOTAL = 96
CURRENT_CANDIDATES = 78
CURRENT_APPROVED = 0
CURRENT_SUPERSEDED = 18
CONFLICT_FAMILIES = 8
EXACT_ACTIVE_ARCHIVE_DUPLICATES = 2

Leitura curatorial recomendada, sem alterar o registro nesta etapa:

- 63 telas/estados ativos = `DESIGN_CANDIDATE`;
- 6 PNGs do Design System = `DESIGN_CANDIDATE/EVIDENCE`;
- 9 referências/boards = `REFERENCE_ONLY`;
- 18 arquivados = `SUPERSEDED`;
- 0 assets = `APPROVED` até ato formal específico.

As duas duplicatas exatas ativo/arquivo são `HLY_CLIENT_03_PHONE_LOGIN_EMPTY` e `HLY_CLIENT_03_PHONE_LOGIN_TYPING`. O arquivo do caminho ativo permanece candidato; a cópia de arquivo permanece superseded.

As seis famílias V1/V2 com candidato V2 ativo são:

- HLY_CLIENT_CART_COUPON_APPLIED
- HLY_CLIENT_ORDER_IN_TRANSIT
- HLY_CLIENT_SAVED_ADDRESSES
- HLY_CLIENT_SUPPORT
- HLY_STATE_OUT_OF_STOCK
- HLY_STATE_STORE_CLOSED

Os V1 e V2 duplicados arquivados permanecem superseded. Nenhuma aprovação foi inferida da versão do nome.

## 8. Verificação formal do Design System

### 8.1 Base congelada existente

HLY-DS-001 (`HIELYA_DS_FREEZE_DECISION_V1_0.md`) = APPROVED AND FROZEN
Design Tokens frozen source = 1.1.0

HLY-DS-002 (`HeroBanner` e `SectionHeader`) = APROVADO
Component Library certified/frozen base = 1.1.1

C-005 e C-001 permanecem registrados como `APPROVED_FROZEN` com tokenVersion 1.1.0 e componentLibraryVersion 1.1.1.

### 8.2 Camada consolidada atual

`packages/design-tokens/src/tokens.json`:
DESIGN_TOKENS_VERSION = 1.2.0
DESIGN_TOKENS_STATUS = CONSOLIDATION_CANDIDATE
FROZEN_SOURCE = 1.1.0

`manifests/versions.json` continua separando `frozenSource` e `consolidationCandidate`.
`manifests/certifications.json` continua registrando a consolidação arquitetural como `REQUIRES_EXACT_SHA_GATE`.

Portanto:

FORMAL_DS_1_2_0_PROMOTION = NOT_RECORDED
HLY_DS_01_TO_06_PNG_APPROVAL = FALSE

O merge na `main` não é, isoladamente, uma decisão de `APPROVED_FROZEN` do Design System consolidado.

### 8.3 Requisitos de aprovação formal confirmados

Para promover a camada consolidada atual deve haver, no mesmo SHA candidato:

1. versão semântica identificada e estável de tokens/componentes;
2. regressão completa de C-005 e C-001;
3. build e testes automatizados;
4. acessibilidade;
5. responsividade;
6. regressão visual;
7. QA;
8. screenshots oficiais renderizados do código real;
9. manifesto, relatório, hashes e evidências do mesmo SHA;
10. ato explícito `APPROVED_FROZEN`;
11. atualização dos manifests de versão/certificação para refletir a promoção.

HLY-UI-004 permanece autoridade de processo e estabelece que mockups e PNGs exportados não são fonte editável nem critérios de aceite.

## 9. Arquivos/documentos criados neste Gate

GitHub:
- Issue #18 criada e concluída.
- Branch `hielya/integration-certified-chain-81cb-main` criada no SHA certificado.
- PR #19 criado e mergeado.
- Novo commit de merge em `main`: `df912c101b3db5c910a8c575fb2e2e687a54f4f5`.

Google Drive:
- `HIELYA_CURADORIA_96_ASSETS_2026-09-04.md`
- `HIELYA_CHECKPOINT_2026-09-04_v4.2.md`

FILES_REMOVED = 0
VISUAL_ASSETS_MOVED = 0
VISUAL_ASSETS_DELETED = 0
ASSET_REGISTRY_MODIFIED = FALSE
PREVIOUS_CHECKPOINT_OVERWRITTEN = FALSE

## 10. Restrições pós-merge preservadas

C_003_STARTED_AFTER_MERGE = FALSE
C_004_STARTED_AFTER_MERGE = FALSE
NEW_SCREEN_CREATED_AFTER_MERGE = FALSE
NEW_VISUAL_BATCH_STARTED = FALSE
REAL_SMS_ACTIVATED = FALSE
PAYMENT_PROVIDER_ACTIVATED = FALSE
PRODUCTION_ACTIVATED = FALSE
DEPLOYMENT_PERFORMED = FALSE

## 11. Estado atual do projeto

CANONICAL_IMPLEMENTATION_BRANCH = main
CANONICAL_IMPLEMENTATION_SHA = df912c101b3db5c910a8c575fb2e2e687a54f4f5
CANONICAL_IMPLEMENTATION_TREE = 774f3153add86419f4aa622267e51c7a6f786f3c
CERTIFIED_SOURCE_HEAD = 81cb538f5d78b5d73196919d43086b2cee5dcd67
SOURCE_TO_MAIN_TREE_EQUIVALENCE = EXACT
INTEGRATION_PR_19 = MERGED
INTEGRATION_ISSUE_18 = CLOSED
PR_17 = OPEN / PRESERVED
CI = SUCCESS

C003_IMPLEMENTATION = NOT_STARTED
C004_IMPLEMENTATION = NOT_STARTED
BEARER_CONSUMER = NOT_STARTED
REAL_SMS = NOT_STARTED
CART_RUNTIME_IMPLEMENTATION = NOT_STARTED
CHECKOUT_RUNTIME_IMPLEMENTATION = NOT_STARTED
PAYMENT_RUNTIME_IMPLEMENTATION = NOT_STARTED
ADMIN_IMPLEMENTATION = NOT_STARTED

## 12. Pendências e prioridades

1. Não iniciar C-003/C-004 nem novas telas sem nova autorização específica.
2. Decidir, em Gate separado, se os nove assets de referência/board serão formalmente reclassificados para `REFERENCE_ONLY` no registro canônico.
3. Decidir, em Gate separado, se os 63 screens/states candidatos serão submetidos a aprovação, revisão ou descarte, sem inferir aprovação por presença no Drive.
4. Se houver intenção de promover Design Tokens 1.2.0 / Component Library consolidada, abrir Issue/Gate específico de promoção formal, com atualização dos manifests e evidência same-SHA.
5. Preservar os 18 superseded e não restaurá-los sem decisão explícita.
6. Tratar o PR #17 como histórico técnico preservado; não executar novo merge independente sem análise de necessidade.
7. Manter o relatório de curadoria e a planilha de registro alinhados quando houver futura decisão formal de status.

## 13. Riscos conhecidos

- O fato de toda a cadeia estar agora em `main` pode ser confundido com aprovação formal de todos os Design Tokens/componentes candidatos; os manifests atuais não sustentam essa conclusão.
- Os 78 assets atualmente marcados candidato podem ser confundidos com telas aprovadas; o approved count confirmado permanece zero.
- Os 9 boards/referências podem ser usados indevidamente como critério de aceite, contrariando HLY-UI-004.
- O PR #17 permanecer aberto após a integração canônica pode induzir tentativa de merge duplicado; deve ser preservado como histórico até decisão específica.
- As 8 famílias conflitantes exigem seleção sempre por Drive ID + caminho, não apenas pelo nome.
- Um futuro Gate de Design System deve resolver explicitamente a divergência de metadata entre frozen source e consolidation candidate.

## 14. Blockers para novas camadas

BLOCKER_01 = NO_EXPLICIT_AUTHORIZATION_FOR_C003_C004_OR_NEW_SCREENS
BLOCKER_02 = VISUAL_ASSET_APPROVED_COUNT_IS_ZERO
BLOCKER_03 = DESIGN_SYSTEM_1_2_0_FORMAL_PROMOTION_NOT_RECORDED
BLOCKER_04 = DESIGN_SYSTEM_MANIFEST_STATUS_REQUIRES_RECONCILIATION_BEFORE_PROMOTION
BLOCKER_05 = REFERENCE_BOARD_STATUS_NOT_YET_FORMALLY_RECLASSIFIED
BLOCKER_06 = PR_17_REMAINS_OPEN_BUT_CONTENT_IS_ALREADY_IN_MAIN_VIA_PR_19

## 15. Documentos canônicos e evidências

Implementação factual:
- GitHub `main` @ `df912c101b3db5c910a8c575fb2e2e687a54f4f5`
- Integration PR #19
- Integration Issue #18
- workflow `33824314892`, attempt 3
- preserved PR #17 @ `81cb538f5d78b5d73196919d43086b2cee5dcd67`

Design System:
- `docs/HIELYA_DS_FREEZE_DECISION_V1_0.md`
- `docs/decisions/HLY-DS-002-HERO-SECTION-HEADER.md`
- `docs/decisions/HLY-UI-004-CANONICAL-PRODUCTION-SEQUENCE.md`
- `packages/design-tokens/src/tokens.json`
- `manifests/versions.json`
- `manifests/certifications.json`

Drive:
- `HIELYA_ASSET_REGISTRY_2026-09-04`
- `HIELYA_CURADORIA_96_ASSETS_2026-09-04.md`
- `HIELYA_CHECKPOINT_2026-09-04_v4.1.md`
- `HIELYA_CHECKPOINT_2026-09-04_v4.2.md`

## 16. Decision Log v4.2

D-4.2-01 — Executar a integração canônica para `main` por PR exclusivo a partir do HEAD certificado `81cb538f...`, conforme autorização explícita do responsável.

D-4.2-02 — Criar Issue #18, branch exclusiva e PR #19 sem alterar o código do candidato certificado.

D-4.2-03 — Aceitar o Gate somente após prova de equivalência exata de tree e rerun completo do workflow 33824314892, tentativa 3, com todos os jobs verdes.

D-4.2-04 — Mergear PR #19 e registrar `df912c101b3db5c910a8c575fb2e2e687a54f4f5` como nova `main`, com tree idêntica à do SHA certificado.

D-4.2-05 — Preservar PR #17, sua base e seu histórico; não realizar merge direto do PR #17 nesta operação.

D-4.2-06 — Não iniciar C-003, C-004 nem novas telas após o merge.

D-4.2-07 — Consolidar a curadoria objetiva dos 96 assets como 63 screens/states candidatos, 6 PNGs DS candidatos/evidência, 9 referências/boards recomendados como REFERENCE_ONLY e 18 superseded, mantendo approved = 0.

D-4.2-08 — Reconhecer que Design System Core 1.1.0 e component base 1.1.1 possuem congelamento/certificação anterior, mas que a promoção formal da camada consolidada 1.2.0 não está registrada nos manifests atuais.

D-4.2-09 — Não considerar PNGs ou mockups autoridade editável/critério de aceite; manter HLY-UI-004 como sequência canônica de aprovação.

D-4.2-10 — Preservar todos os checkpoints anteriores e registrar v4.2 como novo checkpoint, sem sobrescrita.

## 17. Preservation

SENSITIVE_VALUES_INCLUDED = FALSE
OVERWRITE_PREVIOUS_CHECKPOINT = FALSE
PR_17_HISTORY_REWRITTEN = FALSE
PR_17_BASE_CHANGED = FALSE
CERTIFIED_SOURCE_CODE_CHANGED_BY_INTEGRATION = FALSE
MAIN_CHANGED_BY_AUTHORIZED_INTEGRATION = TRUE
PRODUCTION_CHANGED = FALSE
DEPLOYMENT_CHANGED = FALSE
NEW_FUNCTIONAL_LAYER_STARTED = FALSE

## 18. Closing

CHECKPOINT_STATUS = CREATED_AND_VERIFIED

A cadeia certificada acumulada foi integrada à `main` pelo mecanismo explicitamente autorizado. A `main` pós-merge possui a mesma árvore do HEAD certificado e o Gate completo foi reexecutado com sucesso imediatamente antes do merge. O trabalho pós-merge foi limitado à curadoria dos 96 assets, verificação formal do Design System e criação deste checkpoint. C-003, C-004 e novas telas não foram iniciados.
