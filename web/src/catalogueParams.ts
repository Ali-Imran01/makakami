// The filters shown on category pages, stored in the URL so pages can be shared and the back button works.

// Sort choices (same names the API accepts).
export type Sort = 'popular' | 'newest' | 'az'

// Status groups a visitor can filter by (the API expands each into real statuses).
export const STATUS_OPTIONS = ['verified', 'likely', 'unknown'] as const
export type StatusGroup = (typeof STATUS_OPTIONS)[number]

// Shown by default on category pages: only confirmed and likely Malaysian products (planning doc, section 5).
export const DEFAULT_STATUS: StatusGroup[] = ['verified', 'likely']

// Parsed filter values.
export interface Filters {
  // Selected subcategory slugs.
  sub: string[]
  // Selected status groups (never empty: falls back to the default).
  status: StatusGroup[]
  // Manufacturer state, or '' for all.
  state: string
  // Halal only.
  halal: boolean
  // Sort order.
  sort: Sort
  // Page number.
  page: number
}

// Read the filters out of the URL's query string, ignoring anything invalid.
export function parseFilters(sp: URLSearchParams): Filters {
  // Status groups from "verified,likely"; keep only known names.
  const status = (sp.get('status') ?? '').split(',').filter((s): s is StatusGroup => (STATUS_OPTIONS as readonly string[]).includes(s))
  // Sort: accept only the three known values.
  const sort = sp.get('sort')
  return {
    // Subcategory slugs, comma separated; empty parts removed.
    sub: (sp.get('sub') ?? '').split(',').filter(Boolean),
    // No valid status given = default.
    status: status.length > 0 ? status : DEFAULT_STATUS,
    // State text as is.
    state: sp.get('state') ?? '',
    // "1" means halal only.
    halal: sp.get('halal') === '1',
    // Unknown sort values fall back to "popular".
    sort: sort === 'newest' || sort === 'az' ? sort : 'popular',
    // Page numbers below 1 or non-numbers become 1.
    page: Math.max(1, Number.parseInt(sp.get('page') ?? '1', 10) || 1),
  }
}

// Turn filters back into a query string. Values equal to the defaults are left out to keep URLs short.
export function toSearchParams(f: Filters): URLSearchParams {
  // Start empty.
  const sp = new URLSearchParams()
  // Subcategories.
  if (f.sub.length > 0) sp.set('sub', f.sub.join(','))
  // Status only when it differs from the default selection.
  if (f.status.join(',') !== DEFAULT_STATUS.join(',')) sp.set('status', f.status.join(','))
  // State.
  if (f.state) sp.set('state', f.state)
  // Halal.
  if (f.halal) sp.set('halal', '1')
  // Sort.
  if (f.sort !== 'popular') sp.set('sort', f.sort)
  // Page.
  if (f.page > 1) sp.set('page', String(f.page))
  return sp
}
