// Hook for translated text.
import { useTranslation } from 'react-i18next'
import { DEMO_EMAIL, DEMO_PASSWORD } from './account'

// Props: what to do when the visitor chooses the demo account (the log-in form fills in both fields).
interface Props {
  onPick: (email: string, password: string) => void
}

// Box on the log-in page of the showcase with the ready-made account. Only loaded in the showcase build (see Login.tsx).
export default function DemoLogin({ onPick }: Props) {
  const { t } = useTranslation()

  return (
    <div className="flex flex-col gap-2 rounded-md border border-line bg-surface p-3">
      {/* What the box is. */}
      <div className="text-label font-bold text-ink">{t('demo.accountTitle')}</div>
      {/* The details, so they can be read (and typed by hand) too. */}
      <div className="text-label font-normal text-muted">
        {DEMO_EMAIL} · {DEMO_PASSWORD}
      </div>
      {/* One tap fills the form. */}
      <button type="button" onClick={() => onPick(DEMO_EMAIL, DEMO_PASSWORD)} className="h-10 self-start rounded-pill border border-line bg-surface px-3.5 text-label font-semibold text-ink">
        {t('demo.accountUse')}
      </button>
    </div>
  )
}
