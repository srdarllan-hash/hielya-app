# HIELYA CHECKPOINT v8.8 — AUTOMATION_PROTOCOL_V1_FOUNDATION_CANDIDATE

Registro: 2026-09-08 11:24 UTC (12:24 Europe/Dublin).
Issue: #59. Branch: hielya/automation-protocol-v1.
Status: candidato; sem merge; automação não ativada.

## Resumo e autorização

O proprietário solicitou iniciar a colaboração Work ↔ Claude Code sem transportar respostas manualmente. A primeira entrega prepara documentação, contratos e um guardrail determinístico, sem alterar o comportamento do aplicativo. O registro escrito pelo agente não se torna aprovação humana independente. Merge, ativação do pipeline e Gate comercial permanecem decisões separadas.

## Base e proveniência

Main consultada: c3a1e53c8638d476721e0d5b1442f36b0326a861; árvore 722277629fb15f71734972857771b65cc88226af. O checkpoint incorporado mais recente é v8.5. PR #57 usa head 65bcf82d53935f11dbd1e8b3a2c0284bd9cdbe5d e contém v8.6; PR #58 usa head 0cc8e9adabe83c5b2cecb79d060f60df1d422075 e contém v8.7. Ambos foram consultados como OPEN/DRAFT/bloqueados e não foram modificados. Esses candidatos não são incorporados por esta branch.

A consulta da branch retornou protected=false; a consulta de rulesets retornou []. Esta entrega não configura proteções. Nenhum novo estado de produção é inferido a partir de documentação.

## Decision Log e documentos propostos

- Work planeja/revisa; Claude Code é o único escritor da tarefa; um controlador determinístico deverá validar transições. O controlador ainda não existe.
- Labels são projeção visual, não autorização. Identidade do proprietário usada por agentes não prova aprovação humana.
- Contrato de tarefa e pareceres identificam base/head e digest; CI completo e proveniência devem ser verificados fora do JSON Schema.
- Uma tarefa ativa e um escritor inicialmente; máximo duas rodadas automáticas de correção, sem reset por commit/rerun; falha/desacordo bloqueia.
- Nenhum auto-merge, deploy, produção, SMS/pagamento real, segredo ou ampliação de escopo.
- Guardrail compara objetos Git: histórico imutável, INDEX append-only, checkpoint canônico novo e migration 0001 estável. Enforcement em CI permanece pendente.

Documentos candidatos: docs/automation/AGENT_PROTOCOL.md, ACTIVATION.md, WORK_REVIEW.md, contracts.schema.json e examples.json. Não substituem contratos/ADRs certificados nem autorizam execução por existirem.

## Arquivos criados/modificados

Criados: os cinco arquivos de docs/automation acima; .claude/rules/hielya-automation.md; .github/ISSUE_TEMPLATE/agent-task.yml; scripts/automation/check-immutable-history.mjs; scripts/automation/check-immutable-history.test.mjs; este checkpoint.
Modificados somente por acréscimo: docs/checkpoints/INDEX.md e docs/KNOWN_DEBT.md. Sem arquivos removidos. Sem alteração de apps, packages, migrations, baselines, contratos de produto, CONSTRAINTS, CLAUDE.md ou workflows existentes. A nova regra Claude apenas aponta ao protocolo e preserva a sequência de leitura existente.

## Validação local e limites da evidência

- Node v22.16.0 no ambiente disponível: `node --test scripts/automation/check-immutable-history.test.mjs` — 19 testes, 19 passaram, zero falhas/skips. Repositórios Git sintéticos cobrem inclusão válida e rejeição de reescrita/remoção/renomeação/modo, index inválido, checkpoint sem índice/data inválida/versão duplicada/symlink, migration alterada/removida e refs inválidas/divergentes.
- JSON Schema Draft 2020-12 validado com jsonschema local: quatro payloads positivos e quinze casos negativos passaram. Os três exemplos versionados são sintéticos, não testes reais de aplicação nem autorização.
- Conteúdo original do INDEX reconstruído e conferido pelo Git blob d63233e60022d9c967b80603ff7c4a7c73ffb723 antes do acréscimo; KNOWN_DEBT original conferido pelo blob 13fc32081255fb22fe7ee48e3f4e37655a79ccd8.
- O clone completo não pôde ser obtido no ambiente local por falha de resolução de github.com. Leituras/escritas do repositório usam o conector GitHub. Não houve instalação pnpm, execução da suíte do aplicativo ou validação local em Node 24. Nenhum CI remoto do novo head é declarado aprovado neste registro anterior à publicação; consultar o PR para o resultado real.

## Pendências e próximos passos

Revisão independente e autorização de merge; saneamento posterior dos trechos de estado duplicados do CLAUDE.md; proteção server-side e check confiável obrigatório; identidades/permissões/credenciais; controller/ledger idempotente; criação real da tarefa Work e configuração Claude; piloto em observação antes de correções automáticas. O guardrail não certifica o comportamento do bloqueio de produção, apenas a imutabilidade histórica/migration. Dívida de enforcement e Gate comercial mantidas em KNOWN_DEBT.

Não foram criadas labels, proteção de branch, credenciais, tarefas agendadas, workflows autônomos ou deploy. Main não foi escrita; PRs existentes não foram alterados. A publicação deste candidato exige PR próprio e não autoriza seu merge. Resultados posteriores devem ficar no PR ou em novo checkpoint, sem reescrever este arquivo.

## Revisão para publicação pública

Conteúdo técnico e referências públicas revisados: sem chaves, segredos, credenciais, OTPs, tokens de sessão, dados pessoais ou logs de produção. Fixtures explicitamente sintéticas. Histórico anterior preservado.
