// Hook that gives us t() for text and i18n for reading/changing the language.
import { useTranslation } from 'react-i18next'

// BM/EN pill switch. Clicking it flips between the two languages.
export default function LangToggle() {
  // t = translate function, i18n = the language controller.
  const { t, i18n } = useTranslation()
  // True when the current language is Bahasa Malaysia.
  const isMs = i18n.language === 'ms'

  return (
    // One real <button> so keyboard and screen-reader users can operate it.
    <button
      // Switch to the other language on click.
      onClick={() => i18n.changeLanguage(isMs ? 'en' : 'ms')}
      // Icon-only style control, so give it a spoken name (DESIGN.md: aria-label on icon-only buttons).
      aria-label={t('switchLanguage')}
      // Visual pill is 36px tall; the ::after layer grows the tap area to 44px without changing the look.
      className="relative flex h-9 items-center gap-0.5 rounded-pill border border-line bg-surface px-1 text-[12px] font-bold after:absolute after:inset-x-0 after:-inset-y-1 after:content-['']"
    >
      {/* BM half: filled navy when active, muted when not. */}
      <span className={`rounded-pill px-2.5 py-1.5 ${isMs ? 'bg-navy text-white' : 'text-muted'}`}>BM</span>
      {/* EN half: the opposite styling. */}
      <span className={`rounded-pill px-2.5 py-1.5 ${isMs ? 'text-muted' : 'bg-navy text-white'}`}>EN</span>
    </button>
  )
}
