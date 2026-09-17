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

## 2026-09-17 — Correção do deadlock de fechamento de lock (caminhos de trabalho × metadados)
O que mudou na coordenação local: `.agents/locks/README.md` e
`.claude/rules/agents-local-coordination.md` foram reescritos para separar **caminhos de
trabalho** (declarados em `Caminhos de trabalho` de um lock, exclusivos da sessão dona) de
**metadados de coordenação** (`TASKS.md`, qualquer `locks/*.lock.md`, `BLOCKERS.md`,
`HANDOFF.md`, os três `*_REPORT.md`, `CHANGELOG_AGENT.md`), que nunca podem ser declarados como
caminho de trabalho e são editados diretamente pelo papel autorizado numa transição documentada
(Claude registra implementação/entrega e vai até `ready-for-review`; Codex só registra revisão em
`CODEX_REPORT.md`; somente Work grava `stale`, `blocked` ou `released`, sempre citando evidência).
Estados renomeados sem ambiguidade: `active`, `ready-for-review`, `stale`, `blocked`, `released`
— todos exceto `released` preservam a proteção dos caminhos de trabalho; expiração nunca libera
sozinha. Isso resolve o deadlock relatado pela revisão do Codex ao commit `2e2e39f` (achado 3,
registrado em `.agents/CODEX_REPORT.md`): antes, um lock podia incluir seu próprio arquivo e
`BLOCKERS.md` entre os caminhos protegidos, e nenhum papel — nem Work, nem o owner — tinha
autoridade para fechá-lo. O lock `INFRA-LOCKS-HARDENING` foi fechado para `released` (evidência
em `.agents/WORK_REPORT.md`), preservando integralmente seu conteúdo original e apenas anexando o
histórico de transição. Criado o lock `INFRA-LOCK-DEADLOCK-FIX` para esta tarefa.
Quem pediu/autorizou: usuário nesta sessão, após revisão (conduzida por esta mesma sessão
exercendo o papel Codex a pedido do usuário — ver ressalva em `.agents/CODEX_REPORT.md`) apontar
o deadlock no commit `2e2e39f`.

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
