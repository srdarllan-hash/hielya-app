# ALCOHOL_COMPLIANCE_DOMAIN_REQUIREMENTS

Data: 2026-09-07. Issue [#33](https://github.com/srdarllan-hash/hielya-app/issues/33).
Status: **OWNER_DECISIONS_RECORDED / IMPLEMENTATION_PLAN_PENDING_AUTHORIZATION / NOT_IMPLEMENTED**.
Revisão documental 2: seis decisões expressas do proprietário incorporadas; PR #34 continua draft e sem merge.
Base verificada: main `4d32cebcc7f68832940f6825177d5348d63f245a`.

Este documento especifica requisitos para revisão. Não modifica nem substitui OpenAPI, migrations, contratos certificados ou decisões comerciais. As seis decisões do proprietário são requisitos definidos; o plano técnico de execução aguarda autorização separada. A aprovação deste documento não ativa venda de álcool, produção ou implementação de telas.

## 1. Fundamento e limites da análise

O art. 3 do [Decreto 167/2002, BOJA](https://www.juntadeandalucia.es/boja/2002/67/4) estabelece a restrição geral de 22:00–08:00 para venda, fornecimento e distribuição nos canais descritos, incluindo venda a distância. Portanto, verificar a entrega efetiva é necessário para esta especificação, mas não elimina controles sobre os atos anteriores. O decreto admite exceções municipais delimitadas; nenhuma exceção será presumida ou habilitada neste MVP. A fórmula baseada em SLA abaixo é uma regra de engenharia solicitada pelo proprietário, não uma fórmula textual da norma.

O [art. 26 da Lei 4/1997, texto consolidado do BOE](https://www.boe.es/buscar/act.php?id=BOE-A-1997-18301#a2-8) proíbe venda/fornecimento a menores de 18 anos e contém uma exceção de uso profissional para maiores de 16. O requisito HIELYA desta rodada é estritamente **18+**, sem implementar essa exceção. Não se apresenta a regra do produto como transcrição integral da lei.

A [orientação da AEPD sobre verificação de idade](https://www.aepd.es/preguntas-frecuentes/10-menores-y-educacion/1-sistemas-de-verificacion-edad) distingue comprovar um limiar etário de conhecer identidade/idade exata. Seu contexto é a verificação online; não constitui um procedimento oficial específico para entregadores. A aplicação presencial e o conjunto mínimo de registros abaixo são requisitos deste gate, compatíveis com essa direção de minimização. A retenção segue a decisão D5 detalhada na seção 5, com distinção entre prazo mercantil, fiscal e necessidade de conservar a evidência mínima.

Consulta das fontes em 2026-09-07. Esta é análise técnica dos requisitos indicados, não certificação jurídica integral da operação, licenciamento ou exceções locais. As restrições específicas de hotel abaixo são política de handover solicitada pelo proprietário.

## 2. Estado real e gap delimitado

| Evidência na main | O que já existe | O que não está implementado |
|---|---|---|
| `contracts/openapi/HIELYA_OPENAPI_V1_0.yaml` | Contrato histórico amplo: `containsAlcohol`, `ageDeclarationsAccepted`, `etaMinAt/etaMaxAt`; StoreState com `alcoholCheckoutAllowed/alcoholCutoffAt`; age-check, verify-pin, fail e refunds | Não equivale a endpoints de pedido/entrega ativos no MVP público V1_2 |
| OpenAPI público V1_2 e `CLAUDE.md` | Catálogo/localização/quote e transporte OTP; camadas de pedido/pagamento/admin ainda fora da implementação autorizada | Orquestração de checkout, aceite, entrega, recusa e reembolso |
| `.dev-migrations/0002_mvp_local_36_catalog_read_model.sql` | `contains_alcohol`, `minimum_age`, restrição de idade mínima >=18 para produto alcoólico | Snapshot imutável do conteúdo de um pedido e guarda de handover |
| `.dev-migrations/0001_mvp_local_36_persistence.sql` | `delivery_pins`, tentativas, hash e `verified_at`; valores simulados de pedidos | Entidades completas de pedido/entrega/tentativa, resultado de idade, janela de entrega e ciclo financeiro real |
| `packages/persistence/src/index.ts` | `verifyDeliveryPin` compara credencial e contabiliza tentativas | Não verifica idade, presença física ou horário; não certifica entrega legal |
| `packages/ui/src/screens/home/{home.types.ts,HomeScreen.tsx,HomeScreen.stories.tsx}` | Estado de apresentação `alcohol-cutoff`, aviso de entrega antes de 22:00, story e baselines C-005 | `blocked` considera closed/out-of-area, não elegibilidade de álcool por produto; aviso não é guarda de compra |
| `apps/ui-lab/src/client/mvp-local-36/HomeCatalogRuntime.tsx` | Runtime real de catálogo | Não passa um estado temporal de álcool ao HomeScreen; ausência de integração com uma decisão temporal de domínio |

**Não é correto afirmar que o estado visual de álcool fora de horário inexiste em todo o projeto.** Existe a apresentação C-005; faltam integração e enforcement. OTP/sessão opaca, declaração 18+ e PIN têm finalidades distintas; nenhum dos três comprova inspeção presencial de maioridade.

## 3. Regra temporal proposta

Requisito solicitado: `alcoholOrderCutoff = 22:00 - 45 minutos = 21:15` (decisão D1).

- Usar a data local do serviço e a zona IANA `Europe/Madrid`; armazenar instantes UTC e expor timestamps com offset. Não fixar UTC+1/UTC+2.
- `alcoholHandoverDeadlineAt` é 22:00 dessa data. O SLA máximo deve cobrir todo o percurso entre autorização de compra e entrega: fila, aceite, preparação, deslocamento, encontro no hotel, inspeção de idade e PIN. Um ETA apenas de viagem não atende ao requisito.
- Na criação: permitir álcool somente com loja operacionalmente aberta, dados confiáveis, `serverNow < alcoholOrderCutoffAt` e `promisedLatestHandoverAt < alcoholHandoverDeadlineAt`.
- A operação continua 10:00–22:00. O limite legal inferior de 08:00 não autoriza abrir às 08:00. Não criar pedidos noturnos de álcool para entrega futura nesta especificação.
- Exatamente 22:00 é proibido. Exatamente no cutoff calculado também é recusado nesta proposta conservadora, pois a promessa máxima atingiria 22:00. SLA de 45 minutos implica cutoff 21:15; às 21:15 não aceitar uma promessa de entrega até 22:00.
- O SLA máximo ponta a ponta é **45 minutos**, incluindo eventual folga interna. Nenhuma margem adicional ou promessa maior foi autorizada. Capacidade operacional insuficiente deve bloquear álcool, nunca ampliar silenciosamente o SLA/cutoff. Não deduzir SLA do raio de 4 km, de PNG ou da taxa de entrega.
- Em aceite/replanejamento, recalcular o tempo máximo restante, sem somar novamente etapas concluídas. Conservar o prazo original auditável; não truncar o ETA para parecer elegível, nem ampliar o deadline para o dia seguinte.
- **Guardas obrigatórias de domínio em checkout, criação atômica do pedido, aceite, início e conclusão de preparação, despacho, chegada e handover**, além de alteração/substituição de itens. Aceite/preparação/despacho exigem janela legal vigente, estado do pedido válido e ETA máximo restante estritamente anterior a 22:00. O cutoff 21:15 bloqueia novas compras; não é o deadline de despacho de pedidos já aceitos. Esses só avançam enquanto puderem cumprir a promessa original (no máximo 45 minutos) e a entrega antes de 22:00. Um pedido aceito cedo não recebe exceção se atrasar.
- Na entrega física, exigir `08:00 <= horaLocal < 22:00` e janela operacional aplicável. Uma autorização emitida às 21:59 não permite entrega às 22:00. O entregador deve interromper a entrega se a janela expirar entre autorização e transferência física.
- Falha de relógio confiável, SLA ausente, indisponibilidade de rede ou dados de elegibilidade vencidos bloqueia álcool. Não aceitar relógio do cliente, backdating ou conclusão offline como prova do prazo.
- Produtos sem álcool permanecem sujeitos às regras normais da loja, estoque, raio, mínimo e pagamento. Não fechar artificialmente a loja para representar restrição exclusiva de álcool.

Persistir a versão da política, SLA máximo utilizado, deadline e promessa de entrega junto ao pedido para explicar a decisão. O servidor deve reavaliar a regra vigente sem usar um snapshot antigo como autorização para violá-la.

## 4. Contrato de domínio proposto

Os nomes seguintes são uma proposta para futura versão de contrato, não alterações aplicadas.

| Campo | Tipo / origem | Invariante |
|---|---|---|
| `order.containsAlcohol` | boolean, servidor | OR dos itens efetivos, incluindo componentes de packs e substituições; nunca confiar no boolean do cliente |
| `order.requiresAgeVerification` | boolean, readOnly | Igual a `containsAlcohol`; não pode ser desligado pelo cliente/admin |
| `order.alcoholHandoverDeadlineAt` | date-time ou null | Obrigatório para pedido com álcool; null sem álcool |
| `order.alcoholOrderCutoffAt` | date-time ou null | Derivado do deadline e SLA certificado |
| `order.etaMinAt/etaMaxAt` | date-time | Reaproveitar conceitos históricos, definir que o máximo alcança o handover completo |
| `delivery.ageVerificationStatus` | enum | `PENDING`, `VERIFIED_18_PLUS`, `REFUSED_NO_ID`, `REFUSED_MINOR`, `REFUSED_DOUBTFUL_ID` |
| `delivery.ageVerificationMethod` | enum ou null | Proposta `IN_PERSON_DOCUMENT_VISUAL_CHECK`; null em PENDING ou ausência de documento; não OCR/upload |
| `delivery.verifiedAt` | date-time ou null | Instante da verificação bem-sucedida; nunca preencher para recusa |
| `delivery.verifiedByCourierId` | identificador interno ou null | Obtido da identidade autenticada do entregador que realizou a verificação; não aceitar atribuição arbitrária do payload |

Para registrar recusas sem chamar recusa de “verificação bem-sucedida”, a tentativa guarda **um timestamp da decisão** (`recordedAt`) e o ator (`courierId`), além de resultado e método. `verifiedAt/verifiedByCourierId` são a projeção desses mesmos dados somente quando o resultado é VERIFIED_18_PLUS. Na recusa, consultar resultado/método/timestamp/ator no registro restrito da tentativa. Não há um segundo cadastro de identidade do destinatário.

Pedido sem álcool mantém `requiresAgeVerification=false` e não recebe um VERIFIED_18_PLUS fictício; PENDING não impede entrega de itens exclusivamente não alcoólicos. Toda tentativa deve estar vinculada a orderId/deliveryId/attemptId e à revisão do pedido, como chaves operacionais, não como novos dados de documento.

### 4.1 Invariante de handover

Para álcool: **prazo respeitado AND VERIFIED_18_PLUS AND PIN confirmado**, além de estado logístico válido, entregador autorizado e encontro presencial com destinatário elegível. Uma condição não substitui outra. PIN prova posse da credencial do pedido; não é prova documental de identidade civil nem de idade.

A verificação deve ocorrer na mesma tentativa e com a mesma pessoa presente no handover. Troca de destinatário é proibida neste pedido; não entregar a terceiro/recepção. Antes de uma recusa terminal, reatribuição de entregador ou alteração relevante de itens invalida provas anteriores. Após recusa não há nova tentativa no mesmo pedido. Não transformar uma verificação de um pedido em atributo permanente “adulto verificado” da conta.

**D6 — comando único e atômico de conclusão:** a futura operação final recebe a confirmação presencial de maioridade e o PIN, resolve o entregador autenticado e verifica, no mesmo limite transacional, relógio/deadline, estado/revisão, ausência de recusa anterior, resultado etário e credencial PIN. Somente o conjunto válido autoriza o handover e grava a conclusão/consumo de PIN/evidência de sucesso. Não combinar aprovações parciais de chamadas independentes nem usar `delivery_pins.verified_at` antigo como autorização.

Preparar os dados da inspeção na interface não conclui entrega nem grava sucesso etário final antes do comando. O age-check histórico poderá registrar **recusa terminal**; sua resposta de sucesso isolada nunca poderá liberar entrega. A proposta de compatibilidade é evoluir/versionar `POST /admin/deliveries/{deliveryId}/verify-pin` como o comando final único, preservando sua finalidade histórica de concluir entrega e ampliando seu payload/guardas; não expor uma segunda rota de conclusão concorrente.

Uma falha não pode deixar DELIVERED, PIN consumido com sucesso ou verificação parcial reutilizável. Tentativas inválidas de PIN e recusa são eventos de falha próprios, persistidos de forma controlada, sem sucesso parcial. A recusa por verificação encerra a entrega e inicia compensação integral (seção 6). Reenvio técnico idempotente do mesmo comando pode retornar seu resultado anterior; não é nova tentativa física e não repete handover/reembolso.

Concorrência deve ser resolvida por bloqueio/revisão e unicidade: recusa, cancelamento e conclusão não podem vencer simultaneamente. Não manter transação de banco aberta enquanto o entregador inspeciona o documento. A inspeção física precede o submit; a decisão server-side usa dados da mesma pessoa presente, no mesmo comando. A transação não torna a transferência física atômica: a autorização expira no deadline, e o entregador não transfere álcool se o horário vencer antes do ato físico. Falha de rede ou resultado incerto exige reconciliação do mesmo comando, jamais concluir offline ou presumir autorização.

### 4.2 Transições de idade

PENDING → um dos quatro resultados terminais da tentativa. Recusa não é sobrescrita por VERIFIED na mesma tentativa. Nova tentativa no mesmo pedido é proibida. Somente um novo pedido, submetido a todas as regras atuais, pode originar outra entrega; ele não herda evidências do anterior. Corrigir um lançamento incorreto requer evento auditável, sem apagar histórico e sem liberação retrospectiva de handover.

`REFUSED_NO_ID`: documento não apresentado. `REFUSED_MINOR`: documento demonstra idade inferior a 18. `REFUSED_DOUBTFUL_ID`: autenticidade, legibilidade ou correspondência não permite confirmar maioridade do destinatário. Ausência do destinatário, endereço inacessível, prazo excedido e PIN incorreto são motivos logísticos próprios; não inventar uma recusa etária nesses casos.

## 5. Minimização e hotel

O registro específico da inspeção conterá apenas **resultado, método, timestamp e courierId**, associado às chaves da tentativa. Não criar campos, anexos, logs ou analytics para fotografia de documento, número, cópia digital, data de nascimento completa, idade exata, selfie, biometria ou transcrição livre do documento. Inspeção visual presencial não significa capturar uma imagem. Não usar notas livres de recusa para contornar a minimização.

**D4 — documentos:** aceitar DNI, NIE ou passaporte conforme decisão do proprietário, com inspeção visual apenas. O entregador compara presencialmente a pessoa com o documento e verifica 18+, sem registrar número, fotografia ou nascimento. Não ampliar automaticamente a lista para carteira de motorista ou outros documentos do enum histórico.

Precisão técnica: NIE é identificador, não documento suficiente por si só. Um certificado/número sem elementos para conferir pessoa e idade não pode produzir VERIFIED_18_PLUS. Na opção “NIE”, exigir suporte documental que permita a conferência; se insuficiente, usar o passaporte já aceito, sem copiar dados. Isso preserva a opção aprovada sem equiparar um número à prova de maioridade. A [orientação do Ministério do Interior sobre TIE](https://www.interior.gob.es/opencms/es/servicios-al-ciudadano/tramites-y-gestiones/extranjeria/regimen-general/tarjeta-de-identidad-de-extranjero/) distingue a situação administrativa da comprovação de identidade por passaporte/documento análogo. O manual futuro deve tornar essa distinção clara ao entregador. Ausência de documento verificável → REFUSED_NO_ID; documento apresentado mas insuficiente/duvidoso → REFUSED_DOUBTFUL_ID; menor identificado → REFUSED_MINOR.

**D5 — conservação vinculada ao pedido:** o registro mínimo de verificação acompanha a mesma política/data de eliminação do dossiê do pedido e seus comprovantes fiscais; não recebe TTL independente nem renovação por leitura ou login. Referência mercantil geral: **seis anos desde o último lançamento nos livros**, ressalvadas disposições especiais, conforme [Código de Comércio, art. 30](https://www.boe.es/buscar/act.php?id=BOE-A-1885-6627#a30). Não significa “até seis anos desde a compra”. A [AEAT informa prazo fiscal geral de quatro anos](https://sede.agenciatributaria.gob.es/Sede/iva/facturacion-registro/facturacion-iva/obligacion-conservar-facturas.html); ele não substitui a obrigação mercantil aplicável e pode haver regras especiais/interrupções.

Especificar no dossiê do pedido um `retentionUntil` derivado da obrigação aplicável e seu marco contábil, herdado pela evidência mínima. Suspensão legal de eliminação deve ser documentada no mesmo dossiê, com fundamento e revisão, sem conservação indefinida genérica. A obrigação de guardar contabilidade não prova automaticamente que todo dado pessoal do pedido seja necessário por seis anos: documentar a finalidade/necessidade da evidência mínima como prova do cumprimento da entrega; não estender por arrasto a sessão, localização detalhada ou dados não necessários.

Restringir leitura a entregador atribuído durante a operação e suporte/admin por necessidade. Encerrado o uso operacional, conservar em arquivo restrito pelo prazo do pedido. Não usar para marketing/perfilamento. Observar bloqueio e destruição quando aplicáveis segundo [LOPDGDD, art. 32](https://www.boe.es/buscar/act.php?id=BOE-A-2018-16673#a32); conservar para obrigação/defesa não significa disponibilizar para uso corrente. A futura política de dados deve documentar fundamento, acesso, descarte e tratamento de backups, sem inventar prazo exclusivo de verificação etária.

**D3 — hotel e destinatário:** encontro presencial obrigatório entre entregador e destinatário adulto do próprio pedido. Lobby/recepção pode ser ponto de encontro; nunca depósito. Proibidos deixar na porta/quarto, com terceiro ou recepcionista, repassar para outro destinatário ou confirmar com PIN remoto. A instrução de endereço não cria exceção. Sem adulto presente ou sem verificação possível, não entregar; registrar falha apropriada. Não permitir nova tentativa/reagendamento no mesmo pedido. Cliente poderá fazer **novo pedido**, com adulto presente na entrega, sujeito novamente a horário, SLA, estoque e demais regras. Um novo pedido não serve para entregar ao menor anteriormente recusado nem herda sua autorização.

## 6. Recusa, pedido, estoque e dinheiro — decisões D2/D3

**Recusa por falha de verificação: reembolso integral automático, sem custo ao cliente.** Aplicar ao pedido inteiro, inclusive misto, como interpretação operacional do reembolso integral: nenhum item é entregue parcialmente nessa ocorrência; valor total efetivamente pago, incluindo frete/cobranças, é devolvido sem multa, taxa de retorno ou abatimento de custo. Não recriar mínimo €25 sobre uma parte entregue, pois esse fluxo parcial foi removido.

| Ocorrência | Resultado de domínio | Resolução |
|---|---|---|
| NO_ID / MINOR / DOUBTFUL_ID | Recusa terminal, sem entrega | Compensação integral automática; sem nova tentativa |
| PIN não confirmado ao encerrar handover | Não entregar; falha de verificação | Mesmo princípio sem custo; limites de digitação existentes não autorizam nova visita ou override |
| Pedido com álcool misto ou exclusivo | Pedido inteiro não entregue na recusa | Não dividir entrega/cobrança nem escolher política parcial |
| Terceiro/recepção ou destinatário ausente | Não entregar, motivo logístico real; não inventar resultado de inspeção | Sem nova tentativa; quando impede a verificação, aplicar resolução sem custo; não atribuir menoridade a pessoa ausente |
| Deadline excedido | Não preparar/despachar/entregar em violação; registrar motivo temporal | Não classificar como falha etária. Tratar no fluxo de falha operacional/cancelamento futuro; não criar taxa ou política comercial distinta implicitamente |

O reembolso aprovado explicitamente cobre falha de verificação; o valor/regime de outras falhas operacionais não deve ser inferido como decisão comercial nova. A implementação deverá reutilizar a política geral de cancelamento aplicável ou trazê-la à revisão antes de ativar esses casos, mantendo sempre o bloqueio de entrega.

- Pagamento não capturado: cancelar/liberar integralmente a autorização; sem captura para cobrar a falha. Pagamento capturado: iniciar automaticamente estorno integral do saldo pago ainda não devolvido. Capture parcial exige estornar o capturado e cancelar o restante autorizado.
- “Automático” significa disparo sem solicitação ou aprovação manual; não promete crédito bancário instantâneo. Registrar PENDING/PROCESSING/REFUNDED/FAILED conforme confirmação real. Falha do processador gera reconciliação e alerta, mantendo o direito ao integral, sem custo ao cliente.
- Usar evento/outbox transacional para registrar recusa e obrigação de compensação; chamada externa de pagamento fora da transação, com idempotência e reprocessamento. Não alegar atomicidade distribuída com banco/processador.
- Pedido/entrega mantêm distinção logística/financeira: DELIVERY_FAILED, RETURNING/RETURNED quando há mercadoria expedida, e cancelamento conforme estágio. Reembolso não espera aprovação manual do retorno; estoque vendável só é recomposto após recepção/inspeção. Reserva não convertida é liberada uma vez. Sem dupla reposição/captura/estorno.

## 7. Gap de OpenAPI — futura evolução, sem editar contratos

| Superfície histórica | Mudança necessária proposta |
|---|---|
| StoreState / catálogo | Diferenciar loja OPEN de elegibilidade de álcool; explicitar motivo (`CUTOFF`, `SLA_UNAVAILABLE`, etc.), cutoff, deadline e validade da informação. Informação pública não autoriza checkout |
| `/delivery/quote` | Associar promessa máxima real de handover, zona temporal, validade e versão da política; distância/preço isolados não bastam |
| `POST /orders` / CreateOrderInput | Servidor calcula containsAlcohol/requiresAgeVerification, verifica janela e snapshot/revisão. `ageDeclarationsAccepted` não vira verificação presencial |
| Aceite/preparo: `/admin/orders/{orderId}/start-picking`, `/confirm-items`, `/mark-ready` | Mapear aceite formal e conferir guardas antes de aceite, início/fim do preparo e despacho, incluindo substituições. Usar comandos existentes que correspondam a essas transições, sem deixar fase sem guarda |
| `/admin/deliveries/{deliveryId}/start` e `/arrive` | Reavaliar prazo restante; chegada não equivale a handover |
| `/admin/deliveries/{deliveryId}/age-check` | Versionar resultado de recusa; ator/tempo do servidor e pedido vinculados. Sucesso etário não pode virar autorização parcial reutilizável: sucesso final pertence ao comando atômico D6 |
| `/admin/deliveries/{deliveryId}/verify-pin` | Comando final único proposto: payload de PIN + declaração de inspeção presencial; avaliar prazo/idade/PIN simultaneamente e gravar conclusão apenas se todas válidas. Versionar quebra de payload explicitamente |
| `/admin/deliveries/{deliveryId}/fail` | Reutilizar para recusa; já possui UNDER_18, NO_DOCUMENT, INVALID_DOCUMENT e ALCOHOL_DEADLINE_EXCEEDED. Definir mapeamento, idempotência e estado resultante; impedir dados de documento em notes |
| `/admin/refunds` e leitura de refund | Reutilizar modelo histórico para resolução financeira; separar cancelamento de autorização e estorno de captura; reembolso integral automático D2 e estados reais de confirmação, sem taxa ao cliente |
| Leitura de pedido/entrega | Expor estado e resolução ao cliente; detalhe de verificação restrito por papel, sem dados desnecessários |

Mapeamento legado: UNDER_18 → REFUSED_MINOR; NO_DOCUMENT → REFUSED_NO_ID; INVALID_DOCUMENT/IDENTITY_MISMATCH → REFUSED_DOUBTFUL_ID somente quando efetivamente impedem a confirmação na inspeção. APPROVED legado não pode ser migrado automaticamente para VERIFIED_18_PLUS sem evidência de método, ator e instante. OTHER/UNSAFE_RECIPIENT não provam menoridade.

**Não criar endpoint paralelo de conclusão/recusa por padrão.** Evoluir os comandos históricos em nova versão aprovada. D6 encerra a alternativa de validar cada condição em chamadas capazes de completar parcialmente a entrega: somente a operação final atômica autoriza handover. No contrato futuro, documentar que age-check isolado não permite completar entrega e que fail é terminal, sem endpoint de retry do mesmo pedido.

Propor respostas de conflito de domínio com código estável para deadline, idade pendente/recusada, PIN e revisão desatualizada; distinguir 401/403 de falha comercial. A classificação exata dos HTTP status e envelopes deverá seguir o padrão da futura versão pública aprovada. Papéis de courier/admin precisam de autorização própria; possuir sessão opaca de cliente não autoriza comandos de entregador. Nunca confiar em courierId ou timestamp enviados pelo cliente.

## 8. Persistência e migrations futuras

As migrations 0001–0004 existentes permanecem intactas. Não há tabela operacional completa de pedido/entrega a simplesmente acrescentar um boolean; sua fundação deverá ser autorizada em gate próprio.

Proposta de esquema futuro: pedido e itens com snapshot de álcool/revisão; entrega e tentativas com estados/motivos; política temporal/versionamento e promessa; registro mínimo de inspeção; associação de PIN à tentativa única e consumo atômico; eventos idempotentes/outbox de recusa, retorno e compensação integral; referência à retenção do dossiê do pedido. Chaves estrangeiras, unicidade de comandos e transições condicionais devem impedir atores/entregas cruzados e conclusão duplicada.

Checks: requiresAgeVerification coerente com conteúdo; VERIFIED exige método/ator/instante; PENDING não contém prova bem-sucedida; recusa não satisfaz handover; prazo obrigatório para álcool. Validar agregação dos itens e condições de estado na camada de aplicação/transação, não apenas em CHECK isolado. Timestamp de PIN existente não é base para backfill de idade. Dados antigos sem evidência permanecem não verificados; nunca inventar verificações históricas.

Criar migration aditiva numerada segundo o estado real na futura branch; não reservar número agora nem editar snapshots congelados. Definir rollback operacional, concorrência e reprocessamento técnico sem reabrir tentativa física; implementar retenção herdada D5 antes da execução. Não criar tabela com documento/foto/DOB.

## 9. UI e cobertura dos 96 assets

Fonte consultada ao vivo: [registro canônico, aba Registro A1:L97](https://docs.google.com/spreadsheets/d/1BkaFcxeouK3B41tZ8-ECPyR2bXuBNl_R8i6r1KRGBVc/edit). São 96 itens; nomes, famílias e anotações não identificam asset dedicado para álcool fora de horário, inspeção de idade no handover ou recusa de álcool. Há `HLY_CLIENT_ADDRESS_HOTEL_V1.png` (Drive ID `13nAtlQgAQA60DKbQ_tDkTDht2r_LeHaW`), que não comprova fluxo de inspeção.

**Limite de evidência:** não foi realizada nesta rodada inspeção pixel a pixel de todos os 96 binários. Portanto, ausência de tela dedicada no inventário é confirmada; ausência absoluta de qualquer referência visual dentro das 96 imagens não é certificada. A apresentação C-005 no código já existe, como indicado na seção 2. Não confundir inventário de PNGs com cobertura de estados implementados.

| Superfície necessária | Requisito funcional a especificar, sem desenhar tela |
|---|---|
| Loja aberta / álcool indisponível | Loja continua OPEN; aviso explica prazo; restrição apenas dos itens alcoólicos; acesso a itens sem álcool e carrinho; não usar STORE_CLOSED |
| Carrinho/checkout | Indicar itens impedidos, revalidar no avanço e no submit, impedir checkout de composição inelegível; remoção/alternativa depende de ação explícita |
| Courier/admin: inspeção | Adulto presente, inspeção visual, seleção de resultado e confirmação; mostrar prazo e PIN separadamente, sem upload de documento; ator restrito |
| Courier/admin: recusa | Motivos estruturados, itens não entregues, destino/retorno e próximo passo; sem botão de ignorar idade/prazo |
| Cliente: entrega recusada | Informar estado, suporte e resolução financeira real, sem prometer reembolso concluído antes da confirmação |
| Hotel | Encontro presencial e documento necessário; instruções de ponto de encontro; falta do adulto como impedimento, sem recepção como fallback automático |

Estados de carregamento, conflito por expiração, falha de rede, permissão negada e atualização concorrente precisam de cobertura acessível. Erro não pode ser comunicado somente por cor. O gate define necessidades, não cria telas ou microcopy final.

### 9.1 Impacto sobre os sete selecionados

As escolhas permanecem válidas como seleção; nenhuma variante é aprovada, revogada ou redesenhada aqui. O registro atual mantém sete `SELECTED_PENDING_ASSET_ACCEPTANCE`, zero APPROVED. Persistem os gaps C3/C5/C6 e os demais registrados no v5.5; este gate acrescenta requisitos ao critério de comportamento C4.

| Família / Drive ID | Impacto requerido para aceite futuro |
|---|---|
| CART / `1lsB2IMEw1f2g86eKIPwhm2T0T7hzfraU` | Alto: cutoff, itens alcoólicos, recomposição explícita e mínimo €25 após alteração; não presumir preços/cupons do PNG como contrato |
| STORE_CLOSED / `1P38eQJMovKndd-YubSTwIkEWUHxEhVxo` | Preservar 10:00–22:00; não usar este estado enquanto loja está aberta e apenas álcool indisponível; notificação de abertura não promete elegibilidade de álcool |
| SUPPORT / `1OwuRJxhG2ODd1mi2EUiqUuQkCU5iKix7` | Suporte deve orientar recusa/retorno/estorno sem recolher cópia de documento nem desbloquear regra de idade remotamente |
| SAVED_ADDRESSES / `1J1X7gSWqwZBX-g0kEO9SgYTBevLLNMH6` | Endereço/ETA de hotel não autoriza depósito; encontro presencial e janela precisam constar no fluxo futuro; manter raio canônico de 4 km |
| OUT_OF_STOCK / `16ZlJM9i9jHkWV8CT4YsKLO5fpfwJPb0u` | Similar/substituição pode mudar containsAlcohol; recomputar prazo e idade antes de confirmar; não sugerir substituição inelegível como disponível para compra |
| ORDER_IN_TRANSIT / `1zBUIAP0s_8W3acWptUsJqVmAVdgDUv6O` | Alto: timeline deve distinguir chegada/inspeção/PIN/entrega e recusa; ETA não pode prometer álcool após deadline; rastreamento ao vivo continua fora do MVP |
| PHONE_LOGIN_EMPTY / `1RodSJwcZPzcxeyff1C3B544EQOCdMw9e` | Catálogo continua público e Ahora no preservado; autenticar na compra não comprova idade; este gate não autoriza barreira nova de login no catálogo |

Os seis PNGs DS e nove boards continuam REFERENCE_ONLY / VISUAL_INTENT. A promoção de tokens em PR #32 não aprova automaticamente assets nem implementa estas regras.

## 10. Critérios de validação do futuro gate de implementação

Plano apenas; nenhum teste de implementação deste domínio foi executado nesta tarefa.

1. Cobrir as oito combinações booleanas de prazo/idade/PIN: somente todas verdadeiras permitem handover de álcool; incluir dados ausentes, ator incorreto e revisão concorrente.
2. Limites antes/no/depois de cutoff, 22:00, 08:00 e abertura às 10:00; SLA desconhecido; atraso após aceite; data local/DST Europe/Madrid; nenhum ETA truncado ou relógio do cliente como autoridade.
3. Sem álcool, com álcool, packs e substituições nos dois sentidos; pedido misto recusado integralmente por falha de verificação, estorno automático inclusive frete e saldo de captura parcial.
4. Cada recusa etária e logística; terceiro e segunda tentativa no mesmo pedido são recusados; novo pedido não herda provas; PIN certo com idade pendente continua bloqueado, idade válida com PIN errado idem.
5. Hotel com adulto presente e ausência/recepção/remoto; nenhum bypass por nota de endereço, código de quarto ou PIN compartilhado.
6. Idempotência/concorrência entre entregar/recusar/cancelar; consumo de PIN, reserva, retorno e reembolso exatamente uma vez; falha do processador não produz estado financeiro fictício.
7. Contrato e persistência recusam dados de documento indevidos; logs/analytics não os capturam; autorização por papel e minimização da resposta pública.
8. Regressões de catálogo, localização, reserva, autenticação e UI afetada; suíte completa no SHA futuro, sem trocar baselines para esconder mudança de comportamento.

## 11. Decisões incorporadas e plano para autorização

| Decisão do proprietário | Estado documental |
|---|---|
| D1 — SLA 45 minutos / cutoff 21:15 | Incorporada; prazo efetivo de entrega anterior a 22:00; guardas em aceite/preparo/despacho |
| D2 — Integral automático, custo zero por falha de verificação | Incorporada; cancelamento de autorização versus estorno de captura separados |
| D3 — Sem nova tentativa/terceiro/recepção | Incorporada; somente novo pedido, sem herdar prova anterior |
| D4 — DNI/NIE/passaporte, inspeção visual | Incorporada; NIE isolado não comprova idade; nenhuma captura de documento |
| D5 — Mesmo prazo do dossiê do pedido/fiscal | Incorporada; referência mercantil seis anos desde último lançamento, não teto absoluto; necessidade e exceções documentadas |
| D6 — Única operação atômica | Incorporada; três condições conferidas juntas, nenhum sucesso parcial libera entrega |

Plano sequenciado, futuras issues e critérios de aceite em [ALCOHOL_COMPLIANCE_IMPLEMENTATION_PLAN.md](./ALCOHOL_COMPLIANCE_IMPLEMENTATION_PLAN.md). Nenhuma dessas futuras issues/branches de implementação foi criada. Autorização de código, contratos e UI continua pendente; C-003/C-004 não iniciadas. PR #32 e registro de assets permanecem fora das alterações deste gate.
