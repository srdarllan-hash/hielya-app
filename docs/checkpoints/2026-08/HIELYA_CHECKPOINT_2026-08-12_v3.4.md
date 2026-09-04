# HIELYA_CHECKPOINT_2026-08-12_v3.4

Checkpoint oficial — readiness visual C-003/C-004 e decisão provisória de armazenamento de sessão

## 1. Metadados

VERSION = 3.4
DATE = 2026-08-12
TIME = 19:50
TIMEZONE = Europe/Dublin
PREVIOUS_CHECKPOINT = HIELYA_CHECKPOINT_2026-08-10_v3.3.md
REPOSITORY = srdarllan-hash/hielya-app
MAIN_SHA = 91e603d94cc0c5499d96eeca7954a19c4e3a2811
ACTIVE_ISSUE = #16
ACTIVE_PR = #17
ACTIVE_PR_STATE = OPEN / DRAFT / NOT MERGED
ACTIVE_BASE_BRANCH = hielya/mvp-local-36-customer-authentication-foundation
ACTIVE_BASE_SHA = 68d5f5422a9dff560b301c17fe1bce466ac7281a
ACTIVE_HEAD_BRANCH = hielya/mvp-local-36-auth-http-opaque-session
ACTIVE_HEAD_SHA = ef2ec10508aec07ac41f4b4d1079644b229b4214
LATEST_WORKFLOW_RUN = 31436009572
LATEST_WORKFLOW_ID = 331453214
CI_STATUS = SUCCESS
CERTIFIED_GATE = CUSTOMER_AUTHENTICATION_PUBLIC_CONTRACT_V1_2_AND_HTTP_TRANSPORT_GATE_CERTIFIED
NEW_GITHUB_ACTIVITY_SINCE_PREVIOUS_CHECKPOINT = FALSE
MEANINGFUL_DRIVE_DESIGN_EVOLUTION = TRUE
CREATE_CHECKPOINT = TRUE
MERGE_PERFORMED = FALSE
MAIN_CHANGED = FALSE
PRODUCTION_CHANGED = FALSE

## 2. Inconsistências e regra de canonicalidade

Antes de tratar qualquer fonte nova como canônica, foi encontrada uma diferença material entre o estado certificado do GitHub e os novos materiais do Google Drive.

O checkpoint v3.3, o PR #17, a Issue #16, o OpenAPI V1.2, o Implementation Profile V1.2 e o ADR de sessão opaca mantêm C-003, C-004, login UI, OTP UI e armazenamento de sessão no cliente fora do Gate certificado. O GitHub continua sem branch, commit, PR ou workflow novo para essas telas.

Entretanto, em 2026-08-11 foram criados no Drive materiais visuais específicos para C-003/C-004, incluindo telas V1, cinco conceitos de login, board consolidado de estados e referências de Design System. O board também propõe uma política de armazenamento de sessão: secure system storage para aplicativo nativo e memória somente para Web UI-Lab, vedando localStorage, sessionStorage e IndexedDB.

RESOLUTION = os novos materiais do Drive são registrados neste checkpoint como DESIGN_CANDIDATE / REFERENCE_PENDING_APPROVAL. Eles representam evolução real de produto e Design System, mas não autorizam implementação e não substituem contratos/ADRs certificados apenas por conterem “V1” no nome. O arquivo HLY_REFERENCE_C003_C004_LIGHT_THEME_SUPERSEDED.png permanece explicitamente SUPERSEDED / REFERENCE_ONLY.

A regra proposta para Web UI-Lab é compatível com o Gate atual, que não autorizou localStorage/sessionStorage. A escolha “native secure system storage” é nova e deve ser formalizada em ADR/contrato de cliente antes de ser tratada como arquitetura canônica.

## 3. Resumo executivo

Houve evolução material desde o checkpoint v3.3, porém ela ocorreu no Google Drive, não no repositório. O estado factual do GitHub permanece congelado no PR #17, HEAD ef2ec10508aec07ac41f4b4d1079644b229b4214, com o workflow 31436009572 em SUCCESS. A main permanece em 91e603d94cc0c5499d96eeca7954a19c4e3a2811 e nenhum merge foi realizado.

A evolução relevante consiste na materialização do trabalho visual de autenticação C-003/C-004 e de um board consolidado de estados e regras. Isso atende diretamente ao próximo passo registrado no v3.3 — PRO_REVIEW_CLIENT_SESSION_STORAGE_AND_C003_C004_VISUAL_READINESS — e, pela Política Permanente de Checkpoints, justifica um novo checkpoint por alterar Design System, fluxos e decisões arquiteturais candidatas.

