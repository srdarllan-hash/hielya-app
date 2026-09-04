# HIELYA_CHECKPOINT_2026-08-10_v3.3
## Checkpoint oficial — Customer Authentication Public Contract V1.2 e OTP HTTP Transport Gate

# Resumo executivo
O Gate de autenticação pública do MVP Local 36 foi certificado sobre a fundação de autenticação do PR #15. O contrato público V1.2 formaliza uma sessão opaca, revogável e com expiração absoluta de 30 dias, e implementa somente os transportes HTTP de request e verify do OTP. O CI final passou integralmente. O PR #17 permanece OPEN / DRAFT / NOT MERGED. Nenhum merge foi executado e main permanece inalterada.

# Estado certificado
REPOSITORY = srdarllan-hash/hielya-app
ISSUE = #16
PR = #17
PR_STATE = OPEN / DRAFT / NOT MERGED
PARENT_PR = #15
PARENT_BRANCH = hielya/mvp-local-36-customer-authentication-foundation
PARENT_SHA = 68d5f5422a9dff560b301c17fe1bce466ac7281a
CERTIFIED_BRANCH = hielya/mvp-local-36-auth-http-opaque-session
CERTIFIED_HEAD = ef2ec10508aec07ac41f4b4d1079644b229b4214
CERTIFIED_WORKFLOW_RUN = 31436009572
CI_STATUS = SUCCESS
CERTIFIED_GATE = CUSTOMER_AUTHENTICATION_PUBLIC_CONTRACT_V1_2_AND_HTTP_TRANSPORT_GATE_CERTIFIED
COMMIT_COUNT_OVER_PARENT = 3
PREVIOUS_CHECKPOINT = HIELYA_CHECKPOINT_2026-08-10_v3.2.md
NEW_CHECKPOINT = HIELYA_CHECKPOINT_2026-08-10_v3.3.md
MERGE_PERFORMED = FALSE
MAIN_CHANGED = FALSE

# OpenAPI V1.2
OPENAPI_V1_0_MODIFIED = FALSE
OPENAPI_V1_1_MODIFIED = FALSE
OPENAPI_V1_2_FILE = contracts/openapi/HIELYA_OPENAPI_MVP_LOCAL_36_V1_2.yaml
OPENAPI_V1_2_VERSION = 1.2.0
OPENAPI_V1_2_SHA256 = f71918b043ae6d24cc1c27ace5073fafc644a92bbe736de486a83e4465898d88
LINEAGE = V1.0 → V1.1 → V1.2
AUTH_ENDPOINT_COUNT_ADDED = 2
OPERATION_IDS_UNIQUE = TRUE
OPERATION_IDS = requestCustomerOtp, verifyCustomerOtp
PREVIOUS_CONTRACTS_PRESERVED = TRUE
O V1.2 preserva todos os paths e schemas do V1.1 e adiciona exatamente os dois endpoints públicos de autenticação autorizados.

# Endpoints certificados
POST /api/v1/auth/otp/request
POST /api/v1/auth/otp/verify
AUTH_ENDPOINT_COUNT_ADDED = 2
VERIFY_REQUEST_REQUIRES_PHONE = FALSE
VERIFY_FINDS_PHONE_FROM_CHALLENGE = TRUE
O request exige phoneE164 no formato +34 seguido de nove dígitos e locale em es-ES, en-GB ou pt-BR. O verify exige somente challengeId e code; o telefone é obtido internamente pelo challenge.

# Estratégia de sessão
SESSION_STRATEGY = OPAQUE_SERVER_SESSION
SESSION_TOKEN_COUNT = 1
SESSION_TTL_SECONDS = 2592000
SESSION_EXPIRY_MODE = ABSOLUTE
SESSION_REVOCABLE = TRUE
JWT_USED = FALSE
ACCESS_TOKEN_USED = FALSE
REFRESH_TOKEN_USED = FALSE
TOKEN_ROTATION_USED = FALSE
CUSTOMER_BEARER_FORMAT = OpaqueSessionToken
RAW_SESSION_TOKEN_PERSISTED = FALSE

# Segurança
PEPPER_REQUIRED = TRUE
PEPPER_DEFAULT_VALUE = NONE
PEPPER_PERSISTED = FALSE
OTP_EXPOSED = FALSE
VERIFY_PHONE_FIELD_PRESENT = FALSE
RAW_TOKEN_RETURNED_ONLY_AFTER_VALID_VERIFICATION = TRUE
ONLY_SESSION_TOKEN_SHA256_PERSISTED = TRUE
CACHE_CONTROL = no-store
PRAGMA = no-cache
CORRELATION_ID = REQUIRED
JSON_VALIDATION = STRICT
MAX_JSON_BODY_BYTES = 16384
PRODUCTION_AUTHORIZED = FALSE
SMS_PROVIDER = SIMULATED_ONLY
O runtime de autenticação exige banco SQLite existente, migrado e gravável em desenvolvimento/testes. Pepper, OTP, telefone interno, token bruto, SQL, stack e detalhes internos não são registrados nem expostos por erro público.

