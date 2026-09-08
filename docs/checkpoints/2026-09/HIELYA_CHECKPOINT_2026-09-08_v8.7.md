# HIELYA CHECKPOINT v8.7 — AUTH_HYDRATION_INVESTIGATION / MERGE_HELD

Data/hora: 2026-09-08T10:39:48.003031+00:00. Predecessor v8.6 preservado. Issue56, PR57 candidato e PR58 diagnóstico separado.

Main validada c3a1e53c8638d476721e0d5b1442f36b0326a861. PR57 head65bcf82d53935f11dbd1e8b3a2c0284bd9cdbe5d tem CI final verde após um rerun de autenticação. Proprietário pediu causa e atribuição antes do merge, autorizando merge somente se flakiness identificada e não relacionada ao carrinho. Nenhum merge executado; PR57 voltou a draft para sinalizar a investigação.

O primeiro job de autenticação102022336812 falhou com timeout30s no click de Continuar, antes de solicitar OTP;59 passaram. Rerun102023625159 passou60 no mesmo SHA. A entrega anterior não havia identificado a causa.

Diagnóstico A/B no workflow34216149306: base sem carrinho e PR57, cada um com12 controles naturais,5 preenchimentos antes da hidratação com JS retido e5 controles após hidratação. Em ambas versões:12/12 naturais e5/5 pós-hidratação funcionaram;5/5 pré-hidratação deixaram DOM com9 caracteres, React com0 e botão disabled. Nenhum request nesses cinco casos. Evidência completa em docs/qa/AUTH_HYDRATION_INVESTIGATION.md; não há valores pessoais/OTP/token no relatório ou sonda.

Identificada corrida de hidratação pré-existente, reproduzível e compatível com a assinatura da falha original. O instante da hidratação não foi medido na execução original; atribuição exata é inferência. Não foi medida eventual influência do novo bundle na frequência. Não confundir defeito de interação real com mero ruído de CI. Não afirmar comportamento não determinístico de sessão/OTP: verify não foi executado nesta sonda.

Alterações somente na branch de diagnóstico: workflow/script de observação, relatório de QA, entrada em KNOWN_DEBT, este checkpoint e INDEX. Nenhuma correção de produção/runtime, mudança de token, baseline, migration ou segredo. CHECK0001 e produção bloqueada preservados. Scripts de diagnóstico não devem ser incorporados automaticamente no PR57.

Próximo passo: decidir tratamento da edição antes da hidratação e aplicar correção/regressão determinística antes de retomar decisão de merge. Alternativas ainda não escolhidas: bloquear interação até readiness ou reconciliar entrada antecipada. Não resolver com sleeps/rerun. Documentos canônicos históricos não foram reescritos; v8.7 registra nova evidência, sem substituir a necessidade de verificar GitHub ao retomar.
