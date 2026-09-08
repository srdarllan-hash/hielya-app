# HIELYA CHECKPOINT OFICIAL

Versão: 2.8
Data e hora: 2026-08-06 19:16 Europe/Dublin
Tipo: Diário corretivo e de reconciliação
Checkpoint anterior: HIELYA_CHECKPOINT_2026-08-06_v2.7.md

## 1. Inconsistência identificada antes da consolidação

O checkpoint v2.7 não representa integralmente o estado que já existia no GitHub no momento de sua criação.

Evidência temporal:

- PR #7 criado em 2026-08-05 23:28:57 UTC.
- PR #7 certificado e atualizado em 2026-08-05 23:31:43 UTC.
- Checkpoint v2.7 criado em 2026-08-05 23:38:47 UTC.
- Apesar disso, o v2.7 registrou a tela de detalhe do produto como “não iniciada” e indicou esse Gate como etapa futura.

Decisão de reconciliação:

- O v2.7 permanece preservado como registro histórico, mas está superseded para o estado operacional atual.
- O GitHub verificado, os SHAs exatos, o PR #7 e o workflow final prevalecem para a continuidade do projeto.
- Este checkpoint v2.8 corrige a lacuna sem sobrescrever o documento anterior.

PREVIOUS_CHECKPOINT_INCONSISTENT = TRUE
PREVIOUS_CHECKPOINT_OVERWRITTEN = FALSE
CURRENT_CHECKPOINT_SUPERSEDES_OPERATIONAL_STATE = TRUE

## 2. Resumo executivo

Desde o checkpoint v2.7, foi identificado e validado um avanço funcional relevante que não havia sido registrado: a tela pública de detalhe do produto foi implementada e certificada em um novo PR empilhado.

O PR #7 integra a rota visual `/products/{productId}` ao endpoint público `GET /api/v1/catalog/products/{productId}`. A integração usa HTTP, mantém mapeamento explícito entre DTO público e view model, preserva o catálogo canônico vazio e não inicia autenticação, carrinho, checkout, pedidos, pagamentos, Admin ou produção.

O Gate foi certificado no SHA `1470e294404084119308812b049d94601926ce55`, pelo workflow `31056448024`, com todos os jobs concluídos com sucesso.

A cadeia atual permanece empilhada:

PR #5 — fundação técnica e API pública
→ PR #6 — Home conectada ao catálogo público
→ PR #7 — detalhe do produto conectado à API pública

Nenhum PR foi mergeado e a `main` permanece inalterada.

## 3. Estado atual verificado no GitHub

Repositório: `srdarllan-hash/hielya-app`

### main

- SHA: `91e603d94cc0c5499d96eeca7954a19c4e3a2811`
- Alterada pelos Gates atuais: FALSE
- Merge realizado: FALSE

### PR #5 — Fundação técnica e API pública

- Branch: `hielya/mvp-local-36-implementation`
- HEAD congelado: `fe62966daca8bda94610aa1a63702a1e543b0ce6`
- Estado: OPEN / DRAFT
- Mergeado: FALSE
- Escopo funcional encerrado: TRUE

### PR #6 — Home Catalog API Integration

- Branch: `hielya/mvp-local-36-home-catalog-api-integration`
- Base: `hielya/mvp-local-36-implementation`
- HEAD certificado: `274d72db6babbf2605d7fecc9946adb28fbd6593`
- Estado: OPEN / DRAFT
- Mergeado: FALSE

### PR #7 — Product Detail Public API Integration

- Branch: `hielya/mvp-local-36-product-detail-api-integration`
- Base: `hielya/mvp-local-36-home-catalog-api-integration`
- Base SHA: `274d72db6babbf2605d7fecc9946adb28fbd6593`
- HEAD certificado: `1470e294404084119308812b049d94601926ce55`
- Estado: OPEN / DRAFT
- Mergeado: FALSE
- Mergeable: TRUE
- Commits sobre a base: 2
- Arquivos alterados: 46
- Adições: 3.481
- Remoções: 4

## 4. Delta em relação ao checkpoint v2.7

### Concluído e certificado

