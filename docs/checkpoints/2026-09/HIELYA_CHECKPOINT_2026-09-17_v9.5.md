# HIELYA CHECKPOINT v9.5 — PHONE_INPUT_HYDRATION_RACE_FIX_CANDIDATE

Data e hora do evento: 2026-09-17 (Europe/Madrid). Registro criado no repositório.
Checkpoint anterior: v9.3 (`CLAUDE_DIAGNOSTIC_CLOSEOUT`), preservado integralmente.
v9.4 está reservada pelo PR #73 (aberto, não mergeado); esta entrega usa v9.5 para
não colidir.

## Resumo executivo e estado factual

O PR #58 (`hielya/auth-hydration-diagnosis`, diagnóstico isolado, não mergeado)
identificou e reproduziu de forma determinística (5/5 execuções WebKit) uma condição
de corrida pré-existente entre o `<input>` renderizado no servidor e a hidratação do
React: um usuário pode digitar no telefone antes do React anexar seu `onChange`; o
commit de hidratação do React não força o valor do DOM de volta ao vazio, então o
estado controlado (`nationalDigits`) permanece vazio e o botão "Continuar" fica
desabilitado mesmo com o campo visualmente preenchido. `docs/qa/AUTH_HYDRATION_INVESTIGATION.md`
(no PR #58) confirma que `Input`, `PhoneInput`, `PhoneLoginScreen` e a máquina
client-auth eram idênticos entre a base e o candidato do PR #57 — ou seja, o defeito
**já existe na implementação C-003/C-004 mergeada em `main` (PR #54)** e não foi
introduzido pelo carrinho.

Esta branch corrige o defeito na origem, em `packages/ui/src/components/PhoneInput.tsx`,
com um branch/PR dedicado a partir de `main` — sem depender do merge do PR #57.

- Branch de trabalho: `hielya/phone-input-hydration-fix`.
- Base: `main` @ `5eed7ca5f8583dea94803e7494214bf9371c44ec`.
- Nenhum merge realizado nesta entrega.

## Correção implementada

`packages/ui/src/components/PhoneInput.tsx`: adicionado um `useEffect` (roda uma
única vez, após o commit de montagem/hidratação) que lê o valor real do DOM via
`input.current.value`, normaliza e, se divergir do estado controlado, reconcilia
chamando o mesmo caminho `commit()` já usado pelo `onChange` normal — o que atualiza
o estado interno (modo não controlado) e sempre notifica `onChange` (o que mantém um
`value` controlado externamente, como em `PhoneLoginScreen`, sincronizado). Uma
montagem normal, sem digitação prévia, é no-op porque o DOM já coincide com
`current`. `disabled`/`readOnly`/`loading` suprimem a reconciliação, preservando o
comportamento existente de bloqueio.

Abordagem escolhida entre as duas listadas no PR #58 ("impedir edição até o controle
estar pronto" vs. "reconciliar de forma segura a entrada antecipada"): a segunda,
por preservar máscara, acessibilidade e não degradar UX — conforme a própria
investigação recomendou.

## Testes

`tests/unit/form-components.test.tsx` (mesmo arquivo onde os testes de `PhoneInput`
já viviam), três casos novos usando `renderToStaticMarkup` + `hydrateRoot` do
`react-dom` para reproduzir a hidratação real (não apenas `render` do Testing
Library, que não tem a janela pré-hidratação):

1. Dígitos digitados nativamente antes da hidratação são reconciliados: valor final
   mascarado `612 345 678` e `onChange` chamado com `{ nationalDigits: '612345678',
   e164: '+34612345678' }`.
2. Hidratação sem digitação prévia é no-op (sem `onChange`, campo vazio).
3. `loading` suprime a reconciliação (sem `onChange`) mesmo com o DOM pré-preenchido.

Verificação de regressão real: os três testes foram executados com a correção
revertida (`git stash`) e o teste 1 falhou exatamente como o defeito documentado
(`Received: 612345678` sem máscara, em vez de `612 345 678`) — confirmando que o
teste captura o defeito, não é falso-positivo. Com a correção restaurada, os três
passam.

## Validação

- `node --version`: v24.19.0 (ambiente com Node disponível nesta sessão).
- `pnpm exec vitest run tests/unit/form-components.test.tsx`: 51/51 ✅ (48
  pré-existentes + 3 novos).
- `pnpm exec vitest run` (suíte completa): 528/529 ✅. As duas falhas restantes
  (`mvp-persistence.test.ts` — separador de caminho Windows vs. regex POSIX;
  `mvp-public-api-integration.test.ts` — `EPERM` do Windows ao remover diretório
  temporário) são **pré-existentes em `main` sem qualquer alteração desta branch**
  (confirmado reexecutando os dois arquivos com as mudanças stashed) — não
  relacionadas a este PR.
- `pnpm exec tsc --noEmit`: sem erros.
- `pnpm exec eslint packages/ui/src/components/PhoneInput.tsx
  tests/unit/form-components.test.tsx`: sem violações (apenas aviso de configuração
  não relacionado, sobre diretório `pages/` inexistente em app Next.js App Router).
- Suítes relacionadas também verificadas: `client-auth-flow.test.ts`,
  `auth-screens.test.tsx`, `components.unit.test.tsx` — todas passando.
- Não executado: Playwright `auth-flow` (E2E/WebKit) e o workflow diagnóstico do
  PR #58 contra este candidato — ficam para a CI remota do PR.

## Arquivos alterados

- `packages/ui/src/components/PhoneInput.tsx` — correção.
- `tests/unit/form-components.test.tsx` — três testes de regressão.
- `docs/checkpoints/2026-09/HIELYA_CHECKPOINT_2026-09-17_v9.5.md` — este checkpoint.
- `docs/checkpoints/INDEX.md` — append-only, uma linha.

Nenhuma alteração em `PhoneLoginScreen`, na máquina client-auth, em contratos, em
migrations, em secrets, no ruleset `Protect main — HIELYA` ou nos workflows
existentes. Nenhuma implementação nova de tela, produção ou integração comercial.

## Pendências e próximos passos

- Merge deste PR requer revisão e aprovação separada do proprietário, como sempre.
- Após o merge em `main`, o PR #57 (`cart-runtime`) deve sincronizar com esta
  correção antes de seu próprio merge — o defeito reproduzido pelo PR #58 afeta o
  mesmo componente que o PR #57 usa sem modificá-lo.
- Recomenda-se rodar o workflow diagnóstico do PR #58 (comparação controlada
  WebKit) contra este candidato para confirmar em CI real a mesma reconciliação
  observada localmente, antes do merge.
- PR #58 permanece como evidência histórica da investigação; não precisa ser
  mergeado para esta correção ser avaliada.

## Confirmação de alterações

- `main`: NÃO alterada.
- PR: será aberto como draft contra `main`; NÃO mergeado.
- Produção, secrets, ruleset, migrations, workflows existentes: NÃO alterados.

## Origem das evidências

- `docs/qa/AUTH_HYDRATION_INVESTIGATION.md` e corpo do PR #58
  (`hielya/auth-hydration-diagnosis`, run
  [34216149306](https://github.com/srdarllan-hash/hielya-app/actions/runs/34216149306)).
- Execução local de testes e type-check nesta sessão, no HEAD desta branch.

## Revisão para publicação pública

Conteúdo revisado: apenas decisões técnicas, caminhos, identificadores públicos de
PRs/runs e resultados de teste. Não contém credenciais, chaves, valores de OTP,
tokens de sessão, dados pessoais ou segredos operacionais.
