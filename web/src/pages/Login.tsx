// React hook for form state.
import { useState, type FormEvent } from 'react'
// Hook for translated text.
import { useTranslation } from 'react-i18next'
// Router helpers: links, moving to another page, and the query string (?verified=1).
import { Link, Navigate, useLocation, useNavigate, useSearchParams } from 'react-router-dom'
import { ApiError } from '../api'
import { useAuth } from '../authContext'
import TextField from '../components/TextField'

// Log-in page, route /log-masuk.
export default function Login() {
  // Translate function.
  const { t } = useTranslation()
  // Who is signed in and how to log in.
  const { user, login } = useAuth()
  const navigate = useNavigate()
  // Where the person was heading before being sent here (set by pages that need a login).
  const location = useLocation()
  const from = (location.state as { from?: string } | null)?.from ?? '/profil'
  // "?verified=1" is added by the email confirmation link.
  const [params] = useSearchParams()
  // Form values and state.
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState('')
  const [busy, setBusy] = useState(false)

  // Already signed in: no need to see this page. (Someone who just clicked the email link while logged in goes to their profile, which says it worked.)
  if (user) return <Navigate to={params.get('verified') === '1' ? '/profil?verified=1' : from} replace />

  // Submit the form.
  const onSubmit = async (e: FormEvent) => {
    // Stop the browser's own form submit.
    e.preventDefault()
    setError('')
    setBusy(true)
    try {
      // Ask the server; on success the auth context stores the token.
      await login(email, password)
      navigate(from, { replace: true })
    } catch (err) {
      // 422 = wrong email or password; 429 = too many attempts; anything else = connection trouble.
      setError(err instanceof ApiError && err.status === 422 ? t('auth.badCredentials') : err instanceof ApiError && err.status === 429 ? t('auth.tooMany') : t('error'))
    } finally {
      setBusy(false)
    }
  }

  return (
    // Centred narrow column; bottom padding clears the phone tab bar.
    <div className="mx-auto flex max-w-md flex-col gap-5 px-4 pt-8 pb-28 lg:pb-16">
      {/* Page title (the page's h1). */}
      <h1 className="text-title">{t('auth.loginTitle')}</h1>

      {/* Shown after the person clicked the link in the confirmation email. */}
      {params.get('verified') === '1' && (
        <p role="status" className="rounded-md border border-line bg-verified-soft p-3 text-label font-normal text-verified-ink">
          {t('auth.emailConfirmed')}
        </p>
      )}

      {/* The form; noValidate so we show our own messages. */}
      <form onSubmit={onSubmit} noValidate className="flex flex-col gap-4">
        <TextField id="email" label={t('auth.email')} type="email" autoComplete="email" value={email} onChange={(e) => setEmail(e.target.value)} required />
        <TextField id="password" label={t('auth.password')} type="password" autoComplete="current-password" value={password} onChange={(e) => setPassword(e.target.value)} required />
        {/* Server message (wrong password, too many tries...). */}
        {error && (
          <p role="alert" className="text-label font-normal text-unknown">
            {error}
          </p>
        )}
        {/* Submit; disabled while waiting so it can't be sent twice. */}
        <button type="submit" disabled={busy} className="h-12 rounded-pill bg-navy text-[15px] font-bold text-white disabled:opacity-60">
          {t('auth.loginButton')}
        </button>
      </form>

      {/* Link to sign-up. */}
      <p className="text-label font-normal text-muted">
        {t('auth.noAccount')}{' '}
        <Link to="/daftar" className="font-bold text-navy">
          {t('auth.registerLink')}
        </Link>
      </p>
    </div>
  )
}
