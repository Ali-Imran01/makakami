// Lucide outline icons (stroke style set below per DESIGN.md).
import { Check, CircleHelp } from 'lucide-react'
// Hook for translated labels.
import { useTranslation } from 'react-i18next'
// The list of statuses the API can send.
import type { OriginStatus } from '../api'
// Status -> look grouping, shared with the result page.
import { VARIANT, type Variant } from '../status'

// Tailwind classes per variant (token colours only, no hex).
const STYLE: Record<Variant, string> = {
  // Solid green fill, white text.
  verified: 'bg-verified px-2 py-1 text-white',
  // 1.5px green outline, green text; padding is 1px smaller to make up for the thicker border.
  likely: 'border-[1.5px] border-verified px-[7px] py-[3px] text-verified',
  // Solid amber fill, white text.
  unknown: 'bg-unknown px-2 py-1 text-white',
  // Solid neutral grey fill, white text (never red/alarming).
  foreign: 'bg-foreign px-2 py-1 text-white',
}

// Props: the status to show and whether to use the short label.
interface Props {
  // Origin status from the API.
  status: OriginStatus
  // Use the compact text (for tight cards).
  short?: boolean
}

// The one place origin status is rendered: icon + text + colour, never colour alone.
export default function StatusBadge({ status, short = false }: Props) {
  // Translate function.
  const { t } = useTranslation()
  // Pick the variant and label key for this status.
  const { variant, key } = VARIANT[status]

  return (
    // Pill container; inline-flex keeps icon and text on one line.
    <span className={`inline-flex shrink-0 items-center gap-1 rounded-pill text-[11px] font-bold ${STYLE[variant]}`}>
      {/* Tick for verified/likely: stroke 3 so it stays readable at 12px. */}
      {(variant === 'verified' || variant === 'likely') && <Check size={12} strokeWidth={3} aria-hidden="true" />}
      {/* Question mark for unknown. */}
      {variant === 'unknown' && <CircleHelp size={12} strokeWidth={3} aria-hidden="true" />}
      {/* The text label, short or long form, in the current language. */}
      {t(`status.${key}.${short ? 'short' : 'long'}`)}
    </span>
  )
}
