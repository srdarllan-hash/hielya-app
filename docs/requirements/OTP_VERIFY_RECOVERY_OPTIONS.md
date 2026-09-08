# Recuperação de verify OTP após resposta perdida — opções para decisão

2026-09-07 · Issue #50 · PR #49 · **DECISÃO: recuperação adiada; prioridade média; não bloqueia MVP. A/B descartadas; C ou D preferidas futuramente, sem seleção final. Nenhuma implementação.**

## Evidência e escopo

Inspeção do código na main `37dc523013ac13088fffdd70d8d8c6be7292a612`: [persistência](../../packages/persistence/src/customer-auth.ts), [aplicação](../../packages/application/src/auth/index.ts), [HTTP](../../apps/ui-lab/src/server/mvp-local-36/auth-http.ts) e [ADR vigente](../decisions/ADR-MVP-LOCAL-36-OPAQUE-CUSTOMER-SESSION-V1-2.md). Sucesso consome o challenge e cria sessão; retry retorna 400 OTP_UNAVAILABLE. Token aleatório de 32 bytes, apenas SHA-256 persistido, validade absoluta de 30 dias. Runtime somente development/test; não houve experimento de perda de rede nesta análise.

Precisão: o mesmo challenge fica irrecuperável pelo verify atual, mas não há bloqueio permanente do telefone no backend: requestChallenge permite novo desafio após resend_available_at. Isso exige novo SMS e não recupera nem revoga a sessão órfã. A UI desse percurso ainda não existe.

A pendência não bloqueia MVP ou implementação de OtpInput/C-004. As especificações Input/PhoneInput/OtpInput estão fechadas e prontas para implementação. Este PR contém somente documentação.

## Comparação

| Opção | Minimização | Segurança | Complexidade estimada | Contrato/OpenAPI |
|---|---|---|---|---|
| A — chave de requisição | Retorno do mesmo token exige retenção recuperável temporária da resposta/token. Mesmo cifrado, é exceção à política global de apenas hash; tabela de sessões pode continuar só com hash. | Chave secreta de alta entropia, vinculada a operação/challenge/payload; mesma chave com outro payload rejeitada. Janela fixa; não devolver sessão expirada/revogada. Resolve retries sem multiplicar sessões; se cliente abandonar, órfã continua possível. | Alta: reserva atômica da chave, cache cifrado compartilhado, concorrência, expurgo e recuperação após crash. | Sim: header Idempotency-Key, regras de replay/conflito/expiração, erros e revisão do ADR. |
| B — challengeId + código | Para retornar o mesmo token, mesma retenção recuperável de A. Hash não permite reconstrução. Emitir outro token é C, não replay da resposta. | Estende utilidade de OTP consumido: quem possuir challengeId+código pode obter token durante a janela. Revalidar digest, limitar tentativas inclusive após VERIFIED e não estender janela. Mesma sessão; órfãs ainda possíveis por abandono. | Média-alta: associação challenge/sessão/resposta, armazenamento protegido, atomicidade, expurgo e rate limit. | Sim, sem necessariamente mudar corpo: semântica de VERIFIED, janela, erros e revisão da emissão única no ADR. |
| C — nova sessão e revogação da anterior | Mantém somente hashes dos tokens; adiciona vínculo challenge/sessões, contador e timestamps. Nenhum token anterior precisa ser recuperado. | Mesmo OTP passa a permitir emissão repetida. Atacante com challenge+código pode revogar sessão legítima; retries concorrentes/tardios podem invalidar resposta já recebida. Revogar e emitir atomicamente, limite finito e janela fixa. | Alta: rotação atômica, ordenação de retries e respostas, limite de gerações, tratamento de sessão já utilizada. | Sim: semântica de rotação/revogação, limites, erros e substituição de token; ADR atual exclui rotação. |
| D — novo OTP imediato | Mantém hashes; precisa de estado de confirmação, vínculo challenge/sessão e metadados mínimos de recuperação. | Ausência de confirmação não prova perda. Sem controles, permite spam/SMS pumping, contorno de cooldown e invalidação indevida. Novo OTP exige nova prova via SMS. Sessão órfã permanece até política explícita de revogação/expiração. | Alta para a condição proposta: protocolo de confirmação e recuperação, corridas e limites de SMS. Simples bypass de cooldown não satisfaz a condição. | Sim: request atual só recebe telefone/locale; precisa identificar recuperação, definir prova, confirmação e novos estados/erros. |

Estimativas qualitativas relativas ao código atual, não cronogramas. Janela, TTL e limites permanecem sem definição. A comparação abaixo é registro técnico das alternativas avaliadas: A/B estão descartadas; C/D não serão implementadas agora.

## A — detalhes a decidir

Cliente gera uma chave antes do primeiro envio e reutiliza a mesma chave e payload no retry. Chave não é identidade nem autorização isolada. Vincular a operação, challenge e fingerprint protegido do payload; não guardar OTP em claro ou hash simples que facilite enumeração de seis dígitos. Rejeitar divergência sem executar nova verificação.

Registrar resultado recuperável junto ao consumo do OTP/criação da sessão de modo atômico: cache preenchido só depois do commit deixa exatamente a mesma falha em caso de crash. Cache apenas em memória perde a garantia em reinício ou múltiplas instâncias. Cifragem exige chave separada, acesso restrito, expurgo incluindo cópias/backups e exclusão de logs/telemetria; continua sendo retenção recuperável.

