// Icons: tick for supporting evidence, info circle for neutral notes.
import { Check, Info } from 'lucide-react'
// Type for the content passed between the tags.
import type { ReactNode } from 'react'

// Props for one evidence line.
interface Props {
  // "positive" = green tick, "neutral" = grey info icon.
  tone: 'positive' | 'neutral'
  // Main line of text (already translated).
  title: string
  // Secondary line: plain text or a link.
  children?: ReactNode
}

// One row inside the "Bukti" (evidence) card. The first row has no divider; the rest get a top border.
export default function EvidenceRow({ tone, title, children }: Props) {
  return (
    // Row: icon on the left, text on the right; border-t draws the divider (the heading above covers the first).
    <div className="flex gap-3 border-t border-line px-4 py-3">
      {/* Icon column: shrink-0 so long text can't squash it. */}
      {tone === 'positive' ? (
        // Green tick, stroke 2.25 as in the design.
        <Check size={22} strokeWidth={2.25} className="shrink-0 text-verified" aria-hidden="true" />
      ) : (
        // Grey info icon for neutral rows like halal.
        <Info size={22} strokeWidth={2} className="shrink-0 text-muted" aria-hidden="true" />
      )}
      {/* Text column. */}
      <div className="flex flex-col gap-0.5">
        {/* Main line. */}
        <span className="text-body font-semibold">{title}</span>
        {/* Secondary line (only if given). */}
        {children && <span className="text-caption font-normal text-muted">{children}</span>}
      </div>
    </div>
  )
}
