// A tiny pretend version of the Laravel API that runs inside the browser, used only by the showcase build.
// It answers the same URLs with the same JSON shapes (the TypeScript types in ../api and ../authApi), using the dummy
// catalogue in ./data. Pretend accounts, submissions and reports live only in this visitor's localStorage.
import type { Category, CategoryDetail, Paginated, Product, ProductDetail } from '../api'
import type { AuthUser } from '../authApi'
import { CATEGORIES, PRODUCTS, type DemoProduct } from './data'
import { DEMO_EMAIL } from './account'
import { load, save } from './store'

// ---------- small helpers ----------

// Build a JSON response.
const json = (data: unknown, status = 200) => new Response(JSON.stringify(data), { status, headers: { 'Content-Type': 'application/json' } })
// Build a 422 "validation failed" response in the same shape Laravel uses.
const invalid = (errors: Record<string, string[]>) => json({ message: Object.values(errors)[0][0], errors }, 422)
// Build a plain error response.
const fail = (status: number, message: string) => json({ message }, status)

// Same rules as api/app/Support/Gtin.php: a 12-digit UPC-A becomes 13 digits; the last digit must be the right check digit.
const normalise = (code: string) => (code.length === 12 ? `0${code}` : code)
const checkDigitOk = (code: string) => {
  if (!/^(\d{8}|\d{12,14})$/.test(code)) return false
  const body = code.slice(0, -1)
  const sum = [...body].reverse().reduce((acc, d, i) => acc + Number(d) * (i % 2 === 0 ? 3 : 1), 0)
  return (10 - (sum % 10)) % 10 === Number(code.slice(-1))
}

// Malaysian states and federal territories (same list as the real app).
const STATES = ['Johor', 'Kedah', 'Kelantan', 'Melaka', 'Negeri Sembilan', 'Pahang', 'Perak', 'Perlis', 'Pulau Pinang', 'Sabah', 'Sarawak', 'Selangor', 'Terengganu', 'W.P. Kuala Lumpur', 'W.P. Labuan', 'W.P. Putrajaya']

// The status groups the filters use, mapped to real statuses (same as ProductController::STATUS_GROUPS).
const STATUS_GROUPS: Record<string, string[]> = {
  verified: ['verified_my'],
  likely: ['likely_my'],
  unknown: ['unknown', 'my_brand_unknown_origin'],
  foreign: ['foreign', 'my_brand_overseas', 'foreign_made_my'],
}

// ---------- categories ----------

// Every category (top level and sub) in one list, and a lookup by slug.
const ALL_CATEGORIES: Category[] = CATEGORIES.flatMap((c) => [c, ...(c.children ?? [])])
const bySlug = (slug: string) => ALL_CATEGORIES.find((c) => c.slug === slug)

// The category ids a slug stands for: a top-level category includes all its subcategories.
const idsFor = (slug: string): number[] => {
  const cat = bySlug(slug)
  if (!cat) return []
  return cat.parent_id === null ? [cat.id, ...(cat.children ?? []).map((c) => c.id)] : [cat.id]
}

// ---------- products ----------

// A stable pretend id for a brand (its letter).
const brandId = (p: DemoProduct) => p.brand.charCodeAt(p.brand.length - 1)

// The small card shape used in lists.
const card = (p: DemoProduct): Product => ({
  id: p.id,
  barcode: p.barcode,
  name: p.name,
  origin_status: p.status,
  image_url: null,
  brand: { id: brandId(p), name: p.brand },
  manufacturer: p.state ? { id: p.id, state: p.state } : null,
})

// Is this product confirmed or likely Malaysian (what the default catalogue shows)?
const isMalaysian = (p: DemoProduct) => p.status === 'verified_my' || p.status === 'likely_my'

