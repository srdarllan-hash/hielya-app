# HIELYA — Checkpoint v4.6

# Resumo executivo
- STORE_CLOSED foi a primeira família aprovada sob o critério formal do ASSET_CANONICAL_STATUS_RESOLUTION_GATE.
- O registro canônico passou de 78 candidatos e 0 aprovados para 77 candidatos e 1 aprovado.
- A varredura operacional cobriu integralmente os 78 candidatos existentes antes desta decisão.

# Decisão formal — STORE_CLOSED
- Família: HLY_STATE_STORE_CLOSED
- Nome: HLY_STATE_STORE_CLOSED_V2.png
- Versão: V2 remapeada
- Drive ID: 1P38eQJMovKndd-YubSTwIkEWUHxEhVxo
- Status: APPROVED
- Justificativa: horário canônico 10:00–22:00 e captura de intenção por “Notificarme cuando abra”.
- Proveniência: decisão explícita do proprietário; remapeamento autorizado e documentado nos checkpoints v4.4–v4.5; conformidade conferida contra a main certificada.
- B/V1 — HLY_STATE_STORE_CLOSED_V1.png, Drive ID 1HzGViakgsXc_TCwT4KrM2F1re7-DOOJS — permanece SUPERSEDED. O horário 10:00–00:00 está operacionalmente incorreto. O histórico foi preservado.

# Referência certificada
- Main SHA: df912c101b3db5c910a8c575fb2e2e687a54f4f5
- Main tree: 774f3153add86419f4aa622267e51c7a6f786f3c
- Horário: 10:00–22:00.
- Pedido mínimo de produtos: €25.
- Taxa de entrega: €2,00 de base + €0,60 por quilômetro de distância rodoviária.
- Raio máximo: 4 km por distância rodoviária.
- Preços: contratos catalog HIELYA_MVP_LOCAL_36_UNIT_COMMERCIAL_DATA_V1_1 e HIELYA_MVP_LOCAL_36_COMPOSITE_COMMERCIAL_DATA_V1_0.

# Auditoria operacional dos candidatos
- 78 candidatos revisados.
- 25 bloqueados por divergência operacional.
- 2 exigem revisão de proveniência de totais históricos.
- 3 estão conformes nos fatos exibidos, mas continuam candidatos por falta de aprovação explícita.
- 1 aprovado e conforme: STORE_CLOSED V2 remapeada.
- 46 não exibem nenhum dos cinco dados operacionais alvo.
- 1 alerta adicional: contagens de categorias incompatíveis com o catálogo MVP.

# Achados críticos
- Horários incorretos 10:00–00:00 e 10:00–03:00 aparecem em boards e referências candidatas.
- Taxa fixa de €2,99 aparece repetidamente. No checkout que declara 2,1 km, a fórmula certificada resulta em €3,26, não €2,99.
- Promessas de frete grátis acima de €25 ou €45 não constam do contrato certificado.
- Diversos preços, packs, cupons e promoções não rastreiam os contratos comerciais certificados.
- O mínimo de €25 e o raio de 4 km não apresentaram divergência onde foram explicitamente declarados.
- A aba Auditoria_Operacional do registro canônico contém uma linha por candidato, com resultado, severidade, conclusão e proveniência.

# Artefatos canônicos
- Registro: HIELYA_ASSET_REGISTRY_2026-09-04 — Drive ID 1BkaFcxeouK3B41tZ8-ECPyR2bXuBNl_R8i6r1KRGBVc.
- Checkpoint anterior: HIELYA_CHECKPOINT_2026-09-04_v4.5 — Drive ID 1HnPWrX7F0bH5xRnICKNElO4GNV5W3DdVZiKnoV02cTI.
- Política: HIELYA_CHECKPOINT_POLICY.md — Drive ID 1tnI8THDiG8Mz2qkNqFMxd3QmsqcUUE2EXMifx7wuFNY.

# Guardrails e estado do trabalho
- Nenhum outro asset foi aprovado automaticamente.
- CART, ORDER_IN_TRANSIT, SAVED_ADDRESSES, SUPPORT e OUT_OF_STOCK aguardam decisão explícita.
- C-003 e C-004 não foram iniciadas.
- Nenhuma tela nova foi criada.
- Repositório, main, Issue, PR, commit e CI não foram alterados nesta etapa.

# Próximo passo
- Decidir as famílias restantes somente após considerar os bloqueios operacionais registrados.
- Antes de aprovar um asset com preços, taxa, horário, raio, mínimo, cupom ou promoção, exigir sincronização com os contratos certificados e nova verificação.
