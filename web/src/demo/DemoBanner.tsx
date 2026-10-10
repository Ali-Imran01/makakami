// Hook for translated text.
import { useTranslation } from 'react-i18next'

// The strip shown at the very top of the showcase: it says clearly that this is a demo with made-up data, so nobody mistakes
// it for the real service (and that no password is kept). Only loaded in the showcase build (see App.tsx).
export default function DemoBanner() {
  const { t } = useTranslation()

  return (
    <div role="note" className="bg-navy px-4 py-2 text-center text-caption font-semibold text-white">
      {t('demo.banner')} {t('demo.passwordWarning')}
    </div>
  )
}
