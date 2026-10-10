// Icons: close (X) and torch (flashlight).
import { Flashlight, X } from 'lucide-react'
// React state hook.
import { lazy, Suspense, useState } from 'react'
// Hook for translated text.
import { useTranslation } from 'react-i18next'
import { usePageMeta } from '../usePageMeta'
// Link for the close button; useNavigate to jump to the result page.
import { Link, useNavigate } from 'react-router-dom'
// Shared origin badge.
import StatusBadge from '../components/StatusBadge'
// Remembered scans in localStorage.
import { addRecentScan, getRecentScans } from '../recentScans'
// Camera + barcode decoding.
import { useBarcodeScanner } from '../useBarcodeScanner'

// Showcase only (replaced at build time, so a normal build drops it): quick buttons for the dummy products.
const DemoSamples = import.meta.env.VITE_DEMO === 'true' ? lazy(() => import('../demo/DemoSamples')) : null

// Product barcodes (EAN-8 up to GTIN-14) are 8 to 14 digits.
const BARCODE_PATTERN = /^\d{8,14}$/

// Scan screen (design/screens/2-mobile-scan.html): full-screen camera with a manual-entry sheet.
export default function Scan() {
  // Translate function.
  const { t } = useTranslation()
  // Browser tab title (and "noindex" where the page must stay out of search engines).
  usePageMeta(t('scan.title'))
  // Function to change route.
  const navigate = useNavigate()
  // Message shown under the manual input when the typed code is invalid ('' = no error).
  const [error, setError] = useState('')
  // Recent scans read once when the page opens.
  const [recent] = useState(getRecentScans)

  // Common path for both a camera hit and a typed code: remember it, then open the product page.
  const openProduct = (barcode: string) => {
    // Save to the recent list (moves it to the top if already there).
    addRecentScan({ barcode })
    // Result page route from DESIGN.md. The state flag tells the result page this was a real scan, so it logs it once
    // (just opening a product link, or reloading, must not count as a scan).
    navigate(`/p/${barcode}`, { state: { scanned: true } })
  }

  // Start the camera; openProduct runs when a barcode is read.
  const { videoRef, status, torchSupported, torchOn, toggleTorch } = useBarcodeScanner(openProduct)

  return (
    // Full-screen layer above the tab bar (z-20 beats the tab bar's z-10); dark background behind the camera.
    <div className="fixed inset-0 z-20 flex flex-col overflow-hidden bg-ink text-white">
      {/* Live camera picture, stretched to cover the whole screen behind everything else. */}
      <video ref={videoRef} playsInline muted className="absolute inset-0 size-full object-cover" />

      {/* Top bar: close, title, torch. Sits above the video. */}
      <header className="relative flex items-center justify-between px-4 pt-5">
        {/* Close button: 44px circle, back to Home. */}
        <Link to="/" aria-label={t('scan.close')} className="flex size-11 items-center justify-center rounded-pill bg-ink">
          {/* White X. */}
          <X size={22} strokeWidth={2} aria-hidden="true" />
        </Link>
        {/* Screen title. */}
        <h1 className="text-heading">{t('scan.title')}</h1>
        {/* Torch button: yellow icon on dark circle; disabled and dimmed when the camera has no torch. */}
        <button
          type="button"
          onClick={toggleTorch}
          disabled={!torchSupported}
          // Tells screen readers whether the torch is currently on.
          aria-pressed={torchOn}
          aria-label={t('scan.torch')}
          className={`flex size-11 items-center justify-center rounded-pill bg-ink ${torchSupported ? '' : 'opacity-40'}`}
        >
          {/* Yellow icon; filled shape while lit so the state isn't shown by colour alone. */}
          <Flashlight size={22} strokeWidth={2} className={`text-yellow ${torchOn ? 'fill-yellow' : ''}`} aria-hidden="true" />
        </button>
      </header>

      {/* Middle area: viewfinder and hints, centred in the space above the sheet. */}
      <div className="relative flex min-h-0 flex-1 flex-col items-center justify-center gap-5">
        {/* Yellow corner brackets plus a scan line, drawn exactly as in the design. */}
        <svg width="290" height="190" viewBox="0 0 290 190" fill="none" strokeLinecap="round" aria-hidden="true" className="stroke-yellow" strokeWidth="5">
          {/* Top-left and top-right corners. */}
          <path d="M3 36V14A11 11 0 0 1 14 3h22" />
          <path d="M254 3h22a11 11 0 0 1 11 11v22" />
          {/* Bottom-right and bottom-left corners. */}
          <path d="M287 154v22a11 11 0 0 1-11 11h-22" />
          <path d="M36 187H14A11 11 0 0 1 3 176v-22" />
          {/* Horizontal scan line through the middle (thinner stroke). */}
          <path d="M28 95h234" strokeWidth="2.5" opacity="0.9" />
        </svg>
        {/* Text under the box; role=status so screen readers announce camera problems. */}
        <div role="status" className="flex flex-col items-center gap-1 px-6 text-center">
          {/* Camera problem: show the explanation instead of the normal hints. */}
          {status === 'denied' || status === 'unsupported' ? (
            // Message for denied permission or no camera support.
            <p className="text-body font-semibold">{t(status === 'denied' ? 'scan.cameraDenied' : 'scan.cameraUnsupported')}</p>
          ) : (
            // Normal hints.
            <>
              {/* Main hint. */}
              <p className="text-body font-semibold">{t('scan.hint')}</p>
              {/* Secondary hint, slightly dimmer. */}
              <p className="text-label font-normal text-white/75">{t('scan.hintAuto')}</p>
            </>
          )}
        </div>
      </div>

      {/* Bottom sheet: white, rounded top corners, holds manual entry and recent scans. */}
      <section className="relative flex flex-col gap-4 rounded-t-[24px] bg-surface px-4 pt-5 pb-8 text-ink">
        {/* Decorative drag handle. */}
        <div className="h-1 w-10 self-center rounded-pill bg-line" />
        {/* Manual barcode entry as a real form so Enter submits. */}
        <form
          // Stop the page reload and validate the code.
          onSubmit={(e) => {
            // Don't let the browser submit the form itself.
            e.preventDefault()
            // Read the typed code and remove spaces.
            const code = String(new FormData(e.currentTarget).get('kod') ?? '').replace(/\s/g, '')
            // Reject anything that isn't 8-14 digits and explain why.
            if (!BARCODE_PATTERN.test(code)) {
              // Show the error message below the input.
              setError(t('scan.invalid'))
              // Stop here.
              return
            }
            // Valid: clear any old error and open the product.
            setError('')
            openProduct(code)
          }}
          className="flex flex-col gap-2"
          // Skip the browser's own validation bubble; we show our own message.
          noValidate
        >
          {/* Label tied to the input by htmlFor/id. */}
          <label htmlFor="kod" className="text-body font-bold">
            {t('scan.manualLabel')}
          </label>
          {/* Input and button side by side. */}
          <div className="flex gap-2">
            {/* Numeric keyboard on phones; ties to the error message for screen readers when invalid. */}
            <input
              id="kod"
              name="kod"
              inputMode="numeric"
              placeholder={t('scan.manualPlaceholder')}
              aria-invalid={error !== ''}
              aria-describedby={error ? 'kod-error' : undefined}
              className="h-12 min-w-0 flex-1 rounded-sm border border-line px-3.5 text-[16px] tracking-[0.04em] text-ink"
            />
            {/* Submit button: navy pill. */}
            <button type="submit" className="h-12 rounded-pill bg-navy px-5 text-body font-bold text-white">
              {t('scan.check')}
            </button>
          </div>
          {/* Validation message, only when there is one. */}
          {error && (
            <p id="kod-error" role="alert" className="text-caption text-unknown">
              {error}
            </p>
          )}
        </form>

        {/* Showcase only: pick a dummy product to "scan". */}
        {DemoSamples && (
          <Suspense fallback={null}>
            <DemoSamples onPick={openProduct} />
          </Suspense>
        )}

        {/* Recent scans. */}
        <div className="flex flex-col gap-2">
          {/* Section label. */}
          <div className="text-label text-muted">{t('scan.recent')}</div>
          {/* Empty state. */}
          {recent.length === 0 && <p className="text-caption font-normal text-muted">{t('scan.noRecent')}</p>}
          {/* One row per remembered scan. */}
          {recent.map((s) => (
            <Link key={s.barcode} to={`/p/${s.barcode}`} className="flex items-center gap-3 rounded-md border border-line px-3 py-2.5 text-ink">
              {/* 40px placeholder box (no image stored for scans). */}
              <span aria-hidden="true" className="size-10 shrink-0 rounded-sm bg-placeholder" />
              {/* Name if known, otherwise the barcode itself. */}
              <span className="min-w-0 flex-1 truncate text-[14px] font-semibold">{s.name ?? s.barcode}</span>
              {/* Badge only when we know the status. */}
              {s.origin_status && <StatusBadge status={s.origin_status} short />}
            </Link>
          ))}
        </div>

        {/* Notice at the point of collection: scans are logged anonymously, with a link to the full policy. */}
        <p className="text-caption font-normal text-muted">
          {t('legal.scanNotice')}{' '}
          {/* Link to the Privacy Policy. */}
          <Link to="/privasi" className="font-semibold text-navy">
            {t('legal.privacy')}
          </Link>
        </p>
      </section>
    </div>
  )
}
