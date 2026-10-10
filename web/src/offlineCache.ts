// Offline cache: remembers the product details the visitor has recently looked at, so those result pages still open
// when the connection is poor or down (e.g. inside a supermarket). It stores data in the browser only (localStorage).
import { ApiError, fetchProduct, type ProductDetail } from './api'

// Key under which the cache is stored in the browser.
const KEY = 'productCache'
// How many products to remember (the least recently viewed ones are dropped first).
const MAX_ENTRIES = 20

// A product as returned to the result page: the normal details, plus a time when it came from the cache instead of the server.
export type CachedProduct = ProductDetail & {
  // Set only when the data was served from the cache: the time (milliseconds since 1970) it was saved.
  cachedAt?: number
}

// One stored entry.
interface Entry {
  // When it was saved.
  savedAt: number
  // The product details exactly as the API sent them.
  product: ProductDetail
}

// Read every stored entry; returns [] if nothing is stored, storage is blocked, or the data is corrupt.
function readAll(): Entry[] {
  // localStorage can throw (private mode, blocked cookies) and JSON.parse can throw on bad data.
  try {
    // Parse whatever was stored (or an empty list).
    const list: unknown = JSON.parse(localStorage.getItem(KEY) ?? '[]')
    // Keep only well-formed entries.
    return Array.isArray(list) ? list.filter((e): e is Entry => typeof e?.savedAt === 'number' && typeof e?.product?.barcode === 'string') : []
  } catch {
    // Unreadable: behave as if the cache is empty.
    return []
  }
}

// Save a product at the front of the cache (replacing an older copy of the same barcode) and trim to the size limit.
export function cacheProduct(product: ProductDetail): void {
  // Barcode is the identity; products without one can't be looked up again later.
  if (!product.barcode) return
  // Same safety net as reading: a full or blocked storage must never break the page.
  try {
    // New entry first, then the others (without the old copy of this product), trimmed to the limit.
    const entries = [{ savedAt: Date.now(), product }, ...readAll().filter((e) => e.product.barcode !== product.barcode)].slice(0, MAX_ENTRIES)
    // Write it back.
    localStorage.setItem(KEY, JSON.stringify(entries))
  } catch {
    // Storage unavailable or full: the cache just won't be updated.
  }
}

// Look up one barcode in the cache; returns the product with the time it was saved, or null if it isn't cached.
export function getCachedProduct(barcode: string): CachedProduct | null {
  // Find the stored entry for this barcode.
  const entry = readAll().find((e) => e.product.barcode === barcode)
  // Not cached.
  if (!entry) return null
  // Mark it as coming from the cache so the page can say so.
  return { ...entry.product, cachedAt: entry.savedAt }
}

// Load a product from the server and remember it; if the server can't be reached (or errors), fall back to the cached copy.
// A 404 ("we don't have this product") is a real answer, so it is passed on and the cache is not used.
export async function fetchProductWithCache(barcode: string): Promise<CachedProduct> {
  try {
    // Ask the server.
    const product = await fetchProduct(barcode)
    // Remember it for next time.
    cacheProduct(product)
    // Fresh data: no cachedAt.
    return product
  } catch (err) {
    // "Not found" is final.
    if (err instanceof ApiError && err.status === 404) throw err
    // Any other failure (no network, timeout, server error): use the cached copy if we have one.
    const cached = getCachedProduct(barcode)
    // Nothing cached: let the page show its normal error.
    if (!cached) throw err
    // Serve the cached copy.
    return cached
  }
}
