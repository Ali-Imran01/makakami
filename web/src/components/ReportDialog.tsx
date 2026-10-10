// React hooks.
import { useEffect, useRef, useState, type FormEvent } from 'react'
// Hook for translated text.
import { useTranslation } from 'react-i18next'
import { ApiError } from '../api'
import { createReport } from '../authApi'

// The kinds of mistake a person can pick (same list the server accepts).
const TYPES = ['wrong_origin', 'wrong_name', 'wrong_photo', 'wrong_category', 'other'] as const

// Props: which product, the login token, and whether the dialog is open.
interface Props {
  barcode: string
  token: string
  open: boolean
  onClose: () => void
}

// "Laporkan salah": a small dialog (native <dialog>: focus trap, Escape and backdrop come for free) where a signed-in person
// says what is wrong with a product. Nothing changes until staff read it.
export default function ReportDialog({ barcode, token, open, onClose }: Props) {
  const { t } = useTranslation()
  const ref = useRef<HTMLDialogElement>(null)
  const [type, setType] = useState<(typeof TYPES)[number]>('wrong_origin')
  const [note, setNote] = useState('')
  const [busy, setBusy] = useState(false)
  const [sent, setSent] = useState(false)
  const [error, setError] = useState('')

  // Open or close the dialog whenever `open` changes.
  useEffect(() => {
    const dialog = ref.current
    if (!dialog) return
    if (open && !dialog.open) dialog.showModal()
    if (!open && dialog.open) dialog.close()
  }, [open])

  const send = async (e: FormEvent) => {
    e.preventDefault()
    setError('')
    setBusy(true)
    try {
      await createReport(token, { barcode, type, note })
      setSent(true)
      setNote('')
    } catch (err) {
      if (err instanceof ApiError && err.status === 422) setError(Object.values(err.fieldErrors).flat()[0] ?? t('error'))
      else if (err instanceof ApiError && err.status === 403) setError(t('report.verifyFirst'))
      else if (err instanceof ApiError && err.status === 429) setError(t('auth.tooMany'))
      else setError(t('error'))
    } finally {
      setBusy(false)
    }
  }

  return (
    <dialog
      ref={ref}
      onClose={() => {
        // Closing resets the "sent" message so the next report starts fresh.
        setSent(false)
        setError('')
        onClose()
      }}
      onClick={(e) => e.target === e.currentTarget && onClose()}
      aria-labelledby="report-title"
      className="m-auto w-[calc(100%-2rem)] max-w-md rounded-md bg-surface p-0 text-ink backdrop:bg-ink/50"
    >
      <div className="flex flex-col gap-4 p-5">
        <h2 id="report-title" className="text-heading">
          {t('report.title')}
        </h2>

        {sent ? (
          <>
            <p role="status" className="rounded-md bg-verified-soft p-3 text-label font-normal text-verified-ink">
              {t('report.thanks')}
            </p>
            <button type="button" onClick={onClose} className="h-12 rounded-pill bg-navy text-[15px] font-bold text-white">
              {t('report.close')}
            </button>
          </>
        ) : (
          <form onSubmit={send} className="flex flex-col gap-3">
            <label className="flex flex-col gap-2 text-label text-muted">
              {t('report.type')}
              <select value={type} onChange={(e) => setType(e.target.value as (typeof TYPES)[number])} className="h-12 rounded-sm border border-line bg-surface px-3.5 text-body font-normal text-ink">
                {TYPES.map((x) => (
                  <option key={x} value={x}>
                    {t(`report.types.${x}`)}
                  </option>
                ))}
              </select>
            </label>
            <label className="flex flex-col gap-2 text-label text-muted">
              {t('report.note')}
              <textarea rows={3} maxLength={500} value={note} onChange={(e) => setNote(e.target.value)} className="rounded-sm border border-line bg-surface px-3.5 py-3 text-body font-normal text-ink" />
            </label>
            <p className="text-caption font-normal text-muted">{t('report.noteHelp')}</p>
            {error && (
              <p role="alert" className="text-label font-normal text-unknown">
                {error}
              </p>
            )}
            <div className="flex gap-3">
              <button type="submit" disabled={busy} className="h-12 flex-1 rounded-pill bg-navy text-[15px] font-bold text-white disabled:opacity-60">
                {t('report.submit')}
              </button>
              <button type="button" onClick={onClose} className="h-12 rounded-pill border border-line bg-surface px-5 text-[15px] font-bold text-ink">
                {t('report.cancel')}
              </button>
            </div>
          </form>
        )}
      </div>
    </dialog>
  )
}
