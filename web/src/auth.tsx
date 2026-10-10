// React building blocks for sharing the signed-in person with every page.
import { useEffect, useState, type ReactNode } from 'react'
import { ApiError } from './api'
import { AuthContext, type AuthState } from './authContext'
import { fetchMe, login as apiLogin, logout as apiLogout, register as apiRegister, type AuthResult, type AuthUser } from './authApi'

// Key under which the login token is kept in the browser.
const TOKEN_KEY = 'authToken'

// Read the saved token; storage can be blocked, so never let that crash the app.
function readToken(): string | null {
  try {
    return localStorage.getItem(TOKEN_KEY)
  } catch {
    return null
  }
}

// Save or remove the token.
function writeToken(token: string | null) {
  try {
    if (token) localStorage.setItem(TOKEN_KEY, token)
    else localStorage.removeItem(TOKEN_KEY)
  } catch {
    // Storage unavailable: the person simply stays logged in only until the page is closed.
  }
}

// Wrap the app with this so every page knows who is signed in.
export function AuthProvider({ children }: { children: ReactNode }) {
  // Start with whatever token was saved; `loading` stays true until we have checked it.
  const [token, setToken] = useState<string | null>(readToken)
  const [user, setUser] = useState<AuthUser | null>(null)
  const [loading, setLoading] = useState(token !== null)

  // On page load: if we have a saved token, ask the server who it belongs to.
  useEffect(() => {
    // No token: nothing to check.
    if (!token) return
    // Ignore the answer if the effect was cleaned up before it arrived.
    let cancelled = false
    fetchMe(token)
      .then((u) => !cancelled && setUser(u))
      .catch((err) => {
        // 401 means the token expired or was revoked: forget it. A network error keeps the token so we can retry later.
        if (!cancelled && err instanceof ApiError && err.status === 401) {
          writeToken(null)
          setToken(null)
        }
      })
      .finally(() => !cancelled && setLoading(false))
    return () => {
      cancelled = true
    }
  }, [token])

  // Store a successful login/sign-up.
  const accept = (result: AuthResult) => {
    writeToken(result.token)
    setToken(result.token)
    setUser(result.user)
  }

  const value: AuthState = {
    user,
    token,
    loading,
    login: async (email, password) => accept(await apiLogin(email, password)),
    register: async (input) => accept(await apiRegister(input)),
    logout: async () => {
      // Tell the server first (ignore failures: we log out locally either way).
      if (token) await apiLogout(token).catch(() => {})
      writeToken(null)
      setToken(null)
      setUser(null)
    },
    refresh: async () => {
      if (token) setUser(await fetchMe(token))
    },
  }

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>
}
