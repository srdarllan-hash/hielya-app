# ADR: Arquitetura do API host do MVP Local 36

- Status: Aceito como pré-requisito arquitetural
- Arquitetura: `MODULAR_TYPESCRIPT_MONOLITH`
- Runtime: `NEXTJS`
- Host HTTP: `apps/ui-lab`
- Base pública futura: `/api/v1`
- Produção: bloqueada

## Contexto

O repositório já possui uma única aplicação executável Next.js em `apps/ui-lab`. Os comandos `dev`, `build` e `start` do workspace apontam para essa aplicação, enquanto as responsabilidades compartilhadas permanecem organizadas em `packages/*`.

O próximo Gate da API pública precisará hospedar Route Handlers sem introduzir um segundo runtime, um microserviço ou lógica comercial dentro da camada HTTP. Este ADR formaliza o host e as fronteiras antes de qualquer endpoint ser implementado.

O nome `ui-lab` é histórico. Ele não altera a responsabilidade do aplicativo como host HTTP aprovado para o MVP. O aplicativo não será renomeado neste Gate; uma eventual renomeação exige autorização própria e não poderá alterar rotas, contratos ou baselines congeladas.

## Alternativas consideradas

### Criar uma segunda aplicação de backend

Rejeitada. Uma segunda aplicação duplicaria composição, configuração e operação, além de contrariar o monólito modular definido para o MVP.

### Criar um microserviço independente

Rejeitada. O MVP não possui necessidade operacional ou autorização para um runtime distribuído. A alternativa aumentaria dependências e risco de retrabalho sem resolver uma lacuna do Gate atual.

### Usar a aplicação Next.js existente

Aceita. `apps/ui-lab` já é o runtime executável do workspace e pode, em Gate posterior, fazer a composição HTTP dos casos de uso sem absorver regras comerciais.

## Decisão

1. A arquitetura aprovada é um monólito modular TypeScript: `MODULAR_TYPESCRIPT_MONOLITH`.
2. O runtime HTTP aprovado é o Next.js já existente: `NEXTJS`.
3. O único host HTTP aprovado é `apps/ui-lab`.
4. A base pública futura é `/api/v1`.
5. Os futuros Route Handlers deverão residir em `apps/ui-lab/app/api/v1/**/route.ts`.
6. Este Gate não autoriza Route Handlers. `routeHandlersAuthorized` permanece `false` até o Gate específico da API pública.
7. Uma segunda aplicação de runtime e microserviços permanecem proibidos.
8. Deploy e produção permanecem bloqueados.

## Estrutura e responsabilidades

### `apps/ui-lab`

- hospeda o runtime Next.js existente;
- será o ponto de composição HTTP quando um Gate posterior autorizar Route Handlers;
- converterá requisições e respostas HTTP para contratos de serviços de aplicação;
- não conterá regras comerciais nos Route Handlers;
- poderá depender de `packages/application` e `packages/ui` conforme a responsabilidade da composição;
- não realizará consulta direta ao banco a partir de componentes React.

### `packages/application` — futuro

- concentrará os futuros casos de uso e suas portas;
- deverá permanecer independente de Next.js;
- deverá permanecer independente de React e de componentes React;
- não poderá importar Route Handlers ou outros artefatos HTTP;
- receberá dependências por interfaces explícitas, sem acoplamento ao adaptador persistente.

Este pacote ainda não é criado por este Gate.

### `packages/persistence`

- mantém schema, migrações de desenvolvimento, consultas persistentes, estoque e configurações;
- implementará portas de persistência quando autorizado;
- não depende de HTTP, Next.js, Route Handlers ou objetos `Request` e `Response`;
- não depende de componentes React.

### `packages/ui`

- mantém componentes e telas;
- não consulta banco de dados diretamente;
- não importa `packages/persistence` nem adaptadores de banco;
- não contém regra de persistência.

### `contracts/openapi`

- mantém o contrato público versionado;
- não contém implementação operacional;
- não depende de runtime, banco ou componentes React.

## Dependências permitidas

- `apps/ui-lab` pode compor serviços de `packages/application` e componentes de `packages/ui`.
- `packages/application` pode depender de domínio e de portas abstratas sem dependências de framework web.
- adapters de persistência podem implementar portas definidas pela aplicação e ser injetados no ponto de composição.
- contratos OpenAPI podem ser lidos por validadores e testes, mas não executam regras comerciais.

## Dependências proibidas

- `packages/application` não pode depender de Next.js, React ou `apps/ui-lab`.
- `packages/persistence` não pode depender de HTTP, Next.js, React, `apps/ui-lab` ou `packages/ui`.
- `packages/ui` não pode depender de `packages/persistence`, drivers de banco ou SQL.
- Route Handlers não podem conter regras comerciais ou acessar diretamente o banco.
- dependências circulares entre `apps/*` e `packages/*` são proibidas.
- uma segunda aplicação de runtime e microserviços são proibidos para este MVP.

## Consequências

O próximo Gate da API pública poderá adicionar os Route Handlers contratualmente autorizados no host existente, mantendo regras e casos de uso fora da composição HTTP. A nomenclatura histórica `ui-lab` permanece sem mudança.

Este ADR não implementa endpoint, serviço de aplicação, porta de roteamento, autenticação, carrinho, pedido, pagamento ou frontend novo. Nenhum Route Handler é criado. Produção, deploy, merge e alteração da `main` permanecem bloqueados.

