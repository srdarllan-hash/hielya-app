# HIELYA CHECKPOINT v7.9 — OTP_RECOVERY_OPTIONS_FOR_OWNER_DECISION

2026-09-07 UTC. Anterior v7.8; Issue #48/#50, PR #49. Base documental 3bb27c3f289f06983640170338abbc5dad43f0ec; main verificada anteriormente 37dc523013ac13088fffdd70d8d8c6be7292a612. Política, INDEX, v7.8 e estado vivo do PR consultados. Atualização concorrente v7.8 incorporada antes de editar.

Decisão do proprietário: especificar A/B/C/D sem escolher ou implementar; registrar bloqueio de C-004; merge documental autorizado sem aguardar backend, specs Input/PhoneInput independentes. Nenhuma implementação autorizada.

Novo requisito OTP_VERIFY_RECOVERY_OPTIONS.md compara minimização, segurança, complexidade e OpenAPI; destaca retenção recuperável em A/B, corridas de rotação em C e ausência de confirmação confiável em D. Precisão do diagnóstico: mesmo challenge irrecuperável; novo OTP já pode ser solicitado após cooldown, portanto não há bloqueio permanente do telefone no backend.

Alterados KNOWN_DEBT, FORM_COMPONENTS_SPECIFICATION e INDEX; criado este checkpoint e documento de opções. Histórico preservado. Sem código, testes, tokens, contratos, produção ou integrações alterados. Inspeção de código e revisão documental; nenhum experimento de rede. CI do novo commit pendente no momento do registro; nenhuma garantia futura atribuída a testes existentes.

Estado: opções aguardam escolha; OtpInput/C-004 bloqueados por Issue #50. Merge PR #49 autorizado condicionado às verificações; ainda não executado neste checkpoint. Próximos passos: verificar CI e integrar documentação; proprietário decide solução e parâmetros, depois gate separado para backend. Main e produção inalteradas neste registro. Este documento registra estado no momento da criação, não antecipa resultado do merge.
