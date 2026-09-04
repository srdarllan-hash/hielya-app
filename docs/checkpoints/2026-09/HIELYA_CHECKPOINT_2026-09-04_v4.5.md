# HIELYA — Checkpoint v4.5: remapeamento canônico de assets
Status: CRIADO E VERIFICADO
Data: set. 4, 2026
Política aplicável: [HIELYA_CHECKPOINT_POLICY.md](https://docs.google.com/document/d/1tnI8THDiG8Mz2qkNqFMxd3QmsqcUUE2EXMifx7wuFNY/edit)
Checkpoint anterior: [HIELYA_CHECKPOINT_2026-09-04_v4.4.md](https://docs.google.com/document/d/1O-C_hxmDl36hXUGB8p0U96aisr6G7NsnQAHyUM9gpcU/edit)
Registro canônico: [HIELYA_ASSET_REGISTRY_2026-09-04](https://docs.google.com/spreadsheets/d/1BkaFcxeouK3B41tZ8-ECPyR2bXuBNl_R8i6r1KRGBVc/edit)

# Resumo executivo
O remapeamento dos seis arquivos ativos V2 foi autorizado explicitamente como correção de rotulagem, não como decisão de design. Os seis Drive IDs e os bytes originais foram preservados; somente nome e pasta foram corrigidos para corresponder ao conteúdo real. Nenhum asset foi aprovado.

# Validação de governança e GitHub
A Política de Checkpoints e o checkpoint v4.4 foram lidos antes da mudança. A main foi revalidada no GitHub e permanece em df912c101b3db5c910a8c575fb2e2e687a54f4f5, árvore 774f3153add86419f4aa622267e51c7a6f786f3c. O repositório, código, PRs, Issues e CI não foram alterados neste gate.

# Remapeamento executado
1P38eQJMovKndd-YubSTwIkEWUHxEhVxo: CART → STORE_CLOSED; nome atual HLY_STATE_STORE_CLOSED_V2.png.
1OwuRJxhG2ODd1mi2EUiqUuQkCU5iKix7: ORDER_IN_TRANSIT → SUPPORT; nome atual HLY_CLIENT_SUPPORT_V2.png.
1lsB2IMEw1f2g86eKIPwhm2T0T7hzfraU: SAVED_ADDRESSES → CART; nome atual HLY_CLIENT_CART_COUPON_APPLIED_V2.png.
1rbGevr0aWTqJkXBe2w1Q-snepZjyldIP: SUPPORT → OUT_OF_STOCK; nome atual HLY_STATE_OUT_OF_STOCK_V2.png.
1zBUIAP0s_8W3acWptUsJqVmAVdgDUv6O: OUT_OF_STOCK → ORDER_IN_TRANSIT; nome atual HLY_CLIENT_ORDER_IN_TRANSIT_V2.png.
1J1X7gSWqwZBX-g0kEO9SgYTBevLLNMH6: STORE_CLOSED → SAVED_ADDRESSES; nome atual HLY_CLIENT_SAVED_ADDRESSES_V2.png.

# Resultado da verificação visual e binária
Após o remapeamento, cada arquivo ativo tem nome, pasta e conteúdo coerentes. Os seis V2 ativos remapeados não são byte a byte idênticos aos V2 arquivados correspondentes; logo, permanecem variantes A/B/C distintas para decisão explícita. O erro sistemático de rótulo foi resolvido, mas nenhuma escolha estética ou de produto foi feita.

# STORE_CLOSED e horário canônico
A main certificada registra operação das 10:00 às 22:00 e retorno às 10:00; o cutoff de álcool também é anterior às 22:00. A variante A remapeada e a variante C arquivada exibem 10:00–22:00 em Europe/Madrid. A variante B/V1 exibe 10:00–00:00 e está operacionalmente desatualizada. Portanto, a futura decisão de STORE_CLOSED deve comparar A e C pelo layout e pelas ações; B não deve ser aprovada sem uma decisão prévia de alterar o horário do produto.

# Estado do registro canônico
TOTAL = 96
CANDIDATO = 78
APROVADO = 0
SUPERSEDED = 18
FAMÍLIAS INVENTARIADAS NO GATE = 8
DUPLICATA EXATA CONSOLIDADA = 1
FALSO POSITIVO DE DUPLICATA = 1

# Critério de aprovação preservado
Um asset somente poderá mudar para APROVADO quando houver aprovação explícita registrada do responsável, conformidade verificada com o Design System formal aplicável, identificação inequívoca de Drive ID, nome, versão e caminho, ausência de conflito funcional ou operacional e atualização auditável do registro. O silêncio, a posição na pasta ativa e o rótulo V2 não constituem aprovação.

# Decisões pendentes
PHONE_LOGIN_EMPTY continua sendo decisão arquitetural: opção A permite “Ahora no” e navegação sem login; opção B exige autenticação. Para as seis famílias remapeadas, escolher A, B, C ou NENHUMA com base no registro atualizado. Em STORE_CLOSED, apenas A e C estão alinhadas ao horário canônico atual.

# Restrições preservadas
C-003_STARTED = FALSE
C-004_STARTED = FALSE
NEW_SCREEN_CREATED = FALSE
ASSET_APPROVED_AUTOMATICALLY = FALSE
REPOSITORY_CHANGED = FALSE
CI_RUN = FALSE
MERGE_PERFORMED = FALSE
PRODUCTION_ACTIVATED = FALSE

# Próximo passo
Aguardar decisões explícitas de produto e design. Depois, atualizar o status dos Drive IDs escolhidos e registrar novo checkpoint, sem sobrescrever os anteriores.
