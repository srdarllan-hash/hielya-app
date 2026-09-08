# HIELYA CHECKPOINT OFICIAL

Checkpoint: HIELYA_CHECKPOINT_2026-08-05_v2.1.md
Checkpoint ID: HLY-CP-20260805-2.1
Data e hora: 2026-08-05 14:43 Europe/Dublin
Tipo: EXTRAORDINÁRIO, governança e consolidação

## 1. Resumo executivo

O projeto HIELYA permanece em desenvolvimento controlado no repositório srdarllan-hash/hielya-app. A fundação visual C-005, C-001 e C-002 está congelada e protegida por regressões. A camada de políticas do MVP Local 36 e a camada de persistência foram certificadas. O contrato OpenAPI derivado do MVP Local 36 V1.1 foi materializado e validado pelo CI no HEAD atual.

Neste checkpoint foi adotada a Política Permanente de Checkpoints, registrada separadamente no Google Drive. Nenhuma alteração foi feita no GitHub, na main, nos PRs ou na produção durante a criação deste checkpoint.

## 2. Identificadores atuais

Repositório: srdarllan-hash/hielya-app
Branch ativa: hielya/mvp-local-36-implementation
HEAD atual: 4ca838d4937555f50b3f5e11fddece5e042e1ee9
PR principal: #5, OPEN / DRAFT
Base do PR #5: hielya/c002-location-gate2
Base SHA: 6d4773403fad4788b11ef6a7277f77171caf0c0a
main: 91e603d94cc0c5499d96eeca7954a19c4e3a2811
Tags: nenhuma
Merge realizado: não
Produção ativada: não

Master Backup SST: HIELYA_MASTER_BACKUP_SST_V2_0_0_2026-08-05.zip
Master Backup SHA-256: 0d002e1da3f553c58de6cc485328f61dc38fe78dd8b950d9ef52ef1390257971

## 3. Gates e certificações

### C-005 Home Gate 1A
Status: APPROVED_FROZEN
SHA: be61e1168b93d973101496cc66cb54d006aba9cc
PR: #1

### C-001 Splash Gate 1B
Status: APPROVED_FROZEN
SHA: c838cfc26176b2e748bdbd037147a7f362d5a3c2
PR: #2, OPEN / DRAFT

### Pre-Gate 2 Architecture Consolidation
Status: SUCCESS / FROZEN FOUNDATION
SHA: c2857afe538b2cf5ba44635edd56dbd422c0e2f0
PR: #3, OPEN / DRAFT

### C-002 Location Gate 2
Status: APPROVED_FROZEN
SHA: 6d4773403fad4788b11ef6a7277f77171caf0c0a
Workflow Run: 30634389101
PR: #4, OPEN / DRAFT

### MVP Local 36 Policy Layer
Status: CERTIFIED
SHA: 965cd1c3b96b20e38a3311818b4b35e894a067a1
Workflow Run: 31003647964

### MVP Local 36 Persistence Layer
Status: CERTIFIED
SHA: abc9380c968c7533316bd27cd3f85a73f7020b8f
Workflow Run: 31004798433

### MVP Local 36 OpenAPI V1.1 Contract Gate
Status técnico: CI SUCCESS
HEAD: 4ca838d4937555f50b3f5e11fddece5e042e1ee9
Workflow Run: 31008611214
Jobs: policy-validation, C-001 regression, C-002 regression, C-005 regression e policy-gate-summary concluídos com SUCCESS.
Observação: o contrato foi tecnicamente validado. Ainda deve ser registrado formalmente como camada congelada antes de iniciar a implementação da Service/API Layer.

## 4. Funcionalidades implementadas e certificadas

