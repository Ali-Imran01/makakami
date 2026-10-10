// Hook for translated text.
import { useTranslation } from 'react-i18next'
import { SAMPLE_BARCODES } from './data'

// Props: what to do when a sample is chosen (the scan screen opens that product, as if it had been scanned).
interface Props {
  onPick: (barcode: string) => void
}

// Quick buttons on the scan screen of the showcase. A visitor has no product from the dummy catalogue to point the camera at,
// so these let them "scan" one of each kind of result. Only loaded in the showcase build (see Scan.tsx).
export default function DemoSamples({ onPick }: Props) {
  const { t } = useTranslation()

  return (
    <div className="flex flex-col gap-2">
      <div className="text-label text-muted">{t('demo.samples')}</div>
      <div className="flex flex-wrap gap-2">
        {SAMPLE_BARCODES.map((s) => (
          <button key={s.barcode} type="button" onClick={() => onPick(s.barcode)} className="h-10 rounded-pill border border-line bg-surface px-3.5 text-label font-semibold text-ink">
            {s.name}
          </button>
        ))}
      </div>
    </div>
  )
}
