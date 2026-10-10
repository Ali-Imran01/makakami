// Router link for navigation.
import { Link } from 'react-router-dom'
// Shared slug -> icon table.
import { CATEGORY_ICONS, FALLBACK_ICON } from '../categoryIcons'

// Props: which category and what text to show.
interface Props {
  // Category slug, used for the icon and the link.
  slug: string
  // Already-translated label (the main line).
  label: string
  // Optional second line (the other language's name), shown only by the "wide" look.
  subLabel?: string
  // "compact" = icon above the label (Home grid); "wide" = icon beside two lines of text (categories page).
  variant?: 'compact' | 'wide'
}

// Category card. Compact on Home, wide on the categories page.
export default function CategoryTile({ slug, label, subLabel, variant = 'compact' }: Props) {
  // Choose the icon for this slug (or the fallback).
  const Icon = CATEGORY_ICONS[slug] ?? FALLBACK_ICON

  // Wide look (design/screens/4-mobile-categories.html): round icon chip, bold name, small subtitle.
  if (variant === 'wide') {
    return (
      // Whole card is a link; min-h-[60px] keeps every card the same height and tappable.
      <Link
        to={`/kategori/${slug}`}
        className="flex min-h-[60px] items-center gap-2.5 rounded-md border border-line bg-surface px-3 py-2.5 text-ink"
      >
        {/* 36px light-navy circle holding the icon. */}
        <span className="flex size-9 shrink-0 items-center justify-center rounded-pill bg-navy-soft">
          {/* Decorative icon (the text names the card). */}
          <Icon size={20} strokeWidth={1.75} className="text-navy" aria-hidden="true" />
        </span>
        {/* Two text lines; min-w-0 lets long names wrap instead of overflowing. */}
        <span className="flex min-w-0 flex-col gap-px">
          {/* Main name. */}
          <span className="text-[14px] leading-[18px] font-bold">{label}</span>
          {/* Second-language name, if given. */}
          {subLabel && <span className="text-[11px] leading-[14px] font-normal text-muted">{subLabel}</span>}
        </span>
      </Link>
    )
  }

  return (
    // Compact look: column layout, centred, white card with a 1px border and 16px radius.
    <Link
      // Route from DESIGN.md: /kategori/:slug.
      to={`/kategori/${slug}`}
      className="flex flex-col items-center gap-2 rounded-md border border-line bg-surface px-1 py-3.5 text-caption font-semibold text-ink"
    >
      {/* Decorative icon (the label already names the tile), navy, stroke 1.75 per DESIGN.md. */}
      <Icon size={24} strokeWidth={1.75} className="text-navy" aria-hidden="true" />
      {/* Category name. */}
      {label}
    </Link>
  )
}