- C-005 Home code-first e estados oficiais.
- C-001 Splash e contratos de transição.
- C-002 Localização e estados responsivos.
- Design Tokens e componentes compartilhados protegidos por regressão.
- Contrato exato do MVP Local 36 com 36 SKUs: 30 originais selecionados e 6 composites.
- Todos os composites possuem gelo e consomem componentes reais.
- Pedido mínimo calculado somente sobre produtos.
- Entrega simulada configurável: €2,00 base + €0,60/km, máximo de 4 km.
- PIN de quatro dígitos e limite configurável de três tentativas.
- Persistência de desenvolvimento para categorias, produtos, bundles, componentes, configurações, inventário, reservas, movimentos e PIN.
- Reserva atômica de componentes, rollback integral e bloqueio de estoque negativo.
- Separação entre DTO público e DTO interno de estoque.
- OpenAPI original V1.0 preservado com hash canônico.
- OpenAPI derivado MVP Local 36 V1.1 validado com cinco operações contratuais.

## 5. Contrato API atual

Implementação autorizável após congelamento formal:

- GET /catalog/categories
- GET /catalog/products
- GET /catalog/products/{productId}
- POST /delivery/quote

Contrato presente, mas implementação adiada:

- POST /carts/{cartId}/validate

Motivo do adiamento: depende de customerBearer, carrinho persistido, endereço persistido e futuras camadas de autenticação e carrinho.

Rotas paralelas proibidas:

- GET /catalog
- GET /products/{id}
- POST /checkout/validate

## 6. Funcionalidades não iniciadas

- Service/API handlers e serviços de aplicação.
- Autenticação por telefone e OTP.
- Carrinho persistido.
- Endereços persistidos do cliente.
- Criação de pedidos.
- Checkout completo.
- Pagamentos simulados ou reais.
- Stripe, Apple Pay e Google Pay.
- Admin visual e operações administrativas completas.
- Fluxo completo do cliente.
- Tracking ao vivo.
- Aplicativo Rider.
- Deploy e produção.

## 7. Regras imutáveis atuais

- PR #5 permanece OPEN / DRAFT.
- main não pode ser alterada ou receber merge sem Gate específico.
- Produção e credenciais reais permanecem bloqueadas.
- Nenhum SKU está comercialmente ativo.
- Os 30 SKUs não selecionados permanecem DEFERRED_AFTER_MVP.
- Packs não possuem estoque independente.
- Cliente não vê quantidade numérica de estoque.
- PublicAvailability permite apenas AVAILABLE, UNAVAILABLE e TEMPORARILY_UNAVAILABLE.
- Pedido mínimo inicial: €25 em produtos.
- Raio máximo: 4 km por rota rodoviária.
- Entrega simulada: €2,00 + €0,60/km.
- Pagamentos permanecem simulados ou bloqueados até Gate específico.
- OpenAPI V1.0 permanece intacto como baseline auditável.
- OpenAPI MVP Local 36 V1.1 é o contrato derivado da próxima camada.

## 8. Decisões provisórias ou pendentes de validação

- Persistência atual utiliza SQLite/Node para desenvolvimento e testes, não banco de produção.
- Fornecedor real de roteamento ainda não escolhido.
- Fornecedores de SMS, e-mail, mapas, hospedagem e pagamentos ainda não selecionados para produção.
- EANs, imagens licenciadas, custos atacadistas e IVA por SKU ainda precisam de confirmação comercial.
- Local operacional, licenças, seguro e regularização permanecem Gates externos.
- Percentual total de conclusão não é declarado como número único, pois não existe modelo ponderado oficial. O MVP transacional ainda está em fase de fundação.

## 9. Arquivos alterados no GitHub desde a persistência certificada

Adicionados ou modificados entre abc9380c... e 4ca838d...:

- .github/workflows/mvp-local-36-policy-gate.yml
- contracts/openapi/HIELYA_OPENAPI_V1_0.yaml
- contracts/openapi/HIELYA_OPENAPI_MVP_LOCAL_36_V1_1.yaml
- contracts/openapi/MVP_LOCAL_36_IMPLEMENTATION_PROFILE.json
- docs/decisions/ADR-MVP-LOCAL-36-OPENAPI-V1-1.md
- scripts/validate-mvp-local-36-openapi.mjs
- tests/unit/mvp-local-36-openapi.test.ts

Nenhum arquivo foi removido.

