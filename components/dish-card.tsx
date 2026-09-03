"use client"

import { useEffect, useState } from 'react'
import Image from 'next/image'
import { Plus, Star, Flame, Leaf, X } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { useCart } from '@/context/cart-context'
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

/**
 * Ek dish ke saare variants nikaalta hai.
 * Pehle admin panel ke variants, warna menu.json ke half/full ya dry/roll.
 */
function getChoices(dish: Dish): Choice[] {
  if (dish.variants?.length) return dish.variants
  const out: Choice[] = []
  if (dish.halfPrice) out.push({ key: 'half', label: 'Half', price: dish.halfPrice })
  if (dish.fullPrice) out.push({ key: 'full', label: 'Full', price: dish.fullPrice })
  if (dish.dryPrice) {
    out.push({ key: 'dry', label: 'Dry', price: dish.dryPrice, note: '2 seekh, 1 portion' })
  }
  if (dish.rollPrice) {
    out.push({
      key: 'roll',
      label: 'Roll',
      price: dish.rollPrice,
      note: '1 seekh roll, stuffed onion & masala',
    })
  }
  return out
}

export function DishCard({ dish, discountPercent }: DishCardProps) {
  const [showSheet, setShowSheet] = useState(false)
  const { addItem } = useCart()

  const choices = getChoices(dish)
  const hasChoices = choices.length > 0
  const outOfStock = dish.inStock === false

  const displayPrice = dish.price || choices[0]?.price || dish.fullPrice || 0
  const discountedPrice = discountPercent
    ? Math.round(displayPrice * (1 - discountPercent / 100))
    : displayPrice

  // Sheet khuli ho to background scroll band
  useEffect(() => {
    if (!showSheet) return
    const prev = document.body.style.overflow
    document.body.style.overflow = 'hidden'
    return () => {
      document.body.style.overflow = prev
    }
  }, [showSheet])

  const handleAddToCart = (choice?: Choice) => {
    const price = choice
      ? discountPercent
        ? Math.round(choice.price * (1 - discountPercent / 100))
        : choice.price
      : discountedPrice
    addItem({
      id: dish.id,
      name: dish.name,
      price,
      quantity: 1,
      size: choice?.key,
      image: dish.image,
      isVeg: dish.isVeg,
    })
    setShowSheet(false)
  }

  const handleAddClick = () => {
    if (outOfStock) return
    if (hasChoices) setShowSheet(true)
    else handleAddToCart()
  }

  const getSpiceIcon = () => {
    if (dish.spiceLevel === 'hot') return <Flame className="w-3 h-3 text-red-500" />
    if (dish.spiceLevel === 'medium') return <Flame className="w-3 h-3 text-amber-500" />
    return null
  }

  return (
    <>
      <div
        className={cn(
          'bg-card rounded-xl border border-border overflow-hidden',
          outOfStock && 'opacity-60'
        )}
      >
        <div className="relative aspect-square">
          <Image
            src={dish.image}
            alt={dish.name}
            fill
            className={cn('object-cover', outOfStock && 'grayscale')}
            sizes="(max-width: 768px) 50vw, 25vw"
            onError={e => {
              const target = e.target as HTMLImageElement
              target.src = '/images/placeholder-dish.jpg'
            }}
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
              <span className="rounded-full bg-background px-3 py-1 text-xs font-semibold text-foreground">
                Out of stock
              </span>
            </div>
          ) : (
            <Button
              size="sm"
              className="absolute bottom-2 right-2 bg-primary hover:bg-primary/90 text-primary-foreground text-xs px-3 h-8"
              onClick={handleAddClick}
            >
              <Plus className="w-3 h-3 mr-1" />
              Add
            </Button>
          )}
        </div>

        <div className="p-3">
          <h3 className="font-semibold text-sm text-foreground line-clamp-1">{dish.name}</h3>
          <div className="flex items-center gap-1 mt-1">
            <Star className="w-3 h-3 fill-amber-400 text-amber-400" />
            <span className="text-xs text-muted-foreground">
              {dish.rating} ({dish.reviews})
            </span>
            {getSpiceIcon()}
          </div>
          <p className="text-xs text-muted-foreground mt-1 line-clamp-2">{dish.description}</p>
          <div className="flex items-center gap-2 mt-2">
            {discountPercent ? (
              <>
                <span className="text-sm font-bold text-primary">Rs.{discountedPrice}</span>
                <span className="text-xs text-muted-foreground line-through">
                  Rs.{displayPrice}
                </span>
              </>
            ) : (
              <span className="text-sm font-bold text-primary">
                {choices.length > 1 && (
                  <span className="text-[10px] font-normal text-muted-foreground">from </span>
                )}
                Rs.{displayPrice}
              </span>
            )}
          </div>
        </div>
      </div>

      {/* Neeche se aane wali variant sheet */}
      {showSheet && (
        <div className="fixed inset-0 z-50">
          <div
            className="absolute inset-0 bg-black/50"
            onClick={() => setShowSheet(false)}
          />
          <div className="absolute bottom-0 left-0 right-0 flex max-h-[85dvh] flex-col rounded-t-2xl bg-background animate-in slide-in-from-bottom duration-300">
            <div className="flex shrink-0 justify-center pt-3 pb-1">
              <div className="h-1 w-10 rounded-full bg-muted-foreground/30" />
            </div>

            <div className="flex shrink-0 items-start justify-between gap-3 border-b border-border px-4 py-3">
              <div className="min-w-0">
                <h2 className="text-base font-bold text-foreground">{dish.name}</h2>
                <p className="text-xs text-muted-foreground">Choose an option</p>
              </div>
              <button
                onClick={() => setShowSheet(false)}
                className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-muted"
              >
                <X className="h-5 w-5 text-muted-foreground" />
              </button>
            </div>

            <div className="flex-1 space-y-2 overflow-y-auto overscroll-contain p-4 pb-[calc(1rem+env(safe-area-inset-bottom))]">
              {choices.map(choice => (
                <button
                  key={choice.key}
                  onClick={() => handleAddToCart(choice)}
                  className="flex w-full items-center justify-between gap-3 rounded-xl border border-border p-3 text-left transition-colors hover:border-primary"
                >
                  <div className="min-w-0">
                    <p className="text-sm font-medium text-foreground">{choice.label}</p>
                    {choice.note && (
                      <p className="mt-0.5 text-xs text-muted-foreground">{choice.note}</p>
                    )}
                  </div>
                  <span className="shrink-0 text-sm font-bold text-primary">
                    Rs.{choice.price}
                  </span>
                </button>
              ))}
            </div>
          </div>
        </div>
      )}
    </>
  )
}