- Nova rota visual: `/products/{productId}`.
- Consumo do endpoint: `GET /api/v1/catalog/products/{productId}`.
- Integração de navegação da Home para o detalhe usando o `productId` público.
- Runtime dedicado para Product Detail.
- Cliente HTTP estendido para consulta individual.
- Mapeamento explícito PublicProduct → Product Detail view model.
- Estados implementados:
  - `PRODUCT_DETAIL_LOADING`
  - `PRODUCT_DETAIL_READY`
  - `PRODUCT_DETAIL_NOT_FOUND`
  - `PRODUCT_DETAIL_ERROR`
- Produto canônico pausado tratado publicamente como `NOT_FOUND`.
- Dados sintéticos restritos a testes, Storybook e interceptação Playwright.
- Evidência visual independente e versionada.
- Regressões das telas e integrações anteriores preservadas.

### Não alterado

- OpenAPI V1.0.
- OpenAPI MVP Local 36 V1.1.
- Schema persistente.
- Migrations.
- Seed canônico.
- Dados comerciais.
- Packages application e persistence.
- Catálogo comercialmente ativo.
- `main`.

## 5. Decisões arquiteturais consolidadas

1. A rota pública de interface para detalhe é `/products/{productId}`.
2. A fonte runtime da tela é exclusivamente HTTP público.
3. A tela não importa diretamente application, persistence, SQLite ou contratos comerciais JSON.
4. O mapeamento entre resposta HTTP e apresentação é campo a campo; object spread não é permitido na fronteira pública.
5. Produto pausado ou invisível não pode ser distinguido de produto inexistente pela interface pública.
6. `bundleComponents.quantity` representa composição comercial do pack, nunca estoque.
7. Nenhum estoque numérico, custo, margem, lote, movimento ou reserva é exibido.
8. O estado READY é validado com dados sintéticos isolados; nenhum SKU oficial foi ativado para preencher a tela.
9. A cadeia de PRs empilhados continua obrigatória.
10. A próxima camada funcional deve nascer de nova branch filha do SHA certificado do PR #7.

## 6. Arquivos principais criados no PR #7

### Runtime e interface

- `apps/ui-lab/app/products/[productId]/page.tsx`
- `apps/ui-lab/src/client/mvp-local-36/ProductDetailRuntime.tsx`
- `apps/ui-lab/src/client/mvp-local-36/product-detail-mapper.ts`
- `packages/ui/src/screens/product-detail/ProductDetailScreen.tsx`
- `packages/ui/src/screens/product-detail/product-detail.types.ts`
- `packages/ui/src/styles/product-detail.css`

### Governança e evidência

- `.github/workflows/mvp-local-36-product-detail-api-integration-gate.yml`
- `manifests/PRODUCT-DETAIL-PUBLIC-API-INTEGRATION-V1.json`
- `manifests/PRODUCT-DETAIL-PUBLIC-API-INTEGRATION-V1-BASELINE-REVIEW.json`
- `scripts/mvp-local-36-product-detail-api-integration-changed-files.mjs`
- `scripts/validate-mvp-local-36-product-detail-api-integration.mjs`
- `scripts/validate-product-detail-api-integration-baseline-artifact.mjs`
- `scripts/generate-product-detail-api-integration-evidence.mjs`
- `playwright.product-detail-api-integration.config.ts`

### Testes

- `tests/unit/mvp-product-detail-client.test.ts`
- `tests/unit/mvp-product-detail-mapper.test.ts`
- `tests/unit/mvp-product-detail-runtime.test.tsx`
- `tests/unit/product-detail-presentation.test.tsx`
- `tests/integration/product-detail-api-integration.*`
- `tests/accessibility/product-detail-api-integration.a11y.spec.ts`
- `tests/functional/product-detail-api-integration.functional.spec.ts`
- `tests/visual/product-detail-api-integration.visual.spec.ts`
- 12 snapshots visuais para loading, ready, not-found e error em três viewports.

## 7. Arquivos principais modificados no PR #7

- `apps/ui-lab/src/client/mvp-local-36/HomeCatalogRuntime.tsx`
- `apps/ui-lab/src/client/mvp-local-36/catalog-client.ts`
- `packages/ui/src/components/ProductCard.tsx`
- `packages/ui/src/components/PackCard.tsx`
- `packages/ui/src/screens/home/HomeScreen.tsx`
- `packages/ui/src/index.ts`
- `packages/ui/src/styles.css`
- `packages/ui/src/styles/commerce.css`
- `tests/unit/mvp-home-catalog-runtime-boundary.test.ts`

## 8. Arquivos removidos

Nenhum arquivo canônico foi removido.

