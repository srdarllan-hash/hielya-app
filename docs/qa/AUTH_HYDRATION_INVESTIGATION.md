# Investigação da falha de autenticação antes do merge do PR57

Data: 2026-09-08. Issue #56. Investigação isolada no PR #58; nenhuma correção de runtime ou merge nesta investigação.

## Falha original e reexecução

Workflow Authentication UI Validation, run34214269683, head65bcf82d53935f11dbd1e8b3a2c0284bd9cdbe5d. O job102022336812 teve59 testes aprovados e uma falha WebKit390 no teste `network uncertainty preserves digits, explicit retry maps unavailable, new challenge after cooldown`.

O erro exato foi `locator.click: Test timeout of 30000ms exceeded`, em tests/auth-flow/auth-flow.spec.ts:19, dentro do helper enter, chamado pela linha47. O botão Continuar permanecia disabled depois de fill no telefone. O teste não chegou ao cenário de incerteza de verify. O snapshot do artefato10051203474 mostra nove caracteres numéricos sem separadores de máscara e botão disabled. Não reproduzir o valor do campo neste relatório.

O job102023625159 reexecutou os mesmos60 testes no mesmo head e passou, sem mudança de código, timeout ou baseline. Na entrega anterior a causa ainda não havia sido identificada: passar no rerun não constituía diagnóstico.

## Comparação controlada

[Workflow diagnóstico34216149306](https://github.com/srdarllan-hash/hielya-app/actions/runs/34216149306), executado pelo [PR58](https://github.com/srdarllan-hash/hielya-app/pull/58). Dois jobs constroem os SHAs imutáveis com o mesmo script, Node24 e WebKit:

- Base/main anterior ao carrinho: c3a1e53c8638d476721e0d5b1442f36b0326a861, job102028237177.
- Candidato PR57:65bcf82d53935f11dbd1e8b3a2c0284bd9cdbe5d, job102028236856.

| Condição | Base sem carrinho | PR57 |
|---|---|---|
| Navegação natural,12 repetições |12 concluíram pedido de código simulado |12 concluíram pedido de código simulado |
| Preenchimento com JS retido,5 repetições |5/5 divergências DOM/React; nenhum pedido de código |5/5 divergências DOM/React; nenhum pedido de código |
| Preenchimento após hidratação,5 repetições |5/5 concluíram pedido de código simulado |5/5 concluíram pedido de código simulado |

Sob JS retido: antes da hidratação, DOM tem comprimento9 e não há props React. Após liberar JS e aguardar hidratação mais1200ms, DOM permanece com comprimento9, props React têm comprimento0 e botão disabled. Novo fill vazio seguido de nove dígitos também não recuperou essa sonda; não prometer recuperação por simples preenchimento. Controle hidratado: DOM e props React com comprimento11 (máscara) e botão habilitado.

A primeira versão da sonda encerrou no primeiro submit desabilitado e não preservou as observações completas. A segunda versão registra cada amostra; a tabela acima usa exclusivamente esta segunda execução. O sucesso do workflow diagnóstico significa coleta concluída, não ausência de defeito: a condição negativa reproduziu o defeito deliberadamente.

## Causa e limites da conclusão

Mecanismo identificado: corrida entre preenchimento do input HTML renderizado no servidor e hidratação React. PhoneLoginScreen habilita Continuar conforme value.length===9; PhoneInput normaliza e aplica máscara por onChange. A sonda demonstra input visível preenchido enquanto o valor controlado React permanece vazio. O comportamento é determinístico no cenário controlado de JS atrasado, não evidência de aleatoriedade em criação de sessão ou validação de OTP.

O mecanismo reproduz a assinatura do incidente original. A execução original não gravou o instante de hidratação, portanto a atribuição daquele interleaving específico permanece inferência sustentada pelo snapshot e pela reprodução, não medição retroativa.

Input, PhoneInput, PhoneLoginScreen, máquina client-auth e teste de autenticação permanecem iguais à base. O PR57 altera a composição do root com CartProvider e o destino de retorno do AuthRuntime; o defeito foi reproduzido sem essas mudanças. Assim, não foi introduzido pelo carrinho. A amostra não mede se o novo bundle altera a probabilidade da janela; não afirmar ausência absoluta de influência no timing.

Não era flakiness previamente documentada. Agora há uma condição reproduzível de frontend, que também pode afetar interação com JS lento; não classificar como mero ruído de infraestrutura. A investigação não executa verify nem prova propriedades novas do backend de autenticação. Nenhum OTP, token, telefone, body ou header é registrado: apenas comprimentos, booleanos e contagem de requests com fixtures sintéticas.

## Encaminhamento

Registrar em KNOWN_DEBT. Manter PR57 sem merge: a autorização condicional para flakiness não relacionada ao carrinho não deve ser interpretada como aceitação automática de um defeito de interação real ou como certeza sobre a influência do bundle no timing.

Antes de encerrar a dívida, definir e implementar tratamento da interação pré-hidratação (por exemplo impedir edição até o controle estar pronto ou reconciliar de forma segura a entrada antecipada), preservar máscara e acessibilidade e adicionar regressão determinística. Essas alternativas não foram implementadas nem escolhidas nesta investigação. Aumentar timeout ou repetir o job até verde não corrige a divergência observada.

Main, CHECK da migration0001, guard de produção e runtime do PR57 permanecem inalterados. PR58 é diagnóstico/documentação separado, não deve ser mergeado automaticamente.
