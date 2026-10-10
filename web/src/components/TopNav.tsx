// Download icon for the APK button.
import { Download } from 'lucide-react'
// Hook for translated labels.
import { useTranslation } from 'react-i18next'
// Router links (NavLink knows whether it points at the current page).
import { Link, NavLink } from 'react-router-dom'
// Who is signed in (the account link changes with it).
import { useAuth } from '../authContext'
// Shared pieces.
import LangToggle from './LangToggle'
import SearchInput from './SearchInput'

// Website header for large screens (>= lg). Hidden on phones, where TabBar is used.
export default function TopNav() {
  // Translate function.
  const { t } = useTranslation()
  // The signed-in person, if any.
  const { user } = useAuth()

  return (
    // White bar with a 1px bottom border; hidden below lg.
    <header className="hidden border-b border-line bg-surface lg:block">
      {/* Centred container, max 1200px, wraps if the window is narrow. */}
      <div className="mx-auto flex max-w-[1200px] flex-wrap items-center gap-x-7 gap-y-4 px-6 py-3.5">
        {/* Wordmark linking home. */}
        <Link to="/" className="text-[24px] font-extrabold tracking-[-0.02em] text-navy">
          {t('appName')}
        </Link>
        {/* Main links. */}
        <nav aria-label={t('nav.label')} className="flex flex-wrap gap-5 text-[14px] font-semibold text-ink">
          {/* Category browser; navy and extra bold while on a category page (as in the design). */}
          <NavLink to="/kategori" className={({ isActive }) => (isActive ? 'font-extrabold text-navy' : '')}>
            {t('nav.categories')}
          </NavLink>
          {/* Jumps to the "how it works" section of the home page, from any page. */}
          <Link to={{ pathname: '/', hash: '#cara' }}>{t('nav.howItWorks')}</Link>
          {/* About page (not built yet). */}
          <Link to="/tentang">{t('nav.about')}</Link>
        </nav>
        {/* Search takes the remaining space (flex-1) but wraps below 240px. */}
        <div className="min-w-0 flex-1 basis-60">
          {/* Label is screen-reader-only here; the box is 44px tall on the page-grey background. */}
          <SearchInput
            id="cari-nav"
            label={t('nav.searchLabel')}
            placeholder={t('nav.searchPlaceholder')}
            hideLabel
            className="h-11 bg-ground"
          />
        </div>
        {/* Right-hand group: language, login, APK. */}
        <div className="flex items-center gap-2.5">
          {/* BM / EN switch. */}
          <LangToggle />
          {/* Login for guests, profile for signed-in people. */}
          <Link to={user ? '/profil' : '/log-masuk'} className="flex h-10 items-center rounded-pill border border-line px-4 text-[14px] font-bold text-ink">
            {user ? t('auth.profileTitle') : t('nav.login')}
          </Link>
          {/* APK download: yellow button, navy text (only navy/ink text allowed on yellow). The app is not built yet, so it is shown but disabled instead of linking nowhere. */}
          {/* Hidden in the showcase build: visitors from the portfolio would only meet a dead button. */}
          {import.meta.env.VITE_DEMO !== 'true' && (
            <button type="button" disabled title={t('comingSoon')} className="flex h-10 items-center gap-1.5 rounded-pill bg-yellow px-4 text-[14px] font-extrabold text-navy opacity-60">
              {/* Decorative download arrow. */}
              <Download size={16} strokeWidth={2.25} aria-hidden="true" />
              {t('nav.downloadApk')}
            </button>
          )}
        </div>
      </div>
    </header>
  )
}
