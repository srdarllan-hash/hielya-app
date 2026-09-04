# HIELYA CHECKPOINT OFICIAL

Versão: 2.7
Data e hora: 2026-08-06 00:37 Europe/Dublin
Tipo: Extraordinário
Checkpoint anterior: HIELYA_CHECKPOINT_2026-08-05_v2.6.md

## Resumo executivo

Desde o checkpoint v2.6, o projeto avançou da etapa de congelamento comercial dos composites até uma fundação técnica e API pública formalmente congeladas, seguida pela primeira integração funcional da Home com a API pública.

O PR #5 foi encerrado para crescimento funcional no SHA fe62966daca8bda94610aa1a63702a1e543b0ce6. O PR #6 foi criado como PR empilhado e certificou a integração da C-005 Home com os endpoints públicos de categorias e produtos no SHA 274d72db6babbf2605d7fecc9946adb28fbd6593.

Nenhuma autenticação, carrinho, checkout, pedido, pagamento, Admin, mapa real, banco de produção ou ativação comercial foi iniciada.

## Estado atual verificado no GitHub

- Repositório: srdarllan-hash/hielya-app
- main: inalterada
- merge realizado: FALSE
- produção autorizada: FALSE

### PR #5 — Fundação técnica e API pública

- Branch: hielya/mvp-local-36-implementation
- Base: hielya/c002-location-gate2
- Estado: OPEN / DRAFT
- Mergeado: FALSE
- HEAD congelado: fe62966daca8bda94610aa1a63702a1e543b0ce6
- Commits: 29
- Arquivos alterados: 48
- Adições: 10.993
- Remoções: 1
- Escopo funcional encerrado: TRUE

### PR #6 — Home Catalog API Integration

- Branch: hielya/mvp-local-36-home-catalog-api-integration
- Base empilhada: hielya/mvp-local-36-implementation
- Base SHA: fe62966daca8bda94610aa1a63702a1e543b0ce6
- Estado: OPEN / DRAFT
- Mergeado: FALSE
- HEAD certificado: 274d72db6babbf2605d7fecc9946adb28fbd6593
- Commits: 4
- Arquivos alterados: 47
- Adições: 4.230
- Remoções: 109

## Gates certificados desde o checkpoint v2.6

### 1. Persistent Catalog Read Model and API Host Architecture

- SHA: f1a533a3e4bcf76ea5634979536e58445432bb11
- Workflow: 31030815931
- Resultado: SUCCESS
- Entregas: read model persistente, UUIDs estáveis, catálogo comercial completo, migration ledger e host HTTP Next.js em apps/ui-lab.

### 2. Public Service API Layer

- SHA: fb35d2fd3e9cd4eb64be0c1196e22cc2d55003e6
- Workflow: 31035091147
- Resultado: SUCCESS
- Endpoints certificados:
  - GET /api/v1/catalog/categories
  - GET /api/v1/catalog/products
  - GET /api/v1/catalog/products/{productId}
  - POST /api/v1/delivery/quote

### 3. Public Service API Hardening and Final Freeze

- SHA: fe62966daca8bda94610aa1a63702a1e543b0ce6
- Workflow: 31045750403
- Resultado: SUCCESS
- Testes: 127/127
- Mapeamentos públicos por whitelist explícita.
- Conformidade de respostas com OpenAPI validada.
- Campos internos expostos: 0
- Estoque numérico público: 0
- PR #5 fechado para crescimento funcional.

### 4. Home Catalog API Integration

- SHA: 274d72db6babbf2605d7fecc9946adb28fbd6593
- Workflow final: 31051388761
- Resultado: SUCCESS
- Testes: 160/160
- HTTP integration: SUCCESS
- Functional: SUCCESS
- Accessibility: SUCCESS
- Visual: SUCCESS
- Next build: SUCCESS
- Storybook build: SUCCESS
- Regressões C-001, C-002 e C-005: SUCCESS

## Entregas concluídas

- Home runtime consome HTTP público.
- Endpoints consumidos pela Home:
  - GET /api/v1/catalog/categories
  - GET /api/v1/catalog/products
