# Design Tokens 1.2.0 — inventário pré-promoção

Gate DESIGN_TOKENS_1.2.0_PROMOTION; Issue #31; verificado em 2026-09-07T03:30:40.790461+00:00.

Base congelada 1.1.0: `c838cfc26176b2e748bdbd037147a7f362d5a3c2` (C-001); main no ato: `4d32cebcc7f68832940f6825177d5348d63f245a`.
Comparação semântica de tokens.json: **106 tokens preservados integralmente, 64 adicionados, zero removidos, zero valores/tipos/descrições anteriores alterados**. Os oito typeStyles permanecem idênticos. Paleta fundamental, fonte Poppins, pesos, escalas, spacing, radius, breakpoints e tokens fundamentais mantidos.

## Proveniência do delta completo

- `8bd134f4749c48e0921589add766e9b9bad9b418`: consolidação 1.2.0, 63 adições que explicitam geometria/efeitos/opacidade/motion já usados, compilador determinístico e serialização válida de sombras. Documentado em `docs/consolidation/ARCHITECTURE_CONSOLIDATION_REPORT.md`; incorporado na cadeia certificada e coberto pela regressão atual.
- `1ada833` / PR #26: única adição posterior no JSON, `color.semantic.dangerBackground = #D83A3A`. Button passou a consumir esse fundo; `dangerFill = #EF4444` e `dangerText = #F87171` foram preservados. Branco sobre o fundo danger: 4.579:1 (PASS AA normal).
- O log completo de tokens.json entre a baseline e main contém somente esses dois commits. Não há mudança local pendente nos tokens no início deste gate. Este documento completa o detalhamento agregado do v4.9; não reescreve o checkpoint histórico.
- O congelamento não cria hover/pressed ou componentes de campo ausentes. Certifica somente o contrato já implementado.

## Adições exatas

