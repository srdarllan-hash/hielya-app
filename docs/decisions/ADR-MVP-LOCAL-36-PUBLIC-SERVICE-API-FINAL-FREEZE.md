# ADR: Congelamento final da Public Service API do MVP Local 36

- Status: Aceito para o Gate de hardening e congelamento final
- SHA-base certificada: `fb35d2fd3e9cd4eb64be0c1196e22cc2d55003e6`
- PR: `#5`, mantido aberto e em rascunho
- Contrato executável: `contracts/openapi/HIELYA_OPENAPI_MVP_LOCAL_36_V1_1.yaml`
- Arquitetura: `MODULAR_TYPESCRIPT_MONOLITH`
- Runtime e host: Next.js em Node.js, `apps/ui-lab`
- Base HTTP: `/api/v1`
- Produção: não autorizada

## Contexto

A camada Public Service API foi certificada na SHA-base acima com quatro endpoints públicos somente leitura. A auditoria posterior identificou um risco de fronteira: o adapter público compunha DTOs a partir de objetos persistentes usando object spread. Embora os tipos atuais não expusessem dados internos, um campo acrescentado futuramente ao read model poderia atravessar a fronteira pública automaticamente.

Este Gate elimina esse acoplamento, comprova as respostas contra o OpenAPI congelado e encerra o crescimento funcional do PR `#5`. Nenhuma regra comercial, rota, migration, tela ou fonte canônica de dados é alterada.

## Decisão

1. `PublicCategory`, `PublicProduct`, `PublicBundleComponent` e as configurações de entrega usadas pela aplicação são produzidos por whitelists explícitas.
2. Object spread de objetos persistentes é proibido nos mapeamentos públicos.
3. Respostas representativas dos quatro handlers e os erros públicos `400` e `404` são validados automaticamente contra os schemas do OpenAPI MVP Local 36 V1.1.
4. Os testes rejeitam propriedades adicionais, campos internos e estoque numérico em qualquer profundidade da resposta pública.
5. O OpenAPI V1.0 e o OpenAPI MVP Local 36 V1.1 permanecem inalterados.
6. O catálogo canônico permanece deliberadamente vazio: 36 SKUs `PAUSED`, 30 SKUs `DEFERRED_AFTER_MVP` e zero SKU comercialmente ativo.
7. A fundação técnica e a API pública do PR `#5` ficam congeladas após a certificação deste Gate. Toda próxima implementação funcional exige branch filha e PR empilhado.

## Endpoints congelados

| Método | Rota contratual | Mutação | Autenticação |
|---|---|---:|---:|
| `GET` | `/catalog/categories` | Não | Não |
| `GET` | `/catalog/products` | Não | Não |
| `GET` | `/catalog/products/{productId}` | Não | Não |
| `POST` | `/delivery/quote` | Não | Não |

Nenhum endpoint adicional, rota paralela ou método HTTP é autorizado. `POST /carts/{cartId}/validate` permanece `DEFERRED_AUTH_CART_LAYER`.

## Fronteira pública explícita

### `PublicCategory`

Somente estes campos podem sair do adapter:

- `id`
- `slug`
- `name`
- `sortOrder`

### `PublicProduct`

Somente estes campos podem sair do adapter:

- `id`
- `sku`
- `name`
- `categoryId`
- `salePriceCents`
- `currency`
- `availability`
- `isPack`
- `iceIncluded`
- `maxPerOrder`
- `containsAlcohol`
- `minimumAge`
- `bundleComponents`

### `PublicBundleComponent`

Somente estes campos podem sair do adapter:

- `productId`
- `sku`
- `name`
- `quantity`

### Configurações de entrega

Somente `deliveryBaseFeeCents`, `deliveryFeePerKmCents` e `maximumRoadDistanceKm` atravessam a porta de leitura usada pela cotação. O preço final e a distância não são aceitos do cliente.

## Conformidade OpenAPI

A certificação valida:

- resposta `200` de categorias;
- resposta `200` da página de produtos;
- resposta `200` do detalhe de produto;
- resposta `200` da cotação;
- `PublicError` em `400` e `404`;
- propriedades obrigatórias, UUIDs, enums, paginação e `bundleComponents`;
- `additionalProperties: false` nos schemas públicos relevantes;
- ausência recursiva de estoque numérico, custo, margem, reservas e movimentos.

Os testes usam as dependências já presentes no workspace. Nenhum validador runtime pesado é introduzido e o contrato não é modificado para acomodar a implementação.

## Ausência de mutações e dados inventados

A API congelada continua somente leitura. Ela não reserva ou movimenta estoque, não cria carrinho, pedido, pagamento ou PIN, não altera configurações e não ativa produtos. A composição runtime não cria fallback de catálogo nem preenche a Home com fixture.

O estado certificado permanece:

```text
MVP_SKUS_PAUSED=36
DEFERRED_SKUS=30
COMMERCIAL_SKUS_ACTIVATED=0
PUBLIC_CANONICAL_CATALOG_EMPTY=true
```

## Limites preservados

Continuam fora deste PR:

- C-003, C-004 e autenticação;
- carrinho, checkout, reservas ligadas a pedido e pedidos;
- pagamentos, Stripe e webhooks;
- Admin, tracking e providers reais;
- integração funcional da Home;
- banco de produção, deploy e produção;
- merge ou alteração da `main`.

C-001, C-002, C-005, `home.data.ts`, componentes visuais e localização permanecem inalterados por este Gate.

## Consequências

- Mudanças futuras no read model não passam automaticamente para o contrato público.
- Drift entre respostas e OpenAPI passa a bloquear o CI.
- O catálogo público vazio continua sendo um resultado correto enquanto não houver Gate de ativação comercial.
- O PR `#5` fica encerrado para crescimento funcional.
- A próxima implementação deve partir da SHA certificada final em branch filha; nenhuma integração da Home foi iniciada neste Gate.
