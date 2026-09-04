# HIELYA CHECKPOINT 2026-08-05 v2.5

Data/hora: 2026-08-05 17:27 Europe/London
Tipo: extraordinário
Motivo: aprovação do proprietário para congelamento comercial dos seis composites do MVP Local 36.

## Resumo executivo

O Gate de conclusão do read model persistente e da arquitetura do API host foi bloqueado sem mudanças porque o catálogo canônico não continha dados comerciais completos para HYA-CMB-001 até HYA-CMB-006. O proprietário aprovou explicitamente os nomes, preços, limites por pedido e indicadores de álcool propostos para os seis composites. Esta decisão não implementa persistência, API, autenticação ou ativação comercial. Ela autoriza o próximo Gate exclusivo de congelamento dos dados comerciais dos composites.

## Estado verificado do GitHub

Repository: srdarllan-hash/hielya-app
Branch: hielya/mvp-local-36-implementation
PR: #5 OPEN / DRAFT
HEAD: 4ca838d4937555f50b3f5e11fddece5e042e1ee9
Main alterada: FALSE
Merge realizado: FALSE

## Decisão comercial aprovada

Regra inicial de preço: soma dos preços de venda dos componentes, sem desconto de composite. O valor resultante será congelado e persistido como preço próprio, editável futuramente pelo Admin. Alterações posteriores nos componentes não recalcularão automaticamente o preço do composite.

Regra inicial de maxPerOrder: componente limitante, usando MIN(FLOOR(component.maxPerOrder / componentQuantity)).

HYA-CMB-001
Nome: Pack Mahou Frío 6 + Hielo 2 kg
salePriceCents: 1193
maxPerOrder: 4
containsAlcohol: true
minimumAge: 18
commerciallyActive: false

HYA-CMB-002
Nome: Pack Heineken Frío 6 + Hielo 2 kg
salePriceCents: 1253
maxPerOrder: 4
containsAlcohol: true
minimumAge: 18
commerciallyActive: false

HYA-CMB-003
Nome: Pack Estrella Galicia Frío 6 + Hielo 2 kg
salePriceCents: 1253
maxPerOrder: 4
containsAlcohol: true
minimumAge: 18
commerciallyActive: false

HYA-CMB-004
Nome: Pack Cruzcampo Frío 6 + Hielo 2 kg
salePriceCents: 1133
maxPerOrder: 4
containsAlcohol: true
minimumAge: 18
commerciallyActive: false

HYA-CMB-005
Nome: Combo Gin Tonic Larios + Hielo
salePriceCents: 3500
maxPerOrder: 3
containsAlcohol: true
minimumAge: 18
commerciallyActive: false

HYA-CMB-006
Nome: Combo Vodka Energy Absolut + Hielo
salePriceCents: 3563
maxPerOrder: 3
containsAlcohol: true
minimumAge: 18
commerciallyActive: false

## Regras imutáveis desta decisão

- Moeda EUR.
- Nenhum desconto inicial de composite.
- Nenhum arredondamento adicional.
- Todos os seis composites permanecem PAUSED.
- COMMERCIAL_SKUS_ACTIVATED = 0.
- Todos contêm álcool e exigem idade mínima de 18 anos.
- Todos incluem gelo.
- Preços devem ser persistidos como valores próprios.
- Quantidade comercial do pack não é saldo de estoque.
- Não existe estoque independente para composite.

## Alterações desde o checkpoint v2.4

- Os campos comerciais ausentes dos seis composites foram aprovados pelo proprietário.
- O bloqueio INCOMPLETE_CANONICAL_COMMERCIAL_DATA agora possui uma decisão comercial explícita para resolução.
- Nenhum arquivo do repositório foi alterado.
- Nenhum Gate técnico foi iniciado.

## Próximo passo

Executar exclusivamente HIELYA_MVP_LOCAL_36_COMPOSITE_COMMERCIAL_DATA_FREEZE_GATE para materializar e validar a decisão em artefato canônico e ADR. Após sua certificação, retomar o Gate PERSISTENT_CATALOG_READ_MODEL_COMPLETION_AND_API_HOST_ARCHITECTURE usando o novo SHA certificado.

## Fora do escopo

- Persistência e migração.
- API pública e Route Handlers.
- C-003 e C-004.
- Autenticação e OTP.
- Carrinho, checkout, pedidos e pagamentos.
- Admin, frontend novo, deploy e produção.

## Riscos

- Os preços são uma decisão comercial inicial e ainda exigirão validação antes do Gate P e da operação real.
- Alterações futuras devem ocorrer por decisão versionada, nunca por edição silenciosa.

## Decision Log

2026-08-05: proprietário aprovou os seis registros comerciais de composites com nomes, salePriceCents, maxPerOrder, containsAlcohol=true e minimumAge=18.

## Status

COMPOSITE_COMMERCIAL_DECISION = APPROVED_BY_OWNER
COMPOSITE_FREEZE_GATE = AUTHORIZED_NOT_STARTED
PROJECT_CHANGES = FALSE
MAIN_CHANGED = FALSE
MERGE_PERFORMED = FALSE
C003_PRIORITY_NOW = FALSE
C004_PRIORITY_NOW = FALSE
