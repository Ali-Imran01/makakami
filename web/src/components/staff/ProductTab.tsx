// Fetches API data and caches it.
import { useQuery } from '@tanstack/react-query'
import { useState, type FormEvent } from 'react'
import { useTranslation } from 'react-i18next'
import { ApiError, fetchCategories } from '../../api'
import type { AuthUser } from '../../authApi'
import { ROLE_RANK } from '../../authApi'
import { MALAYSIAN_STATES } from '../../malaysianStates'
import { ALL_STATUSES, createStaffProduct, fetchStaffProduct, HUMAN_DECIDED, MODERATOR_STATUSES, updateStaffProduct, type StaffProduct } from '../../staffApi'
import TextField from '../TextField'

// Shared look for select boxes and text areas.
const FIELD = 'rounded-sm border border-line bg-surface px-3.5 text-body text-ink'

// What the form holds (all text).
const EMPTY = { name: '', brand: '', category: '', manufacturer: '', state: '', halal: 'unknown', quantity: '', image_url: '', origin_status: 'unknown', origin_note: '' }
type Form = typeof EMPTY

// The "Product" tab: look a barcode up, then correct it, or add it if we don't have it.
export default function ProductTab({ token, role }: { token: string; role: AuthUser['role'] }) {
  const { t, i18n } = useTranslation()
  const ms = i18n.language === 'ms'
  const categories = useQuery({ queryKey: ['categories'], queryFn: fetchCategories })

  const [barcode, setBarcode] = useState('')
  // null = nothing looked up yet; otherwise whether this is a new product or an existing one.
  const [mode, setMode] = useState<null | 'new' | 'edit'>(null)
  const [loaded, setLoaded] = useState<StaffProduct | null>(null)
  const [form, setForm] = useState<Form>(EMPTY)
  const [fieldErrors, setFieldErrors] = useState<Record<string, string[]>>({})
  const [message, setMessage] = useState('')
  const [busy, setBusy] = useState(false)

  // What this role may set (the server enforces the same rule).
  const allowed = loaded?.allowed_statuses ?? (ROLE_RANK[role] >= ROLE_RANK.admin ? ALL_STATUSES : MODERATOR_STATUSES)
  const statusLocked = loaded?.status_locked ?? false

  const set = (key: keyof Form) => (e: { target: { value: string } }) => setForm((f) => ({ ...f, [key]: e.target.value }))
  const first = (field: string) => fieldErrors[field]?.[0]

  // Look the barcode up.
  const lookup = async (e: FormEvent) => {
    e.preventDefault()
    setMessage('')
    setFieldErrors({})
    setBusy(true)
    try {
      const p = await fetchStaffProduct(token, barcode.replace(/\D/g, ''))
      setLoaded(p)
      setMode('edit')
      setForm({
        name: p.name ?? '',
        brand: p.brand ?? '',
        category: p.category ?? '',
        manufacturer: p.manufacturer ?? '',
        state: p.state ?? '',
        halal: p.halal ?? 'unknown',
        quantity: p.quantity ?? '',
        image_url: p.image_url ?? '',
        origin_status: p.origin_status,
        origin_note: p.origin_note ?? '',
      })
    } catch (err) {
      if (err instanceof ApiError && err.status === 404) {
        // Not in our database: offer to add it.
        setLoaded(null)
        setMode('new')
        setForm({ ...EMPTY })
      } else {
        setMessage(t('error'))
      }
    } finally {
      setBusy(false)
    }
  }

  // Save (create or update).
  const save = async (e: FormEvent) => {
    e.preventDefault()
    setMessage('')
    setFieldErrors({})
    setBusy(true)
    const code = barcode.replace(/\D/g, '')
    // Only send what is filled in; the status is only sent when the person may change it.
    const body = Object.fromEntries(Object.entries(form).filter(([k, v]) => v.trim() !== '' && !(k === 'origin_status' && statusLocked))) as Record<string, string>
    try {
      if (mode === 'new') await createStaffProduct(token, { barcode: code, ...body })
      else await updateStaffProduct(token, code, body)
      setMessage(t('staff.saved'))
      // Reload so the form shows what the server now holds (and the status lock, if it changed).
      setMode(null)
      setBarcode(code)
    } catch (err) {
      if (err instanceof ApiError && err.status === 422) setFieldErrors(err.fieldErrors)
      else setMessage(t('error'))
    } finally {
      setBusy(false)
    }
  }

  const needsReason = HUMAN_DECIDED.includes(form.origin_status)

  return (
    <div className="flex flex-col gap-5">
      {/* Step 1: barcode lookup. */}
      <form onSubmit={lookup} className="flex items-end gap-2">
        <div className="min-w-0 flex-1">
          <TextField id="staff-barcode" label={t('contribute.barcode')} inputMode="numeric" value={barcode} onChange={(e) => { setBarcode(e.target.value); setMode(null) }} required />
        </div>
        <button type="submit" disabled={busy || barcode.trim() === ''} className="h-12 rounded-pill bg-navy px-5 text-label font-bold text-white disabled:opacity-60">
          {t('staff.lookup')}
        </button>
      </form>

      {message && (
        <p role="status" className="rounded-md border border-line bg-verified-soft p-3 text-label font-normal text-verified-ink">
          {message}
        </p>
      )}
      {first('barcode') && <p role="alert" className="text-caption text-unknown">{first('barcode')}</p>}

      {/* Step 2: the form. */}
      {mode && (
        <form onSubmit={save} noValidate className="flex flex-col gap-4">
          <p className="text-label font-bold text-navy">{mode === 'new' ? t('staff.addingNew') : t('staff.editing', { source: loaded?.source })}</p>
          <TextField id="p-name" label={t('contribute.name')} value={form.name} onChange={set('name')} error={first('name')} />
          <TextField id="p-brand" label={t('contribute.brand')} value={form.brand} onChange={set('brand')} error={first('brand')} />
          <div className="flex flex-col gap-2">
            <label htmlFor="p-category" className="text-label text-muted">{t('contribute.category')}</label>
            <select id="p-category" value={form.category} onChange={set('category')} className={`h-12 ${FIELD}`}>
              <option value="">{t('contribute.noChoice')}</option>
              {categories.data?.map((c) => (
                <optgroup key={c.id} label={ms ? c.name_ms : c.name_en}>
                  {c.children?.map((s) => (
                    <option key={s.id} value={s.slug}>{ms ? s.name_ms : s.name_en}</option>
                  ))}
                </optgroup>
              ))}
            </select>
            {first('category') && <p role="alert" className="text-caption text-unknown">{first('category')}</p>}
          </div>
          <TextField id="p-maker" label={t('contribute.manufacturer')} value={form.manufacturer} onChange={set('manufacturer')} error={first('manufacturer')} />
          <div className="flex flex-col gap-2">
            <label htmlFor="p-state" className="text-label text-muted">{t('contribute.state')}</label>
            <select id="p-state" value={form.state} onChange={set('state')} className={`h-12 ${FIELD}`}>
              <option value="">{t('contribute.noChoice')}</option>
              {MALAYSIAN_STATES.map((s) => <option key={s} value={s}>{s}</option>)}
            </select>
            {first('state') && <p role="alert" className="text-caption text-unknown">{first('state')}</p>}
          </div>
          <div className="flex flex-col gap-2">
            <label htmlFor="p-halal" className="text-label text-muted">{t('contribute.halal')}</label>
            <select id="p-halal" value={form.halal} onChange={set('halal')} className={`h-12 ${FIELD}`}>
              <option value="unknown">{t('result.halalUnknown')}</option>
              <option value="yes">{t('result.halalYes')}</option>
              <option value="no">{t('result.halalNo')}</option>
            </select>
          </div>
          <TextField id="p-qty" label={t('contribute.quantity')} value={form.quantity} onChange={set('quantity')} error={first('quantity')} />
          <TextField id="p-img" label={t('contribute.imageUrl')} type="url" value={form.image_url} onChange={set('image_url')} error={first('image_url')} />

          {/* Origin status: limited by role; locked when an admin set it and you are not an admin. */}
          <div className="flex flex-col gap-2">
            <label htmlFor="p-status" className="text-label text-muted">{t('staff.setStatus')}</label>
            <select id="p-status" value={form.origin_status} onChange={set('origin_status')} disabled={statusLocked} className={`h-12 ${FIELD} disabled:opacity-60`}>
              {/* Keep the current value visible even when this role could not choose it. */}
              {(allowed.includes(form.origin_status) ? allowed : [form.origin_status, ...allowed]).map((a) => (
                <option key={a} value={a} disabled={!allowed.includes(a)}>{t(`staff.statusNames.${a}`)}</option>
              ))}
            </select>
            {statusLocked && <p className="text-caption font-normal text-muted">{t('staff.statusLocked')}</p>}
            {first('origin_status') && <p role="alert" className="text-caption text-unknown">{first('origin_status')}</p>}
          </div>
          <div className="flex flex-col gap-2">
            <label htmlFor="p-note" className="text-label text-muted">{needsReason ? t('staff.evidence') : t('staff.reviewNote')}</label>
            <textarea id="p-note" rows={3} maxLength={500} value={form.origin_note} onChange={set('origin_note')} className={`py-3 ${FIELD}`} />
            {first('origin_note') && <p role="alert" className="text-caption text-unknown">{first('origin_note')}</p>}
          </div>

          <button type="submit" disabled={busy} className="h-12 rounded-pill bg-navy text-[15px] font-bold text-white disabled:opacity-60">
            {mode === 'new' ? t('staff.add') : t('staff.save')}
          </button>
        </form>
      )}
    </div>
  )
}
