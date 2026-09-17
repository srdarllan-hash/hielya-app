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
- Lock: <caminho para .agents/locks/<task-id>.lock.md> (Session ID: <session_id do lock>), ou "nenhum"
- Estado: planned | in-progress | blocked | in-review | done
- Escopo permitido: <caminhos>
- Escopo proibido: <caminhos>
- Última atualização: <data>
```

`Owner` e o `Session ID` citado em `Lock` devem ser sempre os mesmos valores dos campos `Owner`
e `Session ID` no arquivo de lock referenciado, quando houver um. Uma tarefa `in-progress` sem
lock correspondente em `.agents/locks/` é uma inconsistência — registrar em `.agents/BLOCKERS.md`
até reconciliar. Duas tarefas com locks em `active`/`ready-for-review`/`stale`/`blocked` e
`Session ID` diferentes não podem declarar caminhos de trabalho sobrepostos, mesmo que o `Owner`
seja o mesmo (ver `.agents/locks/README.md`). Correspondência entre `Estado` da tarefa e `Estado`
do lock: `in-progress` ↔ `active`, `in-review` ↔ `ready-for-review`, `blocked` ↔
`stale`/`blocked`, `done` ↔ `released`. Ver `.agents/locks/README.md` para o formato completo,
os cinco estados e as regras de criação/fechamento de lock.

## Tarefas

### INFRA-LOCKS-HARDENING — Corrigir sobreposição de sessões e liberação por expiração nos locks
- Branch: hielya/session-httponly-cookie
- Owner: claude
- Lock: .agents/locks/INFRA-LOCKS-HARDENING.lock.md (Session ID: claude-20260917T194358Z-infra-locks-hardening) — Estado do lock: released. Fechado por Work, evidência em .agents/WORK_REPORT.md citando .agents/CODEX_REPORT.md (deadlock encontrado no commit 2e2e39f) e .agents/CLAUDE_REPORT.md (correção entregue)
- Estado: done
- Escopo permitido: .agents/TASKS.md, .agents/locks/README.md, .agents/locks/INFRA-LOCKS-HARDENING.lock.md, .claude/rules/agents-local-coordination.md, .agents/HANDOFF.md, .agents/CLAUDE_REPORT.md, .agents/CHANGELOG_AGENT.md, .agents/BLOCKERS.md
- Escopo proibido: código, CLAUDE.md, workflows, dependências, GitHub, qualquer arquivo de produto
- Última atualização: 2026-09-17

### INFRA-LOCK-DEADLOCK-FIX — Separar caminhos de trabalho de metadados de coordenação nos locks
- Branch: hielya/session-httponly-cookie
- Owner: claude
- Lock: .agents/locks/INFRA-LOCK-DEADLOCK-FIX.lock.md (Session ID: claude-20260917T195436Z-deadlock-fix) — Estado do lock: ready-for-review; entrega registrada em .agents/CLAUDE_REPORT.md, aguardando Work/Codex para released
- Estado: in-review
- Escopo permitido: .agents/locks/README.md, .claude/rules/agents-local-coordination.md
- Escopo proibido: código, CLAUDE.md, workflows, dependências, GitHub, qualquer arquivo de produto
- Última atualização: 2026-09-17
