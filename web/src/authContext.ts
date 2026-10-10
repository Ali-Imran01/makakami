// The shared "who is signed in" value and the hook pages use to read it.
import { createContext, useContext } from 'react'
import type { AuthUser } from './authApi'

// What every page can use.
export interface AuthState {
  // The signed-in person, or null for a guest.
  user: AuthUser | null
  // The token (needed to call protected endpoints), or null for a guest.
  token: string | null
  // True while we are still checking a saved token on page load (so pages don't flash the login screen).
  loading: boolean
  // Log in; rejects with ApiError (422) when the credentials are wrong.
  login: (email: string, password: string) => Promise<void>
  // Sign up and log in; rejects with ApiError (422) listing what is wrong.
  register: (input: { name: string; email: string; password: string; termsVersion: string }) => Promise<void>
  // Log out here and on the server.
  logout: () => Promise<void>
  // Re-read the person from the server (e.g. after they confirmed their email in another tab).
  refresh: () => Promise<void>
}

// The shared value (null outside the provider, which would be a programming mistake).
export const AuthContext = createContext<AuthState | null>(null)

// Use inside any component: const { user, login } = useAuth().
export function useAuth(): AuthState {
  // Read the value from the nearest <AuthProvider>.
  const ctx = useContext(AuthContext)
  // Using it outside the provider is a bug: fail loudly.
  if (!ctx) throw new Error('useAuth must be used inside <AuthProvider>')
  return ctx
}