Este checkpoint documenta a evolução, preserva a separação entre evidência visual e contrato certificado e não inicia nenhuma nova camada funcional.

## 4. Validação do estado atual do GitHub

PR #17 continua OPEN / DRAFT / NOT MERGED.
Base: hielya/mvp-local-36-customer-authentication-foundation @ 68d5f5422a9dff560b301c17fe1bce466ac7281a.
Head: hielya/mvp-local-36-auth-http-opaque-session @ ef2ec10508aec07ac41f4b4d1079644b229b4214.
Commits sobre o parent: 3.
Último commit do head: ci(auth): isolate legacy composite validation from Gate environment, 2026-08-10T21:54:18Z.
Último workflow do repositório: 31436009572, workflow ID 331453214, SUCCESS, no mesmo HEAD.
Main: 91e603d94cc0c5499d96eeca7954a19c4e3a2811, inalterada.
Nova branch C-003/C-004: inexistente.
Novo PR C-003/C-004: inexistente.
Novo workflow após v3.3: inexistente.

O conjunto de branches HIELYA observado permanece o mesmo da cadeia empilhada certificada, culminando em hielya/mvp-local-36-auth-http-opaque-session. Não foi encontrada branch posterior para UI de autenticação.

## 5. Contratos e decisões arquiteturais certificados preservados

### 5.1 OpenAPI MVP Local 36 V1.2

CANONICAL_FILE = contracts/openapi/HIELYA_OPENAPI_MVP_LOCAL_36_V1_2.yaml
VERSION = 1.2.0
GIT_BLOB_SHA = 7ec86235cd079244f219a53fb0202cc09d62cdc1
RECORDED_SHA256_IN_V3_3 = f71918b043ae6d24cc1c27ace5073fafc644a92bbe736de486a83e4465898d88

Permanece com exatamente dois endpoints de autenticação:
- POST /api/v1/auth/otp/request
- POST /api/v1/auth/otp/verify

OtpRequest continua exigindo phoneE164 no padrão +34 seguido de nove dígitos e locale es-ES, en-GB ou pt-BR. O verify continua exigindo apenas challengeId e code, com código de seis dígitos. A sessão continua opaca, revogável e com validade absoluta de 30 dias. JWT, access token, refresh token e rotação continuam ausentes.

### 5.2 Implementation Profile V1.2

CANONICAL_FILE = contracts/openapi/MVP_LOCAL_36_AUTH_IMPLEMENTATION_PROFILE_V1_2.json
GIT_BLOB_SHA = 841b94253dac5a1d306406171fb4ab6cc1613cbb

O perfil continua marcando como DEFERRED: C-003, C-004, login UI, OTP UI, cookies, session renewal, logout, bearer middleware, /me, cart, checkout, orders, payments, Admin, real SMS, production e merge.

### 5.3 ADR de sessão opaca

CANONICAL_FILE = docs/decisions/ADR-MVP-LOCAL-36-OPAQUE-CUSTOMER-SESSION-V1-2.md
GIT_BLOB_SHA = 15a81feb243f864102860f47a0b5b7bcc212f7ac

Mantém Application sem HTTP/SQL, Persistence como adapter SQLite, apps/ui-lab como composição/transport, produção bloqueada e C-003/C-004/UI fora do Gate certificado.

## 6. Evolução no Google Drive desde v3.3

Foram materializadas novas estruturas e 16 imagens de Design System/acesso depois do checkpoint anterior.

### 6.1 Pastas criadas

- 00_Design_System
- 00_Design_System/Referencias
- 01_Acesso
- 01_Acesso/Login_Telefone
- 01_Acesso/Codigo_SMS
- 01_Acesso/Boards_Review

### 6.2 Arquivos criados — Login_Telefone

- HLY_CLIENT_03_PHONE_LOGIN_V1.png
- HLY_CLIENT_03_PHONE_LOGIN_CONCEPT_01.png
- HLY_CLIENT_03_PHONE_LOGIN_CONCEPT_02.png
- HLY_CLIENT_03_PHONE_LOGIN_CONCEPT_03.png
- HLY_CLIENT_03_PHONE_LOGIN_CONCEPT_04.png
- HLY_CLIENT_03_PHONE_LOGIN_CONCEPT_05.png

### 6.3 Arquivos criados — Codigo_SMS

- HLY_CLIENT_04_CODIGO_SMS_V1.png

### 6.4 Arquivos criados — Boards_Review

- HLY_BOARD_C003_C004_AUTH_STATES_V1.png

