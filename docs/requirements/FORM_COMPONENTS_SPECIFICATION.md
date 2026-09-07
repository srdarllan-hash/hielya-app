# FORM_COMPONENTS_SPECIFICATION

Issue #48 · 2026-09-07 · **DRAFT / OWNER_DECISIONS_REQUIRED / NOT_READY_FOR_IMPLEMENTATION**.

Escopo: Input, PhoneInput e OtpInput; especificação apenas. Não autoriza C-003/C-004, telas, implementação, alteração de tokens, contratos ou sessão. Cada requisito abaixo é identificado como **fixado** (pedido explícito ou contrato existente), **derivado** (componente/token existente) ou **pendente**. Nenhuma opção pendente é default aprovado. Outro agente não deve preencher lacunas por conta própria.

## 1. Fontes e divergências verificadas

**Atualização da revisão2:** PR32 mergeado em `37dc523013ac13088fffdd70d8d8c6be7292a612`, após CI34138052743/34138052794 SUCCESS987testes. Tokens1.2.0 agora APPROVED_FROZEN na main, valores inalterados. D0 está RESOLVIDA; os parágrafos de diagnóstico original abaixo preservam o motivo da pendência anterior e não descrevem o estado atual. Decisões OTP aprovadas na seção8 prevalecem sobre opções da revisão1. Opções ainda abertas estão nas seções9–10.

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

## 8. Decisões do proprietário — revisão2 (prevalece sobre opções anteriores)

**Aprovado: seis inputs reais**, com uma string lógica agregada para o código completo. As opções de input único na revisão1 são histórico da decisão, não alternativas abertas. `inputMode=numeric`, `autoComplete=one-time-code`; manter seis nomes de posição e grupo rotulado. A justificativa mobile do proprietário é registrada como motivação, **não como prova de que seis inputs garantem autofill melhor em iOS/Android**. Distribuição real de SMS autofill deve ser validada nos navegadores-alvo; não trocar silenciosamente a arquitetura se algum navegador falhar.

**Aprovado: envio automático ao completar o sexto dígito.** O componente notifica conclusão; a camada de aplicação verifica. Na mesma ação de conclusão, bloquear novas notificações e apresentar loading; não esperar um render posterior para travar a submissão. A aplicação também deve rejeitar chamada concorrente antes do await. Nenhuma chamada de rede em render/effect de montagem; entrada manual/paste/autofill convergem para uma única notificação. Re-render, Strict Mode, Enter repetido e duplo evento não podem gerar dois submits.

**Aprovado: após erro, limpar seis campos, focar primeiro e mostrar mensagem clara.** Não anunciar nem registrar código. A permissão para nova verificação permanece subordinada ao estado recebido da aplicação: não liberar desafio expired/locked nem ignorar cooldown por limpar inputs. Essa qualificação preserva o contrato e está submetida ao proprietário como pergunta R1 abaixo; não criar um override local.

**Aprovado: não repetir submit do mesmo código.** Deduplicação efêmera, em memória, sem logs/analytics/storage e sem usar o OTP como ID público. Identidade de challenge e seu ciclo de vida pertencem à aplicação; o componente não deve receber challengeId para gerir autenticação. O mecanismo de reset visual vem do consumidor. Escopo exato da deduplicação após erro de transporte/novo desafio está pendente em R2; não fingir que “exatamente uma chamada de rede” é garantível após resposta perdida.

As dimensões, política de edição/paste/navegação e textos abaixo continuam pendentes. Nenhum valor de token foi alterado.

## 9. Opções concretas — escolher por linha, nenhuma aprovada automaticamente

Todos os tokens citados já existem em1.2.0. Opção não equivale a novo valor ou novo token. A geometria fixada48/12x16/12/1/focus2+2/texto14/20 permanece.

### I — Input: aparência, slots e contrato

Base comum: fundo `color.background.primary`#000000, texto `color.text.primary`#FFFFFF, borda `color.border.strong`#454545; invalid borda `dangerFill`#EF4444 e texto `dangerText`#F87171; focus `color.border.focus`#F6B800 com2px/offset2. Não criar fill vermelho para campo inválido.

