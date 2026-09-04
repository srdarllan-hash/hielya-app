# HIELYA CHECKPOINT OFICIAL

Versão: 3.1
Data e hora: 2026-08-09 23:32 Europe/Dublin
Tipo: Extraordinário estrutural e certificação de Gate
Checkpoint anterior: HIELYA_CHECKPOINT_2026-08-09_v3.0.md
Repositório: srdarllan-hash/hielya-app

## 1. Resumo executivo

A fundação de invariantes e lifecycle de reservas de estoque do MVP Local 36 foi implementada e certificada no PR #13. O Gate adiciona migration 0003, TTL persistido de 600 segundos, reservas genéricas para produtos unitários e composites, múltiplos itens e quantidades, fingerprint determinístico, idempotência, liberação, expiração, conversão, movimentos auditáveis e testes multi-conexão SQLite.

Nenhuma alteração foi feita em OpenAPI, API pública, UI, catálogo comercial, autenticação, carrinho, checkout, pedidos, pagamentos, Admin, produção ou main.

## 2. Estado certificado

CURRENT_GATE = INVENTORY_RESERVATION_INVARIANTS_AND_LIFECYCLE_FOUNDATION_GATE_CERTIFIED
ISSUE = #12 — OPEN
PR = #13 — OPEN / DRAFT
BRANCH = hielya/mvp-local-36-inventory-reservation-lifecycle-foundation
PARENT_BRANCH = hielya/mvp-local-36-c002-prequote-continuation-contract
PARENT_SHA = 01afcd0891b2b1da6c5bb595b9387300e3a4366f
CERTIFIED_SHA = 970b6ae295ff205d214afe6fe4f24ff073fcde27
WORKFLOW_RUN_ID = 31338842653
CI_STATUS = SUCCESS
COMMITS_OVER_PARENT = 3
MAIN_CHANGED = FALSE
MERGE_PERFORMED = FALSE
NEXT_LAYER_STARTED = FALSE

## 3. Entregas concluídas

- Migration `.dev-migrations/0003_mvp_local_36_inventory_reservation_lifecycle.sql`, aditiva, forward-only e limitada a desenvolvimento/testes.
- Campos de lifecycle: `expires_at`, `released_at`, `converted_at`, `release_reason`, `request_fingerprint`, `updated_at`.
- TTL persistido em `operational_settings.inventory_reservation_ttl_seconds`, valor inicial 600.
- Ligação auditável de `inventory_movements` à reserva por `reservation_id`.
- Backfill determinístico de reservas legadas com namespace `legacy-v1:`.
- Fingerprint de novas requisições com namespace `request-v1:`.
- Operação genérica de reserva para UNIT e COMPOSITE.
- Suporte a múltiplos itens, múltiplas quantidades e agregação de componentes compartilhados.
- `reserveBundle` preservado como wrapper compatível.
- Operações de release manual, expiração e conversão.
- Conversão idempotente com movimentos negativos e correlation ID comum.
- Reservas vencidas deixam de reduzir disponibilidade mesmo antes do sweep explícito.
- Bloqueio de ajustes que colocariam on-hand abaixo das reservas ativas.
- Quantidades inteiras exigidas em saldos, itens e movimentos.
- Testes de migration, lifecycle, rollback, idempotência e concorrência multi-conexão.

## 4. Correção de governança do CI

O primeiro workflow falhou porque a regressão visual congelada do C-002 Delivery Quote Alignment foi executada sobre o SHA filho, embora aquele baseline pertença ao SHA certificado do PR #9.

Foi autorizado um terceiro commit exclusivamente de CI/governança:

THIRD_COMMIT_SHA = 970b6ae295ff205d214afe6fe4f24ff073fcde27
THIRD_COMMIT_MESSAGE = ci(inventory): run frozen C-002 alignment at certified SHA
THIRD_COMMIT_FILES =
- .github/workflows/mvp-local-36-inventory-reservation-lifecycle-foundation-gate.yml
- scripts/validate-mvp-local-36-inventory-reservation-lifecycle.mjs

A regressão Alignment passou a executar no SHA `60d556e5ae088f2bf98101dcf37cbf854bcc2eff`, enquanto a regressão Prequote Continuation continuou no SHA filho. Nenhuma baseline, snapshot, migration, teste de produto ou código de produção foi alterado no terceiro commit.

## 5. Validações certificadas

