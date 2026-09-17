# Locks locais de coordenação entre agentes

Mecanismo **local e informativo** para evitar que dois agentes editem os mesmos caminhos ao
mesmo tempo neste workspace. Isto não é o lease/ledger persistente com compare-and-swap atômico
exigido por `docs/automation/AGENT_PROTOCOL.md` para automação real — é apenas uma convenção de
arquivo que agentes locais (Claude Code, Codex CLI, Work) devem respeitar por disciplina, e que
não impede tecnicamente uma escrita concorrente. Não substitui proteção server-side de branch,
não concede autoridade e não implica automação ativada.

## Formato obrigatório de um lock

Cada lock é um arquivo `.agents/locks/<task-id>.lock.md` com este conteúdo:

```
# Lock: <task-id>

- Task ID: <Issue #NNN ou identificador local único>
- Session ID: <identificador único desta execução/sessão específica, nunca reaproveitado>
- Owner: work | claude | codex
- Branch: <nome exato da branch onde o lock se aplica>
- Caminhos permitidos: <lista de caminhos relativos ao repositório que este owner pode editar>
- Início: <data/hora ISO 8601 com fuso>
- Expiração: <data/hora ISO 8601 com fuso — obrigatória, sem "indefinido">
- Estado: ativo | stale/blocked | liberado
```

Campos livres em prosa não são aceitos; usar exatamente esses oito rótulos, nesta ordem.

`Session ID` identifica a execução específica (uma instância de Claude Code, uma execução do
Codex CLI, uma sessão de Work), não apenas o tipo de agente. Duas execuções do mesmo `Owner`
(por exemplo, duas sessões Claude Code abertas ao mesmo tempo) têm `Session ID` diferentes e são
tratadas como sessões independentes para todos os efeitos de sobreposição abaixo. Nunca reusar um
`Session ID` já emitido, mesmo depois de o lock correspondente ser liberado.

## Regras

1. **Um lock por task ID**, e um `Session ID` único por lock. Antes de criar um lock, verificar
   se já existe outro arquivo em `.agents/locks/` cobrindo os mesmos caminhos.
2. **Nenhuma sobreposição de caminhos entre quaisquer sessões ativas, inclusive do mesmo
   owner.** Antes de criar um lock, comparar `Caminhos permitidos` contra todo lock existente com
   `Estado: ativo`. Se houver qualquer interseção de caminhos com outro `Session ID` — mesmo que
   o `Owner` seja idêntico (duas sessões Claude Code, por exemplo) — o novo lock não pode ser
   criado com esses caminhos. Isso vale mesmo dentro da mesma sessão lógica de trabalho: uma
   segunda janela/execução do mesmo agente é uma sessão distinta e precisa de caminhos
   disjuntos ou de aguardar a liberação do lock existente.
3. **Nenhum agente edita um caminho coberto por lock ativo de outra sessão**, mesmo que o
   `Owner` seja o mesmo tipo de agente. Isso vale para Claude Code, Codex CLI e para o papel
   Work. Se o caminho necessário estiver sob lock alheio ativo, o agente para e registra o
   conflito em `.agents/BLOCKERS.md`, em vez de editar.
4. **A expiração nunca libera um lock por si só.** Quando `Expiração` passa sem o lock ter sido
   fechado pela sessão dona, o estado correto é `Estado: stale/blocked` — não `liberado` e não
   simples remoção do arquivo. Isso significa que os caminhos permanecem bloqueados para
   qualquer outra sessão até a regra 5 ser cumprida.
5. **Somente o papel Work move um lock de `stale/blocked` (ou `ativo`) para `liberado`, ou
   remove o arquivo**, e apenas após confirmar por escrito o término do escritor anterior:
   - localizar e citar, no próprio arquivo de lock, a evidência do término (entrada
     correspondente em `.agents/CLAUDE_REPORT.md`, `.agents/CODEX_REPORT.md` ou handoff explícito
     em `.agents/HANDOFF.md`); então
   - só então mudar `Estado` para `liberado`.
   Se não houver confirmação de término disponível, o lock **permanece bloqueado** — Work não
   libera por presunção de expiração, e deve registrar o impasse em `.agents/BLOCKERS.md`
   (tarefa/branch afetada, caminhos presos, motivo pelo qual não há confirmação, e quem
   precisa se manifestar para destravar).
6. **Owner não remove o próprio lock por si só quando outro agente depende dele** — o
   encerramento passa pelo Work conforme a regra 5, para manter um único ponto de decisão sobre
   liberação.
7. **Caminhos permitidos não podem ser vazios nem "todo o repositório".** Declarar caminhos
   específicos, como no contrato de tarefa descrito em `docs/automation/AGENT_PROTOCOL.md`.

## Relação com `.agents/TASKS.md`

Toda tarefa em `.agents/TASKS.md` que tenha um lock ativo deve referenciar o mesmo `Task ID`,
`Owner` e `Session ID` usados no arquivo de lock correspondente. Os dois documentos devem
permanecer consistentes; se divergirem, tratar como bloqueio e registrar em `.agents/BLOCKERS.md`
até reconciliar.

## Arquivos de lock

- `INFRA-LOCKS-HARDENING.lock.md` — Owner `claude`, Session ID
  `claude-20260917T194358Z-infra-locks-hardening`, Estado `ativo`. Cobre exatamente os arquivos
  de infraestrutura local tocados por esta tarefa (ver `.agents/TASKS.md`).

`.gitkeep` mantém este diretório versionável mesmo quando não houver lock ativo.
