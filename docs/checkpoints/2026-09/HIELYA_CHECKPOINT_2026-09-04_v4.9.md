# HIELYA CHECKPOINT v4.9
## DESIGN SYSTEM — análise de direção canônica
Data/hora: set. 4, 2026 (timestamp UTC desta execução)
Repositório: srdarllan-hash/hielya-app
Main validada: df912c101b3db5c910a8c575fb2e2e687a54f4f5
Árvore validada: 774f3153add86419f4aa622267e51c7a6f786f3c
Checkpoint anterior: HIELYA_CHECKPOINT_2026-09-04_v4.8
Status: ANALYSIS_COMPLETE / NOT_APPROVED

# 1. Resumo executivo
A direção code-first é compatível com a decisão aprovada HLY-UI-004, que estabelece Design Tokens → componentes React → implementação → renderização real → testes/QA → APPROVED_FROZEN e declara que mockups/PNGs não são fontes editáveis nem critérios de aceite.
Não foi encontrado fundamento técnico ou contratual para tornar os PNGs autoridade superior ao código. Há uma ressalva de governança: Design Tokens 1.2.0 ainda se declara CONSOLIDATION_CANDIDATE; a autoridade formal vigente continua sendo Design Tokens 1.1.0 FROZEN e Component Library 1.1.1. Portanto, a direção proposta pode ser formalizada somente distinguindo código atual de versão formalmente promovida.
A comparação entre tokens 1.1.0 nos SHAs certificados de C-005/C-001 e tokens 1.2.0 na main confirmou que paleta, tipografia, espaçamento, raios e tokens fundamentais foram preservados. Os PNGs divergentes não superam essa evidência.

# 2. Onde PNG e código estão corretos ou incorretos
PNG correto e alinhado ao código:
Poppins como família; pesos 400/500/600/700 em linhas gerais; texto preto sobre dourado; existência conceitual de primary, secondary, destructive, disabled e loading; telefone com +34/9 dígitos e OTP de seis posições como ilustração funcional.
PNG sem autoridade suficiente para corrigir o código:
As cores #050505, #101010, #E7A91A, #F5C348, #A9A9A9, #2CC56E e #F04444 não correspondem à baseline 1.1.0 congelada nem à 1.2.0 atual. A escala tipográfica 48/56, 32/40, 22/28 etc. também diverge da baseline congelada. Não foi localizada decisão formal que promova esses valores dos PNGs.
Código com problema técnico independente dos PNGs:
Button danger usa fundo #EF4444 e texto #FFFFFF, razão 3.76:1. Isso falha WCAG AA para texto normal. O PNG também apresenta branco sobre vermelho #F04444, razão 3.74:1, portanto não corrige o problema.
Lacunas, não erros resolvidos pelo PNG:
O PNG de campos ilustra PhoneInput e OTP, mas não define comportamento, acessibilidade, dimensões ou estados completos; o código ainda não possui esses componentes.
Ressalva contratual:
tokens.json 1.2.0 = CONSOLIDATION_CANDIDATE; manifests/versions.json preserva frozenSource 1.1.0; manifests/certifications.json ainda registra REQUIRES_EXACT_SHA_GATE. Merge em main não equivale a promoção APPROVED_FROZEN.

# 3. Custo de regeneração dos seis PNGs
Escopo HLY_DS_01 a HLY_DS_06:
HLY_DS_01_LOGO_COMPACT: BrandLockup existe em React e pode ser renderizado, mas o resultado deve refletir exatamente a implementação textual/ícone atual.
HLY_DS_02_APP_ICON: não foi localizada fonte canônica equivalente no código inspecionado; regeneração fica dependente de definir ou localizar essa fonte.
HLY_DS_03_COLOR_PALETTE: diretamente gerável de tokens.json/tokens.css.
HLY_DS_04_TYPOGRAPHY: diretamente gerável dos typeStyles e tokens de fonte.
HLY_DS_05_BUTTONS: gerável do Button e Storybook para estados implementados; hover/pressed continuam ausentes porque não existem no contrato atual.
HLY_DS_06_FORM_FIELDS: não é fielmente gerável para telefone/OTP antes de existirem Input/PhoneInput/OtpInput; somente SearchField e ManualAddressForm podem ser documentados hoje.
Estimativa de esforço:
Artefatos já representáveis, em processo manual controlado: 4–8 horas.
Pipeline reproduzível que lê tokens, renderiza componentes reais, captura PNGs, registra versão/SHA e executa QA: 8–16 horas.
Conjunto completo dos seis: 1–2 dias de trabalho após resolver app icon e componentes de campos. A criação dos componentes não está incluída nessa estimativa documental.
Custo monetário de licença/ferramenta: nenhum identificado; custo principal é engenharia/design e QA.

# 4. Alternativas de contraste para danger
Estado atual: #FFFFFF sobre #EF4444 = 3.76:1, FAIL normal e PASS grande.
Alternativa A — manter o fundo #EF4444 e usar texto #000000: 5.58:1, PASS normal e grande. No vermelho do PNG #F04444, preto resulta 5.62:1.
Alternativa B — manter texto branco e escurecer o vermelho para #D83A3A: 4.58:1, PASS normal e grande.
Alternativa C — usar variante contornada/ghost, com texto e borda #EF4444 sobre surface #121212: 4.98:1, PASS normal e grande; sobre background #000000: 5.58:1.
Nenhuma alternativa foi selecionada ou implementada.

