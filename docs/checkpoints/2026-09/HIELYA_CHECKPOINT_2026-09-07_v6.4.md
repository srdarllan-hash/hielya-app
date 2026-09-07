# HIELYA_CHECKPOINT_2026-09-07_v6.4

Gate: ATOMIC_HANDOVER_TERMINAL_REFUSAL / PHASE_3_HARDENING. Data: 2026-09-07 UTC.
Status: FINAL_CANDIDATE / FINAL_CI_PENDING / PR40_OPEN_DRAFT_NOT_MERGED.
Política e v6.3 preservados. Issue39 / PR40 / branch hielya/atomic-handover-terminal-refusal. Main ccdd13492dd8348ea8b59b94c6521fc3b760c790 permanece pós-merge38 autorizado; Fase3 não mergeada.

## Evidência e causa antes da correção
Primeiro candidato4412b459c84c8149e540bb6ffe83e768ca5db482/tree67efc2229290e6799910236f9146bdeb4b94de22: CI34115635892 contratoSUCCESS; CI34115636671 qualitySUCCESS (386unit, lint0erros/8warnings, typecheck/Next/Storybook) e regressões ainda em conclusão ao iniciar revisão adicional. Não atribuir esses runs à revisão posterior.
Revisão identificou que INSERT OR REPLACE no SQLite pode não executar gatilhos DELETE se recursive_triggers estiver desativado. Nenhum comando da aplicação usa esse caminho, mas a proteção de banco contra reescrita deveria cobri-lo explicitamente. Achado informado ao proprietário antes da correção.

## Correção e decisões
Migration0006 (ainda candidata não mergeada) recebe guarda BEFORE INSERT que rejeita substituição de evento terminal existente ou credencial PIN. Exclusão dos pais de evento terminal também bloqueada. Teste direto SQL ataca OR REPLACE e DELETE de pais.42 testes de handover PASS após correção. Todas decisões de prazo+idade+PIN atômicos e recusas específicas mantidas, sem ampliação de produto. Migrations0001–0005 e checkpoints existentes não alterados.

Arquivos desta revisão: migration0006, teste mvp-atomic-handover, documentação Phase3, CLAUDE/INDEX e este novo checkpoint. Nenhuma remoção. Novo SHA/run finais ficam no PR40 depois do CI integral, sem autorreferência fictícia e sem sobrescrever v6.3.

## Limites e próxima decisão
Permanece fundação interna development/test: uma transação e evento terminal imutável, sem aprovação parcial de idade ou PIN legado liberando entrega. Evidência física depende de inspeção honesta por courier autorizado; software controla o registro/transição. Recusa grava intenção integral de compensação PENDING, execução financeira Fase4 não iniciada. HTTPV1.3, produção, C003/C004 e telas novas não ativados. Aguardar CI final completo e aprovação individual antes de merge PR40; não avançar Fase4 automaticamente.
