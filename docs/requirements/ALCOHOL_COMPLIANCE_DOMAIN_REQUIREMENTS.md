# ALCOHOL_COMPLIANCE_DOMAIN_REQUIREMENTS

Data: 2026-09-07. Issue [#33](https://github.com/srdarllan-hash/hielya-app/issues/33).
Status: **SPECIFICATION_PROPOSED / OWNER_REVIEW_REQUIRED / NOT_IMPLEMENTED**.
Base verificada: main `4d32cebcc7f68832940f6825177d5348d63f245a`.

Este documento especifica requisitos para revisão. Não modifica nem substitui OpenAPI, migrations, contratos certificados ou decisões comerciais. Os requisitos expressamente solicitados pelo proprietário estão separados das opções que ainda exigem decisão. A aprovação deste documento não ativa venda de álcool, produção ou implementação de telas.

## 1. Fundamento e limites da análise

O art. 3 do [Decreto 167/2002, BOJA](https://www.juntadeandalucia.es/boja/2002/67/4) estabelece a restrição geral de 22:00–08:00 para venda, fornecimento e distribuição nos canais descritos, incluindo venda a distância. Portanto, verificar a entrega efetiva é necessário para esta especificação, mas não elimina controles sobre os atos anteriores. O decreto admite exceções municipais delimitadas; nenhuma exceção será presumida ou habilitada neste MVP. A fórmula baseada em SLA abaixo é uma regra de engenharia solicitada pelo proprietário, não uma fórmula textual da norma.

O [art. 26 da Lei 4/1997, texto consolidado do BOE](https://www.boe.es/buscar/act.php?id=BOE-A-1997-18301#a2-8) proíbe venda/fornecimento a menores de 18 anos e contém uma exceção de uso profissional para maiores de 16. O requisito HIELYA desta rodada é estritamente **18+**, sem implementar essa exceção. Não se apresenta a regra do produto como transcrição integral da lei.

A [orientação da AEPD sobre verificação de idade](https://www.aepd.es/preguntas-frecuentes/10-menores-y-educacion/1-sistemas-de-verificacion-edad) distingue comprovar um limiar etário de conhecer identidade/idade exata. Seu contexto é a verificação online; não constitui um procedimento oficial específico para entregadores. A aplicação presencial e o conjunto mínimo de registros abaixo são requisitos deste gate, compatíveis com essa direção de minimização. A política jurídica de retenção/base legal ainda deve ser aprovada antes da implementação operacional.

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

Requisito solicitado: `alcoholOrderCutoff = 22:00 - maximumPromisedDeliverySla`.

- Usar a data local do serviço e a zona IANA `Europe/Madrid`; armazenar instantes UTC e expor timestamps com offset. Não fixar UTC+1/UTC+2.
- `alcoholHandoverDeadlineAt` é 22:00 dessa data. O SLA máximo deve cobrir todo o percurso entre autorização de compra e entrega: fila, aceite, preparação, deslocamento, encontro no hotel, inspeção de idade e PIN. Um ETA apenas de viagem não atende ao requisito.
- Na criação: permitir álcool somente com loja operacionalmente aberta, dados confiáveis, `serverNow < alcoholOrderCutoffAt` e `promisedLatestHandoverAt < alcoholHandoverDeadlineAt`.
- A operação continua 10:00–22:00. O limite legal inferior de 08:00 não autoriza abrir às 08:00. Não criar pedidos noturnos de álcool para entrega futura nesta especificação.
- Exatamente 22:00 é proibido. Exatamente no cutoff calculado também é recusado nesta proposta conservadora, pois a promessa máxima atingiria 22:00. SLA de 45 minutos implica cutoff 21:15; às 21:15 não aceitar uma promessa de entrega até 22:00.
- O SLA numérico e eventual margem operacional adicional **ainda precisam de decisão**. Não deduzir SLA do raio de 4 km, de PNG ou da taxa de entrega. Se houver margem, incluí-la no máximo prometido ou explicitá-la na fórmula, sem dupla contagem.
- Em aceite/replanejamento, recalcular o tempo máximo restante, sem somar novamente etapas concluídas. Conservar o prazo original auditável; não truncar o ETA para parecer elegível, nem ampliar o deadline para o dia seguinte.
- Revalidar em checkout, criação atômica do pedido, aceite, alteração/substituição de itens, confirmação de preparo, saída, chegada e imediatamente antes do handover. Um pedido aceito cedo não recebe exceção se atrasar.
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

A verificação deve ocorrer na mesma tentativa e com a mesma pessoa presente no handover. Troca de destinatário, reatribuição de entregador, nova tentativa ou alteração relevante de itens invalida o reaproveitamento das provas anteriores. Não transformar uma verificação de um pedido em atributo permanente “adulto verificado” da conta.

Transação final deve conferir revisão/estado/prazo/idade/PIN e concluir uma única vez, com idempotência, sem corrida entre expiração, recusa e entrega. Falhar antes de transferir fisicamente o álcool. Nunca registrar DELIVERED quando houve recusa ou apenas confirmação do PIN. O software controla autorização/registro; a correspondência com a entrega física depende também do procedimento do entregador, não apenas do timestamp do servidor.

### 4.2 Transições de idade

PENDING → um dos quatro resultados terminais da tentativa. Recusa não é sobrescrita por VERIFIED na mesma tentativa. Nova tentativa autorizada cria novo registro PENDING, preservando a anterior. Corrigir um lançamento incorreto requer evento auditável, sem apagar histórico e sem liberação retrospectiva de handover.

`REFUSED_NO_ID`: documento não apresentado. `REFUSED_MINOR`: documento demonstra idade inferior a 18. `REFUSED_DOUBTFUL_ID`: autenticidade, legibilidade ou correspondência não permite confirmar maioridade do destinatário. Ausência do destinatário, endereço inacessível, prazo excedido e PIN incorreto são motivos logísticos próprios; não inventar uma recusa etária nesses casos.

## 5. Minimização e hotel

O registro específico da inspeção conterá apenas **resultado, método, timestamp e courierId**, associado às chaves da tentativa. Não criar campos, anexos, logs ou analytics para fotografia de documento, número, cópia digital, data de nascimento completa, idade exata, selfie, biometria ou transcrição livre do documento. Inspeção visual presencial não significa capturar uma imagem. Não usar notas livres de recusa para contornar a minimização.

Restringir leitura a entregador atribuído e suporte/admin com necessidade operacional; o cliente recebe estado/motivo adequado, não dados internos de outros atores. Não exportar esses registros para marketing/perfilamento. Retenção, descarte, acesso auditado e fundamento do tratamento precisam de definição jurídica/operacional antes da implementação; este gate não inventa prazo de conservação ou escolhe consentimento como fundamento.

Para hotel, a entrega de álcool exige encontro entre entregador e comprador/destinatário adulto presencialmente identificado como destinatário do pedido. Lobby/recepção pode ser **ponto de encontro**, não depósito. Proibidos deixar na porta/quarto sem acompanhamento, com recepcionista para hóspede desconhecido, ou concluir com PIN repassado remotamente sem inspeção presencial do adulto que recebe. Uma autorização do hotel não dispensa idade, prazo e PIN.

Se o adulto não comparecer, registrar impedimento logístico; não marcar idade verificada. Se comparecer mas falhar a inspeção, registrar o resultado etário apropriado. A designação de outro adulto e o prazo máximo de espera precisam de política explícita; recepção não se torna destinatário automaticamente. Mesmo uma nova designação exige nova verificação e janela válida. Não coletar cópia de documento do hóspede nem presumir acesso ao cadastro do hotel.

## 6. Recusa, pedido, estoque e dinheiro — decisões abertas

Invariantes já solicitadas: **não entregar álcool recusado; não marcar DELIVERED; preservar evidência mínima; não burlar prazo/idade/PIN**. As alternativas comerciais abaixo não foram escolhidas.

| Situação | Opções para decisão do proprietário | Consequências a especificar antes de implementar |
|---|---|---|
| Pedido só de álcool recusado | Cancelamento/retorno; nova tentativa limitada somente quando admissível | Política de valores, espera, despesas e prazo de resolução |
| Pedido misto | Recusar pedido inteiro; ou entregar apenas itens sem álcool mediante concordância explícita e recomposição contratual | Recalcular subtotal, descontos, mínimo €25, frete e impostos; não aplicar cobrança extra ou remover itens silenciosamente |
| Falta de documento | Encerrar tentativa; ou permitir apresentação posterior em nova tentativa antes do deadline | Número/intervalo de tentativas, custo e quem autoriza; nenhuma entrega enquanto pendente |
| Menor confirmado | Recusar ao destinatário menor | Não repetir tentativa para a mesma pessoa para “passar”; eventual novo destinatário adulto depende de política separada, sem apagar recusa |
| Documento duvidoso | Recusar; suporte pode orientar procedimento, sem override remoto de maioridade | Lista de documentos aceitos/condições de inspeção e treinamento, sem reter seus dados |
| Atraso/cutoff excedido | Retorno/cancelamento; eventual entrega em outro dia exige novo agendamento e nova avaliação autorizados | Nada é transportado para o dia seguinte automaticamente por edição do deadline |
| Hotel sem encontro presencial | Aguardar dentro de limite a definir; ou falhar/retornar | Avisos, tempo máximo de espera, adulto designado e custos; sem entrega na recepção por padrão |

Separar estado logístico e financeiro: o histórico já prevê DELIVERY_FAILED, RETURNING, RETURNED e CANCELLED. A tentativa recusada registra motivo e inicia resolução; não assumir que retorno físico e reembolso terminam juntos.

- Pagamento ainda não capturado: cancelar/liberar autorização conforme processador; isso não é reembolso de captura.
- Pagamento capturado: solicitar reembolso total/parcial segundo política aprovada, idempotente e rastreável; aguardar confirmação do processador. Falha/pendência do reembolso não muda a recusa para entregue.
- Não definir automaticamente retenção de frete, multa, nova cobrança ou prazo prometido de estorno. Essas escolhas exigem revisão comercial/jurídica específica.
- Reserva não convertida: liberar de modo idempotente quando o cancelamento assim determinar. Mercadoria já expedida só retorna ao estoque vendável após recepção/inspeção; não repor automaticamente por um clique de recusa. Usar o ciclo de reservas/movimentos existente, sem dupla liberação ou dupla reposição.

## 7. Gap de OpenAPI — futura evolução, sem editar contratos

| Superfície histórica | Mudança necessária proposta |
|---|---|
| StoreState / catálogo | Diferenciar loja OPEN de elegibilidade de álcool; explicitar motivo (`CUTOFF`, `SLA_UNAVAILABLE`, etc.), cutoff, deadline e validade da informação. Informação pública não autoriza checkout |
| `/delivery/quote` | Associar promessa máxima real de handover, zona temporal, validade e versão da política; distância/preço isolados não bastam |
| `POST /orders` / CreateOrderInput | Servidor calcula containsAlcohol/requiresAgeVerification, verifica janela e snapshot/revisão. `ageDeclarationsAccepted` não vira verificação presencial |
| Aceite/preparo: `/admin/orders/{orderId}/start-picking`, `/confirm-items`, `/mark-ready` | Definir onde ocorre aceite formal; verificar viabilidade novamente em cada transição e substituição. Não criar endpoint de aceite se a transição existente atender ao contrato aprovado |
| `/admin/deliveries/{deliveryId}/start` e `/arrive` | Reavaliar prazo restante; chegada não equivale a handover |
| `/admin/deliveries/{deliveryId}/age-check` | Evoluir `AgeCheckInput` histórico APPROVED/FAILED para resultados precisos; atribuição de ator e timestamp pelo servidor; vincular tentativa, presença e revisão |
| `/admin/deliveries/{deliveryId}/verify-pin` | Histórico promete concluir entrega. Se mantido como comando final, deve validar idade/prazo/presença e consumir PIN/concluir atomicamente, preservando semântica documentada |
| `/admin/deliveries/{deliveryId}/fail` | Reutilizar para recusa; já possui UNDER_18, NO_DOCUMENT, INVALID_DOCUMENT e ALCOHOL_DEADLINE_EXCEEDED. Definir mapeamento, idempotência e estado resultante; impedir dados de documento em notes |
| `/admin/refunds` e leitura de refund | Reutilizar modelo histórico para resolução financeira; separar cancelamento de autorização e estorno de captura; limites/razões/estados definidos por política escolhida |
| Leitura de pedido/entrega | Expor estado e resolução ao cliente; detalhe de verificação restrito por papel, sem dados desnecessários |

Mapeamento legado: UNDER_18 → REFUSED_MINOR; NO_DOCUMENT → REFUSED_NO_ID; INVALID_DOCUMENT/IDENTITY_MISMATCH → REFUSED_DOUBTFUL_ID somente quando efetivamente impedem a confirmação na inspeção. APPROVED legado não pode ser migrado automaticamente para VERIFIED_18_PLUS sem evidência de método, ator e instante. OTHER/UNSAFE_RECIPIENT não provam menoridade.

**Não é necessário inventar endpoint exclusivo de recusa:** age-check e fail já existem no contrato histórico. Uma separação futura de `/verify-pin` (apenas credencial) e `/handover` (conclusão) é alternativa arquitetural, não decisão tomada: mudaria a promessa do endpoint histórico e exigiria versionamento explícito. Preferir avaliar a extensão segura da transição final existente antes de duplicar comandos.

Propor respostas de conflito de domínio com código estável para deadline, idade pendente/recusada, PIN e revisão desatualizada; distinguir 401/403 de falha comercial. A classificação exata dos HTTP status e envelopes deverá seguir o padrão da futura versão pública aprovada. Papéis de courier/admin precisam de autorização própria; possuir sessão opaca de cliente não autoriza comandos de entregador. Nunca confiar em courierId ou timestamp enviados pelo cliente.

## 8. Persistência e migrations futuras

As migrations 0001–0004 existentes permanecem intactas. Não há tabela operacional completa de pedido/entrega a simplesmente acrescentar um boolean; sua fundação deverá ser autorizada em gate próprio.

Proposta de esquema futuro: pedido e itens com snapshot de álcool/revisão; entrega e tentativas com estados/motivos; política temporal/versionamento e promessa; registro mínimo de inspeção; associação de PIN à tentativa e consumo; eventos idempotentes de recusa, retorno e resolução financeira. Chaves estrangeiras, unicidade de comandos e transições condicionais devem impedir atores/entregas cruzados e conclusão duplicada.

Checks: requiresAgeVerification coerente com conteúdo; VERIFIED exige método/ator/instante; PENDING não contém prova bem-sucedida; recusa não satisfaz handover; prazo obrigatório para álcool. Validar agregação dos itens e condições de estado na camada de aplicação/transação, não apenas em CHECK isolado. Timestamp de PIN existente não é base para backfill de idade. Dados antigos sem evidência permanecem não verificados; nunca inventar verificações históricas.

Criar migration aditiva numerada segundo o estado real na futura branch; não reservar número agora nem editar snapshots congelados. Definir rollback operacional, concorrência, reprocessamento e conservação antes da execução. Não criar tabela com documento/foto/DOB.

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
3. Sem álcool, com álcool, packs e substituições nos dois sentidos; pedido misto e preço/mínimo/reembolso conforme política aprovada.
4. Cada recusa etária e logística; novo destinatário/tentativa/courier não herda provas; PIN certo com idade pendente continua bloqueado, idade válida com PIN errado idem.
5. Hotel com adulto presente e ausência/recepção/remoto; nenhum bypass por nota de endereço, código de quarto ou PIN compartilhado.
6. Idempotência/concorrência entre entregar/recusar/cancelar; consumo de PIN, reserva, retorno e reembolso exatamente uma vez; falha do processador não produz estado financeiro fictício.
7. Contrato e persistência recusam dados de documento indevidos; logs/analytics não os capturam; autorização por papel e minimização da resposta pública.
8. Regressões de catálogo, localização, reserva, autenticação e UI afetada; suíte completa no SHA futuro, sem trocar baselines para esconder mudança de comportamento.

## 11. Decisões necessárias para fechar esta especificação

| Decisão | O que falta aprovar |
|---|---|
| D1 — SLA | Máximo ponta a ponta, eventual margem e autoridade que o calcula; confirmar fronteira estrita do cutoff |
| D2 — Recusa e valores | Pedido inteiro versus parte sem álcool; frete/descontos/mínimo e valor/devolução por motivo |
| D3 — Nova tentativa/hotel | Espera máxima, limites, destinatário adulto alternativo, reagendamento e responsabilidade por custos |
| D4 — Inspeção | Documentos aceitos, procedimento para dúvida, treinamento e regras sem override |
| D5 — Dados | Retenção, base legal e acesso/eliminação do registro mínimo |
| D6 — Interface de domínio | Confirmar extensão de age-check/fail/verify-pin ou versionamento com comando separado de handover; definir transição formal de aceite |

Próximo passo: revisão pelo proprietário dessas decisões e da especificação. Implementação exige nova autorização; não iniciar C-003/C-004 ou contratos de componentes antes dessa revisão. PR #32 permanece separado; este gate não o mergeia nem altera valores/status de tokens.
