# HIELYA_CHECKPOINT_2026-09-07_v5.4

## Identificação e resumo executivo
Data/hora UTC: 2026-09-07T03:30:40.790461+00:00
Gate: ISSUE_28_RESOLUTION_MERGED_TO_MAIN.
Anterior: HIELYA_CHECKPOINT_2026-09-07_v5.3.md, integrado pelo PR #30.

PR #30 MERGED em 2026-09-07T03:24:38Z por autorização explícita do proprietário.
Main anterior: 54998abe407ca2694b3c35e1fd02f846f3e81eb3.
Nova main: 4d32cebcc7f68832940f6825177d5348d63f245a.
HEAD validado do PR: 938b4590d7cdb0bebfbf02176a8faec8715f8021.
Árvore de ambos: 3218db4049527e94151d0c8cfe988ab87ac13ac9 — equivalência exata.
Os pais do merge são a main anterior e o HEAD validado. Nenhum delta funcional adicional.

## Evidência e resolução formal
- PR: https://github.com/srdarllan-hash/hielya-app/pull/30
- Issue #28: CLOSED / COMPLETED, fechamento confirmado e comentário formal citando PR #30 e run 34079006607.
- CI: https://github.com/srdarllan-hash/hielya-app/actions/runs/34079006607 — SUCCESS no HEAD 938b4590d7cdb0bebfbf02176a8faec8715f8021.
- 312 testes de unidade e 523 de navegador = 835 PASS; zero falhas, nenhum flaky reportado. Sete jobs verdes, incluindo tokens, lint, typecheck, Next build e Storybook build.
- Não é uma execução nova no SHA do merge; a árvore idêntica vincula a nova main à evidência integral.

## Correções integradas
1. Dois validadores: modo de regressão de conteúdo separado da admissão histórica; hashes e allowlists estritos preservados.
2. C-005: interface real HomeCatalogRuntime e stories de apresentação; espera HTTP/estado elimina a corrida de console; intenção e controles preservados.
3. C-002: três referências refletem a continuação de pré-cotação ratificada no PR #11, com proveniência documentada.
Detalhes e arquivos no v5.3 e docs/qa/ISSUE_28_*.md. Nenhuma mudança em aplicação/tokens foi incluída no PR #30.

## Decisões, pendências e continuidade
A dívida da Issue #28 está resolvida. O bloqueador de regressão para a promoção 1.2.0 foi removido; esse merge não promove tokens automaticamente.
A autorização posterior DESIGN_TOKENS_1.2.0_PROMOTION é registrada na Issue #31 e será tratada na branch hielya/design-tokens-1-2-0-promotion. O próximo checkpoint documentará o resultado desse gate.
Este registro pós-merge e INDEX seguem commit → PR documental, aguardando merge separado. PRs documentais #24/v5.1 e #29/v5.2 não foram mergeados por esta operação. Guardrail de não-sobrescrita continua pendente, sem implementação.

MAIN_CHANGED = TRUE
ISSUE_28_COMPLETED = TRUE
PR_30_MERGED = TRUE
TOKENS_PROMOTED_BY_PR_30 = FALSE
C003_STARTED = FALSE
C004_STARTED = FALSE
NEW_SCREEN_CREATED = FALSE
PRODUCTION_ACTIVATED = FALSE
DEPLOYMENT_PERFORMED = FALSE
HISTORICAL_CHECKPOINT_OVERWRITTEN = FALSE
