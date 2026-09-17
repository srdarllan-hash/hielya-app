# HIELYA CHECKPOINT v9.7 — CLIENT_SESSION_HTTPONLY_COOKIE_CANDIDATE

Data e hora do evento: 2026-09-17 (Europe/Madrid). Registro criado no repositório.
Checkpoint anterior: v9.6 (`CODEX_PROOF_BUDGET_PREPARATION`), preservado integralmente.
Autorização: Issue #75. Branch `hielya/session-httponly-cookie`, base `main`
`6251c0b99376daac3a86b20156fa44d22229a09f`.

## Resumo executivo

A sessão do cliente vivia apenas na memória do navegador (`createMemorySessionStore`), cujo
próprio comentário a declarava "Integration seam for a future secure-storage ADR" que
"intentionally loses state on reload". Recarregar a página deslogava o cliente, o que torna
impossível concluir uma compra. Esta entrega preenche essa costura: o token opaco passa a ser
entregue **exclusivamente** por cookie `HttpOnly`, e o cliente hidrata seu estado de
autenticação a partir do servidor.

Esta é a dependência bloqueante de checkout, pedidos e pagamento.

## Supersessão de ADR

Esta entrega supersede partes do ADR certificado
`ADR-MVP-LOCAL-36-OPAQUE-CUSTOMER-SESSION-V1-2.md`, com autorização explícita do
proprietário registrada na Issue #75, seguindo o precedente da Issue #53 (C-003/C-004,
também listados como fora de escopo no mesmo ADR, foram autorizados e implementados nos
PRs #52/#54). **O ADR V1.2 permanece evidência imutável — foi superseded, nunca editado.**

Superseded: Decisão 1 e a porção de token bruto da Decisão 2 (nenhum `sessionToken` em corpo
de resposta); Decisão 6 e a lista de "únicos adaptadores HTTP autorizados"; as exclusões de
`cookies`, `logout` e `/me` nas Consequências.

Permanece integralmente em vigor: 32 bytes de entropia; apenas o SHA-256 persistido; sessões
revogáveis; expiração absoluta de 2.592.000 s; sem par de tokens, renovação, rotação ou chave
de assinatura; runtime restrito a development/test; `HIELYA_OTP_PEPPER` obrigatório sem
default; SMS simulado. Application segue independente de HTTP, Next.js, React e SQLite.

Novo ADR: `docs/decisions/ADR-CLIENT-SESSION-HTTPONLY-COOKIE.md`.
Novo contrato: `contracts/openapi/HIELYA_OPENAPI_CLIENT_SESSION_V1_5.yaml`. Os contratos
V1.0–V1.4 permanecem byte-a-byte inalterados.

## Implementação

Servidor (`apps/ui-lab`):
- `POST /auth/otp/verify` passa a emitir `Set-Cookie: hielya_session=<token>; HttpOnly;
  Secure; SameSite=Strict; Path=/; Max-Age=<restante>`. O token bruto foi **removido do corpo
  da resposta**; o corpo carrega apenas `customer` e `expiresInSeconds`.
- Novo `GET /auth/session`: lê o cookie, delega a `ValidateCustomerSession` (sem segundo
  validador), devolve cliente e expiração, nunca o token; 401 `SESSION_INVALID` para ausente,
  expirado, malformado ou revogado.
- Novo `POST /auth/logout`: delega a `RevokeCustomerSession`, limpa o cookie com `Max-Age=0`
  e os mesmos atributos, responde 204 e é idempotente.
- Novo módulo de transporte `session-cookie.ts`. `readSessionCookie` exige exatamente uma
  ocorrência do cookie, rejeitando cookie-shadowing por duplicatas.

Cliente:
- `AuthSession` e `VerificationResponse` **perderam o campo `sessionToken`** — o cliente ficou
  estruturalmente incapaz de reter a credencial, garantido por tipo.
- `AuthProvider` hidrata no mount via `GET /auth/session` com `credentials: 'same-origin'`,
  descarta resultado obsoleto se o usuário autenticar durante a hidratação, e aborta no
  unmount. `useIsAuthenticated` continua expondo apenas um booleano.

## Autoria e revisão

