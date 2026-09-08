# HIELYA CHECKPOINT v8.5 — PR54_MERGED_TO_MAIN

Data e hora do evento: 2026-09-07 21:57:11 UTC.
Checkpoint anterior: v8.4, preservado integralmente.

## Resumo executivo e estado factual

O proprietário aprovou explicitamente o merge do PR #54 e solicitou a próxima versão do checkpoint. O PR foi retirado de draft e mergeado na main após confirmação do head aprovado e dos checks aplicáveis.

- PR: https://github.com/srdarllan-hash/hielya-app/pull/54
- Issue de implementação: #53.
- Head validado: `44d3e7cd93dcb82e00c439610ab0db840ff91e29`.
- Main anterior: `10410dded46dfc08e4247835d1ba957f48b3d953`.
- Commit de merge: `fa47cd8271db00e0dec7ec92007de6a289a6ae8f`.
- GitHub confirmou merged=true e merged_at=2026-09-07T21:57:11Z.
- Main e estado do PR foram alterados. Nenhum deploy ou alteração de produção foi realizado.

## Validação e origem das evidências

Os check-runs do head aprovado foram consultados imediatamente antes do merge. Todos os checks aplicáveis estavam completed/success: auth-flow, form-components, contract, quality, cinco browser-regressions e validation-result. Os jobs históricos de pré-gate estavam skipped por suas condições existentes; não são declarados como testes executados.

Evidências finais registradas no PR e confirmadas no GitHub:

- [Authentication UI Validation](https://github.com/srdarllan-hash/hielya-app/actions/runs/34164199783): 60 casos de estados, axe e jornadas em Chromium/WebKit.
- [Design System Validation](https://github.com/srdarllan-hash/hielya-app/actions/runs/34164199796): 526 testes unitários, qualidade, builds e cinco suítes de regressão.
- [Form Components](https://github.com/srdarllan-hash/hielya-app/actions/runs/34164199823): 141 casos.
- [Contract](https://github.com/srdarllan-hash/hielya-app/actions/runs/34164199850): sucesso.

Esses resultados correspondem ao head do PR, não a uma nova execução pós-merge. O v8.4 registrava CI ainda pendente no instante de sua criação; este novo checkpoint registra a conclusão e o merge sem reescrever aquele histórico.

## Implementação incorporada e Decision Log

C-003 utiliza PhoneInput sem autofocus inicial; catálogo público e Ahora no permanecem disponíveis. A rota /login é o gatilho provisório explícito, a substituir pela compra quando houver checkout.

C-004 utiliza OtpInput com seis inputs reais, autofocus na primeira célula e submit automático ao completar. Inclui telefone mascarado, expiração, cooldown de reenvio, Nunca compartas este código e Cambiar número. Não foi adicionado botão Verificar.

A camada de aplicação administra challengeId, prazos, requisições, cancelamento, retry e sessão. Os contratos existentes de request/verify permanecem a referência. Sessão somente em memória; recarregar perde autenticação conforme decisão ratificada. SessionPort prepara integração futura, sem persistência.

Falha de rede preserva o código e oferece Reintentar secondary/md/largura automática. OTP_UNAVAILABLE apresenta: "Este código no está disponible. Solicita otro cuando puedas." Reenvio respeita cooldown. O fluxo não promete recuperar uma resposta perdida.

Tokens 1.2.0 APPROVED_FROZEN continuam canônicos; assets são REFERENCE_ONLY. Não houve nova decisão visual, alteração de backend ou implementação de recuperação OTP.

## Arquivos e documentos canônicos

O merge incorpora os 28 arquivos do PR #54: fluxo client-auth em packages/application; provider, runtime, cliente HTTP e rota /login em apps/ui-lab; telas, estilos e stories de autenticação em packages/ui; testes unitários e de navegador, configuração Playwright e workflow adicional; aliases de configuração; CLAUDE.md, KNOWN_DEBT.md, especificação da aplicação e checkpoints v8.3/v8.4.

Referências canônicas: docs/requirements/FORM_COMPONENTS_SPECIFICATION.md, docs/requirements/C003_C004_APPLICATION_FLOW.md, docs/CONSTRAINTS.md e docs/KNOWN_DEBT.md.

Esta entrega documental cria somente docs/checkpoints/2026-09/HIELYA_CHECKPOINT_2026-09-07_v8.5.md e acrescenta uma linha a docs/checkpoints/INDEX.md. Nenhum arquivo histórico foi removido ou reescrito. O checkpoint é publicado em branch e PR documental separado, sem presumir aprovação de merge desse novo PR.

## Pendências, riscos e próximos passos

- Recuperação após resposta OTP perdida: dívida média #50, não bloqueia MVP, resolver antes de escala. Limpeza/expiração de sessões ACTIVE nunca utilizadas ainda precisa ser especificada. C ou D permanecem preferidas; A/B descartadas por minimização.
- Persistência segura de sessão depende de ADR formal; login em memória é o escopo aprovado.
- Gatilho real de compra depende de carrinho/checkout futuros.
- Testes automatizados não certificam leitores de tela manuais ou autofill SMS em aparelhos físicos.
- Produção e SMS real não foram ativados; nenhum novo escopo foi autorizado.
- Próximo passo documental: revisão e merge separado deste checkpoint conforme governança. Próxima implementação depende de definição do proprietário.

## Revisão para publicação pública

Conteúdo revisado: apenas decisões técnicas, caminhos, identificadores públicos de commits/PRs e evidências de CI. Não contém credenciais, chaves, pepper, valores de OTP, tokens de sessão, dados pessoais ou segredos operacionais.
