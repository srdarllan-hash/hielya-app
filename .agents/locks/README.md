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
- Owner: work | claude | codex
- Branch: <nome exato da branch onde o lock se aplica>
- Caminhos permitidos: <lista de caminhos relativos ao repositório que este owner pode editar>
- Início: <data/hora ISO 8601 com fuso>
- Expiração: <data/hora ISO 8601 com fuso — obrigatória, sem "indefinido">
- Estado: ativo | expirado | liberado
```

Campos livres em prosa não são aceitos; usar exatamente esses sete rótulos, nesta ordem.

## Regras

1. **Um lock por task ID.** Antes de criar um lock, verificar se já existe outro arquivo em
   `.agents/locks/` cobrindo os mesmos caminhos com `Estado: ativo` e `Owner` diferente.
2. **Nenhum agente edita um caminho coberto por lock ativo de outro owner.** Isso vale para
   Claude Code, Codex CLI e para o papel Work. Se o caminho necessário estiver sob lock alheio
   ativo, o agente para e registra o conflito em `.agents/BLOCKERS.md`, em vez de editar.
3. **Somente o papel Work remove ou muda o `Estado` de um lock para `liberado`**, e apenas após:
   - confirmar que o escritor (`Owner`) efetivamente terminou (relatório correspondente em
     `.agents/CLAUDE_REPORT.md` ou `.agents/CODEX_REPORT.md`, ou handoff explícito em
     `.agents/HANDOFF.md`); ou
   - a data em `Expiração` já ter passado, e essa expiração ser então documentada explicitamente
     no próprio arquivo de lock (`Estado: expirado`, com a data real de constatação) antes de
     qualquer novo lock ser aberto para os mesmos caminhos.
4. **Owner não remove o próprio lock por si só quando outro agente depende dele** — o
   encerramento passa pelo Work conforme a regra 3, para manter um único ponto de decisão sobre
   liberação.
5. **Caminhos permitidos não podem ser vazios nem "todo o repositório".** Declarar caminhos
   específicos, como no contrato de tarefa descrito em `docs/automation/AGENT_PROTOCOL.md`.
6. **Um lock expirado sem uso não libera automaticamente os caminhos.** Expiração sem
   confirmação ainda exige a documentação da regra 3 antes de qualquer outro agente assumir os
   mesmos caminhos.

## Relação com `.agents/TASKS.md`

Toda tarefa em `.agents/TASKS.md` que tenha um lock ativo deve referenciar o mesmo `Task ID` e
`Owner` usados no arquivo de lock correspondente. Os dois documentos devem permanecer
consistentes; se divergirem, tratar como bloqueio e registrar em `.agents/BLOCKERS.md` até
reconciliar.

## Arquivos de lock

Nenhum lock ativo no momento desta criação. `.gitkeep` mantém este diretório versionável mesmo
vazio.
