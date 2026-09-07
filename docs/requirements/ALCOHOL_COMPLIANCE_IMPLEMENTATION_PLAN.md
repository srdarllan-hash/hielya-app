# Plano de implementação — compliance de álcool

Data: 2026-09-07. Issue #33 / PR #34. **PLANO PARA AUTORIZAÇÃO; NENHUMA IMPLEMENTAÇÃO INICIADA.**
Base inspecionada: main `4d32cebcc7f68832940f6825177d5348d63f245a`; especificação anterior no HEAD `7dea7b4c52b366215cf56087306ba9a692bae474`.
Requisitos: [especificação consolidada](./ALCOHOL_COMPLIANCE_DOMAIN_REQUIREMENTS.md). As decisões D1–D6 estão incorporadas. Os identificadores P1–P6 abaixo são propostas de futuras issues, não números GitHub existentes.

## Investigação dirigida de C-005 alcohol-cutoff

| Evidência | Cobertura atual | Gap para o domínio decidido |
|---|---|---|
| `packages/ui/src/screens/home/home.types.ts` | `alcohol-cutoff` integra HOME_STATES; coerce aceita o nome | Não calcula hora nem elegibilidade |
| `HomeScreen.tsx`, notices | Badge informativo: “Alcohol no disponible: la entrega debe finalizar antes de las 22:00” | Não mostra cutoff 21:15 nem recebe motivo temporal versionado do servidor |
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

Outro detalhe relevante: a apresentação `high-demand` inclui **45–60 min** em aviso/cartão. Com SLA aprovado de 45 minutos para álcool, não pode ser tomada como promessa válida de entrega alcoólica. Futuro runtime deve representar indisponibilidade de álcool quando não puder cumprir o máximo, preservando eventual estimativa aplicável a itens sem álcool. Não alterar texto/baseline nesta tarefa.

### Comportamento futuro esperado

- Modelo separado de `catalogState`, estado da loja e elegibilidade de álcool: loja OPEN pode coexistir com álcool bloqueado, loading ou demanda alta. Não substituir arquitetura HomeCatalogRuntime por query param de demonstração.
- Consumir decisão server-side com cutoff 21:15, deadline 22:00, motivo, versão/validade. Relógio do navegador pode antecipar atualização visual, nunca autorizar compra.
- Em álcool indisponível, manter busca, categorias e detalhes públicos; impedir adição/checkout de álcool por motivo específico, sem bloquear indiscriminadamente todo o catálogo.
- Revalidar na API em toda mutação/submit, inclusive janela cruzada com aba aberta e requests concorrentes; UI não é fronteira de segurança.
- Não mapear falha de idade de entrega para STORE_CLOSED ou OUT_OF_STOCK. Recusa, reembolso e handover pertencem a fluxos distintos, ainda não implementados.
- Definir anúncio acessível da mudança de disponibilidade, foco e ações de recuperação; não presumir que o badge atual anuncia automaticamente uma mudança dinâmica.
- Preservar baselines históricas. Alteração futura de aparência deve ter expectativa documentada e revisão explícita, sem regeneração cega.

## Sequência proposta de issues e dependências

