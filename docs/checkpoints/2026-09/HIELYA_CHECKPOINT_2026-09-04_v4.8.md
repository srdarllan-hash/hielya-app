# HIELYA CHECKPOINT v4.8
## DESIGN_SYSTEM_PARTIAL_APPROVAL_GATE — validação técnica
Data/hora: set. 4, 2026 (timestamp UTC desta execução)
Repositório: srdarllan-hash/hielya-app
Main certificada: df912c101b3db5c910a8c575fb2e2e687a54f4f5
Árvore certificada: 774f3153add86419f4aa622267e51c7a6f786f3c
Checkpoint anterior: HIELYA_CHECKPOINT_2026-09-04_v4.7
Status do gate: VALIDATED_NOT_APPROVED
Escopo: Cores, Tipografia, Botões e Campos. Cards, Ícones, Navegação e Estados não foram avaliados nesta rodada.

# 1. Fontes verificadas
Google Drive / HIELYA / 00_Design_System:
HLY_DS_03_COLOR_PALETTE_V1.png — ID 1U5pyFkEsyfNTbDOVOR33dYxgM6-xqa1F — criado/modificado 2026-08-13T18:28:05.618Z.
HLY_DS_04_TYPOGRAPHY_V1.png — ID 1w63UCqGSAEWMQqMRKPDwYPbAWW3oXjzf — criado/modificado 2026-08-13T18:28:22.029Z.
HLY_DS_05_BUTTONS_V1.png — ID 1Kz2Dhqcr_BSk4dCrQ_XJ-M8tsG0bqSLu — criado/modificado 2026-08-13T18:28:34.139Z.
HLY_DS_06_FORM_FIELDS_V1.png — ID 1h5Ws_9rrbniohyuDSrX9zgytYOBfsvuq — criado/modificado 2026-08-13T18:28:47.481Z.
Referências pertinentes: HLY_REFERENCE_FULL_CLIENT_FLOW_DESIGN_SYSTEM_01.png; HLY_REFERENCE_LOGIN_SEARCH_CART_STATES_01.png; HLY_REFERENCE_LOGIN_SEARCH_CATALOG_STATES_01.png.
Código lido no SHA da main: packages/design-tokens/src/tokens.json, tokens.css; Button.tsx e stories; SearchField.tsx; ManualAddressForm.tsx; styles actions.css, foundations.css e discovery.css; exports do pacote UI.

# 2. Extração dos PNGs
Cores — valores explicitamente escritos:
Negro #050505; Carbón #101010; Dorado #E7A91A; Dorado claro #F5C348; Blanco #FFFFFF; Gris #A9A9A9; Disponible #2CC56E; Error #F04444.
A prancha ilustra swatches, cartões escuros e cantos arredondados, mas não define numericamente espaçamento, raio, borda, função semântica detalhada nem opacidade. O rodapé de uso está cortado à direita na imagem; não foi completado por inferência.

Tipografia — valores explicitamente escritos, interpretando “tamanho–entrelinha / peso”:
Display 48/56 Bold; Título 32/40 Bold; Subtítulo 22/28 Semibold; Cuerpo 16/20 Regular; Label 14/16 Medium; Caption 12/14 Regular. Família Poppins.
Microcopy de amostra: “Bebidas frías, en minutos.”; “Introduce el código”; “Entrega rápida en Fuengirola”; “Te enviaremos un código para confirmar tu número.”; “NÚMERO DE TELÉFONO”; “No compartas nunca tu código.”
Regra escrita: contraste alto, títulos curtos, corpo legível e uso limitado de caixa alta.
Não há definição de breakpoint, fallback de fonte, letter-spacing, cor por estilo nem regra de truncamento.

Botões — estados e microcopy explicitamente apresentados:
Primary: “CONTINUAR”, ação principal, preenchimento dourado e texto escuro.
Secondary: “USAR DIRECCIÓN MANUAL”, alternativa, fundo escuro, contorno e texto dourados.
Destructive: “CANCELAR”, somente ações críticas, preenchimento vermelho e texto branco.
Disabled: “CONTINUAR”, pré-condição não atendida, preenchimento carvão e texto cinza.
Loading: “Enviando código...”, bloquear duplo envio, preenchimento dourado, spinner e texto escuros.
Largura total, altura, padding, gap, raio, espessura de borda e tamanho do spinner são somente ilustrados; não possuem valor numérico no PNG. Hover, pressed e focus não são mostrados.

