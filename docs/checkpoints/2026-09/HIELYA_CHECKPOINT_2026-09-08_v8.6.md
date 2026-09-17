# HIELYA CHECKPOINT v8.6 — CART_RUNTIME_IMPLEMENTATION_CANDIDATE

Data/hora: 2026-09-08T09:57:26.939890+00:00 (UTC). Predecessor: v8.5, preservado. Issue #56; branch hielya/cart-runtime. Base main confirmada ao vivo: c3a1e53c8638d476721e0d5b1442f36b0326a861 (merge do PR55). PR54 incorporou autenticação; PR55 incorporou v8.5. Nenhum novo merge autorizado.

## Resumo e Decision Log

O proprietário autorizou carrinho anônimo com ID opaco somente em memória, vínculo após login, endereço persistido mínimo reaproveitando C002 e reserva de10min como fim do fluxo. Sem pedidos/pagamento/gestão de endereços. Cupom e recomendações não entram. “Continuar” é Button primary/md/largura total; “Productos reservados” com contador somente após reserva; “Reserva caducada” com “Reservar de nuevo” após expiração. Login do carrinho e Ahora no retornam ao carrinho; /login independente mantém Home.

Expiração conserva itens e exige nova ação explícita com todas as validações. Edição cancela integralmente a reserva ativa e libera estoque atomicamente; não recria reserva. Corrida edição/expiração deve liberar uma vez, sem estoque negativo. Validação no servidor inclui estoque e componentes, mínimo EUR25 somente produtos, frete EUR2+EUR0,60/km, raio rodoviário4km, operação10:00–22:00 Madrid e cutoff dinâmico existente. HIGH e álcool indisponível coexistem.

Durante implementação, o CHECK commercially_active=0 impediu ativação dos registros. O proprietário autorizou SOMENTE projeção de leitura dev/test dos 30+6 produtos. HIELYA_DEV_TEST_CATALOG=1 requer NODE_ENV=development/test em cada leitura; production falha explicitamente, inclusive em adaptador já criado. Migration0001, suas constraints, registros comerciais e catálogo canônico permanecem intactos. Gate de ativação comercial REAL não foi aberto.

## Alterações e documentos canônicos

- packages/application/src/cart: serviço e portas sem React/Next/SQLite.
- packages/persistence/src/cart.ts, dev-test-catalog.ts e migration0008 aditiva: carrinhos, endereços, recibos e integração à reserva existente.
- apps/ui-lab: oito novos arquivos de rotas para carrinho/claim/items/validate/address/reservation; transporte e composição; provider em memória, /cart e /cart/address; continuação contextual do login e navegação preservando memória.
- packages/ui/src/screens/cart: tela, CSS exclusivamente por tokens1.2.0 e13 stories.
- Contrato dedicado HIELYA_OPENAPI_CART_RUNTIME_V1_4.yaml; contratos históricos não reescritos.
- docs/requirements/CART_RUNTIME_SCOPE.md e docs/decisions/ADR-CART-DEV-TEST-PROJECTION.md registram decisões, mecanismo e fronteiras.
- KNOWN_DEBT, CLAUDE e configuração opt-in documentados. INDEX recebe nova linha; nenhum checkpoint anterior é alterado.
- Testes de carrinho, inventário explícito de rotas/migrations e workflow Cart UI Validation adicional. Baselines e workflows anteriores preservados.

## Evidências no instante da criação

Typecheck, build Next e build Storybook passaram localmente. Auditoria de estilos passou, sem variáveis de token indefinidas. Suíte completa local passou com558 testes antes da última adição de teste de sessão revogada durante routing; os33 testes específicos do carrinho passaram após essa adição. Validação completa final e CI remota ainda pendentes neste registro. Evidência final será registrada no PR, sem reescrever este checkpoint.

Testes cobrem mínimo e raio nos limites, horário, estoque e packs, conexões SQLite independentes, idempotência, ownership, sessão, expiração/edição e guard de produção. Stories/jornadas Playwright/axe em Chromium360 e WebKit390 aguardam execução remota. Não declarar CI verde, aprovação visual manual, operação comercial real ou deploy a partir deste candidato.

## Pendências, riscos e próximos passos

Concluir CI no head exato, corrigir qualquer falha sem relaxar regras, abrir/apresentar PR para revisão e aguardar autorização própria de merge. Asserções de inventário de rotas/migrations foram ampliadas para o escopo autorizado; hashes e constraints anteriores continuam verificadas.

Produção/ativação comercial real, integrações reais, storage persistente da sessão/carrinho, recomendações, retenção de carrinhos sem acesso, pedidos/pagamentos e demais dívidas existentes continuam pendentes. Routing/SLA/geocoding permanecem nas portas/simulações de desenvolvimento já existentes, sem fallback otimista. A projeção não cria estoque. Documento de endereço mínimo é persistido sob ownership, sem tela SAVED_ADDRESSES.

Main não alterada nesta entrega; produção não alterada. Branch/PR candidato devem conter somente fontes e documentos revisados; builds/fixtures de execução gerados ficam fora do commit. Revisão para repositório público: nenhum valor real de credencial, OTP, sessão, dado pessoal ou segredo operacional incluído. Fontes: GitHub main/PR54/PR55, contratos e ADRs locais, decisões expressas do proprietário e saídas de validação desta branch.
