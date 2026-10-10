// Fetches API data and caches it.
import { useQuery } from '@tanstack/react-query'
// React hook for form state.
import { useState, type FormEvent } from 'react'
// Hook for translated text and the current language.
import { useTranslation } from 'react-i18next'
import { usePageMeta } from '../usePageMeta'
// Router helpers.
import { Link, Navigate, useLocation, useSearchParams } from 'react-router-dom'
import { ApiError, fetchCategories } from '../api'
import { useAuth } from '../authContext'
import { createSubmission, type SubmissionInput } from '../authApi'
import TextField from '../components/TextField'
import { MALAYSIAN_STATES } from '../malaysianStates'

// Shared look for the select boxes and the text area (same as TextField's input).
const FIELD = 'rounded-sm border border-line bg-surface px-3.5 text-body text-ink'

// The form values (all text; empty means "not filled in").
const EMPTY = { barcode: '', name: '', brand: '', category: '', manufacturer: '', state: '', halal: '', quantity: '', image_url: '', note: '' }

// Contribute page, route /sumbang: a logged-in person sends in a new product or a correction.
// Nothing here publishes anything: every submission waits for a moderator.
export default function Contribute() {
  const { t, i18n } = useTranslation()
  // Browser tab title (and "noindex" where the page must stay out of search engines).
  usePageMeta(t('contribute.title'), true)
  const { user, token, loading } = useAuth()
  const location = useLocation()
  // "?barcode=..." pre-fills the barcode (used by the "product not found" screen).
  const [params] = useSearchParams()
  const [form, setForm] = useState({ ...EMPTY, barcode: (params.get('barcode') ?? '').replace(/\D/g, '') })
  const [fieldErrors, setFieldErrors] = useState<Record<string, string[]>>({})
  const [error, setError] = useState('')
  const [busy, setBusy] = useState(false)
  // What was just submitted (shows the thank-you card).
  const [sent, setSent] = useState<{ type: string; barcode: string } | null>(null)
  // Categories for the choice list.
  const categories = useQuery({ queryKey: ['categories'], queryFn: fetchCategories })
  const ms = i18n.language === 'ms'

  // Still checking a saved login.
  if (loading) return <p className="px-4 pt-8 text-muted">{t('loading')}</p>
  // Guests log in first and come back here (with the barcode, if any).
  if (!user) return <Navigate to="/log-masuk" replace state={{ from: location.pathname + location.search }} />

  // Update one field of the form.
  const set = (key: keyof typeof EMPTY) => (e: { target: { value: string } }) => setForm((f) => ({ ...f, [key]: e.target.value }))
  // First error message of a field (the server's wording).
  const first = (field: string) => fieldErrors[field]?.[0]

  // Send the form.
  const onSubmit = async (e: FormEvent) => {
    e.preventDefault()
    if (!token) return
    setFieldErrors({})
    setError('')
    setBusy(true)
    try {
      // Only send what was filled in.
      const input = Object.fromEntries(Object.entries(form).filter(([, v]) => v.trim() !== '')) as unknown as SubmissionInput
      const result = await createSubmission(token, input)
      setSent({ type: result.type, barcode: result.barcode })
    } catch (err) {
      if (err instanceof ApiError && err.status === 422) setFieldErrors(err.fieldErrors)
      else if (err instanceof ApiError && err.status === 403) setError(t('contribute.verifyFirstBody'))
      else if (err instanceof ApiError && err.status === 429) setError(t('auth.tooMany'))
      else setError(t('error'))
    } finally {
      setBusy(false)
    }
  }

  // Wrapper shared by every state of the page.
  const frame = (body: React.ReactNode) => (
    <div className="mx-auto flex max-w-xl flex-col gap-5 px-4 pt-8 pb-6 lg:pb-8">
      <h1 className="text-title">{t('contribute.title')}</h1>
      {body}
    </div>
  )

  // Email not confirmed: the server would refuse, so explain instead of showing the form.
  if (!user.email_verified) {
    return frame(
      <div className="flex flex-col gap-2 rounded-md border border-line bg-unknown-soft p-4">
        <p className="text-body font-semibold">{t('contribute.verifyFirst')}</p>
        <p className="text-label font-normal text-ink">{t('contribute.verifyFirstBody')}</p>
        <Link to="/profil" className="self-start text-label font-bold text-navy">
          {t('auth.profileTitle')}
        </Link>
      </div>,
    )
  }

  // Sent: thank-you card.
  if (sent) {
    return frame(
      <div role="status" className="flex flex-col gap-3 rounded-md border border-line bg-verified-soft p-4">
        <p className="text-heading text-verified-ink">{t('contribute.thanks')}</p>
        <p className="text-label font-normal text-ink">{t(sent.type === 'correction' ? 'contribute.thanksCorrection' : 'contribute.thanksNew', { barcode: sent.barcode })}</p>
        <div className="flex flex-wrap gap-3">
          <button type="button" onClick={() => { setSent(null); setForm({ ...EMPTY }) }} className="h-11 rounded-pill bg-navy px-5 text-label font-bold text-white">
            {t('contribute.another')}
          </button>
          <Link to="/sumbangan-saya" className="flex h-11 items-center rounded-pill border border-line bg-surface px-5 text-label font-bold text-ink">
            {t('contribute.mine')}
          </Link>
        </div>
      </div>,
    )
  }

  return frame(
    <>
      {/* What happens to a submission. */}
      <p className="text-label font-normal text-muted">{t('contribute.intro')}</p>

      <form onSubmit={onSubmit} noValidate className="flex flex-col gap-4">
        <TextField id="barcode" label={t('contribute.barcode')} inputMode="numeric" value={form.barcode} onChange={set('barcode')} error={first('barcode')} required />
        <TextField id="name" label={t('contribute.name')} value={form.name} onChange={set('name')} error={first('name')} />
        <TextField id="brand" label={t('contribute.brand')} value={form.brand} onChange={set('brand')} error={first('brand')} />

        {/* Category: grouped by top-level category. */}
        <div className="flex flex-col gap-2">
          <label htmlFor="category" className="text-label text-muted">
            {t('contribute.category')}
          </label>
          <select id="category" value={form.category} onChange={set('category')} className={`h-12 ${FIELD}`}>
            <option value="">{t('contribute.noChoice')}</option>
            {categories.data?.map((c) => (
              <optgroup key={c.id} label={ms ? c.name_ms : c.name_en}>
                {c.children?.map((s) => (
                  <option key={s.id} value={s.slug}>
                    {ms ? s.name_ms : s.name_en}
                  </option>
                ))}
              </optgroup>
            ))}
          </select>
          {first('category') && <p role="alert" className="text-caption text-unknown">{first('category')}</p>}
        </div>

        <TextField id="manufacturer" label={t('contribute.manufacturer')} value={form.manufacturer} onChange={set('manufacturer')} error={first('manufacturer')} />

        {/* Manufacturer state. */}
        <div className="flex flex-col gap-2">
          <label htmlFor="state" className="text-label text-muted">
            {t('contribute.state')}
          </label>
          <select id="state" value={form.state} onChange={set('state')} className={`h-12 ${FIELD}`}>
            <option value="">{t('contribute.noChoice')}</option>
            {MALAYSIAN_STATES.map((s) => (
              <option key={s} value={s}>
                {s}
              </option>
            ))}
          </select>
          {first('state') && <p role="alert" className="text-caption text-unknown">{first('state')}</p>}
        </div>

        {/* Halal. */}
        <div className="flex flex-col gap-2">
          <label htmlFor="halal" className="text-label text-muted">
            {t('contribute.halal')}
          </label>
          <select id="halal" value={form.halal} onChange={set('halal')} className={`h-12 ${FIELD}`}>
            <option value="">{t('contribute.noChoice')}</option>
            <option value="yes">{t('result.halalYes')}</option>
            <option value="no">{t('result.halalNo')}</option>
            <option value="unknown">{t('result.halalUnknown')}</option>
          </select>
          {first('halal') && <p role="alert" className="text-caption text-unknown">{first('halal')}</p>}
        </div>

        <TextField id="quantity" label={t('contribute.quantity')} value={form.quantity} onChange={set('quantity')} error={first('quantity')} />

        {/* Photo: upload is a placeholder for now; a web link is accepted instead. */}
        <div aria-disabled="true" className="flex flex-col gap-1 rounded-sm border border-dashed border-line bg-ground p-3.5 text-muted">
          <span className="text-label">{t('contribute.photoSoonTitle')}</span>
          <span className="text-caption font-normal">{t('contribute.photoSoon')}</span>
        </div>
        <TextField id="image_url" label={t('contribute.imageUrl')} type="url" inputMode="url" value={form.image_url} onChange={set('image_url')} error={first('image_url')} />

        {/* Where the information comes from (required). */}
        <div className="flex flex-col gap-2">
          <label htmlFor="note" className="text-label text-muted">
            {t('contribute.note')}
          </label>
          <textarea
            id="note"
            rows={3}
            maxLength={500}
            value={form.note}
            onChange={set('note')}
            aria-invalid={first('note') ? true : undefined}
            className={`py-3 ${FIELD} ${first('note') ? 'border-unknown' : ''}`}
          />
          <p className="text-caption font-normal text-muted">{t('contribute.noteHelp')}</p>
          {first('note') && <p role="alert" className="text-caption text-unknown">{first('note')}</p>}
        </div>

        {error && (
          <p role="alert" className="text-label font-normal text-unknown">
            {error}
          </p>
        )}
        <button type="submit" disabled={busy} className="h-12 rounded-pill bg-navy text-[15px] font-bold text-white disabled:opacity-60">
          {t('contribute.submit')}
        </button>
      </form>
    </>,
  )
}