## 10. Alterações deste checkpoint

Em relação ao Master Backup SST V2.0.0:

- Política Permanente de Checkpoints adotada.
- Documento HIELYA_CHECKPOINT_POLICY.md criado no Google Drive.
- Primeiro checkpoint oficial da nova política criado.
- Nenhuma mudança de código ou arquitetura foi realizada.
- HEAD, PR, main e CI permanecem nos estados descritos acima.

## 11. Documentos canônicos

1. HIELYA_CHECKPOINT_POLICY.md, política de preservação.
2. Este checkpoint, contexto operacional mais recente.
3. HIELYA_MASTER_BACKUP_SST_V2_0_0_2026-08-05.zip, backup consolidado.
4. Estado factual do GitHub no HEAD 4ca838d4937555f50b3f5e11fddece5e042e1ee9.
5. contracts/openapi/HIELYA_OPENAPI_MVP_LOCAL_36_V1_1.yaml.
6. contracts/openapi/MVP_LOCAL_36_IMPLEMENTATION_PROFILE.json.
7. docs/decisions/ADR-MVP-LOCAL-36-OPENAPI-V1-1.md.
8. Master Package Work-Ready V1.1 para baseline de produto e histórico auditado.

## 12. Decision Log

HLY-CP-001: adotar checkpoints diários e extraordinários no Google Drive.
HLY-API-001: preservar OpenAPI V1.0 e criar contrato derivado V1.1 para MVP Local 36.
HLY-API-002: usar rotas canônicas da baseline e proibir rotas paralelas.
HLY-DATA-001: não expor quantidades numéricas de estoque em DTO público.
HLY-STOCK-001: packs consomem componentes reais e não possuem estoque independente.
HLY-GOV-001: PR draft, main e produção permanecem bloqueados até Gates explícitos.

## 13. Riscos conhecidos

- PR #5 possui camadas novas que ainda não estão descritas integralmente no corpo do PR.
- A camada OpenAPI precisa de congelamento formal para evitar iniciar Service/API sobre base móvel.
- Os PRs históricos #1 a #4 continuam abertos e podem confundir uma retomada sem o mapa de branches.
- Não existem tags Git; os SHAs são a única âncora imutável atual.
- O backup não contém a base completa de objetos .git, exigindo acesso ao GitHub para reconstrução byte a byte das branches.
- Produção, pagamentos e dados comerciais não foram validados.

## 14. Bloqueios atuais

- SERVICE_API_LAYER: bloqueada até congelamento formal do OpenAPI V1.1.
- AUTH_LAYER: bloqueada.
- CART_LAYER: bloqueada.
- ORDER_LAYER: bloqueada.
- PAYMENT_LAYER: bloqueada.
- ADMIN_LAYER: bloqueada.
- PRODUCTION: bloqueada até Gate P e validações externas.

## 15. Próximos passos

Prioridade 1: congelar formalmente o Gate HIELYA_MVP_LOCAL_36_OPENAPI_V1_1 no SHA 4ca838d...
Prioridade 2: atualizar a descrição do PR #5 com a camada OpenAPI validada, sem novo commit quando possível.
Prioridade 3: autorizar somente a Service/API Layer para catálogo, detalhes do produto e cotação de entrega.
Prioridade 4: manter cart validation, autenticação, pedidos, pagamentos e Admin adiados.
Prioridade 5: executar novo checkpoint extraordinário após a certificação ou qualquer mudança de HEAD.

## 16. Confirmações finais

CHECKPOINT_STATUS = OFFICIAL
POLICY_STATUS = ACTIVE
GITHUB_HEAD = 4ca838d4937555f50b3f5e11fddece5e042e1ee9
PR_5_STATE = OPEN_DRAFT
MAIN_CHANGED = FALSE
MERGE_PERFORMED = FALSE
PRODUCTION_CHANGED = FALSE
NEW_CODE_CREATED_BY_CHECKPOINT = FALSE
NEXT_IMPLEMENTATION_LAYER_STARTED = FALSE
