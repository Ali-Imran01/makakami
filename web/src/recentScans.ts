// The origin status type shared with the API layer.
import type { OriginStatus } from './api'

// One remembered scan. Name and status are filled in later by the product page once it knows them.
export interface RecentScan {
  // The barcode that was scanned or typed.
  barcode: string
  // Product name, if we've seen the product.
  name?: string
  // Origin status, if we've seen the product.
  origin_status?: OriginStatus
}

// Key under which the list is stored in the browser.
const KEY = 'recentScans'
// How many scans to keep.
const MAX = 5

// Read the saved list; returns [] if nothing is saved, storage is blocked, or the data is corrupt.
export function getRecentScans(): RecentScan[] {
  // localStorage can throw (private mode, blocked cookies) and JSON.parse can throw on bad data.
  try {
    // Parse whatever was stored (or an empty list).
    const list: unknown = JSON.parse(localStorage.getItem(KEY) ?? '[]')
    // Only accept an array; anything else is treated as empty.
    return Array.isArray(list) ? list.slice(0, MAX) : []
  } catch {
    // Unreadable: behave as if there are no recent scans.
    return []
  }
}

// Put a scan at the top of the list (moving it up if it was already there), keeping any known name/status.
export function addRecentScan(scan: RecentScan): void {
  // Same safety net as reading.
  try {
    // Look up an existing entry for this barcode so we don't lose its name/status.
    const existing = getRecentScans().find((s) => s.barcode === scan.barcode)
    // Remove the old copy of this barcode from the list.
    const others = getRecentScans().filter((s) => s.barcode !== scan.barcode)
    // New entry first, then the rest, trimmed to MAX; merge so known details survive.
    localStorage.setItem(KEY, JSON.stringify([{ ...existing, ...scan }, ...others].slice(0, MAX)))
  } catch {
    // Storage unavailable: recent scans just won't be remembered.
  }
}
