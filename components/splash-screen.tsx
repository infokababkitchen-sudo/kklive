"use client"

import Image from 'next/image'
import { useEffect, useState } from 'react'

const SPLASH_MS = 1100

export function SplashScreen() {
  const [visible, setVisible] = useState(true)
  const [leaving, setLeaving] = useState(false)

  useEffect(() => {
    // start fading a little before we unmount so it does not snap away
    const fade = window.setTimeout(() => setLeaving(true), SPLASH_MS - 250)
    const done = window.setTimeout(() => setVisible(false), SPLASH_MS)
    return () => {
      window.clearTimeout(fade)
      window.clearTimeout(done)
    }
  }, [])

  if (!visible) return null

  return (
    <div
      className={
        'fixed inset-0 z-[100] grid place-items-center bg-background transition-opacity duration-300 ' +
        (leaving ? 'opacity-0' : 'opacity-100')
      }
      role="status"
      aria-label="Loading Kabab Kitchen"
    >
      <div className="flex flex-col items-center gap-5">
        <Image
          src="/images/kabablogo.png"
          alt="Kabab Kitchen"
          width={200}
          height={200}
          priority
          className="object-contain"
        />
        {/* fills 0 to 100 over the splash, instead of sitting at half */}
        <div className="h-1 w-28 overflow-hidden rounded-full bg-muted">
          <div className="kk-splash-bar h-full rounded-full bg-primary" />
        </div>
        <p className="text-sm font-medium text-muted-foreground">
          Freshly grilled, made for you
        </p>
      </div>
    </div>
  )
}

export function CartAddedOverlay({
  itemName,
  onCheckout,
}: {
  itemName: string
  onCheckout: () => void
}) {
  return (
    <div className="fixed bottom-20 left-3 right-3 z-[70] flex items-center justify-between gap-3 rounded-2xl border border-border bg-card p-3 shadow-xl animate-in slide-in-from-bottom-4">
      <p className="truncate text-sm font-medium">{itemName} added to cart</p>
      <button
        onClick={onCheckout}
        className="shrink-0 rounded-xl bg-primary px-4 py-2 text-sm font-semibold text-primary-foreground"
      >
        View cart
      </button>
    </div>
  )
}
