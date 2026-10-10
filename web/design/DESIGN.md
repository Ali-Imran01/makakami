# MakaKami — Design Spec (source of truth for UI)

Read this before building any UI. Reference markup for every screen is in `screens/` — match layout, spacing, copy and colours exactly, but rebuild it as React + Tailwind components (the screen files are design mockups, not production code; ignore `<x-dc>`, `<sc-for>`, `<sc-if>`, `support.js` and the `DCLogic` script — they are the design tool's runtime).

## Tokens
Use `theme.css` (Tailwind v4) — never hard-code hex values in components; use the token classes (`bg-navy`, `text-muted`, `border-line`, `rounded-md`, `text-title`…). `tokens.json` is the raw source.

| Token | Hex | Use |
|---|---|---|
| ground | #F6F5F1 | App/page background |
| surface | #FFFFFF | Cards, sheets, header, tab bar |
| ink | #0E1420 | Primary text |
| muted | #5B6474 | Secondary text, captions |
| line | #E3E1DA | 1px borders & dividers (borders, not shadows) |
| navy | #0B2E6B | Primary buttons, scan button, wordmark, active nav |
| yellow | #F5C400 | Accent: scan-button ring, APK button, highlights. Only navy/ink text on it |
| red | #C8102E | Rare: promos, destructive. Never for "foreign" |
| verified | #14804A | Status: Buatan / Mungkin Malaysia |
| unknown | #A15C00 | Status: Belum disahkan |
| foreign | #4A5160 | Status: Bukan produk Malaysia (neutral, never alarming) |

Font: Plus Jakarta Sans. Type scale: display 32/38 800 · title 22/28 700 · heading 17/24 700 · body 15/22 · label 13/18 600 · caption 12/16 500.
Spacing: 4 / 8 / 16 / 24 px (screen padding 16 mobile, 24 web; 24 between sections). Radius: sm 8 (inputs), md 16 (cards), pill 999 (badges, buttons).

## Rules
- **BM first** (`ms` default), EN via toggle. All UI copy goes through i18n keys.
- **Status = icon + text + colour, never colour alone.** Badge variants:
  - `verified_my` → solid verified bg, white text, ✓ icon, "Buatan Malaysia" / short "Buatan MY"
  - `likely_my` → 1.5px verified outline, verified text, ✓ icon, "Mungkin Malaysia" / "Mungkin MY"
  - `unknown` → unknown bg, white text, ? icon, "Belum disahkan"
  - `foreign` / `my_brand_overseas` → foreign bg, white text, "Bukan produk Malaysia" / "Jenama MY, dibuat luar negara"
- Touch targets ≥ 44px. Real `<button>`, `<a>`, `<label>` + inputs. `aria-label` on icon-only buttons.
- Icons: Lucide (`lucide-react`), outline, stroke 1.75 (2 for active/emphasis).
- Default catalogue filter shows only `verified_my` + `likely_my`; active filters always visible as chips.
- Missing product image → `bg-placeholder` box, never a broken image.

## Screens
| File | Route | Notes |
|---|---|---|
| 1-mobile-home.html | `/` (mobile) | Header + BM/EN, search, navy Scan card, 4 categories, "Baru disahkan", bottom tab bar |
| 2-mobile-scan.html | `/scan` | Dark camera view, yellow viewfinder, torch, bottom sheet: manual barcode + recent scans |
| 3-mobile-result.html | `/p/:barcode` | Verdict hero (colour by status), product card, confidence bar (1–3), evidence list, alternatives, Report + CTA. See the status→copy/colour map in the file's script |
| 4-mobile-categories.html | `/kategori` | 12 categories, 2-col grid, BM name + EN subtitle |
| 5-mobile-category-list.html | `/kategori/:slug` | Subcategory chips, Tapis (bottom sheet) + sort, filter chips, 2-col product grid |
| 6-web-home.html | `/` (≥1024px) | Top nav, hero (scan + upload barcode photo), how it works, categories, badge legend, CTA band, footer w/ Open Food Facts (ODbL) attribution |
| 7-web-catalogue.html | `/kategori/:slug` (≥1024px) | Breadcrumb, sort, left filter sidebar, product grid, pagination |

Mobile tab bar: Utama · Kategori · **Imbas** (raised 64px navy disc, 4px yellow ring) · Cari · Profil. Web uses the top nav instead (breakpoint `lg`).

## Components to build first
`StatusBadge`, `VerdictHero`, `ProductCard`, `CategoryTile`, `SearchInput`, `ScanButton`, `TabBar`, `TopNav`, `FilterSheet`/`FilterSidebar`, `ConfidenceBar`, `EvidenceRow`, `LangToggle`.

Placeholders like `[Jenama]`, `[KOD BAR]`, `[Foto]`, `[Bilangan]` are data from the API — never hard-code them.