# 5. Especificações necessárias para Input
Base existente a confirmar ou alterar explicitamente:
altura mínima 48px; padding 12px 16px; borda 1px; raio 12px; fonte 14/20; label 14/20 medium; helper/error 12/16; gap vertical 12px; focus outline 2px com offset 2px.
Tokens por estado:
background, texto, placeholder, borda default, hover, focus, valid, invalid, disabled, read-only e loading.
API do componente:
controlled/uncontrolled; value/defaultValue; onChange/onBlur/onFocus; type/inputMode/autoComplete; name; required; disabled; readOnly; loading; prefix/suffix; fullWidth.
Conteúdo:
label obrigatório ou aria-label; placeholder; helper; error; success; contador/limite quando aplicável.
Estados:
empty, filled, hover, focus, valid, invalid, disabled, read-only, loading e autofill.
Acessibilidade:
label/id; aria-invalid; aria-describedby; associação helper/error; anúncio de erro; focus-visible; área de toque; comportamento de teclado.
Responsabilidade:
definir se máscara/validação pertence ao Input base ou aos componentes especializados; Input não deve incorporar transporte HTTP.

# 6. Especificações necessárias para PhoneInput
Modelo de valor canônico e valor exibido: E.164 versus formato visual.
País inicial e escopo de países; tratamento do prefixo +34 e possibilidade de edição.
Quantidade/formato aceito para números espanhóis e regras de normalização.
Máscara durante digitação, paste, espaços, hífens e caracteres inválidos.
Momento de validação: change, blur ou submit.
Microcopy de label, placeholder, helper e erros.
Estados empty, typing, valid, invalid, disabled, read-only e loading.
Atributos móveis: type=tel, inputMode=tel e autoComplete=tel.
API: value/onChange com valor normalizado; country; error; helper; onValidityChange, se necessário.
Limite de responsabilidade: o componente fornece o telefone normalizado; solicitação OTP e challengeId pertencem ao caso de uso/transporte.

# 7. Especificações necessárias para OtpInput
Quantidade de dígitos: seis conforme contrato visual atual.
Modelo de valor: string única versus células expostas apenas visualmente.
Caracteres aceitos: somente dígitos; regras para paste de código completo/parcial.
Foco: avanço automático, Backspace, setas, seleção e retorno à célula anterior.
Conclusão: comportamento ao preencher o sexto dígito e decisão sobre submit automático.
Estados: empty, partial, complete, invalid, expired, locked, disabled e loading.
Erros e microcopy; persistência ou limpeza do valor após falha.
Atributos móveis: inputMode=numeric, pattern e autoComplete=one-time-code.
Acessibilidade: group/fieldset, nome acessível, posição de cada dígito, anúncio de erro, leitura sem repetir seis labels desnecessariamente.
Integração: challengeId, cooldown, tentativas restantes, expiração e resend são estados recebidos da camada de aplicação; o componente não deve criar sessão nem controlar transporte.
Segurança: não registrar OTP em logs/analytics e definir comportamento de copy/paste/autofill.
Geometria: dimensão das células, gap, raio, borda, tipografia e comportamento em telas estreitas ainda precisam de valor formal.

# 8. Estado e pendências
DIRECTION_FORMALIZED = FALSE
DESIGN_SYSTEM_APPROVED = FALSE
TOKENS_1_2_0_PROMOTED = FALSE
PNG_STATUS_CHANGED = FALSE
CONTRAST_OPTION_SELECTED = FALSE
INPUT_SPEC_APPROVED = FALSE
PHONE_INPUT_SPEC_APPROVED = FALSE
OTP_INPUT_SPEC_APPROVED = FALSE
REPOSITORY_CHANGED = FALSE
MAIN_CHANGED = FALSE
PR_CHANGED = FALSE
CI_RUN = FALSE
C003_STARTED = FALSE
C004_STARTED = FALSE
NEW_SCREEN_CREATED = FALSE
PRODUCTION_CHANGED = FALSE

# 9. Próximos passos dependentes de decisão
Formalizar ou rejeitar a direção code-first.
Se formalizada, decidir a promoção exata de 1.2.0 e Component Library correspondente, com SHA e evidências.
Escolher uma alternativa de contraste para danger.
Aprovar os contratos de Input, PhoneInput e OtpInput antes da implementação.
Definir/localizar a fonte canônica do app icon antes de regenerar os seis PNGs.
Nenhuma dessas decisões foi tomada neste gate.

# 10. Fontes
HIELYA_CHECKPOINT_POLICY.md.
HIELYA_CHECKPOINT_2026-09-04_v4.8.
HLY-DS-001 / docs/HIELYA_DS_FREEZE_DECISION_V1_0.md.
HLY-UI-004 / docs/decisions/HLY-UI-004-CANONICAL-PRODUCTION-SEQUENCE.md.
packages/design-tokens/src/tokens.json nos SHAs congelados e na main.
manifests/versions.json e manifests/certifications.json.
Button.tsx, SearchField.tsx, ManualAddressForm.tsx e CSS associados.
Seis PNGs HLY_DS_01 a HLY_DS_06 no Google Drive.