- Persistence validation: SUCCESS
- Migration vazia/existente/reexecução: SUCCESS
- Lifecycle e idempotência: SUCCESS
- Concorrência SQLite multi-conexão: SUCCESS
- Full unit regression: SUCCESS
- Lint: SUCCESS
- Typecheck: SUCCESS
- Next build: SUCCESS
- C-001 regression: SUCCESS
- C-002 frozen regression: SUCCESS
- C-002 Delivery Quote Alignment frozen regression: SUCCESS
- C-002 Prequote Continuation regression: SUCCESS
- C-005 frozen regression: SUCCESS
- Home Catalog regression: SUCCESS
- Product Detail regression: SUCCESS
- Gate summary: SUCCESS

## 6. Arquivos alterados no Gate

- `.dev-migrations/0003_mvp_local_36_inventory_reservation_lifecycle.sql`
- `.github/workflows/mvp-local-36-inventory-reservation-lifecycle-foundation-gate.yml`
- `packages/persistence/src/index.ts`
- `scripts/validate-mvp-local-36-inventory-reservation-lifecycle.mjs`
- `scripts/validate-mvp-persistence-schema.mjs`
- `tests/unit/mvp-catalog-read-model.test.ts`
- `tests/unit/mvp-inventory-reservation-concurrency.test.ts`
- `tests/unit/mvp-inventory-reservation-lifecycle.test.ts`
- `tests/unit/mvp-persistence.test.ts`

## 7. Regras canônicas preservadas

- Composites não possuem estoque próprio.
- Estoque público continua sem quantidades numéricas.
- OpenAPI V1.0 e MVP Local 36 V1.1 permanecem inalterados.
- Catálogo canônico e dados comerciais permanecem inalterados.
- 36 SKUs MVP continuam pausados.
- 30 SKUs permanecem adiados.
- Zero SKUs comercialmente ativos.
- Produção, merge e main permanecem bloqueados.

## 8. Riscos e limitações remanescentes

- Persistência continua em SQLite apenas para desenvolvimento/testes.
- Nenhum worker, cron ou scheduler executa `expireDueReservations`; a disponibilidade já ignora reservas vencidas, mas a limpeza automática pertence a Gate futuro.
- O handle interno `db` permanece acessível e poderá permitir bypass das invariantes se uma camada futura escrever SQL diretamente; futuras camadas de escrita devem usar operações estreitas de persistência.
- Os testes de concorrência comprovam comportamento determinístico multi-conexão SQLite, não equivalem a validação de PostgreSQL ou carga de produção.
- Carrinho, checkout, pedidos e pagamentos ainda não existem.

## 9. Próxima etapa recomendada

RECOMMENDED_NEXT_PHASE = CUSTOMER_AUTHENTICATION_CONTRACT_AND_PERSISTENCE_FOUNDATION

Antes de C-003 Login e C-004 OTP consumirem autenticação real, deve ser definido e implementado um Gate estreito para:

- normalização e validação de telefone;
- política de OTP;
- persistência segura de desafio e tentativas;
- sessão de cliente;
- provider SMS simulado;
- proteção contra replay e abuso;
- ausência de SMS real, pagamento, produção ou navegação futura.

A próxima implementação deve ocorrer em nova Issue e branch filha do SHA certificado `970b6ae295ff205d214afe6fe4f24ff073fcde27`.

## 10. Decision Log

- Reserva ativa = `status = ACTIVE` e `expires_at > now`.
- Expiração = `RELEASED / EXPIRED`.
- Liberação voluntária = `RELEASED / MANUAL`.
- Conversão = `CONVERTED`, decrementando on-hand uma única vez.
- TTL inicial persistido = 600 segundos.
- Fingerprint novo = `request-v1:`; legado = `legacy-v1:`.
- Terceiro commit excepcional autorizado exclusivamente para corrigir topologia de CI.
- PR #13 permanece draft e sem merge.

## 11. Continuidade

Para continuar:

1. usar o SHA `970b6ae295ff205d214afe6fe4f24ff073fcde27` como base;
2. não alterar PRs certificados anteriores;
3. criar Issue antes da próxima branch;
4. executar apenas o change-set autorizado;
5. manter merge e main bloqueados;
6. não iniciar carrinho ou checkout antes da autenticação e sessão estarem definidas;
7. preservar as invariantes de reserva em qualquer futura camada de escrita.

CHECKPOINT_STATUS = COMPLETE
PROJECT_CHANGES_FROM_CHECKPOINT = DOCUMENTATION_ONLY_IN_GOOGLE_DRIVE
