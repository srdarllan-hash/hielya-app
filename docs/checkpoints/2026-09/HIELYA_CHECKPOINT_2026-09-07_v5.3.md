# HIELYA_CHECKPOINT_2026-09-07_v5.3

## Identificação e resumo executivo
- Data/hora: 2026-09-07T03:14:27Z UTC.
- Gate: ISSUE_28_PREEXISTING_REGRESSION_REPAIR.
- Issue: [#28](https://github.com/srdarllan-hash/hielya-app/issues/28).
- PR: [#30](https://github.com/srdarllan-hash/hielya-app/pull/30), OPEN / DRAFT / NOT MERGED.
- Branch: `hielya/fix-tech-debt-issue-28`.
- Main/base confirmada: `54998abe407ca2694b3c35e1fd02f846f3e81eb3`, inalterada.
- HEAD de implementação validado: `57559e3ecfbd431e0218ba474b52774935ead36c`.
- Workflow integral: [34078600764](https://github.com/srdarllan-hash/hielya-app/actions/runs/34078600764), SUCCESS.
- Estado: correção da dívida de regressão implementada na branch; revisão e merge dependem do proprietário. Não representa promoção do Design System ou autorização de produção.

As 56 falhas herdadas da main foram tratadas por causa raiz, preservando contratos congelados e intenção dos testes. Não há delta em aplicação, componentes, tokens, contratos comerciais ou autenticação. Não houve instalação ou teste local: resultados de execução vêm do GitHub Actions.

## Continuidade e divergência documental
Checkpoint anterior mais recente: [v5.2, commit 936bd786](https://github.com/srdarllan-hash/hielya-app/blob/936bd786323afa4bed743b4efaf999ec662bdac2/docs/checkpoints/2026-09/HIELYA_CHECKPOINT_2026-09-07_v5.2.md), ainda no PR #29 OPEN / DRAFT. O v5.1 permanece no PR #24 OPEN / DRAFT. A main contém até v5.0; não se presume que esses PRs documentais tenham sido mergeados. Nenhum checkpoint anterior foi alterado ou copiado sobre outro arquivo. Este v5.3 nasce no PR #30 e só integrará main após aprovação.

## Grupo 1 — validadores históricos
Causa: `validateScope` comparava o delta acumulado desde abc9380c / 4ca838d com admissão de Gates antigos. Ambos rejeitavam os mesmos 170 caminhos já integrados depois: Product Detail, entrega/pré-cotação, inventário/migration 0003, auth/migration 0004 e HTTP V1.2, dependências, documentação e contraste/CI. A falha não vinha de hash, schema, preço ou política comercial. O perfil V1.1 congelado descreve seu próprio estágio histórico; não deve ser reescrito para simular o estágio posterior V1.2.
Correção: modo explícito `--scope=regression` nos dois testes de contrato, preservando todas as verificações de conteúdo. Modo histórico continua padrão e estrito, com as mesmas bases e allowlists. Seis casos negativos adicionais exercitam rejeição histórica, argumentos inválidos e artefato congelado adulterado em regressão. Não foi ampliada nenhuma lista permitida.
Evidência detalhada: [170 caminhos e commits](../../qa/ISSUE_28_HISTORICAL_SCOPE_DIFF.md).

## Grupo 2 — C-005 e instabilidade ready/mobile-360
Causa: desde 9e216a8, certificado em 274d72db (v2.7) e integrado via PR #19, a rota é HomeCatalogRuntime, sem o antigo `/?state=...`. Main é implementação certificada; produção permanece bloqueada.
O runtime oferece LOADING/READY/EMPTY/ERROR de catálogo. Estados operacionais closed/high-demand/alcohol-cutoff/out-of-area/empty-cart pertencem à apresentação HomeScreen e às stories existentes.
Correção: testes de rota usam HTTP controlado e estado real do catálogo; testes de apresentação usam suas stories existentes. Todas as oito variantes históricas, as quatro ações tipadas originais, acessibilidade e intenção visual são mantidas. As suites existentes de integração continuam cobrindo busca, filtros, retry, respostas fora de ordem e contrato público.
Instabilidade: `data-screen-state=ready` era o default da apresentação, inclusive antes do término da carga. O teste podia consultar console antes das respostas HTTP 400 reais. Agora a fixture e a espera por conclusão das respostas/estado final são explícitas; não se ignora console para fazer READY passar.
A adaptação do harness também revelou concorrência Axe addon/Playwright e cancelamento do request irmão após payload inválido. Corrigidos por global manual somente na URL do harness (Axe Playwright obrigatório e tags WCAG preservadas) e ordenação explícita da fixture inválida. O seletor dos estados bloqueados foi alinhado ao nome acessível já existente, mantendo `toBeDisabled`.
Referências: os 24 PNGs antigos de C-005 continuam intactos. O namespace C-005-PRESENTATION-CATALOG-V1 usa 21 actual inspecionados e três referências loading inalteradas. As diferenças refletem o commit certificado 9e216a8: busca, título Productos, dados de disponibilidade/idade e mensagem de erro. Não há design novo.
Evidência: [mapa de cobertura e causas do harness](../../qa/ISSUE_28_COVERAGE_MAP.md).

## Grupo 3 — visual C-002
Causa: referências de sucesso ainda mostravam Continuar desabilitado, anteriores à continuação de pré-cotação sem quoteId (cdad195 / PR #11, ratificado no v3.9).
Os três actual do controle 34076030309 são byte a byte iguais às referências revisadas de pré-cotação já existentes. Não era fonte, timestamp, cálculo instável ou token danger.
Correção: somente os três PNGs de sucesso do alinhamento reutilizam essas referências; o teste exige Continuar habilitado.
SHA256 das referências reutilizadas:
- mobile-360: `36da034f496fc13e0e2e5818503f87815463e22b1e69d40349681c2a9b46006f`.
- mobile-390: `c8d19011233c87beb572a3f2c3c95fb6a2a5911f715b755079ad84da7c710cc3`.
- hires-1170: `cf0481f0a18f229fd8712967b43b0f645b27583973a701f62c4b9b1025ae530c`.

## Resultado integral e evidências
| Suite | Resultado |
|---|---|
| Unidade + cobertura (36 arquivos) | 312 PASS |
| Foundation — C-001/C-002/C-005 | 369 PASS |
| C-002 delivery quote alignment | 49 PASS |
| C-002 prequote continuation | 12 PASS |
| Home Catalog API integration | 48 PASS |
| Product Detail API integration | 45 PASS |
| Total de testes | 835 PASS / 0 FAIL; sem testes reportados como flaky |
| Tokens, lint, typecheck, Next build, Storybook build | PASS |
| Resumo obrigatório de validação | SUCCESS |
Comandos: instalação frozen-lockfile; tokens:check; lint; type-check; test:coverage; build; build-storybook; Playwright nas cinco suites. Todos os 21 arquivos Playwright são contemplados na matriz. CI usa GATE_VALIDATION e --update-snapshots=none, e verifica que não gravou testes/baselines.

Runs de isolamento herdados: [34075950001](https://github.com/srdarllan-hash/hielya-app/actions/runs/34075950001) e [34076030309](https://github.com/srdarllan-hash/hielya-app/actions/runs/34076030309).
Execuções intermediárias desta correção: 34077414469 (334 pass / 35 fail em foundation; causas do harness registradas) e 34078119535 (363 pass / 6 fail em foundation; seletor bloqueado incorreto). As falhas foram diagnosticadas e corrigidas; não houve repetição cega para obter verde.
Manifest de proveniência: [ISSUE-28-REGRESSION-REFERENCE-ALIGNMENT.json](../../../manifests/ISSUE-28-REGRESSION-REFERENCE-ALIGNMENT.json). Registra caminhos, hashes, commits certificados e artefato 10002664497 do run 34077414469.

## Decision Log e ordem de execução
1. ec5eb878: causas raiz registradas antes de corrigir os três grupos.
2. 3836b911: separação admissão/regressão, mecanismo runtime/stories e C-002.
3. 0529e2b8: causas adicionais do harness documentadas antes das correções seguintes.
4. 55e4e195: sincronização do harness, referências com proveniência e inventário dos 170 caminhos.
5. 57559e3e: seletor do nome acessível bloqueado corrigido após diagnóstico.
6. Este novo checkpoint e atualização do INDEX registram a validação, sem reescrever checkpoints históricos.

## Arquivos e escopo
```text
M	.github/workflows/design-system-validation.yml
A	docs/qa/ISSUE_28_COVERAGE_MAP.md
A	docs/qa/ISSUE_28_HISTORICAL_SCOPE_DIFF.md
A	docs/qa/ISSUE_28_ROOT_CAUSE.md
A	manifests/ISSUE-28-REGRESSION-REFERENCE-ALIGNMENT.json
M	playwright.config.ts
A	scripts/historical-validator-mode.mjs
M	scripts/validate-mvp-local-36-composite-commercial-data.mjs
M	scripts/validate-mvp-local-36-openapi.mjs
M	tests/accessibility/home.a11y.spec.ts
M	tests/functional/home.functional.spec.ts
A	tests/integration/home-presentation.fixtures.ts
A	tests/unit/historical-validator-mode.test.ts
M	tests/unit/mvp-local-36-composite-commercial-data.test.ts
M	tests/unit/mvp-local-36-openapi.test.ts
M	tests/visual/c002-delivery-quote-api-alignment.visual.spec.ts
M	tests/visual/c002-delivery-quote-api-alignment.visual.spec.ts-snapshots/C-002-DELIVERY-QUOTE-API-ALIGNMENT-V1-success-2-5km-350c-hires-1170-linux.png
M	tests/visual/c002-delivery-quote-api-alignment.visual.spec.ts-snapshots/C-002-DELIVERY-QUOTE-API-ALIGNMENT-V1-success-2-5km-350c-mobile-360-linux.png
M	tests/visual/c002-delivery-quote-api-alignment.visual.spec.ts-snapshots/C-002-DELIVERY-QUOTE-API-ALIGNMENT-V1-success-2-5km-350c-mobile-390-linux.png
M	tests/visual/home.visual.spec.ts
A	tests/visual/home.visual.spec.ts-snapshots/C-005-PRESENTATION-CATALOG-V1-alcohol-cutoff-hires-1170-linux.png
A	tests/visual/home.visual.spec.ts-snapshots/C-005-PRESENTATION-CATALOG-V1-alcohol-cutoff-mobile-360-linux.png
A	tests/visual/home.visual.spec.ts-snapshots/C-005-PRESENTATION-CATALOG-V1-alcohol-cutoff-mobile-390-linux.png
A	tests/visual/home.visual.spec.ts-snapshots/C-005-PRESENTATION-CATALOG-V1-closed-hires-1170-linux.png
A	tests/visual/home.visual.spec.ts-snapshots/C-005-PRESENTATION-CATALOG-V1-closed-mobile-360-linux.png
A	tests/visual/home.visual.spec.ts-snapshots/C-005-PRESENTATION-CATALOG-V1-closed-mobile-390-linux.png
A	tests/visual/home.visual.spec.ts-snapshots/C-005-PRESENTATION-CATALOG-V1-empty-cart-hires-1170-linux.png
A	tests/visual/home.visual.spec.ts-snapshots/C-005-PRESENTATION-CATALOG-V1-empty-cart-mobile-360-linux.png
A	tests/visual/home.visual.spec.ts-snapshots/C-005-PRESENTATION-CATALOG-V1-empty-cart-mobile-390-linux.png
A	tests/visual/home.visual.spec.ts-snapshots/C-005-PRESENTATION-CATALOG-V1-error-hires-1170-linux.png
A	tests/visual/home.visual.spec.ts-snapshots/C-005-PRESENTATION-CATALOG-V1-error-mobile-360-linux.png
A	tests/visual/home.visual.spec.ts-snapshots/C-005-PRESENTATION-CATALOG-V1-error-mobile-390-linux.png
A	tests/visual/home.visual.spec.ts-snapshots/C-005-PRESENTATION-CATALOG-V1-high-demand-hires-1170-linux.png
A	tests/visual/home.visual.spec.ts-snapshots/C-005-PRESENTATION-CATALOG-V1-high-demand-mobile-360-linux.png
A	tests/visual/home.visual.spec.ts-snapshots/C-005-PRESENTATION-CATALOG-V1-high-demand-mobile-390-linux.png
A	tests/visual/home.visual.spec.ts-snapshots/C-005-PRESENTATION-CATALOG-V1-loading-hires-1170-linux.png
A	tests/visual/home.visual.spec.ts-snapshots/C-005-PRESENTATION-CATALOG-V1-loading-mobile-360-linux.png
A	tests/visual/home.visual.spec.ts-snapshots/C-005-PRESENTATION-CATALOG-V1-loading-mobile-390-linux.png
A	tests/visual/home.visual.spec.ts-snapshots/C-005-PRESENTATION-CATALOG-V1-out-of-area-hires-1170-linux.png
A	tests/visual/home.visual.spec.ts-snapshots/C-005-PRESENTATION-CATALOG-V1-out-of-area-mobile-360-linux.png
A	tests/visual/home.visual.spec.ts-snapshots/C-005-PRESENTATION-CATALOG-V1-out-of-area-mobile-390-linux.png
A	tests/visual/home.visual.spec.ts-snapshots/C-005-PRESENTATION-CATALOG-V1-ready-hires-1170-linux.png
A	tests/visual/home.visual.spec.ts-snapshots/C-005-PRESENTATION-CATALOG-V1-ready-mobile-360-linux.png
A	tests/visual/home.visual.spec.ts-snapshots/C-005-PRESENTATION-CATALOG-V1-ready-mobile-390-linux.png
A docs/checkpoints/2026-09/HIELYA_CHECKPOINT_2026-09-07_v5.3.md
M docs/checkpoints/INDEX.md
```
Nenhum arquivo removido. `docs/qa/ISSUE_28_HISTORICAL_SCOPE_DIFF.md` recebe apenas normalização de EOF no commit documental de fechamento.
O SHA de implementação acima é anterior ao commit deste checkpoint; o HEAD documental é identificável pelo histórico do PR. A descrição do PR registra o resultado da revalidação automática do HEAD documental sem reescrever este checkpoint.

## Pendências, riscos e próximo passo
- Aguardar revisão e autorização explícita de merge do PR #30. Issue #28 permanece aberta até o merge.
- PRs documentais #24/v5.1 e #29/v5.2 continuam pendentes, sem alteração nesta tarefa.
- Guardrail de não-sobrescrita de checkpoints permanece pendência separada, não implementada.
- Admissão histórica continua rejeitando deltas fora do escopo dos Gates antigos quando invocada como admissão; regressão de conteúdo não autoriza novos Gates.
- Snapshots das stories usam fixtures históricas de apresentação, nunca fallback ou dados operacionais de produção.
- Nenhuma afirmação de correção de dívidas fora dos três grupos investigados.

MAIN_CHANGED = FALSE
MERGE_PERFORMED = FALSE
ISSUE_CLOSED = FALSE
APPLICATION_CODE_CHANGED = FALSE
OPAQUE_SESSION_WORKFLOW_CHANGED = FALSE
TOKENS_1_2_PROMOTED = FALSE
C003_STARTED = FALSE
C004_STARTED = FALSE
NEW_SCREEN_CREATED = FALSE
PRODUCTION_ACTIVATED = FALSE
DEPLOYMENT_PERFORMED = FALSE
HISTORICAL_CHECKPOINT_OVERWRITTEN = FALSE
