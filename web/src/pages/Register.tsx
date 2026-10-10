// React hook for form state.
import { useState, type FormEvent } from 'react'
// Hook for translated text.
import { useTranslation } from 'react-i18next'
import { usePageMeta } from '../usePageMeta'
// Router helpers.
import { Link, Navigate } from 'react-router-dom'
import { ApiError } from '../api'
import { useAuth } from '../authContext'
import TextField from '../components/TextField'
// The version of the Terms and Privacy Policy the person is agreeing to (stored with their account).
import { LEGAL_VERSION } from '../legal/content'

// Sign-up page, route /daftar. Creates a normal user account.
export default function Register() {
  const { t } = useTranslation()
  // Browser tab title (and "noindex" where the page must stay out of search engines).
  usePageMeta(t('auth.registerTitle'), true)
  const { user, register } = useAuth()
  // Form values and state.
  const [name, setName] = useState('')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [accepted, setAccepted] = useState(false)
  const [busy, setBusy] = useState(false)
  // True once this visit created the account, so the profile page can say "account created".
  const [justRegistered, setJustRegistered] = useState(false)
  // What the server said is wrong with each field, and a general error.
  const [fieldErrors, setFieldErrors] = useState<Record<string, string[]>>({})
  const [error, setError] = useState('')

  // Signed in (including right after sign-up, because signing up logs you in): go to the profile.
  if (user) return <Navigate to="/profil" replace state={{ welcome: justRegistered }} />

  // Submit the form.
  const onSubmit = async (e: FormEvent) => {
    e.preventDefault()
    setFieldErrors({})
    setError('')
    // The box must be ticked (the server checks this too).
    if (!accepted) {
      setFieldErrors({ accept_terms: [t('auth.mustAccept')] })
      return
    }
    setBusy(true)
    try {
      // The page then redirects to the profile (above), which explains the confirmation email.
      setJustRegistered(true)
      await register({ name, email, password, termsVersion: LEGAL_VERSION })
    } catch (err) {
      if (err instanceof ApiError && err.status === 422) setFieldErrors(err.fieldErrors)
      else if (err instanceof ApiError && err.status === 429) setError(t('auth.tooMany'))
      else setError(t('error'))
    } finally {
      setBusy(false)
    }
  }

  // First error message of a field (the server's wording, in English).
  const first = (field: string) => fieldErrors[field]?.[0]

  return (
    <div className="mx-auto flex max-w-md flex-col gap-5 px-4 pt-8 pb-6 lg:pb-8">
      {/* Page title (the page's h1). */}
      <h1 className="text-title">{t('auth.registerTitle')}</h1>
      <form onSubmit={onSubmit} noValidate className="flex flex-col gap-4">
        <TextField id="name" label={t('auth.name')} autoComplete="name" value={name} onChange={(e) => setName(e.target.value)} error={first('name')} required />
        <TextField id="email" label={t('auth.email')} type="email" autoComplete="email" value={email} onChange={(e) => setEmail(e.target.value)} error={first('email')} required />
        <TextField
          id="password"
          label={t('auth.passwordNew')}
          type="password"
          autoComplete="new-password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          error={first('password')}
          required
        />
        {/* Hint under the password field. */}
        <p className="-mt-2 text-caption font-normal text-muted">{t('auth.passwordHint')}</p>

        {/* Agreement to the Terms and Privacy Policy (links open in a new tab so the form isn't lost). */}
        <div className="flex flex-col gap-1.5">
          <label className="flex items-start gap-2.5 text-label font-normal text-ink">
            <input type="checkbox" checked={accepted} onChange={(e) => setAccepted(e.target.checked)} className="mt-0.5 size-[18px] shrink-0 accent-navy" />
            <span>
              {t('auth.acceptPrefix')}{' '}
              <Link to="/terma" target="_blank" className="font-bold text-navy">
                {t('legal.terms')}
              </Link>{' '}
              {t('auth.and')}{' '}
              <Link to="/privasi" target="_blank" className="font-bold text-navy">
                {t('legal.privacy')}
              </Link>
              .
            </span>
          </label>
          {first('accept_terms') && (
            <p role="alert" className="text-caption text-unknown">
              {first('accept_terms')}
            </p>
          )}
        </div>

        {/* General error. */}
        {error && (
          <p role="alert" className="text-label font-normal text-unknown">
            {error}
          </p>
        )}
        <button type="submit" disabled={busy} className="h-12 rounded-pill bg-navy text-[15px] font-bold text-white disabled:opacity-60">
          {t('auth.registerButton')}
        </button>
      </form>

      <p className="text-label font-normal text-muted">
        {t('auth.haveAccount')}{' '}
        <Link to="/log-masuk" className="font-bold text-navy">
          {t('auth.loginLink')}
        </Link>
      </p>
    </div>
  )
}