| ID | A | B | Trade-off |
|---|---|---|---|
| I1 hover | Manter borda/fundo de repouso | Borda `color.text.muted`#9A9A9A, mesmo fundo | A reduz mudanças; B reforça affordance no desktop, requer nova evidência visual |
| I2 valid | Borda neutra; success em `successText`#4ADE80 quando fornecido | Borda `successFill`#22C55E e successText#4ADE80 | A menos ruído; B sinal mais forte, mas não pode significar telefone autenticado |
| I3 disabled | Texto `text.disabled`#737373, fundo primary, borda strong; sem opacidade global | Fundo `background.surface`#121212, texto disabled e borda subtle#2A2A2A | A preserva estrutura; B distingue melhor o bloqueio; informação essencial continua em label/helper legíveis |
| I4 readOnly | Mesmo visual normal + helper “Solo lectura.” | Fundo surface#121212, texto primary, helper “Solo lectura.” | Ambos focáveis/selecionáveis; B distingue sem aparência de disabled |
| I5 loading | Usar visual disabled e helper “Procesando…” | Preservar visual de leitura, suffix textual “Procesando…”; bloquear edição | A segue referências; B preserva contraste. Nenhum spinner/ícone inventado |
| I6 autofill | Manter aparência nativa do navegador, validar contraste | Aplicar os mesmos tokens normal/text/invalid quando suportado, sem ocultar indicadores do navegador | A menos CSS específico; B mais consistência, exige testes browser e forced-colors |
| I7 helper/success | helper text.secondary#B8B8B8 e successText; caption12/16, gap12 igual referência | Mesmas cores, bodySmall14/20, gap12 | A compacto; B leitura maior. Error continua caption12/16 derivado |
| I8 espaço de feedback | Altura natural somente quando existe mensagem | Reservar uma linha16px (`font.lineHeight.caption`), expandindo para texto longo | A compacto porém layout pode deslocar; B reduz salto com espaço vazio |
| I9 prefix/suffix | Texto/decorativo apenas; text.secondary,14/20, gap space.8; +34 fixo | Mesma base, permitir suffix botão de limpar com alvo touch.recommended48 e label “Borrar” | A menor API/foco; B ação útil, mas requer QA extra e reduz área digitável. Não aplicar limpar ao OTP por inferência |
| I10 erro acessível | Região persistente aria-live=polite, aria-atomic=true, atualizar só mensagem de erro | role=alert somente quando novo erro após submit; sem live adicional | A não interrompe fala; B anuncia imediatamente após ação. Não anunciar erro a cada tecla/render ou OTP |
| I11 alvo do focus | Outline no input nativo, adornos fora | Outline no wrapper com focus-within; remover só outline redundante do input | A foco exato; B campo composto contínuo. Ambos preservam2/offset2 e não cortam indicador |
| I12 API | onChange(string), onBlur/onFocus(eventReact), feedback string, prefix/suffix texto; ref+name encaminhados | onChange(string, eventReact), mesmos callbacks/ref/name, slots ReactNode tipados | A simples e alinhada SearchField; B permite composição avançada, maior responsabilidade a11y |
| I13 types do Input | text/tel/email/password/search; default text | Somente text/tel nesta primeira versão; demais em gate separado | A base reutilizável mais ampla; B menor matriz de QA. Nenhum mostrar senha implícito |
| I14 precedência | disabled > loading > readOnly; invalid vence valid; manter erro visível sem novo anúncio; focus sobre borda inválida | Mesma precedência, impedir combinação loading+readOnly na API | A permissiva e determinística; B menos combinações válidas. Valor preenchido não decide estado de erro |

### P — PhoneInput: edição e validação

+34 não editável, exatamente9dígitos nacionais para E.164 completo. Sem filtro6/7, pois o contrato existente não o estabelece.

| ID | A | B | Trade-off |
|---|---|---|---|
| P1 máscara | `+34 612 345 678` (3-3-3) | `+34 612 34 56 78` (3-2-2-2) | A menos separadores; B blocos finais menores. Números ilustrativos, nunca placeholder de telefone real |
| P2 paste/filtragem | Aceitar nacional/+34/0034 e separadores espaço,ponto,hífen,parênteses conforme normalizador; rejeitar operação inteira se letras, outro país ou excesso | Mesmas entradas válidas; remover letras da área nacional com aviso antes de confirmar, rejeitar país/excesso | A previsível e não “corrige” destino; B tolerante, mas pode transformar conteúdo colado no número errado. Nunca truncar para caber |
| P3 edição/caret | Inserir/substituir na seleção por índice de dígitos; caret após último inserido; Backspace pula separador e apaga dígito anterior | Campo vira9dígitos sem máscara enquanto focado; aplicar máscara no blur | A máscara contínua, maior complexidade; B cursor nativo simples, mas **altera o requisito de máscara durante digitação**, exigindo decisão explícita |
| P4 onChange parcial | `{nationalDigits: string, e164: string|null}` a cada edição; E.164 só quando completo | `onDraftChange(nationalDigits)` para parcial e `onChange(e164|null)` para valor canônico | A estado atômico e um callback; B separa draft de valor aceito, mas sincronização exige cuidado. Nenhum retorna telefone formatado como valor canônico |
| P5 validação | Blur/submit; após primeiro erro, revalidar change para removê-lo | Somente submit; change/blur não mostram erro | A feedback antecipado sem punir primeira digitação; B menor ruído mas erro aparece mais tarde |
| P5-C alternativa | Change com erro somente a partir de9dígitos ou edição rejeitada; parcial não mostra erro até blur/submit | — | Feedback imediato de formato, mais regras de touched/dirty a testar |
| P6 IME/Unicode | Aguardar compositionend; aceitar apenas0–9ASCII, rejeitar restante com feedback | Converter dígitos full-width0–9 paraASCII após compositionend; outros rejeitados | A coincide com contrato; B tolerância adicional localizada, exige casos novos. Nenhuma transliteração geral |

