// Fetches API data and caches it.
import { useQuery } from '@tanstack/react-query'
// Hook for translated text.
import { useTranslation } from 'react-i18next'
import { usePageMeta } from '../usePageMeta'
// Router link for "Lihat semua".
import { Link } from 'react-router-dom'
// API calls.
import { fetchCategories, fetchRecentProducts } from '../api'
// Shared components built from the design hand-off.
import CategoryTile from '../components/CategoryTile'
import LangToggle from '../components/LangToggle'
import LegalLinks from '../components/LegalLinks'
import ProductCard from '../components/ProductCard'
import ScanButton from '../components/ScanButton'
import HomeWeb from './HomeWeb'
import SearchInput from '../components/SearchInput'

// The four categories shown on Home, in design order (slugs come from the category seeder).
const HOME_SLUGS = ['food', 'beverages', 'personal-care', 'household']

// Home screen (design/screens/1-mobile-home.html).
export default function Home() {
  // Translate function.
  const { t } = useTranslation()
  // Browser tab title (and "noindex" where the page must stay out of search engines).
  usePageMeta('')
  // Load categories; `data` is undefined until the request finishes.
  const categories = useQuery({ queryKey: ['categories'], queryFn: fetchCategories })
  // Load the newest verified products.
  const recent = useQuery({ queryKey: ['products', 'recent'], queryFn: fetchRecentProducts })

  // Keep only the Home categories, in the design's order, ignoring any the API doesn't return.
  const tiles = HOME_SLUGS.map((slug) => categories.data?.find((c) => c.slug === slug)).filter((c) => c !== undefined)

  return (
    <>
      {/* Wide screens (lg and up) get the full website page instead of the phone layout below. */}
      <div className="hidden lg:block">
        <HomeWeb />
      </div>
      {/* Phone layout, hidden from the lg breakpoint up. Page padding: 16px sides, 20px top, 120px bottom so content clears the tab bar; 24px gap between sections. */}
      <div className="mx-auto flex max-w-xl flex-col gap-6 px-4 pt-5 pb-[120px] lg:hidden">
      {/* Phone header: wordmark and language switch. Hidden on lg+, where TopNav already has both. */}
      <header className="flex h-11 items-center justify-between lg:hidden">
        {/* Wordmark. */}
        <div className="text-[22px] font-extrabold tracking-[-0.02em] text-navy">{t('appName')}</div>
        {/* BM / EN switch. */}
        <LangToggle />
      </header>

      {/* Greeting and headline. */}
      <div className="flex flex-col gap-1">
        {/* Small eyebrow line. */}
        <div className="text-label text-muted">{t('home.welcome')}</div>
        {/* Page heading (the only h1 on the page). */}
        <h1 className="text-[26px] leading-8 font-extrabold tracking-[-0.01em]">{t('home.headline')}</h1>
      </div>

      {/* Search box, 48px tall on a white background. */}
      <SearchInput id="cari" label={t('home.searchLabel')} placeholder={t('home.searchPlaceholder')} className="h-12 bg-surface" />

      {/* Big navy call-to-action to start scanning. */}
      <ScanButton variant="card" />

      {/* Categories section. */}
      <section className="flex flex-col gap-3">
        {/* Heading on the left, "see all" link on the right. */}
        <div className="flex items-baseline justify-between">
          {/* Section title. */}
          <h2 className="text-heading">{t('home.categories')}</h2>
          {/* Link to the full category list. */}
          <Link to="/kategori" className="text-label font-bold text-navy">
            {t('home.seeAll')}
          </Link>
        </div>
        {/* Four equal columns. */}
        <div className="grid grid-cols-4 gap-2">
          {/* One tile per category; label comes from i18n keyed by slug. */}
          {tiles.map((c) => (
            <CategoryTile key={c.id} slug={c.slug} label={t(`catShort.${c.slug}`)} />
          ))}
        </div>
        {/* Show an error line if categories failed to load. */}
        {categories.isError && <p className="text-caption text-muted">{t('error')}</p>}
      </section>

      {/* Recently verified products. */}
      <section className="flex flex-col gap-3">
        {/* Section title. */}
        <h2 className="text-heading">{t('home.recentlyVerified')}</h2>
        {/* Rounded white box containing the rows; overflow-hidden keeps row corners inside the radius. */}
        <div className="flex flex-col overflow-hidden rounded-md border border-line bg-surface">
          {/* One row per product. */}
          {recent.data?.map((p) => (
            <ProductCard key={p.id} product={p} />
          ))}
          {/* While loading, show a loading line. */}
          {recent.isPending && <p className="p-3 text-caption text-muted">{t('loading')}</p>}
          {/* If the request failed, say so. */}
          {recent.isError && <p className="p-3 text-caption text-muted">{t('error')}</p>}
          {/* Loaded but nothing to show yet. */}
          {recent.data?.length === 0 && <p className="p-3 text-caption text-muted">{t('empty')}</p>}
        </div>
      </section>

      {/* Links to the Terms and Privacy Policy, and the open-data credit. */}
      <LegalLinks />
      </div>
    </>
  )
}
