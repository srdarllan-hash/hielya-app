# Fila local de tarefas multiagente

Lista de coordenação local, não autoritativa. Toda tarefa real precisa de uma Issue no GitHub,
uma branch e o contrato descrito em `docs/automation/AGENT_PROTOCOL.md` (`contracts.schema.json`)
quando a automação estiver de fato ativada. Enquanto isso, este arquivo serve apenas para
sessões locais (Claude Code, Codex CLI, humano) saberem o que está em andamento e evitar
trabalho duplicado ou concorrente na mesma branch.

## Formato de cada entrada

```
### <Issue #NNN ou N/A> — <título curto>
- Branch: <nome>
- Owner: work | claude | codex | nenhum
- Lock: <caminho para .agents/locks/<task-id>.lock.md, ou "nenhum">
- Estado: planned | in-progress | blocked | in-review | done
- Escopo permitido: <caminhos>
- Escopo proibido: <caminhos>
- Última atualização: <data>
```

`Owner` deve ser sempre o mesmo valor do campo `Owner` no arquivo de lock referenciado em
`Lock`, quando houver um. Uma tarefa `in-progress` sem lock correspondente em
`.agents/locks/` é uma inconsistência — registrar em `.agents/BLOCKERS.md` até reconciliar. Ver
`.agents/locks/README.md` para o formato e as regras de criação/remoção de lock.

## Tarefas

Nenhuma tarefa multiagente ativa registrada no momento desta criação.
