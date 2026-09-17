# Locks locais de coordenação entre agentes

Mecanismo **local e informativo** para evitar que duas sessões editem os mesmos caminhos ao mesmo
tempo neste workspace. Isto não é o lease/ledger persistente com compare-and-swap atômico exigido
por `docs/automation/AGENT_PROTOCOL.md` para automação real — é uma convenção de arquivo que
agentes locais (Claude Code, Codex CLI, Work) devem respeitar por disciplina, e que não impede
tecnicamente uma escrita concorrente. Não substitui proteção server-side de branch, não concede
autoridade e não implica automação ativada.

> **Correção de projeto (2026-09-17):** a versão anterior deste arquivo causava um deadlock,
> apontado pela revisão do Codex ao commit `2e2e39f`: um lock podia incluir, entre seus próprios
> "caminhos permitidos", o arquivo do próprio lock e `BLOCKERS.md`. Como a regra também proibia o
> papel Work de editar caminhos cobertos por lock de outra sessão, ninguém tinha autoridade para
> jamais fechar ou sequer marcar como obsoleto um lock nessas condições. Esta versão resolve isso
> separando **caminhos de trabalho** (protegidos pelo lock) de **metadados de coordenação**
> (nunca protegidos por lock; editáveis apenas pelo papel autorizado, numa transição
> documentada). Ver evidência completa em `.agents/CODEX_REPORT.md` e
> `.agents/locks/INFRA-LOCKS-HARDENING.lock.md`.

## As duas categorias de caminhos

### 1. Caminhos de trabalho (protegidos pelo lock)

São os arquivos que a tarefa está de fato produzindo ou alterando — código, documentação de
produto, contratos, ou, quando a própria tarefa é evoluir o mecanismo de coordenação (como esta
correção), os arquivos de especificação em si: `.agents/locks/README.md` e
`.claude/rules/agents-local-coordination.md`. Um lock só pode declarar caminhos de trabalho em
`Caminhos de trabalho`; nunca um caminho da lista de metadados abaixo.

### 2. Metadados de coordenação (nunca protegidos por lock)

Estes caminhos **não podem aparecer** em `Caminhos de trabalho` de nenhum lock. Eles são
editados diretamente pelo papel autorizado, no momento da transição documentada correspondente
(ver "Autorização por papel" abaixo), independentemente de qualquer lock ativo, stale ou blocked
que exista no momento:

- `.agents/TASKS.md`
- `.agents/locks/<task-id>.lock.md` — qualquer arquivo de lock, inclusive o próprio arquivo que
  está sendo fechado
- `.agents/BLOCKERS.md`
- `.agents/HANDOFF.md`
- `.agents/CLAUDE_REPORT.md`, `.agents/CODEX_REPORT.md`, `.agents/WORK_REPORT.md`
- `.agents/CHANGELOG_AGENT.md` — mesma categoria dos relatórios: registro append-only da própria
  coordenação, não um caminho de trabalho de nenhuma tarefa

Ao editar um metadado compartilhado, cada papel só acrescenta ou edita a própria entrada/seção;
nunca reescreve a entrada de outra sessão sem ser a transição de fechamento que este documento
autoriza explicitamente (fechamento de lock pelo Work).

## Formato obrigatório de um lock

Cada lock é um arquivo `.agents/locks/<task-id>.lock.md` com este conteúdo:

```
# Lock: <task-id>

- Task ID: <Issue #NNN ou identificador local único>
- Session ID: <identificador único desta execução/sessão específica, nunca reaproveitado>
- Owner: work | claude | codex
- Branch: <nome exato da branch onde o lock se aplica>
- Caminhos de trabalho: <lista de caminhos — nunca um item da lista de metadados acima>
- Início: <data/hora ISO 8601 com fuso>
- Expiração: <data/hora ISO 8601 com fuso — obrigatória, sem "indefinido">
- Estado: active | ready-for-review | stale | blocked | released
```

Campos livres em prosa não são aceitos; usar exatamente esses oito rótulos, nesta ordem.

`Session ID` identifica a execução específica (uma instância de Claude Code, uma execução do
Codex CLI, uma sessão de Work), não apenas o tipo de agente. Duas execuções do mesmo `Owner` têm
`Session ID` diferentes e são tratadas como sessões independentes para todos os efeitos de
sobreposição abaixo. Nunca reusar um `Session ID` já emitido, mesmo depois de o lock
correspondente ser `released`.

## Estados, sem ambiguidade

| Estado | Significado | Protege os caminhos de trabalho? |
|---|---|---|
| `active` | A sessão dona está editando os caminhos de trabalho declarados. | Sim |
| `ready-for-review` | A sessão dona terminou de editar e registrou a entrega; aguarda revisão/fechamento. | Sim |
| `stale` | A `Expiração` passou sem transição para `ready-for-review` ou `released`, e Work constatou isso. | Sim |
| `blocked` | Work encontrou um impasse (conflito, falta de evidência, divergência) e o registrou em `BLOCKERS.md`. | Sim |
| `released` | Work confirmou o término (ou resolveu o bloqueio) e fechou o lock. | **Não** — único estado que libera os caminhos de trabalho |

`stale` e `blocked` **não são estados intermediários automáticos**: alguém precisa constatá-los e
gravá-los (ver Regra 6). Enquanto o campo `Estado` continuar `active` ou `ready-for-review` no
arquivo, ele conta como tal para efeito de bloqueio de sobreposição, mesmo que a `Expiração` já
tenha passado no relógio.