| Ordem / futura issue | Escopo limitado | Contrato / persistência | Critério para avançar |
|---|---|---|---|
| P1 — ALCOHOL_DOMAIN_CONTRACT_ALIGNMENT | Traduzir decisões em contrato versionado, estados de erro, aceite/preparo/despacho, regra temporal e comando final único; documentação de NIE e retenção | Nova versão/profiling de OpenAPI, sem reescrever V1_0/V1_2 congelados; mapear comandos históricos e autorização courier/admin | Diff contratual aprovado; todos D1–D6 rastreáveis; nenhuma rota parcial completa entrega |
| P2 — ORDER_DELIVERY_COMPLIANCE_FOUNDATION | Use cases de relógio/SLA e agregação de álcool, fundação de pedido/entrega/tentativa terminal e restrições de ator | Migrations aditivas após o número disponível: pedidos/itens/revisão, entrega/estado, prazo/SLA e vínculo de retenção; não transformar order_simulation em produção por suposição | Testes de invariantes, reservas e transições; dados antigos não recebem idade fictícia |
| P3 — ATOMIC_HANDOVER_AND_TERMINAL_REFUSAL | Operação única com prazo + inspeção 18+ + PIN; recusa terminal; vedação de terceiro/segunda tentativa | Adaptador transacional com revisão/locks e idempotência; registro mínimo; consumo de PIN junto da conclusão; auth courier/admin explícita | Oito combinações das três condições e corridas: só todas válidas concluem; zero entrega parcial ou retry físico |
| P4 — AUTOMATIC_FULL_REFUND_AND_RECORD_LIFECYCLE | Compensação integral automática, void/capture/refund, retorno/estoque e conservação herdada | Outbox/eventos financeiros, idempotência de processador, reconciliação; política contábil do pedido/arquivo restrito/eliminação | Falha de verificação nunca custa ao cliente; estorno não duplica; retorno não repõe estoque antes da inspeção; teste de retenção |
| P5 — C005_ALCOHOL_AVAILABILITY_INTEGRATION | Integrar estado existente ao runtime/API; ações por item e atualização temporal; especificar consumidores futuros de checkout/courier | Consumir contrato P1 com aplicação P2–P4; sem nova regra local independente | C-005 usa estado real, distingue não álcool e não reintroduz rota de demonstração; QA funcional/visual/a11y aprovado |
| P6 — ALCOHOL_COMPLIANCE_END_TO_END_CERTIFICATION | Certificar cadeia completa com pagamento simulado/controlado, hotel, recusa, retorno, sessão e política temporal | Nenhuma expansão funcional sem nova decisão; evidências por SHA | Suíte completa verde, regressões e cenários de domínio, revisão do proprietário; produção continua bloqueada |

Dependência principal: P1 → P2 → P3 → P4 → P5 → P6. P5 só pode liberar ações reais se a guarda server-side e resolução de falhas já existirem; uma preview de apresentação não implica checkout autorizado. Cada issue segue Issue → branch → implementação → testes → PR → revisão → merge separado.

**As camadas reais de pedido/pagamento/admin ainda não existem no MVP implementado.** P2–P4 exigem autorização explícita dessa fundação, sem presumir que endpoints históricos estejam operacionais. Integração de processador real, credenciais e produção não está autorizada pelo plano. Usar portas/adaptadores controlados para validação, preservando arquitetura application/persistence e sessão opaca de cliente.

## Testes e evidências exigidos na implementação futura

- D1: 21:14:59 versus 21:15; 21:59:59 versus 22:00; Europe/Madrid/DST, SLA ponta a ponta, atraso em preparo/despacho, relógio desconhecido e operação 10:00–22:00. Aceite/preparo/despacho depois do prazo ou sem ETA viável falham no servidor.
- D2: autorização não capturada, captura total/parcial, estorno já iniciado, timeout/webhook repetido e falha do processador; pedido misto recusado integralmente, sem frete/multa ao cliente.
- D3: sem documento, menor, dúvida, adulto ausente, terceiro e recepção; recusa não reabre; novo pedido tem avaliação independente. Reenvio idempotente de rede não gera nova tentativa física.
- D4/D5: inspeção visual e dados mínimos; inexistência de foto/número/DOB em schema, logs e eventos; NIE isolado insuficiente; retenção herdada sem TTL autônomo, arquivo restrito e descarte coordenado.
- D6: guardas simultâneas e rollback de sucesso parcial; concorrência de recusa/entrega/cancelamento, ator indevido e PIN antigo; nenhuma prova parcial gravada autoriza handover.
- C-005: mock de resposta operacional real, expiração com página aberta/reconexão, cenário high-demand incompatível com SLA e continuidade de catálogo sem álcool; testes de integração e apresentação separados.
- Rodar toda a suíte no SHA final de cada gate exigido, além de testes específicos. Não atribuir os 835 testes históricos a regras novas nem atualizar snapshots sem causa/revisão.

## Limites de autorização

Plano apresentado para decisão, não executado. Nenhuma issue P1–P6 criada; permanecem Issue #33 e PR #34 documentais. Sem C-003/C-004, componentes de campo, telas de courier/checkout, mudanças de token, promoção de assets, alterações de contratos/migrations/código ou merge. Os sete assets selecionados mantêm status; sua futura conformidade inclui estas regras.
