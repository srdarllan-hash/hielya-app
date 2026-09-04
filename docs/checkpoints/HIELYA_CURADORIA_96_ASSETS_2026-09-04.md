# HIELYA — Curadoria objetiva dos 96 assets visuais

Data: 2026-09-04
Hora de consolidação: 09:52 Europe/Dublin
Status: RELATÓRIO DE CURADORIA / NÃO PROMOVE ASSETS A FINAL

## 1. Escopo e fonte primária

Este relatório consolida os 96 assets registrados na planilha canônica `HIELYA_ASSET_REGISTRY_2026-09-04` (Drive ID `1BkaFcxeouK3B41tZ8-ECPyR2bXuBNl_R8i6r1KRGBVc`). A planilha permanece a fonte granular para Drive ID, caminho, nome, versão, status, datas, URL, grupo canônico e conflitos.

Este documento não altera arquivos, não move assets e não transforma candidato em aprovado. A curadoria separa o inventário por função e explicita o tratamento recomendado segundo a governança HIELYA já integrada em `main`.

## 2. Resultado quantitativo

ASSETS_INVENTARIADOS = 96
STATUS_ATUAL_CANDIDATO = 78
STATUS_ATUAL_APROVADO = 0
STATUS_ATUAL_SUPERSEDED = 18
FAMILIAS_CONFLITANTES = 8
DUPLICATAS_EXATAS_ATIVO_ARQUIVO = 2

Distribuição física observada no registro:

- `00_Design_System`: 13 assets, sendo 6 visuais DS e 7 referências.
- `01_Acesso`: 33 assets, incluindo 2 boards de revisão, 26 ativos/candidatos e 5 itens em `Login_Telefone/Archive_Superseded`.
- `02_Catalogo`: 11 assets.
- `03_Carrinho_Checkout`: 10 assets.
- `04_Pagamento`: 4 assets.
- `05_Pedido_Entrega`: 4 assets.
- `06_Conta`: 5 assets.
- `07_Estados_Erros`: 3 assets.
- `Archive_Superseded` de nível raiz: 13 assets.
- `08_Admin`: 0 assets no registro de 96.

Total = 96.

## 3. Curadoria funcional recomendada

Sem modificar a planilha, a leitura curatorial recomendada é:

- 63 assets de tela/estado ativo: `DESIGN_CANDIDATE`.
- 6 assets visuais de Design System (`HLY_DS_01` a `HLY_DS_06`): `DESIGN_CANDIDATE`, úteis para inspeção, mas não são a autoridade editável do Design System.
- 9 assets de referência/revisão: `REFERENCE_ONLY`. Este grupo é formado pelos 7 `HLY_REFERENCE_*` dentro de `00_Design_System/Referencias` e pelos 2 boards `HLY_BLOCK_01_DESIGN_ACCESS_REVIEW_V1.png` e `HLY_BOARD_C003_C004_AUTH_STATES_V1.png`.
- 18 assets arquivados: `SUPERSEDED`.

CURATION_TOTAL = 63 + 6 + 9 + 18 = 96.

A classificação `REFERENCE_ONLY` é recomendada porque a decisão canônica HLY-UI-004 determina que mockups e PNGs exportados não são fonte editável nem critério de aceite. Eles continuam úteis como evidência visual e histórico.

## 4. Conflitos e duplicidades

### 4.1 Duplicatas exatas ativo/arquivo

1. `HLY_CLIENT_03_PHONE_LOGIN_EMPTY`
   - ativo/candidato: Drive ID `1RodSJwcZPzcxeyff1C3B544EQOCdMw9e`
   - superseded: Drive ID `1Zv09lK3sOHSKsPB8Zn_BKX9YKyPUwsTt`

2. `HLY_CLIENT_03_PHONE_LOGIN_TYPING`
   - ativo/candidato: Drive ID `1dMHw9lTGtKqE7IptRg9vIxYTQnjc0ObS`
   - superseded: Drive ID `1Ielpu0T-Wip66TD0ZatY8UeyZiZO1NDy`

Tratamento: manter o item do caminho ativo como candidato e preservar o arquivo histórico como superseded. Não há justificativa para promover ou restaurar a cópia arquivada.

### 4.2 Famílias V1/V2 com superseded

As seis famílias abaixo possuem V2 ativo e V1/duplicata arquivada:

- `HLY_CLIENT_CART_COUPON_APPLIED`
- `HLY_CLIENT_ORDER_IN_TRANSIT`
- `HLY_CLIENT_SAVED_ADDRESSES`
- `HLY_CLIENT_SUPPORT`
- `HLY_STATE_OUT_OF_STOCK`
- `HLY_STATE_STORE_CLOSED`

Tratamento: o V2 no caminho ativo permanece o candidato preferencial. V1 e duplicatas V2 arquivadas permanecem `SUPERSEDED`. A numeração V2, por si só, não constitui aprovação formal.

## 5. Situação formal do Design System

### 5.1 O que já está formalmente aprovado

`HIELYA_DS_FREEZE_DECISION_V1_0.md` / HLY-DS-001 declara o Design System Core `APPROVED AND FROZEN` no token version 1.1.0. O escopo congelado inclui tokens, tipografia, paleta, grid, espaçamento, componentes base, variantes, estados e regras de acessibilidade.

HLY-DS-002 declara `HeroBanner` e `SectionHeader` componentes React canônicos aprovados na versão de componentes 1.1.1.

Os registros de certificação preservam C-005 e C-001 como `APPROVED_FROZEN`, ambos usando tokenVersion 1.1.0 e componentLibraryVersion 1.1.1.

### 5.2 Estado da camada consolidada atual

