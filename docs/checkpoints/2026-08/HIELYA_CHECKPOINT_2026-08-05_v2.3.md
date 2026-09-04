# HIELYA_CHECKPOINT_2026-08-05_v2.3

Data e hora: 2026-08-05 15:17 Europe/London
Tipo: Checkpoint extraordinário por bloqueio arquitetural

## Resumo executivo
A tentativa de iniciar a camada Public Service/API foi corretamente bloqueada antes de qualquer alteração. O modelo persistente atual não contém todos os campos exigidos pelos DTOs públicos do OpenAPI MVP Local 36 V1.1 e não existe uma decisão arquitetural aprovada para hospedar handlers HTTP.

## Estado verificado
- Repositório: srdarllan-hash/hielya-app
- Branch: hielya/mvp-local-36-implementation
- PR: #5, OPEN / DRAFT, não mesclada
- HEAD: 4ca838d4937555f50b3f5e11fddece5e042e1ee9
- Main alterada: FALSE
- Mudanças do bloqueio: NONE

## Bloqueio
BLOCK_REASON = INCOMPLETE_PERSISTENT_CATALOG_READ_MODEL
ADDITIONAL_BLOCK_REASON = MISSING_APPROVED_API_HOST_ARCHITECTURE

Campos ausentes:
- PublicCategory.id
- PublicProduct.id
- PublicProduct.name
- PublicProduct.categoryId
- PublicProduct.salePriceCents
- PublicProduct.maxPerOrder
- PublicProduct.containsAlcohol
- PublicBundleComponent.productId
- PublicBundleComponent.name

## Decisões
1. Não iniciar handlers, serviços ou endpoints enquanto os pré-requisitos estiverem incompletos.
2. Não inventar preços, nomes, UUIDs instáveis ou dados comerciais.
3. Criar Gate específico para completar o read model persistente e aprovar a arquitetura do API host.
4. Preservar C-003, C-004, autenticação, carrinho, checkout e pagamentos como bloqueados.
5. Manter o OpenAPI V1.0 imutável e o OpenAPI MVP Local 36 V1.1 como contrato executável da futura API pública.

## Arquitetura de referência
O pacote canônico define monólito modular TypeScript, Node 24, Next.js 16.2, PostgreSQL, Prisma e uma única base para cliente, Admin e backend. O repositório atual possui apenas apps/ui-lab como host Next.js executável. A próxima decisão deve definir explicitamente se esse host será usado para route handlers ou se haverá migração arquitetural controlada, sem criar microserviço paralelo.

## Próximo Gate
PERSISTENT_CATALOG_READ_MODEL_COMPLETION_AND_API_HOST_ARCHITECTURE_GATE

O Gate deverá:
- adicionar de forma aditiva os campos persistentes faltantes;
- usar somente dados canônicos;
- bloquear caso preços ou outros valores comerciais não estejam aprovados;
- definir e registrar o host HTTP no ADR;
- não implementar ainda os quatro endpoints públicos;
- executar testes, lint, typecheck, build e regressões C-001, C-002 e C-005.

## Riscos
- preços dos seis composites podem não estar definidos canonicamente;
- adotar apps/ui-lab sem ADR pode criar acoplamento ou renome futuro;
- gerar IDs em cada request quebraria estabilidade;
- copiar dados históricos poderia reintroduzir regras obsoletas;
- alterar o OpenAPI para contornar o banco geraria divergência contratual.

## Decision Log
- D-CP-2.3-001: Gate da API pública bloqueado sem mudanças parciais.
- D-CP-2.3-002: read model persistente completo é pré-requisito obrigatório.
- D-CP-2.3-003: API host exige ADR formal antes dos handlers.
- D-CP-2.3-004: C-003 e C-004 continuam fora do caminho crítico atual.

## Documentos canônicos preservados
- contracts/openapi/HIELYA_OPENAPI_V1_0.yaml
- contracts/openapi/HIELYA_OPENAPI_MVP_LOCAL_36_V1_1.yaml
- contracts/openapi/MVP_LOCAL_36_IMPLEMENTATION_PROFILE.json
- docs/decisions/ADR-MVP-LOCAL-36-OPENAPI-V1-1.md
- HIELYA Master Package Work-Ready V1.1

## Atualização — Customer Authentication Contract and Persistence Foundation Gate

UNIDADE_CONCLUÍDA = fundação interna de autenticação por telefone e sessão do cliente
ISSUE = #14, OPEN
PR = #15, OPEN / DRAFT / NOT MERGED
PARENT_SHA = 970b6ae295ff205d214afe6fe4f24ff073fcde27
HEAD_FINAL = 2f19c1d4f9f672ba6cc33e3fbca583371863ee3b
WORKFLOW_RUN = 31341371935, SUCCESS

