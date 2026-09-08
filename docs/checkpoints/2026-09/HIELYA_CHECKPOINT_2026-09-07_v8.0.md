# HIELYA CHECKPOINT v8.0 — FORM_SPEC_CLOSED / OTP_DEBT_DEFERRED

2026-09-07 UTC. Anterior v7.9. PR #49, Issues #48/#50. Base remota b69bcf93ce452e781cc6404691b1877780cba90b; main 37dc523013ac13088fffdd70d8d8c6be7292a612. Política/INDEX/checkpoints lidos nesta continuidade; PR aberto e mergeável verificado. Alterações remotas de formatação da tabela incorporadas, conflito documental resolvido preservando tabela e decisão mais recente. Checkpoints históricos preservados.

Autorização explícita do proprietário: publicar documentação técnica no repositório público srdarllan-hash/hielya-app após conferir ausência de credenciais, valores de chaves/pepper, dados pessoais e segredos operacionais; merge PR #49 após verificações. Rejeição automática anterior de push tratada com essa autorização expressa, sem contorno.

Decisão: recuperação OTP adiada, prioridade média, não bloqueia MVP/OtpInput/C-004; resolver antes de escala. A/B descartadas por minimização, C ou D preferidas sem escolha final. Rotina de limpeza/expiração de sessões ACTIVE nunca utilizadas permanece a especificar, inclusive prova de não uso e proteção contra corrida; nenhuma implementação.

Spec revisão 5: Input/PhoneInput/OtpInput fechados e prontos para implementação. Rede preserva código, erro de conexão e retry explícito sem promessa de recuperar; OTP_UNAVAILABLE usa microcopy aprovada e novo código quando cooldown permitir. Nenhuma tela ou componente implementado neste PR.

Arquivos alterados: KNOWN_DEBT, FORM_COMPONENTS_SPECIFICATION, OTP_VERIFY_RECOVERY_OPTIONS, INDEX; criado este v8.0. Somente documentação. Revisão de conteúdo sensível e diff antes do push; CI do novo commit ainda pendente neste registro, sem atribuir garantia de recuperação a testes existentes. Merge autorizado mas não executado neste checkpoint; resultado será verificado no GitHub. Produção, backend, contratos, tokens, testes e integrações intactos.

Próximos passos: publicar, verificar CI do candidato e mergear PR #49; implementação dos componentes em trabalho posterior; dívida #50 permanece aberta para antes de escala. Este registro substitui o bloqueio histórico, sem reescrever v7.8/v7.9.
