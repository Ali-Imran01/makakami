// Data fetching and changes with caching.
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
// Icons so state is never shown by colour alone.
import { Check, X } from 'lucide-react'
import { useState } from 'react'
import { useTranslation } from 'react-i18next'
import { ApiError } from '../../api'
import { approveSubmission, fetchQueue, HUMAN_DECIDED, rejectSubmission, type StaffSubmission } from '../../staffApi'

// The product fields shown in a submission, in this order, with the translation key of each label.
const FIELDS = [
  ['name', 'contribute.name'],
  ['brand', 'contribute.brand'],
  ['category', 'contribute.category'],
  ['manufacturer', 'contribute.manufacturer'],
  ['state', 'contribute.state'],
  ['halal', 'contribute.halal'],
  ['quantity', 'contribute.quantity'],
  ['image_url', 'contribute.imageUrl'],
] as const

// One submission: what was proposed (compared with the current product for corrections) and the approve / reject controls.
function SubmissionCard({ s, allowed, token, onDone }: { s: StaffSubmission; allowed: string[]; token: string; onDone: () => void }) {
  const { t, i18n } = useTranslation()
  const [status, setStatus] = useState('')
  const [evidence, setEvidence] = useState('')
  const [note, setNote] = useState('')
  const [error, setError] = useState('')

  // Approve or reject; either way the queue is refreshed afterwards.
  const act = useMutation({
    mutationFn: (kind: 'approve' | 'reject') =>
      kind === 'approve'
        ? approveSubmission(token, s.id, { origin_status: status || undefined, evidence: evidence.trim() || undefined, review_note: note.trim() || undefined })
        : rejectSubmission(token, s.id, note.trim()),
    onSuccess: onDone,
    onError: (err) => {
      // 422 carries the reason (e.g. "needs a written reason"); 409 means someone else already handled it.
      if (err instanceof ApiError && err.status === 422) setError(Object.values(err.fieldErrors).flat()[0] ?? t('error'))
      else if (err instanceof ApiError && err.serverMessage) setError(err.serverMessage)
      else setError(t('error'))
    },
  })

  const needsEvidence = HUMAN_DECIDED.includes(status)
  const date = new Date(s.created_at).toLocaleString(i18n.language === 'ms' ? 'ms-MY' : 'en-MY', { dateStyle: 'medium', timeStyle: 'short' })

  return (
    <li className="flex flex-col gap-3 rounded-md border border-line bg-surface p-4">
      {/* Header: type, barcode, who and when. */}
      <div className="flex flex-col gap-0.5">
        <span className="text-label font-bold text-navy">{t(`mySubmissions.type.${s.type}`)}</span>
        <span className="text-body font-bold tracking-[0.04em]">{s.barcode}</span>
        <span className="text-caption font-normal text-muted">
          {s.contributor.name} · {date}
        </span>
      </div>

      {/* Proposed values; for corrections, "current → proposed". */}
      <dl className="flex flex-col gap-1.5 text-label font-normal">
        {FIELDS.filter(([key]) => s.payload[key]).map(([key, labelKey]) => (
          <div key={key} className="flex flex-wrap gap-x-2">
            <dt className="text-muted">{t(labelKey)}:</dt>
            <dd className="min-w-0 break-words">
              {s.current && s.current[key] ? <span className="text-muted line-through">{String(s.current[key])}</span> : null}
              {s.current && s.current[key] ? ' → ' : ''}
              <strong className="font-bold">{String(s.payload[key])}</strong>
            </dd>
          </div>
        ))}
        {s.current && <div className="text-caption text-muted">{t('staff.currentStatus', { status: t(`staff.statusNames.${s.current.origin_status}`) })}</div>}
      </dl>

      {/* The contributor's source note. */}
      <p className="rounded-sm bg-ground p-2.5 text-label font-normal">
        <span className="font-bold">{t('contribute.note')}</span> {s.payload.note}
      </p>

      {/* Already handled: show the outcome. */}
      {s.status !== 'pending' && (
        <p className="text-label font-normal text-muted">
          {t(`mySubmissions.status.${s.status}`)}
          {s.review_note ? `: ${s.review_note}` : ''}
        </p>
      )}

      {/* Decision controls (only for waiting submissions). */}
      {s.status === 'pending' && (
        <div className="flex flex-col gap-2.5 border-t border-line pt-3">
          <label className="flex flex-col gap-1.5 text-label text-muted">
            {t('staff.setStatus')}
            <select value={status} onChange={(e) => setStatus(e.target.value)} className="h-11 rounded-sm border border-line bg-surface px-3 text-body font-normal text-ink">
              <option value="">{s.type === 'new_product' ? t('staff.statusDefault') : t('staff.statusKeep')}</option>
              {allowed.map((a) => (
                <option key={a} value={a}>
                  {t(`staff.statusNames.${a}`)}
                </option>
              ))}
            </select>
          </label>
          {/* A written reason is required for statuses decided by a person. */}
          {needsEvidence && (
            <label className="flex flex-col gap-1.5 text-label text-muted">
              {t('staff.evidence')}
              <textarea rows={2} maxLength={500} value={evidence} onChange={(e) => setEvidence(e.target.value)} className="rounded-sm border border-line bg-surface px-3 py-2 text-body font-normal text-ink" />
            </label>
          )}
          <label className="flex flex-col gap-1.5 text-label text-muted">
            {t('staff.messageToContributor')}
            <textarea rows={2} maxLength={500} value={note} onChange={(e) => setNote(e.target.value)} className="rounded-sm border border-line bg-surface px-3 py-2 text-body font-normal text-ink" />
          </label>
          {error && (
            <p role="alert" className="text-label font-normal text-unknown">
              {error}
            </p>
          )}
          <div className="flex gap-3">
            <button type="button" disabled={act.isPending} onClick={() => { setError(''); act.mutate('approve') }} className="flex h-11 flex-1 items-center justify-center gap-1.5 rounded-pill bg-navy text-label font-bold text-white disabled:opacity-60">
              <Check size={16} strokeWidth={2.5} aria-hidden="true" />
              {t('staff.approve')}
            </button>
            <button
              type="button"
              disabled={act.isPending}
              onClick={() => {
                // A rejection needs a message the contributor can learn from.
                if (note.trim().length < 5) return setError(t('staff.rejectNeedsNote'))
                setError('')
                act.mutate('reject')
              }}
              className="flex h-11 flex-1 items-center justify-center gap-1.5 rounded-pill border border-line bg-surface text-label font-bold text-ink disabled:opacity-60"
            >
              <X size={16} strokeWidth={2.5} aria-hidden="true" />
              {t('staff.reject')}
            </button>
          </div>
        </div>
      )}
    </li>
  )
}

