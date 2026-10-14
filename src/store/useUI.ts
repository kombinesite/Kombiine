import { create } from 'zustand'

export interface Toast {
  id: number
  message: string
  tone: 'success' | 'error' | 'info'
}

interface UIState {
  cartOpen: boolean
  setCartOpen: (v: boolean) => void
  searchOpen: boolean
  setSearchOpen: (v: boolean) => void
  toasts: Toast[]
  toast: (message: string, tone?: Toast['tone']) => void
  dismissToast: (id: number) => void
}

let toastId = 0

export const useUI = create<UIState>((set) => ({
  cartOpen: false,
  setCartOpen: (v) => set({ cartOpen: v }),
  searchOpen: false,
  setSearchOpen: (v) => set({ searchOpen: v }),
  toasts: [],
  toast: (message, tone = 'success') =>
    set((s) => {
      const id = ++toastId
      setTimeout(() => set((st) => ({ toasts: st.toasts.filter((t) => t.id !== id) })), 3200)
      return { toasts: [...s.toasts, { id, message, tone }] }
    }),
  dismissToast: (id) => set((s) => ({ toasts: s.toasts.filter((t) => t.id !== id) })),
}))
