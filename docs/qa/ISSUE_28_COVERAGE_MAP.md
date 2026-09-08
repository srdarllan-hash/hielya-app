# Issue #28 — preservação da intenção de C-005

A rota pública continua sendo `HomeCatalogRuntime`, certificada no Gate Home/Catalog (v2.7) e integrada à main via PR #19. Main não equivale a produção ativada. Nenhuma nova interface de estados foi adicionada à aplicação.

| Intenção | Interface correta | Cobertura |
|---|---|---|
| READY, LOADING, ERROR e estado vazio do catálogo | HTTP público controlado + `data-home-catalog-state` | `home.functional.spec.ts` + suites `home-catalog-api-integration.*` |
| Erros de console após término da carga | Esperar respostas de categories/products e estado final; não usar o default `data-screen-state=ready` como sinal de conclusão | Testes runtime de `home.functional.spec.ts`, inclusive pausa explícita em LOADING |
| Closed, high-demand, alcohol-cutoff, out-of-area, empty-cart | Stories existentes de HomeScreen, componente de apresentação | `home.functional.spec.ts`, `home.a11y.spec.ts`, `home.visual.spec.ts` |
| ready/loading/error da apresentação histórica | Stories existentes, com fixture histórica explícita | Mesmos testes; não confundir esses estados com o catálogo da rota pública |
| open-cart, change-address, select-category, add-product | Stories: todas as quatro ações originais são preservadas | Teste de ações tipadas original |
| Busca, filtro, recuperação, resposta fora de ordem e exposição pública segura | HomeCatalogRuntime/HTTP | Suite funcional de integração existente, sem reduzir asserções |
| Visual e WCAG AA da rota pública | HomeCatalogRuntime/HTTP, quatro estados de catálogo | Suites visual e acessibilidade de integração existentes e suas referências revisadas |

`playwright.config.ts` passa a iniciar também o host estático do Storybook para as verificações de apresentação; o host Next continua sendo usado pelos testes de runtime e pelas demais telas. O workflow adicional gera o Storybook antes de foundation e continua proibindo geração de baselines no CI. O workflow Opaque Session não é modificado.

## Delimitação de correção visual

O commit `9e216a8612c20c71cc020a21fea8723bbc1daa0c`, certificado em `274d72db6babbf2605d7fecc9946adb28fbd6593`, mudou a apresentação: título de seção de Más vendidos para Productos, busca para Busca productos…, mensagem de erro de catálogo e dados de disponibilidade/idade em cards. As stories passaram a receber a fixture explicitamente. As imagens antigas de C-005 antecedem essa integração. Qualquer nova referência de apresentação deve refletir somente esse código já integrado e ser inspecionada contra a referência anterior; as imagens históricas serão mantidas, sem transformar fixtures em dados de produção.

## Primeira execução completa: causas adicionais do harness, antes da correção

Run 34077414469, foundation: 334 pass / 35 fail. Demais suites verdes.
- 21 visuais: sete estados de apresentação em três projetos; loading já passa. As diferenças correspondem às mudanças de texto/dados do commit 9e216a8 descritas acima, não à rota atual nem ao token. Revisar os actual e usar namespace novo, preservando os 24 PNGs históricos.
- 12 acessibilidade: `Axe is already running`. O addon a11y inicia análise ao abrir a story; o Playwright iniciava outra simultaneamente. Usar `globals.a11y.manual=true` somente na URL de execução do harness; o Axe do Playwright continua obrigatório com os mesmos quatro tags WCAG, sem ignorar violações. Fonte: https://storybook.js.org/docs/writing-tests/accessibility-testing (globals.a11y.manual).
- 2 runtime ERROR: o payload de categories era inválido; HomeCatalogRuntime aborta o request irmão no catch (linha 230). Esperar uma response de products abortada é incorreto. A fixture de erro deve concluir categories primeiro e só então entregar products inválido; assim ambos terminam e a transição ERROR continua testada sem aceitar erros de console. READY e LOADING controlado passaram nos três projetos; não foi necessário repetir até passar.

## Segunda execução completa: seletor de estado bloqueado, antes da correção

Run 34078119535: foundation 363 pass / 6 fail; demais jobs verdes. Os 24 visuais de apresentação, os 24 testes de acessibilidade e os 12 cenários runtime passaram. As seis falhas estão na nova asserção de botão bloqueado (closed/out-of-area × três projetos): ProductCard usa `aria-label=Victoria Málaga no disponible` quando blocked, mas o teste buscava o rótulo habilitado `Añadir Victoria Málaga al carrito`. Corrigir somente o seletor para o nome acessível do estado bloqueado; manter `toBeDisabled`. Nenhuma mudança de componente nem baseline.