// The full detail shape used by the result page.
const detail = (p: DemoProduct): ProductDetail => {
  const cat = bySlug(p.category)
  const parent = cat?.parent_id ? ALL_CATEGORIES.find((c) => c.id === cat.parent_id) : null
  // Hand-picked alternatives, else other Malaysian products in the same category (like the real API).
  const picked = p.alternatives.map((b) => PRODUCTS.find((x) => x.barcode === b)).filter((x): x is DemoProduct => Boolean(x))
  const alternatives = (picked.length > 0 ? picked : PRODUCTS.filter((x) => x.category === p.category && x.id !== p.id && isMalaysian(x)).slice(0, 2)).map(card)
  return {
    ...card(p),
    halal: p.halal,
    approved_evidence_count: p.status === 'verified_my' ? 1 : 0,
    quantity: p.quantity,
    // Open-data style evidence for "likely" products.
    manufacturing_places: p.status === 'likely_my' && p.state ? `${p.state}, Malaysia` : null,
    origin_note: p.status === 'verified_my' ? 'Foto label disemak / Label photo checked' : null,
    source: 'demo',
    source_url: null,
    manufacturer: p.manufacturer ? { id: p.id, name: p.manufacturer, state: p.state, country: p.country } : null,
    category: cat ? { name_ms: cat.name_ms, name_en: cat.name_en, parent: parent ? { name_ms: parent.name_ms, name_en: parent.name_en } : null } : null,
    alternatives,
  }
}

// GET /products with the same filters as the real API.
function listProducts(q: URLSearchParams): Paginated<Product> {
  const category = q.get('category')
  const subs = (q.get('sub') ?? '').split(',').filter(Boolean)
  const groups = (q.get('status') ?? '').split(',').flatMap((g) => STATUS_GROUPS[g] ?? [])
  const search = (q.get('q') ?? '').trim().toLowerCase()

  // Which category ids are allowed (narrowed to the chosen subcategories when they belong to the category).
  let ids = category ? idsFor(category) : null
  if (ids && subs.length > 0) {
    const subIds = subs.flatMap((s) => idsFor(s)).filter((id) => ids?.includes(id))
    if (subIds.length > 0) ids = subIds
  }

  let items = PRODUCTS.filter((p) => {
    const cat = bySlug(p.category)
    if (ids && (!cat || !ids.includes(cat.id))) return false
    if (groups.length > 0 && !groups.includes(p.status)) return false
    if (q.get('state') && p.state !== q.get('state')) return false
    if (q.get('halal') === '1' && p.halal !== true) return false
    if (search) {
      // A string of 8-14 digits is a barcode (exact match); anything else matches the name or brand.
      if (/^\d{8,14}$/.test(search)) return p.barcode === normalise(search)
      return p.name.toLowerCase().includes(search) || p.brand.toLowerCase().includes(search)
    }
    return true
  })

  // Sorting: most scanned (default), newest, or A-Z.
  const sort = q.get('sort') ?? 'popular'
  items = [...items].sort((a, b) => (sort === 'az' ? a.name.localeCompare(b.name) : sort === 'newest' ? b.id - a.id : b.scans - a.scans || a.id - b.id))

  // Paging.
  const perPage = Math.min(48, Math.max(1, Number(q.get('per_page')) || 12))
  const page = Math.max(1, Number(q.get('page')) || 1)
  return { data: items.slice((page - 1) * perPage, page * perPage).map(card), current_page: page, last_page: Math.max(1, Math.ceil(items.length / perPage)), total: items.length }
}

// GET /categories/{slug}: the category with its subcategories, states and count.
function categoryDetail(slug: string): CategoryDetail | null {
  const cat = bySlug(slug)
  if (!cat) return null
  const ids = idsFor(slug)
  const inCategory = PRODUCTS.filter((p) => ids.includes(bySlug(p.category)?.id ?? -1))
  const parent = cat.parent_id ? (ALL_CATEGORIES.find((c) => c.id === cat.parent_id) ?? null) : null
  return {
    ...cat,
    children: cat.children ?? [],
    parent,
    malaysian_count: inCategory.filter(isMalaysian).length,
    states: [...new Set(inCategory.map((p) => p.state).filter((s): s is string => Boolean(s)))].sort(),
  }
}

// ---------- pretend accounts ----------
// Passwords are NEVER stored (visitors might type a real one): in the showcase, any password logs you in.

