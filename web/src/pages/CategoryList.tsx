// keepPreviousData: keep showing the old page while the next one loads, so the grid doesn't flash empty.
import { keepPreviousData, useQuery } from '@tanstack/react-query'
// Icons: back, search, filter lines, close.
import { ChevronLeft, Search, SlidersHorizontal, X } from 'lucide-react'
// React state hook.
import { useEffect, useState } from 'react'
// Hook for translated text.
import { useTranslation } from 'react-i18next'
import { usePageMeta } from '../usePageMeta'
// Router helpers: URL parts and query-string state.
import { Link, useParams, useSearchParams } from 'react-router-dom'
// API calls.
import { fetchCategory, fetchProducts } from '../api'
// Filter values stored in the URL.
import { parseFilters, toSearchParams, type Filters, type Sort } from '../catalogueParams'
import FilterPanel from '../components/FilterPanel'
import FilterSheet from '../components/FilterSheet'
import Pagination from '../components/Pagination'
import ProductTile from '../components/ProductTile'

// Translation key of the short label for each status group (used on the removable chips).
const STATUS_KEY = { verified: 'verified_my', likely: 'likely_my', unknown: 'unknown' } as const

// Category list: phone layout from design/screens/5-mobile-category-list.html,
// desktop layout (lg and up) from design/screens/7-web-catalogue.html. Route /kategori/:slug.
export default function CategoryList() {
  // Translate function and the current language.
  const { t, i18n } = useTranslation()
  // True when showing Malay names.
  const ms = i18n.language === 'ms'
  // The category slug from the URL.
  const { slug = '' } = useParams()
  // Filters live in the query string; setSp changes it.
  const [sp, setSp] = useSearchParams()
  // Whether the phone filter sheet is open.
  const [sheetOpen, setSheetOpen] = useState(false)
  // The filters parsed from the URL.
  const filters = parseFilters(sp)

  // Jump back to the top when the page number changes, so a new page starts at its first row.
  useEffect(() => {
    // Scroll the window to the top.
    window.scrollTo(0, 0)
  }, [filters.page])

  // Load the category (name, subcategories, states, count).
  const category = useQuery({ queryKey: ['category', slug], queryFn: () => fetchCategory(slug) })
  // Load the matching products for the current filters and page.
  const products = useQuery({
    queryKey: ['products', slug, sp.toString()],
    queryFn: () => fetchProducts({ category: slug, ...filters, state: filters.state || undefined, per_page: 12 }),
    // Keep the previous page visible while a new one loads.
    placeholderData: keepPreviousData,
  })

  // Change some filters; always go back to page 1 unless a page is given. replace avoids filling the history with every tick.
  const update = (patch: Partial<Filters>) => setSp(toSearchParams({ ...filters, page: 1, ...patch }), { replace: true })
  // Link target for a given page number (used by pagination).
  const hrefFor = (page: number) => {
    // Same filters, different page.
    const qs = toSearchParams({ ...filters, page }).toString()
    // Path plus query string.
    return `/kategori/${slug}${qs ? `?${qs}` : ''}`
  }

  // Category data (may still be loading) and a helper to pick the right language.
  const cat = category.data
  const name = cat ? (ms ? cat.name_ms : cat.name_en) : ''
  usePageMeta(name)
  // Subcategories to offer (a subcategory page has none).
  const subs = cat?.children ?? []
  // Items for the grid.
  const items = products.data?.data ?? []

  // Unknown category (404 from the API).
  if (category.isError) {
    return (
      <div className="mx-auto max-w-xl px-4 pt-5 pb-6">
        {/* Message and a way back. */}
        <p className="text-muted">{t('error')}</p>
        <Link to="/kategori" className="font-bold text-navy">
          {t('cat.title')}
        </Link>
      </div>
    )
  }

  // Number shown on the "Tapis" button: how many filters are active besides the defaults of sort/subcategory.
  const activeCount = filters.status.length + (filters.state ? 1 : 0) + (filters.halal ? 1 : 0)

  // Removable chips for the active filters (DESIGN.md: active filters are always visible).
  const chips = [
    // One per selected status group.
    ...filters.status.map((s) => ({
      key: `s-${s}`,
      label: t(`status.${STATUS_KEY[s]}.short`),
      tone: s === 'unknown' ? 'bg-unknown-soft text-unknown' : 'bg-verified-soft text-verified-ink',
      // Removing the last status falls back to the default selection.
      remove: () => update({ status: filters.status.filter((x) => x !== s) }),
    })),
    // The chosen state, if any.
    ...(filters.state ? [{ key: 'state', label: t('list.state_chip', { name: filters.state }), tone: 'bg-navy-soft text-navy', remove: () => update({ state: '' }) }] : []),
    // Halal only, if on.
    ...(filters.halal ? [{ key: 'halal', label: t('list.halalOnly'), tone: 'bg-navy-soft text-navy', remove: () => update({ halal: false }) }] : []),
  ]

  // Sort dropdown, shared by phone and desktop (only the styling differs).
  const sortSelect = (id: string, className: string) => (
    <select id={id} value={filters.sort} onChange={(e) => update({ sort: e.target.value as Sort })} className={className}>
      {/* The three sort orders the API supports. */}
      <option value="popular">{t('list.sortPopular')}</option>
      <option value="newest">{t('list.sortNewest')}</option>
      <option value="az">{t('list.sortAz')}</option>
    </select>
  )

  return (
    // Phones: full width. Desktop: centred, max 1200px, 24px side padding.
    <div className="mx-auto max-w-xl pb-6 lg:max-w-[1200px] lg:px-6 lg:pt-7 lg:pb-8">
      {/* ===== Desktop breadcrumb ===== */}
      <nav aria-label={t('list.breadcrumb')} className="mb-6 hidden gap-2 text-label font-normal text-muted lg:flex">
        <Link to="/">{t('list.home')}</Link>
        <span aria-hidden="true">›</span>
        <Link to="/kategori">{t('cat.title')}</Link>
        {/* Show the parent too when this is a subcategory. */}
        {cat?.parent && (
          <>
            <span aria-hidden="true">›</span>
            <Link to={`/kategori/${cat.parent.slug}`}>{ms ? cat.parent.name_ms : cat.parent.name_en}</Link>
          </>
        )}
        <span aria-hidden="true">›</span>
        {/* Current page, not a link. */}
        <span aria-current="page" className="font-semibold text-ink">
          {name}
        </span>
      </nav>

      {/* ===== Phone header: back, title + count, search ===== */}
      <header className="flex items-center gap-3 px-4 pt-5 pb-3 lg:hidden">
        {/* Back to the categories list. */}
        <Link to="/kategori" aria-label={t('result.back')} className="flex size-11 shrink-0 items-center justify-center rounded-pill border border-line bg-surface">
          <ChevronLeft size={22} strokeWidth={2} aria-hidden="true" />
        </Link>
        {/* Title and Malaysian product count. */}
        <div className="flex flex-1 flex-col">
          {/* The page's h1 on phones. */}
          <h1 className="text-[22px] leading-7 font-extrabold">{name}</h1>
          {/* Count (only once loaded). */}
          {cat && <span className="text-caption font-normal text-muted">{t('list.count', { n: cat.malaysian_count })}</span>}
        </div>
        {/* Search inside this category. */}
        <Link to={`/cari?kategori=${slug}`} aria-label={t('list.searchIn', { name })} className="flex size-11 shrink-0 items-center justify-center rounded-pill border border-line bg-surface">
          <Search size={20} strokeWidth={2} aria-hidden="true" />
        </Link>
      </header>

      {/* ===== Desktop title row: title + count on the left, sort on the right ===== */}
      <div className="mb-6 hidden flex-wrap items-end justify-between gap-3 lg:flex">
        <div>
          {/* The page's h1 on desktop. */}
          <h1 className="text-[36px] leading-[42px] font-extrabold tracking-[-0.02em]">{name}</h1>
          {/* Count and a few subcategory names. */}
          {cat && (
            <p className="mt-1 text-body font-normal text-muted">
              {t('list.countWeb', { n: cat.malaysian_count, subs: subs.slice(0, 4).map((s) => (ms ? s.name_ms : s.name_en).toLowerCase()).join(', ') })}
            </p>
          )}
        </div>
        {/* Sort control. */}
        <div className="flex items-center gap-2">
          <label htmlFor="susun" className="text-[14px] font-semibold text-muted">
            {t('list.sort')}
          </label>
          {sortSelect('susun', 'h-10 rounded-sm border border-line bg-surface px-3 text-[14px] text-ink')}
        </div>
      </div>

      {/* ===== Phone: subcategory chips (scroll sideways) ===== */}
      {subs.length > 0 && (
        <div className="flex gap-2 overflow-x-auto px-4 pb-3 lg:hidden">
          {/* "Semua" = no subcategory selected. */}
          {[{ slug: '', label: t('list.all') }, ...subs.map((s) => ({ slug: s.slug, label: ms ? s.name_ms : s.name_en }))].map((s) => {
            // Selected when it is the only chosen one, or "Semua" with nothing chosen.
            const on = s.slug === '' ? filters.sub.length === 0 : filters.sub.length === 1 && filters.sub[0] === s.slug
            return (
              <button
                key={s.slug || 'all'}
                type="button"
                aria-pressed={on}
                // Choosing a chip selects only it; tapping the selected one (or "Semua") clears the choice.
                onClick={() => update({ sub: on || s.slug === '' ? [] : [s.slug] })}
                className={`h-9 shrink-0 rounded-pill border px-3.5 text-label font-bold whitespace-nowrap ${on ? 'border-navy bg-navy text-white' : 'border-line bg-surface text-ink'}`}
              >
                {s.label}
              </button>
            )
          })}
        </div>
      )}

      {/* ===== Phone: filter button and sort ===== */}
      <div className="flex items-center justify-between px-4 pb-4 lg:hidden">
        {/* Opens the filter sheet; the number is how many filters are active. */}
        <button type="button" onClick={() => setSheetOpen(true)} className="flex h-9 items-center gap-1.5 rounded-sm border border-line bg-surface px-3 text-label text-ink">
          <SlidersHorizontal size={16} strokeWidth={2} aria-hidden="true" />
          {t('list.filter')} · {activeCount}
        </button>
        {/* Sort dropdown, styled plain. */}
        <label htmlFor="susun-m" className="sr-only">
          {t('list.sort')}
        </label>
        {sortSelect('susun-m', 'h-9 border-0 bg-transparent text-label text-ink')}
      </div>

      {/* ===== Phone: active filter chips (always visible) ===== */}
      <div className="flex flex-wrap gap-2 px-4 pb-4 lg:hidden">
        {chips.map((c) => (
          <span key={c.key} className={`inline-flex items-center gap-1.5 rounded-pill py-[5px] pr-1.5 pl-2.5 text-caption font-bold ${c.tone}`}>
            {c.label}
            {/* The X is a real button so keyboard and screen-reader users can remove the filter. */}
            <button type="button" onClick={c.remove} aria-label={t('list.removeFilter', { name: c.label })} className="flex size-5 items-center justify-center rounded-pill">
              <X size={12} strokeWidth={2.5} aria-hidden="true" />
            </button>
          </span>
        ))}
      </div>

      {/* ===== Main area: sidebar (desktop) + results ===== */}
      <div className="lg:flex lg:items-start lg:gap-6">
        {/* Desktop filter sidebar. */}
        <aside aria-label={t('list.filter')} className="hidden w-[280px] shrink-0 rounded-md border border-line bg-surface p-5 lg:block">
          <FilterPanel filters={filters} onChange={update} states={cat?.states ?? []} subs={subs} idPrefix="side" />
        </aside>

        {/* Results. */}
        <div className="flex min-w-0 flex-1 flex-col gap-5 px-4 lg:px-0">
          {/* Coming-soon categories have no products yet. */}
          {cat?.coming_soon && <p className="rounded-md border border-line bg-surface p-4 text-body font-normal text-muted">{t('list.comingSoonNote')}</p>}

          {/* Grid of product cards: 2 columns on phones, auto-fill on desktop. */}
          {items.length > 0 && (
            <div className="grid grid-cols-2 gap-3 lg:grid-cols-[repeat(auto-fill,minmax(200px,1fr))] lg:gap-4">
              {items.map((p) => (
                <ProductTile key={p.id} product={p} />
              ))}
            </div>
          )}

          {/* Loading, error and empty states. */}
          {products.isPending && <p className="text-muted">{t('loading')}</p>}
          {products.isError && <p className="text-muted">{t('error')}</p>}
          {products.data && items.length === 0 && !cat?.coming_soon && (
            <div className="rounded-md border border-line bg-surface p-4">
              <p className="text-body font-semibold">{t('list.empty')}</p>
              <p className="text-label font-normal text-muted">{t('list.emptyHint')}</p>
            </div>
          )}

          {/* Page numbers. */}
          {products.data && <Pagination page={products.data.current_page} lastPage={products.data.last_page} hrefFor={hrefFor} />}
        </div>
      </div>

      {/* ===== Phone filter sheet (same controls as the sidebar, without the subcategory list) ===== */}
      <FilterSheet open={sheetOpen} onClose={() => setSheetOpen(false)}>
        <FilterPanel filters={filters} onChange={update} states={cat?.states ?? []} idPrefix="sheet" />
      </FilterSheet>
    </div>
  )
}
