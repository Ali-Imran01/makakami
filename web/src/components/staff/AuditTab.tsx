// Data fetching with caching.
import { useQuery } from '@tanstack/react-query'
import { useTranslation } from 'react-i18next'
import { fetchAudit } from '../../staffApi'

// Show a before/after object as short "field: value" text.
const brief = (o: Record<string, unknown> | null) => (o ? Object.entries(o).map(([k, v]) => `${k}: ${v === null ? '—' : String(v)}`).join(', ') : '')

// The "Log" tab (admins and above): who changed what, when and why. Read-only.
export default function AuditTab({ token }: { token: string }) {
  const { t, i18n } = useTranslation()
  const audit = useQuery({ queryKey: ['staff', 'audit'], queryFn: () => fetchAudit(token) })

  return (
    <div className="flex flex-col gap-3">
      {audit.isPending && <p className="text-muted">{t('loading')}</p>}
      {audit.isError && <p className="text-muted">{t('error')}</p>}
      {audit.data?.length === 0 && <p className="text-muted">{t('staff.auditEmpty')}</p>}
      <ul className="flex flex-col gap-2">
        {audit.data?.map((l) => (
          <li key={l.id} className="flex flex-col gap-1 rounded-md border border-line bg-surface p-3 text-label font-normal">
            <div className="flex flex-wrap items-baseline justify-between gap-2">
              <span className="font-bold">{l.action}</span>
              <span className="text-caption text-muted">{new Date(l.created_at).toLocaleString(i18n.language === 'ms' ? 'ms-MY' : 'en-MY', { dateStyle: 'medium', timeStyle: 'short' })}</span>
            </div>
            <span className="text-muted">
              {l.actor ?? t('staff.commandLine')} {l.subject ? `→ ${l.subject}` : ''}
            </span>
            {l.before && <span className="break-words text-muted">{t('staff.before')}: {brief(l.before)}</span>}
            {l.after && <span className="break-words">{t('staff.after')}: {brief(l.after)}</span>}
            {l.note && <span className="text-muted">“{l.note}”</span>}
          </li>
        ))}
      </ul>
    </div>
  )
}
