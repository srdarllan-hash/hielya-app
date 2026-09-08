# Integrações consolidadas

Consultar antes de implementar/substituir/ativar serviço externo. Referência de fronteiras e critérios, não fonte de estado. Confirmar configuração real nos checkpoints/GitHub; não inserir credenciais.

| Integração | Fronteira documentada | Antes de ativar | Evidência |
|---|---|---|---|
| Pagamento/Stripe | PaymentCompensationPort; padrão não configurado; fake só em testes | Confirmação integral, chave estável, timeout/replay/reconciliação; autorização própria | [Fase4](contracts/ALCOHOL_DOMAIN_PHASE_4.md) |
| Contabilidade | AccountingRetentionPort não configurado; sem data inventada | Último lançamento/livro, versão, impedimentos, reconciliação e prazo especial confiáveis | [Fase4](contracts/ALCOHOL_DOMAIN_PHASE_4.md) |
| Descarte/arquivo | Não há adaptador de eliminação física | Dossiê/backups completos; retenção/impedimentos rechecados | [Fase4](contracts/ALCOHOL_DOMAIN_PHASE_4.md) |
| SLA/demanda | OperationalStatePort e entrada de desenvolvimento HIELYA_OPERATIONAL_STATE_PATH; sem renovar estimativa vencida | Fonte real válida por destino e prazo; falha bloqueia álcool | [Fase2](contracts/ALCOHOL_DOMAIN_PHASE_2.md), [Fase5](contracts/ALCOHOL_DOMAIN_PHASE_5.md) |
| Routing | RoutingDistancePort, não configurado ou simulação explicitamente controlada | Distância rodoviária real e autorização própria, sem converter simulação em produção | [Container](../apps/ui-lab/src/server/mvp-local-36/container.ts), [ADR API](decisions/ADR-MVP-LOCAL-36-PUBLIC-SERVICE-API-LAYER.md) |
| SMS | Gateway obrigatório; configuração/simulação bloqueadas em produção | Provedor aprovado e validação de entrega, sem expor OTP/pepper | [Container auth](../apps/ui-lab/src/server/mvp-local-36/auth-container.ts), [ADR sessão](decisions/ADR-MVP-LOCAL-36-OPAQUE-CUSTOMER-SESSION-V1-2.md) |
| Courier/PIN issuer | Autoridade/atribuição e canal de entrega do PIN são portas confiáveis | Autenticação operacional, autorização por pedido e canal protegido | [Fase3](contracts/ALCOHOL_DOMAIN_PHASE_3.md) |
| Checkout | Fonte confiável de ownership/endereço/carrinho/reserva dentro da transação | Adapter autenticado real; não confiar em preço/álcool fornecido pelo cliente | [Fase2](contracts/ALCOHOL_DOMAIN_PHASE_2.md) |

Contratos de fornecedor, credenciais, SLAs e procedimentos de ativação não encontrados nessas fontes: **a confirmar**. Nenhuma aprovação de serviço externo decorre desta consolidação.
