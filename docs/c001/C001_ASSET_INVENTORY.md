# C-001 Splash — Inventário de Assets

**Base:** `be61e1168b93d973101496cc66cb54d006aba9cc`  
**Política:** referências visuais são evidência; a fonte editável é o código.

## 1. Assets diretamente relacionados à C-001

| Asset | Status | Localização/origem | Formato | Dimensão/proporção | Uso |
|---|---|---|---|---|---|
| Master Board aprovado, painel `01 SPLASH` | `ASSET_EXISTS` / `ASSET_REUSABLE` | `HIELYA_APPROVED_MASTER_BOARD_SOURCE_V1` | PNG | fonte 1536×1024; painel vertical aproximado 9:24 dentro do board | Referência visual e comparação, nunca render de produção. |
| Crop auditável da referência Splash | `ASSET_REQUIRES_GENERATION` | Derivado sem alteração do Master Board | PNG | crop 127×340; somente documentação | Será incluído como evidência de referência. |
| Lockup HIELYA textual | `ASSET_EXISTS` / `ASSET_REUSABLE` | `AppHeader.tsx` + estilos congelados | React/CSS | Vetorial por texto/CSS | Fonte visual executável do logo na C-001. |
| Slogan oficial | `ASSET_EXISTS` / `ASSET_REUSABLE` | chave `brand.tagline` do Content Guide | Texto ES/EN/PT | até 60 caracteres | Texto real, nunca rasterizado. |
| Fundo preto | `ASSET_EXISTS` / `ASSET_REUSABLE` | token `color.background.primary` | Token/CSS | responsivo | Fundo definitivo. |
| Indicador circular | `ASSET_MISSING` como arquivo, mas `ASSET_NOT_REQUIRED` | Será CSS/HTML interno | Código | 28–32 px | Não requer imagem externa. |

## 2. Assets ausentes que não bloqueiam a C-001

| Asset | Classificação | Motivo | Prioridade |
|---|---|---|---|
| Logo HIELYA vetorial oficial isolado | `ASSET_MISSING` / `REQUIRES_VALIDATION` | O lockup executável existente é suficiente para a Splash; não há SVG de marca congelado localizado. | Média, antes do pacote final de marca. |
| App icon 512×512 | `ASSET_MISSING` | Necessário para PWA/lojas, não para renderizar a C-001. | Alta antes de US-091 completo. |
| Maskable icon 512×512 | `ASSET_MISSING` | Necessário para instalação PWA/Android. | Alta antes de US-091 completo. |
| Apple touch icon 180×180 | `ASSET_MISSING` | Necessário para experiência iOS/PWA. | Média. |
| Favicon 32×32 e 16×16 | `ASSET_MISSING` | Canal web. | Média. |
| Splash nativa Android/iOS | `ASSET_MISSING` | Pertence à embalagem Capacitor, não à tela React C-001. | Posterior, US-092/US-093. |

## 3. Assets futuros identificados, sem autorização de implementação

A lista abaixo serve apenas para planejamento. Nenhum item será produzido neste Gate:

- C-002: mapa/ilustração de localização, ícone de pino e permissão.
- C-003: seletor de país/bandeira e ícone de telefone.
- C-004: ícone de SMS/OTP e estados de expiração.
- Catálogo: packshots com direitos de uso confirmados.
- Estados: ilustrações reutilizáveis de offline, erro, fora da área e manutenção.
- Admin: ícones operacionais e gráficos sem dados embutidos.

## 4. Regras técnicas

- Nenhum texto, botão, preço ou mensagem dentro de PNG.
- Nenhum asset genérico provisório será marcado como definitivo.
- O crop da referência é documentação, não componente da interface.
- A C-001 usará somente texto, CSS, SVG inline existente e tokens.
- Qualquer novo asset definitivo deverá possuir origem, licença/direito de uso, hash e manifesto.
