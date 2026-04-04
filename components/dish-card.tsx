"use client"

import { useState } from 'react'
import Image from 'next/image'
import { Plus, Star, Flame, Leaf } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { useCart } from '@/context/cart-context'
import { Dish } from '@/types/menu'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { cn } from '@/lib/utils'

interface DishCardProps {
  dish: Dish
  discountPercent?: number
}

export function DishCard({ dish, discountPercent }: DishCardProps) {
  const [showSizeDialog, setShowSizeDialog] = useState(false)
  const { addItem } = useCart()

  const getDisplayPrice = () => {
    if (dish.price) return dish.price
    if (dish.fullPrice) return dish.fullPrice
    if (dish.dryPrice) return dish.dryPrice
    return 0
  }

  const displayPrice = getDisplayPrice()
  const discountedPrice = discountPercent 
    ? Math.round(displayPrice * (1 - discountPercent / 100)) 
    : displayPrice

  const hasSizeOptions = !!(dish.halfPrice || dish.dryPrice)

  const handleAddToCart = (size?: 'half' | 'full' | 'dry' | 'roll', price?: number) => {
    addItem({
      id: dish.id,
      name: dish.name,
      price: price || discountedPrice,
      quantity: 1,
      size,
      image: dish.image,
      isVeg: dish.isVeg,
    })
    setShowSizeDialog(false)
  }

  const handleAddClick = () => {
    if (hasSizeOptions) {
      setShowSizeDialog(true)
    } else {
      handleAddToCart()
    }
  }

  const getSpiceIcon = () => {
    if (dish.spiceLevel === 'hot') return <Flame className="w-3 h-3 text-red-500" />
    if (dish.spiceLevel === 'medium') return <Flame className="w-3 h-3 text-orange-500" />
    return null
  }

  return (
    <>
      <div className="bg-card rounded-xl overflow-hidden border border-border shadow-sm">
        <div className="relative aspect-[4/3] bg-muted">
          <Image
            src={dish.image}
            alt={dish.name}
            fill
            className="object-cover"
            sizes="(max-width: 768px) 50vw, 25vw"
            onError={(e) => {
              const target = e.target as HTMLImageElement
              target.src = '/images/placeholder-dish.jpg'
            }}
          />
          <div className="absolute top-2 left-2 flex flex-col gap-1">
            <div className={cn(
              "w-5 h-5 rounded border-2 flex items-center justify-center",
              dish.isVeg 
                ? "border-green-600 bg-white" 
                : "border-red-600 bg-white"
            )}>
              <div className={cn(
                "w-2.5 h-2.5 rounded-full",
                dish.isVeg ? "bg-green-600" : "bg-red-600"
              )} />
            </div>
            {dish.isPopular && (
              <Badge className="bg-primary text-primary-foreground text-[10px] px-1.5 py-0.5">
                Popular
              </Badge>
            )}
            {dish.isNew && (
              <Badge className="bg-accent text-accent-foreground text-[10px] px-1.5 py-0.5">
                New
              </Badge>
            )}
          </div>
          {discountPercent && (
            <Badge className="absolute top-2 right-2 bg-green-600 text-white text-[10px]">
              {discountPercent}% OFF
            </Badge>
          )}
          <Button
            size="sm"
            className="absolute bottom-2 right-2 bg-primary hover:bg-primary/90 text-primary-foreground text-xs px-3 h-8"
            onClick={handleAddClick}
          >
            <Plus className="w-3 h-3 mr-1" />
            Add
          </Button>
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
          <div className="flex items-center gap-1 mt-1">
            <Flame className="w-3 h-3 text-muted-foreground" />
            <span className="text-xs text-muted-foreground">{dish.calories} cal</span>
          </div>
          <div className="flex items-center gap-2 mt-2">
            {discountPercent ? (
              <>
                <span className="text-sm font-bold text-primary">
                  ₹{discountedPrice}
                </span>
                <span className="text-xs text-muted-foreground line-through">
                  ₹{displayPrice}
                </span>
              </>
            ) : (
              <span className="text-sm font-bold text-primary">
                ₹{displayPrice}
              </span>
            )}
          </div>
        </div>
      </div>

      <Dialog open={showSizeDialog} onOpenChange={setShowSizeDialog}>
        <DialogContent className="max-w-[90vw] rounded-xl">
          <DialogHeader>
            <DialogTitle className="text-left">{dish.name}</DialogTitle>
            <DialogDescription>Select your preferred size</DialogDescription>
          </DialogHeader>
          <div className="space-y-3 pt-2">
            {dish.halfPrice && dish.fullPrice && (
              <>
                <button
                  onClick={() => handleAddToCart('half', dish.halfPrice)}
                  className="w-full flex items-center justify-between p-3 rounded-lg border border-border hover:border-primary transition-colors"
                >
                  <span className="text-sm font-medium">Half</span>
                  <span className="text-sm font-bold text-primary">₹{dish.halfPrice}</span>
                </button>
                <button
                  onClick={() => handleAddToCart('full', dish.fullPrice)}
                  className="w-full flex items-center justify-between p-3 rounded-lg border border-border hover:border-primary transition-colors"
                >
                  <span className="text-sm font-medium">Full</span>
                  <span className="text-sm font-bold text-primary">₹{dish.fullPrice}</span>
                </button>
              </>
            )}
            {dish.dryPrice && dish.rollPrice && (
              <>
                <button
                  onClick={() => handleAddToCart('dry', dish.dryPrice)}
                  className="w-full flex items-center justify-between p-3 rounded-lg border border-border hover:border-primary transition-colors"
                >
                  <span className="text-sm font-medium">Dry</span>
                  <span className="text-sm font-bold text-primary">₹{dish.dryPrice}</span>
                </button>
                <button
                  onClick={() => handleAddToCart('roll', dish.rollPrice)}
                  className="w-full flex items-center justify-between p-3 rounded-lg border border-border hover:border-primary transition-colors"
                >
                  <span className="text-sm font-medium">Roll</span>
                  <span className="text-sm font-bold text-primary">₹{dish.rollPrice}</span>
                </button>
              </>
            )}
          </div>
        </DialogContent>
      </Dialog>
    </>
  )
}
