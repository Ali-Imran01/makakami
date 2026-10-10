// The one place every request to the API goes through.
// In a normal build it is a plain fetch() to the Laravel API. In the showcase build (`vite --mode demo`, VITE_DEMO=true)
// the request is answered inside the browser from dummy data instead, so the site works with no server at all.

// Base URL of the Laravel API; set in web/.env as VITE_API_URL, with a local fallback.
const API_URL = import.meta.env.VITE_API_URL ?? 'http://localhost:8000/api'

// Send a request to the API (or to the built-in dummy API in the showcase). `path` starts with "/", e.g. "/categories".
export function apiFetch(path: string, init: RequestInit = {}): Promise<Response> {
  // Vite replaces this comparison with a constant at build time, so in a normal build the dummy-data code is never included.
  if (import.meta.env.VITE_DEMO === 'true') {
    return import('./demo/mockApi').then((m) => m.handle(path, init))
  }
  return fetch(`${API_URL}${path}`, init)
}
