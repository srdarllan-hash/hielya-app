# HIELYA CHECKPOINT OFICIAL

Versão: 2.6
Data e hora: 2026-08-05 17:59 Europe/London
Tipo: Extraordinário

## Resumo executivo

O Gate de congelamento dos dados comerciais dos seis composites do MVP Local 36 foi concluído e certificado. A decisão comercial aprovada pelo proprietário foi materializada como contrato canônico versionado. Nenhuma alteração de persistência, API, autenticação, carrinho ou pagamento foi iniciada.

## Estado certificado do GitHub

- Repositório: srdarllan-hash/hielya-app
- Branch: hielya/mvp-local-36-implementation
- PR: #5, OPEN / DRAFT
- HEAD anterior: 4ca838d4937555f50b3f5e11fddece5e042e1ee9
- HEAD certificado: 5c9c1e632102ba902fb8858eb2ae8b5e118d2497
- Workflow run: 31026892952
- CI: SUCCESS
- main alterada: FALSE
- merge realizado: FALSE

## Entregas concluídas neste checkpoint

1. Artefato canônico criado:
   contracts/catalog/HIELYA_MVP_LOCAL_36_COMPOSITE_COMMERCIAL_DATA_V1_0.json
2. SHA-256 declarado e validado:
   c2db49b2f7aa66cf0e75d3bfe18fb34296c40ef836cd0d8354a1993cc7f4d6b7
3. ADR criado:
   docs/decisions/ADR-MVP-LOCAL-36-COMPOSITE-COMMERCIAL-DATA.md
4. Validador criado:
   scripts/validate-mvp-local-36-composite-commercial-data.mjs
5. Testes de contrato adicionados.
6. Workflow atualizado para validar o congelamento.
7. Regressões C-001, C-002 e C-005 aprovadas.

## Decisões canônicas congeladas

- Perfil: MVP_LOCAL_36
- Versão dos dados: 1.0.0
- Status: OWNER_APPROVED_FROZEN
- Composites: HYA-CMB-001 a HYA-CMB-006
- Política inicial de preço: SUM_OF_COMPONENT_SALE_PRICES
- Desconto: 0 cents
- Recálculo automático de preço: FALSE
- Política inicial de limite: LIMITING_COMPONENT
- Recálculo automático de limite: FALSE
- Todos contêm álcool: TRUE
- Idade mínima: 18
- Todos são packs: TRUE
- Todos incluem gelo: TRUE
- Todos permanecem PAUSED
- SKUs ativados comercialmente: 0

## Arquivos criados

- contracts/catalog/HIELYA_MVP_LOCAL_36_COMPOSITE_COMMERCIAL_DATA_V1_0.json
- docs/decisions/ADR-MVP-LOCAL-36-COMPOSITE-COMMERCIAL-DATA.md
- scripts/validate-mvp-local-36-composite-commercial-data.mjs
- tests/unit/mvp-local-36-composite-commercial-data.test.ts

## Arquivos modificados

- .github/workflows/mvp-local-36-policy-gate.yml
- scripts/validate-mvp-local-36-openapi.mjs

## Arquivos removidos

Nenhum.

## Itens não iniciados

- Migração de persistência para completar o catálogo público
- Read model persistente completo
- ADR e perfil do API host
- Route Handlers
- Endpoints públicos
- C-003 e C-004
- Autenticação e OTP
- Carrinho, checkout, pedidos e pagamentos
- Admin, deploy e produção

## Próxima etapa planejada

Retomar o Gate PERSISTENT_CATALOG_READ_MODEL_COMPLETION_AND_API_HOST_ARCHITECTURE usando o novo HEAD certificado e o artefato canônico dos composites como fonte obrigatória. Esse Gate deve completar o modelo persistente e formalizar apps/ui-lab como host HTTP, mas ainda não implementar endpoints.

## Riscos e bloqueios

- Os 30 SKUs unitários selecionados precisam ter todos os campos públicos mapeados para fontes canônicas antes da migração.
- IDs públicos precisam ser persistentes e estáveis.
- A arquitetura HTTP deve continuar como monólito modular, sem microserviço ou segundo runtime.
- Produção permanece bloqueada.

## Decision Log

- 2026-08-05: proprietário aprovou nomes, preços, limites e indicadores de álcool dos seis composites.
- 2026-08-05: valores foram congelados como registros próprios, sem recálculo automático.
- 2026-08-05: Gate certificado no SHA 5c9c1e632102ba902fb8858eb2ae8b5e118d2497.

## Documentos canônicos adicionados

- contracts/catalog/HIELYA_MVP_LOCAL_36_COMPOSITE_COMMERCIAL_DATA_V1_0.json
- docs/decisions/ADR-MVP-LOCAL-36-COMPOSITE-COMMERCIAL-DATA.md

## Continuidade

Usar este checkpoint junto ao GitHub no HEAD certificado. Não iniciar API pública antes de certificar a conclusão do read model persistente e a arquitetura do API host.