## Autorização por papel

| Papel | Pode | Não pode |
|---|---|---|
| **Claude** (dono do lock) | Criar o lock; editar os `Caminhos de trabalho` declarados; registrar implementação e entrega em `CLAUDE_REPORT.md`; mover o próprio lock de `active` para `ready-for-review` | Mover para `stale`, `blocked` ou `released`; fechar/remover o lock; editar caminhos de trabalho de lock de outra sessão |
| **Codex** | Registrar revisão em `CODEX_REPORT.md` a qualquer momento, independentemente do `Estado` do lock | Alterar o `Estado` do lock; editar caminhos de trabalho de qualquer lock que não seja o seu |
| **Work** | Mover qualquer lock para `stale`, `blocked` ou `released`; remover/arquivar o arquivo de lock após `released` | Mover para `released` sem citar evidência de término; liberar caminhos de trabalho sem estar em `released` |

Como o arquivo do próprio lock, `BLOCKERS.md`, `HANDOFF.md` e os relatórios são metadados (nunca
caminhos de trabalho protegidos), Work sempre pode editá-los para registrar uma transição, mesmo
enquanto o lock permanece `active`, `stale` ou `blocked` — isto é exatamente o que resolve o
deadlock anterior.

## Regras

1. **Um lock por task ID, um `Session ID` único por lock.** Antes de criar um lock, verificar se
   já existe outro arquivo em `.agents/locks/` com `Estado` em `active`, `ready-for-review`,
   `stale` ou `blocked` cobrindo os mesmos caminhos de trabalho.
2. **Nenhuma sobreposição de caminhos de trabalho entre locks em `active`, `ready-for-review`,
   `stale` ou `blocked`, inclusive do mesmo owner.** Duas sessões do mesmo tipo de agente (duas
   sessões Claude Code, por exemplo) precisam de caminhos de trabalho disjuntos ou aguardar o
   lock existente chegar a `released`.
3. **Nenhum agente edita um caminho de trabalho coberto por lock de outra sessão** enquanto esse
   lock não estiver `released`. Isso vale para Claude Code, Codex CLI e para o papel Work. Se o
   caminho necessário estiver sob lock alheio não liberado, o agente para e registra o conflito
   em `.agents/BLOCKERS.md`, em vez de editar.
4. **Metadados de coordenação nunca entram em `Caminhos de trabalho`.** Um lock que declarar um
   caminho da lista de metadados é inválido; corrigir antes de considerá-lo criado.
5. **Expiração nunca libera um lock sozinha.** Passar da `Expiração` não muda o `Estado`
   automaticamente. Enquanto ninguém gravar `stale`, `blocked` ou `released` no arquivo, os
   caminhos de trabalho continuam protegidos como se o lock estivesse plenamente `active`.
6. **Somente Work grava `stale`, `blocked` ou `released`**, e sempre citando evidência no próprio
   arquivo de lock ou em `WORK_REPORT.md`/`BLOCKERS.md`:
   - `stale`: citar que a `Expiração` já passou e que não há entrega (`CLAUDE_REPORT.md`) nem
     revisão (`CODEX_REPORT.md`) registrando conclusão.
   - `blocked`: citar o impasse específico, registrado em `.agents/BLOCKERS.md`.
   - `released`: citar a entrada de `CLAUDE_REPORT.md`/`CODEX_REPORT.md`/`HANDOFF.md` que
     comprova o término do escritor, ou a resolução do bloqueio em `BLOCKERS.md`.
   **Sem essa evidência, Work não libera** — mantém o estado anterior (`stale` ou `blocked`) e
   registra o impasse em `.agents/BLOCKERS.md` (caminhos presos, motivo da falta de evidência,
   quem precisa se manifestar).
7. **Owner não se autolibera.** Claude não move o próprio lock para `stale`, `blocked` ou
   `released` — apenas até `ready-for-review`. O fechamento é sempre um ato de Work.
8. **Caminhos de trabalho não podem ser vazios nem "todo o repositório".** Declarar caminhos
   específicos, como no contrato de tarefa descrito em `docs/automation/AGENT_PROTOCOL.md`.

## Relação com `.agents/TASKS.md`

Toda tarefa em `.agents/TASKS.md` com lock ativo deve referenciar o mesmo `Task ID`, `Owner` e
`Session ID` do arquivo de lock correspondente, e o `Estado` da tarefa deve ser consistente com o
`Estado` do lock (`in-progress`/`active`, `in-review`/`ready-for-review` ou `stale`/`blocked`,
`done`/`released`). Divergência é bloqueio — registrar em `.agents/BLOCKERS.md` até reconciliar.

## Arquivos de lock

- `INFRA-LOCKS-HARDENING.lock.md` — `released`. Fechado por Work com evidência da revisão Codex
  ao commit `2e2e39f` e da correção subsequente; ver o próprio arquivo e `.agents/WORK_REPORT.md`.
- `INFRA-LOCK-DEADLOCK-FIX.lock.md` — Owner `claude`, Session ID
  `claude-20260917T195436Z-deadlock-fix`. Cobre exatamente `.agents/locks/README.md` e
  `.claude/rules/agents-local-coordination.md`, os dois arquivos de especificação corrigidos
  nesta tarefa.

`.gitkeep` mantém este diretório versionável mesmo quando não houver lock ativo.
