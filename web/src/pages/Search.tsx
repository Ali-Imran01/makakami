// Data fetching with caching; keepPreviousData avoids a flash of empty results between pages.
import { keepPreviousData, useQuery } from '@tanstack/react-query'
// Back arrow icon.
import { ChevronLeft } from 'lucide-react'
// Runs code when values change.
import { useEffect } from 'react'
// Hook for translated text.
import { useTranslation } from 'react-i18next'
import { usePageMeta } from '../usePageMeta'
// Router helpers.
import { Link, useSearchParams } from 'react-router-dom'
// API calls.
import { fetchCategory, fetchProducts } from '../api'
import Pagination from '../components/Pagination'
import ProductTile from '../components/ProductTile'
import SearchInput from '../components/SearchInput'

// Search screen, route /cari?q=...&kategori=...&page=... (no design file exists for it; it reuses the catalogue pieces).
export default function Search() {
  // Translate function and the current language.
  const { t, i18n } = useTranslation()
  // Browser tab title (and "noindex" where the page must stay out of search engines).
  usePageMeta(t('search.title'))
  // The query string holds the search text, optional category and page.
  const [sp] = useSearchParams()
  // Search text (trimmed), category slug to search within, and page number.
  const q = (sp.get('q') ?? '').trim()
  const kategori = sp.get('kategori')
  const page = Math.max(1, Number.parseInt(sp.get('page') ?? '1', 10) || 1)

  // Search results. Unlike category pages, search shows every origin status (a visitor asking about a product wants to see it,
  // each with its badge). Only runs once there is something to search for.
  const results = useQuery({
    queryKey: ['search', q, kategori, page],
    queryFn: () => fetchProducts({ q, category: kategori ?? undefined, page, per_page: 12 }),
    enabled: q !== '',
    placeholderData: keepPreviousData,
  })
  // The category being searched in (for the "In category" line); skipped when searching everywhere.
  const category = useQuery({ queryKey: ['category', kategori], queryFn: () => fetchCategory(kategori ?? ''), enabled: kategori !== null })

  // Jump back to the top when the page number changes.
  useEffect(() => {
    // Scroll the window to the top.
    window.scrollTo(0, 0)
  }, [page])

  // Items and totals from the response.
  const items = results.data?.data ?? []
  // True when the text looks like a barcode (8-14 digits), so we can offer a direct lookup.
  const isBarcode = /^\d{8,14}$/.test(q)

  // Link for a page number, keeping the other parameters.
  const hrefFor = (p: number) => {
    // Copy the current parameters, then set the page.
    const next = new URLSearchParams(sp)
    next.set('page', String(p))
    return `/cari?${next}`
  }

  return (
    // Centred column; bottom padding clears the phone tab bar.
    <div className="mx-auto max-w-xl px-4 pt-5 pb-6 lg:max-w-5xl lg:pb-8">
      {/* Header: back and title. */}
      <header className="flex items-center gap-3 pb-4">
        {/* Back to Home. */}
        <Link to="/" aria-label={t('result.back')} className="flex size-11 shrink-0 items-center justify-center rounded-pill border border-line bg-surface lg:hidden">
          <ChevronLeft size={22} strokeWidth={2} aria-hidden="true" />
        </Link>
        {/* The page's h1. */}
        <h1 className="text-[22px] font-extrabold">{t('search.title')}</h1>
      </header>

      {/* Search box; key makes it reset when the query changes (so the typed text always matches the URL). */}
      <SearchInput
        key={`${q}|${kategori}`}
        id="cari-page"
        label={t('home.searchLabel')}
        placeholder={t('home.searchPlaceholder')}
        defaultValue={q}
        scope={kategori}
        className="h-12 bg-surface"
      />

      {/* Which category the search is limited to. */}
      {category.data && (
        <p className="mt-3 text-label font-normal text-muted">
          {t('search.inCategory', { name: i18n.language === 'ms' ? category.data.name_ms : category.data.name_en })}
        </p>
      )}

      {/* Results area. */}
      <div className="mt-4 flex flex-col gap-4">
        {/* Nothing typed yet. */}
        {q === '' && <p className="text-muted">{t('search.prompt')}</p>}
        {/* Loading and error. */}
        {q !== '' && results.isPending && <p className="text-muted">{t('loading')}</p>}
        {results.isError && <p className="text-muted">{t('error')}</p>}

        {/* Number of results. */}
        {results.data && items.length > 0 && <p className="text-label font-normal text-muted">{t('search.results', { n: results.data.total })}</p>}

        {/* The matching products. */}
        {items.length > 0 && (
          <div className="grid grid-cols-2 gap-3 lg:grid-cols-[repeat(auto-fill,minmax(200px,1fr))] lg:gap-4">
            {items.map((p) => (
              <ProductTile key={p.id} product={p} />
            ))}
          </div>
        )}

        {/* No matches. */}
        {results.data && items.length === 0 && (
          <div className="flex flex-col gap-3 rounded-md border border-line bg-surface p-4">
            {/* Message. */}
            <p className="text-body font-semibold">{t('search.none', { q })}</p>
            {/* A barcode that isn't in our database may still be in Open Food Facts, so offer to look it up. */}
            {isBarcode && (
              <Link to={`/p/${q}`} className="flex h-12 items-center justify-center rounded-pill bg-navy text-[14px] font-bold text-white">
                {t('search.checkBarcode', { code: q })}
              </Link>
            )}
          </div>
        )}

        {/* Page numbers. */}
        {results.data && <Pagination page={results.data.current_page} lastPage={results.data.last_page} hrefFor={hrefFor} />}
      </div>
    </div>
  )
}
