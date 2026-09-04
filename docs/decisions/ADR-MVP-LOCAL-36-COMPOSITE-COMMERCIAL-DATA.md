# ADR: Dados comerciais dos composites do MVP Local 36

- Status: Aceito e congelado pelo proprietário
- Perfil: `MVP_LOCAL_36`
- Versão dos dados: `1.0.0`
- Artefato: `contracts/catalog/HIELYA_MVP_LOCAL_36_COMPOSITE_COMMERCIAL_DATA_V1_0.json`
- SHA-256 do artefato: `c2db49b2f7aa66cf0e75d3bfe18fb34296c40ef836cd0d8354a1993cc7f4d6b7`

## Contexto

O Gate do read model persistente foi bloqueado porque o catálogo auditado anterior continha os 60 produtos unitários, mas não possuía registros comerciais completos vinculados aos seis SKUs `HYA-CMB-001` a `HYA-CMB-006`. Faltavam, em especial, preço próprio e limite por pedido congelados para cada composite.

O proprietário aprovou explicitamente os seis registros comerciais desta decisão. Este ADR e o artefato versionado passam a ser a fonte canônica desses composites no perfil MVP Local 36.

## Decisão

Os registros aprovados são:

| SKU | Nome | Preço (cêntimos) | Máx./pedido |
| --- | --- | ---: | ---: |
| `HYA-CMB-001` | Pack Mahou Frío 6 + Hielo 2 kg | 1193 | 4 |
| `HYA-CMB-002` | Pack Heineken Frío 6 + Hielo 2 kg | 1253 | 4 |
| `HYA-CMB-003` | Pack Estrella Galicia Frío 6 + Hielo 2 kg | 1253 | 4 |
| `HYA-CMB-004` | Pack Cruzcampo Frío 6 + Hielo 2 kg | 1133 | 4 |
| `HYA-CMB-005` | Combo Gin Tonic Larios + Hielo | 3500 | 3 |
| `HYA-CMB-006` | Combo Vodka Energy Absolut + Hielo | 3563 | 3 |

Todos os seis:

- usam moeda `EUR`;
- contêm álcool;
- exigem idade mínima de 18 anos;
- são packs;
- incluem `HYA-GEL-051`;
- permanecem `PAUSED`;
- permanecem comercialmente inativos;
- não possuem estoque independente.

As composições são as já certificadas na camada de políticas:

- `HYA-CMB-001`: 6 × `HYA-CER-001`; 1 × `HYA-GEL-051`.
- `HYA-CMB-002`: 6 × `HYA-CER-003`; 1 × `HYA-GEL-051`.
- `HYA-CMB-003`: 6 × `HYA-CER-006`; 1 × `HYA-GEL-051`.
- `HYA-CMB-004`: 6 × `HYA-CER-009`; 1 × `HYA-GEL-051`.
- `HYA-CMB-005`: 1 × `HYA-DES-036`; 6 × `HYA-REF-023`; 1 × `HYA-GEL-051`; 1 × `HYA-CON-059`; 1 × `HYA-CON-060`.
- `HYA-CMB-006`: 1 × `HYA-DES-040`; 4 × `HYA-ENE-026`; 1 × `HYA-GEL-051`; 1 × `HYA-CON-059`.

## Política inicial de preço

- Base: `SUM_OF_COMPONENT_SALE_PRICES`.
- Desconto: 0 cêntimos.
- Recálculo automático: desativado.

O preço aprovado é um valor próprio do composite. Alterações futuras nos componentes não modificam esse preço automaticamente.

## Política inicial de limite por pedido

- Base: `LIMITING_COMPONENT`.
- Auditoria inicial: `MIN(FLOOR(component.maxPerOrder / componentQuantity))`.
- Recálculo automático: desativado.

O limite aprovado é um valor próprio do composite e será lido da persistência quando essa camada for autorizada.

## Consequências

Este Gate apenas congela a decisão comercial. Não altera schema, migração, seed, read model, OpenAPI, host HTTP ou endpoint. Nenhum SKU é ativado comercialmente.

Qualquer mudança futura em nome, preço, limite, composição, regra de álcool ou ativação exige nova decisão comercial versionada. Pagamentos reais, deploy, produção, merge e alteração da `main` permanecem bloqueados.
