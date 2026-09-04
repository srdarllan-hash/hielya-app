# HIELYA CHECKPOINT v4.4
## ASSET_CANONICAL_STATUS_RESOLUTION_GATE

Data: set. 4, 2026
Horário de fechamento: 10:39:07 IST / 09:39:07 UTC
Checkpoint anterior: HIELYA_CHECKPOINT_2026-09-04_v4.3.md
Registro canônico: [HIELYA_ASSET_REGISTRY_2026-09-04](https://docs.google.com/spreadsheets/d/1BkaFcxeouK3B41tZ8-ECPyR2bXuBNl_R8i6r1KRGBVc/edit)

# Resumo executivo
O gate preparou as decisões de aprovação das oito famílias conflitantes, corrigiu a classificação das duplicatas e definiu um critério cumulativo de APPROVED. Nenhum asset foi aprovado em nome do responsável.

# Estado canônico validado
Repositório: srdarllan-hash/hielya-app
main: df912c101b3db5c910a8c575fb2e2e687a54f4f5
tree: 774f3153add86419f4aa622267e51c7a6f786f3c
Registro: HIELYA_ASSET_REGISTRY_2026-09-04
Total: 96
Candidatos: 78
Aprovados: 0
Superseded: 18
Famílias conflitantes: 8

# Resultado da auditoria visual
A afirmação anterior de duas duplicatas exatas não se confirmou integralmente. Apenas PHONE_LOGIN_TYPING é idêntica byte a byte. PHONE_LOGIN_EMPTY é um falso positivo: os arquivos têm mesmo nome e versão, mas diferem em ilustração, composição do campo, microcopy, hierarquia e tamanho.
Também foi confirmado que seis arquivos ativos rotulados V2 têm nome e caminho corretos, porém conteúdo visual de outra família. Esses seis arquivos são inválidos para aprovação no estado atual.

# Matriz de decisão preparada
PHONE_LOGIN_EMPTY — Opção A: ativo V1, ID 1RodSJwcZPzcxeyff1C3B544EQOCdMw9e, criado 2026-08-13 17:19:09Z, telefone em traço plano, seletor +34 separado, aviso de número espanhol e “Ahora no”. Opção B: arquivado V1, ID 1Zv09lK3sOHSKsPB8Zn_BKX9YKyPUwsTt, criado 2026-08-13 17:06:41Z, telefone 3D, campo único, login obrigatório e sem “Ahora no”. Decisão: A, B ou nenhuma.
PHONE_LOGIN_TYPING — ativo ID 1dMHw9lTGtKqE7IptRg9vIxYTQnjc0ObS e arquivado ID 1Ielpu0T-Wip66TD0ZatY8UeyZiZO1NDy são idênticos. Consolidação direta registrada: manter ativo como CANDIDATE e arquivado como SUPERSEDED; sem aprovação automática e sem exclusão física.
CART — Opção A ativa ID 1P38eQJMovKndd-YubSTwIkEWUHxEhVxo é inválida: mostra STORE_CLOSED. Opção B V1 ID 1UR_0IrVHRSa_B78kt-qNlnuZXFhbA-kY: carrinho escuro, quatro produtos, cupom HIELYA10, totais e ETA 30–45. Opção C V2 arquivada ID 1MzASYbDUYUEMhmdC_vPmZt7cRVAZKgt0: carrinho claro, dois produtos, WELCOME10, pedido mínimo e recomendações. Decisão: B, C ou nenhuma.
ORDER_IN_TRANSIT — Opção A ativa ID 1OwuRJxhG2ODd1mi2EUiqUuQkCU5iKix7 é inválida: mostra SUPPORT. Opção B V1 ID 1huOcQ3o7CG61nI5nBICA5WZHOJmudKbr: mapa, rota, entregador, veículo, chamada/chat e ETA 30–45. Opção C V2 arquivada ID 1XvuwdJIr_alnbufxoA8Me3LBJwbdNnVM: progresso compacto, endereço e ETA 15–20, sem mapa/entregador. Decisão: B, C ou nenhuma.
SAVED_ADDRESSES — Opção A ativa ID 1lsB2IMEw1f2g86eKIPwhm2T0T7hzfraU é inválida: mostra CART. Opção B V1 ID 1BrLL0zcdIT1dJOzxohVEJQd2FiHdQ7gC: Casa, Trabajo e Amigos, distâncias, edição e navegação extensa. Opção C V2 arquivada ID 1W9g5_ElV_fymkL9K1Kbi6ojG7V82tq_J: lista compacta, chip Principal, editar e adicionar. Decisão: B, C ou nenhuma.
SUPPORT — Opção A ativa ID 1rbGevr0aWTqJkXBe2w1Q-snepZjyldIP é inválida: mostra OUT_OF_STOCK. Opção B V1 ID 1kqOE3xKwMhCQgGEZESu_QCff9QyIZ9ub: FAQ, WhatsApp, horários, e-mail, telefone e ajuda de pedido. Opção C V2 arquivada ID 1bwf_sdjsS1ZKlmKWcHMbymg-7mggIxsf: quatro categorias e um CTA. Decisão: B, C ou nenhuma.
OUT_OF_STOCK — Opção A ativa ID 1zBUIAP0s_8W3acWptUsJqVmAVdgDUv6O é inválida: mostra ORDER_IN_TRANSIT. Opção B V1 ID 1ykZlahaoWk9hzi7KSiHqaRevt_Cm1Fao: caixa 3D, indisponibilidade genérica, controle de aviso e três similares. Opção C V2 arquivada ID 16ZlJM9i9jHkWV8CT4YsKLO5fpfwJPb0u: produto Corona específico, aviso e similares compactos. Decisão: B, C ou nenhuma.
STORE_CLOSED — Opção A ativa ID 1J1X7gSWqwZBX-g0kEO9SgYTBevLLNMH6 é inválida: mostra SAVED_ADDRESSES. Opção B V1 ID 1HzGViakgsXc_TCwT4KrM2F1re7-DOOJS: lua/relógio 3D, horário 10:00–00:00, três ações e navegação com sete itens. Opção C V2 arquivada ID 1CcFGo04CRBooU_m-kCLLximFyLlBd04X: placa simples, horário 10:00–22:00, duas ações e navegação com cinco itens. Decisão: B, C ou nenhuma.

# Critério objetivo de APPROVED
1. Aprovação explícita do responsável, identificando família, nome, versão e Drive ID exatos.
2. Nome, caminho e conteúdo visual coerentes; nenhum conflito ou duplicata em aberto.
3. Conformidade com o Design System formalmente APPROVED_FROZEN aplicável.
4. Copy, estados e comportamento alinhados ao PRD, contratos e decisões canônicas.
5. QA visual e de acessibilidade: contraste, legibilidade, hierarquia, alvos de toque, responsividade e ausência de clipping.
6. Proveniência rastreável: fonte editável ou render code-first, versão/SHA, Drive ID e evidência.
7. Transição CANDIDATE → APPROVED registrada no registro canônico e em novo checkpoint.
8. Mudanças posteriores geram novo candidato; nenhum asset aprovado é alterado silenciosamente.
Regra cumulativa: somente recebe APPROVED quando todos os oito requisitos estiverem satisfeitos.

# Alterações realizadas
O registro canônico recebeu as opções lado a lado, Drive IDs, datas, diferenças visíveis, resultado da auditoria, decisão pendente, ação de consolidação e links diretos para os arquivos.
PHONE_LOGIN_TYPING foi consolidado logicamente sem apagar evidência. PHONE_LOGIN_EMPTY foi corrigido para conflito visual falso positivo. As seis famílias com conteúdo trocado foram marcadas como inválidas na opção ativa e permanecem aguardando decisão explícita entre V1, V2 arquivada ou nenhuma.
Nenhum checkpoint anterior foi sobrescrito.

# Restrições preservadas
REPOSITORY_CHANGED = FALSE
MAIN_CHANGED = FALSE
ASSET_APPROVED = 0
PHYSICAL_FILE_DELETION = FALSE
C003_STARTED = FALSE
C004_STARTED = FALSE
NEW_SCREEN_CREATED = FALSE
PRODUCTION_ACTIVATED = FALSE
DEPLOYMENT_PERFORMED = FALSE

# Próxima decisão
O responsável deve registrar uma escolha explícita para PHONE_LOGIN_EMPTY e para cada uma das seis famílias com ativo V2 trocado. A família PHONE_LOGIN_TYPING não requer nova escolha para consolidação, mas continua CANDIDATE e não aprovada.
