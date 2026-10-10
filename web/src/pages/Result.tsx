// Chevron for the back button and share icon.
import { ChevronLeft, Share } from 'lucide-react'
// Data fetching with caching.
import { useQuery } from '@tanstack/react-query'
// React hooks.
import { useEffect, useRef, useState } from 'react'
// Hook for translated text.
import { useTranslation } from 'react-i18next'
// Router helpers: params from the URL, links, navigation, and the current location.
import { Link, useLocation, useNavigate, useParams } from 'react-router-dom'
// API call and the error type that carries the HTTP status.
import { ApiError, fetchProduct, logScan } from '../api'
import AlternativeCard from '../components/AlternativeCard'
import ConfidenceBar from '../components/ConfidenceBar'
import EvidenceRow from '../components/EvidenceRow'
import { VARIANT, type Variant } from '../status'
import VerdictHero from '../components/VerdictHero'
// Remember the product in the recent-scans list once we know its name and status.
import { addRecentScan } from '../recentScans'

// How many of the 3 confidence segments are filled for each look (from the design file).
const CONFIDENCE: Record<Variant, 1 | 2 | 3> = { verified: 3, likely: 2, unknown: 1, foreign: 3 }
// Which "alternatives" heading each look uses.
const ALT_TITLE: Record<Variant, string> = { verified: 'similar', likely: 'similar', unknown: 'category', foreign: 'foreign' }

// Display names for the open-data sources we import from (products.source values).
const SOURCE_NAME: Record<string, string> = { off: 'Open Food Facts', obf: 'Open Beauty Facts', opf: 'Open Products Facts' }

