// Hook for translated text.
import { useTranslation } from 'react-i18next'
import { Link } from 'react-router-dom'
import { usePageMeta } from '../usePageMeta'

// Shown for any address that doesn't exist (instead of a blank page).
export default function NotFound() {
  const { t } = useTranslation()
  // Search engines should not list a "not found" page.
  usePageMeta(t('notFound.title'), true)

  return (
    <div className="mx-auto flex max-w-md flex-col gap-4 px-4 pt-16 pb-6 text-center">
      <h1 className="text-title">{t('notFound.title')}</h1>
      <p className="text-body font-normal text-muted">{t('notFound.body')}</p>
      <div className="flex flex-col gap-3">
        <Link to="/" className="flex h-12 items-center justify-center rounded-pill bg-navy text-[15px] font-bold text-white">
          {t('notFound.home')}
        </Link>
        <Link to="/scan" className="flex h-12 items-center justify-center rounded-pill border border-line bg-surface text-[15px] font-bold text-ink">
          {t('notFound.scan')}
        </Link>
      </div>
    </div>
  )
}
