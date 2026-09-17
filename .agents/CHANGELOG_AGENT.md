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

## 2026-09-17 — Hardening dos locks: session_id obrigatório e não liberação por expiração
O que mudou na coordenação local: `.agents/locks/README.md` passou a exigir `Session ID` único
por lock (oitavo campo obrigatório) e a proibir sobreposição de caminhos entre quaisquer sessões
ativas, mesmo do mesmo `Owner`. O `Estado` de lock `expirado` foi substituído por
`stale/blocked`: uma expiração não libera mais o lock por si só — apenas o papel Work pode mover
para `liberado`, e somente citando evidência escrita de término do escritor anterior
(`.agents/CLAUDE_REPORT.md`, `.agents/CODEX_REPORT.md` ou `.agents/HANDOFF.md`); sem essa
evidência, o impasse vai para `.agents/BLOCKERS.md`. `.claude/rules/agents-local-coordination.md`
e `.agents/TASKS.md` foram atualizados para refletir `Session ID` e a nova regra de liberação.
Criado `.agents/locks/INFRA-LOCKS-HARDENING.lock.md` como lock desta própria tarefa (Owner
`claude`, Session ID `claude-20260917T194358Z-infra-locks-hardening`).
Quem pediu/autorizou: usuário nesta sessão, respondendo a duas correções apontadas pela revisão
do Codex sobre a entrega anterior (commit `bb7c8cd`).

## 2026-09-17 — Criação da infraestrutura local de coordenação
Criados `.agents/STATE.md`, `TASKS.md`, `DECISIONS.md`, `BLOCKERS.md`, `CLAUDE_REPORT.md`,
`CODEX_REPORT.md`, `WORK_REPORT.md`, `HANDOFF.md`, `CHANGELOG_AGENT.md` e `locks/.gitkeep`, mais
a regra complementar `.claude/rules/agents-local-coordination.md`. Nenhum arquivo de produto,
CLAUDE.md, workflow, dependência ou segredo foi alterado. Nenhum commit, push ou merge foi
realizado nesta ação. Solicitado pelo usuário nesta sessão.
