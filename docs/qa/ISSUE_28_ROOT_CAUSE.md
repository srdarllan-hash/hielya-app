# Issue #28 — causa raiz antes da correção
Data: 2026-09-07 UTC. Base: 54998abe407ca2694b3c35e1fd02f846f3e81eb3.
Autorização: pedido do proprietário para resolver os três grupos, preservando intenção, documentando baselines e sem novas telas.

## 1. Freeze: admissão histórica confundida com regressão de contrato
Os validadores usam GITHUB_ACTIONS=true como seletor implícito de escopo e calculam git diff desde abc9380c (persistência) / 4ca838d (OpenAPI). A main já contém integração de produto, entrega/pré-cotação, inventário (migration 0003), autenticação (0004 e HTTP V1.2), atualização de dependências, migração documental e contraste/CI. Esses deltas estão registrados nos checkpoints v2.8-v5.2 e nos commits integrados por PR19, PR22 e PR26; não pertencem à lista de admissão dos Gates antigos. Os contratos protegidos seguem passando em conteúdo; a exceção vem de validateScope, não de hash/schema/valores.
Decisão: não expandir allowlists nem alterar aplicação. Separar modo de regressão de conteúdo do modo de admissão histórica. O modo histórico permanece padrão e estrito; os testes de contrato chamam explicitamente modo de regressão, que mantém todas as asserções de conteúdo. Cobrir a separação com teste negativo para não permitir lista ampliada ou modo inválido. Escopo da mudança atual é verificado pelo diff do PR, sem alegar autorização histórica para arquivos novos.

## 2. Home: teste da composição antiga contra runtime novo
Commit 9e216a8612c20c71cc020a21fea8723bbc1daa0c substituiu Page(query state) por HomeCatalogRuntime e separou fixture histórica em Storybook. Gate Home/Catalog foi certificado em 274d72db6babbf2605d7fecc9946adb28fbd6593 (v2.7), depois integrado à main pelo PR19. A composição correta atual é HomeCatalogRuntime, sem ativação de produção.
Runtime possui quatro estados de catálogo: LOADING/READY/EMPTY/ERROR. Closed/high-demand/alcohol-cutoff/out-of-area/empty-cart continuam contratos de apresentação HomeScreen, não entradas públicas do runtime. Não introduzir query params de teste, estados de produto ou dados comerciais fictícios na aplicação.
Correção prevista: testes de rota usam API pública controlada e esperam estado real; preservar avisos, bloqueios, ações e acessibilidade da camada de apresentação através de suas stories existentes, sem fingir que são estados alcançáveis da rota atual. Baselines históricas ficam preservadas; referências de runtime usam as já revisadas no Gate de integração.
Flakiness ready/mobile-360: o teste aguardava data-screen-state=ready (default de HomeScreen mesmo durante loading) e consultava console antes da conclusão assíncrona das duas requisições. Sem fixture/DB, requisições reais retornavam 400; a coleta podia acontecer antes dos erros. Corrigir sincronização com respostas e data-home-catalog-state, fixtures HTTP explícitas e verificação de respostas inesperadas. Não ignorar erros de console indiscriminadamente.

## 3. C002: referência anterior à continuação sem quoteId
cdad195a2a15781e4afcaa0eedf32cc8249b61f2 alterou canContinueWithLocation para validar a pré-cotação sem quoteId. PR11/SHA01afcd foi ratificado pelo proprietário (v3.9); contém baselines revisadas de Continuar habilitado.
Os três PNGs actual do controle foram recuperados do artefato 10002082156/run34076030309 e são BYTE A BYTE idênticos às três referências já aprovadas em c002-prequote-continuation-contract.visual.spec.ts-snapshots:
- 360: 36da034f496fc13e0e2e5818503f87815463e22b1e69d40349681c2a9b46006f
- 390: c8d19011233c87beb572a3f2c3c95fb6a2a5911f715b755079ad84da7c710cc3
- hires: cf0481f0a18f229fd8712967b43b0f645b27583973a701f62c4b9b1025ae530c
Portanto não há fonte, timestamp ou rendering instável nessa divergência: a referência de alinhamento antecede a mudança legítima da regra de continuação.
Correção autorizada: copiar somente esses três PNGs já revisados para os nomes de sucesso do alinhamento; explicitar botão Continuar habilitado no teste. Nenhuma geração livre nem atualização das outras referências.

## Evidências
https://github.com/srdarllan-hash/hielya-app/actions/runs/34075950001
https://github.com/srdarllan-hash/hielya-app/actions/runs/34076030309
manifests/C-002-PREQUOTE-CONTINUATION-CONTRACT-V1-BASELINE-REVIEW.json
docs/checkpoints/2026-08/HIELYA_CHECKPOINT_2026-08-06_v2.7.md
docs/checkpoints/2026-09/HIELYA_CHECKPOINT_2026-09-04_v3.9.md
