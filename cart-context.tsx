"use client"

import { createContext, useContext, useState, useEffect, ReactNode } from 'react'

export interface CartAddOn {
  id: string
  name: string
  price: number
}

export interface CartItem {
  id: number
  name: string
  /** Base price plus every selected add-on, for one unit */
  price: number
  quantity: number
  size?: 'half' | 'full' | 'dry' | 'roll'
  image: string
  isVeg: boolean
  addOns?: CartAddOn[]
  cookingRequest?: string
  /**
   * Identifies one cart line. The same dish can sit in the cart twice with
   * different add-ons or a different cooking request, so id alone is not enough.
   */
  lineId: string
}

/** Builds the lineId from everything that makes a line distinct. */
export function makeLineId(
  id: number,
  size?: string,
  addOns?: { id: string }[],
  cookingRequest?: string
) {
  const a = (addOns || []).map(x => x.id).sort().join('+')
  return [id, size || '', a, (cookingRequest || '').trim()].join('|')
}

interface CartContextType {
  items: CartItem[]
  lastAddedItem?: CartItem
  /** false jab tak localStorage se cart load nahi hua - flicker rokne ke liye */
  hydrated: boolean
  addItem: (item: CartItem) => void
  removeItem: (lineId: string) => void
  updateQuantity: (lineId: string, quantity: number) => void
  /** Total units of a dish across every line, for the card badge */
  countForDish: (id: number) => number
  clearCart: () => void
  clearLastAdded: () => void
  getTotal: () => number
  getItemCount: () => number
}

const CartContext = createContext<CartContextType | undefined>(undefined)
const STORAGE_KEY = 'kk-cart-v1'

export function CartProvider({ children }: { children: ReactNode }) {
  const [items, setItems] = useState<CartItem[]>([])
  const [lastAddedItem, setLastAddedItem] = useState<CartItem>()
  const [hydrated, setHydrated] = useState(false)

  // Refresh ke baad cart wapis load karo.
  // Server par localStorage nahi hota, isliye pehla render hamesha khaali -
  // warna hydration mismatch aata hai.
  useEffect(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEY)
      if (saved) {
        const parsed = JSON.parse(saved)
        if (Array.isArray(parsed)) {
          setItems(
            parsed.map((i: CartItem) => ({
              ...i,
              lineId: i.lineId || makeLineId(i.id, i.size, i.addOns, i.cookingRequest),
            }))
          )
        }
      }
    } catch {
      // kharab data - ignore karo, khaali cart se shuru
    }
    setHydrated(true)
  }, [])

  // Har change par save
  useEffect(() => {
    if (!hydrated) return
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(items))
    } catch {
      // storage full ya blocked - cart phir bhi is session mein chalega
    }
  }, [items, hydrated])

  const addItem = (item: CartItem) => {
    setLastAddedItem(item)
    setItems(prev => {
      const i = prev.findIndex(x => x.lineId === item.lineId)
      if (i >= 0) {
        const updated = [...prev]
        updated[i] = { ...updated[i], quantity: updated[i].quantity + item.quantity }
        return updated
      }
      return [...prev, item]
    })
  }

  const removeItem = (lineId: string) => {
    setItems(prev => prev.filter(i => i.lineId !== lineId))
  }

  const updateQuantity = (lineId: string, quantity: number) => {
    if (quantity <= 0) return removeItem(lineId)
    setItems(prev => prev.map(i => (i.lineId === lineId ? { ...i, quantity } : i)))
  }

  const countForDish = (id: number) =>
    items.filter(i => i.id === id).reduce((s, i) => s + i.quantity, 0)

  const clearCart = () => setItems([])
  const clearLastAdded = () => setLastAddedItem(undefined)
  const getTotal = () => items.reduce((s, i) => s + i.price * i.quantity, 0)
  const getItemCount = () => items.reduce((s, i) => s + i.quantity, 0)

  return (
    <CartContext.Provider
      value={{
        items,
        lastAddedItem,
        hydrated,
        addItem,
        removeItem,
        updateQuantity,
        countForDish,
        clearCart,
        clearLastAdded,
        getTotal,
        getItemCount,
      }}
    >
      {children}
    </CartContext.Provider>
  )
}

export function useCart() {
  const context = useContext(CartContext)
  if (!context) throw new Error('useCart must be used within a CartProvider')
  return context
}
