# HIELYA CHECKPOINT v9.8 — CUSTOMER_ORDER_HTTP_TRANSPORT_CANDIDATE

Data e hora do evento: 2026-09-17 (Europe/Madrid). Registro criado no repositório.
Checkpoint anterior: v9.7 (`CLIENT_SESSION_HTTPONLY_COOKIE_CANDIDATE`), preservado integralmente.
Autorização: Issue #78. Branch `hielya/orders-http-transport`, **empilhada** sobre
`hielya/session-httponly-cookie` (PR #76, não mergeado). Base de `main`:
`6251c0b99376daac3a86b20156fa44d22229a09f`.

## Resumo executivo

O domínio de pedidos já estava construído, persistido e certificado — `OrderFoundation`
(`create`, `findOwned`, `advance`), `SqliteOrderFoundationRepository`, migrations 0005–0007 e
`tests/unit/mvp-order-foundation.test.ts` — porém **sem superfície HTTP alguma**. Esta entrega
expõe os dois endpoints do cliente, fechando a última lacuna entre "carrinho com reserva" e
"pedido existe".

O contrato V1.3 já especificava ambos os caminhos (`createAlcoholAwareOrder`,
`getAlcoholAwareOrder`). Esta entrega ativa transporte de contrato já especificado; não desenha
comportamento comercial novo.

## Autorização e o guard de allowlist

`tests/unit/mvp-local-36-api-host-architecture.test.ts` exige que os arquivos de rota sejam
**exatamente iguais** a `AUTHORIZED_ROUTE_HANDLERS`, e que cada rota seja rastreável a um ADR.
Adicionar `/orders` o quebra por design.

O agente executor implementou o transporte e **parou sem editar a allowlist**, citando
`docs/automation/AGENT_PROTOCOL.md`: *"Automation cannot change its own allowlist, policy,
budgets, guards or required checks."* Foi a conduta correta — editar a própria lista de rotas
autorizadas é exatamente o que o guard existe para impedir.

A entrada só foi adicionada depois da autorização nominal do proprietário na Issue #78,
seguindo o precedente da Issue #56 (carrinho, cujo comentário na allowlist diz *"no
orders/payment"*) e da Issue #75 (sessão). Além de entrar na lista, as duas rotas ganharam
checagem de rastreabilidade ao ADR — o guard ficou mais forte, não mais frouxo.

## Implementação

Novos arquivos em `apps/ui-lab`:
- `order-checkout.ts` — `MaterializedCheckoutSource`, a implementação de
  `AuthoritativeCheckoutSource` cuja ausência (*"No HTTP implementation exists yet"*, escrito
  no próprio `order-foundation.ts`) bloqueou a tentativa anterior.
- `order-http.ts` — transporte. Cliente resolvido **apenas** do cookie de sessão, nunca de
  campo da requisição. Revalida a sessão após o `await` da validação assíncrona, de modo que
  uma revogação naquela janela não passe.
- `order-container.ts` — composição espelhando `cart-container.ts`.
- `apps/ui-lab/app/api/v1/orders/route.ts` e `[orderId]/route.ts` — finos.
- `contracts/openapi/HIELYA_OPENAPI_ORDERS_HTTP_V1_6.yaml`. V1.0–V1.5 inalterados.
- `docs/decisions/ADR-CUSTOMER-ORDER-HTTP-TRANSPORT.md`.

## Reconfirmação autoritativa — decisão do proprietário

A criação do pedido precisa reconfirmar elegibilidade de 4 km, mínimo de €25 e taxa de entrega.
Isso depende da chamada de roteamento, assíncrona, enquanto o domínio proíbe I/O de rede dentro
da transação. Decidido: reconfirmar **antes** de abrir a transação, reusando
`CartService.validate` sem `reserveKey`, e materializar o `CheckoutContext` para o source
síncrono. Sem migration.

**Nenhuma regra comercial foi reimplementada.** As violações (`EMPTY_CART`,
`MINIMUM_NOT_REACHED`, `OUTSIDE_AREA`, `PUBLIC_SPACE_BLOCKED`, `STORE_CLOSED`,
`ALCOHOL_CUTOFF`, `OUT_OF_STOCK`) continuam vindo do serviço de carrinho certificado, e
resultam em 409 sem criar pedido.

Janela residual de obsolescência aceita, limitada por três mecanismos independentes: reserva de
10 minutos; checagem de `expectedCartRevision` dentro de `create`; e o repositório relendo preço
e flag de álcool de `product_commercial_data` dentro da transação, além de verificar a
composição da reserva — nunca confiando no adaptador nem no cliente.

## Álcool

Nenhuma mudança. O domínio já pula todo o caminho de álcool quando nenhum item tem
`containsAlcohol`, e falha fechado quando algum tem sem snapshot aceito válido. Preservado
exatamente; `acceptedSnapshot` materializado é sempre `null`. Sem bypass, sem snapshot padrão.

## Autoria e revisão

Implementado por **GPT-5.6 Sol via Codex CLI 0.154.0**, execução local com sandbox
`workspace-write`, a partir de especificação escrita nesta sessão. Revisado e validado por
Claude. Execução local assistida, **não** o controlador da Issue #72: nenhum workflow despacha
Codex, não há ledger persistente, `/orquestrar-hielya` segue BLOCKED, nenhum papel ou contrato
de automação mudou.

Registro honesto do processo: **três versões da especificação foram recusadas pelo executor
antes desta**, e as três recusas estavam certas.
1. A primeira alegava "somente transporte e composição", ignorando que
   `AuthoritativeCheckoutSource` não tinha implementação nenhuma.
2. A segunda exigia eliminar uma diferença de tempo entre "pedido inexistente" e "pedido de
   outro cliente" que mora dentro de código certificado que a própria especificação proibia
   alterar — contradição interna. A diferença existe de fato (`findOwned` carrega o agregado
   antes de checar o dono), mas explorá-la exigiria adivinhar um UUID v4 e medir diferença
   sub-milissegundo remotamente; foi aceita e documentada como fora de escopo, sem mascaramento
   artificial.
3. A terceira parou no guard de allowlist descrito acima.

As duas primeiras recusas decorreram de o autor da especificação presumir o estado do
repositório sem verificá-lo antes. A prática foi corrigida: investigar o código antes de
escrever cada ordem — foi assim que se descobriu que `CartService.validate` já resolvia todas as
regras comerciais, encolhendo a tarefa.

Adição do revisor sobre o resultado do executor: nenhuma correção de defeito foi necessária
nesta rodada. O executor incluiu por iniciativa própria a revalidação de sessão pós-`await`,
que não constava da ordem.

## Validação

Executada por Claude, independentemente do relatório do executor:
- `pnpm exec vitest run tests/unit`: **603/604**, incluindo 26 testes novos de transporte de
  pedido e o guard de arquitetura já passando com a allowlist autorizada. A única falha e o
  único erro de suíte restantes são as duas falhas pré-existentes exclusivas de Windows
  (`mvp-persistence`, separador de caminho; `mvp-public-api-integration`, `EPERM`), endereçadas
  no PR #77 e idênticas às observadas em `main`.
- `pnpm exec tsc --noEmit`: limpo.
- `pnpm exec eslint` nos arquivos novos: limpo. O `eslint .` completo acusa erros em saída
  gerada `.next/`, efeito do glob corrigido no PR #77, não desta branch.
- Constraints verificadas: `packages/application/src/orders/**`,
  `packages/application/src/cart/**`, `packages/persistence/src/order-foundation.ts`,
  migrations e contratos V1.0–V1.5 **byte a byte intactos**; nenhum checkpoint histórico,
  `CLAUDE.md`, workflow ou secret tocado.
- **Não executado**: suítes Playwright — exigem browser e servidor; ficam para a CI. Nenhuma
  alegação sobre elas é feita aqui.

## Pendências e próximos passos

- Este PR empilha sobre o PR #76. O #76 precisa ser mergeado primeiro.
- Merge requer revisão e aprovação de PR específica do proprietário.
- **Próximo bloqueador do caminho crítico**: `authorize(actorId, role, order)` não tem
  implementação para os principais OPERATOR, COURIER e PAYMENT. Sem ele não há pagamento
  (2C) nem visão do operador (3B), e um pedido nasce em `AWAITING_PAYMENT` sem caminho de
  saída. Decisão de segurança pendente do proprietário; recomendação registrada em sessão foi
  o operador confirmar o pagamento manualmente, exigindo apenas o principal OPERATOR.
- Divergência documentada, não resolvida: `CLAUDE.md` descreve a progressão canônica como
  `AWAITING_PAYMENT → PAYMENT_AUTHORIZED → AWAITING_PICKING → PREPARING → DELIVERY`, enquanto
  o código implementa `AWAITING_PAYMENT → PAYMENT_AUTHORIZED → PREPARING → READY →
  OUT_FOR_DELIVERY`. Reportado sem escolher vencedor, conforme a governança exige.

## Confirmação de alterações

- `main`: NÃO alterada. PR será aberto como draft; NÃO mergeado.
- Produção, secrets, ruleset, migrations, workflows existentes: NÃO alterados.

## Revisão para publicação pública

Apenas decisões técnicas, caminhos, identificadores públicos e resultados de teste. Sem
credenciais, chaves, pepper, valores de OTP, tokens de sessão ou dados pessoais.
