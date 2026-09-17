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

Nenhum registrado no momento desta criação.
