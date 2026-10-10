// React hook for local state.
import { useState } from 'react'
// Hook for translated text.
import { useTranslation } from 'react-i18next'
// Router helpers.
import { Navigate, useLocation, useNavigate, useSearchParams } from 'react-router-dom'
import { useAuth } from '../authContext'
import { resendVerification } from '../authApi'
import LangToggle from '../components/LangToggle'

// Profile page, route /profil: who you are, email confirmation status, and log out.
export default function Profile() {
  const { t } = useTranslation()
  const { user, token, loading, logout } = useAuth()
  const navigate = useNavigate()
  const location = useLocation()
  // True right after sign-up (set by the sign-up page).
  const welcome = (location.state as { welcome?: boolean } | null)?.welcome === true
  // "?verified=1" is added when the person arrives from the confirmation email while logged in.
  const [params] = useSearchParams()
  // Result of pressing "send the email again".
  const [resendNote, setResendNote] = useState('')
  const [busy, setBusy] = useState(false)

  // Still checking a saved token: show nothing yet rather than flashing the login page.
  if (loading) return <p className="px-4 pt-8 text-muted">{t('loading')}</p>
  // Guests are sent to the login page and brought back here afterwards.
  if (!user) return <Navigate to="/log-masuk" replace state={{ from: '/profil' }} />

  // Send the confirmation email again.
  const resend = async () => {
    if (!token) return
    setBusy(true)
    setResendNote('')
    try {
      await resendVerification(token)
      setResendNote(t('auth.resent'))
    } catch {
      // Includes "too many requests": just say so generically.
      setResendNote(t('auth.resendFailed'))
    } finally {
      setBusy(false)
    }
  }

  return (
    <div className="mx-auto flex max-w-md flex-col gap-5 px-4 pt-8 pb-28 lg:pb-16">
      {/* Title and language switch. */}
      <div className="flex items-center justify-between">
        <h1 className="text-title">{t('auth.profileTitle')}</h1>
        <LangToggle />
      </div>

      {/* Arrived from the confirmation email: say it worked. */}
      {params.get('verified') === '1' && user.email_verified && (
        <p role="status" className="rounded-md border border-line bg-verified-soft p-3 text-label font-normal text-verified-ink">
          {t('auth.emailConfirmedIn')}
        </p>
      )}

      {/* Just signed up: explain what happens next. */}
      {welcome && !user.email_verified && (
        <p role="status" className="rounded-md border border-line bg-verified-soft p-3 text-label font-normal text-verified-ink">
          {t('auth.welcome', { email: user.email })}
        </p>
      )}

      {/* Account details. */}
      <dl className="flex flex-col gap-3 rounded-md border border-line bg-surface p-4">
        <div>
          <dt className="text-caption text-muted">{t('auth.name')}</dt>
          <dd className="text-body font-semibold">{user.name}</dd>
        </div>
        <div>
          <dt className="text-caption text-muted">{t('auth.email')}</dt>
          <dd className="text-body font-semibold">{user.email}</dd>
        </div>
        <div>
          <dt className="text-caption text-muted">{t('auth.role')}</dt>
          <dd className="text-body font-semibold">{t(`auth.roles.${user.role}`)}</dd>
        </div>
      </dl>

      {/* Email not confirmed yet: say so, with a resend button. */}
      {!user.email_verified && (
        <div className="flex flex-col gap-2 rounded-md border border-line bg-unknown-soft p-4">
          <p className="text-label font-normal text-ink">{t('auth.unverified')}</p>
          <button type="button" onClick={resend} disabled={busy} className="h-11 self-start rounded-pill border border-line bg-surface px-4 text-label font-bold text-ink disabled:opacity-60">
            {t('auth.resend')}
          </button>
          {resendNote && (
            <p role="status" className="text-caption font-normal text-muted">
              {resendNote}
            </p>
          )}
        </div>
      )}

      {/* Log out, then go to the home page. */}
      <button
        type="button"
        onClick={async () => {
          await logout()
          navigate('/', { replace: true })
        }}
        className="h-12 rounded-pill border border-line bg-surface text-[15px] font-bold text-ink"
      >
        {t('auth.logout')}
      </button>
    </div>
  )
}
