// Icons for the four regular tabs.
import { House, LayoutGrid, Search, User, type LucideIcon } from 'lucide-react'
// Hook for translated labels.
import { useTranslation } from 'react-i18next'
// NavLink knows whether its route is the current one, so we can style the active tab.
import { NavLink } from 'react-router-dom'
// The raised centre button.
import ScanButton from './ScanButton'

// One regular tab: where it goes, its label key and its icon.
interface Tab {
  // Route path.
  to: string
  // Key in the tabs.* translations.
  key: string
  // Icon component.
  Icon: LucideIcon
}

// Left two tabs (before the Scan disc).
const LEFT: Tab[] = [
  // Home; `end` is set below so "/" is only active on exactly "/".
  { to: '/', key: 'home', Icon: House },
  // Category browser.
  { to: '/kategori', key: 'categories', Icon: LayoutGrid },
]

// Right two tabs (after the Scan disc).
const RIGHT: Tab[] = [
  // Search.
  { to: '/cari', key: 'search', Icon: Search },
  // Profile / login.
  { to: '/profil', key: 'profile', Icon: User },
]

// Renders one regular tab link.
function TabLink({ tab }: { tab: Tab }) {
  // Translate function.
  const { t } = useTranslation()
  const { to, key, Icon } = tab

  return (
    // NavLink gives us isActive; `end` stops "/" matching every route.
    <NavLink to={to} end={to === '/'} className="flex flex-col items-center gap-1 pt-2.5 text-[11px]">
      {/* The className callback below can't see isActive, so we use the render-prop children form. */}
      {({ isActive }) => (
        // Fragment: icon then label, both coloured by active state.
        <>
          {/* Active = navy and thicker stroke (2); inactive = muted and stroke 1.75. */}
          <Icon size={24} strokeWidth={isActive ? 2 : 1.75} className={isActive ? 'text-navy' : 'text-muted'} aria-hidden="true" />
          {/* Label: bolder when active. */}
          <span className={isActive ? 'font-bold text-navy' : 'font-semibold text-muted'}>{t(`tabs.${key}`)}</span>
        </>
      )}
    </NavLink>
  )
}

// Bottom navigation for phones. Hidden from the lg breakpoint up, where TopNav takes over.
export default function TabBar() {
  // Translate function.
  const { t } = useTranslation()

  return (
    // <nav> landmark with a spoken name; fixed to the bottom, 84px tall, 5 equal columns.
    <nav
      aria-label={t('tabs.label')}
      className="fixed inset-x-0 bottom-0 z-10 grid h-[84px] grid-cols-5 items-end border-t border-line bg-surface px-2 pb-4 lg:hidden"
    >
      {/* Utama + Kategori. */}
      {LEFT.map((tab) => (
        <TabLink key={tab.to} tab={tab} />
      ))}
      {/* Raised Scan disc in the middle column. */}
      <ScanButton variant="tab" />
      {/* Cari + Profil. */}
      {RIGHT.map((tab) => (
        <TabLink key={tab.to} tab={tab} />
      ))}
    </nav>
  )
}
