# HIELYA CHECKPOINT v9.0 — CLAUDE_ACTION_ISSUE_62_FILTERED_FAILURE_DIAGNOSIS

Data e hora do evento: 2026-09-08 (Europe/Madrid). Registro criado no repositório.
Checkpoint anterior: v8.9 (`CLAUDE_CODE_GITHUB_ACTIONS_PILOT_PREPARATION`), preservado integralmente.
v8.6 e v8.7 seguem reservadas por PRs documentais abertos (#57, #58) e não incorporadas à `main`.

## Resumo executivo e estado factual

O proprietário autorizou preparar — sem merge e sem disparar novo smoke test — um
diagnóstico **filtrado** da falha da integração Claude Code GitHub Actions na Issue #62,
substituindo o plano anterior de `show_full_output`.

- Branch de trabalho: `hielya/claude-action-failure-diagnosis`.
- Base: `main` @ `9522dcb1dd0580f0d5e620b2f75a5ad14c40f212` (PR #61 já mergeado; `claude.yml`
  e checkpoint v8.9 estão em `main`).
- Falhas observadas, causa raiz ainda NÃO confirmada:
  - run `34235060418` — failure (1º smoke test).
  - run `34237509175` — failure (reteste após rotação do `CLAUDE_CODE_OAUTH_TOKEN`).
  - Ambos: `init` OK com `claude-sonnet-5`, depois `type:"result"`, `subtype:"success"`,
    `is_error:true`, `num_turns:1`, `total_cost_usd:0`, `modelUsage:{}`; `Log saved to
    /home/runner/work/_temp/claude-execution-output.json`; nenhuma negação de permissão;
    nenhuma alteração enviada ao repositório. O texto de erro real fica mascarado no log
    da Action ("full output hidden for security").
- A rotação do token NÃO resolveu, o que reforça — sem confirmar — a hipótese de regressão
  upstream no caminho `claude_code_oauth_token` (cluster de issues P1 do
  `anthropics/claude-code-action`: #852, #853, #872, #893, #947), mas também é compatível
  com um token ainda inválido/mal formatado no secret.

## Descoberta verificada nas fontes oficiais

`anthropics/claude-code-action@v1.0.217` resolve para o commit
`9c5ddab2e6d17b83ea679153b31f1d5f023cf636` (confirmado via API de tags do GitHub).

- `base-action/src/execution-file.ts`: constante `EXECUTION_FILENAME =
  "claude-execution-output.json"`, gravada em `join(RUNNER_TEMP, EXECUTION_FILENAME)`;
  helpers `getExecutionFilePath()` e `setExecutionFileOutputIfPresent()`.
- `src/entrypoints/run.ts`: no caminho de sucesso chama
  `core.setOutput("execution_file", claudeResult.executionFile)`; no `catch` executa
  `executionFile ??= setExecutionFileOutputIfPresent()`, que faz
  `core.setOutput("execution_file", <path>)` quando o arquivo existe. Portanto a saída
  `execution_file` da Action está presente mesmo após falha imediata.
- `action.yml` do mesmo commit declara os outputs `execution_file`, `conclusion`,
  `branch_name`, `session_id`, `structured_output`, e os inputs `show_full_output`
  (default `"false"`) e `display_report` (default `"false"`).
- O arquivo de execução é gravado **sem redação** (`JSON.stringify(messages, null, 2)`);
  a redação (`redactSecrets`) só é aplicada ao Step Summary. Por isso o diagnóstico lê o
  arquivo apenas no runner e emite exclusivamente uma allowlist de campos.

## Implementação incorporada nesta branch

Arquivos criados/alterados (todos append-only ou novos; nenhum histórico reescrito):

1. `.github/workflows/claude.yml` — alterações mínimas ao workflow do PR #61:
   - `id: claude` no step da Action.
   - `show_full_output: false` e `display_report: false` explícitos (trava o default).
   - Novo step `Filtered failure diagnosis (Issue #62 smoke test only)`
     (`id: claude_diagnosis`) executando `node scripts/automation/diagnose-claude-failure.mjs`.
   - Gatilho do step, cumulativo com o `if` do job (`@claude` + `author_association` em
     OWNER/MEMBER/COLLABORATOR): `always() && steps.claude.outcome == 'failure' &&
     github.event_name == 'issue_comment' && github.event.issue.number == 62 &&
     github.actor == 'srdarllan-hash'`. Nenhum gatilho novo do workflow; nenhuma repetição
     automática; sem `continue-on-error`; sem auto-merge.
   - `env` do step: `CLAUDE_EXECUTION_FILE: ${{ steps.claude.outputs.execution_file }}` e
     `MAX_EXECUTION_FILE_BYTES: "5242880"`. `CLAUDE_CODE_OAUTH_TOKEN` continua referenciado
     apenas como `${{ secrets.CLAUDE_CODE_OAUTH_TOKEN }}`; nunca lido, impresso ou alterado.

2. `scripts/automation/diagnose-claude-failure.mjs` — analisador filtrado (novo):
   - Lê `CLAUDE_EXECUTION_FILE`; valida caminho: não vazio, `RUNNER_TEMP` presente,
     rejeita symlink (`lstat`), exige caminho canônico dentro do `RUNNER_TEMP` canônico,
     exige arquivo regular, tamanho em `(0, MAX_EXECUTION_FILE_BYTES]`, JSON parseável.
     Não executa o conteúdo do arquivo.
   - Emite APENAS: `diagnosis_status` (`OK` | `EXECUTION_FILE_MISSING` |
     `EXECUTION_FILE_INVALID` | `RESULT_NOT_FOUND` | `DIAGNOSTIC_ERROR`), `is_error`
     (só quando booleano), `http_status_codes` (inteiros 400–599, só quando presentes),
     `error_category` (conjunto fechado: `AUTHENTICATION`, `PERMISSION`, `RATE_LIMIT`,
     `MODEL_OR_REQUEST`, `SERVICE_UNAVAILABLE`, `SDK_OR_CONFIGURATION`, `UNKNOWN`).
   - Classificação feita só em memória a partir de um recorte limitado de texto; o texto
     é descartado. Nunca imprime `result`, `errors`, mensagens do modelo, resultados de
     ferramentas, headers, URLs nem identificadores de conta. Ausência de evidência →
     `UNKNOWN`. Sai com código 0 (é um relator, não um gate) para preservar a falha
     original do job; não usa `continue-on-error`.

3. `scripts/automation/diagnose-claude-failure.test.mjs` — testes sintéticos (`node:test`,
   novo): autenticação, permissão, limite (rate), erro desconhecido, arquivo
   ausente/JSON inválido/fora do `RUNNER_TEMP`/symlink/oversize, extração de códigos HTTP,
   assinatura SDK/AJV, passthrough de `is_error`, `RESULT_NOT_FOUND`, contrato do
   `formatLines` e — caso central — mensagens contendo credenciais fictícias
   (`sk-ant-oat…`, `sk-ant-api…`, `Bearer ghs_…`, `account_id=…`, `api.anthropic.com`)
   com asserção de que nenhum desses valores aparece em stdout, `GITHUB_OUTPUT` ou
   `GITHUB_STEP_SUMMARY`.

4. `docs/checkpoints/2026-09/HIELYA_CHECKPOINT_2026-09-08_v9.0.md` — este checkpoint.

5. `docs/checkpoints/INDEX.md` — uma linha nova (append-only).

Nenhuma alteração em aplicação, migrations, contratos, `CONSTRAINTS.md`, `INTEGRATIONS.md`,
ruleset `Protect main — HIELYA`, gates comerciais/produção, secrets ou nos 16 workflows de
validação. Método de autenticação, modelo e versão da Action (`@v1.0.217`) inalterados.

## Estado atual do projeto

- `main` de referência: `9522dcb1dd0580f0d5e620b2f75a5ad14c40f212`.
- Integração Claude Code GitHub Actions ATIVA em `main` (PR #61) mas **não funcional**:
  falha imediata na Issue #62, causa raiz não confirmada.
- Este change-set adiciona apenas instrumentação de diagnóstico filtrado, em branch/PR
  draft, sem merge e sem novo teste.

## Pendências e prioridades

- Merge deste PR draft depende de revisão e aprovação separada do proprietário.
- Após o merge, uma nova execução controlada da Issue #62 (comentário `@claude` de ator
  autorizado) deve produzir as linhas de diagnóstico filtrado e revelar a `error_category`.
- Conforme a categoria: se `AUTHENTICATION`/`PERMISSION` → regenerar/ajustar o secret
  (ação do proprietário, sem alteração de arquivo); se `SDK_OR_CONFIGURATION` →
  avaliar workaround oficial (`anthropic_api_key`) ou fixar SHA/versão, em PR próprio.
- `ACTIVATION.md` item 5 (fixar a Action em SHA completo) permanece pendente, fora deste
  escopo.

## Próximos passos

1. Proprietário revisa o diff do PR draft.
2. Se aprovado, merge manual conforme governança (sem auto-merge).
3. Execução controlada única da Issue #62; capturar `diagnosis_status`, `is_error`,
   `http_status_codes`, `error_category`.
4. Decidir a correção mínima com base na categoria; abrir PR de correção separado.

## Riscos conhecidos

- Repositório público: o diagnóstico foi desenhado para nunca emitir texto bruto do SDK;
  os testes sintéticos verificam a não-exposição de credenciais fictícias. Ainda assim,
  `error_category` e `http_status_codes` são sinais de baixa granularidade e podem, em
  textos atípicos, classificar como `UNKNOWN` ou (por casamento de palavra-chave) apontar
  uma categoria imprecisa; por isso a ausência de evidência resulta em `UNKNOWN`.
- `steps.claude.outputs.execution_file` depende do comportamento verificado do commit
  `9c5ddab…`; uma futura mudança da Action nessa versão fixada não ocorre, mas um upgrade
  posterior exigirá revalidação.
- Ambiente de preparação sem runtime Node: os testes `node --test` NÃO foram executados
  localmente (ver limitações no PR). Validação real depende de execução por um revisor ou
  em CI antes do merge.

## Bloqueios encontrados

- Sem `node`, `python` real, `yamllint` ou `docker` no ambiente de preparação. Foram feitas
  apenas verificações mecânicas do YAML e revisão manual; a suíte `node --test` do script
  de diagnóstico não pôde ser executada aqui.

## Documentos que se tornaram canônicos

- Nenhum documento de produto. `scripts/automation/diagnose-claude-failure.mjs` passa a ser
  o utilitário de triagem filtrada da falha do smoke test quando o PR for mergeado.

## Decision Log (acréscimo)

- 2026-09-08: Plano de `show_full_output` substituído por diagnóstico filtrado por
  allowlist. `show_full_output` e `display_report` mantidos `false`. Categorias fixas:
  AUTHENTICATION, PERMISSION, RATE_LIMIT, MODEL_OR_REQUEST, SERVICE_UNAVAILABLE,
  SDK_OR_CONFIGURATION, UNKNOWN. Step de diagnóstico restrito a `issue_comment` na Issue
  #62 pelo ator `srdarllan-hash` quando o step Claude falha. Sem troca de autenticação,
  modelo ou versão da Action neste experimento. Sem merge e sem novo teste nesta etapa.

## Confirmação de alterações

- `main`: NÃO alterada.
- PR: aberto como draft contra `main`; NÃO mergeado; sem auto-merge.
- Novo smoke test: NÃO disparado nesta etapa.
- Produção, secrets, ruleset, migrations, workflows existentes: NÃO alterados.

## Origem das evidências

- Repositório local no HEAD `9522dcb1dd0580f0d5e620b2f75a5ad14c40f212`.
- Runs `34235060418` e `34237509175` e comentários da Issue #62 consultados via `gh`.
- `anthropics/claude-code-action` lido na tag `v1.0.217` / commit
  `9c5ddab2e6d17b83ea679153b31f1d5f023cf636` via API de conteúdos do GitHub
  (`action.yml`, `src/entrypoints/run.ts`, `base-action/src/execution-file.ts`).
- Documentação oficial: https://code.claude.com/docs/en/github-actions (Troubleshooting →
  Authentication errors: "Confirm the API key or OAuth token is valid by testing it
  locally with `claude` before debugging the workflow").

## Revisão para publicação pública

Conteúdo revisado: apenas decisões técnicas, caminhos, identificadores públicos de
commits/PRs/runs e configuração de workflow. Não contém credenciais, chaves, pepper,
valores de OTP, tokens de sessão, dados pessoais ou segredos operacionais.
