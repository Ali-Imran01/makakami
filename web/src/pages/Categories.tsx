// Fetches API data and caches it.
import { useQuery } from '@tanstack/react-query'
// Search icon for the filter box.
import { Search } from 'lucide-react'
// React state hook.
import { useState } from 'react'
// Hook for translated text.
import { useTranslation } from 'react-i18next'
import { usePageMeta } from '../usePageMeta'
// API call.
import { fetchCategories } from '../api'
import CategoryTile from '../components/CategoryTile'

// Categories screen (design/screens/4-mobile-categories.html), route /kategori.
export default function Categories() {
  // Translate function and the current language.
  const { t, i18n } = useTranslation()
  // Browser tab title (and "noindex" where the page must stay out of search engines).
  usePageMeta(t('cat.title'))
  // What the visitor typed in the "Cari kategori" box.
  const [text, setText] = useState('')
  // Load all categories.
  const { data, isPending, isError } = useQuery({ queryKey: ['categories'], queryFn: fetchCategories })
  // True when showing Malay names first.
  const ms = i18n.language === 'ms'

  // Keep categories whose Malay or English name contains the typed text (case-insensitive).
  const shown = (data ?? []).filter((c) => `${c.name_ms} ${c.name_en}`.toLowerCase().includes(text.trim().toLowerCase()))

  return (
    // Page padding as in the design: 16px sides, 20px top, room at the bottom for the tab bar.
    <div className="mx-auto flex max-w-xl flex-col gap-4 px-4 pt-5 pb-6 lg:max-w-5xl lg:pb-8">
      {/* Title row, 44px tall. */}
      <header className="flex h-11 items-center">
        {/* The page's h1. */}
        <h1 className="text-[22px] font-extrabold">{t('cat.title')}</h1>
      </header>

      {/* Filter box: filters the tiles below as you type (it does not leave the page). */}
      <div className="flex h-12 items-center gap-2 rounded-sm border border-line bg-surface px-3.5">
        {/* Decorative magnifier. */}
        <Search size={20} strokeWidth={1.75} className="shrink-0 text-muted" aria-hidden="true" />
        {/* Hidden label for screen readers. */}
        <label htmlFor="cari-kat" className="sr-only">
          {t('cat.search')}
        </label>
        {/* The input itself (controlled by `text`). */}
        <input
          id="cari-kat"
          type="search"
          value={text}
          onChange={(e) => setText(e.target.value)}
          placeholder={t('cat.search')}
          className="min-w-0 flex-1 border-0 bg-transparent text-body text-ink outline-0 placeholder:text-muted"
        />
      </div>

      {/* Loading and error states. */}
      {isPending && <p className="text-muted">{t('loading')}</p>}
      {isError && <p className="text-muted">{t('error')}</p>}

      {/* Nothing matched the typed text. */}
      {data && shown.length === 0 && <p className="text-muted">{t('cat.none')}</p>}

      {/* Two columns on phones, more on wider screens. */}
      <div className="grid grid-cols-2 gap-2.5 lg:grid-cols-4">
        {/* One wide tile per category; the second line is the other language, or "coming soon". */}
        {shown.map((c) => (
          <CategoryTile
            key={c.id}
            slug={c.slug}
            variant="wide"
            label={ms ? c.name_ms : c.name_en}
            subLabel={c.coming_soon ? t('comingSoon') : ms ? c.name_en : c.name_ms}
          />
        ))}
      </div>
    </div>
  )
}
