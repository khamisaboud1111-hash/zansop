'use client'

import { createContext, useContext, useEffect, useState, ReactNode } from 'react'
import { create } from 'zustand'
import { persist } from 'zustand/middleware'
import type { CartItem, Product } from '@/types'
import type { Language } from '@/i18n/translations'

export type { Language }

export type Theme = 'light' | 'dark'

interface CartState {
  items: CartItem[]
  isOnline: boolean
  lastSynced: number
  addItem: (product: Product, quantity?: number) => void
  removeItem: (productId: string) => void
  updateQuantity: (productId: string, quantity: number) => void
  clearCart: () => void
  setOnlineStatus: (online: boolean) => void
  syncCart: () => void
}

interface UiState {
  sidebarOpen: boolean
  setSidebarOpen: (open: boolean) => void
  toggleSidebar: () => void
}

interface LangState {
  lang: Language
  setLang: (lang: Language) => void
}

interface ThemeState {
  theme: Theme
  hasHydrated: boolean
  highContrast: boolean
  toggleTheme: () => void
  setTheme: (theme: Theme) => void
  toggleHighContrast: () => void
}

export interface Stores {
  useCartStore: ReturnType<typeof createCartStore>
  useUiStore: ReturnType<typeof createUiStore>
  useLangStore: ReturnType<typeof createLangStore>
  useThemeStore: ReturnType<typeof createThemeStore>
}

const StoresContext = createContext<Stores | null>(null)

export function useStores() {
  const ctx = useContext(StoresContext)
  if (!ctx) throw new Error('useStores must be used within StoresProvider')
  return ctx
}

function createCartStore() {
  return create<CartState>()(
    persist(
      (set, get) => ({
        items: [],
        isOnline: true,
        lastSynced: 0,
        addItem: (product, quantity = 1) => {
          set((state) => {
            const existing = state.items.find((i) => i.product.id === product.id)
            if (existing) {
              return {
                items: state.items.map((i) =>
                  i.product.id === product.id
                    ? { ...i, quantity: Math.min(i.quantity + quantity, product.stock_quantity) }
                    : i
                ),
              }
            }
            return { items: [...state.items, { product, quantity }] }
          })
        },
        removeItem: (productId) => {
          set((state) => ({
            items: state.items.filter((i) => i.product.id !== productId),
          }))
        },
        updateQuantity: (productId, quantity) => {
          if (quantity <= 0) {
            get().removeItem(productId)
            return
          }
          set((state) => ({
            items: state.items.map((i) =>
              i.product.id === productId ? { ...i, quantity } : i
            ),
          }))
        },
        clearCart: () => set({ items: [] }),
        setOnlineStatus: (online) => {
          set({ isOnline: online })
          if (online) get().syncCart()
        },
        syncCart: () => {
          set({ lastSynced: Date.now() })
        },
      }),
      {
        name: 'zanshop-cart',
        skipHydration: true,
        partialize: (state) => ({
          items: state.items.map(({ product, quantity }) => ({
            product: {
              id: product.id,
              name: product.name,
              price: product.price,
              compare_at_price: product.compare_at_price,
              stock_quantity: product.stock_quantity,
              seller_id: product.seller_id,
              seller: product.seller ? { store_name: product.seller.store_name } : undefined,
              images: product.images?.map(img => ({ url: img.url, is_primary: img.is_primary })) ?? [],
            },
            quantity,
          })),
        }),
      }
    )
  )
}

function createUiStore() {
  return create<UiState>()((set) => ({
    sidebarOpen: false,
    setSidebarOpen: (open: boolean) => set({ sidebarOpen: open }),
    toggleSidebar: () => set((state) => ({ sidebarOpen: !state.sidebarOpen })),
  }))
}

