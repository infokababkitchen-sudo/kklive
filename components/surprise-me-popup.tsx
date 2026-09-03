"use client"

import { useState } from 'react'
import { X, Sparkles, ChevronRight, Gift, Zap } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { useMenu } from '@/hooks/use-menu'
import couponsData from '@/data/coupons.json'
import { MenuData, Dish } from '@/types/menu'
import { useCart, makeLineId } from '@/context/cart-context'
import Image from 'next/image'


interface SurpriseMePopupProps {
  onClose: () => void
}

type CuisineType = 'starters' | 'main-course' | 'desserts' | 'chinese' | 'beverages'

const CUISINE_MAP: Record<CuisineType, string[]> = {
  'starters': [
    'kabab-khazana',
    'authentic-kurkure-momos',
    'kurkure-momos',
    'soya-chaap',
    'crispy-chicken-specials',
  ],
  'main-course': [
    'non-veg-main-course',
    'pure-veg-main-course',
    'chef-s-specials',
    'special-veg-thalis',
    'non-veg-thalis',
  ],
  'desserts': ['rice-roti-add-ons'],
  'chinese': ['chinese-delights'],
  'beverages': ['beverages'],
}

const CUISINE_LABELS: Record<CuisineType, string> = {
  'starters': 'Starters',
  'main-course': 'Main Course',
  'desserts': 'Desserts',
  'chinese': 'Chinese',
  'beverages': 'Beverages',
}

