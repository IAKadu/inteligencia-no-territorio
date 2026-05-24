# Assets de Design — Índice

Índice dos assets visuais disponíveis para o projeto. **Os arquivos físicos da fonte estão em `_refs/assets/`** (zona read-only — não editar, apenas carregar via `@font-face` ou copiar para `src/` quando necessário).

## Tipografia institucional — Cera Pro

Localização: [`_refs/assets/cera pro sv/`](../_refs/assets/cera%20pro%20sv/)

Fonte oficial da Secretaria Municipal de Saúde do Rio (saude.prefeitura.rio). Fonte licenciada (não Google Fonts). Para uso no protótipo, carregar via `@font-face` apontando para os `.otf` em `_refs/assets/`, **ou** copiar para `src/public/fonts/` quando montar a aplicação Next.js.

### Arquivos disponíveis

| Arquivo | Peso CSS | Estilo | Tamanho |
|---|---|---|---|
| `Cera Pro Light.otf` | 300 | normal | ~185 KB |
| `Cera Pro Regular Italic.otf` | 400 | italic | ~190 KB |
| `Cera Pro Medium.otf` | 500 | normal | ~187 KB |
| `Cera Pro Bold.otf` | 700 | normal | ~189 KB |
| `Cera Pro Black.otf` | 900 | normal | ~188 KB |
| `Cera Pro Black Italic.otf` | 900 | italic | ~191 KB |

**Faltam (não vieram no pack):** Regular (400 normal), Light Italic (300 italic), Medium Italic (500 italic), Bold Italic (700 italic).

Para o uso prático no brandbook, os pesos 700 (Bold) e 900 (Black) cobrem títulos/CTAs. Para body (400 Regular), usar fallback: a fonte Regular não está no pack — usar `Cera Pro Medium` como aproximação ou trocar para `Inter` 400 nos textos longos.

### Snippet `@font-face` (referência para usar em `src/`)

```css
@font-face {
  font-family: 'Cera Pro';
  src: url('/fonts/CeraPro-Light.otf') format('opentype');
  font-weight: 300;
  font-style: normal;
  font-display: swap;
}
@font-face {
  font-family: 'Cera Pro';
  src: url('/fonts/CeraPro-Medium.otf') format('opentype');
  font-weight: 500;
  font-style: normal;
  font-display: swap;
}
@font-face {
  font-family: 'Cera Pro';
  src: url('/fonts/CeraPro-Bold.otf') format('opentype');
  font-weight: 700;
  font-style: normal;
  font-display: swap;
}
@font-face {
  font-family: 'Cera Pro';
  src: url('/fonts/CeraPro-Black.otf') format('opentype');
  font-weight: 900;
  font-style: normal;
  font-display: swap;
}
@font-face {
  font-family: 'Cera Pro';
  src: url('/fonts/CeraPro-RegularItalic.otf') format('opentype');
  font-weight: 400;
  font-style: italic;
  font-display: swap;
}
@font-face {
  font-family: 'Cera Pro';
  src: url('/fonts/CeraPro-BlackItalic.otf') format('opentype');
  font-weight: 900;
  font-style: italic;
  font-display: swap;
}
```

**Fallback stack recomendado:** `'Cera Pro', 'Segoe UI', Arial, sans-serif` (mesma do site da SMS).

## Brandbook do projeto

[`_inbox/brandbook.html`](brandbook.html) — sistema visual completo do produto ACS Inteligente. Cores, tipografia, espaçamento, componentes, design tokens. Baseado no site oficial da Secretaria Municipal de Saúde do Rio. **Fonte de verdade visual obrigatória para qualquer tela / componente gerado neste projeto.**

Resumo rápido para indexação:
- **Paleta:** azuis institucionais (`#004a80`, `#00508a`, `#003660`, `#1863dc`) + verde (`#0bb975`) + cyan (`#00c0f4`) + escala de prioridade (vermelho/laranja/amarelo/verde).
- **Tipografia:** Cera Pro (300/500/700/900). Escala 11→52px.
- **Espaçamento:** escala 8pt (`--space-1` a `--space-9`, de 4px a 96px).
- **Componentes-chave:** navbar institucional, card de paciente com priority border-left, badges/tags clínicas, priority rows.
- **Tokens CSS:** todos definidos como `--*` no `:root` do brandbook. Copiar para `src/styles/tokens.css` quando montar a app.
