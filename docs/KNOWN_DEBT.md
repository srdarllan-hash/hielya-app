# Pendências consolidadas

Referência de lacunas e critérios de encerramento, não snapshot de projeto. Consultar checkpoints e GitHub antes de estimar/concluir trabalho. Não incluir SHA corrente/status de gate. Propostas sem fonte: “a confirmar”.

| Pendência | Critério de encerramento | Evidência |
|---|---|---|
| Descarte físico após retenção não implementado | Descarte coordenado do dossiê/backups, rechecagem de impedimentos/reconciliação e evidência verificável | [Fase4](contracts/ALCOHOL_DOMAIN_PHASE_4.md), [Issue43](https://github.com/srdarllan-hash/hielya-app/issues/43) |
| Pagamento real/Stripe e execução efetiva de estornos pendentes | Adaptador aprovado com idempotência, reconciliação e confirmação financeira | [Fase4](contracts/ALCOHOL_DOMAIN_PHASE_4.md), [Issue43](https://github.com/srdarllan-hash/hielya-app/issues/43) |
| SLA real, checkout autenticado e identidade operacional são dependências não ativadas | Integrações aprovadas e testadas em fronteiras reais, sem usar fixtures como produção | [Fase2](contracts/ALCOHOL_DOMAIN_PHASE_2.md), [Fase3](contracts/ALCOHOL_DOMAIN_PHASE_3.md), [Fase5](contracts/ALCOHOL_DOMAIN_PHASE_5.md) |
| C005 emite intenções; carrinho/checkout completo e UI courier ausentes | Implementação autorizada das mutações autenticadas e fluxos consumidores | [Fase5](contracts/ALCOHOL_DOMAIN_PHASE_5.md), [Plano](requirements/README.md) |
| Retorno/inspeção de mercadoria antes de repor estoque: sem fluxo dedicado certificado | Especificar e certificar retorno/inspeção sem reposição antecipada; detalhes operacionais a confirmar | [Plano P4/P6](requirements/README.md); verificar matriz da certificação antes de declarar cadeia completa |
| Falhas logísticas terminais por PIN/ausência/deadline além das três recusas etárias: contrato sem fluxo operacional completo | Implementar sob autorização o mapeamento contratual, resolução financeira aplicável e testes; não inventar recusa etária | [Requisitos §6](requirements/ALCOHOL_COMPLIANCE_DOMAIN_REQUIREMENTS.md), [V1.3](../contracts/openapi/HIELYA_OPENAPI_MVP_LOCAL_36_V1_3.yaml), [Fase3](contracts/ALCOHOL_DOMAIN_PHASE_3.md) |
| Guardrail mecânico de não-sobrescrita de checkpoints | Workflow adicional aprovado que detecte alteração/remoção histórica | [v5.0](checkpoints/2026-09/HIELYA_CHECKPOINT_2026-09-04_v5.0.md), [Política](checkpoints/HIELYA_CHECKPOINT_POLICY.md) |

| Retry de verificação OTP após sucesso com resposta perdida — bloqueador antes do OtpInput | Definir e certificar recuperação segura no backend/contrato; não compensar no componente. Atualmente replay retorna HTTP400 OTP_UNAVAILABLE, sem recuperar sessão | [Issue50](https://github.com/srdarllan-hash/hielya-app/issues/50), [evidência e especificação](requirements/FORM_COMPONENTS_SPECIFICATION.md#9-investigação-real-retry-após-resposta-perdida) |

Restrições de C003/C004 e produção: [CONSTRAINTS](CONSTRAINTS.md). Serviços: [INTEGRATIONS](INTEGRATIONS.md). Estes documentos não encerram pendências por simples declaração.

