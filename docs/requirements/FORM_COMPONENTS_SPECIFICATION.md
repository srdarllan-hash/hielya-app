# FORM_COMPONENTS_SPECIFICATION

Issue #48 · 2026-09-07 · **DRAFT / OWNER_DECISIONS_REQUIRED / NOT_READY_FOR_IMPLEMENTATION**.

Escopo: Input, PhoneInput e OtpInput; especificação apenas. Não autoriza C-003/C-004, telas, implementação, alteração de tokens, contratos ou sessão. Cada requisito abaixo é identificado como **fixado** (pedido explícito ou contrato existente), **derivado** (componente/token existente) ou **pendente**. Nenhuma opção pendente é default aprovado. Outro agente não deve preencher lacunas por conta própria.

## 1. Fontes e divergências verificadas

Base inspecionada: main `5aca80958afcafd75e91665c4556593e8bdcefaf`.

- [Tokens JSON](../../packages/design-tokens/src/tokens.json), [CSS](../../packages/design-tokens/src/tokens.css).
- [ManualAddressForm](../../packages/ui/src/screens/location/ManualAddressForm.tsx), [actions.css](../../packages/ui/src/styles/actions.css).
- [SearchField](../../packages/ui/src/components/SearchField.tsx), [discovery.css](../../packages/ui/src/styles/discovery.css), [foundations.css](../../packages/ui/src/styles/foundations.css).
- [Domínio de autenticação](../../packages/application/src/auth/index.ts) e [OpenAPI V1.2](../../contracts/openapi/HIELYA_OPENAPI_MVP_LOCAL_36_V1_2.yaml).
- [Restrições](../CONSTRAINTS.md), [pendências](../KNOWN_DEBT.md), [política](../checkpoints/HIELYA_CHECKPOINT_POLICY.md).

