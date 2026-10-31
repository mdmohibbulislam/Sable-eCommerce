import { clearTokens, getTokens, setTokens } from './tokens'

const BASE_URL = (
  import.meta.env.VITE_API_URL ?? 'http://127.0.0.1:8000/api'
).replace(/\/$/, '')

export class ApiError extends Error {
  status: number
  data: unknown

  constructor(status: number, data: unknown) {
    super(`Request failed with status ${status}`)
    this.name = 'ApiError'
    this.status = status
    this.data = data
  }
}

export interface RequestOptions {
  method?: string
  body?: unknown
  auth?: boolean
  form?: boolean
  signal?: AbortSignal
}

async function parseBody(response: Response): Promise<unknown> {
  if (response.status === 204) return null
  const text = await response.text()
  if (!text) return null
  try {
    return JSON.parse(text)
  } catch {
    return text
  }
}

let refreshInFlight: Promise<boolean> | null = null

async function refreshAccessToken(): Promise<boolean> {
  const tokens = getTokens()
  if (!tokens?.refresh) return false

  if (!refreshInFlight) {
    refreshInFlight = (async () => {
      try {
        const response = await fetch(`${BASE_URL}/auth/token/refresh/`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ refresh: tokens.refresh }),
        })
        if (!response.ok) return false
        const data = (await response.json()) as {
          access: string
          refresh?: string
        }
        setTokens({ access: data.access, refresh: data.refresh ?? tokens.refresh })
        return true
      } catch {
        return false
      } finally {
        refreshInFlight = null
      }
    })()
  }

  return refreshInFlight
}

export async function request<T>(
  path: string,
  options: RequestOptions = {},
): Promise<T> {
  const { method = 'GET', body, auth = true, form = false, signal } = options

  const headers: Record<string, string> = { Accept: 'application/json' }
  const tokens = getTokens()
  if (auth && tokens?.access) headers.Authorization = `Bearer ${tokens.access}`

  let payload: BodyInit | undefined
  if (body !== undefined) {
    if (form) {
      payload = body as FormData
    } else {
      headers['Content-Type'] = 'application/json'
      payload = JSON.stringify(body)
    }
  }

  let response = await fetch(`${BASE_URL}${path}`, {
    method,
    headers,
    body: payload,
    signal,
  })

  if (response.status === 401 && auth && tokens?.refresh) {
    const refreshed = await refreshAccessToken()
    if (refreshed) {
      const next = getTokens()
      response = await fetch(`${BASE_URL}${path}`, {
        method,
        headers: { ...headers, Authorization: `Bearer ${next?.access}` },
        body: payload,
        signal,
      })
    } else {
      clearTokens()
    }
  }

  const data = await parseBody(response)
  if (!response.ok) throw new ApiError(response.status, data)
  return data as T
}

export const api = {
  get: <T>(path: string, options?: { signal?: AbortSignal }) =>
    request<T>(path, { ...options }),
  post: <T>(path: string, body?: unknown, options?: RequestOptions) =>
    request<T>(path, { ...options, method: 'POST', body }),
  patch: <T>(path: string, body?: unknown, options?: RequestOptions) =>
    request<T>(path, { ...options, method: 'PATCH', body }),
  delete: <T>(path: string) => request<T>(path, { method: 'DELETE' }),
}

export function query(
  params: Record<string, string | number | boolean | undefined | null>,
): string {
  const search = new URLSearchParams()
  for (const [key, value] of Object.entries(params)) {
    if (value === undefined || value === null || value === '' || value === false) {
      continue
    }
    search.set(key, String(value))
  }
  const text = search.toString()
  return text ? `?${text}` : ''
}

const FIELD_LABELS: Record<string, string> = {
  non_field_errors: '',
  detail: '',
  email: 'Email',
  password: 'Password',
  password_confirm: 'Confirm password',
  items: 'Cart',
  shipping: 'Shipping',
  line1: 'Address',
  postal_code: 'Postal code',
  full_name: 'Full name',
  current_password: 'Current password',
  new_password: 'New password',
  status: 'Status',
  price: 'Price',
  stock: 'Stock',
}

function flatten(value: unknown): string {
  if (value == null) return ''
  if (typeof value === 'string') return value
  if (Array.isArray(value)) return value.map(flatten).filter(Boolean).join(' ')
  if (typeof value === 'object') {
    const record = value as Record<string, unknown>
    if (typeof record.detail === 'string') return record.detail
    return Object.entries(record)
      .map(([key, nested]) => {
        const text = flatten(nested)
        const label = FIELD_LABELS[key] ?? key.replace(/_/g, ' ')
        return label ? `${label}: ${text}` : text
      })
      .filter(Boolean)
      .join(' ')
  }
  return String(value)
}

/** Turn a DRF validation payload into one readable sentence. */
export function errorMessage(error: unknown): string {
  if (error instanceof ApiError) {
    const text = flatten(error.data)
    return text || `Request failed (${error.status}).`
  }
  if (error instanceof Error) return error.message
  return 'Something went wrong. Please try again.'
}
