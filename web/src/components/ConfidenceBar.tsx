// Hook for translated text.
import { useTranslation } from 'react-i18next'
// Variant type, so the filled colour follows the verdict colour.
import type { Variant } from '../status'

// Filled-segment colour per variant (likely uses the same green as verified, as in the design).
const FILL: Record<Variant, string> = {
  verified: 'bg-verified',
  likely: 'bg-verified',
  unknown: 'bg-unknown',
  foreign: 'bg-foreign',
}

// Props: how many of the 3 segments are filled and which colour family to use.
interface Props {
  // 1 = low, 2 = medium, 3 = high.
  level: 1 | 2 | 3
  // Colour family.
  variant: Variant
}

// "Tahap keyakinan": a label (Tinggi / Sederhana / Rendah) plus a 3-segment bar.
export default function ConfidenceBar({ level, variant }: Props) {
  // Translate function.
  const { t } = useTranslation()
  // Text for the level.
  const label = t(`result.conf.${['low', 'mid', 'high'][level - 1]}`)

  return (
    // White card with a 1px border and 16px radius.
    <section className="flex flex-col gap-3 rounded-md border border-line bg-surface p-4">
      {/* Title on the left, level word on the right (the word makes the bar readable without colour). */}
      <div className="flex items-center justify-between">
        {/* Section title. */}
        <h2 className="text-heading">{t('result.confidence')}</h2>
        {/* Level in words. */}
        <span className="text-label font-bold">{label}</span>
      </div>
      {/* Three equal segments; hidden from screen readers because the word above already says it. */}
      <div className="grid grid-cols-3 gap-1" aria-hidden="true">
        {/* Segment i is filled when i <= level, otherwise it is the empty line colour. */}
        {[1, 2, 3].map((i) => (
          <span key={i} className={`h-2 rounded-pill ${i <= level ? FILL[variant] : 'bg-line'}`} />
        ))}
      </div>
    </section>
  )
}
