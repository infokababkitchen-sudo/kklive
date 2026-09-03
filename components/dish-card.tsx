"use client"

import { useEffect, useMemo, useState } from 'react'
import Image from 'next/image'
import { Plus, Minus, Star, Flame, Leaf, X } from 'lucide-react'
import { Badge } from '@/components/ui/badge'
import { useCart, makeLineId, CartAddOn } from '@/context/cart-context'
import { mediaFor } from '@/lib/menu-overrides'
import { DishMediaView } from '@/components/dish-media'
import { useMenu } from '@/hooks/use-menu'
import { Dish } from '@/types/menu'
import { cn } from '@/lib/utils'

interface DishCardProps {
  dish: Dish
  discountPercent?: number
}

type VariantKey = 'half' | 'full' | 'dry' | 'roll'
interface Choice {
  key: VariantKey
  label: string
  price: number
  note?: string
}

interface AddOnOption {
  id: string
  name: string
  price: number
  isVeg?: boolean
}
interface AddOnGroup {
  id: string
  name: string
  maxSelect: number
  appliesTo: string[]
  options: AddOnOption[]
}

function getChoices(dish: Dish): Choice[] {
  if (dish.variants?.length) return dish.variants as Choice[]
  const out: Choice[] = []
  if (dish.halfPrice) out.push({ key: 'half', label: 'Half', price: dish.halfPrice })
  if (dish.fullPrice) out.push({ key: 'full', label: 'Full', price: dish.fullPrice })
  return out
}

export function DishCard({ dish, discountPercent }: DishCardProps) {
  const [open, setOpen] = useState(false)
  const { addItem, countForDish } = useCart()
  const menu = useMenu()

  const choices = getChoices(dish)
  const groups = useMemo(() => {
    const all = ((menu as unknown as { addOnGroups?: AddOnGroup[] }).addOnGroups || [])
    return all.filter(g => g.appliesTo.includes('all') || g.appliesTo.includes(dish.category))
  }, [menu, dish.category])

  const outOfStock = dish.inStock === false
  const inCart = countForDish(dish.id)

  const basePrice = dish.price ?? choices[0]?.price ?? 0
  const discounted = (p: number) =>
    discountPercent ? Math.round(p * (1 - discountPercent / 100)) : p

  const needsSheet = choices.length > 0 || groups.length > 0

  const handleAdd = () => {
    if (outOfStock) return
    if (needsSheet) return setOpen(true)
    addItem({
      id: dish.id,
      name: dish.name,
      price: discounted(basePrice),
      quantity: 1,
      image: dish.image,
      isVeg: dish.isVeg,
      lineId: makeLineId(dish.id),
    })
  }

  const spice =
    dish.spiceLevel === 'hot' ? (
      <Flame className="w-3 h-3 text-red-500" />
    ) : dish.spiceLevel === 'medium' ? (
      <Flame className="w-3 h-3 text-amber-500" />
    ) : null

  return (
    <>
      <div
        className={cn(
          'bg-card rounded-xl border border-border overflow-hidden',
          outOfStock && 'opacity-60'
        )}
      >
        <div className="relative aspect-square">
          <DishMediaView
            media={mediaFor(dish)}
            alt={dish.name}
            className={cn(outOfStock && 'grayscale')}
          />
          <div className="absolute top-2 left-2 flex gap-1">
            {dish.isVeg && (
              <div className="w-5 h-5 bg-white rounded flex items-center justify-center">
                <Leaf className="w-3 h-3 text-green-600" />
              </div>
            )}
            {dish.isNew && !outOfStock && (
              <Badge className="bg-accent text-accent-foreground text-[10px] px-1.5 py-0.5">
                New
              </Badge>
            )}
          </div>

          {discountPercent && !outOfStock && (
            <Badge className="absolute top-2 right-2 bg-green-600 text-white text-[10px]">
              {discountPercent}% OFF
            </Badge>
          )}

          {outOfStock ? (
            <div className="absolute inset-0 flex items-center justify-center bg-black/40">
              <span className="rounded-full bg-background px-3 py-1 text-xs font-semibold">
                Out of stock
              </span>
            </div>
          ) : (
            <button
              onClick={handleAdd}
              className={cn(
                'absolute bottom-2 right-2 flex h-8 items-center gap-1 rounded-md px-3 text-xs font-semibold shadow',
                inCart > 0
                  ? 'bg-background text-primary border border-primary'
                  : 'bg-primary text-primary-foreground'
              )}
            >
              {inCart > 0 ? (
                <>
                  <span className="text-sm font-bold">{inCart}</span>
                  <span className="opacity-70">in cart</span>
                  <Plus className="w-3 h-3" />
                </>
              ) : (
                <>
                  <Plus className="w-3 h-3" />
                  Add
                </>
              )}
            </button>
          )}
        </div>

        <div className="p-3">
          <h3 className="font-semibold text-sm line-clamp-1">{dish.name}</h3>
          <div className="flex items-center gap-1 mt-1">
            <Star className="w-3 h-3 fill-amber-400 text-amber-400" />
            <span className="text-xs text-muted-foreground">
              {dish.rating} ({dish.reviews})
            </span>
            {spice}
          </div>
          <p className="text-xs text-muted-foreground mt-1 line-clamp-2">{dish.description}</p>
          <div className="flex items-center gap-2 mt-2">
            {discountPercent ? (
              <>
                <span className="text-sm font-bold text-primary">
                  Rs.{discounted(basePrice)}
                </span>
                <span className="text-xs text-muted-foreground line-through">Rs.{basePrice}</span>
              </>
            ) : (
              <span className="text-sm font-bold text-primary">
                {choices.length > 1 && (
                  <span className="text-[10px] font-normal text-muted-foreground">from </span>
                )}
                Rs.{basePrice}
              </span>
            )}
          </div>
        </div>
      </div>

      {open && (
        <DishSheet
          dish={dish}
          choices={choices}
          groups={groups}
          discountPercent={discountPercent}
          onClose={() => setOpen(false)}
        />
      )}
    </>
  )
}

