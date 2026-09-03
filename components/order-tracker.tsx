"use client"

import { useCallback, useEffect, useState } from 'react'
import { Check, ChefHat, Bike, Clock, X, PackageCheck } from 'lucide-react'
import { cn } from '@/lib/utils'

const KEY = 'kk-active-order'

/** Called from checkout so the tracker knows what to follow. */
export function rememberOrder(code: string) {
  try {
    localStorage.setItem(KEY, JSON.stringify({ code, at: Date.now() }))
    window.dispatchEvent(new Event('kk-order-placed'))
  } catch {
    // private mode: tracking just will not appear
  }
}

interface Tracked {
  code: string
  status: string
  total: number
  created_at: string
}

const STEPS = [
  { key: 'new', label: 'Order placed', sub: 'Waiting for the kitchen to accept', icon: Clock },
  { key: 'accepted', label: 'Accepted', sub: 'The kitchen has your order', icon: Check },
  { key: 'preparing', label: 'Being prepared', sub: 'Your food is on the grill', icon: ChefHat },
  { key: 'out', label: 'Out for delivery', sub: 'On the way to you', icon: Bike },
  { key: 'delivered', label: 'Delivered', sub: 'Enjoy your meal', icon: PackageCheck },
]

export function OrderTracker() {
  const [code, setCode] = useState<string | null>(null)
  const [order, setOrder] = useState<Tracked | null>(null)
  const [open, setOpen] = useState(false)
  const [busy, setBusy] = useState(false)

  const forget = useCallback(() => {
    try {
      localStorage.removeItem(KEY)
    } catch {
      /* ignore */
    }
    setCode(null)
    setOrder(null)
    setOpen(false)
  }, [])

  // pick up an order placed in this browser
  useEffect(() => {
    const read = () => {
      try {
        const raw = localStorage.getItem(KEY)
        if (!raw) return setCode(null)
        const saved = JSON.parse(raw)
        // stop following after 6 hours so it does not linger for ever
        if (Date.now() - (saved.at || 0) > 6 * 3600e3) {
          localStorage.removeItem(KEY)
          return setCode(null)
        }
        setCode(saved.code)
        setOpen(true)
      } catch {
        setCode(null)
      }
    }
    read()
    window.addEventListener('kk-order-placed', read)
    return () => window.removeEventListener('kk-order-placed', read)
  }, [])

  // poll for status
  useEffect(() => {
    if (!code) return
    let stop = false
    const load = async () => {
      try {
        const res = await fetch('/api/orders/track?code=' + encodeURIComponent(code), {
          cache: 'no-store',
        })
        if (res.status === 404) return forget()
        if (!res.ok) return
        const d = await res.json()
        if (!stop) setOrder(d.order)
      } catch {
        /* keep the last known status */
      }
    }
    load()
    const t = setInterval(load, 15000)
    return () => {
      stop = true
      clearInterval(t)
    }
  }, [code, forget])

  if (!code || !order) return null

  const cancelled = order.status === 'cancelled'
  const stepIndex = STEPS.findIndex(s => s.key === order.status)
  const current = STEPS[stepIndex] || STEPS[0]

  async function confirmReceived() {
    setBusy(true)
    try {
      await fetch('/api/orders/track', {
        method: 'PATCH',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify({ code }),
      })
      setOrder(o => (o ? { ...o, status: 'delivered' } : o))
    } finally {
      setBusy(false)
    }
  }

  // collapsed pill
  if (!open) {
    return (
      <button
        onClick={() => setOpen(true)}
        className="fixed bottom-[calc(5.5rem+env(safe-area-inset-bottom))] left-3 right-3 z-[75] mx-auto flex max-w-md items-center gap-2 rounded-2xl border border-border bg-card p-3 shadow-xl"
      >
        <current.icon className="h-5 w-5 shrink-0 text-primary" />
        <span className="min-w-0 flex-1 text-left text-sm font-medium">
          {cancelled ? 'Order declined' : current.label}
        </span>
        <span className="shrink-0 text-xs text-primary">Track</span>
      </button>
    )
  }

  return (
    <div className="fixed inset-0 z-[92]">
      <div className="absolute inset-0 bg-black/50" onClick={() => setOpen(false)} />
      <div className="absolute bottom-0 left-0 right-0 mx-auto max-w-md rounded-t-2xl bg-background p-4 pb-[calc(1rem+env(safe-area-inset-bottom))]">
        <div className="flex items-start justify-between gap-3">
          <div>
            <p className="text-base font-bold">{order.code}</p>
            <p className="text-xs text-muted-foreground">Rs.{order.total}</p>
          </div>
          <button
            onClick={() => setOpen(false)}
            aria-label="Close"
            className="flex h-8 w-8 items-center justify-center rounded-full bg-muted"
          >
            <X className="h-4 w-4 text-muted-foreground" />
          </button>
        </div>

        {cancelled ? (
          <div className="mt-4 rounded-xl border border-red-300 bg-red-50 p-3">
            <p className="text-sm font-semibold text-red-800">
              The kitchen could not take this order
            </p>
            <p className="mt-1 text-xs text-red-700">
              Please call us if you were expecting it to go through.
            </p>
          </div>
        ) : (
          <div className="mt-4 space-y-0">
            {STEPS.map((s, i) => {
              const done = i < stepIndex
              const now = i === stepIndex
              const Icon = s.icon
              return (
                <div key={s.key} className="flex gap-3">
                  <div className="flex flex-col items-center">
                    <div
                      className={cn(
                        'flex h-8 w-8 shrink-0 items-center justify-center rounded-full border-2',
                        done && 'border-green-600 bg-green-600 text-white',
                        now && 'border-primary bg-primary text-primary-foreground',
                        !done && !now && 'border-muted text-muted-foreground'
                      )}
                    >
                      <Icon className="h-4 w-4" />
                    </div>
                    {i < STEPS.length - 1 && (
                      <div
                        className={cn(
                          'w-0.5 flex-1 min-h-6',
                          i < stepIndex ? 'bg-green-600' : 'bg-muted'
                        )}
                      />
                    )}
                  </div>
                  <div className={cn('pb-4', !done && !now && 'opacity-45')}>
                    <p className="text-sm font-semibold">{s.label}</p>
                    <p className="text-xs text-muted-foreground">{s.sub}</p>
                  </div>
                </div>
              )
            })}
          </div>
        )}

        {order.status === 'out' && (
          <button
            onClick={confirmReceived}
            disabled={busy}
            className="mt-2 w-full rounded-xl bg-primary p-3 text-sm font-bold text-primary-foreground disabled:opacity-50"
          >
            {busy ? 'Confirming...' : 'I have received my order'}
          </button>
        )}

        {order.status === 'delivered' && (
          <button
            onClick={forget}
            className="mt-2 w-full rounded-xl border p-3 text-sm font-semibold"
          >
            Done
          </button>
        )}
      </div>
    </div>
  )
}
