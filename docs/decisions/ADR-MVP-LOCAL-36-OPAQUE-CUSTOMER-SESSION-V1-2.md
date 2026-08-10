# ADR: Sessão opaca de cliente e transporte OTP do MVP Local 36 V1.2

- Status: Aceito para o Gate de contrato público e transporte HTTP
- Base certificada: `68d5f5422a9dff560b301c17fe1bce466ac7281a`
- Contrato: `contracts/openapi/HIELYA_OPENAPI_MVP_LOCAL_36_V1_2.yaml`
- Perfil: `MVP_LOCAL_36`
- Produção: bloqueada

## Contexto

O contrato original descreve uma estratégia de credenciais incompatível com a fundação de
autenticação certificada no PR #15. Essa fundação persiste somente o hash de uma sessão
revogável, com validade absoluta de 30 dias, e não implementa renovação, cookies ou
middleware bearer.

O OpenAPI V1.0 e o OpenAPI MVP Local 36 V1.1 permanecem evidências imutáveis. O V1.2 é
derivado diretamente do V1.1 e resolve a divergência exclusivamente para o perfil
`MVP_LOCAL_36`.

## Decisão

1. A autenticação bem-sucedida devolve exatamente um `sessionToken` opaco,
   `expiresInSeconds` calculado pelo servidor e o cliente autenticado mínimo.
2. O token possui 32 bytes de entropia. O valor bruto é devolvido uma única vez e somente
   seu SHA-256 é persistido.
3. A sessão é revogável e expira de forma absoluta após 2.592.000 segundos.
4. Não existe par de tokens, renovação, rotação, chave de assinatura ou publicação de
   chaves.
5. `customerBearer` preserva o nome histórico, usa `scheme: bearer` e declara
   `bearerFormat: OpaqueSessionToken`.
6. O Gate implementa somente `POST /api/v1/auth/otp/request` e
   `POST /api/v1/auth/otp/verify`.
7. O verify público recebe somente `challengeId` e `code`; o telefone é recuperado
   internamente pelo challenge.
8. O runtime é restrito a development/test, exige banco existente e gravável e exige
   `HIELYA_OTP_PEPPER` sem valor padrão.
9. A entrega SMS permanece simulada, explícita, sem rede e sem exposição do OTP.

Os únicos adaptadores HTTP autorizados são:

- `POST /api/v1/auth/otp/request` em `apps/ui-lab/app/api/v1/auth/otp/request/route.ts`.
- `POST /api/v1/auth/otp/verify` em `apps/ui-lab/app/api/v1/auth/otp/verify/route.ts`.

## Fronteiras

- Application contém casos de uso, portas e criptografia, sem HTTP ou SQL.
- Persistence implementa a porta de challenge e as transições atômicas em SQLite.
- `apps/ui-lab` valida transporte, compõe dependências e mapeia respostas seguras.
- Os Route Handlers não contêm regra de autenticação nem consulta direta ao banco.

## Consequências

Navegação pública continua anônima e checkout continua dependente de uma camada futura de
autenticação. C-003, C-004, UI, cookies, renovação, logout, `/me`, carrinho, checkout,
pedidos, pagamentos, Admin, SMS real, produção, deploy e merge permanecem fora do escopo.
Nenhuma migration ou dependência externa é adicionada.
