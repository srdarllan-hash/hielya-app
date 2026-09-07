# HIELYA CHECKPOINT v5.2

Gate: DESIGN_SYSTEM_DIRECTION_FORMALIZATION — PR26_MERGE_AND_TECH_DEBT_RECORD
Data: 2026-09-07 (UTC)
Checkpoint anterior: HIELYA_CHECKPOINT_2026-09-04_v5.1.md, preservado no PR #24 ainda aberto/draft.
Último checkpoint integrado antes deste registro: v5.0. Esta diferença entre índice da main e registro pendente é explícita; nenhum histórico foi sobrescrito.

## Resumo executivo
PR #26 mergeado por autorização explícita do proprietário, após comparação controlada das falhas com a main sem o token. O CI permanece FAILURE; a decisão de merge aceita a dívida identificada, não certifica CI verde. Issue #28 criada para tratar essa dívida separadamente, prioridade sugerida alta.

## Estado GitHub
REPOSITORY = srdarllan-hash/hielya-app
GATE_ISSUE = #25
MERGED_PR = #26
SOURCE_BRANCH = hielya/design-system-direction-formalization
MERGED_HEAD = aca0ebaf3e409c4b90198d9dee8854135c0c9f50
PREVIOUS_MAIN = e4fc9d5b9675d2d20d7a71cf45ff6f4fb985c0f0
NEW_MAIN_SHA = 54998abe407ca2694b3c35e1fd02f846f3e81eb3
MERGE_METHOD = merge
TECH_DEBT_ISSUE = #28
DIAGNOSTIC_PR = #27 (sem merge)
CHECKPOINT_BRANCH = hielya/checkpoint-v5-2-pr26-merge
CHECKPOINT_STATUS = CREATED_IN_DOCUMENTATION_BRANCH_PENDING_PR_REVIEW

## Anotação do proprietário registrada antes do merge
Este PR não corrige nem piora as 56 falhas pré-existentes identificadas na main (2 validadores de freeze desatualizados, 51 falhas de C-005 por rota obsoleta em teste, 3 divergências visuais em C-002). Essas falhas foram isoladas e reproduzidas independentemente deste PR — ver runs 34075950001 e 34076030309.

Limite da evidência: controle comprovado nos dois SHAs acima; não é prova universal para todo commit possível. C-005 repetiu 51 falhas no controle e 50 no candidato, com uma passagem intermitente em ready/mobile-360/console; o CI original do candidato falhou nos 51 casos.

## Alterações integradas
- packages/design-tokens/src/tokens.json: novo dangerBackground #D83A3A.
- packages/design-tokens/src/tokens.css, tokens.ts, tokens-flat.csv: saídas geradas correspondentes.
- packages/ui/src/styles/actions.css: Button danger usa o novo fundo.
- .github/workflows/design-system-validation.yml: validação adicional em pull_request para main, sem filtro de branch de origem, com checkout completo, unidade/cobertura, lint, typecheck, Next/Storybook build e regressões Playwright.
Branco sobre novo fundo: 4.579:1 (AA normal). dangerFill #EF4444 e textos/bordas existentes preservados.
Opaque Session workflow preservado byte a byte: blob 56a27f45c9cf69bd0aefd32b0f99924d3ea49ee4.
Baselines em GATE_VALIDATION e updateSnapshots=none, sem gravação/atualização de referências.

## Validação e dívida
CI integral 34074969346: FAILURE.
- Instalação, tokens, lint, tipagem e Next build nos cinco jobs de navegador: PASS.
- Unidade: 304 PASS / 2 FAIL.
- Fundação: 306 PASS / 51 FAIL, todas as falhas nos testes antigos de C-005 (27 funcionais e 24 visuais).
- Cotação C-002: 46 PASS / 3 FAIL visuais.
- Produto: 45 PASS; catálogo/Home integrado: 48 PASS; pré-cotação: 12 PASS.
- Storybook: SKIPPED após falha de unidade; não certificado.
- Integridade dos testes/baselines: PASS nos cinco jobs.
Primeira execução 34074887208 encontrou checkout raso; corrigido somente no workflow com fetch-depth: 0.

Diagnóstico 34075950001:
- Dois validadores aplicam allowlists históricas desde abc9380c... e 4ca838d... à evolução posterior; ambos falham sem token.
- C-005 testa /?state=... contra HomeCatalogRuntime atual; falhas de estado, ações, console e baselines reproduzidas na main.
Diagnóstico isolado C-002 34076030309:
- Sucesso 2.5 km / €3.50 falha sem e com token nos três viewports.
- Pixels divergentes idênticos: 15019 / 16212 / 147589.
Não houve correção de aplicação, testes ou baselines durante diagnóstico.
Issue #28 detalha os três grupos e a lacuna dos workflows acoplados a branches/fontes históricas. Nenhuma correção da dívida iniciada.

## Decision Log e pendências
- Merge excepcional do PR26 autorizado com dívida explicitamente aceita; CI_FAILURE não renomeado para sucesso.
- Abrir dívida separada #28 com prioridade sugerida alta.
- Não promover design-tokens 1.2.0: permanece candidato.
- Issue #25 não declarada integralmente concluída: reconciliação documental code-first/CLAUDE e plano formal de promoção ainda precisam de fechamento verificável.
- Classificação Drive dos 15 assets foi registrada na etapa anterior; não houve nova alteração ou revalidação do Drive neste merge.
- PR #24/v5.1 e PR diagnóstico #27 não foram mergeados.
- Guardrail de não-sobrescrita de checkpoints continua pendente, não implementado.
- A política exige commit e PR para este checkpoint; seu merge documental não está incluído no merge já executado do PR26.

## Arquivos deste registro
Novo docs/checkpoints/2026-09/HIELYA_CHECKPOINT_2026-09-07_v5.2.md.
Índice docs/checkpoints/INDEX.md recebe a nova linha; checkpoints históricos preservados.
Próximo passo: revisar registro documental e decidir Gate de dívida técnica; não iniciar nova UI.

## Restrições
MAIN_CHANGED = TRUE (somente merge autorizado PR26 nesta operação)
PR26_MERGED = TRUE
CI_SUCCESS = FALSE
TOKENS_1_2_0_PROMOTED = FALSE
C003_STARTED = FALSE
C004_STARTED = FALSE
NEW_SCREEN_CREATED = FALSE
BASELINES_CHANGED = FALSE
PRODUCTION_ACTIVATED = FALSE
DEPLOYMENT_PERFORMED = FALSE

## Fontes
- https://github.com/srdarllan-hash/hielya-app/pull/26
- https://github.com/srdarllan-hash/hielya-app/issues/28
- https://github.com/srdarllan-hash/hielya-app/pull/27
- https://github.com/srdarllan-hash/hielya-app/pull/24
- https://github.com/srdarllan-hash/hielya-app/actions/runs/34074969346
- https://github.com/srdarllan-hash/hielya-app/actions/runs/34075950001
- https://github.com/srdarllan-hash/hielya-app/actions/runs/34076030309
