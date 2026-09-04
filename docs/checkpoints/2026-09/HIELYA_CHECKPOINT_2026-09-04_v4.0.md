HIELYA CHECKPOINT — 2026-09-04 — v4.0

CHECKPOINT_STATUS = CREATED_AND_VERIFIED
PREVIOUS_CHECKPOINT = HIELYA_CHECKPOINT_2026-09-04_v3.9.md
POLICY_VALIDATED = TRUE

1. Resumo executivo

A atualização de segurança foi aplicada na branch existente do PR #17. React e React DOM foram elevados de 19.2.7 para 19.2.8; Next.js e eslint-config-next foram elevados de 16.2.7 para 16.3.3. A primeira execução remota revelou uma incompatibilidade real e determinística no ciclo de vida do controller de localização sob remount de efeitos em React Strict Mode. O defeito foi reproduzido por um novo teste unitário, corrigido com retomada explícita do controller no setup do efeito e revalidado. O Gate final está integralmente verde.

2. Estado certificado do GitHub

REPOSITORY = srdarllan-hash/hielya-app
ISSUE = #16
PR = #17
PR_STATE = OPEN
PR_DRAFT = TRUE
PR_MERGED = FALSE
BRANCH = hielya/mvp-local-36-auth-http-opaque-session
PARENT_BRANCH = hielya/mvp-local-36-customer-authentication-foundation
PARENT_SHA = 68d5f5422a9dff560b301c17fe1bce466ac7281a
PRE_SECURITY_HEAD = ef2ec10508aec07ac41f4b4d1079644b229b4214
SECURITY_DEPENDENCY_COMMIT = 35dcd5f3e04f308af3e122466eebdf772100b656
CERTIFIED_HEAD = 81cb538f5d78b5d73196919d43086b2cee5dcd67
COMMIT_COUNT_ABOVE_PARENT = 5
MAIN_CHANGED = FALSE
MERGE_PERFORMED = FALSE

3. Dependências atualizadas

react = 19.2.8
react-dom = 19.2.8
next = 16.3.3
eslint-config-next = 16.3.3
packages/ui peerDependencies react/react-dom = 19.2.8
pnpm-lock.yaml = regenerated and frozen-install validated

4. Quebra encontrada e causa raiz

FAILED_WORKFLOW_RUN = 33823264649
FAILED_HEAD = 35dcd5f3e04f308af3e122466eebdf772100b656
FAILED_JOB = frozen-and-integration-regressions
FAILED_STEP = C-002 Prequote Continuation regression
SYMPTOM = after clicking “Introducir dirección”, the expected “Dirección de entrega” combobox did not appear in any of the three viewports, including retries.

ROOT_CAUSE = useLocationController called controller.cancel() in effect cleanup; cancel permanently marked the controller disposed. Under the development Strict Mode effect remount exercised with React 19.2.8 / Next.js 16.3.3, the cleanup ran before the remounted effect and subsequent dispatches were ignored. Production builds and non-interactive state snapshots did not expose the latent lifecycle defect.

CORRECTION = LocationController now exposes resume(); useLocationController resumes the controller at effect setup and still cancels/aborts work at cleanup.
REGRESSION_TEST = tests/unit/location.components.test.tsx now proves that manual entry remains interactive across React.StrictMode effect remounts.
NEW_UI_SCREEN_CREATED = FALSE
C_003_STARTED = FALSE
C_004_STARTED = FALSE

5. Validações

LOCAL_UNIT_TESTS = 306/306 PASS
STRICT_MODE_REGRESSION_TEST = FAILS_BEFORE_FIX / PASSES_AFTER_FIX
LOCAL_LINT = 0 ERRORS / 8 WARNINGS
LINT_NOTE = 6 warnings pre-existing plus 2 new Next.js navigation advisories; no error.
LOCAL_TYPECHECK = PASS
LOCAL_NEXT_BUILD = PASS
LOCAL_GATE_VALIDATORS = PASS
MIGRATION_HASHES = PRESERVED
OPENAPI = UNCHANGED
PUBLIC_ENDPOINTS = UNCHANGED

FINAL_WORKFLOW_RUN = 33824314892
FINAL_WORKFLOW_STATUS = SUCCESS
auth-http-contract-validation = SUCCESS
frozen-and-integration-regressions = SUCCESS
c002-delivery-quote-alignment-frozen-regression = SUCCESS
c005-frozen-regression/validate-screen = SUCCESS
gate-summary = SUCCESS

6. Escopo e preservações

Nenhuma tela nova foi criada. C-003 e C-004 não foram iniciadas. OpenAPI, migrations, contratos HTTP, endpoints públicos, assets visuais e dados comerciais permaneceram inalterados. O ajuste do workflow é limitado à validação explícita dos commits de atualização de dependências e compatibilidade, preservando a revalidação do candidato funcional original sob as regras congeladas.

7. Riscos e pendências

- PR #17 permanece OPEN / DRAFT / NOT MERGED até a Tarefa 3.
- Duas novas advertências de lint do Next 16.3.3 recomendam useRouter().push() em dois fluxos internos existentes; não foram alteradas nesta atualização para evitar expansão de escopo.
- O guardrail de autorização de Issues recomendado no checkpoint v3.9 continua apenas recomendado, não implementado.
- A suíte completa deverá ser executada uma última vez antes de retirar o PR #17 do draft.
- O registro canônico de assets visuais permanece pendente como Tarefa 4.

8. Próxima ação autorizada

Executar a suíte completa final no mesmo certified HEAD, preparar o PR #17 para merge retirando-o do draft, não mergear e aguardar aprovação explícita.
