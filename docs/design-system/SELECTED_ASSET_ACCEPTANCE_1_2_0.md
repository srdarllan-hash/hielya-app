# Sete assets — aceite cumulativo após congelamento dos tokens 1.2.0

Gate DESIGN_TOKENS_1.2.0_PROMOTION, Issue #31, 2026-09-07.
Fonte: registro canônico [HIELYA_ASSET_REGISTRY_2026-09-04](https://docs.google.com/spreadsheets/d/1BkaFcxeouK3B41tZ8-ECPyR2bXuBNl_R8i6r1KRGBVc/edit), abas Registro, Conflitos, Resumo e Auditoria_Operacional; checkpoints v4.4/v4.7/v4.9. Os oito critérios originais são preservados, sem flexibilização.

## Critérios e evidência

| Nº | Critério original | Resultado desta revisão |
|---|---|---|
| 1 | Aprovação explícita, família/nome/versão/Drive ID exatos | PASS: sete escolhas do proprietário, registradas abaixo e no v4.7. Seleção não é aceite técnico. |
| 2 | Nome/caminho/conteúdo coerentes, sem conflito/duplicata aberto | Seis seleções remapeadas/resolvidas; OUT_OF_STOCK ainda usa nome/caminho de superseded. |
| 3 | Conformidade com DS formalmente APPROVED_FROZEN aplicável | Disponibilidade do contrato 1.2.0 resolvida pelo gate; conformidade individual dos PNGs não demonstrada. Não confundir os dois fatos. |
| 4 | Copy/estados/comportamento alinhados a PRD/contratos/decisões | Aprovações de produto preservadas; CART/OUT_OF_STOCK têm divergências. Nos demais, escolhas/hora corretas não comprovam todos os estados e comportamentos. |
| 5 | QA visual/a11y: contraste, legibilidade, hierarquia, toque, responsividade, clipping | Sem evidência integral por asset. CI de C-001/C-002/C-005 não é QA dessas sete imagens/telas. |
| 6 | Fonte editável ou render code-first, versão/SHA, Drive ID e evidência | Drive ID/versão existem; registro não vincula cada escolhido a fonte editável ou render de SHA. PNG sozinho não atende. |
| 7 | Transição para APPROVED registrada e novo checkpoint | Não executada, pois critérios anteriores faltam. Resultado e status pendente registrados neste gate. |
| 8 | Mudanças posteriores geram novo candidato, sem alteração silenciosa | Regra mantida. Binários existentes não alterados; variantes não escolhidas permanecem superseded. |

Resultado: **0 de 7 promovidos a APPROVED**. Status equivalente mais preciso: **SELECTED_PENDING_ASSET_ACCEPTANCE**; a escolha permanece válida. Não há novo pedido de decisão visual, somente lacunas de evidência/contrato a resolver em gates autorizados.

## Matriz individual

Legenda: P = comprovado; U = não comprovado integralmente; F = divergência explícita; N = transição não efetuada por bloqueio; R = regra preservada. Em C3, U é conformidade do asset, não status dos tokens. C1 P é seleção explícita, não dispensa demais critérios.

| Família / escolha | Drive ID / versão / nome exato | C1 | C2 | C3 | C4 | C5 | C6 | C7 | C8 | Pendências |
|---|---|---|---|---|---|---|---|---|---|---|
| HLY_CLIENT_03_PHONE_LOGIN_EMPTY / A | 1RodSJwcZPzcxeyff1C3B544EQOCdMw9e / V1 / HLY_CLIENT_03_PHONE_LOGIN_EMPTY_V1.png | P | P | U | U | U | U | N | R | Preservar “Ahora no” e catálogo público/login na compra. Falta contrato aprovado de Input/PhoneInput, associação a fonte editável/render de SHA e QA de teclado, leitura, estados e responsividade. |
| HLY_STATE_STORE_CLOSED / A | 1P38eQJMovKndd-YubSTwIkEWUHxEhVxo / V2 / HLY_STATE_STORE_CLOSED_V2.png | P | P | U | U | U | U | N | R | Horário 10:00–22:00 aprovado. Falta evidência implementável/QA da ação “Notificarme cuando abra”, conformidade individual e proveniência de render ou fonte editável. |
| HLY_CLIENT_SUPPORT / A | 1OwuRJxhG2ODd1mi2EUiqUuQkCU5iKix7 / V2 / HLY_CLIENT_SUPPORT_V2.png | P | P | U | U | U | U | N | R | Horário 10:00–22:00 e direção dos canais aprovados. Faltam evidência de funcionamento/estados dos canais, conformidade individual, fonte e QA. |
| HLY_CLIENT_CART_COUPON_APPLIED / A | 1lsB2IMEw1f2g86eKIPwhm2T0T7hzfraU / V2 / HLY_CLIENT_CART_COUPON_APPLIED_V2.png | P | P | U | F | U | U | N | R | WELCOME10 não certificado; preços de packs/caixas sem rastreabilidade; €2,00 isolado não prova taxa total (falta componente por km). Mínimo €25 aprovado não sana esses pontos. Faltam também fonte, conformidade e QA. |
| HLY_CLIENT_ORDER_IN_TRANSIT / A | 1zBUIAP0s_8W3acWptUsJqVmAVdgDUv6O / V2 / HLY_CLIENT_ORDER_IN_TRANSIT_V2.png | P | P | U | U | U | U | N | R | Timeline + suporte e ausência de mapa ao vivo aprovados. Falta mapear etapas/ETA ao contrato real e comprovar fonte, conformidade e QA; não prometer rastreamento ao vivo. |
| HLY_CLIENT_SAVED_ADDRESSES / A | 1J1X7gSWqwZBX-g0kEO9SgYTBevLLNMH6 / V2 / HLY_CLIENT_SAVED_ADDRESSES_V2.png | P | P | U | U | U | U | N | R | Direção área de entrega/ETA aprovada; falta vincular dados a contrato/configuração e documentar estados, fonte, conformidade e QA. A auditoria não encontrou raio numérico visível: não inferir que a imagem comprova 4 km. |
| HLY_STATE_OUT_OF_STOCK / C | 16ZlJM9i9jHkWV8CT4YsKLO5fpfwJPb0u / V2 / HLY_STATE_OUT_OF_STOCK_V2_DUPLICATE_SUPERSEDED_2026-08-13.png | P | F | U | F | U | U | N | R | Preços de similares sem rastreabilidade contratual. Drive ID escolhido ainda tem caminho Archive_Superseded e nome DUPLICATE_SUPERSEDED: seleção não resolveu coerência de nome/caminho. Faltam fonte, conformidade individual e QA. Nenhum arquivo movido, renomeado ou excluído neste gate. |

## Limites e proveniência

As observações operacionais são evidências da auditoria de 2026-09-04, relidas nesta revisão. Não alegamos ter feito novo QA visual dos PNGs. A árvore de tokens/componentes da main atual e o CI verde não renderizam essas sete escolhas. As diferenças de paleta/escala dos PNGs DS documentadas no v4.9 também não podem ser atribuídas automaticamente a cada uma destas telas sem medição individual.

Fonte de baseline operacional: main df912c101b3db5c910a8c575fb2e2e687a54f4f5 da auditoria; main atual 4d32cebcc7f68832940f6825177d5348d63f245a. Os contratos comerciais não foram alterados pelos PRs #26/#30. Não inventar cupom, preço, SLA ou comportamento para tornar uma imagem elegível.

Seis PNGs DS + nove boards continuam REFERENCE_ONLY / VISUAL_INTENT; nenhum deles recebe APPROVED. Este gate não implementa as lacunas, não inicia C-003/C-004 e não cria telas.

