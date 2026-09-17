# HIELYA CHECKPOINT v8.9 — CLAUDE_CODE_GITHUB_ACTIONS_PILOT_PREPARATION

Data e hora do evento: 2026-09-08 (Europe/Madrid). Registro criado no repositório.
Checkpoint anterior: v8.5 (`PR54_MERGED_TO_MAIN`), preservado integralmente.

Numeração: v8.6, v8.7 e v8.8 estão reservadas por PRs documentais abertos (#57, #58, #60)
e ainda não incorporadas à `main`. Esta entrega usa v8.9 para não colidir com esses
precedentes pendentes. Nenhum checkpoint histórico foi modificado.

## Resumo executivo e estado factual

O proprietário autorizou explicitamente a preparação — sem merge — da integração oficial
Claude Code GitHub Actions para o repositório `srdarllan-hash/hielya-app`.

- Branch de trabalho: `hielya/claude-code-action-setup`.
- Base: `main` @ `c3a1e53c8638d476721e0d5b1442f36b0326a861` (igual ao HEAD local no momento da criação).
- Entrega exclusiva desta branch: adicionar `.github/workflows/claude.yml`, adicionar este
  checkpoint e acrescentar uma linha a `docs/checkpoints/INDEX.md` (append-only).
- O Claude GitHub App já está instalado e restrito a este repositório. O repository secret
  `CLAUDE_CODE_OAUTH_TOKEN` já existe e não foi lido, impresso, alterado ou exposto.
- `main`, produção, migrations, gates comerciais, o ruleset "Protect main — HIELYA", os
  segredos e os 16 workflows de validação existentes NÃO foram alterados.
- Nenhum deploy. Nenhum auto-merge. PR publicado como draft contra `main` e dependente de
  revisão e aprovação de merge separada, conforme a governança HIELYA.

## Decisões e configuração do workflow

Arquivo novo: `.github/workflows/claude.yml`.

- Action fixada exatamente em `anthropics/claude-code-action@v1.0.217` (sem tag móvel `@v1`).
- Autenticação exclusiva: `claude_code_oauth_token: ${{ secrets.CLAUDE_CODE_OAUTH_TOKEN }}`.
  Sem `anthropic_api_key`. Nenhum passo lê ou imprime o valor do secret.
- Gatilhos do piloto, somente com menção explícita `@claude`:
  - `issue_comment: [created]`
  - `pull_request_review_comment: [created]`
- Não habilitados neste piloto: `issues`, `pull_request_review`, `pull_request`, `push`,
  acionamento por label e qualquer execução automática em todo PR. `label_trigger` e
  `allowed_bots` explicitamente vazios.
- Guarda de segurança: o job só executa quando o comentário contém `@claude` E o
  `author_association` do autor é `OWNER`, `MEMBER` ou `COLLABORATOR`. O repositório é
  público; conteúdo de terceiros é tratado como não confiável. Essa checagem soma-se à
  verificação de permissão de ator feita pela própria Action.
- Permissões mínimas concedidas (nível de workflow e de job):
  `contents: write`, `pull-requests: write`, `issues: write`, `actions: read`,
  `id-token: write`. Nenhuma outra permissão.
- `concurrency` por issue/PR, `cancel-in-progress: false`, `timeout-minutes: 30`.
- `actions/checkout@v4` com `persist-credentials: false` e `fetch-depth: 1`.

## Arquivos criados / modificados / removidos

- Criado: `.github/workflows/claude.yml`.
- Criado: `docs/checkpoints/2026-09/HIELYA_CHECKPOINT_2026-09-08_v8.9.md` (este arquivo).
- Modificado (append-only): `docs/checkpoints/INDEX.md` — uma linha nova.
- Removido: nenhum.
- Nenhuma alteração em `apps/`, `packages/`, `contracts/`, migrations, `CLAUDE.md`,
  `CONSTRAINTS.md`, `KNOWN_DEBT.md`, `INTEGRATIONS.md` ou nos 16 workflows existentes.

## Estado atual do projeto

- `main` de referência inalterada: `c3a1e53c8638d476721e0d5b1442f36b0326a861`.
- Cadeia certificada permanece a de v8.5 (C-003/C-004 em memória, catálogo público, sem
  produção, sem SMS/checkout reais).
- A integração Claude Code GitHub Actions fica PREPARADA em branch/PR draft, NÃO ATIVADA em
  `main`.

## Pendências e prioridades

- Revisão e merge separadamente autorizado deste PR draft.
- Coordenação com Issue #59 e PR #60 (fundação do protocolo Work–Claude, ainda não
  mergeada). Este workflow é mínimo e independente dos arquivos de protocolo de #60.
