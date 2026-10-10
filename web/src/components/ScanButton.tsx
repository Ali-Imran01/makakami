// Barcode-scan icon.
import { ScanBarcode } from 'lucide-react'
// Hook for translated text.
import { useTranslation } from 'react-i18next'
// Router link.
import { Link } from 'react-router-dom'

// Props: which of the two looks to render.
interface Props {
  // "card" = big navy call-to-action on Home; "tab" = raised disc in the bottom tab bar.
  variant: 'card' | 'tab'
}

// The entry point to scanning. Both looks link to /scan.
export default function ScanButton({ variant }: Props) {
  // Translate function.
  const { t } = useTranslation()

  // Tab bar version: raised navy disc with a yellow ring, label underneath.
  if (variant === 'tab') {
    return (
      // Link styled as a column: disc then label.
      <Link to="/scan" className="flex flex-col items-center gap-1 text-[11px] font-bold text-ink">
        {/* The disc: 64px, pulled up 28px so it floats above the bar, 4px yellow ring. */}
        <span className="-mt-7 flex size-16 items-center justify-center rounded-pill border-4 border-yellow bg-navy">
          {/* White scan icon (decorative; the label names the control). */}
          <ScanBarcode size={28} strokeWidth={2} className="text-white" aria-hidden="true" />
        </span>
        {/* Label under the disc. */}
        {t('tabs.scan')}
      </Link>
    )
  }

  // Card version used on the Home screen.
  return (
    // Whole card is one link.
    <Link to="/scan" className="flex items-center gap-4 rounded-md bg-navy p-5 text-left text-white">
      {/* Yellow disc holding the icon. */}
      <span className="flex size-16 shrink-0 items-center justify-center rounded-pill bg-yellow">
        {/* Navy icon on yellow (only navy/ink text on yellow, per DESIGN.md). */}
        <ScanBarcode size={30} strokeWidth={2} className="text-navy" aria-hidden="true" />
      </span>
      {/* Title and subtitle stacked. */}
      <span className="flex flex-col gap-1">
        {/* Title. */}
        <span className="text-[19px] font-extrabold">{t('home.scanTitle')}</span>
        {/* Subtitle in a light navy tint. */}
        <span className="text-[14px] leading-5 text-navy-soft">{t('home.scanSubtitle')}</span>
      </span>
    </Link>
  )
}
