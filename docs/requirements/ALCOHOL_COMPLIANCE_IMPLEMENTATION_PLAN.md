# Plano de implementação — compliance de álcool

Data: 2026-09-07. Issue #33 / PR #34. **PLANO DE SEIS FASES AUTORIZADO; RELATÓRIO DE IMPACTO ANTES DA PRIMEIRA BRANCH; NENHUMA IMPLEMENTAÇÃO INICIADA.**
Base inspecionada: main `4d32cebcc7f68832940f6825177d5348d63f245a`; especificação anterior no HEAD `7dea7b4c52b366215cf56087306ba9a692bae474`.
Requisitos: [especificação consolidada](./ALCOHOL_COMPLIANCE_DOMAIN_REQUIREMENTS.md). As decisões D1–D6 estão incorporadas. Os identificadores P1–P6 abaixo são propostas de futuras issues, não números GitHub existentes.

## Investigação dirigida de C-005 alcohol-cutoff

| Evidência | Cobertura atual | Gap para o domínio decidido |
|---|---|---|
| `packages/ui/src/screens/home/home.types.ts` | `alcohol-cutoff` integra HOME_STATES; coerce aceita o nome | Não calcula hora nem elegibilidade |
| `HomeScreen.tsx`, notices | Badge informativo: “Alcohol no disponible: la entrega debe finalizar antes de las 22:00” | Não mostra cutoff dinâmico nem recebe motivo temporal versionado do servidor |
| `HomeScreen.tsx`, blocked | Bloqueio genérico somente closed/out-of-area | Alcohol-cutoff sozinho não desabilita adição de álcool; produto pode estar indisponível por estoque, mas isso é outra regra |
| Render de ProductCard/PackCard | Recebe containsAlcohol/minimumAge para rótulo e disponibilidade comercial para unavailable | Falta elegibilidade específica de álcool em produtos/packs; componentes devem distinguir abrir detalhes de adicionar |
| Callbacks onAdd | Emitem eventos `add-product`/`add-pack` | Não há checkout ou guarda de domínio implementados por esses eventos |
| HomeCatalogRuntime.tsx | Snapshot de catálogo, filtros, loading/error; renderiza HomeScreen sem prop state temporal, que assume ready | Falta estado operacional/álcool independente, leitura do servidor, atualização por expiração/retorno à aba/reconexão e tratamento de indisponibilidade |
| HomeScreen.stories.tsx, AlcoholCutoff | Story isolada com fixture histórica | Não representa cenário temporal de API real |
| `tests/integration/home-presentation.fixtures.ts` | Abre story via iframe Storybook | Não usa `/?state=...` como rota pública; não reintroduzir mecanismo obsoleto |
| `tests/unit/home.unit.test.tsx` | Enum e fallback | Não testa SLA, relógio, deadline, idade ou PIN |
| `tests/functional/home.functional.spec.ts` | Verifica aviso/estado e console na apresentação; runtime real cobre catálogo READY/EMPTY/ERROR/loading | Não verifica impedir compra de álcool, manter compra não alcoólica ou comando de entrega |
| `tests/visual/home.visual.spec.ts` | Snapshot de cada estado em namespace C-005-PRESENTATION-CATALOG-V1; fontes prontas e animação desativada | Baseline visual não comprova regra temporal nem transação de entrega |

A apresentação atual cobre a distinção visual básica entre loja fechada e restrição de álcool. Não cobre a decisão temporal executável, o checkout ou a logística. O aviso fica no ramo de conteúdo do catálogo; loading/error usam outros ramos. A integração deverá definir precedência e persistência da informação operacional sem esconder um bloqueio crítico durante atualização/erro.

A apresentação `high-demand` inclui **45–60 min**. Sob a correção aprovada, isso é compatível com álcool quando a janela comporta 60 minutos: cutoff calculado 21:00. High-demand não é bloqueio automático o dia inteiro. A faixa deve vir do domínio real; os valores atuais do story não são entrada confiável para cálculo de negócio. O aviso alcohol-cutoff, que fala em entrega antes de 22:00, continua correto; se a UI passar a mostrar o horário limite de PEDIDO, deve usar o cutoff dinâmico server-side, não texto fixo 21:15. Nenhum texto/baseline alterado aqui.