## 9. Testes, CI e evidências

- Workflow final: `31056448024`
- Resultado: SUCCESS
- SHA validado: `1470e294404084119308812b049d94601926ce55`
- Parent SHA validado: `274d72db6babbf2605d7fecc9946adb28fbd6593`
- Test files: 27/27 aprovados
- Unit tests: 185/185 aprovados
- Lint: SUCCESS, com 0 erros e 6 warnings não bloqueantes
- Typecheck: SUCCESS
- Next.js build: SUCCESS
- Storybook build: SUCCESS
- Product Detail accessibility: SUCCESS
- Product Detail functional/console: SUCCESS
- Product Detail visual regression: SUCCESS
- C-001 regression: SUCCESS
- C-002 regression: SUCCESS
- C-005 frozen regression: SUCCESS
- Home Catalog integration regression: SUCCESS
- Product Detail strict Gate: SUCCESS
- Gate summary: SUCCESS
- Baselines revisadas: 12
- Estados visuais: loading, ready, not-found e error
- Viewports: 360×800, 390×844 e 1170×2532
- Candidate artifact ID: `8950311443`
- Candidate digest: `sha256:97d4c9bd41f64c3189ca980862189f3cb00520f4bbcd75e6965ee5c44ab59872`

## 10. Estado canônico do catálogo

- Registros persistidos: 66
- SKUs do MVP: 36
- Unitários selecionados: 30
- Composites: 6
- SKUs adiados: 30
- SKUs PAUSED: 36
- SKUs comercialmente ativos: 0
- Catálogo público canônico vazio: TRUE
- Resultado público de detalhe para produto canônico pausado: NOT_FOUND
- Mutações de persistência nesta camada: 0
- Campos de estoque numérico expostos: 0

## 11. Capacidades concluídas até o checkpoint v2.8

- C-001 Splash visualmente certificada.
- C-002 Location visualmente certificada com adapters fake.
- C-005 Home visualmente certificada.
- Políticas dos 36 SKUs certificadas.
- Persistência SQLite de desenvolvimento/teste certificada.
- Catálogo comercial persistente e read model certificados.
- API pública read-only certificada e congelada.
- Home conectada por HTTP a categorias e produtos.
- Busca e filtro de categoria conectados à API.
- Tela pública de detalhe conectada por HTTP ao endpoint de produto.
- Estados vazios, erro, loading, ready e not-found protegidos por testes e evidência visual.

## 12. Itens pendentes ou não iniciados

- Integração da C-002 com `POST /api/v1/delivery/quote`.
- Provider real de distância rodoviária.
- C-003 Login.
- C-004 OTP.
- Autenticação e sessão do cliente.
- Carrinho persistente.
- Endereço autenticado e checkout.
- Validação de carrinho.
- Reserva transacional com TTL de 10 minutos.
- Lifecycle de release, expiry e convert da reserva.
- Pedido provisório `AWAITING_PAYMENT`.
- Pagamento simulado.
- Confirmação final do pedido.
- PIN vinculado a pedido/entrega.
- Admin operacional mínimo.
- Banco de produção.
- Providers reais de OTP, mapas e pagamento.
- Deploy, observabilidade, backup, segurança operacional e Gate P.

## 13. Próxima etapa recomendada

Próximo Gate recomendado:

`HIELYA_MVP_LOCAL_36_LOCATION_DELIVERY_QUOTE_INTEGRATION_GATE`

Base certificada recomendada:

`1470e294404084119308812b049d94601926ce55`

Estratégia recomendada:

- Criar nova branch filha do PR #7.
- Criar novo PR draft empilhado sobre `hielya/mvp-local-36-product-detail-api-integration`.
- Conectar o contexto confirmado da C-002 ao endpoint `POST /api/v1/delivery/quote`.
- Manter o adapter de distância determinístico somente em desenvolvimento/testes.
- Não introduzir mapas reais, autenticação, carrinho, checkout ou ativação comercial.
- Preservar o cálculo da taxa exclusivamente no servidor.

Esta recomendação não constitui autorização de implementação.

## 14. Riscos e bloqueios

### Bloqueio operacional

O Work atingiu a cota temporária da conta e permanece indisponível até a renovação informada pelo serviço ou aquisição de créditos. O bloqueio é da ferramenta, não do projeto.

### Riscos técnicos

