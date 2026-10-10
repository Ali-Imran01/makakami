// Fetches API data and caches it.
import { useQuery } from '@tanstack/react-query'
// Icons: barcode scanner and upload arrow.
import { ScanBarcode, Upload } from 'lucide-react'
// React hooks.
import { useEffect, useRef, useState } from 'react'
// Hook for translated text and the current language.
import { useTranslation } from 'react-i18next'
// Router helpers.
import { Link, useLocation, useNavigate } from 'react-router-dom'
// API calls.
import { fetchCategories, fetchRecentProducts } from '../api'
import CategoryTile from '../components/CategoryTile'
import StatusBadge from '../components/StatusBadge'
import VerdictHero from '../components/VerdictHero'
// Remember the scanned barcode in the recent list.
import { addRecentScan } from '../recentScans'

// Heading style shared by every section (28px, extra bold).
const H2 = 'text-[28px] font-extrabold'

// The home page for wide screens (lg and up), from design/screens/6-web-home.html.
export default function HomeWeb() {
  // Translate function and the current language.
  const { t, i18n } = useTranslation()
  // Function to change route.
  const navigate = useNavigate()
  // The URL hash (e.g. "#cara") so the "How it works" nav link can scroll to its section.
  const { hash } = useLocation()
  // Handle on the hidden file input behind the upload button.
  const fileRef = useRef<HTMLInputElement>(null)
  // Error text shown under the buttons when a photo has no readable barcode.
  const [uploadError, setUploadError] = useState('')
  // True while a photo is being read.
  const [reading, setReading] = useState(false)
  // True when showing Malay names.
  const ms = i18n.language === 'ms'

  // Data (cached, shared with the phone Home page).
  const categories = useQuery({ queryKey: ['categories'], queryFn: fetchCategories })
  const recent = useQuery({ queryKey: ['products', 'recent'], queryFn: fetchRecentProducts })
  // A confirmed product to use in the example result card (none until the database has one).
  const sample = recent.data?.find((p) => p.origin_status === 'verified_my')

  // Scroll to the section named in the URL hash when the page opens or the hash changes.
  useEffect(() => {
    // No hash: nothing to scroll to.
    if (!hash) return
    // Find the element with that id and bring it into view.
    document.getElementById(hash.slice(1))?.scrollIntoView()
  }, [hash])

  // Read a barcode from the chosen photo, then open its result page.
  const onPhoto = async (file: File | undefined) => {
    // The visitor cancelled the file picker.
    if (!file) return
    // Clear any old error and show the busy state.
    setUploadError('')
    setReading(true)
    // Load the decoder only now, so the ZXing library isn't downloaded unless this button is used.
    const { decodeBarcodeFromFile } = await import('../barcodeFromImage')
    // Try to read the barcode.
    const code = await decodeBarcodeFromFile(file)
    // Done reading.
    setReading(false)
    // Reset the input so choosing the same file again still triggers onChange.
    if (fileRef.current) fileRef.current.value = ''
    // No barcode found: tell the visitor.
    if (!code) {
      setUploadError(t('web.uploadFail'))
      return
    }
    // Same path as a camera scan: remember it and open the result (flagged so it is counted once).
    addRecentScan({ barcode: code })
    navigate(`/p/${code}`, { state: { scanned: true } })
  }

  return (
    // Everything on this page; the page background comes from the body style.
    <div>
      {/* ===== Hero ===== */}
      <section className="mx-auto flex max-w-[1200px] flex-wrap items-center gap-12 px-6 pt-16 pb-14">
        {/* Left: pitch and buttons. */}
        <div className="flex flex-[1_1_460px] flex-col gap-5">
          {/* Small pill above the heading. */}
          <span className="self-start rounded-pill bg-navy-soft px-3 py-1.5 text-label font-bold text-navy">{t('web.badge')}</span>
          {/* The page's h1. */}
          <h1 className="text-[52px] leading-[1.05] font-extrabold tracking-[-0.025em]">
            {t('web.headline1')} <span className="text-navy">{t('web.headline2')}</span>
          </h1>
          {/* Short explanation. */}
          <p className="max-w-[520px] text-[18px] leading-7 font-normal text-muted">{t('web.lead')}</p>
          {/* Two buttons: scan with camera, or upload a photo of a barcode. */}
          <div className="flex flex-wrap gap-3">
            {/* Camera scan. */}
            <Link to="/scan" className="flex h-[52px] items-center gap-2.5 rounded-pill bg-navy px-6 text-[16px] font-bold text-white">
              <ScanBarcode size={22} strokeWidth={2} className="text-yellow" aria-hidden="true" />
              {t('web.scanCta')}
            </Link>
            {/* Photo upload: the visible button opens the hidden file picker. */}
            <button
              type="button"
              disabled={reading}
              onClick={() => fileRef.current?.click()}
              className="flex h-[52px] items-center gap-2.5 rounded-pill border border-line bg-surface px-[22px] text-[16px] font-bold text-ink disabled:opacity-60"
            >
              <Upload size={20} strokeWidth={2} aria-hidden="true" />
              {t('web.uploadCta')}
            </button>
            {/* The real file input, hidden; images only (phones also offer the camera). */}
            <input ref={fileRef} type="file" accept="image/*" hidden onChange={(e) => onPhoto(e.target.files?.[0])} />
          </div>
          {/* Hint, or the error if the last photo had no barcode (announced to screen readers). */}
          {uploadError ? (
            <span role="alert" className="text-label font-normal text-unknown">
              {uploadError}
            </span>
          ) : (
            <span className="text-label font-normal text-muted">{t('web.uploadHint')}</span>
          )}
        </div>

        {/* Right: an example of what a result looks like, built from a real confirmed product when we have one. */}
        <div role="group" aria-label={t('web.sampleLabel')} className="mx-auto flex max-w-[440px] flex-[1_1_380px] flex-col gap-3">
          {/* The green verdict card. */}
          <VerdictHero status="verified_my" />
          {/* Product row, only when a confirmed product exists. */}
          {sample && (
            <div className="flex items-center gap-3.5 rounded-md border border-line bg-surface p-3.5">
              {/* Photo or placeholder. */}
              {sample.image_url ? (
                <img src={sample.image_url} alt="" className="size-16 shrink-0 rounded-sm bg-placeholder object-cover" />
              ) : (
                <span aria-hidden="true" className="size-16 shrink-0 rounded-sm bg-placeholder" />
              )}
              {/* Name and "brand · state". */}
              <span className="flex flex-col gap-0.5">
                <span className="text-[16px] font-bold">{sample.name}</span>
                <span className="text-label font-normal text-muted">{[sample.brand?.name, sample.manufacturer?.state].filter(Boolean).join(' · ')}</span>
              </span>
            </div>
          )}
        </div>
      </section>

      {/* ===== How it works (the nav link "Cara ia berfungsi" jumps here) ===== */}
      <section id="cara" className="border-y border-line bg-surface">
        <div className="mx-auto flex max-w-[1200px] flex-col gap-7 px-6 py-14">
          <h2 className={H2}>{t('web.howTitle')}</h2>
          {/* Three step cards. */}
          <div className="grid grid-cols-[repeat(auto-fit,minmax(260px,1fr))] gap-5">
            {(['step1', 'step2', 'step3'] as const).map((s, i) => (
              <div key={s} className="flex flex-col gap-2.5 rounded-md border border-line bg-ground p-6">
                {/* Number disc: yellow digit on navy. */}
                <span className="flex size-10 items-center justify-center rounded-pill bg-navy text-[17px] font-extrabold text-yellow">{i + 1}</span>
                {/* Step title. */}
                <h3 className="text-[18px] font-bold">{t(`web.${s}.t`)}</h3>
                {/* Step explanation. */}
                <p className="text-body font-normal text-muted">{t(`web.${s}.d`)}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ===== Browse categories ===== */}
      <section className="mx-auto flex max-w-[1200px] flex-col gap-5 px-6 pt-14 pb-6">
        <div className="flex flex-wrap items-baseline justify-between gap-2">
          <h2 className={H2}>{t('web.browseTitle')}</h2>
          {/* To the full category list. */}
          <Link to="/kategori" className="text-[14px] font-bold text-navy">
            {t('web.browseAll')}
          </Link>
        </div>
        {/* One tile per category. */}
        <div className="grid grid-cols-[repeat(auto-fill,minmax(170px,1fr))] gap-3">
          {categories.data?.map((c) => (
            <CategoryTile key={c.id} slug={c.slug} variant="wide" label={ms ? c.name_ms : c.name_en} />
          ))}
        </div>
      </section>

      {/* ===== What each badge means ===== */}
      <section className="mx-auto flex max-w-[1200px] flex-col gap-5 px-6 pt-10 pb-16">
        <h2 className={H2}>{t('web.legendTitle')}</h2>
        <div className="grid grid-cols-[repeat(auto-fit,minmax(250px,1fr))] gap-3">
          {/* One card per status; the badge is the shared StatusBadge, so it always matches the rest of the site. */}
          {(['verified_my', 'likely_my', 'unknown', 'foreign'] as const).map((s) => (
            <div key={s} className="flex flex-col gap-2 rounded-md border border-line bg-surface p-[18px]">
              <span className="self-start">
                <StatusBadge status={s} />
              </span>
              <span className="text-[14px] leading-5 font-normal text-muted">{t(`web.legend.${s}`)}</span>
            </div>
          ))}
        </div>
      </section>

      {/* ===== Footer ===== */}
      <footer className="border-t border-line bg-surface">
        <div className="mx-auto flex max-w-[1200px] flex-wrap justify-between gap-4 px-6 py-7 text-label font-normal text-muted">
          {/* Name and tagline. */}
          <span>
            <strong className="font-extrabold text-navy">{t('appName')}</strong> · {t('web.footerTag')}
          </span>
          {/* Open data credit (ODbL asks for this). */}
          <span>
            {t('legal.dataCredit')}{' '}
            {/* External link in a new tab. */}
            <a href="https://world.openfoodfacts.org" target="_blank" rel="noopener noreferrer" className="font-semibold text-navy">
              Open Food Facts
            </a>{' '}
            (ODbL)
          </span>
          {/* Legal links. */}
          <span className="flex gap-4">
            <Link to="/privasi">{t('legal.privacy')}</Link>
            <Link to="/terma">{t('legal.terms')}</Link>
          </span>
        </div>
      </footer>
    </div>
  )
}
