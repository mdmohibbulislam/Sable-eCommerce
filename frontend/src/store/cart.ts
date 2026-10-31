import { create } from 'zustand'
import { persist } from 'zustand/middleware'

import type { Product } from '../types'

export interface CartItem {
  productId: number
  slug: string
  name: string
  price: number
  image: string
  stock: number
  quantity: number
}

interface CartState {
  items: CartItem[]
  add: (
    product: Pick<Product, 'id' | 'slug' | 'name' | 'price' | 'image_url' | 'stock'>,
    quantity?: number,
  ) => boolean
  setQuantity: (productId: number, quantity: number) => void
  remove: (productId: number) => void
  clear: () => void
}

const MAX_PER_LINE = 50

function clampQuantity(quantity: number, stock: number): number {
  const ceiling = stock > 0 ? Math.min(stock, MAX_PER_LINE) : MAX_PER_LINE
  return Math.max(1, Math.min(quantity, ceiling))
}

export const useCart = create<CartState>()(
  persist(
    (set, get) => ({
      items: [],

      add(product, quantity = 1) {
        if (product.stock <= 0) return false
        const items = get().items.map((item) => ({ ...item }))
        const existing = items.find((item) => item.productId === product.id)

        if (existing) {
          existing.quantity = clampQuantity(
            existing.quantity + quantity,
            product.stock,
          )
          existing.price = product.price
          existing.stock = product.stock
          existing.name = product.name
          existing.image = product.image_url
        } else {
          items.push({
            productId: product.id,
            slug: product.slug,
            name: product.name,
            price: product.price,
            image: product.image_url,
            stock: product.stock,
            quantity: clampQuantity(quantity, product.stock),
          })
        }

        set({ items })
        return true
      },

      setQuantity(productId, quantity) {
        set({
          items: get().items.map((item) =>
            item.productId === productId
              ? { ...item, quantity: clampQuantity(quantity, item.stock) }
              : item,
          ),
        })
      },

      remove(productId) {
        set({ items: get().items.filter((item) => item.productId !== productId) })
      },

      clear() {
        set({ items: [] })
      },
    }),
    { name: 'sable.cart', version: 1 },
  ),
)

export const cartCount = (items: CartItem[]): number =>
  items.reduce((total, item) => total + item.quantity, 0)

export const cartSubtotal = (items: CartItem[]): number =>
  items.reduce((total, item) => total + item.price * item.quantity, 0)
