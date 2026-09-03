"use client"

import { createContext, useContext, useState, useEffect, ReactNode } from 'react'

export interface CartItem {
  id: number
  name: string
  price: number
  quantity: number
  size?: 'half' | 'full' | 'dry' | 'roll'
  image: string
  isVeg: boolean
  specialInstructions?: string
}

interface CartContextType {
  items: CartItem[]
  lastAddedItem?: CartItem
  /** false jab tak localStorage se cart load nahi hua - flicker rokne ke liye */
  hydrated: boolean
  addItem: (item: CartItem) => void
  removeItem: (id: number, size?: string) => void
  updateQuantity: (id: number, quantity: number, size?: string) => void
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
        if (Array.isArray(parsed)) setItems(parsed)
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
      const i = prev.findIndex(x => x.id === item.id && x.size === item.size)
      if (i >= 0) {
        const updated = [...prev]
        updated[i] = { ...updated[i], quantity: updated[i].quantity + item.quantity }
        return updated
      }
      return [...prev, item]
    })
  }

  const removeItem = (id: number, size?: string) => {
    setItems(prev => prev.filter(i => !(i.id === id && i.size === size)))
  }

  const updateQuantity = (id: number, quantity: number, size?: string) => {
    if (quantity <= 0) return removeItem(id, size)
    setItems(prev => prev.map(i => (i.id === id && i.size === size ? { ...i, quantity } : i)))
  }

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
