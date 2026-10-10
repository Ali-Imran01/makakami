// React hook for form state.
import { useState, type FormEvent } from 'react'
// Hook for translated text.
import { useTranslation } from 'react-i18next'
import { Link, useNavigate, useSearchParams } from 'react-router-dom'
import { ApiError } from '../api'
import { resetPassword } from '../authApi'
import TextField from '../components/TextField'

// "Choose a new password" page, route /tetapkan-semula?token=...&email=... (the address in the emailed link).
export default function ResetPassword() {
  const { t } = useTranslation()
  const navigate = useNavigate()
  const [params] = useSearchParams()
  // The one-time token and the email come from the link.
  const token = params.get('token') ?? ''
  const email = params.get('email') ?? ''
  const [password, setPassword] = useState('')
  const [busy, setBusy] = useState(false)
  const [passwordError, setPasswordError] = useState('')
  // True when the link is wrong, used or expired.
  const [invalidLink, setInvalidLink] = useState(false)
  const [error, setError] = useState('')

  // A link without a token or email can't work.
  const broken = invalidLink || token === '' || email === ''

  const onSubmit = async (e: FormEvent) => {
    e.preventDefault()
    setPasswordError('')
    setError('')
    setBusy(true)
    try {
      await resetPassword({ email, token, password })
      // Go to the login page, which says the password was changed.
      navigate('/log-masuk?reset=1', { replace: true })
    } catch (err) {
      if (err instanceof ApiError && err.status === 422) {
        // A problem with the password itself, or with the link.
        if (err.fieldErrors.password) setPasswordError(err.fieldErrors.password[0])
        else setInvalidLink(true)
      } else if (err instanceof ApiError && err.status === 429) setError(t('auth.tooMany'))
      else setError(t('error'))
    } finally {
      setBusy(false)
    }
  }

  return (
    <div className="mx-auto flex max-w-md flex-col gap-5 px-4 pt-8 pb-28 lg:pb-16">
      <h1 className="text-title">{t('auth.resetTitle')}</h1>

      {broken ? (
        // Wrong, used or expired link: offer to ask for a new one.
        <div role="alert" className="flex flex-col gap-2 rounded-md border border-line bg-unknown-soft p-4">
          <p className="text-label font-normal text-ink">{t('auth.resetInvalid')}</p>
          <Link to="/lupa-kata-laluan" className="text-label font-bold text-navy">
            {t('auth.forgotAgain')}
          </Link>
        </div>
      ) : (
        <form onSubmit={onSubmit} noValidate className="flex flex-col gap-4">
          <p className="break-all text-label font-normal text-muted">{email}</p>
          <TextField id="password" label={t('auth.passwordNew')} type="password" autoComplete="new-password" value={password} onChange={(e) => setPassword(e.target.value)} error={passwordError} required />
          <p className="-mt-2 text-caption font-normal text-muted">{t('auth.passwordHint')}</p>
          {error && (
            <p role="alert" className="text-label font-normal text-unknown">
              {error}
            </p>
          )}
          <button type="submit" disabled={busy} className="h-12 rounded-pill bg-navy text-[15px] font-bold text-white disabled:opacity-60">
            {t('auth.resetButton')}
          </button>
        </form>
      )}
    </div>
  )
}
