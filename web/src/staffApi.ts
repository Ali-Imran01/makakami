// Calls to the staff endpoints of the API (review queue, direct product editing, people, audit log).
// Every call needs the staff member's login token; the server also checks their role and confirmed email.
import { request, type AuthUser } from './authApi'

// Statuses decided by a person: they always come with a written reason, and only admins may set them.
export const HUMAN_DECIDED = ['verified_my', 'foreign', 'foreign_made_my']

// Every origin status, and the ones a moderator may set (the server enforces this; the lists only decide what the form offers).
export const ALL_STATUSES = ['verified_my', 'likely_my', 'my_brand_unknown_origin', 'my_brand_overseas', 'foreign_made_my', 'foreign', 'unknown']
export const MODERATOR_STATUSES = ['unknown', 'my_brand_unknown_origin', 'my_brand_overseas', 'likely_my']

// The detail fields of a product (the same ones contributors can send).
export interface ProductFields {
  name?: string | null
  brand?: string | null
  // Category slug.
  category?: string | null
  manufacturer?: string | null
  state?: string | null
  halal?: 'yes' | 'no' | 'unknown' | null
  quantity?: string | null
  image_url?: string | null
}

// One entry of the review queue.
export interface StaffSubmission {
  id: number
  type: 'new_product' | 'correction'
  barcode: string
  status: 'pending' | 'approved' | 'rejected'
  created_at: string
  // Reviewers see the contributor's name only.
  contributor: { id: number | null; name: string | null }
  // What the contributor proposed (plus their source note).
  payload: ProductFields & { note?: string }
  // For corrections: how the product looks now.
  current: (ProductFields & { origin_status: string }) | null
  review_note: string | null
  reviewed_at: string | null
}

// The queue and its numbers.
export interface QueueResult {
  data: StaffSubmission[]
  counts: Partial<Record<'pending' | 'approved' | 'rejected', number>>
  // Statuses this reviewer's role may set when approving.
  allowed_statuses: string[]
}

// A product as an editable form.
export interface StaffProduct extends ProductFields {
  barcode: string
  origin_status: string
  origin_note: string | null
  source: string
  // True when an admin set the current status and this role may not change it.
  status_locked: boolean
  allowed_statuses: string[]
}

// One line of the audit log.
export interface AuditEntry {
  id: number
  action: string
  // Who did it (null = the command line).
  actor: string | null
  subject: string | null
  before: Record<string, unknown> | null
  after: Record<string, unknown> | null
  note: string | null
  created_at: string
}

// A person in the people list.
export interface StaffUser extends AuthUser {
  created_at: string
}

export const fetchQueue = (token: string, status: string) => request<QueueResult>('GET', `/staff/submissions?status=${status}`, { token })

export const approveSubmission = (token: string, id: number, body: { origin_status?: string; evidence?: string; review_note?: string }) =>
  request<unknown>('POST', `/staff/submissions/${id}/approve`, { token, body })

export const rejectSubmission = (token: string, id: number, reviewNote: string) =>
  request<unknown>('POST', `/staff/submissions/${id}/reject`, { token, body: { review_note: reviewNote } })

// Look a product up as an editable form (rejects with ApiError 404 when we don't have it).
export const fetchStaffProduct = (token: string, barcode: string) => request<StaffProduct>('GET', `/staff/products/${encodeURIComponent(barcode)}`, { token })

// What the editor form sends.
export type ProductFormBody = ProductFields & { barcode?: string; origin_status?: string; origin_note?: string }

export const createStaffProduct = (token: string, body: ProductFormBody) => request<{ barcode: string }>('POST', '/staff/products', { token, body })

export const updateStaffProduct = (token: string, barcode: string, body: ProductFormBody) =>
  request<{ barcode: string }>('PUT', `/staff/products/${encodeURIComponent(barcode)}`, { token, body })

// A report of wrong information, as staff see it.
export interface StaffReport {
  id: number
  type: 'wrong_origin' | 'wrong_name' | 'wrong_photo' | 'wrong_category' | 'other'
  note: string
  status: 'open' | 'resolved' | 'dismissed'
  created_at: string
  // The reporter's name only (no email).
  reporter: string | null
  product: { barcode: string; name: string; origin_status: string } | null
  resolution_note: string | null
}

export const fetchReports = (token: string, status: string) =>
  request<{ data: StaffReport[]; counts: Partial<Record<'open' | 'resolved' | 'dismissed', number>> }>('GET', `/staff/reports?status=${status}`, { token })

// Close a report: "resolve" (it was right and is dealt with) or "dismiss" (it was not; needs a reason).
export const closeReport = (token: string, id: number, kind: 'resolve' | 'dismiss', resolutionNote: string) =>
  request<unknown>('POST', `/staff/reports/${id}/${kind}`, { token, body: { resolution_note: resolutionNote || undefined } })

export const fetchStaffUsers = (token: string, q: string) => request<StaffUser[]>('GET', `/staff/users?q=${encodeURIComponent(q)}`, { token })

// Change someone's role (the server applies the ladder rules).
export const setUserRole = (token: string, email: string, role: string) => request<AuthUser>('PUT', '/admin/users/role', { token, body: { email, role } })

export const fetchAudit = (token: string) => request<AuditEntry[]>('GET', '/staff/audit', { token })
