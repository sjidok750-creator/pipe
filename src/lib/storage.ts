// Namespaced localStorage wrapper — all keys prefixed with 'sp:'
const NS = 'sp'
const key = (k: string) => `${NS}:${k}`

export const storage = {
  get: <T = unknown>(k: string): T | null => {
    try {
      const raw = localStorage.getItem(key(k))
      return raw ? (JSON.parse(raw) as T) : null
    } catch { return null }
  },

  set: (k: string, value: unknown): void => {
    try {
      localStorage.setItem(key(k), JSON.stringify(value))
    } catch (e) {
      console.warn('[storage] write failed:', e)
    }
  },

  remove: (k: string): void => {
    try { localStorage.removeItem(key(k)) } catch { /* ignore */ }
  },
}
