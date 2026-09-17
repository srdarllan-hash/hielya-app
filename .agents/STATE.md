# Estado de coordenação local de agentes

Este arquivo é infraestrutura **local** de coordenação entre sessões (Claude Code, Codex CLI,
sessões humanas). Ele não é o controlador determinístico, o ledger persistente nem o mecanismo
de lease/label descritos em `docs/automation/AGENT_PROTOCOL.md`. Não concede autoridade, não
substitui aprovação do proprietário e não ativa automação. Em caso de conflito, prevalece a
sequência canônica: `docs/checkpoints/HIELYA_CHECKPOINT_POLICY.md` → `docs/checkpoints/INDEX.md`
→ checkpoint de maior versão → validação contra o GitHub ao vivo.

## Workspace

- Workspace ativo único: `C:\Users\HP\Projects\hielya-app`.
- `G:\Meu Drive\HIELYA\hielya-app` é **apenas backup**. Nunca ler esse caminho como fonte de
  verdade nem escrever nele a partir de uma tarefa multiagente.

## Snapshot (atualizar a cada mudança relevante de estado, sem apagar histórico — ver CHANGELOG_AGENT.md)

| Campo | Valor |
|---|---|
| Última atualização | 2026-09-17 |
| Branch de trabalho local | `hielya/session-httponly-cookie` |
| Base declarada | `main` (validar SHA exato contra GitHub antes de qualquer mudança estrutural) |
| Tarefa ativa | Nenhuma (infraestrutura de coordenação sendo criada) |
| Escritor atual da branch leased | Nenhum — nenhuma automação ativa |
| Automação (`AGENT_PROTOCOL.md`) | `FOUNDATION_CANDIDATE / AUTOMATION_NOT_ACTIVATED` |

## Regra de atualização

- Não sobrescrever o histórico deste arquivo de forma que perca rastreabilidade: para mudanças
  de estado relevantes, registre também uma linha em `CHANGELOG_AGENT.md`.
- Antes de declarar qualquer estado aqui, validar contra o checkpoint vigente e o GitHub ao vivo
  quando a tarefa envolver mudança estrutural.