- Busca conectada ao parâmetro q da API.
- Filtro de categoria conectado ao parâmetro category.
- Paginação preserva page, pageSize, total e items.
- Estados implementados:
  - HOME_CATALOG_LOADING
  - HOME_CATALOG_READY
  - HOME_CATALOG_EMPTY
  - HOME_CATALOG_ERROR
- Cancelamento de requisição e proteção contra respostas fora de ordem.
- DTOs HTTP e view models mapeados explicitamente.
- Fixtures sintéticas restritas a Storybook, testes e interceptação Playwright.
- home.data.ts removido do caminho runtime e mantido apenas como fixture histórica de apresentação.
- Baselines originais da C-005 preservadas.
- Evidência visual nova e versionada criada para a integração.

## Estado canônico do catálogo

- Registros totais persistidos: 66
- SKUs do MVP: 36
- Unitários no MVP: 30
- Composites: 6
- SKUs adiados: 30
- SKUs PAUSED: 36
- SKUs comercialmente ativos: 0
- Catálogo público canônico vazio: TRUE

Comportamento certificado:

canonical empty response
→ HOME_CATALOG_EMPTY

Não existe fallback sintético no runtime.

## Arquitetura atual

- Arquitetura: MODULAR_TYPESCRIPT_MONOLITH
- Runtime HTTP: NEXTJS / Node.js
- Host: apps/ui-lab
- Base pública: /api/v1
- Segunda aplicação: FALSE
- Microserviço: FALSE
- Banco de desenvolvimento/teste: SQLite via node:sqlite
- Banco de produção: NONE
- Produção: BLOCKED

Fronteiras preservadas:

- packages/application: casos de uso e portas, sem Next.js, React ou SQLite.
- packages/persistence: schema, migrations, read model e adapters, sem UI ou HTTP.
- packages/ui: apresentação e view models, sem persistência.
- apps/ui-lab: composição HTTP e cliente runtime da Home.

## Arquivos principais criados no PR #6

- .github/workflows/mvp-local-36-home-catalog-api-integration-gate.yml
- apps/ui-lab/src/client/mvp-local-36/HomeCatalogRuntime.tsx
- apps/ui-lab/src/client/mvp-local-36/catalog-client.ts
- apps/ui-lab/src/client/mvp-local-36/catalog-contracts.ts
- apps/ui-lab/src/client/mvp-local-36/home-catalog-mapper.ts
- manifests/C-005-HOME-CATALOG-API-INTEGRATION-V1.json
- manifests/C-005-HOME-CATALOG-API-INTEGRATION-V1-BASELINE-REVIEW.json
- scripts/validate-mvp-local-36-home-catalog-api-integration.mjs
- tests/integration/home-catalog-api-integration.*
- tests/unit/mvp-home-catalog-*.test.*
- tests/accessibility/home-catalog-api-integration.a11y.spec.ts
- tests/functional/home-catalog-api-integration.functional.spec.ts
- tests/visual/home-catalog-api-integration.visual.spec.ts
- 12 snapshots visuais isolados para loading, ready, empty e error em três viewports.

## Arquivos principais modificados no PR #6

- apps/ui-lab/app/page.tsx
- packages/ui/src/screens/home/HomeScreen.tsx
- packages/ui/src/screens/home/HomeScreen.stories.tsx
- packages/ui/src/screens/home/home.data.ts
- packages/ui/src/screens/home/home.types.ts
- packages/ui/src/components/CategoryChip.tsx
- packages/ui/src/components/ProductCard.tsx
- packages/ui/src/components/PackCard.tsx
- validadores históricos ajustados para reconhecer o escopo autorizado da branch filha sem alterar contratos canônicos.

## Arquivos removidos

Nenhum arquivo canônico foi removido.

## Itens não iniciados

- Tela pública de detalhe do produto.
- Consumo de GET /api/v1/catalog/products/{productId} pela interface.
- Integração C-002 com POST /api/v1/delivery/quote.
- C-003 Login.
- C-004 OTP.
- Autenticação e sessão.
- Carrinho persistente.
- Endereço autenticado e checkout.
- Validação de carrinho.
- Reserva com TTL de 10 minutos.
- Pedido provisório e pagamento simulado.
- PIN vinculado ao fluxo de entrega.
- Admin operacional mínimo.
- Providers reais.
- Deploy e produção.

