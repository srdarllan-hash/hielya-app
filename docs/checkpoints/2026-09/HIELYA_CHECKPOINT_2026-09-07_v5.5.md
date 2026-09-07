# HIELYA_CHECKPOINT_2026-09-07_v5.5

## Identificação e resumo executivo
Data/hora UTC: 2026-09-07T03:41:38.450472+00:00.
Gate: DESIGN_TOKENS_1.2.0_PROMOTION.
Autorização explícita: proprietário, 2026-09-07, promoção do contrato existente sem alterar valores.
Issue: [#31](https://github.com/srdarllan-hash/hielya-app/issues/31).
PR: [#32](https://github.com/srdarllan-hash/hielya-app/pull/32), OPEN / DRAFT / NOT MERGED.
Branch: hielya/design-tokens-1-2-0-promotion.
Anterior: v5.4, commit 105732341e2c35b80935cff613df5733c4bb5454, registra merge PR #30 e Issue #28 CLOSED / COMPLETED.
Main no ato: 4d32cebcc7f68832940f6825177d5348d63f245a, inalterada neste gate.

Design Tokens 1.2.0 formalizados como **APPROVED_FROZEN** na branch e no registro canônico. Integração dessa decisão em main aguarda revisão e aprovação de merge. O CI integral da branch foi concluído com sucesso. Nenhuma tela, token value ou componente foi criado/alterado.

## Estado exato validado e evidências
- HEAD validado nesta branch: 4deb628524b175d7f3b54d4e87d104bc3b2582aa.
- Árvore: c87c273684b93d58751400926840db78d86fe13c.
- Run: https://github.com/srdarllan-hash/hielya-app/actions/runs/34080055741, SUCCESS.
- Todos os sete jobs SUCCESS: qualidade, cinco suites de navegador e resultado agregado.
- Unidade/cobertura: 312 PASS / 36 arquivos; foundation C-001/C-002/C-005: 369; C-002 alignment: 49; prequote: 12; Home Catalog: 48; Product Detail: 45. Total **835 PASS**, zero falhas, nenhum flaky reportado.
- Tokens, lint, typecheck, Next build e Storybook build PASS. GATE_VALIDATION, --update-snapshots=none; verificação CI de testes/baselines sem gravação PASS.
- Referência prévia: run 34079006607 no HEAD 938b4590d7cdb0bebfbf02176a8faec8715f8021; árvore 3218db4049527e94151d0c8cfe988ab87ac13ac9 idêntica à main após PR #30.
- O commit que acrescenta este checkpoint inclui apenas fechamento documental/metadados. Será revalidado integralmente; seu resultado final deve ser consultado no PR #32, sem atribuir-lhe antecipadamente o resultado deste run e sem reescrever este arquivo.

## Delta 1.1.0 → 1.2.0
Baseline 1.1.0 congelada: c838cfc26176b2e748bdbd037147a7f362d5a3c2.
106 tokens originais mantêm todos os valores/tipos/descrições; zero removidos ou alterados. Oito typeStyles e demais propriedades anteriores fora de meta preservados.
63 adições existentes desde 8bd134f4749c48e0921589add766e9b9bad9b418: dimensões, sete efeitos, quatro opacidades e motion.duration.skeleton; compilação determinística/serialização CSS de sombras, export CSV e versão 1.2.0. Mais uma adição em 1ada8338138a86b5fadec0c3bb47879d8fc3efc0 / PR #26: dangerBackground #D83A3A. Total atual 170 tokens.
Button danger usa branco #FFFFFF sobre #D83A3A = 4.579:1. dangerFill #EF4444 e dangerText #F87171 preservados. Nenhuma mudança de valor nesta promoção.
Inventário completo: docs/design-system/TOKENS_1_2_0_DELTA.md. Fonte sem meta SHA-256: 874aa0b958569b99a4fdd68d95897f12dd1d3b2e44956c3fe7b8ad0b9c1f59f5.
CSS SHA-256: 93c44aff485c249ccfc11568f3dbb6700d87cfd28cd65bebeae3143dff8ae5b4; CSV SHA-256: 24875981f70556813d94a13d352d6fdb504ffc9c5105de5a46733ded5ad929f5. Ambos idênticos à main. TS muda somente tokenMeta.

## Ato formal e arquivos
- tokens.json e tokens.ts: status/data/main SHA/gate/Issue/referência CI e política de mudança.
- manifests/versions.json: frozenSource 1.2.0, previousFrozenSource 1.1.0, status APPROVED_FROZEN. Campo consolidationCandidate preservado como identificador histórico consumido pelo auditor existente; significado explicitado, sem alterar/afrouxar auditor.
- manifests/certifications.json: nova seção designTokensPromotion; registros históricos e architectureConsolidation preservados.
- CLAUDE.md: main e gate correntes, autoridade code-first e bloqueios reais.
- docs/design-system/: ato de promoção, inventário de delta e avaliação individual de assets.
- INDEX + novos checkpoints v5.4/v5.5. Nenhum checkpoint histórico sobrescrito.
A biblioteca React atual é 1.3.0 com manifest GATE_2_APPROVED_FROZEN existente; este gate não redefine todos os registros/versionamentos históricos de componentes nem aprova componentes ausentes.

## Oito critérios dos sete assets
Registro: https://docs.google.com/spreadsheets/d/1BkaFcxeouK3B41tZ8-ECPyR2bXuBNl_R8i6r1KRGBVc/edit
Critérios originais v4.4/Resumo D13:D20 preservados: (1) seleção explícita exata; (2) coerência nome/caminho/conteúdo; (3) conformidade com DS congelado; (4) copy/estados/comportamento canônicos; (5) QA visual/a11y/responsividade; (6) fonte editável/render com versão/SHA; (7) registro da transição/checkpoint; (8) mudanças posteriores criam candidato.
**Resultado: 0/7 APPROVED.** A disponibilidade de DS congelado não prova conformidade de cada PNG. Todos carecem de evidência integral C3/C5/C6, e a validação do comportamento C4 não pode ser inferida da seleção. C7 não é executado sem os anteriores. C1 e regra C8 preservados.

| Família / escolha | Drive ID | Pendência individual adicional |
|---|---|---|
| PHONE_LOGIN_EMPTY / A / V1 | 1RodSJwcZPzcxeyff1C3B544EQOCdMw9e | Input/PhoneInput e estados sem contrato/QA aprovado; preservar Ahora no, catálogo público, login na compra. |
| STORE_CLOSED / A / V2 | 1P38eQJMovKndd-YubSTwIkEWUHxEhVxo | Horário correto 10:00–22:00; comprovar comportamento/estados de Notificarme cuando abra. |
| SUPPORT / A / V2 | 1OwuRJxhG2ODd1mi2EUiqUuQkCU5iKix7 | Horário/canais selecionados; comprovar estados/comportamento e QA por asset. |
| CART / A / V2 | 1lsB2IMEw1f2g86eKIPwhm2T0T7hzfraU | WELCOME10/preços não certificados; taxa exibida não comprova componente por km. Mínimo €25 não sana essas divergências. |
| ORDER_IN_TRANSIT / A / V2 | 1zBUIAP0s_8W3acWptUsJqVmAVdgDUv6O | Mapear timeline/ETA ao contrato real; rastreamento ao vivo continua fora do MVP. |
| SAVED_ADDRESSES / A / V2 | 1J1X7gSWqwZBX-g0kEO9SgYTBevLLNMH6 | Vincular área/ETA/estados ao contrato e QA; não inferir raio numérico que não está expresso na imagem. |
| OUT_OF_STOCK / C / V2 | 16ZlJM9i9jHkWV8CT4YsKLO5fpfwJPb0u | Preços de similares sem rastreabilidade; nome DUPLICATE_SUPERSEDED e caminho Archive_Superseded ainda conflitantes (C2). |

Nomes/caminhos exatos, matriz C1–C8 e fontes em docs/design-system/SELECTED_ASSET_ACCEPTANCE_1_2_0.md. Não se alegou nova inspeção visual/QA dos PNGs: revisão de elegibilidade baseada no registro/auditoria existentes. Nenhuma escolha do proprietário revogada.
Registro/Conflitos atualizados para SELECTED_PENDING_ASSET_ACCEPTANCE; Resumo atualizado para 7 pendentes e 0 aprovados. Decisões de produto preservadas. Auditoria operacional histórica permanece fonte, não foi convertida em QA de implementação. Binários e variantes não escolhidas não foram alterados/excluídos.

## PNGs do Design System e boards
Seis PNGs DS + nove boards permanecem REFERENCE_ONLY / VISUAL_INTENT, não são tokens/componentes nem critérios de aceite. Registro confirma 15 referências. Nenhum PNG promovido.

## Riscos, pendências e próximos passos
Aguardar resultado CI no HEAD documental final e aprovação explícita para merge do PR #32. PRs documentais #24/v5.1 e #29/v5.2 permanecem pendentes, fora deste merge. Guardrail mecânico de não-sobrescrita segue pendente, não implementado.
As lacunas de assets e contratos de campo exigem gates próprios; promoção não inicia C-003/C-004. Produção, SMS real, checkout/pagamento e deploy continuam bloqueados.

TOKENS_1_2_0_STATUS = APPROVED_FROZEN
TOKEN_VALUES_CHANGED = FALSE
ASSETS_PROMOTED_TO_APPROVED = 0
SELECTED_PENDING_ASSET_ACCEPTANCE = 7
DS_PNGS_AND_BOARDS_REFERENCE_ONLY = 15
PR_32_MERGED = FALSE
MAIN_CHANGED_IN_PROMOTION_GATE = FALSE
C003_STARTED = FALSE
C004_STARTED = FALSE
NEW_SCREEN_CREATED = FALSE
PRODUCTION_ACTIVATED = FALSE
DEPLOYMENT_PERFORMED = FALSE
HISTORICAL_CHECKPOINT_OVERWRITTEN = FALSE