Implementado por **GPT-5.6 Sol via Codex CLI 0.154.0**, executando localmente com sandbox
`workspace-write`, a partir de uma especificação escrita nesta sessão. Revisado por Claude.
Esta é execução local assistida, **não** o controlador automático da Issue #72 — nenhum
workflow despacha Codex, nenhum ledger persistente existe, `/orquestrar-hielya` permanece
BLOCKED e nenhum papel ou contrato de automação foi alterado.

Uma primeira execução do Codex **parou e recusou implementar**, reportando corretamente que o
ADR V1.2 proibia exatamente este trabalho e que a especificação continha uma contradição
interna (exigia manter o corpo do verify inalterado e simultaneamente proibia o token em
qualquer corpo). A especificação foi corrigida e a autorização obtida antes da segunda
execução. Nenhum arquivo foi tocado na primeira tentativa.

Correções aplicadas por Claude na revisão, sobre o resultado do Codex:
1. `auth-http.ts`: o `maxAge` relia o relógio em vez de reusar o `now` já capturado na mesma
   requisição, e havia perdido o `minimum: 1` do código original. Como esse mesmo valor virou
   o `Max-Age` do cookie, um `0` faria o navegador **apagar o cookie recém-emitido** enquanto
   a resposta dizia 200 — falha silenciosa de autenticação em caso de borda. Restaurado.
2. `tests/cart-flow/cart-flow.spec.ts`: mock do verify ficara no formato antigo, com
   `sessionToken` e sem `set-cookie`. Atualizado para o contrato novo.
3. Três arquivos fora do escopo autorizado (`eslint.config.mjs`,
   `tests/unit/mvp-persistence.test.ts`, `tests/unit/mvp-public-api-integration.test.ts`)
   foram separados para PR próprio. São correções legítimas de falhas pré-existentes
   exclusivas de Windows, mas não pertencem a esta autorização.
4. Artefato solto `SESSION_COOKIE_REPORT.md` removido da raiz do repositório.

## Validação

Executada por Claude, de forma independente do relatório do Codex:
- `pnpm exec vitest run tests/unit`: **577/578**. A única falha e o único erro de suíte são as
  duas falhas pré-existentes exclusivas de Windows (`mvp-persistence`, separador de caminho;
  `mvp-public-api-integration`, `EPERM` de lock de arquivo), idênticas às observadas em `main`
  sem qualquer alteração, e agora endereçadas no PR separado. Nenhuma falha vem deste trabalho.
- `pnpm exec tsc --noEmit`: limpo.
- `pnpm exec eslint .`: 0 erros (8 warnings pré-existentes sobre `<img>`).
- Varredura de vazamento: `sessionToken` não ocorre em nenhum código-fonte de `apps`,
  `packages` ou `tests`, exceto como asserção **negativa** em três suítes
  (`not.toHaveProperty('sessionToken')`) e como string proibida no teste de contrato.
- Constraints verificadas: migration 0001 byte-a-byte intacta, ADR V1.2 e contratos V1.0–V1.4
  intactos, nenhum checkpoint, `CLAUDE.md`, workflow ou secret tocado.
- **Não executado**: suítes Playwright (`auth-flow`, `cart-flow`) — exigem browsers e servidor;
  ficam para a CI remota do PR. Nenhuma alegação de aprovação dessas suítes é feita aqui.

## Pendências e próximos passos

- Merge requer revisão e aprovação de PR específica do proprietário.
- Próxima tarefa do caminho crítico: contrato e implementação de checkout (2A/2B), agora
  destravada por esta entrega.
- `Secure` no cookie exige HTTPS; navegadores tratam `localhost` como contexto seguro, então
  desenvolvimento local funciona, mas hosts de desenvolvimento não-localhost em HTTP puro não
  receberão o cookie.
- Não introduzidos: UI de logout, recuperação de carrinho, endpoint de refresh, gestão de
  sessão entre dispositivos, SMS real, checkout, pedidos, pagamentos, produção ou deploy.

## Confirmação de alterações

- `main`: NÃO alterada. PR será aberto como draft; NÃO mergeado.
- Produção, secrets, ruleset, migrations, workflows existentes: NÃO alterados.

## Revisão para publicação pública

Apenas decisões técnicas, caminhos, identificadores públicos e resultados de teste. Sem
credenciais, chaves, pepper, valores de OTP, tokens de sessão ou dados pessoais.
