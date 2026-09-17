# Handoff entre sessões/agentes

Notas curtas para a próxima sessão (Claude Code, Codex CLI ou humana) retomar o trabalho sem
depender de memória de conversa, no mesmo espírito da
`docs/checkpoints/HIELYA_CHECKPOINT_POLICY.md` (nenhuma decisão relevante deve viver só na
conversa). Este arquivo é local e informal; não substitui um checkpoint oficial quando a mudança
for estrutural — nesse caso, o checkpoint em `docs/checkpoints/` continua obrigatório.

Handoff de lease automatizada exige, segundo o protocolo, término verificado do escritor
anterior; como a automação não está ativa, todo handoff aqui é apenas comunicação entre sessões
locais, não uma transição de estado autoritativa.

## Formato de cada entrada

```
## <data/hora> — de <quem> para <quem>
O que foi feito:
O que falta:
Onde parar / próximo comando a rodar:
Riscos conhecidos no momento do handoff:
```

## Entradas

## 2026-09-17T19:43:58Z — de Claude Code (session claude-20260917T194358Z-infra-locks-hardening) para próxima sessão
O que foi feito: aplicadas as duas correções apontadas pela revisão do Codex sobre os locks
locais — (1) `Session ID` obrigatório em cada lock, com sobreposição de caminhos bloqueada entre
quaisquer sessões ativas, inclusive do mesmo owner; (2) expiração deixou de liberar lock
sozinha (`Estado: stale/blocked`), liberação exige Work registrar evidência de término. Alterados
`.agents/locks/README.md`, `.claude/rules/agents-local-coordination.md`, `.agents/TASKS.md`,
`.agents/HANDOFF.md`, `.agents/CLAUDE_REPORT.md`, `.agents/CHANGELOG_AGENT.md`, e criado
`.agents/locks/INFRA-LOCKS-HARDENING.lock.md`.
O que falta: lock `INFRA-LOCKS-HARDENING` ainda `Estado: ativo` — Work deve fechá-lo após
confirmar término (esta mesma entrada serve de evidência de término, já que a tarefa terminou
nesta sessão sem handoff pendente de código em andamento).
Onde parar / próximo comando a rodar: nenhum comando pendente; próximo passo é o commit local
`chore(agents): harden local task locks` já solicitado pelo usuário.
Riscos conhecidos no momento do handoff: nenhum arquivo de código/produto tocado; sem push/merge
realizado.

## 2026-09-17T19:54:36Z — de Claude Code (session claude-20260917T195436Z-deadlock-fix) para próxima sessão
O que foi feito: corrigido o deadlock que a revisão do Codex encontrou no commit `2e2e39f`
(achado 3, registrado em `.agents/CODEX_REPORT.md`). `.agents/locks/README.md` e
`.claude/rules/agents-local-coordination.md` agora separam **caminhos de trabalho** (protegidos
por lock) de **metadados de coordenação** (`TASKS.md`, qualquer `locks/*.lock.md`, `BLOCKERS.md`,
`HANDOFF.md`, os três `*_REPORT.md`, `CHANGELOG_AGENT.md` — nunca protegidos por lock, editáveis
pelo papel autorizado a qualquer momento). Estados renomeados sem ambiguidade: `active`,
`ready-for-review`, `stale`, `blocked`, `released`. O lock `INFRA-LOCKS-HARDENING` foi fechado
para `released` (evidência em `.agents/WORK_REPORT.md`), preservando seu conteúdo original e
apenas anexando o histórico de transição. Criado o lock `INFRA-LOCK-DEADLOCK-FIX` para esta
própria tarefa, cobrindo somente `.agents/locks/README.md` e
`.claude/rules/agents-local-coordination.md` como caminhos de trabalho.
O que falta: lock `INFRA-LOCK-DEADLOCK-FIX` está `ready-for-review` — uma futura sessão de Work
(ou uma revisão Codex real) deve confirmar e movê-lo para `released` antes de reabrir os dois
arquivos de especificação como caminhos de trabalho de outra tarefa.
Onde parar / próximo comando a rodar: nenhum comando pendente; próximo passo é o commit local
`chore(agents): resolve coordination lock deadlock` já solicitado pelo usuário.
Riscos conhecidos no momento do handoff: nenhum arquivo de código/produto tocado; sem push/merge
realizado. A "revisão do Codex" citada nesta e em entradas anteriores foi conduzida pela própria
sessão Claude Code exercendo esse papel a pedido do usuário, não por uma execução real do Codex
CLI — ver a ressalva explícita em `.agents/CODEX_REPORT.md`.