| Token | Valor | Tipo | Proveniência |
|---|---|---|---|
| `color.effect.brandGlowMedium` | `rgba(212,160,23,0.15)` | `color` | 8bd134f — consolidação |
| `color.effect.brandGlowSoft` | `rgba(212,160,23,0.08)` | `color` | 8bd134f — consolidação |
| `color.effect.brandGlowStrong` | `rgba(246,184,0,0.30)` | `color` | 8bd134f — consolidação |
| `color.effect.dangerSubtle` | `rgba(239,68,68,0.12)` | `color` | 8bd134f — consolidação |
| `color.effect.heroEnd` | `rgba(0,0,0,0.08)` | `color` | 8bd134f — consolidação |
| `color.effect.heroMiddle` | `rgba(0,0,0,0.82)` | `color` | 8bd134f — consolidação |
| `color.effect.heroStart` | `rgba(0,0,0,0.96)` | `color` | 8bd134f — consolidação |
| `color.semantic.dangerBackground` | `#D83A3A` | `color` | PR #26 |
| `dimension.1` | `1px` | `dimension` | 8bd134f — consolidação |
| `dimension.10` | `10px` | `dimension` | 8bd134f — consolidação |
| `dimension.102` | `102px` | `dimension` | 8bd134f — consolidação |
| `dimension.11` | `11px` | `dimension` | 8bd134f — consolidação |
| `dimension.112` | `112px` | `dimension` | 8bd134f — consolidação |
| `dimension.116` | `116px` | `dimension` | 8bd134f — consolidação |
| `dimension.12` | `12px` | `dimension` | 8bd134f — consolidação |
| `dimension.13` | `13px` | `dimension` | 8bd134f — consolidação |
| `dimension.14` | `14px` | `dimension` | 8bd134f — consolidação |
| `dimension.158` | `158px` | `dimension` | 8bd134f — consolidação |
| `dimension.16` | `16px` | `dimension` | 8bd134f — consolidação |
| `dimension.160` | `160px` | `dimension` | 8bd134f — consolidação |
| `dimension.18` | `18px` | `dimension` | 8bd134f — consolidação |
| `dimension.2` | `2px` | `dimension` | 8bd134f — consolidação |
| `dimension.20` | `20px` | `dimension` | 8bd134f — consolidação |
| `dimension.200` | `200px` | `dimension` | 8bd134f — consolidação |
| `dimension.22` | `22px` | `dimension` | 8bd134f — consolidação |
| `dimension.24` | `24px` | `dimension` | 8bd134f — consolidação |
| `dimension.26` | `26px` | `dimension` | 8bd134f — consolidação |
| `dimension.28` | `28px` | `dimension` | 8bd134f — consolidação |
| `dimension.3` | `3px` | `dimension` | 8bd134f — consolidação |
| `dimension.30` | `30px` | `dimension` | 8bd134f — consolidação |
| `dimension.300` | `300px` | `dimension` | 8bd134f — consolidação |
| `dimension.32` | `32px` | `dimension` | 8bd134f — consolidação |
| `dimension.38` | `38px` | `dimension` | 8bd134f — consolidação |
| `dimension.4` | `4px` | `dimension` | 8bd134f — consolidação |
| `dimension.44` | `44px` | `dimension` | 8bd134f — consolidação |
| `dimension.440` | `440px` | `dimension` | 8bd134f — consolidação |
| `dimension.456` | `456px` | `dimension` | 8bd134f — consolidação |
| `dimension.46` | `46px` | `dimension` | 8bd134f — consolidação |
| `dimension.48` | `48px` | `dimension` | 8bd134f — consolidação |
| `dimension.480` | `480px` | `dimension` | 8bd134f — consolidação |
| `dimension.5` | `5px` | `dimension` | 8bd134f — consolidação |
| `dimension.50` | `50px` | `dimension` | 8bd134f — consolidação |
| `dimension.520` | `520px` | `dimension` | 8bd134f — consolidação |
| `dimension.54` | `54px` | `dimension` | 8bd134f — consolidação |
| `dimension.6` | `6px` | `dimension` | 8bd134f — consolidação |
| `dimension.60` | `60px` | `dimension` | 8bd134f — consolidação |
| `dimension.600` | `600px` | `dimension` | 8bd134f — consolidação |
| `dimension.62` | `62px` | `dimension` | 8bd134f — consolidação |
| `dimension.64` | `64px` | `dimension` | 8bd134f — consolidação |
| `dimension.66` | `66px` | `dimension` | 8bd134f — consolidação |
| `dimension.7` | `7px` | `dimension` | 8bd134f — consolidação |
| `dimension.72` | `72px` | `dimension` | 8bd134f — consolidação |
| `dimension.78` | `78px` | `dimension` | 8bd134f — consolidação |
| `dimension.8` | `8px` | `dimension` | 8bd134f — consolidação |
| `dimension.80` | `80px` | `dimension` | 8bd134f — consolidação |
| `dimension.82` | `82px` | `dimension` | 8bd134f — consolidação |
| `dimension.84` | `84px` | `dimension` | 8bd134f — consolidação |
| `dimension.9` | `9px` | `dimension` | 8bd134f — consolidação |
| `dimension.90` | `90px` | `dimension` | 8bd134f — consolidação |
| `motion.duration.skeleton` | `1500ms` | `duration` | 8bd134f — consolidação |
| `opacity.disabledSurface` | `0.55` | `number` | 8bd134f — consolidação |
| `opacity.full` | `1` | `number` | 8bd134f — consolidação |
| `opacity.half` | `0.5` | `number` | 8bd134f — consolidação |
| `opacity.mutedMedia` | `0.62` | `number` | 8bd134f — consolidação |

## Integridade do contrato
SHA-256 do JSON sem meta (JSON ordenado, compacto): `874aa0b958569b99a4fdd68d95897f12dd1d3b2e44956c3fe7b8ad0b9c1f59f5`. A promoção pode alterar somente metadados; os valores e o typeStyle devem produzir esse mesmo hash. CSS e CSV gerados devem permanecer byte a byte iguais à main.

## Metadados e empacotamento da consolidação

O mesmo commit 8bd134f alterou package.json de 1.1.0 para 1.2.0 e adicionou a exportação `./tokens-flat.csv`; exports CSS/JSON/TS foram preservados. No JSON, meta passou de FROZEN/1.1.0 para CONSOLIDATION_CANDIDATE/1.2.0, com escopo/data/política de consolidação; typeStyles e propriedades fora das adições listadas permanecem iguais. CSS/TS/CSV foram recompilados de forma determinística, incluindo serialização CSS correta de sombras. Não há outro commit do pacote entre a baseline e a main além de 8bd134f e 1ada833.
