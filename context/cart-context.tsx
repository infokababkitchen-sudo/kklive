"use client"

import { createContext, useContext, useState, ReactNode } from 'react'

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
  addItem: (item: CartItem) => void
  removeItem: (id: number, size?: string) => void
  updateQuantity: (id: number, quantity: number, size?: string) => void
  clearCart: () => void
  getTotal: () => number
  getItemCount: () => number
}

const CartContext = createContext<CartContextType | undefined>(undefined)

export function CartProvider({ children }: { children: ReactNode }) {
  const [items, setItems] = useState<CartItem[]>([])

  const addItem = (item: CartItem) => {
    setItems(prev => {
      const existingIndex = prev.findIndex(
        i => i.id === item.id && i.size === item.size
      )
      if (existingIndex >= 0) {
        const updated = [...prev]
        updated[existingIndex].quantity += item.quantity
        return updated
      }
      return [...prev, item]
    })
  }

  const removeItem = (id: number, size?: string) => {
    setItems(prev => prev.filter(i => !(i.id === id && i.size === size)))
  }

  const updateQuantity = (id: number, quantity: number, size?: string) => {
    if (quantity <= 0) {
      removeItem(id, size)
      return
    }
    setItems(prev =>
      prev.map(i =>
        i.id === id && i.size === size ? { ...i, quantity } : i
      )
    )
  }

  const clearCart = () => setItems([])

  const getTotal = () => items.reduce((sum, item) => sum + item.price * item.quantity, 0)

  const getItemCount = () => items.reduce((sum, item) => sum + item.quantity, 0)

  return (
    <CartContext.Provider value={{ items, addItem, removeItem, updateQuantity, clearCart, getTotal, getItemCount }}>
      {children}
    </CartContext.Provider>
  )
}

export function useCart() {
  const context = useContext(CartContext)
  if (!context) {
    throw new Error('useCart must be used within a CartProvider')
  }
  return context
}
