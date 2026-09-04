# C-001 Splash — Plano Técnico

**Branch:** `hielya/c001-splash-gate1b`  
**Base exata:** `be61e1168b93d973101496cc66cb54d006aba9cc`  
**Objetivo:** implementar e certificar exclusivamente C-001 sem alterar C-005.

## 1. Arquivos a criar

```text
apps/ui-lab/app/splash/page.tsx
packages/ui/src/screens/splash/SplashScreen.tsx
packages/ui/src/screens/splash/SplashScreen.module.css
packages/ui/src/screens/splash/splash.types.ts
packages/ui/src/screens/splash/splash.copy.ts
packages/ui/src/screens/splash/SplashScreen.stories.tsx
tests/unit/splash.unit.test.tsx
tests/accessibility/splash.a11y.spec.ts
tests/functional/splash.functional.spec.ts
tests/visual/splash.visual.spec.ts
manifests/C-001.json
manifests/C-001-assets.json
docs/reference/C-001_SPLASH_APPROVED_REFERENCE_V1.png
docs/c001/C001_REQUIREMENTS_REPORT.md
docs/c001/C001_ASSET_INVENTORY.md
docs/c001/C001_TECHNICAL_PLAN.md
docs/c001/C001_GATE_CHECKLIST.md
scripts/audit-c001-scope.mjs
scripts/audit-c001-manifest.py
scripts/collect-c001-visual-candidates.mjs
scripts/generate-c001-gate-manifest.mjs
.github/workflows/c001-gate.yml
```

## 2. Arquivos a modificar

```text
package.json
packages/ui/src/index.ts
CHANGELOG.md
README.md
```

Nenhum arquivo em `packages/ui/src/screens/home/`, `manifests/C-005.json`, `tests/**/home*` ou `.github/workflows/c005-gate.yml` pode ser modificado.

## 3. Componentes reutilizados

- `AppShell`
- `AppHeader`

O lockup do `AppHeader` é reutilizado sem ações de perfil/carrinho no contexto da Splash, por meio de escopo CSS local. A C-005 e a variante padrão do componente permanecem inalteradas.

## 4. Componentes novos

Nenhum componente canônico novo.

`SplashScreen` é uma tela de domínio. O indicador visual é markup interno, escopado ao CSS Module da tela. A decisão evita duplicar ou alterar componentes congelados da C-005.

## 5. Contrato de props

```ts
type SplashState =
  | 'initial'
  | 'loading'
  | 'transition'
  | 'offline'
  | 'error'
  | 'timeout'
  | 'maintenance'
  | 'ready-location'
  | 'ready-home'
  | 'reduced-motion';

type SplashNextScreen = 'C-002' | 'C-005' | null;
```

A tela recebe estado e destino como dados controlados. Ela não inventa API, timer ou roteamento para telas bloqueadas.

## 6. Rotas de laboratório

```text
/splash?state=initial
/splash?state=loading
/splash?state=transition&next=C-002
/splash?state=transition&next=C-005
/splash?state=offline
/splash?state=error
/splash?state=timeout
/splash?state=maintenance
/splash?state=ready-location
/splash?state=ready-home
/splash?state=reduced-motion
```

A rota não redireciona automaticamente durante o Gate. O atributo `data-next-screen` e o manifesto comprovam o contrato de saída sem iniciar C-002.

## 7. Storybook

Stories obrigatórias:

- Initial
- Loading
- TransitionToLocation
- TransitionToHome
- Offline
- Error
- Timeout
- Maintenance
- ReadyLocation
- ReadyHome
- ReducedMotion
- EnglishFallbackContract
- PortugueseContract

## 8. Testes unitários

- renderiza o lockup e slogan oficial;
- aplica `aria-busy` em loading;
- expõe `data-next-screen=C-002` no primeiro acesso;
- expõe `data-next-screen=C-005` no retorno válido;
- não aponta para C-003 ou C-004;
- exibe retry em offline/error/timeout;
- não contém duração fixa/timer;
- usa copy trilíngue com fallback espanhol.

## 9. Testes Playwright e Axe

### Funcionais

- rota de cada estado renderiza sem erro de console;
- estados de saída expõem destino correto;
- botão retry permanece visível e focalizável;
- C-002 não é renderizada;
- C-003/C-004 não são destinos;
- C-005 continua acessível e visualmente intacta no root.

### Axe

- todos os estados em 360×800, 390×844 e 1170×2532;
- WCAG 2.1 A/AA;
- zero violações críticas ou sérias;
- loader decorativo ignorado por tecnologia assistiva;
- anúncios de status corretos.

### Visual e responsivo

- screenshots de todos os estados nas três resoluções oficiais;
- captura full-page do estado loading;
- comparação com referência aprovada para estado loading;
- sem overflow horizontal;
- conteúdo central preservado em safe areas;
- reduced-motion sem animação;
- primeira execução produz hashes candidatos;
- execução final compara o mesmo conjunto de 30 hashes congelados.

## 10. Auditoria de escopo

O script `audit-c001-scope.mjs` falha se o diff desde `be61e1168b93d973101496cc66cb54d006aba9cc` modificar:

```text
packages/ui/src/screens/home/**
manifests/C-005.json
tests/**/home*
.github/workflows/c005-gate.yml
```

Também falha se houver:

- `TODO`, `FIXME` ou `HACK` no código C-001;
- cores hardcoded proibidas no CSS Module;
- referência a Canva;
- destino C-003/C-004;
- timer inventado;
- implementação de telas bloqueadas.

## 11. Workflow Gate 1B/C-001

O workflow:

1. faz checkout do SHA exato do PR;
2. valida que a base congelada é ancestral;
3. instala com Node 24 e pnpm 10.15.0;
4. executa lockfile congelado;
5. lint;
6. type-check;
7. testes unitários;
8. build Next.js;
9. build Storybook;
10. Chromium;
11. Axe;
12. funcionais;
13. screenshots e regressão visual;
14. coleta hashes visuais;
15. auditoria de escopo;
16. auditoria do manifesto;
17. gera manifesto, relatório e SHA-256;
18. publica artefato ligado ao mesmo commit.

## 12. Critérios de congelamento

```text
BRANCH_INTEGRATED = TRUE
QA_PASSED = TRUE
APPROVED_FROZEN = TRUE
WORK_INTEGRATED = FALSE
```

Somente quando:

- workflow verde no SHA exato;
- evidências baixadas e inspecionadas;
- screenshots coerentes com a referência;
- zero alteração na C-005;
- PR permanece draft e não é mesclado;
- manifesto e hashes correspondem ao SHA.
