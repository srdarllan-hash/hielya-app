# FORM_COMPONENTS_SPECIFICATION — revisão 5 consolidada

Issue48 / PR49 · 2026-09-07 · **SPECIFICATION_CLOSED / READY_FOR_IMPLEMENTATION**.
Esta revisão substitui as alternativas anteriores no documento corrente. Revisões anteriores permanecem na história Git; checkpoints não são alterados. As especificações dos três componentes estão fechadas e prontas para implementação. Merge documental expressamente autorizado; nenhuma implementação integra este PR. A [Issue50](https://github.com/srdarllan-hash/hielya-app/issues/50) é dívida média, não bloqueia MVP nem OtpInput/C-004.

## 1. Autoridade e fontes

Main verificada:37dc523013ac13088fffdd70d8d8c6be7292a612. [Tokens1.2.0](../../packages/design-tokens/src/tokens.json) APPROVED_FROZEN apósPR32; não alterar valores. [CSSgerado](../../packages/design-tokens/src/tokens.css). PNGs REFERENCE_ONLY/VISUAL_INTENT, nunca medida.

Referências: [ManualAddressForm](../../packages/ui/src/screens/location/ManualAddressForm.tsx), [SearchField](../../packages/ui/src/components/SearchField.tsx), [actions.css](../../packages/ui/src/styles/actions.css), [discovery.css](../../packages/ui/src/styles/discovery.css), [foundations.css](../../packages/ui/src/styles/foundations.css), [authapplication](../../packages/application/src/auth/index.ts), [HTTP](../../apps/ui-lab/src/server/mvp-local-36/auth-http.ts), [OpenAPIV1.2](../../contracts/openapi/HIELYA_OPENAPI_MVP_LOCAL_36_V1_2.yaml).

A geometria Input deriva de ManualAddressForm. SearchField existente usa radius16 e fundo elevated; não afirmar que tem medidas idênticas nem alterá-lo. CélulasOTP têm exceção expressamente aprovada de tamanho/padding/tipografia, abaixo. Nenhum novo token necessário.

## 2. Valores visuais normativos

| Item | Input/PhoneInput | OtpInput |
|---|---|---|
| Tamanho | width100%,min-height touch.recommended48px | seis células dimension.48 × space.56 =48×56px |
| Padding | space.12 vertical / space.16 horizontal | space.0 (zero); dígito centralizado |
| Raio/borda | radius.medium12px;borderWidth.hairline1px solid | iguaisInput |
| Texto | Poppins(font.family.ui),bodySmall14/20,regular400 | Poppins,font.size.title24 / lineHeight.title32,semibold600,centralizado |
| Label | bodySmall14/20,medium500,text.primary | igualInput |
| Focus | dimension.2(2px),offsetdimension.2(2px),border.focus#F6B800 | um anel por célula ativa, mesma largura/offset |
| GapOTP | não aplicável | space.8=8px |
| Helper/success | caption12/16,gapspace.12;helpertext.secondary#B8B8B8;successsemantic.successText#4ADE80 | mesmos tokens de feedback |
| Erro | caption12/16,semantic.dangerText#F87171 | igualInput |
| Reserva feedback | uma linha16px, expandindo para texto longo | igualInput |
| Prefix/suffix | text.secondary#B8B8B8,14/20,gapspace.8;texto/decorativo | sem adorno embutido |

Box-sizing:border-box. Input/PhoneInput: outline no wrapper focus-within, removendo apenas o outline redundante do input; nunca remover a indicação de foco globalmente. OTP: outline da célula real, não dois anéis simultâneos.

ResponsividadeOTP: seis células48 com cinco gaps8=328px. Viewport360 com margens16 fornece328px; outline pode ocupar parte da margem e não deve ser recortado por overflow. Para container com largura inferior a328px, duas linhas de três, ordem DOM1–6 preservada, mesmos tamanhos/gap8 em ambos os eixos. Não reduzir células nem introduzir scrollhorizontal. Testar foco/zoom/contêiner sem clipping. Não confundir essa conta com certificação visual já executada.

## 3. Input — estados, elementos e API

| Estado/dimensão | Regra |
|---|---|
| empty | string vazia;placeholder aparece;label permanece |
| filled | string não vazia;não implica validade |
| normal/hover | background.primary#000000,text.primary#FFFFFF,border.strong#454545;hoversem mudança |
| focus | anel2px/offset2px;preservar borda de invalid |
| valid | borda neutra;successText#4ADE80 em mensagem fornecida;sem ícone automático |
| invalid | dangerFill#EF4444 na borda,dangerText#F87171 no texto;aria-invalid=true |
| disabled | background.surface#121212,text.disabled#737373,border.subtle#2A2A2A;sem edição/tab;informação essencial legível fora do texto disabled |
| read-only | aparência normal,helper “Solo lectura.”;foco/seleção/cópia nativos,sem edição |
| loading | aparência de leitura,suffix “Procesando…”;preserva valor,bloqueia edição e submissão concorrente;sem spinner |
| autofill | aplicar tokens normais quando suportado,preservar indicadores do navegador,forced-colors e contraste;processar valor como entrada |

Precedência:disabled > loading > readOnly;invalid vence valid. Erro existente permanece visível sem reanúncio;focus continua perceptível. empty/filled e focus são dimensões combináveis, não enum exclusivo. Validação semântica não é inferida de comprimento no Inputbase.

API ratificada: value?:string,defaultValue?:string,onChange(string),onBlur/onFocus(eventReact),type=text|tel|email|password|search(defaulttext),inputMode,autoComplete,required,disabled,readOnly,loading,id,name,ref. Feedback e adornos textuais; sem ReactNode arbitrário/ação embutida. value definido é autoridade;defaultValue inicializa apenas o modo não controlado;não trocar modos. Ref aponta ao input para foco pelo consumidor. Label,placeholder,helper,error,success,prefix,suffix são dados de apresentação;sem mensagem genérica de sucesso inventada. No estado loading o suffix comunica “Procesando…” como aprovado.

Validação:base apenas apresenta estado e semânticaHTML;especializados normalizam/verificam formato;aplicação valida negócio e servidor revalida. Sem OTPrequests,challenge,session,SQLite ou móduloNode/crypto no componente.

## 4. Acessibilidade e mensagens

Labelvisível com htmlFor/id estável (fornecido ou gerado);placeholder nunca substitui label. IDs exclusivos para helper/error/success;aria-describedby somente elementos presentes, preservando descrições adicionais do consumidor. aria-invalid para erro apresentado, não para simples digitação incompleta. Prefixo+34 integra descrição semântica;decoração não é anunciada. Não copiar rolecombobox de ManualAddressForm, pois não há lista de sugestões.

Erro novo após submit usa role=alert, sem aria-live adicional e sem remontar/reanunciar mensagem a cada render. Erro no blur é visível/associado por descrição, sem anúncio dinâmico adicional. Revalidar após erro corrige texto sem anúncios por tecla. Não incluir OTP em anúncio. Countdown não anuncia cada segundo.

OTP:grupo rotulado “Código de verificación”, seis inputs reais com nomes “Dígito {position} de 6”, erro comum sem seis anúncios duplicados. Rovingtabindex:apenas posiçãoativa tabindex0,outras-1;Tab/ShiftTab entram/saem do conjunto,sem armadilha;setas movem posiçãoativa. Usar semântica de grupo/inputs, não inventar role inadequado de menu/listbox. A motivação do proprietário por navegação composta não dispensa teste real com leitores de tela.

## 5. PhoneInput

type=tel,inputMode=tel,autoComplete=tel. +34fixo,sem seletor;nacional9dígitosASCII. Sem filtro6/7 de primeiro dígito,ausente no contrato. Máscara durante digitação3-3-3: +34 612 345 678,exemplo apenas,não valor inicial. Placeholder “___ ___ ___” separado do prefixo.

value/defaultValue são strings de dígitos nacionais;onChange único entrega {nationalDigits:string,e164:string|null}. Vazio e parcial1–8=>e164null;9=>“+34”+nationalDigits. Não emitir string formatada como canônica. Estadosempty/typing/valid/invalid/disabled/readOnly/loading;valid é formato,não autenticação.

Edição mantém máscara;cursor acompanha posição dos dígitos;inserção/substituição respeita seleção;Backspace ignora separador e apaga dígito anterior. Prefixo nunca editável. Aguardar compositionend antes de normalizar. Converter somente dígitos Unicode de largura completa０–９ paraASCII; não transliterar todos os numeraisUnicode.

Paste aceita nacional/+34/0034 e separadoresespaço,ponto,hífen,parênteses conforme normalizador. Após conversão full-width, rejeitar operação inteira com letras/caracteresproibidos,paísdiferente ou excessonacional>9;preservar estado anterior. Não truncar,não trocar país,não extrair número de texto arbitrário. Autofill usa a mesma normalização sem duplicar+34.

Primeira validação no blur/submit;após primeiroerro,revalidar change para corrigir/remover erro. Requiredvazio falha quando requiredtrue. Componente entrega telefone normalizado,sem solicitarOTP/administrarchallengeId. Aplicação normaliza/revalida novamente.

## 6. OtpInput — valor, edição, paste e foco

Seis inputs reais,um dígitoASCIIporposição,inputMode=numeric. Estadoeditável armazena seis posições vazias/um dígito;não deslocar números ao apagar. Consumidor pode receber posições e completeCode:string|null;somente seis posições preenchidas geram string de6,preservandozeros. API mantém controleexterno/defaultinicial e eventos;aplicaçãoé dona do ciclo de desafio,componente só de apresentação/edição.

one-time-code na primeira célula;handler distribui valor completo conforme paste. Não usar maxlengthque silenciosamente corte autofill de6 para1 antes de distribuí-lo. Validar comportamento em iOS/Android;nenhuma garantia de melhor autofill decorre somente de ter seis inputs.

| Ação | Comportamento |
|---|---|
| Digitar número | Preenche/substitui célula e avança;última permaneceúltima |
| Backspace preenchida | Apaga e permanece |
| Backspace vazia | Volta à anterior e apaga;primeira não sai do grupo |
| Left/Right | Navega sem alterarconteúdo,respeitandoextremos |
| Clique | Foca célula clicada e atualiza posiçãoativa |
| Home/End | Primeira/última célula |
| Delete | Apaga sem mover |
| Tab/ShiftTab | Um ponto de entrada/saída;setas navegam internamente |

Paste:converterfull-width０–９,remover espaços/hífens,rejeitar todo paste com letras ou outrocaractere nãoadmitido,preservandoestado. Validar o conteúdo inteiro antes de truncar:letra após sexto dígito também rejeita.
- Menosde6:limpar grupo,preencher desdeprimeira,focar próxima vazia;nenhum submit enquanto incompleto.
- Exatamente6:substituir grupo inteiro,focarúltima,notificarconclusãoautomática.
- Maisde6:usar primeiros6,ignorar excedente,mesmo fluxo de código completo.
PhoneInput continua rejeitando excesso;essa truncagem é exclusiva do OTP por decisãoexpressa. Não interpretar paste parcial como mistura com códigoanterior.

Prop autoFocus booleana:composição futuraC003/PhoneInput=false;C004/OtpInput=true na primeiracélula. Não hardcodar por componente nem refocar a cada render/polling;somente entrada no fluxo/montagem habilitada. C003/C004 não implementadas neste gate.

## 7. OtpInput — submissão, estados e fronteira arquitetural

empty=0,partial=posições incompletas,complete=6dígitos (não autenticado). invalid/expired/locked/disabled/loading vêm do consumidor/aplicação. complete notifica automaticamente;consumidor trava envio antesdeawait/renderposterior. Nunca request emrender/effect nem duas submissões por paste/autofill/Enter/StrictMode. Aplicação controla deduplicação por desafio,código e tentativa em memória efêmera;componente não administra challengeId.

| Resultado | Regra |
|---|---|
| Em processamento | Loading,preservarcódigo,bloquearedição/novoenvioconcorrente |
| INVALID_OTP com tentativa disponível | Limpar6,focarprimeira,mensagemratificada;permitirentradaimediata |
| Falha de rede/resultado incerto | Preservarcódigo,mostrarerroconexão e botão“Reintentar”;focarbotão;retryapenasexplícito,mesmocódigopermitido;travar novamenteantesdeawait |
| Expired/locked/cooldown | Servidorsoberano;semreset/bypass/resendautomático;resumodoerro recebe foco, não inputdisabled |
| Sucesso | Aplicação consome resposta/navegação;componente não cria nem guarda sessão |

Erro de rede não é INVALID_OTP. Exceção de preservação na rede substitui regra antiga“limpartodoerro”. Erros de código/expiração/bloqueio mantêm limpeza decidida;foco depende de controlehabilitado. Estados recebidos após retry têm a mesma autoridade;não transformar OTP_UNAVAILABLE em sucesso.

Expiração,tentativas,cooldown,resend e timers vêm da aplicação. Mostrar {seconds} recebido/derivado por ela;não iniciar prazo pela montagem. Retryé intenção de callback paraaplicação,não novoendpoint ou lógica de recuperação no componente. Sem OTP emlogs,analytics,URL,storage,telemetria,erros ou sessionreplay. Sem importcrypto/SQLite ou recuperação daOpaqueSession peloUI.

## 8. Microcopy oficial ratificada

| Contexto | Texto |
|---|---|
| Phone label | Número de teléfono |
| Phone helper | Introduce los 9 dígitos de tu número de España. |
| Phone invalid | Introduce un número válido de 9 dígitos. |
| Phone required | Introduce tu número de teléfono. |
| País | Solo se admiten números de España (+34). |
| Paste rejeitado | No se ha pegado el contenido. Revisa el formato. |
| ReadOnly | Solo lectura. |
| Input loading | Procesando… |
| OTP label | Código de verificación |
| OTP helper | Introduce los 6 dígitos. Se verificará automáticamente. |
| OTP loading | Verificando código… |
| INVALID_OTP (HTTP OTP_INVALID) | El código no es válido. Introduce los 6 dígitos de nuevo. |
| OTP_EXPIRED | El código ha caducado. Solicita uno nuevo cuando esté disponible. |
| OTP_LOCKED | Has alcanzado el límite de intentos. Espera para solicitar otro código. |
| Cooldown | Podrás solicitar otro código en {seconds} s. |
| Rede | No hemos podido confirmar el resultado. Comprueba tu conexión. |
| Retry | Reintentar |
| Serviço indisponível | El servicio no está disponible temporalmente. |
| OTP_UNAVAILABLE | Este código no está disponible. Solicita otro cuando puedas. |
| Nome acessível | Dígito {position} de 6 |

Mensagens helper/error/success do Inputbase são fornecidas pelo consumidor,sem inventar prova de identidade. Ação de solicitar novoOTP pertence à aplicação e não está implementada por este componente. Não anunciar os dígitos como parte de região de erro/telemetria.

## 9. Investigação real: retry após resposta perdida

Base37dc523013ac13088fffdd70d8d8c6be7292a612. Evidência por leitura dirigida do código, não experimento de perda de rede nem teste novo executado.

1. [Route](../../apps/ui-lab/app/api/v1/auth/otp/verify/route.ts) encaminha POST real/api/v1/auth/otp/verify (pathcontratual/auth/otp/verify) para runtimeAuthHandlers.
2. [HTTPverifyOtp](../../apps/ui-lab/src/server/mvp-local-36/auth-http.ts) chama serviço;somente depois retorna200comsessionToken.
3. [VerifyCustomerOtp](../../packages/application/src/auth/index.ts) gera token aleatório,passa sótokenHashàpersistência;tokenplaintextédevolvidoapenasnosucesso.
4. [verifyChallengeSQLite](../../packages/persistence/src/customer-auth.ts) verifica status sobtransação. Sucessograva desafioVERIFIED +sessãoACTIVE. Repetição deVERIFIED retornaOTP_UNAVAILABLE antes de inserir outra sessão ou retornar a existente.
5. HTTPmapeiaOTP_UNAVAILABLEpara400. Nãoháreplaydecache/respostaidempotente nohandler.

**Conclusão:** apóscommitbem-sucedido e perda de resposta,retrymesmodesafio/códigoé rejeitado comHTTP400OTP_UNAVAILABLE. Não retorna mesma sessão,não cria segunda. A primeira permaneceACTIVE,sujeitaàexpiração/revogação normal;retry não a revoga. Sóhashpersistido,nãohá caminho implementado para reobterplaintexttoken. Gerar entropia emmemória antes da rejeição não equivale a criar sessão persistida.

[Teste existente](../../tests/unit/mvp-customer-authentication-concurrency.test.ts), “allows a challenge to be verified only once with one customer and one session”, afirma falha na segunda verificação e contagem1sessão. MapeamentoHTTP também consta de [testesHTTP](../../tests/unit/mvp-auth-http.test.ts). Nenhum teste de recuperação de resposta perdida executado nesta investigação.

É proteção de uso único sem replay de resultado, não idempotência de recuperação. [Issue50](https://github.com/srdarllan-hash/hielya-app/issues/50) permanece aberta com prioridade média, não bloqueia MVP nem implementação do OtpInput/C-004; resolver antes de escala. Não armazenar token em claro nem emitir sessão adicional para resolver no UI. Recuperação adiada; A/B descartadas, C ou D preferidas para avaliação futura, sem seleção final.

## 10. Aceite e sequência

Escolhas visuais/comportamentais apresentadas ao proprietário estão ratificadas; não restam alternativasA/B dessas rodadas. DEFAULTS_UNAPPROVED=false. DOCUMENT_READY_FOR_MERGE_REVIEW=true. INPUT_SPEC_READY=true; PHONE_INPUT_SPEC_READY=true; OTP_IMPLEMENTATION_READY=true. As três especificações estão fechadas e prontas para implementação. Este PR é exclusivamente documental e não implementa componentes ou telas.

Próximo gate de backend deve avaliar segurança/contrato/idempotência/reconciliação e testar sucesso+respostaperdida,retryconcorrente,timeout,expiração,revogação,deduplicação e minimização,antes de escala. Não ampliar autorização desta especificação para implementação da Issue50; essa dívida não condiciona o início do OtpInput.

Apósautorizaçãofutura,verificar controlled/uncontrolled,estadoscombinados,labels/descrições/alertsemsaturação,rovingtabindex/autofocuscondicional,IMEfull-width,pastecompleto/parcial/excessoletras,carettelefone,selecão/backspace/delete,zeros,dedupe/loading/retryexplícito,servidorsoberano,mobile360/3+3/zoom/focussemclipping,autofillSafari/ChromiumAndroid e leitoresdetela. Nenhum sucesso de CI atual certifica componentes ainda nãoimplementados. Sem alterar baseline para esconder divergência.

## 11. Decisão final: dívida adiada e especificações fechadas

O proprietário autorizou publicação pública dos documentos e merge do PR #49 após revisão de dados sensíveis e verificações. Input, PhoneInput e OtpInput estão com especificação fechada e pronta para implementação. Issue #50 passa a prioridade média, não bloqueia MVP ou OtpInput/C-004; resolver antes de escala. A/B descartadas por conflito com minimização. C ou D preferidas para análise futura, sem escolha final ou implementação agora. [Decisão detalhada](OTP_VERIFY_RECOVERY_OPTIONS.md).

Em falha de rede: preservar código, mostrar erro de conexão e oferecer retry explícito. O componente NÃO promete recuperação. Se o retry receber OTP_UNAVAILABLE, exibir exatamente “Este código no está disponible. Solicita otro cuando puedas.” e orientar a solicitar novo código quando o cooldown permitir. A aplicação mantém autoridade sobre cooldown/reenvio; não executar reenvio automático nem contornar restrições do servidor.

Mitigação provisória a especificar no backend: limpeza/expiração de sessões ACTIVE nunca utilizadas; não tratar falta de ACK como prova de não uso. Nenhuma rotina de limpeza, recuperação, mudança de contrato ou implementação de componente é realizada neste PR.

## 12. Ratificação complementar — ação Reintentar

Button canônico, variante secondary, tamanho md, largura automática. Ação de recuperação dentro da mensagem de erro; não competir com a ação principal de verificação. Decisão expressa do proprietário na implementação da Issue #51.
