# C-001 Splash — Relatório de Requisitos

**Status:** SPECIFICATION_APPROVED_FOR_IMPLEMENTATION  
**Gate:** 1B  
**Base congelada:** `be61e1168b93d973101496cc66cb54d006aba9cc`  
**Design Tokens:** `1.1.0`  
**Component Library:** `1.1.1`

## 1. Fontes oficiais consultadas

1. `HIELYA_SOURCE_OF_TRUTH_V1_1.json`
2. `HIELYA_PRD_Auditado_V1_1`
3. `HIELYA_SCREEN_ENDPOINT_MODEL_STORY_TEST_MATRIX_V1_2`
4. `HIELYA_USER_STORIES_ACCEPTANCE_CRITERIA_V1_2`
5. `HIELYA_UI_Copy_ES_EN_PT_V1_0.xlsx`
6. `HIELYA_DESIGN_TOKENS_FROZEN_V1_1.json`
7. `manifests/components.json` no commit congelado
8. Referência visual aprovada no Master Board, painel `01 SPLASH`
9. Decision Records HLY-UI-001, HLY-UI-004, HLY-DS-001 e HLY-DS-002

## 2. Identificação

| Campo | Definição oficial |
|---|---|
| Screen ID | `C-001` |
| Nome | Splash / PWA bootstrap |
| Ator | Customer |
| Objetivo | Carregar shell da marca, configuração, locale e sessão antes da navegação. |
| Momento | Primeira renderização da aplicação/PWA e reabertura quando o bootstrap precisa ser reavaliado. |
| Endpoint | `N/A` no contrato de rastreabilidade vigente. |
| Models relacionados | `CustomerSession`, `DeviceToken` apenas no contexto PWA; nenhum modelo é gravado pela tela isolada. |
| Eventos | `N/A` no catálogo de rastreabilidade vigente. |
| Stories | `US-011`, `US-012`, `US-091`, `US-094`; acessibilidade transversal `US-095`. |

## 3. Responsabilidade e limites

A C-001 deve:

- exibir o lockup oficial HIELYA;
- aplicar Design Tokens 1.1.0 e Poppins;
- representar o progresso do bootstrap sem promessas de duração;
- expor estados controláveis e testáveis;
- declarar o contrato de saída sem implementar C-002, C-003 ou C-004;
- permitir recuperação em estados de erro, timeout e offline;
- respeitar `prefers-reduced-motion`;
- não carregar catálogo, checkout, autenticação ou regras comerciais.

A C-001 não deve:

- exigir autenticação antes da navegação no catálogo;
- redirecionar para login/OTP;
- inventar endpoint de configuração ou manutenção;
- incluir seleção de idioma não contratada;
- alterar qualquer arquivo funcional da C-005;
- usar timer fixo como condição de saída.

## 4. Contrato de saída

| Condição | Próxima tela contratual | Status |
|---|---|---|
| Bootstrap concluído e contexto de localização/endereço válido disponível | `C-005 Home` | DOCUMENTED_BY_PRD_AND_SCREEN_CONTRACT |
| Bootstrap concluído e contexto de localização/endereço ausente ou inválido | `C-002 Location and service area` | DOCUMENTED_BY_PRD_AND_SCREEN_CONTRACT |
| Sessão ausente, mas localização válida | `C-005 Home` | DOCUMENTED: catálogo não exige login prévio |
| Necessidade de autenticação | Não tratada pela Splash; ocorre no fluxo posterior de checkout | DOCUMENTED |
| Manutenção crítica | Permanecer em C-001 | `REQUIRES_VALIDATION`: origem do sinal não documentada |
| Offline sem contexto seguro recuperável | Permanecer em C-001 e oferecer nova tentativa | `REQUIRES_VALIDATION`: política de cache do bootstrap não documentada |

## 5. Duração

`NOT_DOCUMENTED`

Não será introduzida duração artificial. A tela permanece enquanto o bootstrap estiver pendente. Testes e Storybook usam estados determinísticos, sem esperar tempo real.

## 6. Conflitos e lacunas

| ID | Classificação | Descrição | Tratamento no Gate 1B |
|---|---|---|---|
| C001-GAP-01 | `NOT_DOCUMENTED` | Duração mínima/máxima da Splash. | Sem timer fixo; conclusão orientada por estado. |
| C001-GAP-02 | `NOT_DOCUMENTED` | Endpoint ou origem formal para configuração/manutenção. | Nenhuma API inventada; estado injetável. |
| C001-GAP-03 | `CONFLICT` | PRD lista “Escolher idioma”, mas o contrato de 25 telas não possui tela de idioma. | Resolver locale por preferência suportada e fallback ES; não criar seletor. |
| C001-GAP-04 | `REQUIRES_VALIDATION` | Política de cache seguro durante bootstrap offline. | Exibir estado offline e retry; não continuar automaticamente. |
| C001-GAP-05 | `NOT_DOCUMENTED` | Threshold de timeout. | Estado `timeout` controlado externamente; nenhum valor hardcoded. |
| C001-GAP-06 | `REQUIRES_VALIDATION` | Persistência de locale antes de existir Customer autenticado. | Contrato local/testável, sem persistência de backend nova. |