Campos — estados e microcopy explicitamente apresentados:
Telefone válido/focado: label “TELÉFONO”, valor “+34 612 345 678”, contorno dourado, helper “Formato: 9 dígitos espanhóis”.
Telefone inválido: valor “+34 612 34”, contorno vermelho, erro “Introduce un número español válido de 9 dígitos.”
OTP: label “CÓDIGO SMS”, seis células; três preenchidas com 2, 7 e 4 e três vazias.
Nome: label “NOME”, placeholder “Tu nombre”, helper “Campo obligatorio”.
Email: label “EMAIL (OPCIONAL)”, valor “tu@email.com”, indicador verde, helper “Pode ser completado depois”.
Altura, padding, gap, raio, borda e dimensões das células OTP são somente ilustrados. Não há valores numéricos nem estados empty/default, disabled, loading, read-only, autofill ou erro/complete do OTP. A própria prancha mistura português e espanhol.

# 3. Especificação adicional nas Referencias
A prancha FULL_CLIENT_FLOW contém outra paleta explícita: #000000, #121212, #1E1E1E, #D4A017, #FFFFFF, #22C55E e #EF4444; espaçamentos 8, 12, 20, 24, 32 e 40; raios 4, 12, 16 e 24; sombras baixa 0 2px 8px rgba(0,0,0,0.3), média 0 4px 16px rgba(0,0,0,0.4) e alta 0 8px 24px rgba(0,0,0,0.5).
Ela explicita Poppins Bold para títulos, Semibold para subtítulos, Regular para texto e Medium para pequeno, sem tamanhos.
As referências de login mostram email/senha e recuperação por email, não telefone/OTP. Elas são composições de tela e não fornecem métricas numéricas adicionais para os quatro domínios.

