// Tiny helpers that keep the showcase's pretend accounts, submissions and reports in the visitor's own browser (localStorage).
// Nothing is ever sent anywhere. Every access is wrapped because storage can be blocked (private mode, blocked cookies).

// Read a list (empty if nothing is stored or the data is unreadable).
export function load<T>(key: string): T[] {
  try {
    const value: unknown = JSON.parse(localStorage.getItem(key) ?? '[]')
    return Array.isArray(value) ? (value as T[]) : []
  } catch {
    return []
  }
}

// Save a list (silently does nothing if storage is unavailable).
export function save<T>(key: string, items: T[]): void {
  try {
    localStorage.setItem(key, JSON.stringify(items))
  } catch {
    // Storage unavailable: the pretend data just won't persist.
  }
}
