// Lucide icons for the disc: tick for positive results, a "minus in a circle" for foreign.
import { Check, CircleMinus } from 'lucide-react'
// Hook for translated text.
import { useTranslation } from 'react-i18next'
// The status type from the API layer.
import type { OriginStatus } from '../api'
// Same status -> variant grouping that the badge uses.
import { VARIANT, type Variant } from '../status'

// Colours per variant, all from the design tokens: card, disc, icon, title and subtitle.
const LOOK: Record<Variant, { card: string; disc: string; icon: string; title: string; sub: string }> = {
  // Solid green card, white disc with green tick.
  verified: { card: 'bg-verified', disc: 'bg-surface', icon: 'text-verified', title: 'text-white', sub: 'text-verified-soft' },
  // Soft green card, green disc with white tick.
  likely: { card: 'bg-verified-soft', disc: 'bg-verified', icon: 'text-white', title: 'text-verified-ink', sub: 'text-ink' },
  // Soft amber card, amber disc with white question mark.
  unknown: { card: 'bg-unknown-soft', disc: 'bg-unknown', icon: 'text-white', title: 'text-unknown', sub: 'text-ink' },
  // Neutral grey card, white disc (never red or alarming).
  foreign: { card: 'bg-foreign', disc: 'bg-surface', icon: 'text-foreign', title: 'text-white', sub: 'text-white/90' },
}

// Props: the product's origin status.
interface Props {
  status: OriginStatus
}

// Big coloured card at the top of the result page that states the verdict.
export default function VerdictHero({ status }: Props) {
  // Translate function.
  const { t } = useTranslation()
  // Which of the four looks this status uses.
  const { variant } = VARIANT[status]
  // The colour classes for that look.
  const look = LOOK[variant]

  return (
    // The card: 24px/20px padding, 16px radius, children stacked with 12px gaps.
    <section className={`flex flex-col gap-3 rounded-md px-5 py-6 ${look.card}`}>
      {/* 56px round disc holding the icon. */}
      <span className={`flex size-14 items-center justify-center rounded-pill ${look.disc}`}>
        {/* Positive results get a thick tick. */}
        {(variant === 'verified' || variant === 'likely') && <Check size={30} strokeWidth={3} className={look.icon} aria-hidden="true" />}
        {/* Unknown gets a question mark (drawn inline to match the design exactly). */}
        {variant === 'unknown' && (
          <svg width="30" height="30" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" className={look.icon} aria-hidden="true">
            {/* The hook of the question mark. */}
            <path d="M9 9a3 3 0 1 1 4 2.8c-.6.3-1 .9-1 1.6V15" />
            {/* The dot. */}
            <path d="M12 19h.01" />
          </svg>
        )}
        {/* Foreign gets a neutral circle with a bar. */}
        {variant === 'foreign' && <CircleMinus size={30} strokeWidth={2.5} className={look.icon} aria-hidden="true" />}
      </span>
      {/* The verdict itself: the one big line (the page's product name is the h1). */}
      <div className={`text-[32px] leading-9 font-extrabold tracking-[-0.01em] ${look.title}`}>{t(`result.verdict.${status}.title`)}</div>
      {/* One-sentence explanation. */}
      <div className={`text-[14px] leading-5 font-medium ${look.sub}`}>{t(`result.verdict.${status}.sub`)}</div>
    </section>
  )
}
