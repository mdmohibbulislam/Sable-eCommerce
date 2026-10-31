import { create } from 'zustand'

import { api, errorMessage } from '../lib/api'
import { clearTokens, getTokens, setTokens } from '../lib/tokens'
import type { TokenResponse, User } from '../types'

const USER_KEY = 'sable.user'

export interface RegisterPayload {
  email: string
  password: string
  password_confirm: string
  first_name: string
  last_name: string
}

type AuthStatus = 'idle' | 'loading' | 'authenticated' | 'guest'

interface AuthState {
  user: User | null
  status: AuthStatus
  bootstrap: () => Promise<void>
  login: (email: string, password: string) => Promise<void>
  register: (payload: RegisterPayload) => Promise<void>
  logout: () => void
  updateProfile: (patch: Partial<User>) => Promise<void>
}

function readUser(): User | null {
  try {
    const raw = window.localStorage.getItem(USER_KEY)
    return raw ? (JSON.parse(raw) as User) : null
  } catch {
    return null
  }
}

function writeUser(user: User | null): void {
  try {
    if (user) window.localStorage.setItem(USER_KEY, JSON.stringify(user))
    else window.localStorage.removeItem(USER_KEY)
  } catch {
    /* ignore */
  }
}

export const useAuth = create<AuthState>((set, get) => ({
  user: readUser(),
  status: 'idle',

  async bootstrap() {
    if (!getTokens()?.access) {
      writeUser(null)
      set({ user: null, status: 'guest' })
      return
    }
    set({ status: 'loading' })
    try {
      const user = await api.get<User>('/auth/me/')
      writeUser(user)
      set({ user, status: 'authenticated' })
    } catch (error) {
      // A network blip should not sign the user out; only a real 401 should.
      const status = (error as { status?: number }).status
      if (status === 401) {
        clearTokens()
        writeUser(null)
        set({ user: null, status: 'guest' })
      } else {
        set({ status: get().user ? 'authenticated' : 'guest' })
      }
    }
  },

  async login(email, password) {
    const data = await api.post<TokenResponse>(
      '/auth/token/',
      { email, password },
      { auth: false },
    )
    setTokens({ access: data.access, refresh: data.refresh })
    writeUser(data.user)
    set({ user: data.user, status: 'authenticated' })
  },

  async register(payload) {
    const data = await api.post<TokenResponse>('/auth/register/', payload, {
      auth: false,
    })
    setTokens({ access: data.access, refresh: data.refresh })
    writeUser(data.user)
    set({ user: data.user, status: 'authenticated' })
  },

  logout() {
    clearTokens()
    writeUser(null)
    set({ user: null, status: 'guest' })
  },

  async updateProfile(patch) {
    const user = await api.patch<User>('/auth/me/', patch)
    writeUser(user)
    set({ user })
  },
}))

export function authErrorMessage(error: unknown): string {
  const status = (error as { status?: number }).status
  if (status === 401) return 'Email or password is incorrect.'
  return errorMessage(error)
}
