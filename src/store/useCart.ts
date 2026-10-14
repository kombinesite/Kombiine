import { create } from 'zustand'
import { persist } from 'zustand/middleware'
import type { CartItem } from '../types'

interface CartState {
  items: CartItem[]
  coupon: string | null
  add: (item: CartItem) => void
  setQty: (productId: string, variant: string, qty: number) => void
  remove: (productId: string, variant: string) => void
  clear: () => void
  applyCoupon: (code: string | null) => void
}

export const useCart = create<CartState>()(
  persist(
    (set) => ({
      items: [],
      coupon: null,
      add: (item) =>
        set((s) => {
          const idx = s.items.findIndex(
            (i) => i.productId === item.productId && i.variant === item.variant,
          )
          if (idx >= 0) {
            const items = [...s.items]
            items[idx] = { ...items[idx], qty: Math.min(items[idx].qty + item.qty, 99) }
            return { items }
          }
          return { items: [...s.items, item] }
        }),
      setQty: (productId, variant, qty) =>
        set((s) => ({
          items:
            qty <= 0
              ? s.items.filter((i) => !(i.productId === productId && i.variant === variant))
              : s.items.map((i) =>
                  i.productId === productId && i.variant === variant
                    ? { ...i, qty: Math.min(qty, 99) }
                    : i,
                ),
        })),
      remove: (productId, variant) =>
        set((s) => ({
          items: s.items.filter((i) => !(i.productId === productId && i.variant === variant)),
        })),
      clear: () => set({ items: [], coupon: null }),
      applyCoupon: (code) => set({ coupon: code }),
    }),
    { name: 'kombine-cart-v1' },
  ),
)

export const cartCount = (items: CartItem[]) => items.reduce((n, i) => n + i.qty, 0)
