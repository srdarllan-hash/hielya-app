# ADR: Public Service/API Layer do MVP Local 36

- Status: Aceito para o Gate Public Service/API
- Base certificada: `f1a533a3e4bcf76ea5634979536e58445432bb11`
- Contrato executável: `contracts/openapi/HIELYA_OPENAPI_MVP_LOCAL_36_V1_1.yaml`
- Arquitetura: `MODULAR_TYPESCRIPT_MONOLITH`
- Runtime: Next.js em Node.js
- Host: `apps/ui-lab`
- Base HTTP: `/api/v1`
- Produção: bloqueada

## Contexto

O Gate anterior completou o read model persistente e aprovou `apps/ui-lab` como o único host HTTP. O contrato OpenAPI MVP Local 36 V1.1 autoriza quatro operações públicas sem autenticação. Este Gate materializa somente essas consultas e a cotação simulada, mantendo catálogo, inventário e configurações sem mutação.

O OpenAPI V1.0 permanece congelado como baseline. O OpenAPI MVP Local 36 V1.1 permanece congelado como contrato executável e não será alterado para acomodar a implementação.

## Decisão

1. `routeHandlersAuthorized` passa a ser `true` exclusivamente para os quatro Route Handlers listados neste ADR e no perfil arquitetural.
2. `apiImplementationAuthorized` e `serviceLayerAuthorized` passam a ser `true` exclusivamente para esta camada pública somente leitura.
3. O runtime dos Route Handlers é `nodejs`, porque o adaptador persistente certificado usa APIs Node e não é compatível com Edge Runtime.
4. Casos de uso e portas ficam em `packages/application`, sem dependência de Next.js, React, SQLite ou do host.
5. Adapters persistentes somente leitura ficam em `packages/persistence` e implementam portas explícitas da aplicação.
6. `apps/ui-lab` faz somente a composição HTTP: valida a entrada, propaga ou cria `correlationId`, chama serviços e converte resultados em respostas do contrato.
7. Nenhuma regra comercial ou consulta SQL pode residir nos Route Handlers.
8. Nenhuma segunda aplicação, microserviço ou runtime paralelo é autorizado.

## Route Handlers autorizados

| Método | Rota contratual | Arquivo |
|---|---|---|
| `GET` | `/catalog/categories` | `apps/ui-lab/app/api/v1/catalog/categories/route.ts` |
| `GET` | `/catalog/products` | `apps/ui-lab/app/api/v1/catalog/products/route.ts` |
| `GET` | `/catalog/products/{productId}` | `apps/ui-lab/app/api/v1/catalog/products/[productId]/route.ts` |
| `POST` | `/delivery/quote` | `apps/ui-lab/app/api/v1/delivery/quote/route.ts` |

Não são autorizados `GET /catalog`, `GET /products/{id}`, `POST /checkout/validate` nem qualquer Route Handler fora da lista acima. `POST /carts/{cartId}/validate` permanece `DEFERRED_AUTH_CART_LAYER`.

## Semântica das consultas de catálogo

- `category` resolve por `id` UUID persistido ou por `slug` persistido, sem gerar identificadores durante a requisição.
- `q` pesquisa somente `sku` e `name`, sem diferenciar maiúsculas e minúsculas.
- `availableOnly=true` retorna somente produtos cujo estado público derivado seja `AVAILABLE`.
- categoria, visibilidade, ordenação, preço, limite por pedido, álcool e composição vêm da persistência certificada.
- packs não possuem estoque próprio; sua disponibilidade deriva de todos os componentes reais.
- o mapeamento HTTP usa `bundleComponents`, conforme o OpenAPI, sem expor a representação interna `components`.
- nenhum SKU `PAUSED` ou `DEFERRED_AFTER_MVP` é promovido a ativo por esta camada.

Como todos os 66 produtos permanecem comercialmente inativos na base certificada, o catálogo persistente inicial pode ser publicamente vazio. Isso é uma consequência deliberada do bloqueio de ativação comercial, não autorização para inventar dados ou alterar status.

## Cotação simulada

`POST /delivery/quote` recebe somente `latitude`, `longitude` e o `addressType` opcional previsto no contrato. Distância, preço final, taxa por quilômetro, raio e elegibilidade nunca são aceitos do cliente.

A aplicação usa uma `RoutingDistancePort` injetável para obter apenas a distância rodoviária e lê taxa-base, valor por quilômetro e raio máximo das configurações persistidas. Nenhum Google Maps, provedor real, token ou credencial é autorizado. Adapters determinísticos são permitidos somente em testes e desenvolvimento.

Falha de roteamento, configuração ausente ou dependência interna indisponível é convertida em `PublicError` com código `CONFIGURATION_UNAVAILABLE` e HTTP 400, única forma controlada admitida pelo contrato atual. Endereço acima do raio retorna `OUT_OF_AREA` e HTTP 400. Stack trace, SQL, caminho interno e detalhes de inventário não são expostos.

## Segurança e privacidade

- DTOs públicos não contêm estoque físico, reservado, disponível ou restante, custo, margem, lotes, movimentos ou dados técnicos de reservas.
- entrada desconhecida ou inválida é rejeitada antes do serviço de aplicação;
- payloads possuem limite técnico explícito;
- logs estruturados não registram coordenadas, estoque, segredos, tokens ou dados pessoais;
- respostas de erro carregam código estável, mensagem segura, campo quando aplicável e `correlationId`;
- nenhuma credencial real, autenticação, OTP ou sessão de cliente é criada;
- nenhum Route Handler acessa diretamente `node:sqlite` ou `packages/persistence` para executar regra comercial.

## Ausência de mutações

Esta camada não reserva, libera ou converte estoque; não cria ou altera carrinho; não cria pedido, pagamento ou PIN; não ativa produtos; não altera configurações; não chama Stripe; não chama mapa real; não executa deploy.

## Dependências permitidas

- `apps/ui-lab` pode depender de `packages/application` e do ponto de composição do adapter persistente.
- `packages/persistence` pode implementar portas tipadas definidas por `packages/application`.
- `packages/application` pode depender apenas de contratos, domínio e portas sem framework.

## Dependências proibidas

- `packages/application` não depende de `next`, `react`, `apps/ui-lab` ou `node:sqlite`.
- `packages/persistence` não depende de Next.js, React, objetos HTTP ou componentes de UI.
- `packages/ui` não depende de persistência.
- Route Handlers não importam drivers SQLite nem contêm cálculo comercial.
- dependências circulares, segunda aplicação e microserviços permanecem proibidos.

## Consequências e limites

Os quatro endpoints podem ser testados contra portas fakes sem ativar catálogo comercial. A composição runtime sem banco de desenvolvimento explicitamente configurado ou sem adapter de roteamento autorizado deve falhar de forma controlada com `CONFIGURATION_UNAVAILABLE`; ela não pode criar silenciosamente uma base em memória com dados inventados.

Autenticação, carrinho, validação de carrinho, checkout, C-003, C-004, pedidos, pagamentos, Admin, frontend completo, tracking, mapas reais, webhooks, deploy, produção, merge e alteração da `main` continuam bloqueados.