### 6.5 Arquivos criados — Referencias

- HLY_REFERENCE_C003_C004_LIGHT_THEME_SUPERSEDED.png
- HLY_REFERENCE_STATES_ERRORS_OVERVIEW_01.png
- HLY_REFERENCE_STATES_ERRORS_OVERVIEW_02.png
- HLY_REFERENCE_ORDER_ACCOUNT_FLOW_01.png
- HLY_REFERENCE_ORDER_PROFILE_SUPPORT_FLOW_01.png
- HLY_REFERENCE_LOGIN_SEARCH_CATALOG_STATES_01.png
- HLY_REFERENCE_LOGIN_SEARCH_CART_STATES_01.png
- HLY_REFERENCE_FULL_CLIENT_FLOW_DESIGN_SYSTEM_01.png

DRIVE_FILES_MODIFIED_SINCE_V3_3 = nenhum material relevante identificado além da criação desses artefatos.
DRIVE_FILES_REMOVED_SINCE_V3_3 = nenhum identificado.
GITHUB_FILES_CREATED_SINCE_V3_3 = 0.
GITHUB_FILES_MODIFIED_SINCE_V3_3 = 0.
GITHUB_FILES_REMOVED_SINCE_V3_3 = 0.

## 7. Pro Review — conteúdo observado nos materiais C-003/C-004

### 7.1 C-003 — telefone

O board apresenta os estados: EMPTY, TYPING, VALID, INVALID_PHONE, LOADING, NETWORK_ERROR, CONFIGURATION_ERROR e DISABLED.

A tela HLY_CLIENT_03_PHONE_LOGIN_V1.png materializa visualmente login por telefone em espanhol, com prefixo +34, CTA de continuidade, texto de privacidade e linguagem visual preta/branca/dourada.

### 7.2 C-004 — código SMS

O board apresenta os estados: EMPTY, PARTIAL, COMPLETE, VERIFYING, INVALID_CODE, EXPIRED_CODE, ATTEMPTS_EXHAUSTED, RESEND_COOLDOWN, RESEND_AVAILABLE, NETWORK_ERROR e SUCCESS.

A tela HLY_CLIENT_04_CODIGO_SMS_V1.png materializa seis posições de código, telefone mascarado, expiração, verificação, cooldown de reenvio e opção de alterar número.

### 7.3 Regras coerentes com o backend certificado

PHONE_SCOPE = ES_PLUS_34_ONLY
OTP_LENGTH = 6
OTP_TTL_SECONDS = 300
OTP_RESEND_COOLDOWN_SECONDS = 60
OTP_MAX_ATTEMPTS = 5
PUBLIC_HOME_REMAINS_ANONYMOUS = TRUE
AUTH_TRIGGER = CHECKOUT_OR_AUTHENTICATED_AREA

Essas regras estão alinhadas com o contrato/fundação atual e não exigem reinterpretação do OpenAPI V1.2.

### 7.4 Decisões candidatas novas

PRESERVE_CART_AND_ORIGIN_AFTER_AUTH = PROPOSED
WEB_UI_LAB_SESSION_STORAGE = MEMORY_ONLY / PROPOSED
NATIVE_SESSION_STORAGE = OS_SECURE_STORAGE / PROPOSED
LOCALSTORAGE_FOR_AUTH_SESSION = FORBIDDEN / PROPOSED
SESSIONSTORAGE_FOR_AUTH_SESSION = FORBIDDEN / PROPOSED
INDEXEDDB_FOR_AUTH_SESSION = FORBIDDEN / PROPOSED

Essas decisões não são promovidas a CANONICAL neste checkpoint. Exigem aprovação explícita e registro durável em ADR/contrato antes de implementação.

### 7.5 Direção visual candidata

BASE_VIEWPORT = 390x844
ORIENTATION = VERTICAL
PRIMARY_LANGUAGE = ES
PALETTE = BLACK / WHITE / GOLD
TYPOGRAPHY = POPPINS

STATUS = VISUAL_MATERIALIZED_PENDING_FORMAL_APPROVAL

## 8. Delta em relação ao checkpoint v3.3

Antes: o v3.3 registrava que C-003 e C-004 não haviam começado, que a estratégia de armazenamento no cliente ainda não estava decidida e que o próximo passo era revisar client session storage e readiness visual.

Agora: existem materiais visuais concretos de C-003/C-004 e um board que propõe estados, regras de continuidade e armazenamento de sessão. Portanto, o readiness visual avançou de “não materializado” para “materializado e pendente de aprovação formal”.

