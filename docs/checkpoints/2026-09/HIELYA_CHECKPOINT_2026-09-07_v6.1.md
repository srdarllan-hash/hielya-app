# HIELYA_CHECKPOINT_2026-09-07_v6.1

Gate: ALCOHOL_ORDER_DELIVERY_FOUNDATION / PHASE_2. Data: 2026-09-07 UTC.
Status: IMPLEMENTED_LOCALLY_VALIDATED / PR_CI_PENDING / NOT_MERGED.

## Continuidade e autorização
Política, v5.9 e v6.0 lidos. PR #36 merge autorizado, Issue #35 CLOSED, main `5bbf0b0a24a01effb5d21f17f4b1352c122ad89c`, árvore idêntica à certificada `d070a88f24d538dc2c13a3ecd0353165776d6495`. Runs34111172377/34111172419 SUCCESS para HEAD de Fase1 de551b843f4e31ee9ace398280f1a1387f4b8c6a. Não atribuir esses resultados à Fase2.

Issue #37 / branch hielya/alcohol-order-delivery-foundation criada da main pós-merge. Proprietário autorizou implementação da Fase2 e exigiu aprovação individual do novo PR antes de merge. O PR desta branch identificará SHA e CI finais, sem autorreferência fictícia neste checkpoint.

## Implementação e decisões
Casos de uso em packages/application/src/orders; adaptador SQLite em packages/persistence/src/order-foundation.ts; migration aditiva0005. Persistência de pedido/entrega e snapshot de checkout/SLA/policy/promise, revisão e recibos de idempotência no mesmo commit transacional. Preço/álcool derivados do catálogo e componentes; reserva ativa deve corresponder às quantidades e não pode sustentar dois pedidos. Pedido técnico AWAITING_PAYMENT não confirma pagamento nem consome estoque. Evento de adaptador de pagamento autenticado converte reserva atomicamente com PAYMENT_AUTHORIZED. Savepoints permitem compor conversão já existente e reverter integralmente em falha externa.

Cutoff =22h Madrid menos MAX(45, upper SLA válido). Validade estrita, horário operacional10–22, DST e coexistência HIGH/UNAVAILABLE. Mudança na estimativa exige reconfirmação antes de criar; promessa não é prorrogada silenciosamente. Aceite/preparo/despacho/chegada usam tempo restante válido contra promessa/deadline originais. Apenas couriers atribuídos podem avançar entrega; replay também revalida permissão operacional.

Entrega para em ARRIVED; idade PENDING, sem handover, verificação/PIN, recusa terminal, compensação executada, retenção ou UI. Contexto de checkout e snapshots são internos, não respostas públicas. Erros internos de reserva/transição precisam de mapeamento no futuro transporte; contrato V1.3 preservado.

## Validação na criação
33 testes novos PASS. Suíte completa anterior nesta branch:342 PASS (312 existentes +30 novos antes dos3 casos adicionais); typecheck PASS, lint0 erros/8 warnings existentes,16 contrato PASS. CI integral deve validar revisão final incluindo os33 novos, todas regressões e builds antes de considerar candidato certificado. Testes não equivalem a ativação de infraestrutura real.
Primeira execução apontou2 asserções de lista fechada de migrations (4 versus5). Causa documentada antes da correção; listas/contagem atualizadas com0005 e checksums históricos mantidos. Migrations0001–0004 comparadas byte a byte com main: idênticas. Nenhuma baseline alterada.
Dependências instaladas via pnpm10.15 --frozen-lockfile --offline usando cache existente; nenhum bloqueio de rede nesta fase.

## Arquivos e limites
Criados: migration0005; application/orders/index.ts; persistence/order-foundation.ts; tests/unit/mvp-order-foundation.test.ts; docs/contracts/ALCOHOL_DOMAIN_PHASE_2.md; checkpointsv6.0/v6.1.
Modificados: persistence/index.ts (migration/savepoints/export),2 testes históricos somente expectativas da lista aditiva, CLAUDE.md, INDEX.md. Nenhum arquivo removido; nenhum checkpoint histórico sobrescrito, nenhum contrato/token/baseline/asset/UI alterado.

## Riscos e próximos passos
Checkout autoritativo (carrinho/endereço/raio/taxa/mínimo), SLA operacional confiável e identidade workforce são ports obrigatórios, ainda sem adaptadores de produção. Não há endpoint novo nem ativação V1.3. Evidência de idade e handover dependem da Fase3; pagamentos reais/retention dependem da Fase4; coexistência UI depende da Fase5. Reservas expiradas impedem autorização do pedido; nenhum pagamento real é capturado por este código. PRs32/34 permanecem independentes.
Aguardar CI real do PR da Fase2 e aprovação individual de merge. Só então Fase3. Main alterada apenas pelo PR36 autorizado, não pela Fase2; produção bloqueada. C003/C004 não iniciadas; nenhuma tela nova.
