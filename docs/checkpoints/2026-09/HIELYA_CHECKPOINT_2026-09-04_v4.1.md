# HIELYA CHECKPOINT — 2026-09-04 v4.1

Estado: checkpoint oficial de encerramento das Tarefas 3 e 4, subsequente ao v4.0. Nenhum checkpoint anterior foi sobrescrito.

# 1. Resumo executivo

A divergência de governança do PR #11 permanece resolvida pela ratificação retroativa registrada no v3.9. O bump de segurança foi concluído e certificado no v4.0. O PR #17 foi revalidado integralmente, saiu de draft e está pronto para revisão/merge, mas não foi mergeado. O registro canônico de assets visuais foi criado e verificado no Google Drive. Nenhuma nova tela de UI foi criada e C-003/C-004 não foram iniciadas.

# 2. Referências e cadeia certificada

Repositório: srdarllan-hash/hielya-app
Branch: hielya/mvp-local-36-auth-http-opaque-session
PR #17: OPEN / READY FOR REVIEW / NOT MERGED
HEAD certificado: 81cb538f5d78b5d73196919d43086b2cee5dcd67
Checkpoint anterior: HIELYA_CHECKPOINT_2026-09-04_v4.0.md

# 3. Resolução de governança — Issue #10 / PR #11

Decisão: Opção 1 — ratificação retroativa.
PR ratificado: #11
SHA ratificado: 01afcd0891b2b1da6c5bb595b9387300e3a4366f
Efeito: autorizado a partir da decisão registrada em 2026-09-04.
Registro formal: comentário da Issue #10 ID 5533792514 e comentário do PR #11 ID 5533792416.
Histórico: não reescrito; nenhum commit revertido; cadeia preservada.
Gate revalidado: workflow 31324035748, tentativa 2, SHA exato, 8/8 jobs concluídos com sucesso.

Causa raiz: a implementação e o Gate do PR #11 avançaram com base em uma autorização operacional inferida da sequência Issue → branch → implementação → testes → PR, mas a Issue #10 não continha, antes da execução, o ato formal e inequívoco que autorizava o escopo efetivamente entregue. A ausência de um bloqueio automatizado permitiu que o Gate rodasse antes dessa formalização. A decisão atual corrige a lacuna de autorização sem alterar o histórico técnico.

Guardrail recomendado, não implementado: adicionar uma validação obrigatória de CI que leia os campos de autorização da Issue vinculada e impeça a execução do Gate enquanto a autorização formal, o escopo e a referência do Gate não estiverem presentes e válidos.

# 4. Segurança — React e Next.js

React: 19.2.8
React DOM: 19.2.8
Next.js: 16.3.3
eslint-config-next: 16.3.3
Commit de dependências: 35dcd5f3e04f308af3e122466eebdf772100b656
Commit corretivo/regressão: 81cb538f5d78b5d73196919d43086b2cee5dcd67

Resultado: houve uma regressão detectada após o bump no fluxo C-002 em desenvolvimento/React Strict Mode. A limpeza do efeito chamava controller.cancel(), marcava o controller como descartado e a remontagem de efeito do Strict Mode passava a ignorar novos dispatches. A correção adicionou resume() na montagem e um teste de regressão sob React.StrictMode.

Validações locais: 306/306 testes verdes; typecheck, build e validadores verdes; lint com 0 erros e 8 avisos (6 preexistentes e 2 avisos de navegação do Next.js).
CI remoto certificado: workflow 33824314892, tentativa 1, sucesso em todos os cinco jobs.

# 5. PR #17 — preparação para merge

Suíte completa final: workflow 33824314892, tentativa 2, no HEAD 81cb538f5d78b5d73196919d43086b2cee5dcd67.
Jobs: auth-http-contract-validation; frozen-and-integration-regressions; c002-delivery-quote-alignment-frozen-regression; c005-frozen-regression / validate-screen; gate-summary.
Resultado: todos concluídos com sucesso.
Estado do PR: OPEN, draft = false, merged = false, mergeable = true.
Corpo do PR atualizado com o bump de segurança, a regressão encontrada/corrigida e o workflow final.
Merge: NÃO realizado. Aguarda aprovação explícita do responsável.

# 6. Registro canônico de assets visuais

Planilha: HIELYA_ASSET_REGISTRY_2026-09-04
Drive ID: 1BkaFcxeouK3B41tZ8-ECPyR2bXuBNl_R8i6r1KRGBVc
Localização: pasta HIELYA
Formato: Google Sheets nativo
Abas: Registro, Conflitos, Resumo
Assets inventariados: 96
Status candidato: 78
Status aprovado: 0
Status superseded: 18
Famílias conflitantes: 8
Duplicatas exatas ativo/arquivo: 2

Conflitos V1/V2 e duplicatas arquivadas:
- HLY_CLIENT_CART_COUPON_APPLIED
- HLY_CLIENT_ORDER_IN_TRANSIT
- HLY_CLIENT_SAVED_ADDRESSES
- HLY_CLIENT_SUPPORT
- HLY_STATE_OUT_OF_STOCK
- HLY_STATE_STORE_CLOSED

Duplicatas exatas ativo/arquivo:
- HLY_CLIENT_03_PHONE_LOGIN_EMPTY_V1.png
- HLY_CLIENT_03_PHONE_LOGIN_TYPING_V1.png

Tratamento canônico: manter o arquivo localizado no caminho ativo como candidato; preservar os IDs arquivados como superseded; nenhuma aprovação foi inferida. O registro contém Drive ID, caminho, nome, versão, status, tipo, datas, URL, grupo canônico, sinalização e fonte da classificação. A tabela nativa, filtros, dropdown de status e contagens foram verificados.

# 7. Restrições preservadas

MAIN_CHANGED = FALSE
MERGE_PERFORMED = FALSE
NEW_UI_SCREEN_CREATED = FALSE
C_003_STARTED = FALSE
C_004_STARTED = FALSE
CHECKPOINT_OVERWRITTEN = FALSE
PR_17_READY_FOR_REVIEW = TRUE
PR_17_MERGED = FALSE

# 8. Riscos e pendências

- O PR #17 depende de aprovação explícita antes do merge.
- Nenhum asset visual possui aprovação formal; todos os arquivos ativos permanecem candidatos.
- O guardrail de CI para autorização da Issue foi recomendado, mas ainda não foi implementado.
- Permanecem 8 avisos de lint não bloqueantes.
- HIELYA_CHECKPOINT_2026-08-05_v2.3.md continua classificado como HISTORICAL_WITH_ACCIDENTAL_APPEND e não deve ser alterado novamente.

# 9. Próximas decisões recomendadas

1. Revisar este checkpoint e o registro canônico de assets.
2. Aprovar ou rejeitar explicitamente o merge do PR #17.
3. Em trabalho futuro separado, decidir a implementação do guardrail de CI.
4. Não iniciar C-003/C-004 nem novas telas antes da autorização correspondente.