## Próxima etapa planejada

Próximo Gate recomendado:

HIELYA_MVP_LOCAL_36_PRODUCT_DETAIL_PUBLIC_API_INTEGRATION_GATE

Base certificada:

274d72db6babbf2605d7fecc9946adb28fbd6593

Estratégia:

- Criar nova branch filha do PR #6.
- Criar novo PR empilhado sobre hielya/mvp-local-36-home-catalog-api-integration.
- Implementar a tela pública de detalhe.
- Consumir exclusivamente GET /api/v1/catalog/products/{productId}.
- Manter catálogo canônico vazio e usar dados sintéticos apenas em testes/Storybook.
- Não iniciar cotação, autenticação, carrinho ou checkout.

## Bloqueio operacional atual

O Work atingiu a cota de uso temporária da conta e será redefinido no sábado. Esse bloqueio é de capacidade da ferramenta, não do projeto.

- Projeto perdido: FALSE
- Código perdido: FALSE
- GitHub preservado: TRUE
- Próximo Gate tecnicamente preparado: TRUE
- Execução pelo Work disponível agora: FALSE

## Riscos e controles

- Não adicionar novos commits ao PR #5.
- Não adicionar outra camada funcional ao PR #6.
- Manter a cadeia de PRs empilhados.
- Não ativar SKUs para preencher telas.
- Não permitir dados sintéticos no runtime.
- Não expor estoque numérico.
- Não alterar OpenAPI V1.0 ou MVP Local 36 V1.1 sem Gate próprio.
- Não iniciar produção, pagamentos ou mapas reais.
- Validadores de Gates antigos não devem ser enfraquecidos; expansões de escopo precisam permanecer explícitas e auditáveis.

## Decision Log

- 2026-08-05: read model persistente e arquitetura do API host certificados.
- 2026-08-05: quatro endpoints públicos read-only certificados.
- 2026-08-05: API pública endurecida, respostas verificadas contra OpenAPI e PR #5 congelado definitivamente.
- 2026-08-05: branch filha e PR #6 criados sobre o SHA congelado do PR #5.
- 2026-08-05: Home conectada por HTTP apenas a categorias e produtos.
- 2026-08-05: detalhe do produto e cotação mantidos para Gates separados.
- 2026-08-06: política de checkpoints retomada por solicitação do proprietário.
- 2026-08-06: checkpoint diário reativado.

## Documentos e contratos canônicos

- HIELYA Master Package Work-Ready V1.1
- contracts/openapi/HIELYA_OPENAPI_V1_0.yaml
- contracts/openapi/HIELYA_OPENAPI_MVP_LOCAL_36_V1_1.yaml
- contracts/openapi/MVP_LOCAL_36_IMPLEMENTATION_PROFILE.json
- contracts/catalog/HIELYA_MVP_LOCAL_36_UNIT_COMMERCIAL_DATA_V1_1.json
- contracts/catalog/HIELYA_MVP_LOCAL_36_COMPOSITE_COMMERCIAL_DATA_V1_0.json
- docs/decisions/ADR-MVP-LOCAL-36-PUBLIC-SERVICE-API-FINAL-FREEZE.md
- manifests/C-005-HOME-CATALOG-API-INTEGRATION-V1.json
- PR #5 no SHA fe62966daca8bda94610aa1a63702a1e543b0ce6
- PR #6 no SHA 274d72db6babbf2605d7fecc9946adb28fbd6593

## Continuidade

Usar este checkpoint como contexto inicial e validar sempre contra o estado atual do GitHub antes de qualquer nova autorização.

Não executar o próximo Gate antes da renovação do Work ou da adição de créditos.

CHECKPOINT_STATUS = ACTIVE
DAILY_CHECKPOINT_AUTOMATION = ENABLED
NEXT_CHECKPOINT_VERSION = 2.8
.
