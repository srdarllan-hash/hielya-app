# HIELYA_CHECKPOINT_2026-09-07_v5.7

## Identificação e resumo
Gate: ALCOHOL_COMPLIANCE_DOMAIN_REQUIREMENTS — OWNER_DECISIONS_RECORDED.
Data/hora UTC: 2026-09-07T04:15:11.484242+00:00.
Issue: [#33](https://github.com/srdarllan-hash/hielya-app/issues/33).
PR: [#34](https://github.com/srdarllan-hash/hielya-app/pull/34), OPEN / DRAFT / NOT MERGED.
Branch: hielya/alcohol-compliance-domain-requirements.
Anterior: [v5.6](./HIELYA_CHECKPOINT_2026-09-07_v5.6.md), lido integralmente com a política antes de alterar documentos.
Main real verificada: `4d32cebcc7f68832940f6825177d5348d63f245a`, tree `3218db4049527e94151d0c8cfe988ab87ac13ac9`.
HEAD remoto anterior validado: `7dea7b4c52b366215cf56087306ba9a692bae474`, tree `587454464828303665317b9b319a65d0eb1b622f`.
Este novo checkpoint integra o commit documental seguinte; seu SHA final é verificável no PR/histórico, sem autorreferência fictícia.

O proprietário decidiu as seis pendências e autorizou finalizar a especificação e preparar o plano, sem código. A [especificação consolidada](../../requirements/ALCOHOL_COMPLIANCE_DOMAIN_REQUIREMENTS.md) registra as decisões; o [plano de implementação](../../requirements/ALCOHOL_COMPLIANCE_IMPLEMENTATION_PLAN.md) aguarda autorização. Nenhum contrato existente é alterado ou substituído por esta documentação.

## Decision Log — seis decisões expressas
- D1: SLA máximo completo de 45 minutos; cutoff de novos pedidos às 21:15 Europe/Madrid; entrega antes de 22:00. Guardas server-side em checkout/criação, aceite, início/fim do preparo, despacho, chegada e handover. Cutoff de novas compras não se confunde com horário de despacho de pedido já aceito; este ainda precisa cumprir promessa/deadline.
- D2: recusa por falha de verificação implica integral automático, sem custo ao cliente. Especificado como pedido inteiro, inclusive misto, sem entrega parcial; cancelar autorização não capturada ou estornar saldo capturado, incluindo frete, sem taxa. Automático não significa crédito bancário instantâneo: obrigação/evento idempotente e confirmação real do processador.
- D3: sem nova tentativa no mesmo pedido, sem entrega a terceiro/recepção. Somente novo pedido independente com destinatário adulto presente. Reenvio técnico idempotente não é nova tentativa física.
- D4: DNI, NIE ou passaporte; inspeção visual sem foto, número ou nascimento gravados. Precisão factual documentada: NIE isolado é identificador e não prova pessoa/idade; suporte insuficiente não produz VERIFIED_18_PLUS. Passaporte já aceito resolve apresentação documental insuficiente sem ampliar coleta.
- D5: evidência mínima herda retenção do dossiê do pedido/fiscal, sem prazo independente. Referência mercantil geral: seis anos desde último lançamento contábil, ressalvadas obrigações especiais; não um teto universal desde a compra. Arquivo restrito, necessidade documentada e eliminação/bloqueio coordenados; não estender a todos os dados de conta por arrasto.
- D6: único comando final atômico valida prazo + maioridade + PIN juntos; nenhum sucesso parcial/chamada isolada pode concluir entrega. Proposta de versionar verify-pin histórico como comando final ampliado, sem segunda rota concorrente. age-check isolado não autoriza handover; falhas/refusals não gravam sucesso reutilizável.

## Precisões jurídicas consultadas
[Código de Comércio art. 30](https://www.boe.es/buscar/act.php?id=BOE-A-1885-6627#a30): regra mercantil geral de seis anos a partir do último lançamento, com ressalva de disposições especiais.
[AEAT — conservação de faturas](https://sede.agenciatributaria.gob.es/Sede/iva/facturacion-registro/facturacion-iva/obligacion-conservar-facturas.html): prazo fiscal geral de quatro anos não substitui obrigação mercantil aplicável.
[LOPDGDD art. 32](https://www.boe.es/buscar/act.php?id=BOE-A-2018-16673#a32): bloqueio/destruição quando aplicáveis; arquivo legal não é uso operacional irrestrito.
[Ministério do Interior — TIE](https://www.interior.gob.es/opencms/es/servicios-al-ciudadano/tramites-y-gestiones/extranjeria/regimen-general/tarjeta-de-identidad-de-extranjero/): diferencia situação administrativa e comprovação de identidade. Não declarar número NIE sozinho suficiente para inspeção.
As fontes sustentam as precisões, não uma alegação de que toda evidência etária é obrigatoriamente documento fiscal. Finalidade/necessidade da retenção mínima devem constar na política do dossiê. Fontes consultadas em 2026-09-07. Sem certificação jurídica integral/produção.

## Investigação C-005 e impacto
HomeScreen possui alcohol-cutoff com badge informativo, enum, story e baselines. blocked considera somente closed/out-of-area; containsAlcohol é usado para rótulo, não guarda temporal. onAdd emite eventos, sem checkout de domínio.
HomeCatalogRuntime mantém estado de catálogo/filtros e não recebe decisão temporal de álcool. Testes atuais separam apresentação Storybook de runtime real; testam aviso/render/console e catálogo, não cutoff/pedido/handover.
High-demand ilustra 45–60 minutos: incompatível com promessa máxima de 45 minutos para álcool; futura integração deve bloquear álcool quando capacidade não cumprir SLA, não aumentar promessa silenciosamente.
O plano especifica estado operacional separado, validade/resincronização, ações por item, server-side obrigatório e QA acessível. Não reintroduzir rota pública obsoleta /?state=...; não atualizar baseline nesta rodada.
Inventário de 96 PNGs não foi re-auditado nem alterado; limitações visuais registradas no v5.6 permanecem. Sete selecionados não promovidos, seis PNGs DS e nove boards permanecem referência.

## Plano para autorização, não executado
P1 contrato versionado → P2 fundação pedido/entrega/compliance → P3 handover atômico/recusa terminal → P4 integral automático/estoque/retenção → P5 integração C-005 → P6 certificação completa.
P1–P6 são identificadores de propostas, não issues criadas. Cada etapa exige fluxo Issue → branch → testes → PR → revisão → merge separado. Camadas reais de pedido/pagamento/admin ainda exigem autorização própria; não presumir implementação pelo OpenAPI histórico. C-003/C-004 e telas novas continuam bloqueadas.
Tratamento financeiro específico de falhas operacionais não etárias, como atraso, não foi convertido em nova decisão comercial implícita: usar política geral aprovada ou revisar antes de ativar esse caso. Bloqueio de entrega é obrigatório independentemente dessa resolução financeira.

## Arquivos, validação e evidências
Modificados: docs/requirements/ALCOHOL_COMPLIANCE_DOMAIN_REQUIREMENTS.md; docs/checkpoints/INDEX.md.
Criados: docs/requirements/ALCOHOL_COMPLIANCE_IMPLEMENTATION_PLAN.md; este checkpoint v5.7.
Nenhum removido. Históricos v5.6 e anteriores preservados integralmente.
Validação: leitura direcionada de código/testes, fontes oficiais, consistência documental, links locais e diff restrito a Markdown. Nenhuma instalação, teste local ou baseline gerada.
CI do HEAD anterior: [34081863819](https://github.com/srdarllan-hash/hielya-app/actions/runs/34081863819) SUCCESS, verificado nesta rodada; workflow histórico 34081863968 SKIPPED. Isso atualiza o resultado que estava pendente ao fechar v5.6, sem reescrevê-lo. Não atribuir esse run ao próximo SHA. CI automático do commit documental final deve ser consultado no PR; não certifica domínio ainda não implementado.

## Estado e próximo passo
Revisar a especificação consolidada e autorizar, se desejado, a sequência do plano antes de qualquer código. PR #34 permanece draft e sem merge. PR #32 não alterado/integrado nesta tarefa. Main e produção inalteradas; guardrail mecânico de não-sobrescrita segue pendência anterior, fora do escopo.

OWNER_DECISIONS_RECORDED = 6
IMPLEMENTATION_AUTHORIZED = FALSE
APPLICATION_CODE_CHANGED = FALSE
EXISTING_CONTRACTS_CHANGED = FALSE
MIGRATIONS_CHANGED = FALSE
BASELINES_CHANGED = FALSE
MAIN_CHANGED = FALSE
MERGE_PERFORMED = FALSE
FUTURE_IMPLEMENTATION_ISSUES_CREATED = 0
DRIVE_CHANGED = FALSE
ASSETS_PROMOTED = 0
C003_STARTED = FALSE
C004_STARTED = FALSE
NEW_SCREEN_CREATED = FALSE
PRODUCTION_ACTIVATED = FALSE
HISTORICAL_CHECKPOINT_OVERWRITTEN = FALSE