# Exceção controlada de CI
THIRD_COMMIT_SHA = ef2ec10508aec07ac41f4b4d1079644b229b4214
THIRD_COMMIT_MESSAGE = ci(auth): isolate legacy composite validation from Gate environment
THIRD_COMMIT_SCOPE = WORKFLOW_ONLY
THIRD_COMMIT_FILES = .github/workflows/mvp-local-36-auth-http-opaque-session-gate.yml
PREVIOUS_TWO_COMMIT_CANDIDATE_REVALIDATED = TRUE
PREVIOUS_TWO_COMMIT_CANDIDATE_SHA = b319e701f77e53f19d75bdfd57118930e8ed4b83
LEGACY_COMPOSITE_TEST_PRESERVED = TRUE
LEGACY_VALIDATOR_MODIFIED = FALSE
TEST_REMOVED_SKIPPED_OR_WEAKENED = FALSE
FOCUSED_VITEST_GITHUB_ACTIONS = FALSE
O candidato anterior de dois commits foi revalidado em worktree detached de HEAD^ sob as regras originais com GITHUB_ACTIONS=true. GITHUB_ACTIONS=false ficou limitado à suíte Vitest focada correta. O terceiro commit alterou exclusivamente o workflow; nenhum código, contrato, teste, script, migration, dependência ou lockfile foi modificado pela exceção.

# Testes e regressões
OPENAPI_VALIDATION = SUCCESS
HTTP_CONTRACT_TESTS = SUCCESS
HTTP_INTEGRATION_TESTS = SUCCESS
AUTH_SECURITY_TESTS = SUCCESS
FULL_UNIT_TESTS = SUCCESS
TYPECHECK = SUCCESS
LINT = SUCCESS
NEXT_BUILD = SUCCESS
AUTHENTICATION_FOUNDATION_REGRESSION = SUCCESS
INVENTORY_RESERVATION_REGRESSION = SUCCESS
PUBLIC_API_REGRESSION = SUCCESS
C001_REGRESSION = SUCCESS
C002_FROZEN_REGRESSION = SUCCESS
C002_DELIVERY_QUOTE_ALIGNMENT_REGRESSION = SUCCESS
C002_PREQUOTE_CONTINUATION_REGRESSION = SUCCESS
C005_FROZEN_REGRESSION = SUCCESS
HOME_CATALOG_REGRESSION = SUCCESS
PRODUCT_DETAIL_REGRESSION = SUCCESS
GATE_SUMMARY = SUCCESS
WORKFLOW_RUN = 31436009572
WORKFLOW_FINAL_STATUS = SUCCESS

# Itens não iniciados
MIGRATION_CREATED = FALSE
UI_CHANGED = FALSE
C003_STARTED = FALSE
C004_STARTED = FALSE
BEARER_MIDDLEWARE_STARTED = FALSE
CLIENT_SESSION_STORAGE_STARTED = FALSE
CART_STARTED = FALSE
CHECKOUT_STARTED = FALSE
ORDER_STARTED = FALSE
PAYMENT_STARTED = FALSE
ADMIN_STARTED = FALSE
REAL_SMS_STARTED = FALSE
PRODUCTION_STARTED = FALSE

# Riscos e pendências
O runtime de autenticação continua restrito a desenvolvimento/testes.
SMS permanece simulado.
Nenhum consumidor do sessionToken existe.
Bearer middleware ainda não existe.
A estratégia de armazenamento do token no cliente ainda não foi decidida.
As telas C-003 e C-004 ainda não foram aprovadas e integradas.
Nenhuma próxima camada deve começar sem novo change-set.

# Próximo passo recomendado
NEXT_EXACT_STEP = PRO_REVIEW_CLIENT_SESSION_STORAGE_AND_C003_C004_VISUAL_READINESS
CODEX_NEXT_TASK = NONE
Não iniciar imediatamente C-003 ou C-004 antes de decidir o armazenamento seguro da sessão no cliente, o ciclo de restauração da sessão, o logout futuro, o comportamento após expiração e o contrato visual aprovado das telas Telefone e Código SMS.

# Governança
CREATE_CHECKPOINT = TRUE
MODIFY_REPOSITORY = FALSE
MODIFY_ISSUE = FALSE
MODIFY_PR = FALSE
CREATE_BRANCH = FALSE
CREATE_COMMIT = FALSE
RUN_CI = FALSE
MERGE = FALSE
START_NEXT_LAYER = FALSE
OVERWRITE_CHECKPOINT = FALSE
Este checkpoint é aditivo e não altera checkpoints anteriores.