// Result screen (design/screens/3-mobile-result.html), route /p/:barcode.
export default function Result() {
  // Translate function and the current language.
  const { t, i18n } = useTranslation()
  // The barcode from the URL.
  const { barcode = '' } = useParams()
  // Used to go back in history.
  const navigate = useNavigate()
  // location.key is "default" when this is the first page the visitor opened (nothing to go back to).
  const location = useLocation()
  // Briefly true after the link was copied (when the browser has no share sheet).
  const [copied, setCopied] = useState(false)

  // Load the product; don't retry a 404 because "not found" is a real answer, not a glitch.
  const { data: product, error, isPending } = useQuery({
    queryKey: ['product', barcode],
    queryFn: () => fetchProduct(barcode),
    retry: (count, err) => !(err instanceof ApiError && err.status === 404) && count < 2,
  })

  // Once the product has loaded, save its name and status in the recent-scans list.
  useEffect(() => {
    // Nothing to save yet.
    if (!product?.barcode) return
    // Store (or update) the entry.
    addRecentScan({ barcode: product.barcode, name: product.name, origin_status: product.origin_status })
  }, [product])

  // True when we arrived here from the scan screen (set by Scan.tsx via router state).
  const scanned = (location.state as { scanned?: boolean } | null)?.scanned === true
  // Remembers that this visit was already logged (effects can run twice in development).
  const loggedRef = useRef(false)

  // Log the scan once, after the lookup finished (so the product exists in our database by now).
  useEffect(() => {
    // Not from a scan, still loading, or already logged: nothing to do.
    if (!scanned || isPending || loggedRef.current) return
    // Mark as logged before sending, so a second run of this effect can't send it again.
    loggedRef.current = true
    // Fire and forget: if logging fails the visitor should not notice.
    logScan(barcode).catch(() => {})
    // Clear the flag from history so a reload or "back" to this page doesn't count again.
    navigate(location.pathname, { replace: true, state: null })
  }, [scanned, isPending, barcode, navigate, location.pathname])

  // Go back if there is history, otherwise to Home.
  const goBack = () => (location.key === 'default' ? navigate('/') : navigate(-1))

  // Share the page: native share sheet when available, otherwise copy the link.
  const share = async () => {
    // The data to share.
    const data = { title: product?.name ?? 'MakaKami', url: window.location.href }
    // Sharing/copying can fail or be cancelled by the user; that's fine, so ignore errors.
    try {
      // Native sheet on phones.
      if (navigator.share) await navigator.share(data)
      else {
        // Desktop fallback: copy the URL.
        await navigator.clipboard.writeText(data.url)
        // Show "Pautan disalin" for two seconds.
        setCopied(true)
        setTimeout(() => setCopied(false), 2000)
      }
    } catch {
      // Cancelled or blocked: nothing to do.
    }
  }

  // True when showing Malay names.
  const ms = i18n.language === 'ms'
  // Helper to pick the right language for a name pair.
  const pick = (c: { name_ms: string; name_en: string }) => (ms ? c.name_ms : c.name_en)

  // Header shared by every state (loading, error, not found, product).
  const header = (
    // Back, title, share; 20px top and 12px bottom padding as in the design.
    <header className="flex items-center justify-between px-4 pt-5 pb-3">
      {/* Back button: 44px circle with a border. */}
      <button type="button" onClick={goBack} aria-label={t('result.back')} className="flex size-11 items-center justify-center rounded-pill border border-line bg-surface">
        {/* Left chevron. */}
        <ChevronLeft size={22} strokeWidth={2} aria-hidden="true" />
      </button>
      {/* Screen title. */}
      <div className="text-heading">{t('result.title')}</div>
      {/* Share button: same size as back so the title stays centred. */}
      <button type="button" onClick={share} aria-label={t('result.share')} className="flex size-11 items-center justify-center rounded-pill border border-line bg-surface">
        {/* Share arrow. */}
        <Share size={20} strokeWidth={2} aria-hidden="true" />
      </button>
    </header>
  )

  // Wrapper: full-screen scrolling layer above the tab bar on phones, normal flow on desktop (lg:).
  const wrap = (body: React.ReactNode) => (
    <div className="fixed inset-0 z-20 overflow-y-auto bg-ground lg:static lg:overflow-visible">
      {/* Content column. */}
      <div className="mx-auto max-w-xl">
        {header}
        {/* Polite announcement for screen readers when the link was copied. */}
        <div role="status" className="px-4 text-center text-caption text-muted">
          {copied && t('result.linkCopied')}
        </div>
        {body}
      </div>
    </div>
  )

  // Loading state.
  if (isPending) return wrap(<p className="px-4 text-muted">{t('loading')}</p>)

  // Product not found (404): say so and offer to scan again.
  if (error instanceof ApiError && error.status === 404) {
    return wrap(
      <div className="flex flex-col gap-4 px-4 pb-8">
        {/* Explanation card. */}
        <section className="flex flex-col gap-2 rounded-md border border-line bg-surface p-5">
          {/* Heading (the page's h1 in this state). */}
          <h1 className="text-title">{t('result.notFoundTitle')}</h1>
          {/* Body text with the barcode filled in. */}
          <p className="text-body text-muted">{t('result.notFoundBody', { barcode })}</p>
        </section>
        {/* Back to the scanner. */}
        <Link to="/scan" className="flex h-12 items-center justify-center rounded-pill bg-navy text-[14px] font-bold text-white">
          {t('result.scanAgain')}
        </Link>
      </div>,
    )
  }

  // Any other failure (network down, server error).
  if (error || !product) return wrap(<p className="px-4 text-muted">{t('error')}</p>)

  // Which of the four looks this product uses.
  const { variant } = VARIANT[product.origin_status]
  // Manufacturer country name in the current language, e.g. "Malaysia".
  const country = product.manufacturer ? new Intl.DisplayNames([i18n.language], { type: 'region' }).of(product.manufacturer.country) : undefined
  // Text for the halal row.
  const halalText = product.halal === true ? t('result.halalYes') : product.halal === false ? t('result.halalNo') : t('result.halalUnknown')
  // Button after the product card: "Imbas lagi" and "Lihat alternatif" work today; the others need login (Phase 3).
  const ctaClass = 'flex h-12 flex-1 items-center justify-center rounded-pill text-[14px] font-bold'

  return wrap(
    // Content area: 16px sides, 16px between blocks.
    <div className="flex flex-col gap-4 px-4 pb-8">
      {/* Big verdict card. */}
      <VerdictHero status={product.origin_status} />

      {/* Product card: photo, name, brand, barcode, category. */}
      <section className="flex gap-3.5 rounded-md border border-line bg-surface p-4">
        {/* 96px photo box (real image if present, else placeholder). */}
        {product.image_url ? (
          <img src={product.image_url} alt="" className="size-24 shrink-0 rounded-md bg-placeholder object-cover" />
        ) : (
          <div aria-hidden="true" className="size-24 shrink-0 rounded-md bg-placeholder" />
        )}
        {/* Text column; min-w-0 lets long names wrap inside the card. */}
        <div className="flex min-w-0 flex-col gap-1">
          {/* Product name: the page's h1. */}
          <h1 className="text-[20px] leading-[26px] font-bold">{product.name}</h1>
          {/* Brand and pack size, joined with a dot, e.g. "Brand · 150 g" (either may be missing). */}
          {(product.brand || product.quantity) && (
            <div className="text-[14px] text-muted">{[product.brand?.name, product.quantity].filter(Boolean).join(' · ')}</div>
          )}
          {/* Barcode, letter-spaced. */}
          {product.barcode && <div className="text-caption font-normal tracking-[0.04em] text-muted">{product.barcode}</div>}
          {/* Category chip "Parent › Child". */}
          {product.category && (
            <span className="mt-1 self-start rounded-pill border border-line bg-ground px-2.5 py-1 text-caption font-semibold text-ink">
              {product.category.parent ? `${pick(product.category.parent)} › ` : ''}
              {pick(product.category)}
            </span>
          )}
        </div>
      </section>

      {/* How sure we are. */}
      <ConfidenceBar level={CONFIDENCE[variant]} variant={variant} />

      {/* Evidence card: heading, then one row per piece of evidence we actually have. */}
      <section className="flex flex-col rounded-md border border-line bg-surface">
        {/* Card heading. */}
        <h2 className="px-4 pt-4 pb-2 text-heading">{t('result.evidence')}</h2>
        {/* Admin-approved label photo. */}
        {product.approved_evidence_count > 0 && <EvidenceRow tone="positive" title={t('result.labelChecked')}>{t('result.labelCheckedSub')}</EvidenceRow>}
        {/* Manufacturer and where it is; the tick only shows for Malaysian manufacturers. */}
        {product.manufacturer && (
          <EvidenceRow tone={product.manufacturer.country === 'MY' ? 'positive' : 'neutral'} title={t('result.manufacturer', { name: product.manufacturer.name })}>
            {[product.manufacturer.state, country].filter(Boolean).join(', ')}
          </EvidenceRow>
        )}
        {/* Where open data says it is made; ticked only when that makes the product "likely Malaysian". */}
        {product.manufacturing_places && (
          <EvidenceRow tone={product.origin_status === 'likely_my' ? 'positive' : 'neutral'} title={t('result.madeIn', { place: product.manufacturing_places })}>
            {t('result.madeInSub')}
          </EvidenceRow>
        )}
        {/* GS1 Malaysia barcode prefix. */}
        {product.barcode?.startsWith('955') && <EvidenceRow tone="positive" title={t('result.prefix955')}>{t('result.prefix955Sub')}</EvidenceRow>}
        {/* Halal status with a link to the official portal. */}
        <EvidenceRow tone="neutral" title={t('result.halal', { status: halalText })}>
          {/* Opens JAKIM in a new tab; noopener stops the new page controlling this one. */}
          <a href="https://www.halal.gov.my" target="_blank" rel="noopener noreferrer" className="font-bold text-navy">
            {t('result.jakim')}
          </a>
        </EvidenceRow>
      </section>

      {/* Attribution required by the Open Food Facts licence (ODbL): name the source and link to the product page there. */}
      {product.source_url && SOURCE_NAME[product.source] && (
        <p className="text-caption font-normal text-muted">
          {t('result.sourcePrefix')}{' '}
          {/* Opens in a new tab; noopener stops the new page controlling this one. */}
          <a href={product.source_url} target="_blank" rel="noopener noreferrer" className="font-bold text-navy">
            {SOURCE_NAME[product.source]}
          </a>{' '}
          (ODbL)
        </p>
      )}

      {/* Alternatives, only if there are any; id lets the "see alternatives" button scroll here. */}
      {product.alternatives.length > 0 && (
        <section id="alternatif" className="flex flex-col gap-3">
          {/* Heading depends on the verdict. */}
          <h2 className="text-heading">{t(`result.alt.${ALT_TITLE[variant]}`)}</h2>
          {/* Two columns. */}
          <div className="grid grid-cols-2 gap-3">
            {product.alternatives.map((a) => (
              <AlternativeCard key={a.id} product={a} />
            ))}
          </div>
        </section>
      )}

      {/* Action buttons. */}
      <div className="flex gap-3">
        {/* Reporting needs a login (Phase 3), so it is shown but disabled for now. */}
        <button type="button" disabled title={t('comingSoon')} className={`${ctaClass} border border-line bg-surface text-ink opacity-60`}>
          {t('result.report')}
        </button>
        {/* Main action depends on the verdict. */}
        {variant === 'verified' && (
          // Scan another product.
          <Link to="/scan" className={`${ctaClass} bg-navy text-white`}>
            {t('result.cta.verified')}
          </Link>
        )}
        {variant === 'foreign' && (
          // Jump to the alternatives (or go scan again if there are none to show).
          <a href={product.alternatives.length > 0 ? '#alternatif' : '/scan'} className={`${ctaClass} bg-navy text-white`}>
            {t('result.cta.foreign')}
          </a>
        )}
        {(variant === 'likely' || variant === 'unknown') && (
          // Helping verify needs a login and photo upload (Phase 3): shown but disabled for now.
          <button type="button" disabled title={t('comingSoon')} className={`${ctaClass} bg-navy text-white opacity-60`}>
            {t(`result.cta.${variant}`)}
          </button>
        )}
      </div>
    </div>,
  )
}
