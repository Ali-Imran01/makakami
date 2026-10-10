// Calls to the account endpoints of the API (sign up, log in, who am I, resend email, log out).
import { ApiError } from './api'

// Base URL of the Laravel API (same setting as api.ts).
const API_URL = import.meta.env.VITE_API_URL ?? 'http://localhost:8000/api'

// What the API tells us about a signed-in person (never includes the password or tokens).
export interface AuthUser {
  // Database id.
  id: number
  // Display name.
  name: string
  // Email address.
  email: string
  // Position on the role ladder.
  role: 'user' | 'moderator' | 'admin' | 'super_admin'
  // True once they clicked the link in the confirmation email.
  email_verified: boolean
}

// How high each role sits on the ladder (a bigger number can do more). Mirrors the server's Role enum.
export const ROLE_RANK: Record<AuthUser['role'], number> = { user: 1, moderator: 2, admin: 3, super_admin: 4 }

// The answer to a successful sign-up or login.
export interface AuthResult {
  // The token to send with later requests.
  token: string
  // The person.
  user: AuthUser
}

// Send one request to the API (JSON in, JSON out). Exported so the staff calls can reuse it. Throws ApiError with the server's details when the answer is not OK.
export async function request<T>(method: 'GET' | 'POST' | 'PUT', path: string, options: { body?: unknown; token?: string | null } = {}): Promise<T> {
  // Headers: JSON in and out, plus the login token when we have one.
  const headers: Record<string, string> = { Accept: 'application/json' }
  if (options.body !== undefined) headers['Content-Type'] = 'application/json'
  if (options.token) headers.Authorization = `Bearer ${options.token}`

  // Send it; give up after 15 seconds.
  const res = await fetch(`${API_URL}${path}`, {
    method,
    headers,
    body: options.body !== undefined ? JSON.stringify(options.body) : undefined,
    signal: AbortSignal.timeout(15_000),
  })

  // Not OK: read what the server said (if it sent JSON) and throw it as an ApiError.
  if (!res.ok) {
    const data = await res.json().catch(() => ({}))
    throw new ApiError(res.status, data.errors ?? {}, data.message ?? '')
  }

  // "204 No Content" (e.g. logout) has no body.
  if (res.status === 204) return undefined as T
  // Otherwise parse the JSON body.
  return res.json()
}

// Create a normal user account. `termsVersion` is the version of the Terms the person saw when they ticked the box.
export const register = (input: { name: string; email: string; password: string; termsVersion: string }) =>
  request<AuthResult>('POST', '/auth/register', {
    body: { name: input.name, email: input.email, password: input.password, accept_terms: true, terms_version: input.termsVersion },
  })

// Log in with email and password.
export const login = (email: string, password: string) => request<AuthResult>('POST', '/auth/login', { body: { email, password } })

// Who is behind this token? (Rejects with ApiError 401 when the token is no longer valid.)
export const fetchMe = (token: string) => request<AuthUser>('GET', '/auth/me', { token })

// Ask the server to send the confirmation email again.
export const resendVerification = (token: string) => request<{ message: string }>('POST', '/email/resend', { token })

// What a contributor can send in. There is deliberately no field for the origin status: moderators decide that.
export interface SubmissionInput {
  // 8-14 digit barcode.
  barcode: string
  // Proposed product name (required for a product we don't have yet).
  name?: string
  brand?: string
  // Category slug, e.g. "food-snacks".
  category?: string
  manufacturer?: string
  // A Malaysian state or federal territory.
  state?: string
  halal?: 'yes' | 'no' | 'unknown'
  // Pack size as printed.
  quantity?: string
  // Optional web link to a photo (real photo upload comes later).
  image_url?: string
  // Where the information comes from (10-500 characters); helps the moderator check it.
  note: string
}

// A submission as its owner sees it.
export interface Submission {
  id: number
  // A brand new product, or a correction to an existing one.
  type: 'new_product' | 'correction'
  barcode: string
  // The proposed or existing product name.
  name: string | null
  // Waiting for a moderator, accepted, or turned down.
  status: 'pending' | 'approved' | 'rejected'
  // What the moderator told the contributor.
  review_note: string | null
  created_at: string
}

// Send in a new product or a correction (needs a confirmed email address).
export const createSubmission = (token: string, input: SubmissionInput) => request<Submission>('POST', '/submissions', { token, body: input })

// The person's own submissions, newest first.
export const fetchMySubmissions = (token: string) => request<Submission[]>('GET', '/submissions/mine', { token })

// Tell the server to invalidate this token.
export const logout = (token: string) => request<void>('POST', '/auth/logout', { token })