- Guardrail mecânico de não-sobrescrita de checkpoints (KNOWN_DEBT) permanece pendente e
  fora deste escopo.
- Evolução futura de gatilhos/escopo (por exemplo `issues`, revisão automática de PR) exige
  autorização própria.

## Próximos passos

1. Proprietário revisa o diff do PR draft.
2. Se aprovado, merge manual conforme governança (sem auto-merge).
3. Teste de fumaça pós-merge: um comentário `@claude` de um colaborador com permissão de
   escrita em uma issue de teste.

## Riscos conhecidos

- Repositório público: superfície de prompt-injection via conteúdo de terceiros. Mitigado
  por gatilho restrito a `@claude`, guarda de `author_association`, ausência de gatilho
  automático de PR, sem bots e permissões mínimas.
- `contents: write` permite ao Claude criar/atualizar branches `claude/*` e abrir PRs; nunca
  escrever em `main` (ruleset). Merge continua manual.
- Divergência potencial de numeração/estrutura quando PRs #57/#58/#60 forem mergeados; este
  checkpoint só faz append e não reescreve histórico.

## Bloqueios encontrados

- Nenhum. `node`/`pnpm` não estão disponíveis neste ambiente de preparação; a suíte completa
  da aplicação NÃO foi executada e não é reivindicada. O escopo alterado é apenas YAML de
  workflow e documentação; validação de sintaxe/segurança do workflow foi feita localmente.

## Documentos que se tornaram canônicos

- Nenhum novo documento canônico de produto. `.github/workflows/claude.yml` passa a ser o
  ponto de entrada da integração Claude Code GitHub Actions quando o PR for mergeado.

## Decision Log (acréscimo)

- 2026-09-08: Autorizada a preparação (sem merge) da integração oficial Claude Code GitHub
  Actions. Action fixada em `@v1.0.217`. Gatilhos iniciais: `issue_comment` e
  `pull_request_review_comment`, apenas com `@claude`. Permissões: Proposta A estrita.
  Autenticação: `CLAUDE_CODE_OAUTH_TOKEN` por referência de secret. Sem auto-merge.

## Confirmação de alterações

- `main`: NÃO alterada.
- PR: aberto como draft contra `main`; NÃO mergeado.
- Produção: NÃO alterada. Deploy: NÃO realizado.
- Secrets/ruleset/workflows existentes: NÃO alterados.

## Origem das evidências

- Repositório local `C:\Users\HP\Projects\hielya-app` no HEAD
  `c3a1e53c8638d476721e0d5b1442f36b0326a861`.
- Estado do GitHub consultado ao vivo via `gh` (branch `main`, PRs abertos, branches,
  rulesets) imediatamente antes desta entrega.
- Versões de `anthropics/claude-code-action` consultadas via API do GitHub
  (`v1.0.217`, publicada 2026-09-06).

## Revisão para publicação pública

Conteúdo revisado: apenas decisões técnicas, caminhos, identificadores públicos de
commits/PRs e configuração de workflow. Não contém credenciais, chaves, pepper, valores de
OTP, tokens de sessão, dados pessoais ou segredos operacionais.
