import { create } from 'zustand'
import { persist } from 'zustand/middleware'
import type { Order, OrderStatus, Product, StoreSettings } from '../types'
import { DEFAULT_SETTINGS, SEED_PRODUCTS } from '../data/products'
import { apiUrl, persistStoreState } from '../lib/api'

interface StoreState {
  products: Product[]
  orders: Order[]
  settings: StoreSettings
  seedVersion: number
  upsertProduct: (p: Product) => void
  deleteProduct: (id: string) => void
  adjustStock: (id: string, delta: number) => void
  placeOrder: (order: Order) => void
  setOrderStatus: (id: string, status: OrderStatus) => void
  syncOrderStatusLocal: (id: string, status: OrderStatus) => void
  updateSettings: (s: Partial<StoreSettings>) => void
  resetDemo: () => void
  hydrateFromServer: (data: Partial<Pick<StoreState, 'products' | 'orders' | 'settings' | 'seedVersion'>>) => void
}

const SEED_VERSION = 4

export const useStore = create<StoreState>()(
  persist(
    (set) => ({
      products: SEED_PRODUCTS,
      orders: [],
      settings: DEFAULT_SETTINGS,
      seedVersion: SEED_VERSION,

      upsertProduct: (p) => set((s) => {
        const exists = s.products.some((x) => x.id === p.id)
        return { products: exists ? s.products.map((x) => (x.id === p.id ? p : x)) : [p, ...s.products] }
      }),

      deleteProduct: (id) => set((s) => ({ products: s.products.filter((p) => p.id !== id) })),

      adjustStock: (id, delta) => set((s) => ({ products: s.products.map((p) => p.id === id ? { ...p, stock: Math.max(0, p.stock + delta) } : p) })),

      placeOrder: (order) =>
        set((s) => {
          const alreadyExists = s.orders.some((existing) => existing.id === order.id)
          if (alreadyExists) return s
          const products = order.status === 'pago' ? s.products.map((p) => {
            const item = order.items.find((i) => i.productId === p.id)
            if (!item) return p
            return { ...p, stock: Math.max(0, p.stock - item.qty), sales: p.sales + item.qty }
          }) : s.products
          return { orders: [order, ...s.orders], products }
        }),

      setOrderStatus: (id, status) => {
        set((s) => {
          const current = s.orders.find((o) => o.id === id)
          if (!current || current.status === status) return s
          let products = s.products
          if (current.status !== 'pago' && status === 'pago') {
            products = products.map((p) => { const item = current.items.find((i) => i.productId === p.id); return item ? { ...p, stock: Math.max(0, p.stock - item.qty), sales: p.sales + item.qty } : p })
          } else if (current.status === 'pago' && status === 'cancelado') {
            products = products.map((p) => { const item = current.items.find((i) => i.productId === p.id); return item ? { ...p, stock: p.stock + item.qty, sales: Math.max(0, p.sales - item.qty) } : p })
          }
          return { products, orders: s.orders.map((o) => (o.id === id ? { ...o, status } : o)) }
        })
        void fetch(apiUrl(`/api/admin/orders/${encodeURIComponent(id)}/status`), {
          method: 'POST', credentials: 'include', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ status }),
        }).then(async (response) => {
          if (!response.ok) throw new Error(`Falha ao atualizar pedido (${response.status})`)
          const fresh = await fetch(apiUrl('/api/admin/store/state'), { credentials: 'include' })
          if (fresh.ok) useStore.getState().hydrateFromServer(await fresh.json())
        }).catch(async (error) => { console.warn('[Kombine] status do pedido não sincronizado:', error); try { const fresh = await fetch(apiUrl('/api/admin/store/state'), { credentials: 'include' }); if (fresh.ok) useStore.getState().hydrateFromServer(await fresh.json()) } catch { /* estado local permanece até reconexão */ } })
      },

      syncOrderStatusLocal: (id, status) => set((s) => ({ orders: s.orders.map((o) => o.id === id ? { ...o, status } : o) })),

      updateSettings: (partial) => set((s) => ({ settings: { ...s.settings, ...partial } })),

      resetDemo: () => {
        set({ products: SEED_PRODUCTS, orders: [], settings: DEFAULT_SETTINGS, seedVersion: SEED_VERSION })
        const state = useStore.getState(); void persistStoreState(state)
      },

      hydrateFromServer: (data) => set((s) => ({
        products: Array.isArray(data.products) ? data.products as Product[] : s.products,
        orders: Array.isArray(data.orders) ? data.orders as Order[] : s.orders,
        settings: data.settings && typeof data.settings === 'object' ? { ...s.settings, ...data.settings } : s.settings,
        seedVersion: data.seedVersion ?? s.seedVersion,
      })),
    }),
    {
      name: 'kombine-store-v1',
      version: SEED_VERSION,
      migrate: (state) => state as StoreState,
      merge: (persisted, current) => {
        const p = (persisted ?? {}) as Partial<StoreState>
        return {
          ...current,
          ...p,
          products: p.products ?? current.products,
          orders: p.orders ?? current.orders,
          settings: { ...current.settings, ...(p.settings ?? {}) },
          seedVersion: Math.max(p.seedVersion ?? 0, SEED_VERSION),
        }
      },
    },
  ),
)

export const productById = (products: Product[], id: string) => products.find((p) => p.id === id)
export const productBySlug = (products: Product[], slug: string) => products.find((p) => p.slug === slug)
