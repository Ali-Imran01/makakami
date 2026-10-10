// Back arrow icon.
import { ChevronLeft } from 'lucide-react'
// Hook for translated text and the current language.
import { useTranslation } from 'react-i18next'
// Router helpers for going back.
import { useLocation, useNavigate } from 'react-router-dom'
import LangToggle from '../components/LangToggle'
// The draft documents and their version label.
import { LEGAL, LEGAL_VERSION } from '../legal/content'

// Props: which document to show.
interface Props {
  // "terms" = Terma Perkhidmatan, "privacy" = Dasar Privasi.
  doc: 'terms' | 'privacy'
}

// Shows one legal document in the visitor's language (routes /terma and /privasi).
export default function Legal({ doc }: Props) {
  // Translate function and the current language code.
  const { t, i18n } = useTranslation()
  // Used for the back button.
  const navigate = useNavigate()
  // location.key is "default" when this is the first page the visitor opened.
  const location = useLocation()
  // Pick the Malay or English text; any other language falls back to Malay (our default).
  const content = LEGAL[doc][i18n.language === 'en' ? 'en' : 'ms']

  return (
    // Centred column; bottom padding clears the tab bar on phones.
    <div className="mx-auto max-w-xl px-4 pt-5 pb-28 lg:pb-10">
      {/* Header: back button, spacer-free title area, language switch. */}
      <header className="flex items-center justify-between gap-3 pb-4">
        {/* Back: previous page, or Home if this was the first page opened. */}
        <button
          type="button"
          onClick={() => (location.key === 'default' ? navigate('/') : navigate(-1))}
          aria-label={t('result.back')}
          className="flex size-11 items-center justify-center rounded-pill border border-line bg-surface"
        >
          {/* Left chevron. */}
          <ChevronLeft size={22} strokeWidth={2} aria-hidden="true" />
        </button>
        {/* Language switch, so the other language can be read without leaving the page. */}
        <LangToggle />
      </header>

      {/* Document title (the page's h1). */}
      <h1 className="text-title">{content.title}</h1>

      {/* Draft warning: the text has not been reviewed by a lawyer. Shown until the review is done. */}
      <p role="note" className="mt-3 rounded-md border border-line bg-unknown-soft p-3 text-label font-normal text-ink">
        {t('legal.draftBanner')}
      </p>
      {/* Version label, so we always know which text a visitor saw. */}
      <p className="mt-2 text-caption font-normal text-muted">{t('legal.version', { v: LEGAL_VERSION })}</p>

      {/* The sections, in order. */}
      <article className="mt-5 flex flex-col gap-5">
        {content.sections.map((s) => (
          // One section: heading and paragraphs.
          <section key={s.h} className="flex flex-col gap-2">
            {/* Section heading. */}
            <h2 className="text-heading">{s.h}</h2>
            {/* Paragraphs; plain body text, readable line length thanks to the max-w-xl column. */}
            {s.p.map((para) => (
              <p key={para} className="text-body font-normal text-ink">
                {para}
              </p>
            ))}
          </section>
        ))}
      </article>
    </div>
  )
}
