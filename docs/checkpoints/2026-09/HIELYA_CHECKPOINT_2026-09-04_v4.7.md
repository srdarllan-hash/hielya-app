# HIELYA — CHECKPOINT OFICIAL v4.7
## ASSET_CANONICAL_STATUS_RESOLUTION_GATE · 2026-09-04 14:50 Europe/Dublin
# 1. Metadata
VERSION = 4.7
PREVIOUS_CHECKPOINT = HIELYA_CHECKPOINT_2026-09-04_v4.6
REPOSITORY = srdarllan-hash/hielya-app
MAIN_SHA = df912c101b3db5c910a8c575fb2e2e687a54f4f5
MAIN_TREE = 774f3153add86419f4aa622267e51c7a6f786f3c
CHECKPOINT_POLICY = ACTIVE
# 2. Resumo executivo
Sete escolhas visuais/produto foram registradas por decisão explícita do proprietário. Nenhum asset foi marcado APPROVED, porque a promoção exige Design System APPROVED_FROZEN e conformidade operacional. O registro canônico agora contém 96 itens: 71 candidatos, 7 selected_pending_design_system, 0 aprovados e 18 superseded.
# 3. Decisões registradas
HLY_CLIENT_CART_COUPON_APPLIED = opção A · Drive ID 1lsB2IMEw1f2g86eKIPwhm2T0T7hzfraU · mínimo €25 e bloqueio abaixo do mínimo.
HLY_STATE_STORE_CLOSED = opção A · Drive ID 1P38eQJMovKndd-YubSTwIkEWUHxEhVxo · 10:00–22:00 e “Notificarme cuando abra”.
HLY_CLIENT_SUPPORT = opção A · Drive ID 1OwuRJxhG2ODd1mi2EUiqUuQkCU5iKix7 · horário e canais compatíveis.
HLY_CLIENT_SAVED_ADDRESSES = opção A · Drive ID 1J1X7gSWqwZBX-g0kEO9SgYTBevLLNMH6 · área de entrega e ETA.
HLY_STATE_OUT_OF_STOCK = opção C · Drive ID 16ZlJM9i9jHkWV8CT4YsKLO5fpfwJPb0u · SKU específico e substituição.
HLY_CLIENT_ORDER_IN_TRANSIT = opção A · Drive ID 1zBUIAP0s_8W3acWptUsJqVmAVdgDUv6O · decisão de produto: sem rastreamento ao vivo no MVP.
HLY_CLIENT_03_PHONE_LOGIN_EMPTY = opção A · Drive ID 1RodSJwcZPzcxeyff1C3B544EQOCdMw9e · decisão de produto: catálogo público; login apenas na compra; “Ahora no” preservado.
# 4. Status e preservação
Os sete escolhidos receberam status SELECTED_PENDING_DESIGN_SYSTEM. Todas as variantes não escolhidas permanecem ou passaram a SUPERSEDED. Nenhum arquivo físico foi apagado. A opção C de OUT_OF_STOCK permanece no caminho histórico existente, mas o registro agora a identifica inequivocamente como seleção vigente; a antiga opção A foi marcada superseded.
# 5. Correção de precedência do v4.6
O checkpoint v4.6 registrou STORE_CLOSED como APPROVED antes da verificação integral do critério nº 3. O documento histórico não foi alterado. O registro canônico foi corrigido para SELECTED_PENDING_DESIGN_SYSTEM por instrução explícita posterior e mais restritiva do proprietário. Esta correção não desfaz a escolha da opção A; apenas impede uma promoção formal prematura.
# 6. Pendências operacionais preservadas
CART opção A contém WELCOME10 sem contrato certificado; sua seleção está preservada, mas APPROVED exige remoção, substituição ou formalização do cupom. OUT_OF_STOCK opção C contém preços de similares sem rastreabilidade nos contratos comerciais; APPROVED exige saneamento e nova verificação. STORE_CLOSED e SUPPORT exibem 10:00–22:00 conforme a main.
# 7. Design System Formal Approval Gate
Foi criado HIELYA_DESIGN_SYSTEM_FORMAL_APPROVAL_GATE_2026-09-04, Drive ID 17nnr7mjwnb_GxKx2hC1a_iq3LvH8WCxy_c32yQf4zzM. O pacote apresenta para decisão: cores, tipografia, botões, campos, cards, ícones, navegação, estados, logo e app icon; relaciona os seis PNGs DS, tokens, componentes React e lacunas. Nenhum item foi aprovado automaticamente.
# 8. Estado factual do Design System
HLY-DS-001 / Design System Core 1.1.0 = APPROVED AND FROZEN. HLY-DS-002 / HeroBanner e SectionHeader / Component Library 1.1.1 = APROVADO. Design Tokens 1.2.0 = CONSOLIDATION_CANDIDATE. Component Library 1.2.0 = consolidationCandidate; 1.3.0 = gate2Candidate. manifests/certifications.json ainda registra REQUIRES_EXACT_SHA_GATE. PNGs HLY_DS_01–06 = DESIGN_CANDIDATE/EVIDENCE, não autoridade editável.
# 9. Alterações desde v4.6
Google Sheets: Registro, Conflitos, Resumo e Auditoria_Operacional atualizados. Google Docs: pacote DESIGN_SYSTEM_FORMAL_APPROVAL_GATE criado e este checkpoint v4.7 criado. GitHub: nenhuma alteração. Assets físicos: nenhuma exclusão; nenhuma aprovação formal; variantes históricas preservadas.
# 10. Riscos e bloqueios
A seleção não garante conformidade com a versão candidata do Design System. A camada 1.2.0 não foi promovida. CART e OUT_OF_STOCK mantêm pendências operacionais. Não implementar componentes ou telas a partir destas seleções antes das decisões do Design System e dos Gates técnicos correspondentes.
# 11. Próximos passos
Aguardar decisão explícita do proprietário sobre a baseline e cada domínio do Design System. Depois, se autorizado, executar Gate técnico same-SHA com correções, testes, acessibilidade, responsividade, regressão visual, QA, screenshots, manifesto, relatório, hashes e atualização de manifests. Somente após isso reavaliar os sete assets para APPROVED.
# 12. Decision Log
D-4.7-01 — registrar sete escolhas sem aprovação formal.
D-4.7-02 — tratar ORDER_IN_TRANSIT sem rastreamento ao vivo como decisão de produto do MVP.
D-4.7-03 — tratar catálogo público e login na compra como decisão de produto.
D-4.7-04 — preservar fisicamente todas as variantes superseded.
D-4.7-05 — corrigir STORE_CLOSED de APPROVED para SELECTED_PENDING_DESIGN_SYSTEM sem sobrescrever v4.6.
D-4.7-06 — preparar o Design System Formal Approval Gate sem decidir pelo proprietário.
# 13. Confirmações finais
ASSETS_TOTAL = 96
CANDIDATES = 71
SELECTED_PENDING_DESIGN_SYSTEM = 7
APPROVED = 0
SUPERSEDED = 18
REPOSITORY_CHANGED = FALSE
MAIN_CHANGED = FALSE
CI_RUN = FALSE
MERGE_PERFORMED = FALSE
PHYSICAL_ASSET_DELETED = FALSE
C003_STARTED = FALSE
C004_STARTED = FALSE
NEW_SCREEN_CREATED = FALSE
DESIGN_SYSTEM_APPROVED_AUTOMATICALLY = FALSE
PREVIOUS_CHECKPOINT_OVERWRITTEN = FALSE
CHECKPOINT_STATUS = CREATED_AND_VERIFIED
