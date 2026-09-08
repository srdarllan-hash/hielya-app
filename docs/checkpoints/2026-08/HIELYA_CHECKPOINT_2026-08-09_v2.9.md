# HIELYA CHECKPOINT OFICIAL

Versão: 2.9
Data e hora: ago. 9, 2026 01:29 Europe/Dublin
Tipo: Estrutural, integração C-002 e certificação de Gate
Checkpoint anterior: [HIELYA_CHECKPOINT_2026-08-06_v2.8.md](https://docs.google.com/document/d/1EFw-PR8mdj15YieZ5qVBniRI9cz0LFrDjlpvhGr7jcs/edit)

## 1. Resumo executivo

Desde o checkpoint v2.8, o runtime público de C-002 foi alinhado ao endpoint certificado POST /api/v1/delivery/quote.

O PR #9 remove FakeServiceAreaService do caminho runtime público de verificação de área e tarifa. Latitude e longitude são enviadas ao servidor; distância, elegibilidade e taxa são recebidas da API. A tarifa de 2,5 km é 350 cents e distâncias acima de 4 km resultam em OUT_OF_AREA.

O Gate foi certificado no SHA final 60d556e5ae088f2bf98101dcf37cbf854bcc2eff pelo workflow 31282029488, com 8 de 8 jobs concluídos com sucesso.

A cadeia certificada permanece empilhada:

PR #5 — fundação técnica e API pública
→ PR #6 — Home Catalog API Integration
→ PR #7 — Product Detail Public API Integration
→ PR #9 — C-002 Delivery Quote API Alignment

Nenhum PR foi mergeado e main permanece inalterada.

## 2. Unidade concluída nesta execução

UNIT_COMPLETED = UPDATE_EXISTING_HIELYA_CHECKPOINT_WITH_PR_9_CERTIFICATION
PROJECT_REPOSITORY_CHANGED_BY_CHECKPOINT_UNIT = FALSE
CHECKPOINT_SEQUENCE_PRESERVED = TRUE
PREVIOUS_CHECKPOINT_OVERWRITTEN = FALSE
NEW_FUNCTIONAL_LAYER_STARTED = FALSE

Esta execução criou somente este novo documento na sequência oficial de checkpoints. Não alterou arquivos do repositório, Issue, branch, commit, PR, CI, main, produção ou evidências certificadas.

## 3. Estado atual verificado

Repositório: srdarllan-hash/hielya-app

### main

- SHA: 91e603d94cc0c5499d96eeca7954a19c4e3a2811
- Alterada pelos Gates atuais: FALSE
- Merge realizado: FALSE

### PR #5 — Fundação técnica e API pública

- Branch: hielya/mvp-local-36-implementation
- HEAD certificado: fe62966daca8bda94610aa1a63702a1e543b0ce6
- Estado: OPEN / DRAFT
- Mergeado: FALSE
- Escopo funcional encerrado: TRUE

### PR #6 — Home Catalog API Integration

- Branch: hielya/mvp-local-36-home-catalog-api-integration
- HEAD certificado: 274d72db6babbf2605d7fecc9946adb28fbd6593
- Estado: OPEN / DRAFT
- Mergeado: FALSE

### PR #7 — Product Detail Public API Integration

- Branch: hielya/mvp-local-36-product-detail-api-integration
- HEAD certificado: 1470e294404084119308812b049d94601926ce55
- Estado: OPEN / DRAFT
- Mergeado: FALSE

### Issue #8 — C-002 Delivery Quote API Alignment

- URL: https://github.com/srdarllan-hash/hielya-app/issues/8
- Estado: OPEN
- Change-set autorizado e registrado: TRUE

### PR #9 — C-002 Delivery Quote API Alignment

- URL: https://github.com/srdarllan-hash/hielya-app/pull/9
- Título: feat(location): align C-002 with certified delivery quote API
- Branch: hielya/mvp-local-36-c002-delivery-quote-api-alignment
- Base: hielya/mvp-local-36-product-detail-api-integration
- Base SHA: 1470e294404084119308812b049d94601926ce55
- Candidate SHA: 412e47f802a49a39f11fb4758c6e292e2223f347
- HEAD final certificado: 60d556e5ae088f2bf98101dcf37cbf854bcc2eff
- Cadeia: exatamente 2 commits sobre a base certificada
- Estado: OPEN / DRAFT
- Mergeado: FALSE
- Mergeable: TRUE

## 4. Delta concluído e certificado

### Runtime público de C-002

- /location sem driver explícito usa integração HTTP.
- POST /api/v1/delivery/quote é a única fonte runtime da distância, elegibilidade e tarifa.
- O cliente envia somente latitude e longitude.
- O cliente não envia nem calcula distância, taxa, raio ou elegibilidade.
- 2,5 km resulta em 350 cents.
- Acima de 4 km resulta em OUT_OF_AREA.
- FakeServiceAreaService permanece somente no caminho explícito driver=fake para testes, Storybook, regressões e demonstrações.
- Não existe fallback fake no runtime público.
- Correlation ID é diagnóstico; não é quote ID.
- A API não fornece quoteId; o valor interno permanece null e a continuação fica desabilitada neste Gate.

### Contrato interno e cancelamento

- ServiceAreaResult.radiusMeters aceita number | null.
- AbortSignal é propagado às portas assíncronas.
- Cancelamento e timeout são tratados sem persistência tardia.
- Falhas seguras de cotação mapeiam para network_error com retry.
- Timeout mapeia para timeout.
- OUT_OF_AREA mapeia para out_of_area.
- Sucesso preserva a localização confirmada em SessionLocationRepository.
- Falhas não persistem localização confirmada.

### Estados visuais certificados

- checking_service_area
- success_2_5km_350c
- out_of_area
- network_error
- timeout

Cada estado possui evidência em 360×800, 390×844 e 1170×2532, totalizando 15 PNGs revisados.

## 5. Arquivos e áreas alterados pelo Gate

### Runtime e domínio

- apps/ui-lab/app/location/page.tsx
- apps/ui-lab/src/client/mvp-local-36/LocationRuntime.tsx
- apps/ui-lab/src/client/mvp-local-36/delivery-quote-client.ts
- apps/ui-lab/src/client/mvp-local-36/delivery-quote-service-area-adapter.ts
- packages/location/src/domain/location.machine.ts
- packages/location/src/domain/location.types.ts
- packages/location/src/factory.ts
- packages/ui/src/screens/location/LocationScreen.tsx
- packages/ui/src/screens/location/location.types.ts

### Testes

- tests/unit/location.adapters.test.ts
- tests/unit/location.machine.test.ts
- tests/unit/mvp-location-delivery-quote-client.test.ts
- tests/unit/mvp-location-delivery-quote-runtime.test.tsx
- tests/accessibility/c002-delivery-quote-api-alignment.a11y.spec.ts
- tests/functional/c002-delivery-quote-api-alignment.functional.spec.ts
- tests/visual/c002-delivery-quote-api-alignment.visual.spec.ts
- tests/integration/c002-delivery-quote-api-alignment.*

### Gate, manifesto e evidência

- .github/workflows/mvp-local-36-c002-delivery-quote-api-alignment-gate.yml
- manifests/C-002-DELIVERY-QUOTE-API-ALIGNMENT-V1.json
- manifests/C-002-DELIVERY-QUOTE-API-ALIGNMENT-V1-BASELINE-REVIEW.json
- playwright.c002-delivery-quote-api-alignment.config.ts
- scripts/generate-c002-delivery-quote-api-alignment-evidence.mjs
- scripts/mvp-local-36-c002-delivery-quote-api-alignment-changed-files.mjs
- scripts/validate-c002-delivery-quote-api-alignment-baseline-artifact.mjs
- scripts/validate-mvp-local-36-c002-delivery-quote-api-alignment.mjs
- 15 snapshots em tests/visual/c002-delivery-quote-api-alignment.visual.spec.ts-snapshots/

Nenhum arquivo canônico anterior foi removido ou reescrito retroativamente.

## 6. Testes, validações e evidências

### Execução final

- Workflow run: 31282029488
- URL: https://github.com/srdarllan-hash/hielya-app/actions/runs/31282029488
- Resultado: SUCCESS
- Jobs: 8/8 SUCCESS
- Gate summary: SUCCESS

Jobs verdes:

- alignment-validation
- C-001 regression
- C-002 frozen regression
- C-005 frozen regression
- Home Catalog integration regression
- Product Detail integration regression
- C-002 delivery quote alignment Gate
- Gate summary

### Resultados certificados

- Unit tests: 229/229 PASS
- Testes direcionados do núcleo: 44/44 PASS
- Typecheck: PASS
- Lint: PASS, 0 erros e 6 warnings preexistentes
- Next build: PASS
- Storybook build: PASS
- HTTP integration: PASS
- C-002 funcional: PASS
- C-002 Axe: PASS
- Console e page errors: PASS
- Visual estrito: 15/15 PASS
- Regressões C-001, C-002 congelada, C-005, Home e Product Detail: PASS

Estes resultados são evidências do Gate certificado e não foram reexecutados durante a unidade documental deste checkpoint.

### Proveniência visual

- Candidate run: 31281592363
- Candidate artifact ID: 9028625854
- Candidate artifact digest: sha256:88358dc17e46f90d031a775fd4e1dfcf99164877b78c8aa370b7437ba6cfe536
- Final artifact ID: 9028745749
- Final artifact digest: sha256:56e7e0d24c9b7c4a35e05fb9d0e6fdb1b9368d086182d513b939b5be8ec42437
- Baselines revisadas: 15
- Banco canônico mutado pelos testes públicos: FALSE
- SKUs comercialmente ativados: 0

## 7. Decisões preservadas

- OpenAPI permanece inalterado.
- O endpoint público certificado permanece a fonte de verdade.
- Nenhum provider real de mapas ou roteamento foi criado.
- Nenhuma tarifa ou distância operacional foi hardcoded no cliente.
- Fake de service area permanece apenas em modo explícito.
- Reverse geocoding, busca e validação de endereço continuam sintéticos porque providers reais estavam fora do escopo.
- A ausência de quoteId não foi ocultada nem preenchida com correlationId.
- Continue permanece desabilitado até um Gate futuro com contrato próprio.
- Nenhuma dependência nova foi adicionada.
- Nenhuma ativação comercial foi realizada.
- Produção permanece bloqueada.

## 8. Itens expressamente não iniciados

- C-003 e C-004
- autenticação e sessão autenticada
- carrinho e checkout
- reservas e lifecycle de estoque
- pedidos e pagamentos
- PIN operacional
- Admin
- provider real de mapas ou roteamento
- banco de produção
- deploy
- merge
- próxima camada funcional

## 9. Riscos e pendências

- O runtime de cotação permanece adequado somente a desenvolvimento e testes: sem provider real, o servidor usa distância simulada explicitamente configurada ou retorna CONFIGURATION_UNAVAILABLE.
- Reverse geocoding, busca e validação de endereço ainda usam doubles no caminho público; sua substituição exige Gate próprio.
- A API não fornece quoteId. A continuação do fluxo deve permanecer bloqueada até decisão contratual e Gate específicos.
- PR #9 está certificado, mas permanece OPEN / DRAFT e não foi mergeado.
- Nenhuma próxima camada pode partir de suposição; requer change-set explícito sobre o SHA final certificado.

## 10. Próximo passo exato

EXACT_NEXT_STEP = Autorizar um único novo change-set filho a partir do SHA 60d556e5ae088f2bf98101dcf37cbf854bcc2eff.
RECOMMENDED_COMMAND = AUTORIZO_PLANEJAR_PROXIMO_CHANGESET_HIELYA_MVP_LOCAL_36_BASE_60d556e5ae088f2bf98101dcf37cbf854bcc2eff
NEXT_LAYER_STARTED = FALSE

Nenhuma implementação funcional adicional deve começar antes dessa autorização.

## 11. Modelo e esforço recomendados

RECOMMENDED_MODEL = GPT-5.6 Terra
RECOMMENDED_EFFORT = Médio

Terra + Médio é suficiente para um próximo change-set rotineiro e delimitado. Solicitar Sol antes de iniciar apenas se o escopo autorizado envolver autenticação, pagamentos, migrations ou dados críticos, estoque/reservas, concorrência, atomicidade ou idempotência.

## 12. Estado formal consolidado

CHECKPOINT_STATUS = ACTIVE
CHECKPOINT_VERSION = 2.9
PREVIOUS_CHECKPOINT = 2.8
CURRENT_OPERATIONAL_CONTEXT = PR_9_C002_DELIVERY_QUOTE_API_ALIGNMENT_CERTIFIED
CURRENT_CERTIFIED_GATE = C002_DELIVERY_QUOTE_API_ALIGNMENT_GATE_CERTIFIED
CURRENT_HEAD_SHA = 60d556e5ae088f2bf98101dcf37cbf854bcc2eff
PR_5 = OPEN_DRAFT_FROZEN
PR_6 = OPEN_DRAFT_CERTIFIED
PR_7 = OPEN_DRAFT_CERTIFIED
PR_9 = OPEN_DRAFT_CERTIFIED
MAIN_SHA = 91e603d94cc0c5499d96eeca7954a19c4e3a2811
MAIN_CHANGED = FALSE
MERGE_PERFORMED = FALSE
PRODUCTION_AUTHORIZED = FALSE
COMMERCIAL_SKUS_ACTIVATED = 0
PUBLIC_CANONICAL_CATALOG_EMPTY = TRUE
NEXT_FUNCTIONAL_LAYER_STARTED = FALSE
NEXT_RECOMMENDED_BASE_SHA = 60d556e5ae088f2bf98101dcf37cbf854bcc2eff
NEXT_CHECKPOINT_VERSION = 3.0
