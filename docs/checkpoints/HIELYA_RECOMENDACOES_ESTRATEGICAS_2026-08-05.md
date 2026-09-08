HIELYA RECOMENDAÇÕES ESTRATÉGICAS E FLUXO CORRIGIDO
Data: 2026-08-05
Status dos checkpoints: PAUSADOS POR SOLICITAÇÃO DO PROPRIETÁRIO

1. OBJETIVO
Este documento consolida as recomendações estratégicas, a sequência de execução e as correções obrigatórias que deverão ser transformadas em comandos específicos para o Work, Gate por Gate.

2. ESTADO ATUAL CERTIFICADO
- HEAD certificado: f1a533a3e4bcf76ea5634979536e58445432bb11
- Próxima etapa imediata: Public Service API Layer
- PR #5 permanece OPEN / DRAFT
- main permanece inalterada
- merge não autorizado
- produção bloqueada
- checkpoints automáticos e extraordinários permanecem pausados

3. SEQUÊNCIA ESTRATÉGICA APROVADA
1. Implementar e certificar a API pública.
2. Congelar o SHA final da fundação técnica no PR #5.
3. Criar nova branch derivada exatamente do SHA final certificado do PR #5.
4. Abrir novo PR empilhado sobre a branch da fundação, nunca diretamente sobre main enquanto a fundação não estiver integrada em uma base oficial.
5. Integrar a C-005 Home com a API pública, sem redesign.
6. Implementar C-003 Login.
7. Implementar C-004 OTP.
8. Implementar carrinho.
9. Implementar validação do carrinho.
10. Implementar reserva atômica de estoque por 10 minutos.
11. Implementar checkout e endereço exato.
12. Recalcular a cotação de entrega no servidor.
13. Implementar confirmação de maioridade.
14. Implementar pagamento simulado.
15. Confirmar o pedido somente após pagamento simulado aprovado.
16. Gerar PIN de entrega.
17. Implementar preparação e entrega.
18. Conferir idade presencialmente.
19. Validar PIN.
20. Concluir pedido.
21. Implementar Admin mínimo.
22. Integrar provedores reais somente depois do fluxo local completo.
23. Executar Gate de produção.

4. CORREÇÕES OBRIGATÓRIAS DO FLUXO

4.1 Pagamento antes da confirmação final do pedido
Fluxo correto:
AWAITING_PAYMENT -> PAYMENT_AUTHORIZED -> AWAITING_PICKING -> PREPARING -> DELIVERY

Pode existir um registro técnico em AWAITING_PAYMENT, mas o pedido não deve ser considerado confirmado antes do pagamento simulado ser aprovado.

4.2 Reserva de estoque explícita
Fluxo correto:
Carrinho -> Validação do carrinho -> Reserva atômica por 10 minutos -> Checkout

A reserva deve:
- impedir estoque negativo;
- usar componentes reais nos composites;
- ser liberada quando expirar ou falhar;
- ser convertida quando o pedido avançar corretamente.

4.3 Base correta para novos PRs
Após a API pública, a nova branch deve nascer do SHA final certificado do PR #5.
O novo PR deve ser empilhado sobre a branch da fundação enquanto ela não estiver integrada a uma branch-base oficial.
É proibido criar o novo PR diretamente contra main e reapresentar todo o histórico como mudança nova.

4.4 Navegação pública versus checkout autenticado
Pode permanecer público:
- catálogo;
- categorias;
- detalhes de produtos;
- cotação de entrega.

Exige autenticação:
- salvar endereço;
- validar carrinho;
- reservar estoque;
- checkout;
- pagamento;
- criação e acompanhamento do pedido.

4.5 Cotação no checkout
A cotação aproximada anterior não é definitiva.
No checkout, o servidor deve recalcular a entrega usando o endereço exato e as configurações persistentes.

5. PRÓXIMO GATE
Public Service API Layer, limitado a:
- GET /api/v1/catalog/categories
- GET /api/v1/catalog/products
- GET /api/v1/catalog/products/{productId}
- POST /api/v1/delivery/quote

Sem:
- autenticação;
- carrinho;
- pedidos;
- pagamentos;
- mutações de estoque;
- mapas reais;
- deploy;
- produção.

6. CONTROLES PERMANENTES PARA CADA COMANDO DO WORK
Antes de implementar:
CURRENT_PHASE =
CERTIFIED_BASE_SHA =
ACTUAL_HEAD_SHA =
HEAD_MATCHES_CERTIFIED_BASE =
NEXT_PHASE =
WHAT_WILL_BE_IMPLEMENTED =
WHAT_WILL_NOT_BE_IMPLEMENTED =
DEPENDENCIES =
RISK_OF_REWORK =
PR_STATE =
MAIN_CHANGE_AUTHORIZED =
MERGE_AUTHORIZED =

Depois de implementar:
HEAD_ANTERIOR =
HEAD_FINAL =
WORKFLOW_RUN_ID =
CI_STATUS =
PR_STATE = OPEN / DRAFT
MAIN_CHANGED = FALSE
MERGE_PERFORMED = FALSE
NEXT_LAYER_STARTED = FALSE

7. MÉTRICAS A PARTIR DA INTEGRAÇÃO DA HOME
CUSTOMER_FLOW_COMPLETION =
END_TO_END_SCENARIOS_PASSING =
REAL_UI_CONNECTED_TO_API =
PUBLIC_ENDPOINTS_CERTIFIED =
AUTHENTICATED_FLOW_STARTED =

8. REGRAS DE SEGURANÇA
- Nenhuma decisão importante deve ficar apenas na conversa.
- Nenhum Gate pode alterar main sem autorização explícita.
- Nenhum merge é autorizado automaticamente.
- Nenhum SKU canônico deve ser ativado para preencher testes visuais.
- Fixtures temporárias e bancos isolados devem ser usados em testes não vazios.
- OpenAPI e contratos canônicos não devem ser modificados para acomodar implementação.
- Pagamentos reais, mapas reais, credenciais e produção permanecem bloqueados.

9. STATUS
FLOW_STRUCTURALLY_VALID = TRUE
FATAL_ERROR_FOUND = FALSE
PAYMENT_ORDER_CORRECTED = TRUE
INVENTORY_RESERVATION_STEP_ADDED = TRUE
STACKED_PR_BASE_REQUIRED = TRUE
PUBLIC_BROWSING_SEPARATED_FROM_AUTHENTICATED_CHECKOUT = TRUE
READY_TO_TRANSLATE_INTO_WORK_GATES = TRUE
