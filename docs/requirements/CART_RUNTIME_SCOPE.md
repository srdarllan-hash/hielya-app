# Carrinho runtime — escopo autorizado e decisões pendentes

Issue: [#56](https://github.com/srdarllan-hash/hielya-app/issues/56).
Status: escopo funcional, apresentação e projeção dev/test ratificados; implementação candidata, sujeita a CI e revisão. Não certifica produção.

## Decisões ratificadas

- Catálogo público de 30 produtos unitários e seis packs. Adicionar, remover e alterar quantidade; preços e componentes vêm exclusivamente do catálogo certificado.
- Carrinho anônimo identificado por ID opaco apenas em memória no cliente, sem recuperação após reload. Persistência server-side necessária aos contratos; ao autenticar, vincular o carrinho da sessão atual ao cliente. Storage persistente no cliente depende do mesmo ADR pendente de sessão.
- Endereço persistido mínimo, vinculado ao cliente autenticado, reaproveitando C-002. SAVED_ADDRESSES fora de escopo.
- Cupom fora do MVP. Remover bloco de cupom e linha de desconto da referência; WELCOME10 não é contrato certificado.
- Servidor valida estoque disponível em tempo real, componentes de packs, mínimo de EUR25 apenas em produtos, distância rodoviária até4km, operação10:00–22:00 Europe/Madrid e elegibilidade dinâmica de álcool existente. Frete EUR2 + EUR0,60/km, por configuração certificada. Cliente não decide regras comerciais.
- Alta demanda e álcool indisponível coexistem; informação vencida deve ser atualizada. Adição de álcool inelegível e avanço de composição inelegível são bloqueados pelo servidor.
- POST /carts/{cartId}/validate não reserva. POST /checkout/reservations cria reserva atômica de10min, com todas as validações. Fluxo termina na reserva; nenhum pedido ou pagamento.
- Expiração libera estoque, mantém itens e apresenta "Reserva caducada". Nova reserva somente por ação explícita, repetindo todas as validações; nunca renovar automaticamente.
- Qualquer adição, remoção ou mudança de quantidade cancela integralmente a reserva ativa e libera imediatamente o estoque. Carrinho volta ao estado não-reservado. Não reservar novamente de forma automática.
- Edição e expiração concorrentes não podem liberar estoque duas vezes nem ressuscitar reserva vencida. Cobrir ambas as ordens de execução e o instante exato do deadline em testes.

## Evidência existente

O contrato histórico V1.0 separa validate e checkout/reservations. V1.3 ainda marca validate como deferred. A fundação em packages/persistence/src/index.ts agrega componentes e reservas concorrentes; considera indisponíveis apenas reservas ACTIVE com expires_at posterior ao instante consultado. Expiração registra RELEASED com motivo EXPIRED; cancelamento manual registra RELEASED com motivo MANUAL. A integração deve preservar esses estados internos e mapear o contrato público explicitamente.

Referência visual inspecionada: HLY_CLIENT_CART_COUPON_APPLIED_V2.png, opção A, Drive ID 1lsB2IMEw1f2g86eKIPwhm2T0T7hzfraU. REFERENCE_ONLY; todos os valores visuais vêm de design-tokens1.2.0 APPROVED_FROZEN. Preços, packs, desconto, mínimo calculado e frete exibidos no PNG não substituem dados do servidor.

## Apresentação e navegação ratificadas em 2026-09-08

1. Substituir "Finalizar compra" por "Continuar", usando Button canônico primary/md/full-width. Mostrar reserva ativa no próprio carrinho, com "Productos reservados" e contador baseado no expiresAt do servidor; impedir segunda reserva enquanto ativa, manter edição disponível. Após expiração, ação "Reservar de nuevo". Não criar tela de sucesso separada.
2. Omitir "Completa tu pedido / Sugerencias para ti": seleção/ordenação de recomendações não foi especificada. Não inventar recomendações ou preços a partir do PNG.
3. Login iniciado pelo carrinho retorna ao carrinho após OTP para vincular os itens e continuar com endereço/validação; a entrada independente /login mantém retorno à Home. "Ahora no" no contexto do carrinho retorna ao carrinho anônimo.

As três decisões foram aprovadas pelo proprietário com o ajuste do CTA para "Continuar". O contador aparece somente após a reserva ativa. Recomendações permanecem como dívida até haver critério de seleção e ordenação.

## Validação exigida para entrega

Testar estoque acima do disponível e concorrência entre clientes; agregação unitários/packs compartilhando componentes; mínimo abaixo/exatamente/acima de2500centavos; raio dentro/exatamente/fora de4km; abertura10:00 e fechamento22:00; álcool dentro/fora/expirando em sessão; edição com reserva ativa e edição concorrente à expiração; retry/idempotência sem duplicar reserva ou liberação. Cobrir estados e acessibilidade da tela após ratificação. CI verde no head final, checkpoint novo e PR sem merge.

## Resolução do bloqueio comercial

O proprietário autorizou somente a projeção explícita de desenvolvimento/testes. O CHECK de 0001 permanece intacto, sem ativação comercial real. Mecanismo, guardas, contrato e evidências em [ADR de projeção dev/test](../decisions/ADR-CART-DEV-TEST-PROJECTION.md).

## Implementação candidata

Camada de aplicação: CartService. Adaptador: SqliteCartRepository com migration aditiva 0008. Transporte em apps/ui-lab, sob /api/v1, com sessão opaca e ownership. Carrinho e login compartilham estado apenas na montagem do aplicativo; navegação interna preserva memória. C-002 é reutilizado com repositório de localização em memória na entrada /cart/address; o endereço é gravado no servidor sob sessão autenticada antes do validate.

A tela /cart usa CartScreen e tokens1.2.0. Mantém itens após expiração, mostra estados simultâneos de demanda e álcool, e não tem cupom/recomendações. “Continuar” conduz ao login/endereço quando necessário e, após confirmação explícita, à validação e reserva. Não confirma compra nem cria pedido.

O servidor emite refreshAfterMs limitado pela expiração da informação e pela reserva. Cliente consulta de novo no prazo, ao reconectar e ao voltar à aba; o contador é apresentação do expiresAt/serverNow do servidor, sem decisão comercial local. Falha de rede não confirma reserva e não dispara renovação. “Reintentar” reconcilia a leitura; “Reservar de nuevo” é ação explícita separada.