Paste no meio substitui a seleção segundo P3; remoção do prefixo por Backspace nunca altera+34. AutoComplete tel com+34/0034 segue a mesma entrada do paste, sem duplicar prefixo. Vazio requerido só é invalidado no evento aprovado emP5. ReadOnly preserva texto/copiar; loading não chama OTP.

### O — detalhes restantes do OTP e conflitos com o domínio

| ID | A | B | Trade-off |
|---|---|---|---|
| O1 paste completo | Exatamente6dígitos substituem o grupo inteiro, de qualquer célula | Inserir a partir da célula ativa, rejeitar se exceder6 | A melhor paraSMSautofill; B respeita posição, pode surpreender ao colar código inteiro no meio |
| O2 paste parcial | Inserir desde célula ativa substituindo posições ocupadas; preservar demais | Limpar grupo e preencher desde primeira | A permite correção localizada; B resultado simples, perde edição anterior |
| O3 caracteres | Rejeitar paste com qualquer não-dígito | Remover apenas espaços/hífens; rejeitar letras e excesso | A estrito; B tolera agrupamento. Não extrair código de SMS inteiro por padrão |
| O4 Backspace | Preenchida: apagar e permanecer; vazia: recuar e apagar anterior | Preenchida: apagar e recuar; vazia: apenas recuar | A apagar previsível por posição; B navega mais rápido, exige atenção ao apagar sequencial |
| O5 foco/teclas | Dígito aceito avança; Left/Right mudam posição; Home/End primeira/última; seis tabstops nativos | Mesmas setas, rovingtabindex: um tabstop entra na posição ativa | A navegação HTML simples; B menos Tab, mas maior complexidade de foco/a11y. Nunca capturar Tab em loop |
| O6 draft com buracos | Array local de6strings vazias/1dígito; consumidor recebe array e completeCode|null | Impedir buracos: apagar desloca dígitos seguintes à esquerda; consumidor recebe string parcial | A conserva posição; B uma string simples, deslocamento pode surpreender. String completa sempre única |
| O7 geometria | Células48×mín48, gap space.4=4: largura308px; padding horizontal por célula space.8=8 | Células44×mín48, gap space.8=8: largura304px; padding horizontal por célula space.8=8 | A alvo48 com gapmenor; B alvo mínimo44 com separação maior. Ambas pedem exceção explícita ao padding16 por célula; raio12/borda1/focus2+2/texto14/20 mantidos |
| O8 alinhamento | Dígito centrado, peso regular400 | Dígito centrado, peso medium500 | A segue bodySmall; B enfatiza. Sem nova fonte ou tamanho |
| O9 autofill | one-time-code apenas na primeira célula; handler distribui código completo | one-time-code em todas; qualquer célula recebe código completo | A único alvo semântico; B facilita foco intermediário, possível comportamento divergente. Validar ambos em iOS/Android antes de ratificar suporte |

O7 em viewport360 com margens16: espaço328; A sobra20 e B24px para folga/focus. Não é prova de suporte a containers menores/zoom. Para largura disponível menor que grupo+8px do outline, escolher: (a) permitir quebra3+3 mantendo tamanho/foco ou (b) exigir largura mínima de316(A)/312(B) e tratar composição mais estreita em revisão específica. Opção(b) não pode ser anunciada como responsividade universal; não ocultar overflow ou reduzir alvo sem aprovação.

**R1 — alcance de “nova tentativa imediata”:** confirmar (A) imediato apenas para INVALID_OTP com tentativa disponível; expired exige novo desafio e locked aguarda liberação da aplicação; ou (B) revisar requisito de domínio em gate separado. (B) não é implementável neste gate e não autoriza bypass. Limpar os campos continua a decisão visual, mas o primeiro campo pode estar bloqueado: nesse caso, confirmar foco no primeiro controle de recuperação habilitado ou no resumo de erro, sem focar artificialmente um input disabled.