interface DemoUser {
  id: number
  name: string
  email: string
}
const USERS = 'demo.users'
// The ready-made account (see account.ts): always present, never stored in the browser.
const DEMO_USER: DemoUser = { id: 1, name: 'Demo', email: DEMO_EMAIL }
// Every account a visitor can log in to: the ready-made one plus the ones they signed up.
const allUsers = () => [DEMO_USER, ...load<DemoUser>(USERS)]
const publicUser = (u: DemoUser): AuthUser => ({ id: u.id, name: u.name, email: u.email, role: 'user', email_verified: true })

// Who is making the request? The token is "demo-<id>".
function currentUser(init: RequestInit): DemoUser | null {
  const auth = new Headers(init.headers).get('Authorization') ?? ''
  const id = Number(auth.replace('Bearer demo-', ''))
  return allUsers().find((u) => u.id === id) ?? null
}

// ---------- pretend submissions and reports ----------

interface DemoSubmission {
  id: number
  user_id: number
  type: 'new_product' | 'correction'
  barcode: string
  name: string | null
  status: 'pending'
  review_note: null
  created_at: string
}
const SUBMISSIONS = 'demo.submissions'
const REPORTS = 'demo.reports'
const REPORT_TYPES = ['wrong_origin', 'wrong_name', 'wrong_photo', 'wrong_category', 'other']

// ---------- the router ----------