function createLangStore() {
  return create<LangState>()(() => ({
    lang: 'sw',
    setLang: (lang: Language) => {
      if (typeof document !== 'undefined') {
        document.documentElement.dir = lang === 'ar' ? 'rtl' : 'ltr'
        document.cookie = `lang=${lang}; path=/; max-age=31536000`
      }
    },
  }))
}

function createThemeStore() {
  return create<ThemeState>()(() => ({
    theme: 'light',
    hasHydrated: true,
    highContrast: false,
    toggleTheme: () => {
      if (typeof document === 'undefined') return
      const next = document.documentElement.classList.contains('dark') ? 'light' : 'dark'
      document.documentElement.classList.toggle('dark', next === 'dark')
      document.cookie = `theme=${next}; path=/; max-age=31536000`
    },
    setTheme: (theme: Theme) => {
      if (typeof document === 'undefined') return
      document.documentElement.classList.toggle('dark', theme === 'dark')
      document.cookie = `theme=${theme}; path=/; max-age=31536000`
    },
    toggleHighContrast: () => {
      if (typeof document === 'undefined') return
      document.documentElement.classList.toggle('high-contrast')
    },
  }))
}

export function StoresProvider({ children }: { children: ReactNode }) {
  const [stores] = useState(() => ({
    useCartStore: createCartStore(),
    useUiStore: createUiStore(),
    useLangStore: createLangStore(),
    useThemeStore: createThemeStore(),
  }))

  useEffect(() => {
    try {
      stores.useCartStore.persist?.rehydrate()
    } catch {
      // Persist is a convenience, never hard-require it.
    }

    const handleOnline = () => stores.useCartStore.getState().setOnlineStatus(true)
    const handleOffline = () => stores.useCartStore.getState().setOnlineStatus(false)
    try {
      window.addEventListener('online', handleOnline)
      window.addEventListener('offline', handleOffline)
      stores.useCartStore.getState().setOnlineStatus(navigator.onLine)
    } catch {
      // Online-status tracking is a convenience, never hard-require it.
    }

    return () => {
      try {
        window.removeEventListener('online', handleOnline)
        window.removeEventListener('offline', handleOffline)
      } catch {
        // Best-effort cleanup only.
      }
    }
  }, [])

  return (
    <StoresContext.Provider value={stores}>
      {children}
    </StoresContext.Provider>
  )
}

export function useCartStore<T = CartState>(selector?: (state: CartState) => T): T extends CartState ? CartState : T {
  const store = useStores().useCartStore
  return (selector ? store(selector) : store()) as T extends CartState ? CartState : T
}

export function useUiStore<T = UiState>(selector?: (state: UiState) => T): T extends UiState ? UiState : T {
  const store = useStores().useUiStore
  return (selector ? store(selector) : store()) as T extends UiState ? UiState : T
}

export function useLangStore<T = LangState>(selector?: (state: LangState) => T): T extends LangState ? LangState : T {
  const store = useStores().useLangStore
  return (selector ? store(selector) : store()) as T extends LangState ? LangState : T
}

export function useThemeStore<T = ThemeState>(selector?: (state: ThemeState) => T): T extends ThemeState ? ThemeState : T {
  const store = useStores().useThemeStore
  return (selector ? store(selector) : store()) as T extends ThemeState ? ThemeState : T
}

export const selectCartItemCount = (state: { items: CartItem[] }) =>
  state.items.reduce((sum, item) => sum + item.quantity, 0)

export const selectCartSubtotal = (state: { items: CartItem[] }) =>
  state.items.reduce((sum, item) => (item.product?.price ?? 0) * item.quantity + sum, 0)

export const selectCartTotalSavings = (state: { items: CartItem[] }) =>
  state.items.reduce((sum, item) => {
    const originalPrice = item.product?.compare_at_price ?? item.product?.price ?? 0
    const currentPrice = item.product?.price ?? 0
    return sum + Math.max(0, (originalPrice - currentPrice) * item.quantity)
  }, 0)

export type { CartState, UiState, LangState, ThemeState }