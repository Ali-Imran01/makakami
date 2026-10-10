// The list of statuses the API can send.
import type { OriginStatus } from './api'

// Which of the four visual variants in DESIGN.md a status uses.
export type Variant = 'verified' | 'likely' | 'unknown' | 'foreign'

// Maps every API status to a visual variant and a translation key.
// Statuses DESIGN.md doesn't define yet fall back to the closest variant (see notes).
// Shared by the badge and the result page's hero so both group statuses the same way.
export const VARIANT: Record<OriginStatus, { variant: Variant; key: string }> = {
  // Admin-confirmed Malaysian.
  verified_my: { variant: 'verified', key: 'verified_my' },
  // Probably Malaysian.
  likely_my: { variant: 'likely', key: 'likely_my' },
  // No evidence yet.
  unknown: { variant: 'unknown', key: 'unknown' },
  // Malaysian brand, origin unconfirmed: treated as "not yet verified" until DESIGN.md says otherwise.
  my_brand_unknown_origin: { variant: 'unknown', key: 'unknown' },
  // Confirmed foreign.
  foreign: { variant: 'foreign', key: 'foreign' },
  // Malaysian brand made abroad: DESIGN.md groups it with foreign.
  my_brand_overseas: { variant: 'foreign', key: 'my_brand_overseas' },
  // Foreign brand made in Malaysia: no design yet, shown as foreign for now.
  foreign_made_my: { variant: 'foreign', key: 'foreign' },
}
