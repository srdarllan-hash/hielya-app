# HIELYA_CHECKPOINT_2026-09-07_v5.9

## Identificação e resumo executivo
Data/hora UTC: 2026-09-07T10:22:28.346915+00:00.
Gate: ALCOHOL_DOMAIN_CONTRACT_ALIGNMENT / PHASE_1.
Status neste registro: CONTRACT_IMPLEMENTED_AND_LOCALLY_VALIDATED / FINAL_CI_TO_BE_VERIFIED_ON_PR / NOT_MERGED.
Issue: [#35](https://github.com/srdarllan-hash/hielya-app/issues/35).
PR: [#36](https://github.com/srdarllan-hash/hielya-app/pull/36), OPEN / DRAFT / NOT MERGED.
Branch: hielya/alcohol-domain-contract-v1-3, criada diretamente da main.
Base main verificada: `4d32cebcc7f68832940f6825177d5348d63f245a`; tree `3218db4049527e94151d0c8cfe988ab87ac13ac9`.
Primeiro commit desta fase: `22066a991816b73a0f886062b3a9cecd69573858`, tree `7f19553c8990bbf2fad59d147031a60a7b5b6a0b`.
Este checkpoint acompanha fechamento do candidato, incluindo nomes de projeção de idade e teste adicional; não atribui a esse novo SHA um resultado anterior. SHA/CI finais ficam no PR, sem autorreferência fictícia nem reescrita deste arquivo.

## Continuidade e autorização
Política lida integralmente. Último checkpoint [v5.8](https://github.com/srdarllan-hash/hielya-app/blob/b96b2907f132d006072b216030353b5352441049/docs/checkpoints/2026-09/HIELYA_CHECKPOINT_2026-09-07_v5.8.md) validado contra PR #34 OPEN/DRAFT, HEAD b96b2907f132d006072b216030353b5352441049 e main real. PR #34 não mergeado por esta tarefa. PR #32 de tokens também não incorporado. Precedentes v5.4–v5.8 pertencem às branches documentais já registradas; links no INDEX não copiam seu conteúdo.
Proprietário autorizou explicitamente Fase1, contrato versionado, e determinou fases sequenciais com Issue → branch → implementação → testes → PR e aprovação individual de merge. Coexistência high-demand/alcohol-cutoff pertence às Fases1/5. Nenhuma fase posterior começou.

## Decision Log e contrato implementado
Novo OpenAPI3.1.1/JSON Schema2020-12 V1.3, serializado em JSON válido como YAML. Contratos V1.0/V1.1/V1.2 e perfis anteriores preservados byte a byte; hashes de linhagem validados. Runtime continua V1.2.
- Cutoff dinâmico local22:00 − MAX(45, máximo real válido ponta a ponta). Exemplos45→21:15,60→21:00,90→20:30; piso45 quando estimativa30. Zona Europe/Madrid; deadline não varia com demanda.
- storeStatus, demand e alcohol são dimensões independentes. Exemplo OPEN+HIGH45–60+UNAVAILABLE com cutoff21:00 permite os dois avisos na mesma tela na futura Fase5; nenhuma tela alterada agora.
- Estimativa tem fonte/versão/instante/validade e snapshot por pedido; submit recalcula, reconfirma promessa alterada e falha fechado se dado indisponível. Guardas em criação, aceite/início do preparo, fim do preparo, despacho, chegada e handover.
- order.requiresAgeVerification derivado de containsAlcohol; API rejeita boolean de override na criação. Pedido guarda snapshot, promessa e revisão.
- Comando único final verify-pin ampliado, com presença/PIN/inspeção18+ e relógio/ator/revisão server-side. Age-check isolado aceita apenas recusa terminal, nunca APPROVED/VERIFIED para liberar entrega. Privilegiar couriers atribuídos, sem cliente impersonar ator operacional.
- delivery.ageVerificationStatus/Method e verifiedAt/verifiedByCourierId são projeções da evidência mínima única. Nenhum documento/foto/número/DOB é capturado. DNI/passaporte ou NIE com documento suficiente devem mostrar foto e nascimento; NIE sozinho →REFUSED_DOUBTFUL_ID.
- Sem nova tentativa no mesmo pedido, sem terceiro/recepção. Recusa de verificação exige compensação integral automática sem custo, separando void/refund/partial capture e intenção de confirmação real. Retenção herda dossiê e último lançamento contábil, não order.createdAt.
- Schema valida forma/condições expressáveis; não executa cálculos reais de SLA, transação de banco, autorização ou inspeção física. Essas obrigações estão explicitamente atribuídas às Fases2–4. Fase1 não ativa endpoints nem produção.

## Arquivos criados/modificados
Criados:
- contracts/openapi/HIELYA_OPENAPI_MVP_LOCAL_36_V1_3.yaml
- contracts/openapi/MVP_LOCAL_36_ALCOHOL_IMPLEMENTATION_PROFILE_V1_3.json
- tests/contracts/requirements.txt
- tests/contracts/test_alcohol_v13.py
- tests/fixtures/alcohol-contract-v1-3.json
- .github/workflows/alcohol-contract-validation.yml
- docs/contracts/ALCOHOL_DOMAIN_V1_3_PHASE_1.md
- este checkpoint v5.9.
Modificados: CLAUDE.md (seção do gate atual); docs/checkpoints/INDEX.md (nova linha e links de continuidade).
Nenhum removido. Sem aplicação/runtime, migrations, token values, baselines ou assets alterados. Workflow completo existente e Opaque Session Gate não foram modificados/desativados.

## Validação e rede
- 16 testes de contrato PASS localmente na revisão final: OpenAPI completo, schemas, exemplos/aritmética testemunhal, coexistência, campos obrigatórios/proibidos, conflitos de projeção, segurança/idempotência declaradas e linhagem.
- 312 testes unitários /36 arquivos PASS localmente com cobertura. Não é prova de implementação dos futuros endpoints.
- Rede: corepack pnpm10.15.0 iniciou install --frozen-lockfile; uma consulta de processo retornou network approval was cancelled before a decision was returned, imediatamente informado ao proprietário. Dependências Python e depois pnpm ficaram disponíveis; por isso testes locais puderam concluir. Nenhuma trava contornada, lockfile não alterado.
- CI do primeiro commit: [Alcohol Contract 34110760756](https://github.com/srdarllan-hash/hielya-app/actions/runs/34110760756) SUCCESS (15 testes antes da projeção adicional); [validação integral 34110760667](https://github.com/srdarllan-hash/hielya-app/actions/runs/34110760667) tinha quality SUCCESS (lint/typecheck/unit/Next/Storybook) e regressões ainda em andamento ao preparar este checkpoint.
- O commit final será validado novamente pelos dois workflows automaticamente. O resultado final deve ser consultado no PR #36 e reportado com SHA/run reais; não antecipado neste registro. CI de aplicação roda cinco suites de navegador e proíbe escrita de baseline; CI de contrato é adicional, somente validação.

## Riscos, pendências e próximo passo
V1.3 contém mudanças intencionais de payload/response que não podem ser ativadas no runtime V1.2 antes das fases dependentes/revisão. Não confundir existência do contrato com entrega/pagamento/idade operacionais. Campo público de estado global é indicativo; quote por destino e submit são autoridade. Fundamentação, compatibilidade e limitações estão em [documentação da Fase1](../../contracts/ALCOHOL_DOMAIN_V1_3_PHASE_1.md).
Aguardar CI final e revisão/merge individual do PR #36. Só depois avançar à Fase2 na main atualizada e novo fluxo. Não mergear PR #32/#34 implicitamente. Seleções de assets preservadas; C-003/C-004/telas novas/produção bloqueadas. Guardrail mecânico de não-sobrescrita segue pendência anterior.

PHASE_1_CONTRACT_IMPLEMENTED = TRUE
RUNTIME_CONTRACT_ACTIVATED = FALSE
PHASE_2_STARTED = FALSE
EXISTING_CONTRACTS_MODIFIED = FALSE
MIGRATIONS_CHANGED = FALSE
APPLICATION_RUNTIME_CHANGED = FALSE
BASELINES_CHANGED = FALSE
MAIN_CHANGED = FALSE
MERGE_PERFORMED = FALSE
ASSETS_CHANGED = FALSE
C003_STARTED = FALSE
C004_STARTED = FALSE
NEW_SCREEN_CREATED = FALSE
PRODUCTION_ACTIVATED = FALSE
HISTORICAL_CHECKPOINT_OVERWRITTEN = FALSE