// Answer one request (called from src/http.ts when the showcase build is running).
export async function handle(path: string, init: RequestInit): Promise<Response> {
  // A short pause, so loading states look like they would with a real server.
  await new Promise((r) => setTimeout(r, 120))

  const url = new URL(path, 'http://demo.local')
  const p = url.pathname
  const q = url.searchParams
  const method = (init.method ?? 'GET').toUpperCase()
  // JSON body (if any).
  const body: Record<string, unknown> = init.body ? JSON.parse(String(init.body)) : {}
  const str = (key: string) => (typeof body[key] === 'string' ? (body[key] as string).trim() : '')
  const user = currentUser(init)

  // ----- public catalogue -----
  if (method === 'GET' && p === '/categories') return json(CATEGORIES)
  if (method === 'GET' && p.startsWith('/categories/')) {
    const c = categoryDetail(decodeURIComponent(p.slice('/categories/'.length)))
    return c ? json(c) : fail(404, 'Not Found')
  }
  if (method === 'GET' && p === '/products') return json(listProducts(q))
  if (method === 'GET' && p === '/products/recent') return json(PRODUCTS.filter(isMalaysian).sort((a, b) => b.id - a.id).slice(0, 5).map(card))
  if (method === 'GET' && p.startsWith('/products/')) {
    const found = PRODUCTS.find((x) => x.barcode === normalise(decodeURIComponent(p.slice('/products/'.length))))
    return found ? json(detail(found)) : fail(404, 'Not Found')
  }
  // Scan counting does nothing in the showcase.
  if (method === 'POST' && p === '/scans') return new Response(null, { status: 204 })

  // ----- pretend accounts -----
  if (method === 'POST' && p === '/auth/register') {
    const errors: Record<string, string[]> = {}
    if (!str('name')) errors.name = ['The name field is required.']
    if (!/^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(str('email'))) errors.email = ['The email field must be a valid email address.']
    else if (allUsers().some((u) => u.email === str('email').toLowerCase())) errors.email = ['The email has already been taken.']
    if (str('password').length < 10) errors.password = ['The password field must be at least 10 characters.']
    if (body.accept_terms !== true) errors.accept_terms = ['The accept terms field must be accepted.']
    if (Object.keys(errors).length > 0) return invalid(errors)
    const users = load<DemoUser>(USERS)
    const created: DemoUser = { id: Date.now() % 1_000_000, name: str('name'), email: str('email').toLowerCase() }
    save(USERS, [...users, created])
    return json({ token: `demo-${created.id}`, user: publicUser(created) }, 201)
  }
  if (method === 'POST' && p === '/auth/login') {
    const found = allUsers().find((u) => u.email === str('email').toLowerCase())
    // Any password works for a registered email in the showcase (passwords are never stored).
    if (!found || !str('password')) return invalid({ email: ['These credentials do not match our records.'] })
    return json({ token: `demo-${found.id}`, user: publicUser(found) })
  }
  if (method === 'POST' && p === '/auth/forgot-password') return json({ message: 'If that email has an account, we have sent a link to reset the password.' })
  // There is no email in the showcase, so there is never a valid reset link.
  if (method === 'POST' && p === '/auth/reset-password') return invalid({ token: ['This password reset link is invalid or has expired.'] })

  // Everything below needs a (pretend) login.
  if (p.startsWith('/staff') || p.startsWith('/admin')) return fail(user ? 403 : 401, 'The staff area is not part of the showcase.')
  if (!user) return fail(401, 'Unauthenticated.')

  if (method === 'GET' && p === '/auth/me') return json(publicUser(user))
  if (method === 'POST' && p === '/auth/logout') return new Response(null, { status: 204 })
  if (method === 'POST' && p === '/email/resend') return json({ message: 'Your email is already confirmed.' })

  // ----- pretend contributions -----
  if (method === 'POST' && p === '/submissions') {
    const errors: Record<string, string[]> = {}
    const barcode = normalise(str('barcode'))
    if (!/^\d{8,14}$/.test(barcode)) errors.barcode = ['The barcode field format is invalid.']
    else if (!checkDigitOk(barcode)) errors.barcode = ['This barcode has a wrong check digit; please check it.']
    if (str('note').length < 10) errors.note = ['The note field must be at least 10 characters.']
    if (str('state') && !STATES.includes(str('state'))) errors.state = ['The selected state is invalid.']
    if (str('halal') && !['yes', 'no', 'unknown'].includes(str('halal'))) errors.halal = ['The selected halal is invalid.']
    if (str('category') && !bySlug(str('category'))) errors.category = ['The selected category is invalid.']
    if (str('image_url') && !/^https?:\/\//i.test(str('image_url'))) errors.image_url = ['The image url field must be a valid URL.']
    if (Object.keys(errors).length > 0) return invalid(errors)

    const existing = PRODUCTS.find((x) => x.barcode === barcode)
    const type = existing ? 'correction' : 'new_product'
    const changes = ['name', 'brand', 'category', 'manufacturer', 'state', 'halal', 'quantity', 'image_url'].filter((k) => str(k))
    if (type === 'new_product' && !str('name')) return invalid({ name: ['A name is required for a product we do not have yet.'] })
    if (type === 'correction' && changes.length === 0) return invalid({ name: ['Fill in at least one thing that should change.'] })

    const mine = load<DemoSubmission>(SUBMISSIONS).filter((s) => s.user_id === user.id)
    if (mine.some((s) => s.barcode === barcode)) return invalid({ barcode: ['You already have a submission for this barcode waiting for review.'] })
    if (mine.length >= 20) return invalid({ barcode: ['You have too many submissions waiting for review. Please wait for some to be reviewed.'] })

    const created: DemoSubmission = { id: Date.now() % 1_000_000, user_id: user.id, type, barcode, name: str('name') || existing?.name || null, status: 'pending', review_note: null, created_at: new Date().toISOString() }
    save(SUBMISSIONS, [...load<DemoSubmission>(SUBMISSIONS), created])
    const { user_id: _owner, ...visible } = created
    return json(visible, 201)
  }
  if (method === 'GET' && p === '/submissions/mine') {
    return json(load<DemoSubmission>(SUBMISSIONS).filter((s) => s.user_id === user.id).sort((a, b) => b.id - a.id).map(({ user_id: _owner, ...s }) => s))
  }

  // ----- pretend reports -----
  if (method === 'POST' && p === '/reports') {
    const errors: Record<string, string[]> = {}
    if (!REPORT_TYPES.includes(str('type'))) errors.type = ['The selected type is invalid.']
    if (str('note').length < 10) errors.note = ['The note field must be at least 10 characters.']
    if (Object.keys(errors).length > 0) return invalid(errors)
    const barcode = normalise(str('barcode'))
    if (!PRODUCTS.some((x) => x.barcode === barcode)) return invalid({ barcode: ['We do not have this product.'] })
    const reports = load<{ user_id: number; barcode: string }>(REPORTS)
    if (reports.some((r) => r.user_id === user.id && r.barcode === barcode)) return invalid({ note: ['You already reported this product and it is waiting for review.'] })
    save(REPORTS, [...reports, { user_id: user.id, barcode }])
    return json({ message: 'Report received.' }, 201)
  }

  return fail(404, 'Not Found')
}
