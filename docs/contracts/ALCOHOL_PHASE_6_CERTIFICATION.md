# Fase6 — certificação técnica e limites

Issue45. Objetivo: confrontar plano/requisitos com a implementação e executar toda a validação no SHA candidato. Não é certificado jurídico, autorização de produção ou declaração de jornada operacional completa.

## Proveniência resolvida

O [plano](https://github.com/srdarllan-hash/hielya-app/blob/b96b2907f132d006072b216030353b5352441049/docs/requirements/ALCOHOL_COMPLIANCE_IMPLEMENTATION_PLAN.md) existe na branch hielya/alcohol-compliance-domain-requirements, PR34 não mergeado. A main consultada anteriormente não continha esse caminho. A resposta anterior omitiu a linhagem separada; não houve prova de perda/deleção. [v5.9](../checkpoints/2026-09/HIELYA_CHECKPOINT_2026-09-07_v5.9.md) documenta explicitamente que PR34 permaneceu separado ao iniciar Fase1. A leitura de main foi factual, mas insuficiente para localizar toda a documentação. [Roteamento](../requirements/README.md) usa links por SHA, não cópias silenciosas. O PR34 não foi mergeado nesta tarefa.

## Matriz de evidências e lacunas

| Requisito | Evidência executável | Limite da certificação |
|---|---|---|
| Cutoff dinâmico, SLA válido, reconfirmação e controles de etapas | mvp-order-foundation.test.ts; mvp-c005-alcohol.test.tsx | Fonte de SLA/checkout controlada, sem integração operacional real |
| Atomicidade: prazo+idade+PIN; oito combinações, concorrência, SQL bypass e recusa terminal | mvp-atomic-handover.test.ts; migrations0005/0006 | Não comprova inspeção física honesta nem autenticação de workforce em produção |
| Cadeia pedido canônico→cada uma das três recusas→intenção→refund/void confirmado→retenção | novo mvp-alcohol-certification.test.ts; SQLite real e provedor controlado | Não confundir confirmação fake de teste com estorno real |
| Entrega válida não cria reembolso; recusa não reabre entrega | novo teste de certificação e suíte atômica | Sem endpoint público/auth de handover ativado |
| Presença/vedação de recepção ou terceiro | Comandos inválidos rejeitados sem evento parcial no teste novo; suíte atômica | Não há jornada de hotel completa com endereço real, UI courier e operação física |
| Compensação integral/idempotência/timeout e prova de confirmação | mvp-compensation-retention.test.ts | Stripe, scheduler e reconciliação externos não integrados |
| Retenção por último lançamento, impedimentos e contabilização posterior ao reembolso | mvp-compensation-retention.test.ts e cadeia nova | Avaliação de elegibilidade; sem arquivo restrito/eliminação coordenada real |
| Sem foto/número/DOB ou PIN público | ContratoV1.3, testes de schema/SQL/handover e resultado do teste novo | Logs/telemetria dos futuros fornecedores ainda devem ser certificados |
| Retorno/inspeção antes de repor mercadoria | Cadeia nova comprova que recusa/compensação não repõem estoque automaticamente | Fluxo dedicado de retorno/inspeção ausente; não certificado como concluído |
| C005: servidor, sessão aberta, HIGH+UNAVAILABLE simultâneos, imagens e acessibilidade | mvp-c005-alcohol.test.tsx;57 testes Home de navegador | Eventos são intenções; sem carrinho/checkout persistido integrado |
| Sessão opaca, expiração e isolamento de cliente | Suítes auth HTTP/foundation/concurrency e ownership no teste novo | Não há jornada integrada login→checkout→courier; autorização por portas controladas |
| Regressões completas | Unidade, contratos, lint/tipagem/build, C001/C002/C005/ProductDetail, visuais/a11y | Resultado só é válido para SHA/runs reais do PR |

## Conclusão de escopo

Mesmo com CI verde, a conclusão máxima é **VALIDAÇÃO TÉCNICA DO ESCOPO IMPLEMENTADO COM LACUNAS EXPLÍCITAS**. A certificação ponta a ponta de todo o plano P6 permanece **INCOMPLETA**: retorno/inspeção, jornada autenticada de compra/hotel/courier e lifecycle físico não são executáveis integralmente. Stripe e descarte continuam dependências expressamente adiadas pelo proprietário. Não expandir produto silenciosamente para fechar esta matriz; planejar essas lacunas para autorização separada.

## Validação de preparação

Cinco novos casos atravessam componentes reais de aplicação/SQLite, com portas controladas. Na primeira tentativa, três casos tinham chave de idempotência curta (menos de16caracteres): corrigida a fixture para o contrato existente, sem alterar guardas de produto. Demais chaves negativas também tornadas válidas para testar a condição pretendida, não a validação de formato. Relógios controlados, sem dependência da data de execução. A suíte completa e CI final serão registrados no PR; não atualizar baseline. A documentação consolidada foi criada antes dos testes de certificação; nenhuma nova regra de negócio foi inventada.
