# Bloqueios locais de coordenação entre agentes

Bloqueios operacionais que impedem uma sessão local (Claude Code, Codex CLI, humano) de avançar
uma tarefa multiagente. Isto é distinto de `docs/KNOWN_DEBT.md`, que consolida dívidas e lacunas
de produto/plataforma com critério de encerramento próprio. Um bloqueio de produto/arquitetura
deve ser registrado lá, não aqui.

## Formato de cada entrada

```
### <data> — <título curto>
Tarefa/branch afetada:
Descrição do bloqueio:
Quem pode resolver (owner | Work | Claude Code | Codex):
Estado: aberto | resolvido
Resolução (quando aplicável):
```

## Bloqueios permanentes herdados (referência, não editar aqui — ver fonte canônica)

- Nenhuma automação real está ativada (`docs/automation/AGENT_PROTOCOL.md`,
  `docs/automation/ACTIVATION.md`): sem controlador determinístico, sem ledger persistente, sem
  despacho de provedor. Uma sessão local não deve simular essas transições.
- Merge de qualquer branch requer aprovação separada do proprietário.
- Ativação comercial real em produção permanece bloqueada (ver `docs/CONSTRAINTS.md` e
  `docs/KNOWN_DEBT.md`).

## Bloqueios ativos desta coordenação local

Nenhum bloqueio ativo no momento.

## Bloqueios resolvidos (histórico)

### 2026-09-17 — Deadlock de fechamento de lock (design da v1 do mecanismo de locks)
Tarefa/branch afetada: `INFRA-LOCKS-HARDENING`, branch `hielya/session-httponly-cookie`.
Descrição do bloqueio: `Caminhos permitidos` do lock `INFRA-LOCKS-HARDENING.lock.md` incluía o
próprio arquivo de lock e `.agents/BLOCKERS.md`. A Regra 3 então vigente em
`.agents/locks/README.md` proibia qualquer agente, inclusive Work, de editar caminho coberto por
lock ativo de outra sessão; a Regra 6 proibia o owner de se autoliberar. Resultado: nenhum papel
tinha autoridade para fechar (ou sequer marcar `expirado`/`stale`) esse lock — deadlock
permanente. Identificado por revisão registrada em `.agents/CODEX_REPORT.md`.
Quem pode resolver: Claude (correção de especificação).
Estado: resolvido.
Resolução: tarefa `INFRA-LOCK-DEADLOCK-FIX` reescreveu `.agents/locks/README.md` e
`.claude/rules/agents-local-coordination.md` separando **caminhos de trabalho** (protegidos por
lock) de **metadados de coordenação** (nunca protegidos por lock; editáveis pelo papel autorizado
a qualquer momento). O lock `INFRA-LOCKS-HARDENING` foi então fechado para `released` por Work,
com evidência em `.agents/WORK_REPORT.md`.
