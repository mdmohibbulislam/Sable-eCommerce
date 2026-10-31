/** JWT storage kept separate from React state to avoid import cycles. */

export interface Tokens {
  access: string
  refresh: string
}

const STORAGE_KEY = 'sable.tokens'

function read(): Tokens | null {
  try {
    const raw = window.localStorage.getItem(STORAGE_KEY)
    return raw ? (JSON.parse(raw) as Tokens) : null
  } catch {
    return null
  }
}

let current: Tokens | null = typeof window === 'undefined' ? null : read()

export function getTokens(): Tokens | null {
  return current
}

export function setTokens(tokens: Tokens | null): void {
  current = tokens
  try {
    if (tokens) {
      window.localStorage.setItem(STORAGE_KEY, JSON.stringify(tokens))
    } else {
      window.localStorage.removeItem(STORAGE_KEY)
    }
  } catch {
    /* storage unavailable — keep the in-memory copy */
  }
}

export function clearTokens(): void {
  setTokens(null)
}
