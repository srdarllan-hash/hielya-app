# Coordenação local multiagente

Regra complementar. Não introduz autorização de produto nem substitui a sequência obrigatória do
`CLAUDE.md` (política de checkpoints → INDEX → checkpoint de maior versão → validação contra o
GitHub ao vivo) nem o protocolo em `docs/automation/AGENT_PROTOCOL.md`. Em conflito, esses dois
prevalecem sobre este arquivo.

## Workspace

- Único workspace ativo para trabalho multiagente: `C:\Users\HP\Projects\hielya-app`.
- `G:\Meu Drive\HIELYA\hielya-app` é somente backup. Nunca tratá-lo como fonte de verdade,
  nunca ler estado de lá para decidir uma tarefa, nunca escrever lá a partir de uma tarefa
  multiagente.

## Antes de qualquer tarefa explicitamente multiagente

Antes de iniciar, retomar ou revisar uma tarefa que envolva mais de um agente (Claude Code,
Codex CLI, ou coordenação entre sessões), executar nesta ordem, além da sequência já exigida
pelo `CLAUDE.md`:

1. `.agents/STATE.md` — snapshot local de branch/tarefa/escritor atual.
2. `.agents/TASKS.md` — o que já está em andamento e qual owner/lock cobre cada tarefa, para
   evitar trabalho duplicado ou escrita concorrente na mesma branch.
3. `.agents/DECISIONS.md` — decisões operacionais de coordenação já tomadas, para não repetir ou
   contradizer uma decisão anterior sobre como os agentes dividem o trabalho.
4. `.agents/BLOCKERS.md` — bloqueios locais abertos e bloqueios permanentes herdados.
5. `.agents/HANDOFF.md` — a entrada mais recente, se houver, para continuar de onde a sessão
   anterior parou.
6. `git status --short --branch` — estado real da branch e do working tree no momento exato de
   começar, não o estado presumido pelos arquivos de coordenação.
7. `git diff` (e `git diff --staged` se houver algo staged) — inspecionar toda alteração
   presente antes de tocar qualquer arquivo, e verificar explicitamente se alguma alteração
   pertence a uma sessão/lock diferente da sessão atual (ver `.agents/locks/README.md` e os
   campos "Owner"/"Lock" em `.agents/TASKS.md`). Se houver alteração de outra sessão cujo lock
   não esteja `Estado: liberado` com evidência de término registrada (expiração sozinha não
   conta), parar e não editar nada — reportar o conflito em vez de sobrescrever.

Ao concluir ou pausar um trecho relevante de trabalho multiagente, registrar:

- em `.agents/CLAUDE_REPORT.md`, `.agents/CODEX_REPORT.md` ou `.agents/WORK_REPORT.md`, conforme
  o papel que executou o trabalho;
- em `.agents/HANDOFF.md`, uma nota curta para a próxima sessão, quando o trabalho não estiver
  finalizado;
- em `.agents/DECISIONS.md`, apenas decisões operacionais sobre a própria coordenação (não
  decisões de produto/arquitetura, que continuam em `docs/decisions/`);
- em `.agents/CHANGELOG_AGENT.md`, mudanças feitas à própria infraestrutura de coordenação.

## Limites

- Estes arquivos são coordenação local e informativa. Eles não são o controlador determinístico,
  o ledger persistente nem os labels de estado descritos em `docs/automation/AGENT_PROTOCOL.md`,
  e não devem ser tratados como prova de autorização, aprovação do proprietário ou estado
  mergeado.
- Nunca registrar aqui autorização de merge, de produção ou de mudança estrutural — isso
  permanece exclusivamente nos checkpoints oficiais (`docs/checkpoints/`) e na aprovação do
  proprietário.
- Uma sessão local não deve escrever na mesma branch já leased por um executor automático (ver
  `docs/automation/AGENT_PROTOCOL.md`), mesmo que os arquivos em `.agents/` sugiram que a branch
  está livre — a checagem de lease automatizada, quando existir, é a fonte de verdade.
- Um agente não edita caminhos cobertos por um lock ativo (`.agents/locks/README.md`) de outra
  sessão — inclusive quando o `Owner` é o mesmo tipo de agente (duas sessões Claude Code, por
  exemplo), pois a unidade de exclusão é o `Session ID`, não o `Owner`. Antes de abrir um novo
  lock, comparar seus `Caminhos permitidos` contra todo lock `Estado: ativo` existente e recusar
  qualquer sobreposição.
- Expiração de um lock nunca o libera sozinha. Um lock expirado passa para
  `Estado: stale/blocked` e os caminhos continuam bloqueados. Só o papel Work move um lock para
  `liberado`, e apenas depois de citar, no próprio arquivo de lock, a evidência escrita do
  término do escritor anterior (`.agents/CLAUDE_REPORT.md`, `.agents/CODEX_REPORT.md` ou
  `.agents/HANDOFF.md`). Sem essa confirmação, o lock permanece bloqueado e o impasse deve ser
  registrado em `.agents/BLOCKERS.md` — nunca liberar por presunção de expiração.
