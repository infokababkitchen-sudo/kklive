"use client"

import { useEffect } from 'react'
import { X, Gift, Truck, Tag, Percent, Lock } from 'lucide-react'
import { cn } from '@/lib/utils'

interface Coupon {
  id: string
  code: string
  title: string
  description: string
  type: string
  value: number
  minOrderValue: number
  terms?: string[]
}

/**
 * Offers sheet. Everything is listed, but only what the current subtotal
 * unlocks is tappable, and the rest says how much more is needed.
 */
export function CouponSheet({
  coupons,
  subtotal,
  onApply,
  onClose,
}: {
  coupons: Coupon[]
  subtotal: number
  onApply: (code: string) => void
  onClose: () => void
}) {
  useEffect(() => {
    const prev = document.body.style.overflow
    document.body.style.overflow = 'hidden'
    return () => {
      document.body.style.overflow = prev
    }
  }, [])

  const icon = (t: string) =>
    t === 'free_delivery' ? (
      <Truck className="h-4 w-4 text-green-600" />
    ) : t === 'free_item' ? (
      <Gift className="h-4 w-4 text-primary" />
    ) : t === 'percentage' ? (
      <Percent className="h-4 w-4 text-primary" />
    ) : (
      <Tag className="h-4 w-4 text-primary" />
    )

  const unlocked = coupons.filter(c => subtotal >= c.minOrderValue)
  const locked = coupons
    .filter(c => subtotal < c.minOrderValue)
    .sort((a, b) => a.minOrderValue - b.minOrderValue)
  const nextUp = locked[0]

  const Row = ({ c, ok }: { c: Coupon; ok: boolean }) => (
    <button
      key={c.id}
      disabled={!ok}
      onClick={() => ok && onApply(c.code)}
      className={cn(
        'w-full rounded-xl border p-3 text-left transition-all',
        ok ? 'border-primary/40 bg-primary/5 hover:border-primary' : 'border-border bg-muted/40'
      )}
    >
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0">
          <div className="flex items-center gap-2">
            {ok ? icon(c.type) : <Lock className="h-3.5 w-3.5 text-muted-foreground" />}
            <span
              className={cn(
                'text-sm font-bold tracking-wide',
                ok ? 'text-foreground' : 'text-muted-foreground'
              )}
            >
              {c.code}
            </span>
          </div>
          <p className="mt-0.5 text-xs text-muted-foreground">{c.description}</p>
          {!ok && (
            <p className="mt-1 text-xs font-medium text-amber-700">
              Add Rs.{c.minOrderValue - subtotal} more to unlock
            </p>
          )}
        </div>
        {ok && <span className="shrink-0 text-xs font-semibold text-primary">APPLY</span>}
      </div>
    </button>
  )

  return (
    <div className="fixed inset-0 z-[85]">
      <div className="absolute inset-0 bg-black/60" onClick={onClose} />
      <div className="absolute bottom-0 left-0 right-0 mx-auto flex max-h-[85dvh] max-w-lg flex-col rounded-t-2xl bg-background">
        <div className="flex shrink-0 items-start justify-between gap-3 border-b px-4 py-3">
          <div>
            <h2 className="text-base font-bold">Offers for you</h2>
            <p className="text-xs text-muted-foreground">
              Cart total Rs.{subtotal} &middot; {unlocked.length} of {coupons.length} unlocked
            </p>
          </div>
          <button
            onClick={onClose}
            aria-label="Close"
            className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-muted"
          >
            <X className="h-5 w-5 text-muted-foreground" />
          </button>
        </div>

        <div className="flex-1 space-y-4 overflow-y-auto overscroll-contain p-4 pb-[calc(1rem+env(safe-area-inset-bottom))]">
          {nextUp && (
            <div className="rounded-xl border border-amber-300 bg-amber-50 p-3">
              <p className="text-xs font-semibold text-amber-900">
                Add Rs.{nextUp.minOrderValue - subtotal} more to unlock {nextUp.code}
              </p>
              <p className="mt-0.5 text-xs text-amber-800">{nextUp.description}</p>
            </div>
          )}

          {unlocked.length > 0 && (
            <div className="space-y-2">
              <p className="text-xs font-semibold text-muted-foreground">
                Available now ({unlocked.length})
              </p>
              {unlocked.map(c => (
                <Row key={c.id} c={c} ok />
              ))}
            </div>
          )}

          {locked.length > 0 && (
            <div className="space-y-2">
              <p className="text-xs font-semibold text-muted-foreground">
                Unlock by spending more
              </p>
              {locked.map(c => (
                <Row key={c.id} c={c} ok={false} />
              ))}
            </div>
          )}

          {!coupons.length && (
            <p className="py-8 text-center text-sm text-muted-foreground">
              No offers running right now.
            </p>
          )}
        </div>
      </div>
    </div>
  )
}
