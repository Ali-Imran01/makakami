// Hook for translated text.
import { useTranslation } from 'react-i18next'
// Router link.
import { Link } from 'react-router-dom'

// Props: where we are and how to build a link to another page.
interface Props {
  // Current page (1-based).
  page: number
  // Last page.
  lastPage: number
  // Builds the URL (path + query string) for a given page number.
  hrefFor: (page: number) => string
}

// Page numbers to show: always first, last and the current page with its neighbours; gaps become 0 (an ellipsis).
function pageList(page: number, last: number): number[] {
  // Pages we always want.
  const wanted = new Set([1, last, page - 1, page, page + 1])
  // Keep valid ones in order.
  const pages = [...wanted].filter((p) => p >= 1 && p <= last).sort((a, b) => a - b)
  // Insert a 0 wherever two shown pages are not neighbours.
  return pages.flatMap((p, i) => (i > 0 && p - pages[i - 1] > 1 ? [0, p] : [p]))
}

// Numbered pagination (design/screens/7-web-catalogue.html). Renders nothing when there is only one page.
export default function Pagination({ page, lastPage, hrefFor }: Props) {
  // Translate function.
  const { t } = useTranslation()
  // One page or none: no navigation needed.
  if (lastPage <= 1) return null

  // Shared look for the round number buttons and the text buttons.
  const base = 'flex h-10 items-center justify-center rounded-pill text-[14px]'

  return (
    // <nav> landmark with a spoken name; centred row.
    <nav aria-label={t('list.pages')} className="flex flex-wrap justify-center gap-1.5">
      {/* Previous page, only after page 1. */}
      {page > 1 && (
        <Link to={hrefFor(page - 1)} className={`${base} border border-line bg-surface px-4 font-semibold text-ink`}>
          {t('list.prev')}
        </Link>
      )}
      {/* Numbers and ellipses. */}
      {pageList(page, lastPage).map((p, i) =>
        p === 0 ? (
          // A gap between non-adjacent pages.
          <span key={`gap-${i}`} aria-hidden="true" className={`${base} w-6 text-muted`}>
            …
          </span>
        ) : (
          // A page link; the current one is filled navy and marked with aria-current.
          <Link
            key={p}
            to={hrefFor(p)}
            aria-current={p === page ? 'page' : undefined}
            className={`${base} w-10 ${p === page ? 'bg-navy font-bold text-white' : 'border border-line bg-surface font-semibold text-ink'}`}
          >
            {p}
          </Link>
        ),
      )}
      {/* Next page, only before the last page. */}
      {page < lastPage && (
        <Link to={hrefFor(page + 1)} className={`${base} border border-line bg-surface px-4 font-semibold text-ink`}>
          {t('list.next')}
        </Link>
      )}
    </nav>
  )
}
