// Data fetching with caching.
import { useQuery, useQueryClient } from '@tanstack/react-query'
import { useState, type FormEvent } from 'react'
import { useTranslation } from 'react-i18next'
import { ApiError } from '../../api'
import { ROLE_RANK, type AuthUser } from '../../authApi'
import { fetchStaffUsers, setUserRole } from '../../staffApi'
import TextField from '../TextField'

// The roles that can be handed out through the website, from lowest to highest (super_admin only exists via the command line).
const GRANTABLE: AuthUser['role'][] = ['user', 'moderator', 'admin']

// The "People" tab (admins and above): find someone and change their role. The server applies the ladder rules;
// the form only offers choices that would be allowed.
export default function UsersTab({ token, me }: { token: string; me: AuthUser }) {
  const { t } = useTranslation()
  const queryClient = useQueryClient()
  const [q, setQ] = useState('')
  // The search text that is currently applied (changes when the form is submitted).
  const [applied, setApplied] = useState('')
  const [error, setError] = useState('')
  const users = useQuery({ queryKey: ['staff', 'users', applied], queryFn: () => fetchStaffUsers(token, applied) })

  // Change one person's role.
  const change = async (email: string, role: string) => {
    setError('')
    try {
      await setUserRole(token, email, role)
      await queryClient.invalidateQueries({ queryKey: ['staff', 'users'] })
    } catch (err) {
      setError(err instanceof ApiError && err.serverMessage ? err.serverMessage : t('error'))
    }
  }

  return (
    <div className="flex flex-col gap-4">
      <form onSubmit={(e: FormEvent) => { e.preventDefault(); setApplied(q.trim()) }} className="flex items-end gap-2">
        <div className="min-w-0 flex-1">
          <TextField id="staff-q" label={t('staff.searchPeople')} value={q} onChange={(e) => setQ(e.target.value)} />
        </div>
        <button type="submit" className="h-12 rounded-pill bg-navy px-5 text-label font-bold text-white">{t('staff.lookup')}</button>
      </form>
      {error && <p role="alert" className="text-label font-normal text-unknown">{error}</p>}
      {users.isPending && <p className="text-muted">{t('loading')}</p>}
      <ul className="flex flex-col gap-2">
        {users.data?.map((u) => {
          // You can only change people who rank below you, and only to roles below your own.
          const canChange = ROLE_RANK[me.role] > ROLE_RANK[u.role]
          return (
            <li key={u.id} className="flex flex-wrap items-center justify-between gap-3 rounded-md border border-line bg-surface p-3">
              <div className="flex min-w-0 flex-col">
                <span className="text-body font-bold">{u.name}</span>
                <span className="break-all text-caption font-normal text-muted">{u.email}{u.email_verified ? '' : ` · ${t('staff.unverified')}`}</span>
              </div>
              {canChange ? (
                <select
                  aria-label={t('auth.role')}
                  value={u.role}
                  onChange={(e) => change(u.email, e.target.value)}
                  className="h-10 rounded-sm border border-line bg-surface px-2.5 text-label text-ink"
                >
                  {GRANTABLE.filter((r) => ROLE_RANK[me.role] > ROLE_RANK[r]).map((r) => (
                    <option key={r} value={r}>{t(`auth.roles.${r}`)}</option>
                  ))}
                </select>
              ) : (
                <span className="rounded-pill bg-placeholder px-3 py-1 text-caption font-bold text-muted">{t(`auth.roles.${u.role}`)}</span>
              )}
            </li>
          )
        })}
      </ul>
    </div>
  )
}
