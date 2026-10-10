// Data fetching and changes with caching.
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { Check, X } from 'lucide-react'
import { useState } from 'react'
import { useTranslation } from 'react-i18next'
import { Link } from 'react-router-dom'
import { ApiError } from '../../api'
import { closeReport, fetchReports, type StaffReport } from '../../staffApi'

// One report: what was said, about which product, and the resolve / dismiss controls.
function ReportCard({ r, token, onDone }: { r: StaffReport; token: string; onDone: () => void }) {
  const { t, i18n } = useTranslation()
  const [note, setNote] = useState('')
  const [error, setError] = useState('')

  const act = useMutation({
    mutationFn: (kind: 'resolve' | 'dismiss') => closeReport(token, r.id, kind, note.trim()),
    onSuccess: onDone,
    onError: (err) => setError(err instanceof ApiError && err.serverMessage ? err.serverMessage : t('error')),
  })
  const date = new Date(r.created_at).toLocaleString(i18n.language === 'ms' ? 'ms-MY' : 'en-MY', { dateStyle: 'medium', timeStyle: 'short' })

  return (
    <li className="flex flex-col gap-3 rounded-md border border-line bg-surface p-4">
      <div className="flex flex-col gap-0.5">
        <span className="text-label font-bold text-navy">{t(`report.types.${r.type}`)}</span>
        {/* The product, linking to the public page so staff can look at it. */}
        {r.product && (
          <Link to={`/p/${r.product.barcode}`} className="text-body font-bold">
            {r.product.name} <span className="text-caption font-normal tracking-[0.04em] text-muted">{r.product.barcode}</span>
          </Link>
        )}
        <span className="text-caption font-normal text-muted">
          {r.reporter} · {date}
          {r.product ? ` · ${t(`staff.statusNames.${r.product.origin_status}`)}` : ''}
        </span>
      </div>
      <p className="rounded-sm bg-ground p-2.5 text-label font-normal">{r.note}</p>

      {r.status !== 'open' && (
        <p className="text-label font-normal text-muted">
          {t(`staff.reportStatus.${r.status}`)}
          {r.resolution_note ? `: ${r.resolution_note}` : ''}
        </p>
      )}

      {r.status === 'open' && (
        <div className="flex flex-col gap-2.5 border-t border-line pt-3">
          <label className="flex flex-col gap-1.5 text-label text-muted">
            {t('staff.resolutionNote')}
            <textarea rows={2} maxLength={500} value={note} onChange={(e) => setNote(e.target.value)} className="rounded-sm border border-line bg-surface px-3 py-2 text-body font-normal text-ink" />
          </label>
          {error && <p role="alert" className="text-label font-normal text-unknown">{error}</p>}
          <div className="flex gap-3">
            <button type="button" disabled={act.isPending} onClick={() => { setError(''); act.mutate('resolve') }} className="flex h-11 flex-1 items-center justify-center gap-1.5 rounded-pill bg-navy text-label font-bold text-white disabled:opacity-60">
              <Check size={16} strokeWidth={2.5} aria-hidden="true" />
              {t('staff.resolve')}
            </button>
            <button
              type="button"
              disabled={act.isPending}
              onClick={() => {
                // Turning a report down needs a reason.
                if (note.trim().length < 5) return setError(t('staff.rejectNeedsNote'))
                setError('')
                act.mutate('dismiss')
              }}
              className="flex h-11 flex-1 items-center justify-center gap-1.5 rounded-pill border border-line bg-surface text-label font-bold text-ink disabled:opacity-60"
            >
              <X size={16} strokeWidth={2.5} aria-hidden="true" />
              {t('staff.dismiss')}
            </button>
          </div>
        </div>
      )}
    </li>
  )
}

// The "Reports" tab: wrong-information reports from signed-in readers.
export default function ReportsTab({ token }: { token: string }) {
  const { t } = useTranslation()
  const queryClient = useQueryClient()
  const [status, setStatus] = useState<'open' | 'resolved' | 'dismissed'>('open')
  const reports = useQuery({ queryKey: ['staff', 'reports', status], queryFn: () => fetchReports(token, status) })

  return (
    <div className="flex flex-col gap-4">
      <div className="flex flex-wrap gap-2">
        {(['open', 'resolved', 'dismissed'] as const).map((st) => (
          <button
            key={st}
            type="button"
            aria-pressed={status === st}
            onClick={() => setStatus(st)}
            className={`h-10 rounded-pill border px-4 text-label font-bold ${status === st ? 'border-navy bg-navy text-white' : 'border-line bg-surface text-ink'}`}
          >
            {t(`staff.reportStatus.${st}`)} · {reports.data?.counts[st] ?? 0}
          </button>
        ))}
      </div>
      {reports.isPending && <p className="text-muted">{t('loading')}</p>}
      {reports.isError && <p className="text-muted">{t('error')}</p>}
      {reports.data?.data.length === 0 && <p className="text-muted">{t('staff.queueEmpty')}</p>}
      <ul className="flex flex-col gap-3">
        {reports.data?.data.map((r) => (
          <ReportCard key={r.id} r={r} token={token} onDone={() => queryClient.invalidateQueries({ queryKey: ['staff', 'reports'] })} />
        ))}
      </ul>
    </div>
  )
}
