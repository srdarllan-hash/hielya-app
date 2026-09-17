# ADR: Transporte HTTP de pedidos do cliente

- Status: Aceito para o escopo autorizado em desenvolvimento/teste, [Issue #78](https://github.com/srdarllan-hash/hielya-app/issues/78)
- Base: `main` `6251c0b99376daac3a86b20156fa44d22229a09f`, empilhado sobre a sessão em cookie ([Issue #75](https://github.com/srdarllan-hash/hielya-app/issues/75))
- Contrato: `contracts/openapi/HIELYA_OPENAPI_ORDERS_HTTP_V1_6.yaml`
- Produção: bloqueada

## Contexto

O domínio de pedidos já estava construído, persistido e certificado — `OrderFoundation`
(`create`, `findOwned`, `advance`), `SqliteOrderFoundationRepository`, migrations 0005–0007 e
`tests/unit/mvp-order-foundation.test.ts` — porém **sem superfície HTTP alguma**. Um cliente
não conseguia transformar um carrinho reservado em pedido.

O `HIELYA_OPENAPI_MVP_LOCAL_36_V1_3.yaml` já especificava os dois caminhos
(`createAlcoholAwareOrder`, `getAlcoholAwareOrder`). Esta decisão ativa o transporte de um
contrato já especificado; não desenha comportamento comercial novo.

## Decisão

Os únicos adaptadores HTTP de pedido autorizados por esta decisão são:

- `POST /api/v1/orders` em `apps/ui-lab/app/api/v1/orders/route.ts`.
- `GET /api/v1/orders/{orderId}` em `apps/ui-lab/app/api/v1/orders/[orderId]/route.ts`.

1. O cliente é resolvido **exclusivamente** do cookie de sessão da Issue #75, nunca de um
   campo da requisição. Ausência, expiração ou revogação resultam em 401.
2. `GET` devolve somente o pedido do próprio cliente, via `OrderFoundation.findOwned`. O
   pedido de outro cliente é indistinguível de um inexistente **na resposta**: mesmo status,
   mesmo corpo, mesmos cabeçalhos, sem ramo de transporte que os diferencie.
3. `POST` exige chave de idempotência, repassada como `key` de `OrderFoundation.create`. O
   replay é do domínio, já implementado.
4. O pedido nasce em `AWAITING_PAYMENT`. Nenhuma transição além disso é exposta.

## Reconfirmação autoritativa

A criação do pedido precisa reconfirmar elegibilidade de endereço (4 km), o mínimo de €25 e a
taxa de entrega. Isso depende da chamada de roteamento, que é assíncrona, enquanto o domínio
proíbe I/O de rede dentro da transação (`FoundationPorts`: *"No network I/O inside
transaction"*).

Decisão do proprietário: a rota reconfirma **antes** de abrir a transação, reusando
`CartService.validate` — que já implementa ownership, `roadDistance`, taxa, mínimo e todas as
violações (`EMPTY_CART`, `MINIMUM_NOT_REACHED`, `OUTSIDE_AREA`, `PUBLIC_SPACE_BLOCKED`,
`STORE_CLOSED`, `ALCOHOL_CUTOFF`, `OUT_OF_STOCK`) — e materializa o `CheckoutContext` para o
`AuthoritativeCheckoutSource` síncrono, em `apps/ui-lab/src/server/mvp-local-36/order-checkout.ts`.

**Nenhuma regra comercial é reimplementada.** A validação é chamada sem `reserveKey`, de modo a
reconfirmar sem criar segunda reserva nem consumir chave de idempotência. Violações resultam em
409 com a lista, sem criar pedido.

Janela residual de obsolescência, aceita e limitada por três mecanismos independentes: a
reserva de 10 minutos; a checagem de `expectedCartRevision` dentro de `OrderFoundation.create`;
e o `SqliteOrderFoundationRepository` relendo preço e flag de álcool de
`product_commercial_data` dentro da transação, além de verificar a composição da reserva —
explicitamente nunca confiando no adaptador nem no cliente. A rota também revalida a sessão
após o `await`, de modo que uma revogação durante a janela assíncrona não passe.

## Fronteiras

- Application e Persistence não ganham HTTP, Next.js nem React. O transporte vive em `apps/ui-lab`.
- `packages/application/src/orders/**`, `packages/application/src/cart/**` e
  `packages/persistence/src/order-foundation.ts` permanecem inalterados.
- Os Route Handlers são finos: delegam, sem regra de autenticação nem de negócio.
- Nenhuma migration é adicionada. `0001_mvp_local_36_persistence.sql` permanece byte a byte
  idêntico, incluindo `CHECK (commercially_active = 0)`.

## Álcool

Nenhuma mudança. O domínio já pula todo o caminho de álcool quando nenhum item tem
`containsAlcohol`, e falha fechado quando algum tem sem snapshot aceito válido
(`PROMISE_RECONFIRMATION_REQUIRED`). Preservado exatamente; sem bypass, sem snapshot padrão,
sem override. O `acceptedSnapshot` materializado é sempre `null`.

## Consequências

`OrderFoundation.advance()` e todos os endpoints `/admin/**` permanecem **fora do escopo**:
exigem implementação de `authorize(actorId, role, order)` para os principais OPERATOR, COURIER
e PAYMENT, que não existe e é decisão de segurança separada. Pagamento de qualquer natureza,
real ou simulado, permanece fora do escopo. UI de acompanhamento, admin, SMS real, produção,
deploy e merge permanecem fora do escopo.

Os contratos V1.0–V1.5 permanecem evidências imutáveis. O V1.6 é derivado e restrito a estes
dois caminhos.