Nenhuma dessas lacunas bloqueia a implementação visual e contratual da C-001 porque nenhuma exige novo endpoint ou regra de domínio. Elas permanecem registradas e não são preenchidas por inferência.

## 7. UI oficial

### Estrutura

1. `AppShell` em variante de contexto Splash, sem navegação inferior.
2. `AppHeader` reutilizado como lockup de marca; ações ocultas apenas dentro do escopo `.hly-splash`.
3. Área central com logo textual e slogan oficial.
4. Indicador de bootstrap discreto no terço inferior.
5. Status acessível invisível/visível conforme o estado.
6. Recuperação com `ErrorState` nos estados de falha.

### Referência visual preservada

- fundo preto profundo;
- lockup HIELYA dourado central;
- slogan branco com ênfase dourada em “ya.”;
- indicador circular fino;
- ausência de cards, navegação, fotografia ou CTA no estado normal.

### Tokens

- `color.background.primary = #000000`
- `color.brand.gold = #D4A017`
- `color.brand.goldBright = #F6B800`
- `color.text.primary = #FFFFFF`
- `color.text.secondary = #B8B8B8`
- Poppins 400/500/600/700
- grid mobile 360×800 e 390×844, margem 16 px
- motion `fast`, `standard`, `slow` e `reducedMotion = 0ms`

### Componentes canônicos reutilizados

- `AppShell`
- `AppHeader`
- `ErrorState`
- `StatusBadge` quando necessário para manutenção

### Componentes novos

Nenhum componente canônico novo.

`SplashScreen` é uma tela, não um componente de fundação. O indicador circular é markup interno e escopado, pois não há requisito para promovê-lo à biblioteca canônica neste Gate.

## 8. Estados oficiais da C-001

| Estado | Comportamento |
|---|---|
| `initial` | Primeira pintura da marca antes de o bootstrap informar progresso. |
| `loading` | Bootstrap em andamento, indicador animado e `aria-busy=true`. |
| `transition` | Bootstrap concluído; contrato de saída conhecido e anúncio de transição. |
| `offline` | Sem conexão e sem autorização documentada para prosseguir; retry disponível. |
| `error` | Falha recuperável; retry disponível. |
| `timeout` | Bootstrap excedeu threshold externo não documentado; retry disponível. |
| `maintenance` | Manutenção crítica; sem navegação automática. |
| `ready-location` | Saída contratual `C-002`, sem implementar a tela. |
| `ready-home` | Saída contratual `C-005`, sem alterar a Home. |
| `reduced-motion` | Mesmo conteúdo de loading, sem rotação ou transição espacial. |

## 9. Acessibilidade

- `<main>` único com nome acessível “HIELYA”.
- `aria-busy` em estados de bootstrap.
- `role=status` e `aria-live=polite` para mensagens não críticas.
- `role=alert` para erro/timeout/offline quando houver ação necessária.
- nenhuma navegação por teclado no estado normal, pois não há controles.
- botão de recuperação com touch target mínimo de 44 px.
- contraste derivado apenas dos tokens congelados.
- loader decorativo com `aria-hidden=true`; texto de status fornece significado.
- `prefers-reduced-motion: reduce` remove animação e transições.
- foco inicial não é forçado; em recuperação, foco permanece em ordem natural.

## 10. Acceptance Criteria aplicáveis

- `AC-US-011-01`: tokens dirigem cor, tipografia, espaçamento e estados.
- `AC-US-012-01`: contrato de navegação previsível; a Splash não exibe tabs.
- `AC-US-091-01`: shell PWA e reabertura compatíveis com bootstrap.
- `AC-US-091-02`: offline não autoriza checkout ou ação insegura.
- `AC-US-094-01`: chaves ES/EN/PT, fallback espanhol e zero raw string na tela.
- `AC-US-094-02`: ausência de tradução falha no CI ou usa fallback com aviso não PII.
- `US-095`: baseline de teclado, foco, semântica e tecnologia assistiva.

## 11. Critério de congelamento

A C-001 só pode receber `APPROVED_FROZEN` quando o mesmo SHA possuir:

- lint, type-check, testes unitários e builds verdes;
- Storybook executável;
- Axe sem violações críticas/sérias;
- Playwright funcional e visual;
- screenshots em 360×800, 390×844 e 1170×2532;
- estados oficiais capturados;
- console sem erros;
- auditoria de escopo comprovando C-005 intocada;
- manifesto e hashes vinculados ao SHA;
- workflow GitHub Actions verde;
- PR draft sem merge em `main`.
