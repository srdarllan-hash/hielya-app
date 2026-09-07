# HIELYA_CHECKPOINT_2026-09-07_v6.3

Gate: ATOMIC_HANDOVER_TERMINAL_REFUSAL / PHASE_3. Data: 2026-09-07 UTC.
Status: IMPLEMENTED_LOCALLY_VALIDATED / FINAL_PR_CI_PENDING / NOT_MERGED.

## Continuidade e autorização
Política e v6.1/v6.2 validados. PR38 mergeado explicitamente autorizado. Main ccdd13492dd8348ea8b59b94c6521fc3b760c790, tree b5db656db7fb98df86b2a447c5561dab59ae6760 idêntica ao HEAD certificado4999f87c07dc8efded2f311369ca5f20dbe0521e. Runs34113530309 e34113530243 SUCCESS/884tests para Fase2, não atribuídos à Fase3.
Issue39 / branch hielya/atomic-handover-terminal-refusal criada da nova main. Próximo PR desta branch aguardará aprovação individual antes de merge. SHA/CI finais serão registrados no PR, sem autorreferência fictícia neste arquivo.

## Implementação e Decision Log
Novo caso de uso application/orders/handover.ts, adaptador persistence/handover.ts, migration aditiva0006. Transação BEGIN IMMEDIATE verifica ator/courier atribuído, revisão/ARRIVED, admissão original antes do cutoff dinâmico, deadline efetivo antes22h Madrid e promessa, atestação visual18+ e presença do destinatário pretendido, PIN válido e não bloqueado. Relógio servidor relido antes da inserção. Apenas um evento terminal imutável autoriza projeções DELIVERED/idade verificada. Sem aprovação isolada de idade ou handover parcial.
Recusa aceita somente REFUSED_NO_ID, REFUSED_MINOR, REFUSED_DOUBTFUL_ID. Evento+intenção FULL_NO_CUSTOMER_COST/PENDING na mesma transação. Pedido projeta DELIVERY_FAILED, entrega FAILED. Sem reabertura, terceiro/recepção ou nova tentativa no mesmo pedido. Execução financeira/valores/retention continuam Fase4.
PIN específico da entrega, aleatório criptográfico4dígitos, HMAC-SHA256 com pepper externo mínimo32bytes, comparação constante, limite de tentativas persistido. PIN_ISSUER autorizado separado de courier; sem reset/reissue. Recibos de erro impedem duplicar tentativa por replay; fingerprint HMAC não registra PIN. Validador PIN legado não autoriza evento terminal. Opaque Session e SMS não alterados.
SQL aplica guardas independentes de PIN/idade/deadline/estado/ator/revisão e imutabilidade. Base histórica de pedido/entrega permanece preterminal; leitura canônica projeta evento único. Nenhuma mutation antiga consegue gravar DELIVERED ou reabrir após terminal.
Evidência mínima: resultado/método/timestamp/courier. Nenhuma foto/número/DOB/tipo de documento/free text. Documento com foto+nascimento visíveis; NIE sozinho =>REFUSED_DOUBTFUL_ID. Sistema exige atestação do courier, não prova honestidade da inspeção física. Procedimento operacional e identidade de produção seguem obrigatórios.

## Validação e achados
41 testes novos PASS, incluindo8combinações de condições, rechecagem do relógio, presença/spoof, bloqueio PIN/replay, legado, todas recusas, guardas SQL, rollback integral com compensação e conexões concorrentes/bloqueio real SQLite. Suíte completa anterior:385PASS antes do último teste de método obrigatório de recusa;16contratoPASS, tipagemPASS. CI deve certificar revisão final completa (386unit esperados +regressões +16contrato), não antecipado aqui.
Primeira suíte:382PASS/2FAIL, ambas listas fechadas de5migrations versus6. Causa registrada antes de corrigir; somente expectativas de lista/contagem ajustadas. Checksums preservados; migrations0001–0005 byte a byte idênticas à main. Constraint de método explicita NOT NULL para evitar semântica NULL de CHECK SQLite; teste específico incluído. Sem baseline alterada. Install frozen-lockfile offline aproveitou cache, sem bloqueio de rede.

## Arquivos
Criados: migration0006; application/orders/handover.ts; persistence/handover.ts; tests/unit/mvp-atomic-handover.test.ts; docs/contracts/ALCOHOL_DOMAIN_PHASE_3.md; checkpointsv6.2/v6.3.
Modificados: application/orders/index.ts (tipos finais/bloqueio terminal), persistence/order-foundation.ts (projeções finais), persistence/index.ts (migration/export),2 testes históricos (lista/contagem), CLAUDE.md, INDEX.md. Nenhum removido. Nenhum checkpoint histórico sobrescrito, contrato/asset/token/baseline/UI/workflow alterado.

## Estado, riscos e próximo passo
Main alterada só pelo merge38 autorizado; Fase3 não mergeada. Produção bloqueada, HTTPV1.3 ainda não ativado. Adaptação workforce/issuer/clock confiável e procedimento presencial são dependências operacionais. Replay de sucesso é recibo histórico, não nova autorização de entrega física. Eventos finais imutáveis não devem ser reescritos na Fase4; futuras devoluções usam registros próprios. Compensação PENDING não significa dinheiro devolvido.
Aguardar CI e revisão individual do novo PR; só após merge aprovado seguir Fase4. Fases4–6, C003/C004 e novas telas não iniciadas.
