# C-001 Splash — Gate 1B Checklist

## A. Governança e escopo

- [x] Branch exclusiva derivada do SHA congelado da C-005.
- [x] C-005 não será modificada.
- [x] C-002, C-003 e C-004 permanecem bloqueadas.
- [x] Requisitos e lacunas documentados antes do código.
- [x] Nenhum endpoint novo inventado.
- [x] Nenhuma regra comercial alterada.
- [ ] Auditoria automática confirma escopo protegido.

## B. UI e Design System

- [ ] Design Tokens 1.1.0 usados integralmente.
- [ ] Poppins 5.3.0 usada nos pesos aprovados.
- [ ] Fundo, lockup e slogan preservam referência aprovada.
- [ ] Nenhuma cor paralela ou espaçamento arbitrário.
- [ ] Nenhum componente canônico duplicado.
- [ ] Reduced motion implementado.

## C. Estados

- [ ] initial
- [ ] loading
- [ ] transition
- [ ] offline
- [ ] error
- [ ] timeout
- [ ] maintenance
- [ ] ready-location
- [ ] ready-home
- [ ] reduced-motion

## D. Navegação contratual

- [ ] Sem contexto de localização → `C-002`.
- [ ] Contexto válido → `C-005`.
- [ ] Sessão ausente não força C-003/C-004.
- [ ] Sem implementação de C-002/C-003/C-004.
- [ ] Nenhum redirecionamento automático baseado em timer inventado.

## E. Acessibilidade

- [ ] Estrutura semântica válida.
- [ ] aria-busy em bootstrap.
- [ ] status/alert corretos.
- [ ] loader decorativo aria-hidden.
- [ ] retry com touch target mínimo 44 px.
- [ ] contraste AA.
- [ ] teclado/foco aprovados.
- [ ] prefers-reduced-motion aprovado.
- [ ] Axe verde em todos os estados e viewports.

## F. Execução técnica

- [ ] Instalação limpa/frozen lockfile.
- [ ] Lint.
- [ ] Type-check.
- [ ] Testes unitários.
- [ ] Build Next.js.
- [ ] Build Storybook.
- [ ] Playwright funcional.
- [ ] Playwright visual.
- [ ] Console sem erros.
- [ ] Auditoria de código.
- [ ] Auditoria do manifesto.

## G. Evidências

- [ ] Screenshots 360×800.
- [ ] Screenshots 390×844.
- [ ] Screenshots 1170×2532.
- [ ] Comparação com referência aprovada.
- [ ] Relatório de acessibilidade.
- [ ] Relatório responsivo.
- [ ] Manifesto ligado ao SHA.
- [ ] SHA256SUMS.
- [ ] Artefato do workflow.
- [ ] Logs do workflow.

## H. Encerramento

- [ ] `BRANCH_INTEGRATED = TRUE`
- [ ] `QA_PASSED = TRUE`
- [ ] `APPROVED_FROZEN = TRUE`
- [ ] `WORK_INTEGRATED = FALSE`
- [ ] PR permanece draft.
- [ ] Nenhum merge em `main`.
- [ ] C-002 passa para `AUTHORIZED_NOT_STARTED` somente após aprovação.