- Cadeia de PRs empilhados cresce e exige disciplina de ancestralidade.
- Catálogo canônico vazio impede validar READY com dados oficiais antes de Gate de ativação.
- SQLite e migrations continuam restritos a desenvolvimento/teste.
- Não existe provider real de roteamento.
- Lint possui 6 warnings não bloqueantes.
- Storybook possui warning de chunks maiores que 500 kB.
- Alguns componentes ainda usam `<img>` e geram warnings de otimização.
- Autenticação, carrinho, reserva com TTL e orquestração de pagamento ainda não existem.

## 15. Documentos e fontes canônicas

- HIELYA Master Package Work-Ready V1.1
- `contracts/openapi/HIELYA_OPENAPI_V1_0.yaml`
- `contracts/openapi/HIELYA_OPENAPI_MVP_LOCAL_36_V1_1.yaml`
- `contracts/openapi/MVP_LOCAL_36_IMPLEMENTATION_PROFILE.json`
- `contracts/catalog/HIELYA_MVP_LOCAL_36_UNIT_COMMERCIAL_DATA_V1_1.json`
- `contracts/catalog/HIELYA_MVP_LOCAL_36_COMPOSITE_COMMERCIAL_DATA_V1_0.json`
- `docs/decisions/ADR-MVP-LOCAL-36-PUBLIC-SERVICE-API-FINAL-FREEZE.md`
- `manifests/C-005-HOME-CATALOG-API-INTEGRATION-V1.json`
- `manifests/PRODUCT-DETAIL-PUBLIC-API-INTEGRATION-V1.json`
- `manifests/PRODUCT-DETAIL-PUBLIC-API-INTEGRATION-V1-BASELINE-REVIEW.json`
- PR #5 no SHA `fe62966daca8bda94610aa1a63702a1e543b0ce6`
- PR #6 no SHA `274d72db6babbf2605d7fecc9946adb28fbd6593`
- PR #7 no SHA `1470e294404084119308812b049d94601926ce55`
- Workflow final `31056448024`

## 16. Decision Log

- 2026-08-05: PR #7 criado como filho do SHA certificado do PR #6.
- 2026-08-05: rota visual `/products/{productId}` adotada como rota única de detalhe.
- 2026-08-05: tela de detalhe conectada ao endpoint público de produto.
- 2026-08-05: produto canônico pausado confirmado como `NOT_FOUND` na fronteira pública.
- 2026-08-05: 185 testes e todas as regressões concluídos com sucesso.
- 2026-08-05: Product Detail Gate certificado no SHA `1470e294404084119308812b049d94601926ce55`.
- 2026-08-06: inconsistência do checkpoint v2.7 detectada pela comparação Drive × GitHub.
- 2026-08-06: v2.8 criado sem sobrescrever v2.7 e passa a ser o contexto operacional inicial.

## 17. Continuidade

Usar este checkpoint como contexto inicial e validar sempre contra o estado atual do GitHub antes de qualquer nova autorização.

Não adicionar commits funcionais aos PRs #5, #6 ou #7 depois de seus SHAs certificados. Toda nova camada deve usar branch filha e PR empilhado próprios.

CHECKPOINT_STATUS = ACTIVE
CHECKPOINT_VERSION = 2.8
PREVIOUS_CHECKPOINT = 2.7
PREVIOUS_CHECKPOINT_INCONSISTENT = TRUE
CURRENT_OPERATIONAL_CONTEXT = PR_7_PRODUCT_DETAIL_CERTIFIED
CURRENT_HEAD_SHA = 1470e294404084119308812b049d94601926ce55
PR_5 = OPEN_DRAFT_FROZEN
PR_6 = OPEN_DRAFT_CERTIFIED
PR_7 = OPEN_DRAFT_CERTIFIED
MAIN_SHA = 91e603d94cc0c5499d96eeca7954a19c4e3a2811
MAIN_CHANGED = FALSE
MERGE_PERFORMED = FALSE
COMMERCIAL_SKUS_ACTIVATED = 0
PUBLIC_CATALOG_EMPTY = TRUE
NEXT_RECOMMENDED_GATE = HIELYA_MVP_LOCAL_36_LOCATION_DELIVERY_QUOTE_INTEGRATION_GATE
NEXT_RECOMMENDED_BASE_SHA = 1470e294404084119308812b049d94601926ce55
NEXT_CHECKPOINT_VERSION = 2.9