// ---------------------------------------------------------------- the sheet
function DishSheet({
  dish,
  choices,
  groups,
  discountPercent,
  onClose,
}: {
  dish: Dish
  choices: Choice[]
  groups: AddOnGroup[]
  discountPercent?: number
  onClose: () => void
}) {
  const { addItem } = useCart()
  const [variant, setVariant] = useState<Choice | undefined>(choices[0])
  const [picked, setPicked] = useState<Record<string, AddOnOption[]>>({})
  const [request, setRequest] = useState('')
  const [qty, setQty] = useState(1)

  useEffect(() => {
    const prev = document.body.style.overflow
    document.body.style.overflow = 'hidden'
    return () => {
      document.body.style.overflow = prev
    }
  }, [])

  const toggle = (group: AddOnGroup, option: AddOnOption) => {
    setPicked(prev => {
      const cur = prev[group.id] || []
      const has = cur.some(o => o.id === option.id)
      if (has) return { ...prev, [group.id]: cur.filter(o => o.id !== option.id) }
      return { ...prev, [group.id]: [...cur, option] }
    })
  }

  const addOns: CartAddOn[] = Object.values(picked)
    .flat()
    .map(o => ({ id: o.id, name: o.name, price: o.price }))

  const base = variant?.price ?? dish.price ?? 0
  const unit = base + addOns.reduce((s, a) => s + a.price, 0)
  const unitAfter = discountPercent ? Math.round(unit * (1 - discountPercent / 100)) : unit
  const total = unitAfter * qty

  const confirm = () => {
    addItem({
      id: dish.id,
      name: dish.name,
      price: unitAfter,
      quantity: qty,
      size: variant?.key,
      image: dish.image,
      isVeg: dish.isVeg,
      addOns: addOns.length ? addOns : undefined,
      cookingRequest: request.trim() || undefined,
      lineId: makeLineId(dish.id, variant?.key, addOns, request),
    })
    onClose()
  }

  return (
    <div className="fixed inset-0 z-[80]">
      <div className="absolute inset-0 bg-black/60" onClick={onClose} />
      <div className="absolute bottom-0 left-0 right-0 mx-auto flex max-h-[92dvh] max-w-lg flex-col rounded-t-2xl bg-background">
        <div className="flex shrink-0 items-center justify-between border-b px-4 py-3">
          <div className="flex min-w-0 items-center gap-2">
            <div className="relative h-9 w-9 shrink-0 overflow-hidden rounded-lg">
              <DishMediaView media={mediaFor(dish)} alt="" sizes="36px" />
            </div>
            <h2 className="truncate text-base font-bold">{dish.name}</h2>
          </div>
          <button
            onClick={onClose}
            className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-muted"
          >
            <X className="h-5 w-5 text-muted-foreground" />
          </button>
        </div>

        <div className="flex-1 space-y-3 overflow-y-auto overscroll-contain p-4">
          <p className="text-sm text-muted-foreground">{dish.description}</p>

          {choices.length > 0 && (
            <section className="rounded-xl border">
              <div className="border-b px-3 py-2">
                <p className="text-sm font-semibold">Choose portion</p>
                <p className="text-xs text-muted-foreground">Required &middot; select 1 option</p>
              </div>
              {choices.map(c => (
                <button
                  key={c.key}
                  onClick={() => setVariant(c)}
                  className="flex w-full items-center justify-between gap-3 border-b px-3 py-2.5 text-left last:border-b-0"
                >
                  <span className="min-w-0">
                    <span className="block text-sm">{c.label}</span>
                    {c.note && (
                      <span className="block text-xs text-muted-foreground">{c.note}</span>
                    )}
                  </span>
                  <span className="flex shrink-0 items-center gap-2">
                    <span className="text-sm font-semibold">Rs.{c.price}</span>
                    <span
                      className={cn(
                        'flex h-4 w-4 items-center justify-center rounded-full border-2',
                        variant?.key === c.key ? 'border-primary' : 'border-muted-foreground/40'
                      )}
                    >
                      {variant?.key === c.key && (
                        <span className="h-2 w-2 rounded-full bg-primary" />
                      )}
                    </span>
                  </span>
                </button>
              ))}
            </section>
          )}

          {groups.map(g => {
            const cur = picked[g.id] || []
            return (
              <section key={g.id} className="rounded-xl border">
                <div className="border-b px-3 py-2">
                  <p className="text-sm font-semibold">{g.name}</p>
                  <p className="text-xs text-muted-foreground">Optional</p>
                </div>
                {g.options.map(o => {
                  const on = cur.some(x => x.id === o.id)
                  return (
                    <button
                      key={o.id}
                      onClick={() => toggle(g, o)}
                      className="flex w-full items-center justify-between gap-3 border-b px-3 py-2.5 text-left last:border-b-0"
                    >
                      <span className="flex min-w-0 items-center gap-2">
                        {o.isVeg && <Leaf className="h-3 w-3 shrink-0 text-green-600" />}
                        <span className="truncate text-sm">{o.name}</span>
                      </span>
                      <span className="flex shrink-0 items-center gap-2">
                        <span className="text-sm font-semibold">+Rs.{o.price}</span>
                        <span
                          className={cn(
                            'flex h-4 w-4 items-center justify-center rounded border-2',
                            on ? 'border-primary bg-primary' : 'border-muted-foreground/40'
                          )}
                        >
                          {on && <span className="text-[10px] font-bold text-white">&#10003;</span>}
                        </span>
                      </span>
                    </button>
                  )
                })}
              </section>
            )
          })}

          <section className="rounded-xl border p-3">
            <p className="text-sm font-semibold">Add a cooking request</p>
            <p className="text-xs text-muted-foreground">
              The kitchen will try its best. Refunds are not possible for these requests.
            </p>
            <textarea
              value={request}
              maxLength={120}
              onChange={e => setRequest(e.target.value)}
              placeholder="e.g. Don't make it too spicy"
              className="mt-2 w-full resize-none rounded-lg border bg-background p-2 text-sm"
              rows={2}
            />
            <div className="mt-1 flex flex-wrap gap-1.5">
              {['Less spicy', 'Extra spicy', 'No onion', 'Well done'].map(t => (
                <button
                  key={t}
                  onClick={() => setRequest(t)}
                  className="rounded-full border px-2.5 py-1 text-xs"
                >
                  {t}
                </button>
              ))}
            </div>
          </section>
        </div>

        <div className="flex shrink-0 items-center gap-3 border-t p-3 pb-[calc(0.75rem+env(safe-area-inset-bottom))]">
          <div className="flex items-center gap-3 rounded-xl border px-3 py-2">
            <button onClick={() => setQty(q => Math.max(1, q - 1))} aria-label="Decrease">
              <Minus className="h-4 w-4 text-primary" />
            </button>
            <span className="w-4 text-center text-sm font-bold">{qty}</span>
            <button onClick={() => setQty(q => q + 1)} aria-label="Increase">
              <Plus className="h-4 w-4 text-primary" />
            </button>
          </div>
          <button
            onClick={confirm}
            className="flex-1 rounded-xl bg-primary px-4 py-3 text-sm font-bold text-primary-foreground"
          >
            Add item &middot; Rs.{total}
          </button>
        </div>
      </div>
    </div>
  )
}