Arquivos alterados:
- .dev-migrations/0004_mvp_local_36_customer_authentication_foundation.sql
- packages/persistence/src/customer-auth.ts
- packages/persistence/src/index.ts
- scripts/validate-mvp-local-36-customer-authentication-foundation.mjs
- scripts/validate-mvp-persistence-schema.mjs
- tests unitários de autenticação, concorrência e migrations
- workflow dedicado do Gate

Testes e resultados:
- ciclo telefone espanhol → OTP → SMS simulado → cliente → sessão → validação → revogação: PASS
- migração vazia/existente, checksum, reexecução e foreign keys: PASS
- sigilo de OTP e token de sessão: PASS
- concorrência multi-conexão, cooldown, verificação única e cinco tentativas: PASS
- testes focados: 45/45 PASS; cobertura adicional: 13/13 PASS
- suíte unitária completa: 270/270 PASS
- lint: 0 erros; 6 avisos históricos
- typecheck: PASS
- build Next: PASS
- C-001, C-002, Prequote, C-005, Home Catalog e Product Detail: PASS

Decisões:
- política ES/+34, OTP de 6 dígitos, TTL 300s, cooldown 60s e cinco tentativas persistida
- SMS permanece SIMULATED, sem credencial ou chamada externa
- OTP usa salt por desafio, scrypt e comparação constante
- sessão opaca tem 256 bits; somente SHA-256 é persistido; expiração absoluta de 30 dias
- OpenAPI, endpoints, UI, application, catálogo, reserva e produção permanecem inalterados

Riscos e pendências:
- fundação restrita a desenvolvimento/testes SQLite
- nenhuma rota pública, cookie, JWT, middleware bearer ou SMS real existe
- C-003, C-004 e checkout continuam fora do escopo
- PR #15 deve permanecer draft e sem merge até autorização específica

NEXT_EXACT_STEP = revisar o PR #15 e não iniciar outra camada sem novo change-set explícito
RECOMMENDED_COMMAND = AUTORIZO_REVISAR_HIELYA_PR_15_CUSTOMER_AUTHENTICATION_FOUNDATION_GATE
RECOMMENDED_MODEL = GPT-5.6 Terra
RECOMMENDED_EFFORT = Médio
## Atualização — PR #15 Customer Authentication Security and Architecture Correction

UNIDADE_CONCLUÍDA = correção de segurança e arquitetura da fundação interna de autenticação
PR = #15, OPEN / DRAFT / NOT MERGED
PARENT_SHA = 970b6ae295ff205d214afe6fe4f24ff073fcde27
HEAD_FINAL_REMOTE = 511577e5394478974fc167abec331ae559442b90
WORKFLOW_RUN = 31343260862, SUCCESS

Arquivos alterados:
- .dev-migrations/0004_mvp_local_36_customer_authentication_foundation.sql
- packages/persistence/src/customer-auth.ts
- scripts/validate-mvp-local-36-customer-authentication-foundation.mjs
- tests/unit/mvp-customer-authentication-foundation.test.ts

Testes e resultados:
- testes focados de autenticação: 15/15 PASS
- suíte unitária completa: 274/274 PASS
- validator do Gate e validator de schema persistente: PASS
- lint: 0 erros; 6 avisos históricos
- typecheck: PASS
- build Next: PASS
- CI remoto: 5/5 jobs SUCCESS
- C-001, C-002, Prequote, C-005, Home Catalog e Product Detail: PASS
- gate summary: SUCCESS

Decisões:
- o cooldown de 60 segundos continua válido após LOCKED e impede reiniciar o orçamento de cinco tentativas
- scrypt e despacho de SMS simulado não executam dentro de BEGIN IMMEDIATE
- entregas simuladas possuem ciclo auditável PENDING, DELIVERED e FAILED
- falha de entrega supersede o desafio com compensação fail-closed e permite retry seguro
- fontes de entropia devem retornar exatamente 16 bytes para salt OTP e 32 bytes para token de sessão
- OpenAPI, UI, endpoints públicos, dependências e migrations 0001–0003 permanecem inalterados

Riscos e pendências:
- fundação continua restrita a desenvolvimento/testes SQLite
- SMS continua simulado; não existe provider real, credencial, rota pública, cookie ou middleware bearer
- PR #15 deve permanecer draft e sem merge até autorização específica
- nenhuma próxima camada funcional foi iniciada

RECOVERY_PATCH = /workspace/scratch/dcce1e1b12b6/recovery/HIELYA_PR15_CUSTOMER_AUTH_SECURITY_ARCHITECTURE.patch
RECOVERY_PATCH_SHA256 = 69fd7684fb81c4c35b733047a362a1064c78c42c2a63a6147d2249b4e017857e
NEXT_EXACT_STEP = revisar o PR #15 corrigido e não iniciar outra camada sem novo change-set explícito
RECOMMENDED_COMMAND = AUTORIZO_REVISAR_PR_15_CUSTOMER_AUTHENTICATION_SECURITY_AND_ARCHITECTURE
RECOMMENDED_MODEL = GPT-5.6 Terra
RECOMMENDED_EFFORT = Médio
