// React hook for form state.
import { useState, type FormEvent } from 'react'
// Hook for translated text.
import { useTranslation } from 'react-i18next'
import { usePageMeta } from '../usePageMeta'
import { Link } from 'react-router-dom'
import { ApiError } from '../api'
import { forgotPassword } from '../authApi'
import TextField from '../components/TextField'

// "Forgot password" page, route /lupa-kata-laluan: asks for the email and sends a reset link.
export default function ForgotPassword() {
  const { t } = useTranslation()
  // Browser tab title (and "noindex" where the page must stay out of search engines).
  usePageMeta(t('auth.forgotTitle'), true)
  const [email, setEmail] = useState('')
  const [busy, setBusy] = useState(false)
  // True once the request went through (the same message is shown whether or not the email has an account).
  const [sent, setSent] = useState(false)
  const [error, setError] = useState('')

  const onSubmit = async (e: FormEvent) => {
    e.preventDefault()
    setError('')
    setBusy(true)
    try {
      await forgotPassword(email)
      setSent(true)
    } catch (err) {
      // 429 = asked too many times; 422 = not an email address; anything else = connection trouble.
      setError(err instanceof ApiError && err.status === 429 ? t('auth.tooMany') : err instanceof ApiError && err.status === 422 ? t('auth.badEmail') : t('error'))
    } finally {
      setBusy(false)
    }
  }

  return (
    <div className="mx-auto flex max-w-md flex-col gap-5 px-4 pt-8 pb-6 lg:pb-8">
      <h1 className="text-title">{t('auth.forgotTitle')}</h1>

      {sent ? (
        // Confirmation (deliberately does not say whether the email is registered).
        <p role="status" className="rounded-md border border-line bg-verified-soft p-3 text-label font-normal text-verified-ink">
          {t('auth.forgotSent')}
        </p>
      ) : (
        <form onSubmit={onSubmit} noValidate className="flex flex-col gap-4">
          <p className="text-label font-normal text-muted">{t('auth.forgotIntro')}</p>
          <TextField id="email" label={t('auth.email')} type="email" autoComplete="email" value={email} onChange={(e) => setEmail(e.target.value)} required />
          {error && (
            <p role="alert" className="text-label font-normal text-unknown">
              {error}
            </p>
          )}
          <button type="submit" disabled={busy} className="h-12 rounded-pill bg-navy text-[15px] font-bold text-white disabled:opacity-60">
            {t('auth.forgotButton')}
          </button>
        </form>
      )}

      <Link to="/log-masuk" className="text-label font-bold text-navy">
        {t('auth.backToLogin')}
      </Link>
    </div>
  )
}
