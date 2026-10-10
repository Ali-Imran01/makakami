// Which page we are on.
import { useLocation } from 'react-router-dom'
import LegalLinks from './LegalLinks'

// Pages that have their own footer or are full-screen overlays, so the shared footer is not shown there.
const NO_FOOTER = (path: string) => path === '/' || path === '/scan' || path.startsWith('/p/')

// The footer at the bottom of ordinary pages: Terms, Privacy Policy, About and the open-data credit.
// It carries the bottom padding that keeps it clear of the phone tab bar.
export default function SiteFooter() {
  const { pathname } = useLocation()
  if (NO_FOOTER(pathname)) return null

  return (
    <div className="mx-auto max-w-5xl px-4 pt-4 pb-28 lg:pb-10">
      <LegalLinks />
    </div>
  )
}
