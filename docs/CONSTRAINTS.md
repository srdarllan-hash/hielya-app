# Restrições consolidadas

Referência normativa, não fonte de estado. Política → INDEX → checkpoint mais recente → GitHub determina o estado. Não copiar SHA corrente/status de gate para este documento. Entradas sem evidência devem ser marcadas “a confirmar”.

| Restrição | Evidência canônica |
|---|---|
| Não sobrescrever checkpoints; mudanças estruturais exigem novo registro; Issue→branch→testes→PR→aprovação individual de merge | [Política](checkpoints/HIELYA_CHECKPOINT_POLICY.md) |
| Produção, C003/C004 e novas telas dependem de autorização própria | [Gate Fase5](contracts/ALCOHOL_DOMAIN_PHASE_5.md), [Issue43](https://github.com/srdarllan-hash/hielya-app/issues/43) |
| Catálogo público; autenticação exigida na compra; sessão opaca não verifica maioridade | [ADR sessão](decisions/ADR-MVP-LOCAL-36-OPAQUE-CUSTOMER-SESSION-V1-2.md), [plano/requisitos](requirements/README.md) |
| Cutoff server-side dinâmico: deadline22:00 Madrid menos MAX(45, limite superior real válido); não presumir SLA45 se fonte falhar | [ContratoV1.3](../contracts/openapi/HIELYA_OPENAPI_MVP_LOCAL_36_V1_3.yaml), [Fase2](contracts/ALCOHOL_DOMAIN_PHASE_2.md) |
| Aceite/preparo/despacho revalidam viabilidade; pedido aceito mantém sua promessa; cutoff de novo pedido não substitui deadline de entrega | [Fase2](contracts/ALCOHOL_DOMAIN_PHASE_2.md), [Fase3](contracts/ALCOHOL_DOMAIN_PHASE_3.md) |
| Handover atômico exige prazo, maioridade verificada e PIN, presença do destinatário e courier autorizado; sem terceiro/recepção/entrega desacompanhada | [Fase3](contracts/ALCOHOL_DOMAIN_PHASE_3.md) |
| Recusa por idade terminal, motivo específico, sem nova tentativa no mesmo pedido; compensação integral sem custo ao cliente | [Fase3](contracts/ALCOHOL_DOMAIN_PHASE_3.md), [Fase4](contracts/ALCOHOL_DOMAIN_PHASE_4.md) |
| Evidência de idade mínima: resultado, método, timestamp e courierId; sem foto/número/DOB/tipo de documento ou texto livre | [Fase3](contracts/ALCOHOL_DOMAIN_PHASE_3.md) |
| Documento com foto e nascimento visíveis; NIE isolado→REFUSED_DOUBTFUL_ID | [Requisitos](requirements/README.md), [Fase3](contracts/ALCOHOL_DOMAIN_PHASE_3.md) |
| Retenção do dossiê ancorada no último lançamento contábil, sujeita a impedimentos/prazos especiais; sem TTL separado para idade | [Fase4](contracts/ALCOHOL_DOMAIN_PHASE_4.md) |
| HIGH e álcool UNAVAILABLE coexistem; disponibilidade pública não autoriza pedido; nenhuma regra de cutoff no cliente | [Fase5](contracts/ALCOHOL_DOMAIN_PHASE_5.md) |
| Não publicar dinheiro devolvido sem confirmação do provedor; repetição de rede não duplica compensação | [Fase4](contracts/ALCOHOL_DOMAIN_PHASE_4.md) |
| Alterar baseline só com causa e revisão; não afrouxar testes para obter verde | [Plano](requirements/README.md), [Issue28](https://github.com/srdarllan-hash/hielya-app/issues/28) |
