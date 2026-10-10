// React state for the selected tab.
import { useState } from 'react'
import { useTranslation } from 'react-i18next'
import { usePageMeta } from '../usePageMeta'
import { Link, Navigate } from 'react-router-dom'
import { useAuth } from '../authContext'
import { ROLE_RANK } from '../authApi'
import AuditTab from '../components/staff/AuditTab'
import ProductTab from '../components/staff/ProductTab'
import ReportsTab from '../components/staff/ReportsTab'
import QueueTab from '../components/staff/QueueTab'
import UsersTab from '../components/staff/UsersTab'

type Tab = 'queue' | 'reports' | 'product' | 'users' | 'audit'

// Staff area, route /staf (not linked from the public pages; the profile shows a link to staff members only).
// Moderators and above see the review queue and the product editor; admins and above also see People and the Log.
export default function Staff() {
  const { t } = useTranslation()
  // Browser tab title (and "noindex" where the page must stay out of search engines).
  usePageMeta(t('staff.title'), true)
  const { user, token, loading } = useAuth()
  const [tab, setTab] = useState<Tab>('queue')

  if (loading) return <p className="px-4 pt-8 text-muted">{t('loading')}</p>
  // Guests log in first.
  if (!user || !token) return <Navigate to="/log-masuk" replace state={{ from: '/staf' }} />

  const rank = ROLE_RANK[user.role]
  // Contributors have no staff area (the server refuses them too).
  if (rank < ROLE_RANK.moderator) {
    return (
      <div className="mx-auto max-w-xl px-4 pt-8 pb-6">
        <h1 className="text-title">{t('staff.title')}</h1>
        <p className="mt-3 text-muted">{t('staff.noAccess')}</p>
        <Link to="/profil" className="mt-3 inline-block font-bold text-navy">{t('auth.profileTitle')}</Link>
      </div>
    )
  }

  // Tabs this role can see.
  const tabs: Tab[] = rank >= ROLE_RANK.admin ? ['queue', 'reports', 'product', 'users', 'audit'] : ['queue', 'reports', 'product']

  return (
    <div className="mx-auto flex max-w-3xl flex-col gap-5 px-4 pt-8 pb-6 lg:pb-8">
      <div className="flex items-baseline justify-between gap-3">
        <h1 className="text-title">{t('staff.title')}</h1>
        <span className="text-caption font-bold text-muted">{t(`auth.roles.${user.role}`)}</span>
      </div>

      {/* Tab buttons (a proper tab list for keyboards and screen readers). */}
      <div role="tablist" aria-label={t('staff.title')} className="flex flex-wrap gap-2">
        {tabs.map((id) => (
          <button
            key={id}
            role="tab"
            id={`tab-${id}`}
            aria-selected={tab === id}
            aria-controls="staff-panel"
            onClick={() => setTab(id)}
            className={`h-10 rounded-pill border px-4 text-label font-bold ${tab === id ? 'border-navy bg-navy text-white' : 'border-line bg-surface text-ink'}`}
          >
            {t(`staff.tabs.${id}`)}
          </button>
        ))}
      </div>

      <div role="tabpanel" id="staff-panel" aria-labelledby={`tab-${tab}`}>
        {tab === 'queue' && <QueueTab token={token} />}
        {tab === 'reports' && <ReportsTab token={token} />}
        {tab === 'product' && <ProductTab token={token} role={user.role} />}
        {tab === 'users' && rank >= ROLE_RANK.admin && <UsersTab token={token} me={user} />}
        {tab === 'audit' && rank >= ROLE_RANK.admin && <AuditTab token={token} />}
      </div>
    </div>
  )
}
