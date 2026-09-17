# Relatório do papel "Work" (revisão técnica)

Log local do papel "Work" definido em `docs/automation/AGENT_PROTOCOL.md`: inspeciona diff/CI,
classifica bloqueios e publica uma revisão técnica. Uma revisão aqui é **conselho técnico**, não
aprovação de merge (`APPROVE` do GitHub) e não substitui a revisão do proprietário. Ver também
`docs/automation/WORK_REVIEW.md` para as instruções de revisão quando a automação estiver ativa.

Um agente não deve revisar o próprio trabalho como se fosse aprovação humana independente.

## Formato de cada entrada

```
## <data/hora> — <tarefa/issue, base/head exatos>
Diff inspecionado (base..head):
Checks de CI verificados (identidade confiável, não apenas prosa):
Bloqueios classificados:
Recomendação: work-review | changes-requested | blocked
Observações para o proprietário:
```

## Entradas

Nenhuma entrada registrada ainda. Este arquivo foi criado como parte da infraestrutura local de
coordenação em `.agents/`.
