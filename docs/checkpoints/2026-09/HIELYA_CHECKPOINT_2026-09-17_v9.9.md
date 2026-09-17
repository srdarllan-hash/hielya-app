# HIELYA CHECKPOINT v9.9 — CUSTOMER_ORDER_HTTP_CONTRACT_ALIGNMENT

Data do evento: 2026-09-17. Registro criado no repositório.
Checkpoint anterior: v9.8 (`CUSTOMER_ORDER_HTTP_TRANSPORT_CANDIDATE`), preservado
integralmente. Branch `hielya/orders-http-transport`, PR #79, empilhada sobre o PR #76.
Base desta correção: `5986290d3318076900e034f2978a44dec5abfc90`.

## Estado verificado

Foi realizada nova leitura de `CLAUDE.md`, política e índice de checkpoints, v9.8, ADRs do
transporte de pedidos, sessão e carrinho, código de aplicação/persistência, contrato OpenAPI,
testes, branch, histórico, PRs e checks remotos. A implementação de v9.8 permanece aderente às
decisões registradas: autenticação somente pelo cookie, reconfirmação via `CartService`,
revalidação de sessão após I/O assíncrono, criação exclusivamente em `AWAITING_PAYMENT` e
álcool fechado sem snapshot autoritativo.

O PR #79 não recebe os checks normais enquanto sua base for a branch do PR #76, pois os
workflows do repositório filtram pull requests para `main`. O check GitHub Advanced Security
falhou por licença ausente do Copilot (HTTP 403), não por achado de código. As falhas locais
globais de Windows continuam idênticas às registradas no v9.8 e têm correção separada no PR
#77.

## Divergência corrigida

O contrato `HIELYA_OPENAPI_ORDERS_HTTP_V1_6.yaml` define `orderId` como UUID. O handler de
`GET /api/v1/orders/{orderId}` encaminhava qualquer string para `findOwned`, tratando um
identificador sintaticamente inválido como objeto ausente. O transporte agora devolve 400
`INVALID_REQUEST` antes de consultar o repositório. Foi adicionado teste que comprova tanto a
resposta quanto a ausência de lookup. Domínio, persistência, migrations, segurança e demais
contratos permanecem inalterados.

## Validação

- testes focados de transporte/arquitetura: **30/30 PASS**;
- suíte unitária completa: **604/605 PASS**; a única asserção falha usa separador POSIX em
  Windows e uma suíte reporta `EPERM` ao remover diretório temporário, ambas pré-existentes e
  cobertas pelo PR #77;
- `tsc --noEmit`: **PASS**;
- ESLint nos arquivos do change-set: **PASS** (somente aviso preexistente de configuração de
  Pages);
- `git diff --check`: **PASS**;
- guard de histórico imutável entre a base do PR e v9.8: **PASS**.

O lint global continua bloqueado por artefatos `.next` já presentes; `audit:all` continua
bloqueado por baseline arquitetural anterior. Nenhum gate foi reduzido ou alterado.

## Pendências preservadas

- PR #76 deve ser integrado antes do PR #79, ou a base do #79 deve ser atualizada depois disso.
- A implementação de `authorize(actorId, role, order)` e a decisão sobre o principal de
  pagamento/operador continuam fora do escopo e dependem da decisão de segurança já registrada.
- A divergência de progressão de estados entre `CLAUDE.md` e o domínio continua aberta; este
  checkpoint não escolhe um vencedor sem decisão arquitetural.
- CI completa deve certificar o SHA final quando o PR passar a ter `main` como base.
