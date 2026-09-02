"use client"

import { useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { X } from 'lucide-react'
import { useCart } from '@/context/cart-context'

export function CartOverlay() {
  const { lastAddedItem, clearLastAdded } = useCart()
  const router = useRouter()

  // 4 second baad khud gayab - pehle ye kabhi hatta hi nahi tha
  // aur bottom nav ko dhak leta tha.
  useEffect(() => {
    if (!lastAddedItem) return
    const t = setTimeout(clearLastAdded, 4000)
    return () => clearTimeout(t)
  }, [lastAddedItem, clearLastAdded])

  if (!lastAddedItem) return null

  return (
    <div className="fixed bottom-[calc(5.5rem+env(safe-area-inset-bottom))] left-3 right-3 z-[70] mx-auto flex max-w-md items-center justify-between gap-2 rounded-2xl border border-border bg-card p-3 shadow-xl">
      <span className="min-w-0 flex-1 truncate text-sm font-medium">
        {lastAddedItem.name} added to cart
      </span>
      <button
        onClick={() => {
          clearLastAdded()
          router.push('/cart')
        }}
        className="shrink-0 rounded-xl bg-primary px-4 py-2 text-sm font-semibold text-primary-foreground"
      >
        Checkout
      </button>
      <button
        onClick={clearLastAdded}
        aria-label="Close"
        className="shrink-0 rounded-full p-1 text-muted-foreground"
      >
        <X className="h-4 w-4" />
      </button>
    </div>
  )
}