### Comportamento futuro esperado

- Modelo separado de `catalogState`, estado da loja e elegibilidade de álcool: loja OPEN pode coexistir com álcool bloqueado, loading ou demanda alta. Não substituir arquitetura HomeCatalogRuntime por query param de demonstração.
- Consumir decisão server-side com cutoff dinâmico, SLA efetivo MAX(45, máximo real vigente), deadline 22:00, motivo, versão/validade. Relógio do navegador pode antecipar atualização visual, nunca autorizar compra.
- Em álcool indisponível, manter busca, categorias e detalhes públicos; impedir adição/checkout de álcool por motivo específico, sem bloquear indiscriminadamente todo o catálogo.
- Revalidar na API em toda mutação/submit, inclusive janela cruzada com aba aberta e requests concorrentes; UI não é fronteira de segurança.
- Não mapear falha de idade de entrega para STORE_CLOSED ou OUT_OF_STOCK. Recusa, reembolso e handover pertencem a fluxos distintos, ainda não implementados.
- Definir anúncio acessível da mudança de disponibilidade, foco e ações de recuperação; não presumir que o badge atual anuncia automaticamente uma mudança dinâmica.
- Preservar baselines históricas. Alteração futura de aparência deve ter expectativa documentada e revisão explícita, sem regeneração cega.

## Sequência proposta de issues e dependências

| Ordem / futura issue | Escopo limitado | Contrato / persistência | Critério para avançar |
|---|---|---|---|
| P1 — ALCOHOL_DOMAIN_CONTRACT_ALIGNMENT | Traduzir decisões em contrato versionado, estados de erro, aceite/preparo/despacho, regra temporal **dinâmica MAX(45, limite superior real vigente)** e comando final único; documentação de NIE e retenção | Nova versão/profiling de OpenAPI, sem reescrever V1_0/V1_2 congelados; mapear comandos históricos e autorização courier/admin | Diff contratual aprovado; todos D1–D6 rastreáveis; nenhuma rota parcial completa entrega |
| P2 — ORDER_DELIVERY_COMPLIANCE_FOUNDATION | Use cases de relógio/SLA e agregação de álcool, fundação de pedido/entrega/tentativa terminal e restrições de ator | Migrations aditivas após o número disponível: pedidos/itens/revisão, entrega/estado, prazo/SLA e vínculo de retenção; não transformar order_simulation em produção por suposição | Testes de invariantes, reservas e transições; dados antigos não recebem idade fictícia |
| P3 — ATOMIC_HANDOVER_AND_TERMINAL_REFUSAL | Operação única com prazo + inspeção 18+ + PIN; recusa terminal; vedação de terceiro/segunda tentativa | Adaptador transacional com revisão/locks e idempotência; registro mínimo; consumo de PIN junto da conclusão; auth courier/admin explícita | Oito combinações das três condições e corridas: só todas válidas concluem; zero entrega parcial ou retry físico |
| P4 — AUTOMATIC_FULL_REFUND_AND_RECORD_LIFECYCLE | Compensação integral automática, void/capture/refund, retorno/estoque e conservação herdada | Outbox/eventos financeiros, idempotência de processador, reconciliação; política contábil do pedido/arquivo restrito/eliminação | Falha de verificação nunca custa ao cliente; estorno não duplica; retorno não repõe estoque antes da inspeção; teste de retenção |
| P5 — C005_ALCOHOL_AVAILABILITY_INTEGRATION | Integrar estado existente ao runtime/API; ações por item e atualização temporal; especificar consumidores futuros de checkout/courier | Consumir contrato P1 com aplicação P2–P4; sem nova regra local independente | C-005 usa estado real, distingue não álcool e não reintroduz rota de demonstração; QA funcional/visual/a11y aprovado |
| P6 — ALCOHOL_COMPLIANCE_END_TO_END_CERTIFICATION | Certificar cadeia completa com pagamento simulado/controlado, hotel, recusa, retorno, sessão e política temporal | Nenhuma expansão funcional sem nova decisão; evidências por SHA | Suíte completa verde, regressões e cenários de domínio, revisão do proprietário; produção continua bloqueada |

