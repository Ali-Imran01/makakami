// Hook for translated text.
import { useTranslation } from 'react-i18next'
import { Link } from 'react-router-dom'
import { usePageMeta } from '../usePageMeta'

// "About" page, route /tentang: what MakaKami is, how it decides, where the data comes from, and how to reach us.
// DRAFT wording: the contact address and the operator's name are placeholders until they are decided (see the planning file).
export default function About() {
  const { t } = useTranslation()
  usePageMeta(t('about.title'))

  // The sections, in order; the text lives in the translation files.
  const sections = ['what', 'how', 'ownership', 'data', 'limits', 'contact'] as const

  return (
    <div className="mx-auto flex max-w-xl flex-col gap-5 px-4 pt-8 pb-6 lg:pb-8">
      <h1 className="text-title">{t('about.title')}</h1>
      <p className="text-body font-normal text-muted">{t('about.lead')}</p>

      {sections.map((s) => (
        <section key={s} className="flex flex-col gap-2">
          <h2 className="text-heading">{t(`about.${s}.h`)}</h2>
          <p className="text-body font-normal text-ink">{t(`about.${s}.p`)}</p>
        </section>
      ))}

      {/* Links to the legal pages. */}
      <p className="text-label font-normal text-muted">
        <Link to="/terma" className="font-bold text-navy">
          {t('legal.terms')}
        </Link>{' '}
        ·{' '}
        <Link to="/privasi" className="font-bold text-navy">
          {t('legal.privacy')}
        </Link>
      </p>
    </div>
  )
}