**D0 — status de freeze:** o pedido define tokens1.2.0 APPROVED_FROZEN como autoridade. A main contém versão1.2.0 com `meta.status=CONSOLIDATION_CANDIDATE` (também em tokens.ts). O [PR32](https://github.com/srdarllan-hash/hielya-app/pull/32), HEAD27bb14c47e3513143c1b103655334da1bedab119, permanece aberto/não mergeado. Não concluir que a promoção chegou à main. Este documento referencia os valores existentes, mas não promove status nem incorpora PR32. Resolver esta divergência antes de declarar o gate pronto para implementação.

**D1 — medidas das referências não são idênticas:** ManualAddressForm usa min-height48, padding12/16, radius12, background primary. SearchField usa wrapper height48, radius16 (`radius.large`), background elevated, padding-left12 e slots24/44 com gap8; o input interno não tem borda. Não afirmar que ambos já usam radius12/padding12x16. Para o novo Input, a instrução explícita deste gate fixa a geometria do ManualAddressForm; não modificar SearchField.

PNGs: REFERENCE_ONLY / VISUAL_INTENT; nenhum valor foi extraído de PNG. Não foi necessária reinspeção dos96assets. Último checkpoint na main:v7.2; v7.3 existe em PR47 separado e foi consultado como candidato com estado validado. Este gate parte da main, sem empilhar PR47; próximo checkpoint reservado:v7.4.

## 2. Geometria e valores visuais

| Propriedade | Token / valor | Aplicação e autoridade |
|---|---|---|
| Altura mínima | `touch.recommended` 48px | Input/PhoneInput, fixado; altura mínima, não teto para zoom |
| Padding vertical/horizontal | `space.12` / `space.16` | 12px/16px; fixado |
| Raio | `radius.medium` 12px | fixado |
| Borda | `borderWidth.hairline` 1px solid | fixado |
| Focus | `dimension.2` 2px; offset `dimension.2` 2px; `color.border.focus` #F6B800 | derivado de foundations; não suprimir indicador |
| Texto do campo | `font.size.bodySmall`14 / `font.lineHeight.bodySmall`20 | fixado |
| Família/peso do texto | `font.family.ui` Poppins; `typeStyle.bodySmall`400 | derivado; fallback atual Arial,sans-serif |
| Label | bodySmall14/20; `font.weight.medium`500; `color.text.primary` #FFFFFF | ManualAddressForm |
| Fundo/texto normal | `color.background.primary` #000000 / `color.text.primary` #FFFFFF | ManualAddressForm |
| Borda normal | `color.border.strong` #454545 | ambas referências |
| Placeholder | `color.text.muted` #9A9A9A | SearchField; aplicação ao novo Input necessita aceite D2 |
| Erro: borda/texto | `color.semantic.dangerFill` #EF4444 / `dangerText` #F87171 | ManualAddressForm; nunca usar dangerBackground como texto |
| Mensagem de erro | caption12 / lineHeight.caption16; margin space.0 | ManualAddressForm |
| Espaço label/campo/feedback | `space.12`12px | grid atual ManualAddressForm; extensão a helper/success pendente D2 |
| Box sizing | border-box; largura100% | existente; padding/borda incluídos |

`dangerBackground` #D83A3A é fundo de ação danger; não substituir automaticamente borda/erro do campo. Tokens `successText` #4ADE80 e `successFill` #22C55E existem, mas **não há regra de Input valid certificada**. Ter um token não autoriza escolher sua aplicação.

Pendente D2: estados hover, valid, read-only, disabled e autofill; helper/success; cor/medidas de prefix/suffix; reserva de altura do feedback; indicador loading e seu slot. Não inventar opacity, ícone, sombra, transição ou cor. As referências bloqueiam edição durante loading, mas não definem um Input loading universal. Focus deve permanecer identificável junto de invalid; decidir um único alvo de outline para wrapper versus input, evitando dois anéis como consequência acidental da cascata.

## 3. Input — contrato base

### Responsabilidade e API

Derivado: componente apresentacional, sem regra de telefone/OTP, request, timer, sessão ou validação assíncrona. Normalização e validade de formato pertencem ao especializado; validade de negócio e resposta de servidor pertencem à aplicação. `valid` não significa telefone verificado; OTP com seis dígitos não significa autenticado.

| API requerida | Semântica |
|---|---|
| value / defaultValue | String controlada / inicial não controlada. Modelo SearchField: value definido é autoridade; defaultValue só inicializa. Não alternar modos no ciclo de vida |
| onChange | Paridade com SearchField: entrega string do campo, não evento como valor principal; nunca normaliza silenciosamente no Input base |
| onBlur / onFocus | Necessários; assinatura exata evento React versus callback sem argumento deve ser aprovada em D2 |
| type / inputMode / autoComplete | Encaminhar sem reinterpretar; defaults e lista de types suportados pendentes D2. Especializados fixam os seus abaixo |
| required / disabled / readOnly | Semântica nativa; required não inventa mensagem ou fluxo de validação |
| id / label | id estável fornecido ou gerado, label associado; id duplicado é erro de integração |
| placeholder / helper / error / success / prefix / suffix | Elementos solicitados; shape/string/ReactNode e possibilidade de ação em adornos pendentes D2 |
| loading / estado de validação | Estado recebido do consumidor, não inferido por requisição interna; nomes públicos/prevalência pendentes D2 |
| name / ref / aria-describedby adicional | Necessidade de submissão/foco e composição acessível a decidir em D2; não presumir API escondida |

### Matriz de estados

| Estado | Comportamento fixado ou limite | Decisão restante |
|---|---|---|
| empty | valor vazio; label continua presente, placeholder não substitui label | required: momento do erro em D3 |
| filled | valor não vazio; não implica válido | nenhum texto de sucesso automático |
| hover | não muda valor nem dispara validação de negócio | aparência D2 |
| focus | indicador2/offset2; eventos normais | alvo único do outline D2 |
| valid | validade recebida; não autentica | mensagem/borda/ícone D2 |
| invalid | aria-invalid, mensagem associada; não apenas cor | precedência/error timing D2/D3 |
| disabled | não editável nem focável pelo tab, sem callbacks de edição | aparência D2 |
| read-only | não editável; preservar leitura, seleção/cópia e foco nativos | aparência D2; não tratar como disabled |
| loading | referências existentes desabilitam durante loading | confirmar extensão ao Input e indicador D2 |
| autofill | processar valor real como entrada; sem request/submit por si só | estilo e reconciliação controlled/mascarado D2/D3 |

Estados são dimensões, não enum mutuamente exclusivo: filled+focus+invalid é possível. Não esconder erro por hover. Decidir em D2 precedência visual de disabled/loading/readOnly e exclusão error/success. Não iniciar timers ou validação de domínio para arbitrar estados.

### Acessibilidade requerida

Label visível associado com htmlFor/id; placeholder não é nome. Error/helper/success possuem IDs únicos e estáveis; aria-describedby referencia apenas elementos existentes, preservando IDs adicionais do consumidor sem duplicar. aria-invalid=true somente para erro apresentado; mensagem textual explica correção. Não reutilizar role=combobox de ManualAddressForm: esse role depende de sugestões, ausentes no Input.

Erro dinâmico deve ser anunciado uma vez sem ler valor/OTP. Pendente D2: região persistente `aria-live=polite` com mensagem atualizada, ou `role=alert` para erro após submit; não usar ambos nem anunciar a cada render. Focus do formulário após submit pertence ao consumidor. Prefix decorativo é oculto da árvore; prefix semântico (+34) integra a descrição. Suffix acionável, se aprovado, necessita botão/nome/foco próprios; não adotar automaticamente botão limpar/revelar.

## 4. PhoneInput

### Requisitos fixados e compatibilidade

- Espanha apenas: prefixo+34 fixo, sem seletor de país; nacional com9dígitos. type=tel, inputMode=tel, autoComplete=tel.
- E.164 completo é `+34` seguido dos9dígitos ASCII. Manter como string, preservando zeros; não converter para número.
- O normalizador existente aceita nacional, +34 e0034; remove espaços, pontos, parênteses e hífens; rejeita outros caracteres, múltiplos sinais+ e comprimento diferente de9.
- O contrato **não restringe primeiro dígito a6/7**, nem comprova alocação real ou recepção de SMS. Não acrescentar filtro de operadora/móvel sem novo requisito.
- Valor exibido mascarado é distinto do normalizado. O componente entrega telefone normalizado; NÃO solicita OTP, não conhece challengeId, não chama SDK/API nem cria sessão.

### Pendências de edição D3 (bloqueantes)

| Tema | O que precisa ser decidido |
|---|---|
| Máscara | Agrupamento exato (ex.:3-3-3 ou3-2-2-2); espaços são apresentação, não payload |
| Digitação/paste | Aceitar conjunto do normalizador existente ou subconjunto explícito; descartar caracteres proibidos ou rejeitar a edição inteira com feedback; não transformar texto arbitrário em número válido sem decisão |
| Prefixo colado | Tratar nacional/+34/0034 como o mesmo telefone, sem duplicar+34; prefixo estrangeiro deve falhar, nunca ser trocado por+34 silenciosamente |
| Excesso | Rejeitar paste/edição >9 nacional ou truncar com feedback? Não truncar sem aprovação |
| Cursor/seleção | Regra exata de inserção, remoção de separador, seleção parcial, Home/End e preservação de caret após máscara |
| Entrada parcial | E.164 não existe antes dos9dígitos. Decidir onChange: string nacional parcial normalizada + nullable e164 em payload, ou callback separado de draft e onChange apenas para E.164 completo/null. Nunca emitir `+34` incompleto como E.164 válido |
| Momento de validar | change, blur ou submit; comportamento depois do primeiro erro; vazio opcional versus required |
| IME/autofill | Adiar filtragem durante composição; como tratar autofill internacional e numeração não ASCII deve ser aprovado |

Estados: empty=vazio; typing=parcial; valid=9dígitos normalizáveis (não verificado); invalid=formato/erro recebido; disabled/read-only/loading seguem decisão Input. Blur não solicita OTP; submit pertence à futura composição.

### Microcopy espanhola — proposta para aprovação D4, NÃO oficial ainda

| Chave | Texto candidato |
|---|---|
| label | Número de teléfono |
| placeholder | Pendente: depende da máscara; não usar telefone real como exemplo |
| helper | Introduce los 9 dígitos de tu número de teléfono de España. |
| required | Introduce tu número de teléfono. |
| invalid | Introduce un número de teléfono válido de 9 dígitos. |
| country | Solo se admiten números de teléfono de España (+34). |

Essas frases são propostas editoriais, não evidências de microcopy já aprovada. Erro de configuração/SMS não deve ser apresentado como telefone inválido; consumidor recebe código da aplicação e precisa de mensagem própria aprovada.

## 5. OtpInput

### Requisitos fixados

Seis dígitos ASCII, string preservando zeros; não type=number. inputMode=numeric, autoComplete=one-time-code. Atributos de teclado/autofill não substituem validação. `complete` significa somente seis dígitos, nunca código aceito. Proibido registrar OTP em logs, analytics, URLs, erros, captura de sessão/replay ou telemetria; testes não devem imprimir códigos capturados. Não persistir como credencial/sessão.

ChallengeId, expiração, tentativas, cooldown e resend pertencem à aplicação. O componente recebe estados e informações de apresentação; não cria challenge, não decremente tentativas localmente, não inventa duração, não agenda resend ou solicita verificação. A aplicação é autoridade sobre OTP_EXPIRED, OTP_LOCKED, INVALID_OTP, OTP_RESEND_COOLDOWN e OTP_UNAVAILABLE. O cooldown de lock já pertence ao domínio, não a um relógio de montagem do componente.

### D5 — representação, foco e envio: decisão necessária

| Escolha | Consequências a aprovar |
|---|---|
| Um input real com seis células visuais | Uma string e um alvo de autofill/tab; células não viram seis inputs acessíveis. Cursor/seleção nativos controlam a posição visual; não existe transferência de foco entre seis elementos |
| Seis inputs reais, string agregada | Definir distribuição do autofill/paste, foco seguinte, tab stops e tratamento de lacunas. Nome de grupo e nomes “Dígito 1 de 6”…“Dígito 6 de 6”; não anunciar conteúdo no live region |

O pedido menciona avanço automático e posições individuais, mas oferece explicitamente a escolha de estrutura. Não decidir silenciosamente por seis inputs. Em ambos, valor de domínio continua string única; se seis controles permitirem buraco intermediário, decidir como representá-lo no draft sem deslocar dígitos inadvertidamente.

Pendências detalhadas D5:

- Paste completo: substituir todo código ou inserir na seleção? Paste parcial: inserir desde posição ativa ou substituir conjunto? Excesso: rejeitar ou truncar? Espaços/hífens: ignorar ou rejeitar? Letras/mensagemSMS inteira: não extrair seis números automaticamente sem decisão. Confirmar apenas ASCII versus normalização Unicode.
- Se seis inputs: avanço após dígito aceito, último permanece? Backspace em célula preenchida apaga sem recuar, ou recua também? Em vazia, recua apenas ou apaga anterior? Delete, Left/Right, Home/End, seleção e Tab precisam de tabela aprovada. Não capturar atalhos de copiar/colar/selecionar de forma incompatível.
- Sexto dígito: submit explícito ou evento onComplete? Se automático, consumidor executa request e impede duplicidade/replay de render/paste/autofill; componente não faz rede. Não adicionar auto-submit como otimização implícita.
- Após INVALID_OTP: preservar ou limpar? Após expired/locked, novo challenge e resend: quem solicita reset e onde fica foco? Rede/configuração indisponível não deve consumir tentativa local ou limpar por suposição.

### Matriz de estados e API mínima de fronteira

| Estado | Significado | Comportamento ainda a aprovar |
|---|---|---|
| empty | string vazia | foco inicial/autofocus D5 |
| partial |1–5dígitos | acesso por posições/paste D5 |
| complete |6dígitos; ainda não verificado | submit D5 |
| invalid | erro recebido/validação de formato | limpar/preservar e foco D5 |
| expired | aplicação informa expiração | edição habilitada ou bloqueada; reset D5 |
| locked | aplicação informa bloqueio | reset e foco; nenhuma verificação/reenvio autônomo |
| disabled | não interativo | aparência D2/D6 |
| loading | verificação controlada pelo consumidor | manter código e bloquear edição? confirmar D5 |

API a fechar em D5: value/defaultValue string, onChange(string), callbacks focus/blur, estado recebido, mensagens e disabled/loading; `onComplete` apenas se aprovado. Se timestamp/countdown for renderizado, receber apresentação derivada da aplicação (sem temporizador de domínio dentro do componente). ChallengeId/token não fazem parte da API apresentacional. Validar compatibilidade de `readOnly` herdado caso Input seja usado internamente.

### D6 — células e mobile360

Altura mínima48, raio12, borda1, focus2/offset2 e texto14/20 são a base solicitada; largura, gap, alinhamento e aplicação de padding12x16 **por célula ou pelo grupo** não estão definidos nos componentes existentes.

Verificação geométrica, não aprovação:6×48 +5×8=328px; em viewport360 com margens16 cada lado restam328px. Não sobra espaço lateral para outline externo2+offset2; container não pode recortá-lo. Aplicar padding16 ao grupo deixa296px e essa configuração não cabe. Logo não basta listar tokens48/8: aprovar largura, margens, alvo do foco e regra em containers menores/zoom antes de fixar layout.

Opções precisam ser aprovadas: largura fixa por célula versus colunas flexíveis; gap existente(space4/8), margem herdada da futura tela, altura/padding e fallback estreito. Não inventar novo breakpoint nem reduzir abaixo da geometria acordada para caber. Não criar tela para resolver essa decisão. Tipografia14/20 permanece a solicitada; peso/alinhamento/letra por célula pendentes. Autofill deve preencher o valor lógico; testar navegador móvel, leitor de tela e zoom, sem depender de inspeção de PNG.

Grupo acessível: label comum “Código de verificación” (texto pendente D4). Se um input, um nome, descrição com seis dígitos e erro associado; células decorativas ocultas da acessibilidade. Se seis, group/fieldset rotulado, posições individuais e descrição comum sem seis anúncios duplicados. `aria-invalid` reflete erro apresentado nos controles pertinentes. Countdown não anuncia cada segundo; anúncio de mudança de estado/mensagem pendente D2/D4. Não mover foco por render, polling ou alteração de cooldown.

### Microcopy espanhola — proposta D4, NÃO oficial ainda

| Código/elemento | Texto candidato |
|---|---|
| label/helper | Código de verificación / Introduce el código de 6 dígitos. |
| INVALID_OTP | El código no es válido. Compruébalo e inténtalo de nuevo. |
| OTP_EXPIRED | El código ha caducado. Solicita uno nuevo. |
| OTP_LOCKED | Has alcanzado el límite de intentos. Espera para solicitar un nuevo código. |
| OTP_RESEND_COOLDOWN | Podrás solicitar un nuevo código en {remainingSeconds} s. |
| OTP_UNAVAILABLE | No se puede verificar este código. Solicita uno nuevo cuando esté disponible. |
| AUTH_CONFIGURATION_UNAVAILABLE/rede | Serviço indisponível não é código inválido; texto final pendente |

Nenhum placeholder deve exibir código real. Texto de lock/cooldown usa disponibilidade informada pela aplicação; não promete reenvio automático, duração fixa ou crédito de tentativas. Sucesso/autenticação e navegação são responsabilidade da composição, não do OtpInput.

## 6. Decisões exigidas antes da implementação

| ID | Pergunta ao proprietário | Bloqueia |
|---|---|---|
| D0 | Como reconciliar o PR32 não mergeado e o status candidate da main com a autoridade APPROVED_FROZEN solicitada? | Certificação da fonte visual; não promover neste gate |
| D2 | Aprovar aparência dos estados/slots e API adicional; mecanismo de anúncio de erro (polite/alert), loading, helper/success e precedência | Input e especializados |
| D3 | Qual máscara, política de paste/caret/excesso, momento de validação e payload para telefone parcial? | PhoneInput |
| D4 | Aprovar ou corrigir cada texto candidato em espanhol, incluindo placeholders/serviço indisponível | Microcopy oficial |
| D5 | Um input ou seis; regras de edição/foco/paste; submit explícito/automático; limpar/preservar e reset? | OtpInput |
| D6 | Quais largura/gap/padding/foco e comportamento estreito para células? | Layout OTP sem invenção |

D1 está resolvida pela instrução explícita do usuário em favor das medidas do ManualAddressForm para o novo campo; divergência factual registrada, nenhum componente existente alterado.

## 7. Critério de aceite e roteiro de verificação futura

Antes de marcar READY_FOR_IMPLEMENTATION: cada D0/D2–D6 deve ter decisão explícita registrada, sem opções ambíguas; revisar todos os nomes/tokens contra a fonte congelada; publicar revisão e obter aprovação individual. Até lá este documento oferece cobertura integral dos tópicos, mas **não satisfaz o objetivo de implementação sem decisões**.

Na implementação futura, após autorização própria: testes controlled/uncontrolled e callbacks; estados combinados; label/IDs únicos/error announcement; disabled/readOnly/loading; máscara/paste/caret/autofill/composição; limites8/9/10dígitos e prefixos; OTP0–6, zeros iniciais, paste/Backspace/setas/Tab; sexto dígito sem requests duplicados; erro/expired/locked/resend controlados pelo consumidor; nenhum OTP em logs/analytics; mobile360, zoom e anéis sem clipping; regressões existentes C001/C002/C005/Button sem autorar baseline automaticamente. Teste de arquitetura: componentes não importam implementação auth Node/crypto/SQLite nem criam Opaque Session. Fonte do normalizador é referência de contrato, não autorização de importar módulo servidor no bundle cliente.

Validação desta rodada: leitura dirigida e consistência documental/tokens/links; nenhum componente/teste/baseline foi criado ou executado para alegar implementação. CI eventual do PR valida o repositório, não aprovação visual nem fechamento das decisões acima.
