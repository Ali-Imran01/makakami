// Hook for translated text.
import { useTranslation } from 'react-i18next'
// Router link.
import { Link } from 'react-router-dom'

// Footer-style row linking to the Terms and Privacy Policy, plus the data-source credit.
export default function LegalLinks() {
  // Translate function.
  const { t } = useTranslation()

  return (
    // Small muted text, centred, stacked with a small gap.
    <footer className="flex flex-col items-center gap-2 pt-2 text-caption font-normal text-muted">
      {/* The two policy links; py-2 makes each tap target taller. */}
      <nav aria-label={t('legal.navLabel')} className="flex gap-4">
        {/* Terms of Service. */}
        <Link to="/terma" className="py-2 font-semibold text-navy">
          {t('legal.terms')}
        </Link>
        {/* Privacy Policy. */}
        <Link to="/privasi" className="py-2 font-semibold text-navy">
          {t('legal.privacy')}
        </Link>
      </nav>
      {/* Credit for the open data we use (the ODbL licence asks for this). */}
      <p>
        {t('legal.dataCredit')}{' '}
        {/* External link: new tab, and noopener so the new page can't control this one. */}
        <a href="https://world.openfoodfacts.org" target="_blank" rel="noopener noreferrer" className="font-semibold text-navy">
          Open Food Facts
        </a>{' '}
        (ODbL)
      </p>
    </footer>
  )
}
