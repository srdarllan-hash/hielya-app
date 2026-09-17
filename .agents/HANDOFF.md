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

Nenhuma entrada registrada ainda. Este arquivo foi criado como parte da infraestrutura local de
coordenação em `.agents/`.
