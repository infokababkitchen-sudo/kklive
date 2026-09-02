"use client"

import { useState } from 'react'
import { X, Sparkles, ChevronRight, Gift, Zap } from 'lucide-react'
import { Button } from '@/components/ui/button'
import menuData from '@/data/menu.json'
import { MenuData, Dish } from '@/types/menu'
import { useCart } from '@/context/cart-context'
import Image from 'next/image'

const data = menuData as MenuData & { coupons: any[] }

interface SurpriseMePopupProps {
  onClose: () => void
}

type CuisineType = 'starters' | 'main-course' | 'desserts' | 'chinese'

const CUISINE_MAP: Record<CuisineType, string[]> = {
  'starters': ['momos', 'kabab', 'pure-veg', 'chef-specials'],
  'main-course': ['non-veg-main', 'chef-specials', 'chaap-chinese', 'thali'],
  'desserts': ['add-ons', 'beverages'],
  'chinese': ['chaap-chinese', 'kfc'],
}

const CUISINE_LABELS: Record<CuisineType, string> = {
  'starters': 'Starters',
  'main-course': 'Main Course',
  'desserts': 'Desserts',
  'chinese': 'Chinese',
}

export function SurpriseMePopup({ onClose }: SurpriseMePopupProps) {
  const { addItem } = useCart()
  const [step, setStep] = useState(1)
  const [priceRange, setPriceRange] = useState(1000)
  const [selectedCoupon, setSelectedCoupon] = useState<any>(null)
  const [selectedCuisine, setSelectedCuisine] = useState<CuisineType | null>(null)
  const [suggestedDishes, setSuggestedDishes] = useState<Dish[]>([])

  // Get available coupons based on price range
  const getAvailableCoupons = () => {
    return data.coupons.filter(coupon => coupon.minOrderValue <= priceRange)
  }

  const getDishesForCuisine = (cuisine: CuisineType, maxPrice: number): Dish[] => {
    const categoryIds = CUISINE_MAP[cuisine]
    
    let filtered = data.dishes.filter(dish => {
      const price = dish.fullPrice || dish.price || 0
      return price <= maxPrice && categoryIds.includes(dish.category)
    })

    return filtered.sort(() => Math.random() - 0.5)
  }

  const handlePriceRangeChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setPriceRange(Number(e.target.value))
  }

  const handleSelectCuisine = (cuisine: CuisineType) => {
    setSelectedCuisine(cuisine)
    const dishes = getDishesForCuisine(cuisine, priceRange)
    const selected = dishes.slice(0, 2)
    
    if (selected.length > 0) {
      setSuggestedDishes(selected)
      setStep(4)
    }
  }

  const handleSelectDish = (dish: Dish) => {
    if (dish.halfPrice && dish.fullPrice) {
      addItem({
        id: dish.id,
        name: dish.name,
        price: dish.fullPrice,
        image: dish.image,
        size: 'full',
        quantity: 1,
      })
    } else if (dish.price) {
      addItem({
        id: dish.id,
        name: dish.name,
        price: dish.price,
        image: dish.image,
        size: 'regular',
        quantity: 1,
      })
    }
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
              <h2 className="text-xl font-bold text-foreground">Surprise Me!</h2>
            </div>
            <Button variant="ghost" size="icon" onClick={onClose}>
              <X className="w-5 h-5" />
            </Button>
          </div>

          {/* Content */}
          <div className="p-6 space-y-6">
            <div className="text-center space-y-2">
              <h3 className="text-lg font-bold text-foreground">Select Your Budget</h3>
              <p className="text-sm text-muted-foreground">Choose your price range (₹1 - ₹2000)</p>
            </div>

            {/* Price Slider */}
            <div className="space-y-4">
              <input
                type="range"
                min="1"
                max="2000"
                value={priceRange}
                onChange={handlePriceRangeChange}
                className="w-full h-2 bg-muted rounded-lg appearance-none cursor-pointer accent-primary"
              />
              
              <div className="flex items-center justify-between p-3 bg-muted rounded-lg">
                <span className="text-sm text-muted-foreground">₹1</span>
                <div className="text-center">
                  <p className="text-2xl font-bold text-primary">₹{priceRange}</p>
                  <p className="text-xs text-muted-foreground">Selected Budget</p>
                </div>
                <span className="text-sm text-muted-foreground">₹2000</span>
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
                            {formatCouponSavings(coupon, priceRange)}
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
              <p className="text-xs text-muted-foreground">Budget: <span className="font-bold text-primary">₹{priceRange}</span></p>
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
        <div className="w-full max-w-md bg-background rounded-2xl overflow-hidden shadow-xl animate-in zoom-in duration-300">
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
                      <span className="font-bold text-foreground text-sm">
                        ₹{dish.fullPrice || dish.price}
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
        </div>
      </div>
    )
  }

  return null
}