O arquivo atual `packages/design-tokens/src/tokens.json` em `main` declara:

- version = 1.2.0
- status = `CONSOLIDATION_CANDIDATE`
- frozen source = 1.1.0
- política de mudança: regressões completas C-005/C-001 e aprovação Pre-Gate2 antes de se tornar frozen.

`manifests/versions.json` também mantém Design Tokens 1.1.0 como `frozenSource` e 1.2.0 como `consolidationCandidate`; a Component Library mantém 1.1.1 como `frozenSource`, 1.2.0 como `consolidationCandidate` e 1.3.0 como `gate2Candidate`.

`manifests/certifications.json` ainda registra a consolidação arquitetural como `REQUIRES_EXACT_SHA_GATE`. Portanto, mesmo com a cadeia agora integrada em `main`, não existe no metadata canônico atual uma promoção explícita de Design Tokens 1.2.0 para `APPROVED_FROZEN`.

### 5.3 Requisitos formais para aprovação da camada atual

A aprovação formal do Design System consolidado deve, no mínimo:

1. identificar o SHA exato candidato;
2. fixar a versão semântica dos Design Tokens e da Component Library;
3. demonstrar regressão integral das baselines congeladas C-005 e C-001;
4. passar build e testes automatizados no mesmo SHA;
5. passar acessibilidade;
6. passar responsividade;
7. passar regressão visual;
8. concluir QA no mesmo commit;
9. produzir screenshots oficiais renderizados a partir do código real;
10. produzir/validar manifesto, relatório, hashes e evidências do mesmo SHA;
11. registrar explicitamente o estado `APPROVED_FROZEN` em documento/manifesto canônico;
12. atualizar os manifests de versões/certificações para remover a ambiguidade entre `frozenSource`, `consolidationCandidate` e `REQUIRES_EXACT_SHA_GATE`.

A sequência canônica HLY-UI-004 permanece:

DESIGN TOKENS → COMPONENTES REACT CANÔNICOS → IMPLEMENTAÇÃO CODE-FIRST → INTEGRAÇÃO NA BRANCH → RENDERIZAÇÃO REAL → SCREENSHOTS OFICIAIS → TESTES → QA → APPROVED_FROZEN → INTEGRAÇÃO DEFINITIVA.

Logo, `HLY_DS_01` a `HLY_DS_06` não podem ser aprovados isoladamente como autoridade do Design System apenas por serem PNGs visualmente corretos. Eles devem ser tratados como evidência/candidato alinhado ao código/tokens canônicos.

## 6. Resultado da verificação de aprovação

DS_FROZEN_BASE_1_1_0 = APPROVED_FROZEN
COMPONENT_LIBRARY_FROZEN_BASE_1_1_1 = APPROVED/CERTIFIED_BASE
DESIGN_TOKENS_1_2_0 = CONSOLIDATION_CANDIDATE
DESIGN_SYSTEM_PNG_ASSETS_APPROVED = FALSE
ASSET_REGISTRY_APPROVED_COUNT = 0
FORMAL_PROMOTION_OF_CURRENT_DS_CANDIDATE = NOT_RECORDED

Conclusão: os requisitos formais estão definidos, mas a promoção formal da camada consolidada atual e dos seis PNGs DS não está registrada como concluída. Não se deve inferir aprovação a partir do merge em `main`.

## 7. Estado pós-integração

Integration Issue #18 = CLOSED / COMPLETED
Integration PR #19 = MERGED
Certified source HEAD = `81cb538f5d78b5d73196919d43086b2cee5dcd67`
Certified tree = `774f3153add86419f4aa622267e51c7a6f786f3c`
New main SHA = `df912c101b3db5c910a8c575fb2e2e687a54f4f5`
New main tree = `774f3153add86419f4aa622267e51c7a6f786f3c`
Tree equivalence = EXACT
Fresh full Gate rerun = workflow `33824314892`, attempt 3, SUCCESS
Functional integration changes = NONE

## 8. Restrições preservadas

- C-003 não iniciado após o merge.
- C-004 não iniciado após o merge.
- Nenhuma nova tela criada após a autorização de integração.
- Nenhum asset foi promovido a FINAL/APROVADO por este relatório.
- Nenhum item superseded foi restaurado.
- Nenhum checkpoint anterior foi sobrescrito.

## 9. Decisão curatorial sugerida para o próximo Gate

Antes de implementação de qualquer nova camada, registrar explicitamente:

- 63 telas/estados ativos = DESIGN_CANDIDATE;
- 6 PNGs DS = DESIGN_CANDIDATE/EVIDENCE;
- 9 referências e boards = REFERENCE_ONLY;
- 18 arquivos arquivados = SUPERSEDED;
- 0 assets = APPROVED até ato formal específico.

O registro granular existente deve continuar sendo a fonte por Drive ID e caminho. Este relatório é a camada de decisão e leitura, não um substituto da planilha canônica.

## 10. Fontes

Google Drive:
- `HIELYA_ASSET_REGISTRY_2026-09-04` — Drive ID `1BkaFcxeouK3B41tZ8-ECPyR2bXuBNl_R8i6r1KRGBVc`
- `HIELYA_CHECKPOINT_2026-09-04_v4.1.md`

GitHub `main`:
- `docs/HIELYA_DS_FREEZE_DECISION_V1_0.md`
- `docs/decisions/HLY-DS-002-HERO-SECTION-HEADER.md`
- `docs/decisions/HLY-UI-004-CANONICAL-PRODUCTION-SEQUENCE.md`
- `packages/design-tokens/src/tokens.json`
- `manifests/versions.json`
- `manifests/certifications.json`
- PR #19 / Issue #18

CURATION_REPORT_STATUS = CREATED
