"use client"

import Image from 'next/image'
import { useEffect, useState } from 'react'

export function SplashScreen() {
  const [visible, setVisible] = useState(true)
  useEffect(() => {
    const timer = window.setTimeout(() => setVisible(false), 1400)
    return () => window.clearTimeout(timer)
  }, [])
  if (!visible) return null
  return (
    <div className="fixed inset-0 z-[100] grid place-items-center bg-background transition-opacity duration-500" role="status" aria-label="Loading Kabab Kitchen">
      <div className="flex flex-col items-center gap-5 animate-in fade-in zoom-in-95 duration-700">
        <Image src="/images/kabablogo.png" alt="Kabab Kitchen" width={200} height={200} priority className="object-contain" />
        <div className="h-1 w-24 overflow-hidden rounded-full bg-muted"><div className="h-full w-1/2 animate-pulse rounded-full bg-primary" /></div>
        <p className="text-sm font-medium text-muted-foreground">Freshly grilled, made for you</p>
      </div>
    </div>
  )
}

export function CartAddedOverlay({ itemName, onCheckout }: { itemName: string; onCheckout: () => void }) {
  return <div className="fixed bottom-20 left-3 right-3 z-[70] flex items-center justify-between gap-3 rounded-2xl border border-border bg-card p-3 shadow-xl animate-in slide-in-from-bottom-4"><p className="truncate text-sm font-medium">{itemName} added to cart</p><button onClick={onCheckout} className="shrink-0 rounded-xl bg-primary px-4 py-2 text-sm font-semibold text-primary-foreground">View cart</button></div>
}
