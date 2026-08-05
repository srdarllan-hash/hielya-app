# ADR: OpenAPI executável do MVP Local 36 V1.1

- Status: Aceito para validação contratual
- Perfil: `MVP_LOCAL_36`
- Contrato derivado: `contracts/openapi/HIELYA_OPENAPI_MVP_LOCAL_36_V1_1.yaml`
- Baseline imutável: `contracts/openapi/HIELYA_OPENAPI_V1_0.yaml`
- SHA-256 da baseline: `a2c027c6294b44c94cf4be21d18fbd251b0323102e3c9ba2cba912a96d810ae9`

## Contexto

O OpenAPI V1.0 é o contrato original do HIELYA Master Package Work-Ready V1.1. O change-set do MVP Local 36 reduz o escopo público, mantém a operação local e exige DTOs públicos que não revelem quantidades de estoque.

Foram encontrados três conflitos entre nomes propostos durante o planejamento e as rotas do OpenAPI V1.0. O planejamento citava `GET /catalog`, `GET /products/{id}` e `POST /checkout/validate`, enquanto a baseline define `GET /catalog/products`, `GET /catalog/products/{productId}` e `POST /carts/{cartId}/validate`.

Além disso, o schema `Product` original expõe `availableQuantity` diretamente no catálogo e indiretamente dentro da validação do carrinho. Essa exposição é incompatível com o contrato público do MVP Local 36.

## Decisão

1. O OpenAPI V1.0 permanece intacto porque é evidência da baseline original e referência auditável para alterações futuras.
2. Um contrato derivado com versão interna `1.1.0` é criado para o perfil `MVP_LOCAL_36`.
3. As rotas oficiais da baseline prevalecem. Não serão criadas rotas paralelas para catálogo, produto ou validação de checkout.
4. O catálogo usa schemas públicos próprios: `PublicCategory`, `PublicProduct`, `PublicProductPage`, `PublicBundleComponent` e `PublicAvailability`.
5. `availableQuantity` e outros campos operacionais são removidos somente dos DTOs públicos. DTOs internos e administrativos permanecem fora deste contrato público e não são alterados por esta decisão.
6. Packs não possuem estoque próprio no contrato. `PublicBundleComponent.quantity` representa apenas a quantidade comercial incluída no pack, e `iceIncluded` é obrigatório e verdadeiro para packs.
7. `POST /delivery/quote` aceita somente coordenadas e tipo de endereço. Distância rodoviária e taxa são resultados calculados no servidor por uma futura porta de roteamento.
8. `POST /carts/{cartId}/validate` permanece no contrato com `customerBearer`, `cartId` e `addressId`, mas recebe `DEFERRED_AUTH_CART_LAYER`. A implementação depende de autenticação, carrinho e endereço persistidos.

## Consequências

O Gate atual autoriza apenas contrato, perfil, decisão e validação. Permanecem bloqueados serviços, handlers, autenticação, carrinho, pedidos, pagamentos, Admin, tracking, webhooks, frontend, deploy, produção, merge e alteração da `main`.

O contrato V1.1 somente se torna executável para implementação após todos os checks deste Gate concluírem com sucesso.