// The review queue tab.
export default function QueueTab({ token }: { token: string }) {
  const { t } = useTranslation()
  const queryClient = useQueryClient()
  // Which list is shown: waiting, approved or rejected.
  const [status, setStatus] = useState<'pending' | 'approved' | 'rejected'>('pending')
  const queue = useQuery({ queryKey: ['staff', 'queue', status], queryFn: () => fetchQueue(token, status) })

  return (
    <div className="flex flex-col gap-4">
      {/* Filter pills with counts. */}
      <div className="flex flex-wrap gap-2">
        {(['pending', 'approved', 'rejected'] as const).map((st) => (
          <button
            key={st}
            type="button"
            aria-pressed={status === st}
            onClick={() => setStatus(st)}
            className={`h-10 rounded-pill border px-4 text-label font-bold ${status === st ? 'border-navy bg-navy text-white' : 'border-line bg-surface text-ink'}`}
          >
            {t(`mySubmissions.status.${st}`)} · {queue.data?.counts[st] ?? 0}
          </button>
        ))}
      </div>

      {queue.isPending && <p className="text-muted">{t('loading')}</p>}
      {queue.isError && <p className="text-muted">{t('error')}</p>}
      {queue.data?.data.length === 0 && <p className="text-muted">{t('staff.queueEmpty')}</p>}

      <ul className="flex flex-col gap-3">
        {queue.data?.data.map((s) => (
          <SubmissionCard key={s.id} s={s} allowed={queue.data.allowed_statuses} token={token} onDone={() => queryClient.invalidateQueries({ queryKey: ['staff', 'queue'] })} />
        ))}
      </ul>
    </div>
  )
}