Não houve mudança de implementação: o GitHub continua exatamente no Gate de transporte OTP do PR #17 e C-003/C-004 continuam NOT_STARTED do ponto de vista de código certificado.

## 9. Estado atual do projeto

GITHUB_GATE = CUSTOMER_AUTHENTICATION_PUBLIC_CONTRACT_V1_2_AND_HTTP_TRANSPORT_GATE_CERTIFIED
VISUAL_READINESS_C003_C004 = MATERIALIZED_PENDING_FORMAL_APPROVAL
C003_IMPLEMENTATION = NOT_STARTED
C004_IMPLEMENTATION = NOT_STARTED
CLIENT_SESSION_STORAGE_IMPLEMENTATION = NOT_STARTED
BEARER_MIDDLEWARE = NOT_STARTED
REAL_SMS = NOT_STARTED
CART = NOT_STARTED
CHECKOUT = NOT_STARTED
PAYMENTS = NOT_STARTED
PRODUCTION = BLOCKED
MERGE = BLOCKED
MAIN = UNCHANGED

O projeto está em um ponto de transição entre backend/contrato de autenticação certificado e definição formal da experiência cliente de autenticação.

## 10. Pendências e prioridades

Prioridade 1: realizar aprovação formal do board HLY_BOARD_C003_C004_AUTH_STATES_V1.png e das telas V1, distinguindo claramente material canônico de conceitos e referências.

Prioridade 2: formalizar em ADR/contrato de cliente a estratégia de sessão, incluindo armazenamento nativo seguro, memória somente no Web UI-Lab, restauração de sessão, perda de sessão ao recarregar no Web UI-Lab, expiração, reautenticação e logout futuro.

Prioridade 3: decidir se “preservar carrinho e tela de origem” é requisito canônico do fluxo de autenticação antes de abrir implementação.

Prioridade 4: criar Issue/change-set separado para C-003/C-004, usando PR #17/HEAD certificado apenas como parent, sem reescrever o Gate atual.

## 11. Próximos passos recomendados

NEXT_EXACT_STEP = FORMALIZE_C003_C004_VISUAL_AND_CLIENT_SESSION_CONTRACT

1. Aprovar ou rejeitar explicitamente HLY_CLIENT_03_PHONE_LOGIN_V1.png, HLY_CLIENT_04_CODIGO_SMS_V1.png e HLY_BOARD_C003_C004_AUTH_STATES_V1.png.
2. Produzir documento/ADR canônico de client session storage e lifecycle.
3. Marcar concepts e referências com status inequívoco: APPROVED, REFERENCE_ONLY ou SUPERSEDED.
4. Somente depois criar nova Issue, child branch e Gate para implementação C-003/C-004.
5. Preservar PR #17 como parent certificado; não fazer merge em main e não iniciar cart/checkout/bearer middleware por inferência.

## 12. Riscos

- O sufixo “V1” nos PNGs pode ser interpretado erroneamente como aprovação canônica.
- A escolha de secure system storage nativo ainda não está refletida em ADR/contrato GitHub.
- Web UI-Lab em memória somente implica perda de sessão após reload/fechamento; essa consequência de UX precisa ser aprovada explicitamente.
- O backend emite sessionToken, mas ainda não existe bearer middleware/consumer; uma UI de sucesso não cria, por si só, fluxo autenticado protegido end-to-end.
- SMS continua simulado e produção continua bloqueada.
- Conceitos e referências múltiplas podem gerar divergência visual se não houver promoção explícita de um único contrato aprovado.

## 13. Bloqueios

BLOCKER_01 = C003_C004_VISUAL_CANONICAL_APPROVAL_MISSING
BLOCKER_02 = CLIENT_SESSION_STORAGE_ADR_MISSING
BLOCKER_03 = SESSION_RESTORE_EXPIRY_LOGOUT_BEHAVIOR_NOT_CANONICAL
BLOCKER_04 = BEARER_CONSUMER_NOT_IMPLEMENTED
BLOCKER_05 = REAL_SMS_AND_PRODUCTION_NOT_AUTHORIZED

Nenhum desses bloqueios invalida o Gate certificado do PR #17; eles impedem somente assumir que a camada cliente de autenticação já está autorizada ou pronta para produção.

## 14. Documentos e artefatos canônicos