# 4. Divergências Drive versus código
Cores:
O PNG de paleta e o código divergem em background (#050505 vs #000000), surface (#101010 vs #121212), gold (#E7A91A vs #D4A017), gold claro/foco (#F5C348 vs #F6B800), cinza (#A9A9A9 vs secondary #B8B8B8 e muted #9A9A9A), sucesso (#2CC56E vs fill #22C55E e text #4ADE80) e erro (#F04444 vs fill #EF4444 e text #F87171).
A prancha FULL_CLIENT_FLOW coincide com os fills principais do código, mas conflita com o PNG COLOR_PALETTE_V1. Assim, a divergência também existe dentro do Drive.
Somente no código: elevated #1E1E1E, overlay/border subtle #2A2A2A, border strong #454545, disabled #737373, warning/info, scrim, glows e overlays.
Somente no PNG de paleta: os oito nomes Negro, Carbón, Dorado, Dorado claro, Blanco, Gris, Disponible e Error com seus valores exatos; não há tokens com esses nomes no JSON.

Tipografia:
PNG versus código 1.2.0: Display 48/56/700 vs 32/40/700; Título 32/40/700 vs 24/32/700; Subtítulo 22/28/600 vs heading 20/28/600; Cuerpo 16/20/400 vs body 16/24/400; Label 14/16/500 vs 14/20/500; Caption 12/14/400 vs 12/16/500.
Somente no código: bodySmall 14/20/400, button 16/24/600 e letter-spacing -0.2px, 0px, 0.1px. Somente no PNG: nomenclatura “Subtítulo” e as métricas maiores de Display/Título.
Família e pesos 400/500/600/700 coincidem, salvo Caption, que é Regular no PNG e Medium no código.

Botões:
O código possui variantes primary, secondary, ghost e danger; tamanhos md/lg; loading, disabled, leadingIcon e fullWidth. Ghost, md/lg e ícone não aparecem no PNG.
Código md: min-height 48px, padding 12px 20px, raio 12px, fonte 14/20 semibold; lg: min-height 48px, padding 16px 24px, fonte 16/24. Gap 8px, borda 1px, spinner 20px com borda 2px, transição 120ms e focus outline 2px/offset 2px. Esses valores não são definidos no PNG.
Primary e secondary no código usam #F6B800 plano; o PNG ilustra dourado com variação/gradiente associado a #E7A91A/#F5C348. Danger usa #EF4444 no código versus #F04444 no PNG. Disabled no código é a variante escolhida com opacity 0.38; no PNG é superfície carvão com texto cinza. Loading bloqueia e expõe aria-busy no código, mas a microcopy é fornecida por children; a story usa “Comprobando”, não “Enviando código...”. O código não aplica text-transform uppercase. Não há estilo hover/pressed; focus existe no código e não no PNG.

Campos:
Não existe Input/TextField genérico, PhoneInput nem OtpInput exportado no pacote UI. Existem SearchField e um input search/combobox em ManualAddressForm.
ManualAddressForm define min-height 48px, padding 12px 16px, borda 1px #454545, raio 12px, fundo #000000, texto #FFFFFF, fonte 14/20; inválido usa borda #EF4444 e erro #F87171 em 12/16. Focus global usa outline #F6B800 de 2px com offset 2px.
SearchField define 48px de altura, raio 16px, fundo #1E1E1E, borda #454545, fonte 14px e placeholder #9A9A9A.
Esses valores existem apenas no código. No PNG existem apenas telefone, OTP, nome, email, helpers e suas microcopies; nenhum equivalente React implementa os contratos de telefone/OTP. O erro ilustrado usa #F04444 e o indicador de sucesso usa #2CC56E, divergindo dos semânticos do código.

# 5. Contraste WCAG 2.x
As razões foram calculadas com luminância relativa sRGB. PASS normal exige 4.5:1; PASS grande exige 3:1.
Blanco #FFFFFF como texto sobre Negro #050505: 20.38:1 — PASS normal e grande.
Blanco #FFFFFF como texto sobre Carbón #101010: 19.03:1 — PASS normal e grande.
Gris #A9A9A9 como texto sobre Negro #050505: 8.67:1 — PASS normal e grande.
Gris #A9A9A9 como texto sobre Carbón #101010: 8.10:1 — PASS normal e grande.
Dorado #E7A91A como texto/ícone sobre Negro #050505: 9.79:1 — PASS normal e grande.
Dorado #E7A91A como texto/ícone sobre Carbón #101010: 9.14:1 — PASS normal e grande.
Error #F04444 como texto/indicador sobre Negro #050505: 5.45:1 — PASS normal e grande.
Error #F04444 como texto/indicador sobre Carbón #101010: 5.09:1 — PASS normal e grande.
Disponible #2CC56E como texto/indicador sobre Negro #050505: 9.04:1 — PASS normal e grande.
Disponible #2CC56E como texto/indicador sobre Carbón #101010: 8.44:1 — PASS normal e grande.
Texto atual sobre botão Dorado no PNG e no token onGold é preto (#000000): #000000 sobre #E7A91A = 10.09:1 — PASS normal e grande.
Verificação contextual do botão destrutivo ilustrado: branco #FFFFFF sobre #F04444 = 3.74:1 — FAIL para texto normal e PASS somente para texto grande. No código, branco sobre #EF4444 = 3.76:1, mesmo resultado de conformidade.

# 6. Cobertura para C-003 e C-004
Resultado: NÃO cobre 100%.
Os quatro domínios fornecem direção visual parcial, mas não um contrato implementável completo.
C-003 Login: não há componente de telefone; faltam contrato de estado empty/default, validação e máscara E.164/+34, atributos de teclado/autocomplete, disabled/loading/read-only, vínculo helper/error e definição numérica do campo. As referências de login existentes são email/senha, não o fluxo público com telefone.
C-004 OTP: não há componente OTP; faltam foco por célula, avanço/retrocesso, paste, complete, invalid/error, disabled/loading, resend/cooldown e semântica acessível do grupo. A prancha mostra apenas um estado parcial 3/6.
Button cobre programaticamente primary, secondary, danger, disabled e loading, mas a correspondência visual não é canônica devido às divergências registradas e à ausência de hover/pressed no contrato.
Não existe export de tela ou componente de autenticação/OTP no pacote UI, coerente com C-003/C-004 ainda não iniciadas.

# 7. Controles de governança
APPROVAL_PERFORMED = FALSE
DESIGN_SYSTEM_STATUS_CHANGED = FALSE
REPOSITORY_CHANGED = FALSE
BRANCH_CREATED = FALSE
COMMIT_CREATED = FALSE
PR_CHANGED = FALSE
CI_RUN = FALSE
C003_STARTED = FALSE
C004_STARTED = FALSE
NEW_SCREEN_CREATED = FALSE
CHECKPOINT_PREVIOUS_OVERWRITTEN = FALSE

# Conclusão
O gate produziu fatos para decisão, não aprovação. A paleta e a escala tipográfica têm divergências materiais entre o PNG específico, a prancha de referência e o código 1.2.0 CONSOLIDATION_CANDIDATE. Botões e campos possuem lacunas de especificação e implementação para autenticação por telefone/OTP. Nenhum domínio foi aprovado nesta execução.
