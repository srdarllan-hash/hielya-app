# Changelog da coordenação local de agentes

Histórico append-only das mudanças feitas à própria infraestrutura de coordenação em `.agents/`
(criação de arquivos, mudança de convenção, etc.). Isto não é o changelog de produto
(`CHANGELOG.md` na raiz) nem um checkpoint oficial. Nunca reescrever uma entrada existente;
adicionar uma nova entrada no topo.

## Formato de cada entrada

```
## <data> — <título curto>
O que mudou na coordenação local:
Quem pediu/autorizou:
```

## Entradas

## 2026-09-17 — Criação da infraestrutura local de coordenação
Criados `.agents/STATE.md`, `TASKS.md`, `DECISIONS.md`, `BLOCKERS.md`, `CLAUDE_REPORT.md`,
`CODEX_REPORT.md`, `WORK_REPORT.md`, `HANDOFF.md`, `CHANGELOG_AGENT.md` e `locks/.gitkeep`, mais
a regra complementar `.claude/rules/agents-local-coordination.md`. Nenhum arquivo de produto,
CLAUDE.md, workflow, dependência ou segredo foi alterado. Nenhum commit, push ou merge foi
realizado nesta ação. Solicitado pelo usuário nesta sessão.
