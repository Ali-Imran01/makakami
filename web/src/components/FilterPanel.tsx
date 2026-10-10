// Hook for translated text.
import { useTranslation } from 'react-i18next'
// Category type for the subcategory list.
import type { Category } from '../api'
// Filter values and the options we offer.
import { DEFAULT_STATUS, STATUS_OPTIONS, type Filters } from '../catalogueParams'

// Props: current filters, a way to change them, and the choices available in this category.
interface Props {
  // Current filter values.
  filters: Filters
  // Called with the fields that changed.
  onChange: (patch: Partial<Filters>) => void
  // States that have products here (for the state dropdown).
  states: string[]
  // Subcategories to show as checkboxes; omit on phones, where they are chips above the list.
  subs?: Category[]
  // Prefix that keeps element ids unique when two panels exist on one page (sidebar and sheet).
  idPrefix: string
}

// The filter controls (design/screens/7-web-catalogue.html sidebar). Used in the desktop sidebar and the phone bottom sheet.
export default function FilterPanel({ filters, onChange, states, subs, idPrefix }: Props) {
  // Translate function and the current language (to pick Malay or English subcategory names).
  const { t, i18n } = useTranslation()
  // True when showing Malay names.
  const ms = i18n.language === 'ms'

  // Add or remove one item from a list.
  const toggle = <T,>(list: T[], item: T) => (list.includes(item) ? list.filter((x) => x !== item) : [...list, item])

  // Shared look for a checkbox row (28px minimum height so it is easy to tap).
  const row = 'flex min-h-7 items-center gap-2.5 text-[14px]'
  // Shared look for the checkbox itself: 18px, navy tick.
  const box = 'size-[18px] accent-navy'

  return (
    // Column of groups; each group after the first is separated by a line.
    <div className="flex flex-col gap-5">
      {/* Title and reset button. */}
      <div className="flex items-center justify-between">
        {/* Section title. */}
        <h2 className="text-heading">{t('list.filter')}</h2>
        {/* Back to defaults (keeps the sort order). */}
        <button
          type="button"
          onClick={() => onChange({ sub: [], status: DEFAULT_STATUS, state: '', halal: false })}
          className="py-1.5 text-label font-bold text-navy"
        >
          {t('list.reset')}
        </button>
      </div>

      {/* Subcategories (desktop sidebar only). */}
      {subs && subs.length > 0 && (
        <fieldset className="flex flex-col gap-2.5">
          {/* Group label. */}
          <legend className="pb-2.5 text-label text-muted">{t('list.subcategory')}</legend>
          {/* One checkbox per subcategory. */}
          {subs.map((s) => (
            <label key={s.slug} className={row}>
              <input type="checkbox" className={box} checked={filters.sub.includes(s.slug)} onChange={() => onChange({ sub: toggle(filters.sub, s.slug) })} />
              {ms ? s.name_ms : s.name_en}
            </label>
          ))}
        </fieldset>
      )}

      {/* Origin status. */}
      <fieldset className="flex flex-col gap-2.5 border-t border-line pt-4">
        {/* Group label. */}
        <legend className="float-left w-full pb-2.5 text-label text-muted">{t('list.statusLabel')}</legend>
        {/* One checkbox per status group; unticking the last one falls back to the default selection. */}
        {STATUS_OPTIONS.map((s) => (
          <label key={s} className={row}>
            <input
              type="checkbox"
              className={box}
              checked={filters.status.includes(s)}
              onChange={() => onChange({ status: toggle(filters.status, s) })}
            />
            {t(`status.${s === 'verified' ? 'verified_my' : s === 'likely' ? 'likely_my' : 'unknown'}.long`)}
          </label>
        ))}
      </fieldset>

      {/* Manufacturer state (only if some products have one). */}
      {states.length > 0 && (
        <div className="flex flex-col gap-2 border-t border-line pt-4">
          {/* Label tied to the select. */}
          <label htmlFor={`${idPrefix}-state`} className="text-label text-muted">
            {t('list.state')}
          </label>
          {/* Native select: accessible and mobile-friendly. */}
          <select
            id={`${idPrefix}-state`}
            value={filters.state}
            onChange={(e) => onChange({ state: e.target.value })}
            className="h-10 rounded-sm border border-line bg-surface px-2.5 text-[14px] text-ink"
          >
            {/* Empty value = all states. */}
            <option value="">{t('list.allStates')}</option>
            {/* One option per state. */}
            {states.map((s) => (
              <option key={s} value={s}>
                {s}
              </option>
            ))}
          </select>
        </div>
      )}

      {/* Halal only. */}
      <label className="flex items-center justify-between border-t border-line pt-4 text-[14px] font-semibold">
        {t('list.halalOnly')}
        <input type="checkbox" className={box} checked={filters.halal} onChange={(e) => onChange({ halal: e.target.checked })} />
      </label>
    </div>
  )
}