export function SurpriseMePopup({ onClose }: SurpriseMePopupProps) {
  const data = useMenu() as MenuData & { coupons: any[] }
  const { addItem } = useCart()
  const [step, setStep] = useState(1)
  const [minPrice, setMinPrice] = useState(50)
  const [maxPrice, setMaxPrice] = useState(600)
  const [selectedCoupon, setSelectedCoupon] = useState<any>(null)
  const [selectedCuisine, setSelectedCuisine] = useState<CuisineType | null>(null)
  const [suggestedDishes, setSuggestedDishes] = useState<Dish[]>([])
  const [pickVariantFor, setPickVariantFor] = useState<Dish | null>(null)

  const priceOf = (d: Dish) =>
    d.price ?? d.variants?.[0]?.price ?? d.fullPrice ?? d.halfPrice ?? 0
  const affordable = data.dishes.filter(
    d => priceOf(d) > 0 && priceOf(d) >= minPrice && priceOf(d) <= maxPrice
  )
  const allPrices = data.dishes.map(priceOf).filter(p => p > 0)
  const cheapest = affordable.length ? Math.min(...affordable.map(priceOf)) : 0
  const dearest = affordable.length ? Math.max(...affordable.map(priceOf)) : 0
  const minDishPrice = allPrices.length ? Math.min(...allPrices) : 0
  const availableCoupons = (couponsData.coupons as any[]).filter(
    c => c.isActive && c.minOrderValue <= maxPrice
  )

  // Get available coupons based on price range
  const getAvailableCoupons = () => {
    return (couponsData.coupons as any[]).filter(
      c => c.isActive && c.minOrderValue <= maxPrice
    )
  }

  const getDishesForCuisine = (cuisine: CuisineType, maxPrice: number): Dish[] => {
    const categoryIds = CUISINE_MAP[cuisine]
    
    let filtered = data.dishes.filter(dish => {
      const price = priceOf(dish)
      return price > 0 && price >= minPrice && price <= maxPrice &&
        categoryIds.includes(dish.category)
    })

    return filtered.sort(() => Math.random() - 0.5)
  }

    const handleSelectCuisine = (cuisine: CuisineType) => {
    setSelectedCuisine(cuisine)
    const dishes = getDishesForCuisine(cuisine, maxPrice)
    const selected = dishes.slice(0, 2)
    
    if (selected.length > 0) {
      setSuggestedDishes(selected)
      setStep(4)
    }
  }

  const handleSelectDish = (dish: Dish, chosen?: { key: any; label: string; price: number }) => {
    // more than one option and none picked yet -> ask first
    if (!chosen && (dish.variants?.length ?? 0) > 1) {
      setPickVariantFor(dish)
      return
    }
    const variant = chosen ?? dish.variants?.[0]
    const size = variant?.key ?? (dish.fullPrice ? 'full' : undefined)
    const price = variant?.price ?? dish.price ?? dish.fullPrice ?? 0
    if (!price) return
    addItem({
      id: dish.id,
      name: dish.name,
      price,
      image: dish.image,
      isVeg: dish.isVeg,
      size,
      quantity: 1,
      lineId: makeLineId(dish.id, size),
    })
    onClose()
  }

  const handleTryAgain = () => {
    setStep(3)
    setSelectedCuisine(null)
    setSuggestedDishes([])
  }

  const formatCouponSavings = (coupon: any, price: number) => {
    if (coupon.type === 'flat') {
      return `Save ₹${coupon.value}`
    } else if (coupon.type === 'percentage') {
      const savings = Math.min((price * coupon.value) / 100, coupon.maxDiscount || Infinity)
      return `Save ₹${Math.round(savings)}`
    } else if (coupon.type === 'free_delivery') {
      return 'Free Delivery'
    } else if (coupon.type === 'free_item') {
      return `+ Free ${coupon.freeItem?.name}`
    }
    return ''
  }

  // Step 1: Price Range Selection
  if (step === 1) {
    return (
      <div className="fixed inset-0 z-50 bg-black/50 flex items-center justify-center p-4">
        <div className="w-full max-w-md bg-background rounded-2xl overflow-hidden shadow-xl animate-in zoom-in duration-300">
          {/* Header */}
          <div className="flex items-center justify-between px-6 py-4 border-b border-border bg-gradient-to-r from-primary/10 to-transparent">
            <div className="flex items-center gap-2">
              <Sparkles className="w-5 h-5 text-primary" />
              <h2 className="text-xl font-bold text-foreground">Kuch Bhi</h2>
            </div>
            <Button variant="ghost" size="icon" onClick={onClose}>
              <X className="w-5 h-5" />
            </Button>
          </div>

          {/* Content */}
          <div className="p-6 space-y-6">
            <div className="text-center space-y-2">
              <h3 className="text-lg font-bold text-foreground">Select Your Budget</h3>
            </div>

            {/* Two-handle range bar */}
            <div className="space-y-3">
              <div className="flex items-end justify-between px-1">
                <span className="text-xs text-muted-foreground">Rs.1</span>
                <span className="text-base font-bold text-primary">
                  Rs.{minPrice} &ndash; Rs.{maxPrice}
                </span>
                <span className="text-xs text-muted-foreground">Rs.2000</span>
              </div>

              <div className="relative h-6">
                <div className="absolute top-1/2 h-1.5 w-full -translate-y-1/2 rounded-full bg-muted" />
                <div
                  className="absolute top-1/2 h-1.5 -translate-y-1/2 rounded-full bg-primary"
                  style={{
                    left: ((minPrice - 1) / 1999) * 100 + '%',
                    right: 100 - ((maxPrice - 1) / 1999) * 100 + '%',
                  }}
                />
                <input
                  type="range"
                  min="1"
                  max="2000"
                  value={minPrice}
                  onChange={e => setMinPrice(Math.min(Number(e.target.value), maxPrice - 10))}
                  className="kk-thumb absolute inset-0 h-6 w-full appearance-none bg-transparent"
                />
                <input
                  type="range"
                  min="1"
                  max="2000"
                  value={maxPrice}
                  onChange={e => setMaxPrice(Math.max(Number(e.target.value), minPrice + 10))}
                  className="kk-thumb absolute inset-0 h-6 w-full appearance-none bg-transparent"
                />
              </div>
            </div>

            {/* Next Button */}
            <Button
              onClick={() => setStep(2)}
              className="w-full bg-primary text-primary-foreground hover:bg-primary/90"
              size="lg"
            >
              Next <ChevronRight className="w-4 h-4 ml-2" />
            </Button>
          </div>
        </div>
      </div>
    )
  }

  // Step 2: Coupon Selection
  if (step === 2) {
    const availableCoupons = getAvailableCoupons()
    
    return (
      <div className="fixed inset-0 z-50 bg-black/50 flex items-center justify-center p-4">
        <div className="w-full max-w-md bg-background rounded-2xl overflow-hidden shadow-xl animate-in zoom-in duration-300 max-h-[90vh] flex flex-col">
          {/* Header */}
          <div className="flex items-center justify-between px-6 py-4 border-b border-border bg-gradient-to-r from-primary/10 to-transparent shrink-0">
            <div className="flex items-center gap-2">
              <Gift className="w-5 h-5 text-primary" />
              <h2 className="text-xl font-bold text-foreground">Available Offers</h2>
            </div>
            <Button variant="ghost" size="icon" onClick={onClose}>
              <X className="w-5 h-5" />
            </Button>
          </div>

          {/* Content */}
          <div className="flex-1 overflow-y-auto p-6 space-y-3">
            {availableCoupons.length > 0 ? (
              <>
                {availableCoupons.map(coupon => (
                  <button
                    key={coupon.id}
                    onClick={() => setSelectedCoupon(coupon)}
                    className={`w-full p-4 rounded-lg border-2 transition-all text-left ${
                      selectedCoupon?.id === coupon.id
                        ? 'border-primary bg-primary/10'
                        : 'border-border hover:border-primary hover:bg-primary/5'
                    }`}
                  >
                    <div className="flex items-start justify-between gap-3">
                      <div className="flex-1">
                        <h4 className="font-bold text-foreground text-sm">{coupon.title}</h4>
                        <p className="text-xs text-muted-foreground mt-1">{coupon.description}</p>
                        <div className="flex items-center gap-2 mt-2">
                          <span className="text-xs font-mono bg-muted px-2 py-1 rounded text-foreground">
                            {coupon.code}
                          </span>
                          <span className="text-xs text-primary font-semibold">
                            {formatCouponSavings(coupon, maxPrice)}
                          </span>
                        </div>
                      </div>
                      {selectedCoupon?.id === coupon.id && (
                        <Zap className="w-5 h-5 text-primary flex-shrink-0 mt-1" />
                      )}
                    </div>
                  </button>
                ))}
              </>
            ) : (
              <div className="text-center py-6">
                <p className="text-muted-foreground">No coupons available for this budget</p>
              </div>
            )}
          </div>

          {/* Footer */}
          <div className="flex gap-3 px-6 py-4 border-t border-border bg-muted/50 shrink-0">
            <Button
              variant="outline"
              onClick={() => {
                setStep(1)
                setSelectedCoupon(null)
              }}
              className="flex-1"
            >
              Back
            </Button>
            <Button
              onClick={() => setStep(3)}
              className="flex-1 bg-primary text-primary-foreground hover:bg-primary/90"
            >
              Continue
            </Button>
          </div>
        </div>
      </div>
    )
  }

  // Step 3: Cuisine Selection
  if (step === 3) {
    return (
      <div className="fixed inset-0 z-50 bg-black/50 flex items-center justify-center p-4">
        <div className="w-full max-w-md bg-background rounded-2xl overflow-hidden shadow-xl animate-in zoom-in duration-300">
          {/* Header */}
          <div className="flex items-center justify-between px-6 py-4 border-b border-border bg-gradient-to-r from-primary/10 to-transparent">
            <div className="flex items-center gap-2">
              <Sparkles className="w-5 h-5 text-primary" />
              <h2 className="text-xl font-bold text-foreground">What do you fancy?</h2>
            </div>
            <Button variant="ghost" size="icon" onClick={onClose}>
              <X className="w-5 h-5" />
            </Button>
          </div>

          {/* Content */}
          <div className="p-6 space-y-4">
            <div className="space-y-2 p-3 bg-muted rounded-lg">
              <p className="text-xs text-muted-foreground">Budget: <span className="font-bold text-primary">Rs.{minPrice} - Rs.{maxPrice}</span></p>
              {selectedCoupon && (
                <p className="text-xs text-muted-foreground">Coupon: <span className="font-bold text-primary">{selectedCoupon.code}</span></p>
              )}
            </div>

            <div className="space-y-3">
              {(Object.keys(CUISINE_LABELS) as CuisineType[]).map(cuisine => (
                <button
                  key={cuisine}
                  onClick={() => handleSelectCuisine(cuisine)}
                  className="w-full p-4 rounded-lg border-2 border-border hover:border-primary hover:bg-primary/5 transition-all text-left group"
                >
                  <div className="flex items-center justify-between">
                    <span className="font-semibold text-foreground">{CUISINE_LABELS[cuisine]}</span>
                    <ChevronRight className="w-5 h-5 text-muted-foreground group-hover:text-primary transition-colors" />
                  </div>
                </button>
              ))}
            </div>

            <Button
              variant="outline"
              onClick={() => setStep(2)}
              className="w-full"
            >
              Back to Offers
            </Button>
          </div>
        </div>
      </div>
    )
  }

  // Step 4: Dish Selection (2 options)
  if (step === 4 && suggestedDishes.length > 0) {
    return (
      <div className="fixed inset-0 z-50 bg-black/50 flex items-center justify-center p-4">
        <div className="relative w-full max-w-md bg-background rounded-2xl overflow-hidden shadow-xl animate-in zoom-in duration-300">
          {/* Header */}
          <div className="flex items-center justify-between px-6 py-4 border-b border-border bg-gradient-to-r from-primary/10 to-transparent">
            <div className="flex items-center gap-2">
              <Sparkles className="w-5 h-5 text-primary" />
              <h2 className="text-xl font-bold text-foreground">Pick Your Favorite</h2>
            </div>
            <Button variant="ghost" size="icon" onClick={onClose}>
              <X className="w-5 h-5" />
            </Button>
          </div>

          {/* Content */}
          <div className="p-6 space-y-4 max-h-[60vh] overflow-y-auto">
            {selectedCoupon && (
              <div className="p-3 bg-primary/10 border border-primary/20 rounded-lg">
                <p className="text-xs text-primary font-semibold">{selectedCoupon.title}</p>
                <p className="text-xs text-muted-foreground mt-1">{selectedCoupon.description}</p>
              </div>
            )}

            {suggestedDishes.map((dish, idx) => (
              <button
                key={`${dish.id}-${idx}`}
                onClick={() => handleSelectDish(dish)}
                className="w-full p-4 rounded-lg border-2 border-border hover:border-primary hover:bg-primary/5 transition-all overflow-hidden group"
              >
                <div className="flex gap-3">
                  {/* Dish Image */}
                  <div className="w-20 h-20 rounded-lg overflow-hidden bg-muted flex-shrink-0">
                    <Image
                      src={dish.image || '/images/placeholder-dish.jpg'}
                      alt={dish.name}
                      width={80}
                      height={80}
                      className="w-full h-full object-cover group-hover:scale-110 transition-transform"
                      onError={(e) => {
                        e.currentTarget.src = '/images/placeholder-dish.jpg'
                      }}
                    />
                  </div>

                  {/* Dish Info */}
                  <div className="flex-1 text-left">
                    <h3 className="font-bold text-foreground truncate text-sm">{dish.name}</h3>
                    <p className="text-xs text-muted-foreground line-clamp-2">{dish.description}</p>
                    
                    <div className="flex items-center justify-between mt-2">
                      <div className="flex items-center gap-1">
                        <span className="text-xs font-semibold text-primary">★ {dish.rating}</span>
                      </div>
                      <span className="text-right">
                        {(dish.variants?.length ?? 0) > 1 ? (
                          <>
                            <span className="block text-sm font-bold text-foreground">
                              from Rs.{Math.min(...dish.variants!.map(v => v.price))}
                            </span>
                            <span className="block text-[10px] text-muted-foreground">
                              {dish.variants!.map(v => v.label).join(' or ')}
                            </span>
                          </>
                        ) : (
                          <span className="text-sm font-bold text-foreground">
                            Rs.{priceOf(dish)}
                          </span>
                        )}
                      </span>
                    </div>
                  </div>
                </div>
              </button>
            ))}
          </div>

          {/* Footer */}
          <div className="flex gap-3 px-6 py-4 border-t border-border bg-muted/50">
            <Button
              variant="outline"
              onClick={handleTryAgain}
              className="flex-1"
            >
              Try Again
            </Button>
          </div>

          {pickVariantFor && (
            <div className="absolute inset-0 z-10 flex items-end bg-black/50">
              <div className="w-full rounded-t-2xl bg-background p-4">
                <p className="text-base font-bold">{pickVariantFor.name}</p>
                <p className="mb-3 text-xs text-muted-foreground">
                  Which one would you like?
                </p>
                <div className="space-y-2">
                  {pickVariantFor.variants!.map(v => (
                    <button
                      key={v.key}
                      onClick={() => {
                        const d = pickVariantFor
                        setPickVariantFor(null)
                        handleSelectDish(d, v)
                      }}
                      className="flex w-full items-center justify-between gap-3 rounded-xl border p-3 text-left hover:border-primary"
                    >
                      <span className="min-w-0">
                        <span className="block text-sm font-medium">{v.label}</span>
                        {v.note && (
                          <span className="block text-xs text-muted-foreground">{v.note}</span>
                        )}
                      </span>
                      <span className="shrink-0 text-sm font-bold text-primary">Rs.{v.price}</span>
                    </button>
                  ))}
                </div>
                <button
                  onClick={() => setPickVariantFor(null)}
                  className="mt-3 w-full p-2 text-sm text-muted-foreground"
                >
                  Cancel
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    )
  }

  return null
}
