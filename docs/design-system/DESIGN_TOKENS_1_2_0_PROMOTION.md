# DESIGN_TOKENS_1.2.0_PROMOTION

## Ato formal
Status: **APPROVED_FROZEN**, autorização explícita do proprietário em 2026-09-07. Registro: 2026-09-07T03:32:13.922340+00:00. Issue #31. Aplicado na branch `hielya/design-tokens-1-2-0-promotion`; integração em main aguarda aprovação de merge e validação integral no HEAD exato.

Main no ato: `4d32cebcc7f68832940f6825177d5348d63f245a`. CI de referência: [34079006607](https://github.com/srdarllan-hash/hielya-app/actions/runs/34079006607), HEAD `938b4590d7cdb0bebfbf02176a8faec8715f8021`, árvore `3218db4049527e94151d0c8cfe988ab87ac13ac9`, idêntica à main. 835 PASS, zero falhas, nenhum flaky reportado. Nova validação integral obrigatória nesta branch antes de merge; resultado vinculado no PR e checkpoint de fechamento.

## Contrato congelado
`packages/design-tokens/src/tokens.json` 1.2.0 e bindings determinísticos. Autoridade: tokens + componentes React certificados existentes; PNGs não são autoridade. [Delta completo](./TOKENS_1_2_0_DELTA.md): 106 tokens 1.1.0 preservados, 63 adições de consolidação e dangerBackground do PR #26. Nenhum valor é modificado neste gate. CSS/CSV permanecem idênticos à main; TS muda somente tokenMeta.

A correção aprovada já usa branco #FFFFFF sobre #D83A3A no Button danger (4.579:1). `dangerFill` #EF4444, bordas e `dangerText` #F87171 permanecem intactos. A promoção não certifica usos arbitrários de pares de cores.

1.1.0 e certificações C-001/C-005 continuam como história congelada. O campo architectureConsolidation histórico em certifications.json é preservado; a nova seção designTokensPromotion registra a decisão atual. Os nomes antigos consolidationCandidate/gate2Candidate da biblioteca não são reinterpretados como promoção de novos componentes: o manifest atual de componentes 1.3.0 já registra GATE_2_APPROVED_FROZEN.

## Validação e aceite
Workflow Design System Validation: instalação frozen-lockfile, tokens:check, lint, type-check, 312 testes unitários/cobertura, Next build, Storybook build, regressões foundation/C-001/C-002/C-005 (369), C-002 alignment (49), prequote (12), Home (48), Product Detail (45). Expectativa herdada: 835 testes; reportar contagem observada. Sete jobs devem concluir SUCCESS no HEAD da branch. Nenhum snapshot pode ser gravado; nenhum baseline será alterado. Não declarar CI novo antes da conclusão.

## Assets e escopo
[Oito critérios, sete avaliações individuais](./SELECTED_ASSET_ACCEPTANCE_1_2_0.md). Resultado documental: zero elegíveis para APPROVED; seleção do proprietário preservada. DS congelado é uma condição necessária, não prova conformidade de PNG, acessibilidade ou proveniência code-first.

Os seis PNGs originais DS e nove boards permanecem REFERENCE_ONLY / VISUAL_INTENT. Não são promovidos. Novas mudanças de valor exigem nova versão, matriz de impacto, CI/QA e aprovação explícita.

Sem C-003/C-004, telas, Input/PhoneInput/OtpInput, produção, deploy ou merge automático.
