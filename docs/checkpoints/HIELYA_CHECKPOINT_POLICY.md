# Política Permanente de Checkpoints do Projeto HIELYA

Status: ATIVA
Data de adoção: 2026-08-05 14:43 Europe/Dublin
Responsável: fluxo de governança HIELYA

## 1. Objetivo

Garantir que nenhum raciocínio, decisão, contexto, artefato ou evolução relevante do projeto HIELYA dependa exclusivamente de conversas. Os checkpoints oficiais devem permitir retomada segura por qualquer IA ou desenvolvedor.

## 2. Frequência obrigatória

1. Gerar um checkpoint ao final de cada dia de trabalho.
2. Gerar imediatamente um checkpoint extraordinário após mudança estrutural importante em arquitetura, PRD, fluxos, regras de negócio, Design System, contratos, persistência, API, implementação crítica, CI ou governança.
3. Preservar todos os checkpoints anteriores. Nunca sobrescrever um arquivo existente.

## 3. Local oficial

Todos os checkpoints devem ser gravados na pasta HIELYA do Google Drive.

Pasta oficial:
https://drive.google.com/drive/folders/14qvkYRLAXm1SUxHHrNwGZOVXmSX_L28f

## 4. Nome obrigatório

HIELYA_CHECKPOINT_YYYY-MM-DD_vX.X.md

Quando houver mais de um checkpoint no mesmo dia, incrementar a versão. Não reutilizar nomes.

## 5. Conteúdo mínimo

Cada checkpoint deve conter:

- resumo executivo do trabalho realizado;
- decisões arquiteturais tomadas;
- alterações em relação ao checkpoint anterior;
- arquivos criados, modificados e removidos;
- estado atual do projeto;
- pendências e prioridades;
- próximos passos;
- riscos conhecidos;
- bloqueios encontrados;
- documentos que se tornaram canônicos;
- Decision Log atualizado;
- versão do checkpoint;
- data, hora e fuso;
- SHA, workflow run, PR ou identificador aplicável;
- origem das evidências utilizadas;
- confirmação de que main, PR e produção foram ou não alterados.

## 6. Regra de continuidade

Antes de iniciar nova sessão relevante:

1. localizar o checkpoint mais recente na pasta HIELYA;
2. ler o checkpoint como fonte primária de contexto;
3. validar o checkpoint contra o estado atual do GitHub e os artefatos canônicos;
4. informar qualquer divergência antes de implementar ou alterar documentos;
5. não presumir que uma conversa antiga prevalece sobre um checkpoint mais recente validado.

## 7. Hierarquia de precedência

1. Estado factual atual do GitHub e CI para implementação.
2. Checkpoint oficial mais recente validado.
3. Master Backup SST mais recente.
4. Contratos e ADRs certificados.
5. Master Package Work-Ready V1.1 para baseline de produto.
6. Documentos históricos e conversas apenas para contexto.

## 8. Regras de preservação

- Nenhuma decisão importante pode permanecer apenas na conversa.
- Documentos antigos não devem ser apagados quando forem necessários para auditoria, mas devem ser marcados como SUPERSEDED, HISTORICAL ou REFERENCE_ONLY.
- Credenciais, chaves, tokens e dados sensíveis não devem entrar nos checkpoints.
- Toda divergência deve ser registrada com fonte, impacto e resolução.
- Toda alteração de versão deve aparecer no changelog do checkpoint.

## 9. Automação diária

Uma automação recorrente deverá executar diariamente no período da noite, usando horário flexível, revisar o trabalho do dia e criar um novo checkpoint somente quando houver atividade ou evolução relevante. Caso não haja mudança, deverá registrar que nenhum checkpoint novo foi necessário, sem sobrescrever arquivos existentes.

## 10. Checkpoint extraordinário

Durante sessões ativas, qualquer mudança estrutural relevante exige checkpoint imediato antes de avançar para outra camada. Como não existe gatilho por webhook de conversa, essa regra será aplicada dentro do fluxo ativo de trabalho e complementada pela verificação diária.

## 11. Estado da política

POLICY_STATUS = ACTIVE
OVERWRITE_EXISTING_CHECKPOINT = FALSE
GOOGLE_DRIVE_FOLDER = HIELYA
DAILY_CHECKPOINT_REQUIRED = TRUE
STRUCTURAL_CHANGE_CHECKPOINT_REQUIRED = TRUE
LATEST_CHECKPOINT_REQUIRED_BEFORE_NEW_WORK = TRUE
DECISIONS_ONLY_IN_CHAT_ALLOWED = FALSE


## 10. Migração da fonte oficial para o repositório

Esta seção foi adicionada na cópia versionada da política durante o CHECKPOINT_REPOSITORY_MIGRATION_GATE. Ela não altera o conteúdo histórico acima.

A partir do merge do change-set de migração:

- o local oficial e canônico dos checkpoints passa a ser `docs/checkpoints/` no repositório `srdarllan-hash/hielya-app`;
- o Google Drive permanece como arquivo histórico dos documentos migrados e como local dos assets binários, evidências, APKs, ZIPs, planilha do registro canônico e demais itens expressamente não migrados;
- novos checkpoints devem ser criados como novos arquivos no repositório e introduzidos por commit e Pull Request;
- um checkpoint já versionado não pode ter seu conteúdo histórico reescrito, resumido ou corrigido; qualquer correção, ratificação ou atualização exige um novo checkpoint de versão posterior;
- a regra de não-sobrescrita passa a ser protegida pela história imutável e auditável do Git, pela revisão do diff no Pull Request e pela exigência de um novo arquivo para cada versão;
- `docs/checkpoints/INDEX.md` deve receber uma nova linha em toda criação de checkpoint;
- cada linha do índice deve manter o link do documento original no Drive quando existir;
- os documentos de origem no Drive ficam classificados como `MIGRATED / HISTORICAL` e não devem ser apagados nem usados como fonte concorrente após o merge;
- antes de trabalho relevante, agentes devem ler esta política e o checkpoint mais recente do índice e validar o estado declarado contra o estado real do GitHub.

Até o merge, a política anterior no Drive continua sendo a fonte oficial; este change-set permanece proposta auditável, sem efeito sobre `main`.