Dependência principal: P1 → P2 → P3 → P4 → P5 → P6. P5 só pode liberar ações reais se a guarda server-side e resolução de falhas já existirem; uma preview de apresentação não implica checkout autorizado. Cada issue segue Issue → branch → implementação → testes → PR → revisão → merge separado.

**As camadas reais de pedido/pagamento/admin ainda não existem no MVP implementado.** P2–P4 estão incluídas na autorização das seis fases, sem presumir que endpoints históricos estejam operacionais. Integração de processador real, credenciais e produção não está autorizada pelo plano. Usar portas/adaptadores controlados para validação, preservando arquitetura application/persistence e sessão opaca de cliente.

## Testes e evidências exigidos na implementação futura

- D1: SLA45 → 21:15; high-demand60 → 21:00; estimativa menor que45 mantém piso45; maior que60 não é truncada. Limites 20:59:59/21:00 e 21:14:59/21:15; mudança de estimativa entre quote/submit, expiração, reconfirmação, snapshot por pedido, demanda crescente/decrescente e pedidos já aceitos; 21:59:59 versus 22:00; Europe/Madrid/DST, SLA ponta a ponta, atraso em preparo/despacho, relógio desconhecido e operação 10:00–22:00. Aceite/preparo/despacho depois do prazo ou sem ETA viável falham no servidor.
- D2: autorização não capturada, captura total/parcial, estorno já iniciado, timeout/webhook repetido e falha do processador; pedido misto recusado integralmente, sem frete/multa ao cliente.
- D3: sem documento, menor, dúvida, adulto ausente, terceiro e recepção; recusa não reabre; novo pedido tem avaliação independente. Reenvio idempotente de rede não gera nova tentativa física.
- D4/D5: inspeção visual e dados mínimos; inexistência de foto/número/DOB em schema, logs e eventos; foto e nascimento visíveis sem retenção; NIE isolado → REFUSED_DOUBTFUL_ID; retenção herdada sem TTL autônomo, arquivo restrito e descarte coordenado.
- D6: guardas simultâneas e rollback de sucesso parcial; concorrência de recusa/entrega/cancelamento, ator indevido e PIN antigo; nenhuma prova parcial gravada autoriza handover.
- C-005: mock de resposta operacional real, expiração com página aberta/reconexão, cenário high-demand com cutoff antecipado e coexistência dos avisos de demanda/elegibilidade e continuidade de catálogo sem álcool; testes de integração e apresentação separados.
- Rodar toda a suíte no SHA final de cada gate exigido, além de testes específicos. Não atribuir os 835 testes históricos a regras novas nem atualizar snapshots sem causa/revisão.

## Limites de autorização

Plano de seis fases autorizado pelo proprietário, ainda não executado: primeiro apresentar relatório de impacto em C-005 e nos sete assets, antes de abrir branch de implementação. Nenhuma issue P1–P6 criada; permanecem Issue #33 e PR #34 documentais. Sem C-003/C-004, componentes de campo, telas de courier/checkout, mudanças de token, promoção de assets, alterações de contratos/migrations/código nesta rodada documental ou merge sem aprovação própria. Os sete assets selecionados mantêm status; sua futura conformidade inclui estas regras.

## Relatório de impacto pré-implementação — cutoff dinâmico

Análise de comportamento baseada na matriz individual dos sete assets do PR #32 (`docs/design-system/SELECTED_ASSET_ACCEPTANCE_1_2_0.md`, commit 27bb14c47e3513143c1b103655334da1bedab119), nos requisitos atuais e no código C-005 da main certificada. Não representa reinspeção pixel a pixel dos PNGs, nem nova aprovação visual. Não se afirma que algum PNG exiba 21:15 sem evidência. As escolhas permanecem; futuras revisões visuais devem criar candidato/evidência sem sobrescrever binários.

