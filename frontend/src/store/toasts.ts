import { create } from 'zustand'

export type ToastTone = 'success' | 'error' | 'info'

export interface Toast {
  id: number
  message: string
  tone: ToastTone
}

interface ToastState {
  toasts: Toast[]
  push: (message: string, tone?: ToastTone) => void
  dismiss: (id: number) => void
}

let sequence = 0

export const useToasts = create<ToastState>((set, get) => ({
  toasts: [],

  push(message, tone = 'success') {
    const id = ++sequence
    set({ toasts: [...get().toasts, { id, message, tone }] })
    window.setTimeout(() => get().dismiss(id), 4000)
  },

  dismiss(id) {
    set({ toasts: get().toasts.filter((toast) => toast.id !== id) })
  },
}))

export const toast = {
  success: (message: string) => useToasts.getState().push(message, 'success'),
  error: (message: string) => useToasts.getState().push(message, 'error'),
  info: (message: string) => useToasts.getState().push(message, 'info'),
}
