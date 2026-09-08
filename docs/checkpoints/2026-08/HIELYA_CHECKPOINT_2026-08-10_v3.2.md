# HIELYA CHECKPOINT OFICIAL

Versão: 3.2
Tipo: Certificação do CUSTOMER_AUTHENTICATION_FOUNDATION_GATE
Checkpoint anterior: HIELYA_CHECKPOINT_2026-08-09_v3.1.md
Repositório: srdarllan-hash/hielya-app

## 1. Resumo executivo

O Gate CUSTOMER_AUTHENTICATION_FOUNDATION_GATE_CERTIFIED foi concluído no PR #15. A fundação de autenticação do cliente agora está certificada somente no limite application/persistence, com segurança de desafio OTP e sessão de leitura. Nenhum transporte HTTP, endpoint público, UI ou tela de cliente foi iniciado.

## 2. Estado certificado

ISSUE = #14
PR = #15
PR_STATE = OPEN / DRAFT / NOT MERGED
PARENT_PR = #13
PARENT_SHA = 970b6ae295ff205d214afe6fe4f24ff073fcde27
CERTIFIED_HEAD = 68d5f5422a9dff560b301c17fe1bce466ac7281a
CERTIFIED_WORKFLOW_RUN = 31345114972
CI_STATUS = SUCCESS
CERTIFIED_GATE = CUSTOMER_AUTHENTICATION_FOUNDATION_GATE_CERTIFIED
MAIN_CHANGED = FALSE
MERGE_PERFORMED = FALSE
NEXT_LAYER_STARTED = FALSE

## 3. Entregas certificadas

A camada application foi separada da persistência. Os casos de uso de autenticação, a criptografia e as regras de domínio permanecem em application; SQLite atua como adaptador de persistência com transições atômicas.

O pepper é obrigatório. A verificação de OTP utiliza HMAC-SHA256 com pepper, challengeId e OTP; o resultado é protegido com scrypt. O fluxo exige gateway SMS obrigatório para solicitação/entrega do desafio.

O cooldown é contado a partir do lock, não da solicitação inicial. A validação de sessão ativa está disponível somente para leitura, sem criação de transporte HTTP.

## 4. Contratos e superfícies preservadas

MIGRATION_0004_PRESERVED = TRUE
OPENAPI_CHANGED = FALSE
PUBLIC_ENDPOINTS_CREATED = FALSE
UI_CHANGED = FALSE
C003_STARTED = FALSE
C004_STARTED = FALSE

A migration 0004 foi preservada. OpenAPI não foi alterado. Não foram criados endpoints públicos e a UI não recebeu alterações.

## 5. Validação

Testes de unidade, tipagem, lint, build e regressões congeladas foram concluídos com sucesso. O workflow final 31345114972 terminou em SUCCESS. As regressões C-001, C-002 e C-005 permanecem verdes.

## 6. Governança e escopo

A branch e o PR existentes permanecem abertos, draft e sem merge. main permanece inalterada. Não houve criação de Issue, branch, commit, merge ou início de camada seguinte durante a criação deste checkpoint.

## 7. Riscos e pendências

- O transporte HTTP de autenticação ainda não existe.
- O gateway SMS permanece uma dependência obrigatória do fluxo e não representa integração de produção.
- C-003 e C-004 não foram iniciadas.
- Carrinho, checkout, pedidos, pagamentos, Admin e produção continuam fora deste Gate.
- Qualquer camada futura deve preservar a separação application/persistence e as regras de pepper, challenge, lock e cooldown.

## 8. Próximo Gate recomendado

RECOMMENDED_NEXT_GATE = CUSTOMER_AUTHENTICATION_HTTP_TRANSPORT_ALIGNMENT_GATE

Implementar exclusivamente o transporte HTTP já descrito pelo OpenAPI:
POST /auth/otp/request
POST /auth/otp/verify

Esse Gate não deve iniciar C-003 ou C-004.

## 9. Aviso histórico

HIELYA_CHECKPOINT_2026-08-05_v2.3.md = HISTORICAL_WITH_ACCIDENTAL_APPEND

A revisão histórica original desse documento não deve ser sobrescrita ou alterada novamente. Este checkpoint não modifica o v2.3.

## 10. Continuidade

Usar exclusivamente o SHA certificado 68d5f5422a9dff560b301c17fe1bce466ac7281a como referência para o próximo Gate. Manter o PR #15 em OPEN / DRAFT / NOT MERGED e main sem alterações até autorização separada.

CHECKPOINT_STATUS = COMPLETE
PROJECT_CHANGES_FROM_CHECKPOINT = DOCUMENTATION_ONLY_IN_GOOGLE_DRIVE
