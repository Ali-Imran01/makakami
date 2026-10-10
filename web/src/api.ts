// Base URL of the Laravel API; set in web/.env as VITE_API_URL, with a local fallback.
const API_URL = import.meta.env.VITE_API_URL ?? 'http://localhost:8000/api'

// Shape of one category as returned by GET /api/categories.
export interface Category {
  // Database id.
  id: number
  // Parent category id, or null for top-level categories.
  parent_id: number | null
  // Malay name.
  name_ms: string
  // English name.
  name_en: string
  // URL-friendly id, e.g. "personal-care".
  slug: string
  // True for categories that are browse-only in v1.
  coming_soon: boolean
  // Subcategories (only present on top-level categories).
  children?: Category[]
}

// The origin statuses the API can return (matches the products.origin_status enum).
export type OriginStatus =
  | 'verified_my'
  | 'likely_my'
  | 'my_brand_unknown_origin'
  | 'my_brand_overseas'
  | 'foreign_made_my'
  | 'foreign'
  | 'unknown'

// Shape of one product as returned by GET /api/products/recent.
export interface Product {
  // Database id.
  id: number
  // Barcode used in the product page URL; may be missing for community products.
  barcode: string | null
  // Product name.
  name: string
  // Where the product came from, shown as a badge.
  origin_status: OriginStatus
  // Image link, or null so the UI shows a placeholder box.
  image_url: string | null
  // Brand, if known.
  brand: { id: number; name: string } | null
  // Manufacturer (we only need its state), if known.
  manufacturer: { id: number; state: string | null } | null
}

// Error that remembers the HTTP status, so callers can treat "404 not found" differently from real failures.
export class ApiError extends Error {
  // The HTTP status code the API answered with.
  status: number
  // For 422 answers: what is wrong with each form field, e.g. { email: ["The email has already been taken."] }.
  fieldErrors: Record<string, string[]>
  // The message the server sent (e.g. "You cannot grant this role."), if any.
  serverMessage: string

  // Build the error from the status code, plus the details the server sent (if any).
  constructor(status: number, fieldErrors: Record<string, string[]> = {}, serverMessage = '') {
    // Human-readable message for logs.
    super(`API ${status}`)
    // Keep the status for callers.
    this.status = status
    // Keep the details for forms.
    this.fieldErrors = fieldErrors
    this.serverMessage = serverMessage
  }
}

// Full product details for the result page (GET /api/products/{barcode}).
export interface ProductDetail extends Product {
  // true = halal, false = not halal, null = no information.
  halal: boolean | null
  // Number of admin-approved label photos for this product.
  approved_evidence_count: number
  // Pack size as printed, e.g. "150 g".
  quantity: string | null
  // Where it is made, as free text from open data (e.g. "Selangor, Malaysia").
  manufacturing_places: string | null
  // Why a person set the origin status (free text), or null.
  origin_note: string | null
  // Where the data came from: off / obf / opf = Open Food/Beauty/Products Facts, manual, community, demo.
  source: string
  // Link to the product's page at the data source (needed for attribution).
  source_url: string | null
  // Manufacturer with its name and country code (e.g. "MY").
  manufacturer: { id: number; name: string; state: string | null; country: string } | null
  // Subcategory, with its parent so we can show "Makanan › Snek".
  category: { name_ms: string; name_en: string; parent: { name_ms: string; name_en: string } | null } | null
  // Up to two Malaysian alternatives (same shape as the home cards).
  alternatives: Product[]
}

// Small helper: GET a path from the API and return parsed JSON, or throw on a bad status.
async function getJson<T>(path: string, timeoutMs = 10_000): Promise<T> {
  // Ask for JSON so Laravel returns JSON errors instead of HTML pages. Give up after the time limit so a very weak
  // connection fails (and the offline cache can step in) instead of leaving the page loading forever.
  const res = await fetch(`${API_URL}${path}`, { headers: { Accept: 'application/json' }, signal: AbortSignal.timeout(timeoutMs) })
  // fetch() only rejects on network errors, so check the HTTP status ourselves.
  if (!res.ok) throw new ApiError(res.status)
  // Parse and return the JSON body.
  return res.json()
}

// Load all top-level categories (with their children).
export const fetchCategories = () => getJson<Category[]>('/categories')

// One category with the extras the category page needs (GET /api/categories/{slug}).
export interface CategoryDetail extends Category {
  // The parent category when this one is a subcategory, otherwise null.
  parent: Category | null
  // How many confirmed/likely Malaysian products it holds (shown under the title).
  malaysian_count: number
  // States that have a manufacturer here, for the "Negeri pengilang" filter.
  states: string[]
}

// Laravel's paginated list shape (only the fields we use).
export interface Paginated<T> {
  // The items on this page.
  data: T[]
  // Current page number (1-based).
  current_page: number
  // Last page number.
  last_page: number
  // Total number of items across all pages.
  total: number
}

// Filters accepted by GET /api/products (all optional; they map 1:1 to the query string).
export interface ProductQuery {
  // Search words or a barcode.
  q?: string
  // Category slug.
  category?: string
  // Subcategory slugs.
  sub?: string[]
  // Status groups: verified, likely, unknown, foreign.
  status?: string[]
  // Manufacturer state.
  state?: string
  // Only halal products.
  halal?: boolean
  // Sort order.
  sort?: 'popular' | 'newest' | 'az'
  // Page number.
  page?: number
  // Page size.
  per_page?: number
}

// Tell the API that a barcode was scanned (feeds the "most scanned" counter). No personal data is sent.
export async function logScan(barcode: string): Promise<void> {
  // POST the barcode as JSON; Accept makes Laravel answer with JSON errors.
  const res = await fetch(`${API_URL}/scans`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', Accept: 'application/json' },
    body: JSON.stringify({ barcode }),
  })
  // Surface HTTP errors to the caller (which ignores them: a failed log must never break the page).
  if (!res.ok) throw new ApiError(res.status)
}

// Load one product by barcode; rejects with ApiError(404) when we don't have it.
// (Given longer than other calls: for a barcode we don't have yet, the server may need a few seconds to ask Open Food Facts.)
export const fetchProduct = (barcode: string) => getJson<ProductDetail>(`/products/${encodeURIComponent(barcode)}`, 25_000)

// Load one category with its subcategories, states and counts.
export const fetchCategory = (slug: string) => getJson<CategoryDetail>(`/categories/${encodeURIComponent(slug)}`)

// Load a filtered, sorted, paginated list of products (used by category pages and search).
export function fetchProducts(query: ProductQuery) {
  // Build the query string, skipping empty values.
  const params = new URLSearchParams()
  // Plain text values.
  if (query.q) params.set('q', query.q)
  if (query.category) params.set('category', query.category)
  if (query.state) params.set('state', query.state)
  if (query.sort) params.set('sort', query.sort)
  // Lists are sent comma-separated.
  if (query.sub?.length) params.set('sub', query.sub.join(','))
  if (query.status?.length) params.set('status', query.status.join(','))
  // Booleans and numbers.
  if (query.halal) params.set('halal', '1')
  if (query.page) params.set('page', String(query.page))
  if (query.per_page) params.set('per_page', String(query.per_page))
  // Ask the API.
  return getJson<Paginated<Product>>(`/products?${params}`)
}

// Load the newest verified/likely-Malaysian products for the Home screen.
export const fetchRecentProducts = () => getJson<Product[]>('/products/recent')