“Mesma resposta” precisa de definição: token e resultado estáveis, prazo absoluto da sessão nunca renovado. Repetir expiresInSeconds original depois de algum tempo induz o cliente a superestimar a validade; decidir corpo literal com referência temporal explícita ou mesmo resultado com tempo restante recalculado. Correlation ID não substitui Idempotency-Key. Após janela ou revogação/expiração, não reproduzir sucesso inválido.

## B — detalhes a decidir

Usar challengeId e código como prova de replay somente dentro de prazo contado do primeiro sucesso. O fluxo VERIFIED precisa verificar o código, limitar falhas e conferir sessão ainda válida antes de devolver resposta. Não reabrir contador/janela em cada retry. Definir quando a possibilidade de replay termina (janela e eventualmente confirmação/primeiro uso), inclusive em corridas.

Reter token cifrado ou resposta protegida exige a mesma exceção à minimização de A. Derivação determinística do token introduziria outra arquitetura criptográfica, com segredo capaz de regenerar credenciais; não é uma consequência gratuita de “somente hash” e não é proposta aprovada aqui.

## C — detalhes a decidir

Transação única revoga a sessão anterior ligada ao desafio e insere a nova, deixando no máximo uma ativa por cadeia de recuperação. Não revogar todas as sessões do cliente. Tokens novos mantêm entropia atual; o prazo deve respeitar limite absoluto da cadeia, sem renovação ilimitada por retry.

Mesmo com serialização no servidor, resposta da geração 1 pode chegar depois da geração 2. Definir sequência de tentativas, descarte de respostas antigas pelo consumidor e o que ocorre quando a geração recebida já foi revogada. Bloquear concorrência no cliente não resolve sozinho duplicação de transporte. Um limite finito evita emissão ilimitada, mas, se a última resposta também se perder, exige caminho de recuperação explícito. Sessão anteriormente recebida não pode ser classificada como órfã só por falta de confirmação.

## D — detalhes a decidir

Hoje não há confirmação de recebimento/armazenamento de sessionToken. Status de SMS DELIVERED não confirma entrega da sessão. Sucesso da escrita HTTP no servidor também não prova recepção pelo cliente.

Uma confirmação explícita autenticada pelo novo token, ou primeiro uso autenticado, fornece evidência positiva; ausência é apenas estado desconhecido. O ACK também pode se perder. Definir corrida entre confirmação e pedido de recuperação, confirmação idempotente e prova para autorizar exceção de cooldown; telefone ou challengeId isolados não devem permitir abuso.

“Sem cooldown” deve significar exceção delimitada para recuperação, com rate limits independentes por telefone/desafio/origem e limite de recuperações; não remove proteção de envio global. Definir destino da sessão anterior: revogar no pedido pode derrubar sessão legítima sem nova prova; revogar após novo OTP verificado reduz esse risco, mas deixa órfã ativa até lá. Ambas são decisões pendentes. Esta opção reinicia autenticação, não retorna o sucesso anterior, e depende de outro SMS.

## Aceite futuro e decisão

Todas as opções exigem atualização aprovada do contrato vigente e do ADR, sob novo gate; contratos históricos permanecem preservados. Nenhum OpenAPI foi alterado neste PR. Não escolher arquitetura no componente.

Antes de escala e de encerrar Issue #50: retomar C ou D, escolher opção e parâmetros; implementar sob autorização própria; verificar perda após commit e antes da resposta, crash nesse intervalo, múltiplas instâncias quando aplicável, retries simultâneos/tardios, revogação/expiração, janela sem extensão, limites contra replay e ausência de segredos em logs. A/B: replay da mesma sessão e expurgo; C: revogação atômica e respostas fora de ordem; D: ACK perdido, corrida de confirmação e abuso de reenvio. Contrato e comportamento devem coincidir. CI de documentação não certifica essas garantias.

## Decisão do proprietário e mitigação provisória

Adiar recuperação: o usuário pode solicitar outro OTP após cooldown; o impacto aceito no MVP é incômodo pontual e sessão órfã, não bloqueio permanente do telefone. A/B descartadas por conflito com persistir apenas hash. C ou D são preferidas porque preservam essa política, mas não há escolha final nem autorização de implementação agora. Esta decisão prevalece sobre a apresentação original de opções abertas.

Prioridade média, resolver antes de escala. Especificar futuramente rotina de limpeza/expiração de sessões ACTIVE nunca utilizadas, para evitar acúmulo. A validade absoluta atual não equivale a uma rotina de varredura/remoção: devem ser definidos sinal confiável de primeiro uso, prazo, atomicidade frente ao primeiro uso concorrente, revogação e retenção/remoção. Não uso não é inferível apenas da falta de confirmação; não apagar indiscriminadamente sessões válidas. Nenhum desses mecanismos foi implementado ou teve prazo aprovado.

Fluxo provisório: preservar código e erro de conexão, retry explícito sem promessa de recuperação; OTP_UNAVAILABLE orienta novo código quando cooldown permitir, usando “Este código no está disponible. Solicita otro cuando puedas.”. Sem alterar backend/contrato.
