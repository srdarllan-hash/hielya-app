# HIELYA_CHECKPOINT_2026-09-07_v5.8

Gate: ALCOHOL_COMPLIANCE_DOMAIN_REQUIREMENTS — DYNAMIC_CUTOFF_DECISION_AND_PREIMPLEMENTATION_IMPACT.
Data/hora UTC: 2026-09-07T04:24:24.043874+00:00.
Issue #33 / [PR #34](https://github.com/srdarllan-hash/hielya-app/pull/34): OPEN / DRAFT / NOT MERGED.
Branch documental existente: hielya/alcohol-compliance-domain-requirements.
Anterior: [v5.7](./HIELYA_CHECKPOINT_2026-09-07_v5.7.md), lido e validado com a política antes das alterações.
HEAD anterior verificado no GitHub: df09f7538a79f15cb3dfd5d8538117b5c4e64244.
Main verificada e inalterada: 4d32cebcc7f68832940f6825177d5348d63f245a.
Este checkpoint acompanha o próximo commit documental; SHA final consultável no PR/histórico. Não é certificação de código implementado.

## Resumo e Decision Log
O proprietário corrigiu D1 e D4, confirmou D5 e autorizou o plano de seis fases, solicitando relatório de impacto antes da primeira branch de implementação. Este ato atualiza apenas documentação na branch existente.

- D1: alcoholOrderCutoff = 22:00 − MAX(45 minutos, limite superior real vigente da estimativa ponta a ponta). Padrão45 →21:15; high-demand45–60 →21:00; nunca usar média/limite inferior. Cutoff é resultado dinâmico, não horário fixo em configuração. Deadline22:00 permanece.
- Revalidar no submit com versão/validade da estimativa e reconfirmação se promessa mudar. Persistir snapshot/decisão por pedido; aceite/preparo/despacho reavaliam viabilidade restante, sem cancelar retroativamente apenas porque cutoff de novos pedidos mudou. Nunca ampliar silenciosamente promessa nem autorizar entrega tardia.
- D4: documento com FOTO e DATA DE NASCIMENTO visíveis: DNI, passaporte ou NIE acompanhado de documento que permita conferência. NIE sozinho → REFUSED_DOUBTFUL_ID. Inspeção visual não é captura: nenhuma foto/número/DOB gravados.
- D5: retenção herdada do dossiê do pedido/fiscal, marco no último lançamento contábil, não criação/entrega do pedido; referência mercantil e ressalvas preservadas. Esta precisão já constava no v5.7 e foi tornada explícita na projeção retentionUntil.
- D2/D3/D6 preservados: integral automático sem custo por falha de verificação; sem nova tentativa/terceiro/recepção; comando final atômico com três condições simultâneas.
- Autorização das seis fases registrada. Não solicitar repetição da autorização; cumprir relatório prévio antes de abrir primeira branch. Merge e produção continuam separados.

## Impacto anterior à implementação
[Especificação consolidada](../../requirements/ALCOHOL_COMPLIANCE_DOMAIN_REQUIREMENTS.md).
[Plano e matriz de impacto nos sete assets](../../requirements/ALCOHOL_COMPLIANCE_IMPLEMENTATION_PLAN.md).
CART e ORDER_IN_TRANSIT: alto impacto de comportamento/ETA; SAVED_ADDRESSES e OUT_OF_STOCK: atualização/revalidação de ETA e elegibilidade; SUPPORT: informação de limite variável; STORE_CLOSED mantém10:00–22:00 e não representa cutoff; PHONE_LOGIN_EMPTY sem alteração direta, catálogo público preservado. Nenhuma escolha foi revogada ou promovida, nenhum PNG alterado.
C-005: aviso de entrega antes22:00 continua correto. Falta decisão dinâmica server-side, bloqueio por item, atualização temporal e coexistência de high-demand com alcohol-cutoff, hoje valores exclusivos de apresentação. High-demand60 não bloqueia álcool o dia inteiro; antecipa cutoff para21:00. A afirmação do v5.7 de máximo45 em qualquer demanda é superada por esta nova decisão, sem reescrever o histórico.
Fontes: main certificada, HomeScreen/HomeCatalogRuntime e testes já investigados; matriz de assets do PR #32 no commit27bb14c47e3513143c1b103655334da1bedab119. Sem nova inspeção integral dos96 PNGs; não alegar alteração visual necessária por pixel ou horário fixo visível não verificado.

## Arquivos e validação
Modificados: docs/requirements/ALCOHOL_COMPLIANCE_DOMAIN_REQUIREMENTS.md; docs/requirements/ALCOHOL_COMPLIANCE_IMPLEMENTATION_PLAN.md; docs/checkpoints/INDEX.md.
Criado: este checkpoint v5.8. Nenhum removido. v5.7 e anteriores preservados.
Conferência documental, links locais e diff limitado a Markdown; nenhuma instalação/teste local. Eventual CI automático do novo SHA deve ser consultado no PR, sem antecipar resultado ou alegar domínio implementado.

## Pendências e próximo passo
Após apresentar o relatório, iniciar P1 pelo fluxo Issue → branch → contrato versionado → testes → PR, sob autorização já dada, com main/estado real revalidados. Nenhuma branch/issue de implementação criada nesta rodada. Não mergear PR #34/#32 sem aprovação. C-003/C-004, novas telas e produção seguem bloqueadas. Guardrail de checkpoints permanece pendência anterior.

SIX_PHASE_PLAN_AUTHORIZED = TRUE
IMPLEMENTATION_BRANCH_CREATED = FALSE
IMPLEMENTATION_STARTED = FALSE
EXISTING_CONTRACTS_CHANGED = FALSE
APPLICATION_CODE_CHANGED = FALSE
MIGRATIONS_CHANGED = FALSE
BASELINES_CHANGED = FALSE
MAIN_CHANGED = FALSE
MERGE_PERFORMED = FALSE
DRIVE_CHANGED = FALSE
ASSETS_PROMOTED = 0
NEW_SCREEN_CREATED = FALSE
C003_STARTED = FALSE
C004_STARTED = FALSE
PRODUCTION_ACTIVATED = FALSE
HISTORICAL_CHECKPOINT_OVERWRITTEN = FALSE
