# HIELYA_CHECKPOINT_2026-09-07_v5.6

## Identificação e resumo
Gate: ALCOHOL_COMPLIANCE_DOMAIN_REQUIREMENTS.
Status: SPECIFICATION_PROPOSED / OWNER_REVIEW_REQUIRED / NOT_IMPLEMENTED.
Data/hora UTC: 2026-09-07T04:05:31.700833+00:00.
Autorização: proprietário solicitou especificação completa, sem implementação, contratos existentes inalterados e próximo checkpoint.
Issue: [#33](https://github.com/srdarllan-hash/hielya-app/issues/33).
PR: [#34](https://github.com/srdarllan-hash/hielya-app/pull/34), OPEN / DRAFT / NOT MERGED.
Branch: hielya/alcohol-compliance-domain-requirements, criada diretamente da main.
Main validada: `4d32cebcc7f68832940f6825177d5348d63f245a`.
Main tree: `3218db4049527e94151d0c8cfe988ab87ac13ac9`.
Commit da especificação: `b390a66472519d319a0adc4b5722dbd2084312df`.
Tree da especificação: `dc5edade2de56229184c0071c13b794ccb9f5e70`.

A especificação está em [ALCOHOL_COMPLIANCE_DOMAIN_REQUIREMENTS.md](../../requirements/ALCOHOL_COMPLIANCE_DOMAIN_REQUIREMENTS.md). É proposta revisável; não substitui os contratos certificados nem certifica operação jurídica/produção. Este checkpoint acrescenta fechamento documental ao commit da especificação; seu próprio SHA será consultável no histórico/PR, sem autorreferência fictícia.

## Continuidade validada e divergência de branches
Último checkpoint lido integralmente antes das alterações: [v5.5 no HEAD do PR #32](https://github.com/srdarllan-hash/hielya-app/blob/27bb14c47e3513143c1b103655334da1bedab119/docs/checkpoints/2026-09/HIELYA_CHECKPOINT_2026-09-07_v5.5.md).
PR #32 verificado OPEN / DRAFT / NOT MERGED; HEAD `27bb14c47e3513143c1b103655334da1bedab119`; CI [34080543244](https://github.com/srdarllan-hash/hielya-app/actions/runs/34080543244) SUCCESS no HEAD final. O v5.5 registrava CI inicial e orientava verificar esse resultado final.
A promoção APPROVED_FROZEN 1.2.0 existe na branch do PR #32 e no registro Drive, mas não está integrada à main. Esta branch não incorpora essa promoção. v5.4 e v5.5 continuam no PR #32; v5.1/#24 e v5.2/#29 são precedentes documentais pendentes conforme v5.5. O índice desta branch aponta os precedentes por URLs imutáveis, sem copiar ou reescrever seus conteúdos.
CI de referência da resolução da main: [34079006607](https://github.com/srdarllan-hash/hielya-app/actions/runs/34079006607), já registrado como 835 PASS no v5.5, árvore equivalente à main. Não se atribui esse resultado a uma implementação de compliance inexistente.

## Achados e decisões registradas
1. O Decreto 167/2002 abrange venda, fornecimento e distribuição. Entrega efetiva antes de 22:00 é requisito deste gate, mas não elimina as guardas anteriores. Fórmula cutoff = deadline menos SLA máximo completo é requisito de engenharia solicitado, não transcrição legal.
2. Existe apresentação C-005 alcohol-cutoff com story/baselines. HomeCatalogRuntime não a integra como decisão temporal; HomeScreen bloqueia closed/out-of-area, não implementa guarda de álcool. A lacuna é integração/domínio, não ausência absoluta de apresentação.
3. OpenAPI histórico V1_0 já prevê age-check, verify-pin, fail e refunds, além de campos temporais e razões de recusa. O perfil público MVP não implementa esse ciclo. A especificação propõe evolução versionada sem alterar qualquer contrato nesta tarefa.
4. Persistência atual possui flags de produto e PIN, não entidade operacional completa de entrega/verificação etária. PIN, autenticação OTP e declaração de idade não comprovam inspeção presencial.
5. Requisitos solicitados documentados: prazo + idade + PIN cumulativos; dados mínimos; hotel com encontro presencial; nenhuma entrega desacompanhada/recepção como depósito.
6. Opções de pedido misto, nova tentativa, reembolso/cancelamento de autorização e retorno de estoque estão abertas. Não houve escolha automática de política comercial, retenção ou interface final.

## Fontes e cobertura dos assets
Fontes legais consultadas em 2026-09-07: [Decreto 167/2002](https://www.juntadeandalucia.es/boja/2002/67/4), [Lei 4/1997 consolidada](https://www.boe.es/buscar/act.php?id=BOE-A-1997-18301), [orientação AEPD](https://www.aepd.es/preguntas-frecuentes/10-menores-y-educacion/1-sistemas-de-verificacion-edad). A orientação AEPD é de verificação online; adaptação presencial é requisito de domínio proposto, não procedimento oficial de courier atribuído à agência.
Registro consultado ao vivo: [Registro A1:L97](https://docs.google.com/spreadsheets/d/1BkaFcxeouK3B41tZ8-ECPyR2bXuBNl_R8i6r1KRGBVc/edit).
96 itens; 56 candidatos, 7 selected_pending_asset_acceptance, 18 superseded e 15 REFERENCE_ONLY; 0 APPROVED. Nenhuma alteração no Drive.
Não há asset dedicado identificado no inventário para álcool fora de horário, inspeção no handover ou recusa. Não foi realizada inspeção integral dos 96 binários, portanto ausência absoluta de referências visuais internas não é certificada. Asset HOTEL existe; não prova cobertura de verificação etária.
Os sete selecionados têm impactos individuais descritos na especificação; escolhas anteriores preservadas. Novo requisito de comportamento não elimina pendências C3/C5/C6 e demais critérios do v5.5. Seis PNGs DS e nove boards continuam REFERENCE_ONLY / VISUAL_INTENT.

## Arquivos e validação
Criados: docs/requirements/ALCOHOL_COMPLIANCE_DOMAIN_REQUIREMENTS.md; este checkpoint v5.6.
Modificado: docs/checkpoints/INDEX.md, somente índice/links de continuidade.
Removidos: nenhum.
Contratos OpenAPI, migrations 0001–0004, código, tokens, testes, baselines e CLAUDE.md preservados.
Validação documental: conferência das fontes, comparação direcionada de contrato/persistência/UI, verificação de links locais e diff limitado a documentação. Nenhuma instalação ou execução de teste local. O plano de testes descrito é prospectivo. Eventual CI automático do PR deve ser consultado no HEAD final e não prova regras ainda não implementadas; nenhum resultado futuro é antecipado neste checkpoint.

## Pendências, riscos e próximo passo
Revisar D1 SLA/margem e fronteira; D2 valores/pedido misto; D3 tentativas/hotel; D4 inspeção/documentos aceitos; D5 retenção/base legal; D6 comandos de aceite/handover. Sem essas decisões não iniciar implementação operacional.
Riscos: confundir aviso de UI com enforcement; aceitar PIN como idade; ETA de viagem como SLA completo; atraso após aceite; override de recepção; backfill fictício de idade; vazamento documental por notas; dupla reposição/reembolso. Controles e cenários futuros estão especificados.
O gate tem prioridade sobre especificação de componentes UI. Não inicia C-003/C-004. PR #34 aguarda revisão; PR #32 permanece separado. Guardrail mecânico de não-sobrescrita segue pendência anterior, não implementado aqui.
Nenhum contrato novo tornou-se canônico por este ato: a especificação é proposta e este checkpoint registra fatos/pendências canonicamente na branch do PR.

MAIN_CHANGED = FALSE
PR_CREATED = 34
PR_32_CHANGED = FALSE
MERGE_PERFORMED = FALSE
APPLICATION_CODE_CHANGED = FALSE
EXISTING_CONTRACTS_CHANGED = FALSE
MIGRATIONS_CHANGED = FALSE
TOKEN_VALUES_CHANGED = FALSE
DRIVE_REGISTRY_CHANGED = FALSE
ASSETS_PROMOTED = 0
C003_STARTED = FALSE
C004_STARTED = FALSE
NEW_SCREEN_CREATED = FALSE
PRODUCTION_ACTIVATED = FALSE
DEPLOYMENT_PERFORMED = FALSE
HISTORICAL_CHECKPOINT_OVERWRITTEN = FALSE