CANONICAL_GOVERNANCE = HIELYA_CHECKPOINT_POLICY.md
CANONICAL_IMPLEMENTATION_STATE = GitHub/CI factual state at ACTIVE_HEAD_SHA
CANONICAL_OPENAPI = contracts/openapi/HIELYA_OPENAPI_MVP_LOCAL_36_V1_2.yaml
CANONICAL_AUTH_PROFILE = contracts/openapi/MVP_LOCAL_36_AUTH_IMPLEMENTATION_PROFILE_V1_2.json
CANONICAL_AUTH_ADR = docs/decisions/ADR-MVP-LOCAL-36-OPAQUE-CUSTOMER-SESSION-V1-2.md
PRIMARY_PRIOR_CONTEXT = HIELYA_CHECKPOINT_2026-08-10_v3.3.md
NEW_LATEST_CHECKPOINT = HIELYA_CHECKPOINT_2026-08-12_v3.4.md

NON_CANONICAL_PENDING_APPROVAL:
- HLY_CLIENT_03_PHONE_LOGIN_V1.png
- HLY_CLIENT_04_CODIGO_SMS_V1.png
- HLY_BOARD_C003_C004_AUTH_STATES_V1.png
- HLY_CLIENT_03_PHONE_LOGIN_CONCEPT_01..05.png
- demais referências de 00_Design_System/Referencias

EXPLICIT_REFERENCE_ONLY = HLY_REFERENCE_C003_C004_LIGHT_THEME_SUPERSEDED.png

## 15. Decision Log v3.4

D-3.4-01 — Registrar checkpoint novo porque a criação dos materiais de Design System/acesso é evolução estrutural relevante desde v3.3.

D-3.4-02 — Manter GitHub/CI como autoridade de implementação: PR #17, HEAD ef2ec10508aec07ac41f4b4d1079644b229b4214 e workflow 31436009572 permanecem o estado certificado.

D-3.4-03 — Classificar novos PNGs C-003/C-004 como DESIGN_CANDIDATE / REFERENCE_PENDING_APPROVAL, não como autorização de código.

D-3.4-04 — Registrar “native secure storage + Web UI-Lab memory-only” como proposta arquitetural consistente com as restrições atuais, porém dependente de ADR/contrato antes de implementação.

D-3.4-05 — Não iniciar C-003, C-004, bearer middleware, cart, checkout, produção, merge ou qualquer nova camada como efeito deste checkpoint.

D-3.4-06 — Tratar HLY_REFERENCE_C003_C004_LIGHT_THEME_SUPERSEDED.png como SUPERSEDED / REFERENCE_ONLY.

## 16. Origem das evidências

Google Drive:
- HIELYA_CHECKPOINT_2026-08-10_v3.3.md
- HIELYA_CHECKPOINT_POLICY.md
- pasta HIELYA e subpastas 00_Design_System e 01_Acesso
- HLY_BOARD_C003_C004_AUTH_STATES_V1.png
- HLY_CLIENT_03_PHONE_LOGIN_V1.png
- HLY_CLIENT_04_CODIGO_SMS_V1.png
- conceitos e referências listados neste checkpoint

GitHub:
- repositório srdarllan-hash/hielya-app
- PR #17 e Issue #16
- branch main
- branch hielya/mvp-local-36-auth-http-opaque-session
- workflow run 31436009572 / workflow ID 331453214
- OpenAPI V1.2
- MVP_LOCAL_36_AUTH_IMPLEMENTATION_PROFILE_V1_2.json
- ADR-MVP-LOCAL-36-OPAQUE-CUSTOMER-SESSION-V1-2.md

## 17. Segurança e preservação

CREDENTIALS_INCLUDED = FALSE
SECRETS_INCLUDED = FALSE
TOKEN_VALUES_INCLUDED = FALSE
PEPPER_VALUE_INCLUDED = FALSE
PRODUCTION_ACCESS_INCLUDED = FALSE
OVERWRITE_PREVIOUS_CHECKPOINT = FALSE

Nenhum checkpoint anterior foi alterado. Nenhuma credencial, chave, token de sessão, OTP, pepper ou segredo foi inserido neste documento.

## 18. Encerramento

CHECKPOINT_STATUS = CREATED_AND_VERIFIED
PROJECT_REPOSITORY_CHANGED_BY_CHECKPOINT = FALSE
PROJECT_PR_CHANGED_BY_CHECKPOINT = FALSE
PROJECT_CI_CHANGED_BY_CHECKPOINT = FALSE
NEXT_LAYER_STARTED_BY_CHECKPOINT = FALSE

O estado técnico certificado permanece no PR #17. A mudança registrada pelo v3.4 é a evolução de design/readiness para C-003/C-004 no Drive, ainda sujeita a aprovação formal antes de ganhar status canônico de implementação.
