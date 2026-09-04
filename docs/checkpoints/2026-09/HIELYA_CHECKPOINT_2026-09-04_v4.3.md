# HIELYA CHECKPOINT v4.3

Data: set. 4, 2026
Horário: 10:20:06 Europe/Dublin (09:20:06 UTC)
Tipo: checkpoint corretivo e de continuidade
Checkpoint anterior: v4.2 — preservado, sem sobrescrita
Motivo: divergência factual detectada ao revalidar o estado real do GitHub

# Resumo executivo
A cadeia certificada foi integrada à main com equivalência exata de árvore. O estado de código permanece o mesmo registrado no v4.2. Este checkpoint corrige exclusivamente o estado do PR #17: após o merge do PR #19, o GitHub passou a registrar o PR #17 como CLOSED / MERGED, associado ao mesmo commit de integração, sem segundo delta funcional.

# Evidência GitHub revalidada
REPOSITORY = srdarllan-hash/hielya-app
MAIN_SHA = df912c101b3db5c910a8c575fb2e2e687a54f4f5
MAIN_TREE = 774f3153add86419f4aa622267e51c7a6f786f3c
CERTIFIED_HEAD = 81cb538f5d78b5d73196919d43086b2cee5dcd67
CERTIFIED_TREE = 774f3153add86419f4aa622267e51c7a6f786f3c
TREE_EQUIVALENCE = EXACT
PR_19 = MERGED
ISSUE_18 = CLOSED / COMPLETED
WORKFLOW_RUN = 33824314892
WORKFLOW_ATTEMPT = 3
WORKFLOW_STATUS = SUCCESS
JOBS_SUCCESS = 5/5

# Correção factual sobre o PR #17
RECORDED_IN_V4_2 = OPEN / PRESERVED
ACTUAL_GITHUB_STATE = CLOSED / MERGED
MERGED_AT = 08:44:12Z, na data deste checkpoint
BASE = main
HEAD_SHA = 81cb538f5d78b5d73196919d43086b2cee5dcd67
MERGE_COMMIT_SHA = df912c101b3db5c910a8c575fb2e2e687a54f4f5
SECOND_FUNCTIONAL_DELTA = FALSE
SECOND_DISTINCT_MERGE_COMMIT = FALSE

# Causa técnica provável
Inferência baseada nos dados do GitHub: o PR #19 integrou na main exatamente o mesmo HEAD certificado que era o HEAD do PR #17. Ao detectar os commits do PR #17 como alcançáveis na base main pelo commit de integração df912c..., o GitHub associou o PR #17 à integração e o marcou automaticamente como merged. Não houve outra alteração de conteúdo nem outro commit de merge independente.

# Impacto e governança
O v4.2 permanece histórico e não foi modificado. Seu campo que informa PR #17 aberto não deve ser usado como estado atual. Este v4.3 é a correção canônica desse único ponto.
REPOSITORY_CHANGED_BY_THIS_CHECKPOINT = FALSE
MAIN_CHANGED_SINCE_V4_2 = FALSE
CODE_CHANGED = FALSE
NEW_COMMIT_CREATED = FALSE
NEW_PR_CREATED = FALSE
CI_RERUN = FALSE
DEPLOYMENT_PERFORMED = FALSE
PRODUCTION_ACTIVATED = FALSE

# Curadoria visual
ASSET_TOTAL = 96
DESIGN_CANDIDATE_SCREENS_AND_STATES = 63
DESIGN_SYSTEM_PNG_CANDIDATE_EVIDENCE = 6
REFERENCE_ONLY_RECOMMENDED = 9
SUPERSEDED = 18
APPROVED = 0
CONFLICTING_FAMILIES = 8
EXACT_ACTIVE_ARCHIVE_DUPLICATES = 2
O relatório canônico de curadoria foi relido e permanece a fonte operacional para a próxima decisão de classificação.

# Design System
DESIGN_SYSTEM_CORE_1_1_0 = APPROVED_FROZEN
COMPONENT_BASE_1_1_1 = APPROVED / CERTIFIED
DESIGN_TOKENS_1_2_0 = CONSOLIDATION_CANDIDATE
DESIGN_SYSTEM_PNGS = NOT_FORMALLY_APPROVED
A aprovação formal da camada 1.2.0 continua exigindo Gate próprio, evidências e decisão explícita. O merge da cadeia de aplicação não promove automaticamente tokens ou PNGs.

# Restrições ativas
C_003_STARTED = FALSE
C_004_STARTED = FALSE
NEW_SCREEN_CREATED = FALSE
NEW_UI_WORK_AUTHORIZED = FALSE
Não iniciar C-003, C-004 ou qualquer tela nova antes da revisão e autorização explícita da curadoria.

# Riscos e pendências
O estado histórico do PR #17 no v4.2 diverge do estado atual do GitHub; consumidores devem usar este checkpoint v4.3.
A curadoria ainda possui zero assets aprovados, oito famílias conflitantes e duas duplicatas exatas ativo/arquivo.
Os tokens 1.2.0 permanecem candidatos de consolidação, sem promoção formal.
A produção continua não ativada.

# Próximo Gate recomendado
ASSET_CANONICAL_STATUS_RESOLUTION_GATE
Escopo recomendado: decidir e registrar primeiro as duas duplicatas exatas e a classificação dos nove itens de referência; depois resolver as famílias conflitantes; manter a promoção do Design System 1.2.0 em Gate separado.
IMPLEMENT_NOW = FALSE
START_UI_NOW = FALSE

# Registro de decisão
CHECKPOINT_STATUS = CREATED_AND_VERIFIED
PREVIOUS_CHECKPOINT_OVERWRITTEN = FALSE
FACTUAL_CORRECTION_RECORDED = TRUE
CURRENT_CANONICAL_MAIN = df912c101b3db5c910a8c575fb2e2e687a54f4f5
