// Fetches API data and caches it.
import { useQuery } from '@tanstack/react-query'
// Icons so a status is never shown by colour alone.
import { Check, Clock, X } from 'lucide-react'
// Hook for translated text and the current language.
import { useTranslation } from 'react-i18next'
import { usePageMeta } from '../usePageMeta'
import { Link, Navigate } from 'react-router-dom'
import { useAuth } from '../authContext'
import { fetchMySubmissions, type Submission } from '../authApi'

// Look of each submission status: icon, classes.
const STATUS_LOOK = {
  pending: { Icon: Clock, classes: 'bg-unknown-soft text-unknown' },
  approved: { Icon: Check, classes: 'bg-verified-soft text-verified-ink' },
  rejected: { Icon: X, classes: 'bg-placeholder text-muted' },
} as const

// "My submissions" page, route /sumbangan-saya: what the person sent in and what happened to it.
export default function MySubmissions() {
  const { t, i18n } = useTranslation()
  // Browser tab title (and "noindex" where the page must stay out of search engines).
  usePageMeta(t('mySubmissions.title'), true)
  const { user, token, loading } = useAuth()
  // Only runs once we know who is logged in.
  const list = useQuery({ queryKey: ['submissions', 'mine'], queryFn: () => fetchMySubmissions(token ?? ''), enabled: Boolean(token) })

  if (loading) return <p className="px-4 pt-8 text-muted">{t('loading')}</p>
  // Guests log in first.
  if (!user) return <Navigate to="/log-masuk" replace state={{ from: '/sumbangan-saya' }} />

  // Format the date in the current language.
  const date = (iso: string) => new Date(iso).toLocaleDateString(i18n.language === 'ms' ? 'ms-MY' : 'en-MY', { dateStyle: 'medium' })

  return (
    <div className="mx-auto flex max-w-xl flex-col gap-5 px-4 pt-8 pb-6 lg:pb-8">
      <h1 className="text-title">{t('mySubmissions.title')}</h1>

      {list.isPending && <p className="text-muted">{t('loading')}</p>}
      {list.isError && <p className="text-muted">{t('error')}</p>}

      {/* Nothing yet. */}
      {list.data?.length === 0 && (
        <div className="flex flex-col gap-3 rounded-md border border-line bg-surface p-4">
          <p className="text-body font-semibold">{t('mySubmissions.empty')}</p>
          <Link to="/sumbang" className="flex h-11 items-center self-start rounded-pill bg-navy px-5 text-label font-bold text-white">
            {t('contribute.title')}
          </Link>
        </div>
      )}

      {/* One card per submission. */}
      <ul className="flex flex-col gap-3">
        {list.data?.map((s: Submission) => {
          const { Icon, classes } = STATUS_LOOK[s.status]
          return (
            <li key={s.id} className="flex flex-col gap-2 rounded-md border border-line bg-surface p-4">
              <div className="flex items-start justify-between gap-3">
                <div className="flex min-w-0 flex-col">
                  <span className="text-body font-bold">{s.name ?? s.barcode}</span>
                  <span className="text-caption font-normal tracking-[0.04em] text-muted">{s.barcode}</span>
                </div>
                {/* Status pill: icon + text + colour. */}
                <span className={`inline-flex shrink-0 items-center gap-1 rounded-pill px-2.5 py-1 text-[11px] font-bold ${classes}`}>
                  <Icon size={12} strokeWidth={3} aria-hidden="true" />
                  {t(`mySubmissions.status.${s.status}`)}
                </span>
              </div>
              <span className="text-caption font-normal text-muted">
                {t(`mySubmissions.type.${s.type}`)} · {date(s.created_at)}
              </span>
              {/* The moderator's message, if any. */}
              {s.review_note && <p className="rounded-sm bg-ground p-2.5 text-label font-normal text-ink">{s.review_note}</p>}
            </li>
          )
        })}
      </ul>
    </div>
  )
}