| Asset selecionado | Impacto incremental de cutoff dinâmico | Efeito na seleção |
|---|---|---|
| CART / A / 1lsB2IMEw1f2g86eKIPwhm2T0T7hzfraU | Alto: mostrar elegibilidade e eventual cutoff real; revalidar mudança45→60 entre abertura/quote/submit e bloquear álcool às21:00 nesse exemplo. Checkout não confia no horário renderizado antes | Escolha mantida; comportamento/QA devem cobrir atualização sem remoção silenciosa de itens |
| ORDER_IN_TRANSIT / A / 1zBUIAP0s_8W3acWptUsJqVmAVdgDUv6O | Alto: ETA usa promessa/snapshot do pedido e tempo restante real; não trocar por SLA45 global nem cancelar retroativamente só pelo novo cutoff. Deadline22:00 e controles de despacho/entrega permanecem | Timeline e suporte mantidos; sem rastreamento ao vivo |
| SAVED_ADDRESSES / A / 1J1X7gSWqwZBX-g0kEO9SgYTBevLLNMH6 | Médio: ETA associado ao endereço deve ser atualizado/recalculado no novo pedido, não armazenado como atributo estático de endereço; manter raio4km e encontro presencial | Escolha mantida; revisar estados de ETA e validade |
| OUT_OF_STOCK / C / 16ZlJM9i9jHkWV8CT4YsKLO5fpfwJPb0u | Médio: similares/packs alcoólicos só podem ser comprados com elegibilidade vigente; reavaliar conteúdo e SLA antes de confirmar substituição | Escolha mantida; pendências prévias de dados/proveniência continuam |
| STORE_CLOSED / A / 1P38eQJMovKndd-YubSTwIkEWUHxEhVxo | Sem alteração do horário10:00–22:00: cutoff21:00/21:15 não fecha loja. Notificação de abertura não garante álcool elegível depois | Escolha mantida, não usar esta tela para restrição exclusiva de álcool |
| SUPPORT / A / 1OwuRJxhG2ODd1mi2EUiqUuQkCU5iKix7 | Conteúdo operacional deve explicar cutoff variável e distinguir prazo do pedido/de entrega; não anunciar21:15 como universal | Canais/horários escolhidos mantidos; conferir futura copy |
| PHONE_LOGIN_EMPTY / A / 1RodSJwcZPzcxeyff1C3B544EQOCdMw9e | Sem impacto direto no layout/fluxo; ao avançar para compra consumir decisão corrente, sem congelar quote durante autenticação | Ahora no e catálogo público mantidos; OTP não verifica maioridade |

C-005: manter o significado do aviso existente; integrar decisão dinâmica e, se houver exibição do cutoff de compra, renderizá-lo a partir da resposta server-side. HomeState atual é uma união de valores exclusivos (`high-demand` OU `alcohol-cutoff`), mas o domínio exige dimensões independentes para ambos coexistirem; não pode ocultar indisponibilidade de álcool ao mostrar demanda alta. HomeCatalogRuntime não fornece essas dimensões hoje. Adição/bloqueio por item e prazo devem vir do mesmo contrato usado no checkout e ser revalidados no servidor.

Fase P1 deve especificar `standardSlaMinutes`, limite superior real, `effectiveSlaMinutes`, `calculatedAt`, `validUntil`, versão/origem da estimativa, cutoff derivado, deadline e semântica de reconfirmação/idempotência. P2 persiste snapshot e revisão do pedido, não configuração global fixa21:15; P5 implementa apresentação/atualização e coexistência dos estados. Nomes finais serão definidos no contrato versionado. Esta atualização não cria branch de implementação; conclui o relatório prévio solicitado. A autorização das seis fases permanece registrada, sem exigir sua repetição.
