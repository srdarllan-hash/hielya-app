# ADR — Projeção do catálogo para o carrinho em dev/test

Data: 2026-09-08. Issue [#56](https://github.com/srdarllan-hash/hielya-app/issues/56).
Estado: decisão autorizada pelo proprietário; implementação candidata sujeita à CI e revisão.

## Contexto e decisão

A migration 0001 exige `CHECK (commercially_active = 0)` e o catálogo público certificado permanece vazio. O proprietário autorizou disponibilizar somente os 30 produtos unitários e seis packs certificados em desenvolvimento/testes para implementar o carrinho. Não autorizou ativação comercial real.

Usar `DevTestCatalogAdapter`, projeção somente de leitura dos registros `PAUSED` certificados. Ela exige conjuntamente `HIELYA_DEV_TEST_CATALOG=1` e `NODE_ENV` igual a `development` ou `test`. A verificação ocorre no construtor e em cada leitura, inclusive em instâncias já criadas. `production`, ambiente desconhecido ou ausência de opt-in falham explicitamente com `DEV_TEST_CATALOG_PROHIBITED`.

A projeção reutiliza nomes, IDs, categorias, preços, limites, álcool e componentes persistidos. Não altera `commercially_active`, `public_visible`, preços, estoque ou migrations anteriores. Produtos `DEFERRED_AFTER_MVP` não entram na projeção. Sem opt-in, o adaptador canônico anterior continua sendo usado. Estoque precisa ser provisionado explicitamente no banco de desenvolvimento; a projeção não inventa disponibilidade.

O transporte do carrinho também mantém guard de produção em cada requisição. Runtime exige banco SQLite existente e migrado; não inicializa banco automaticamente nem usa banco de memória como fallback. Configuração de routing/SLA conserva as portas e simulações dev/test existentes; falha ou estimativa vencida não recebe um SLA otimista. Nenhuma integração real foi ativada.

## Contrato e limites

O contrato dedicado `contracts/openapi/HIELYA_OPENAPI_CART_RUNTIME_V1_4.yaml` especifica as rotas novas e substitui, somente para o carrinho deste escopo, a operação validate anteriormente deferred. Contratos V1.0/V1.3 permanecem intactos. Declara o formato corrente de carrinho, a revisão obrigatória nas mutações, o ID opaco anônimo, a vinculação autenticada, o endereço mínimo e a idempotência. Cupom e gorjeta não são entradas deste recorte; campos desconhecidos são recusados. Pedido e pagamento não foram ativados.

Carrinho anônimo usa o ID opaco como capacidade de acesso. Ele fica somente em memória no cliente. Após claim, a posse do ID não basta: a sessão autenticada deve pertencer ao cliente vinculado. Endereço pertence ao cliente da sessão, nunca a um customerId do body. Validação e reserva exigem autenticação; reserva revalida a sessão após routing e antes da transação que grava a reserva.

Reserva e edição usam a transação SQLite da fundação, com revisão e idempotência. Edição bem-sucedida cancela toda reserva ativa; comando inválido faz rollback. Expiração libera a reserva, mantém itens e nunca renova automaticamente. O mesmo idempotency key não renova uma reserva expirada/cancelada. Uma nova ação explícita usa chave nova e repete todas as regras. A referência ao endereço fica vinculada à reserva através do carrinho; uma reserva ativa não aceita trocar silenciosamente de endereço.

## Consequências e evidências

Testes verificam os 36 registros projetados, catálogo canônico vazio, soma de commercially_active igual a zero, CHECK ainda impedindo atualização, falha em produção inclusive após criação do adaptador, estoque/concorrência e ciclo de reserva. As alterações de inventário de rotas/migrations nos testes correspondem às novas rotas autorizadas e à migration aditiva 0008; não removem os hashes históricos nem as verificações de fronteira arquitetural.

O Gate de ativação comercial REAL permanece pendente. Esta decisão não autoriza produção, deploy, venda real, SMS real, alteração de preço/composição nem pagamento. Ver [KNOWN_DEBT](../KNOWN_DEBT.md), [escopo](../requirements/CART_RUNTIME_SCOPE.md) e os ADRs históricos de API e dados comerciais.