**R2 — “mesmo código” e erro de rede:** (A) não reenviar a mesma combinação desafio+código durante toda a vida do desafio; após transporte incerto solicitar recuperação/novo desafio pela aplicação; ou (B) impedir duplicados automáticos/concorrentes e permitir retry explícito após falha de transporte, sob idempotência da aplicação. (A) interpretação literal mais estrita, pode bloquear usuário cujoSMS repete código; (B) recuperação melhor, mas precisa ratificação por flexibilizar “nunca”. Não fixar deduplicação global vitalícia: códigos podem coincidir em desafios independentes; confirmar esse limite. Não armazenar OTP além da necessidade efêmera da tentativa.

## 10. Microcopy — cada texto AGUARDANDO RATIFICAÇÃO

Escolher A ou B por contexto; placeholders devem seguir P1. Estes são textos candidatos, não microcopy oficial já aprovada.

| Contexto | A — aguardando ratificação | B — aguardando ratificação | Trade-off |
|---|---|---|---|
| Phone label | Número de teléfono | Tu móvil | A reflete contrato sem restringir a móveis; B coloquial mas pressupõe móvel |
| Phone placeholder | `___ ___ ___` | `___ __ __ __` | Depende deP1; não representa valor preenchido |
| Phone helper | Introduce los 9 dígitos de tu número de España. | Número de España (+34), sin el prefijo. | A explicita comprimento; B evita duplicação do prefixo |
| Phone required | Introduce tu número de teléfono. | Necesitamos tu número para enviarte el código. | A direta; B explica intenção do fluxo, não requisição do componente |
| Phone invalid | Introduce un número válido de 9 dígitos. | Revisa el número: debe tener 9 dígitos. | A instrução; B correção contextual |
| Phone país | Solo se admiten números de España (+34). | Usa un número con prefijo +34. | A explica limiteMVP; B curta |
| Edição rejeitada | No se ha pegado el contenido. Revisa el formato. | El contenido no tiene un formato válido. | A deixa claro que valor anterior foi preservado |
| ReadOnly | Solo lectura. | Este dato no se puede modificar aquí. | A curta; B contextual |
| Input loading | Procesando… | Un momento… | A específica; B menos informativa |
| OTP label | Código de verificación | Código SMS | A independente do canal; B canal explícito |
| OTP helper | Introduce los 6 dígitos. Se verificará automáticamente. | El código se comprobará al completar los 6 dígitos. | Ambas informam autoenvio |
| OTP loading | Verificando código… | Comprobando el código… | Variação editorial |
| INVALID_OTP | El código no es válido. Introduce los 6 dígitos de nuevo. | Código incorrecto. Vuelve a introducirlo. | A comprimento explícito; B curta |
| OTP_EXPIRED | El código ha caducado. Solicita uno nuevo cuando esté disponible. | Código caducado. Espera a que puedas solicitar otro. | Ambas respeitam possívelcooldown |
| OTP_LOCKED | Has alcanzado el límite de intentos. Espera para solicitar otro código. | Demasiados intentos. Podrás solicitar un nuevo código cuando termine la espera. | A mais precisa; B linguagem direta |
| Cooldown | Podrás solicitar otro código en {seconds} s. | Espera {seconds} s para solicitar otro código. | Ambas usam dado da aplicação, não duração inventada |
| OTP_UNAVAILABLE | Este código no está disponible. Solicita otro cuando puedas. | No se puede usar este código. Espera para solicitar uno nuevo. | Não classifica como erro de digitação |
| Serviço indisponível | No podemos verificar el código ahora. Inténtalo más tarde. | El servicio no está disponible temporalmente. | A orienta; B explica. A recuperação deve respeitarR2 |
| Rede/resultado incerto | No hemos podido confirmar el resultado. Comprueba tu conexión. | No se ha confirmado la verificación. Sigue las indicaciones para continuar. | Não afirmar que o servidor rejeitou oOTP |
| Mesmo código já enviado | Este código ya se ha enviado. Espera las indicaciones para continuar. | No volveremos a enviar el mismo código automáticamente. | A próximaação; B descreveR2-B, usar somente se aprovado |
| Nome de posição | Dígito {position} de 6 | Posición {position} del código, de 6 | Ambas nomeiam posição sem inserir OTP em anúncio dinâmico |

Textos genéricos de Input valid/helper/error são fornecidos pelo consumidor segundo contexto; não inventar “Datos correctos” como prova de identidade. Reenvio pertence à aplicação: texto “Enviar otro código” versus “Solicitar otro código” aguarda ratificação caso essa ação seja exibida na composição futura, não dentro do OtpInput por suposição.
