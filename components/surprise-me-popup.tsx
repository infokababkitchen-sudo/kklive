"use client"

import { useState, useEffect } from 'react'
import { X, Sparkles, ChevronDown, ChevronUp } from 'lucide-react'
import { Button } from '@/components/ui/button'
import menuData from '@/data/menu.json'
import { MenuData, Dish } from '@/types/menu'
import { useCart } from '@/context/cart-context'
import Image from 'next/image'
import { cn } from '@/lib/utils'

const data = menuData as MenuData

interface SurpriseMePopupProps {
  onClose: () => void
}

const PRICE_RANGES = [
  { label: '₹50 - ₹100', min: 50, max: 100, id: 'budget' },
  { label: '₹100 - ₹200', min: 100, max: 200, id: 'moderate' },
  { label: '₹200 - ₹300', min: 200, max: 300, id: 'premium' },
  { label: '₹300 - ₹500', min: 300, max: 500, id: 'luxury' },
  { label: '₹500+', min: 500, max: 10000, id: 'elite' },
]

type CuisineType = 'veg' | 'non-veg' | 'any'

export function SurpriseMePopup({ onClose }: SurpriseMePopupProps) {
  const { addItem } = useCart()
  const [step, setStep] = useState(1)
  const [cuisine, setCuisine] = useState<CuisineType | null>(null)
  const [priceRange, setPriceRange] = useState<typeof PRICE_RANGES[0] | null>(null)
  const [selectedDish, setSelectedDish] = useState<Dish | null>(null)
  const [applicableCoupon, setApplicableCoupon] = useState<any>(null)
  const [showPriceDropdown, setShowPriceDropdown] = useState(false)

  const getApplicableCoupon = (price: number) => {
    const sortedPromos = [...data.promoCodes].sort((a, b) => b.discountPercent - a.discountPercent)
    const applicable = sortedPromos.find(promo => price >= promo.minOrder)
    return applicable
  }

  const getSuggestedDish = () => {
    if (!cuisine || !priceRange) return null

    let dishes = [...data.dishes]

    // Filter by cuisine
    if (cuisine === 'veg') {
      dishes = dishes.filter(d => d.isVeg)
    } else if (cuisine === 'non-veg') {
      dishes = dishes.filter(d => !d.isVeg)
    }

    // Filter by price range (use fullPrice for comparison)
    dishes = dishes.filter(d => {
      const price = d.fullPrice || d.price || 0
      return price >= priceRange.min && price <= priceRange.max
    })

    // Sort by rating and popularity
    dishes.sort((a, b) => {
      const aScore = (a.rating * 10) + (a.isPopular ? 50 : 0) + (a.isNew ? 30 : 0)
      const bScore = (b.rating * 10) + (b.isPopular ? 50 : 0) + (b.isNew ? 30 : 0)
      return bScore - aScore
    })

    if (dishes.length === 0) return null
    
    // Return random dish from top options
    return dishes[Math.floor(Math.random() * Math.min(5, dishes.length))]
  }

  const handleSelectCuisine = (type: CuisineType) => {
    setCuisine(type)
    setStep(2)
  }

  const handleSelectPriceRange = (range: typeof PRICE_RANGES[0]) => {
    setPriceRange(range)
    setShowPriceDropdown(false)
    
    // Get suggestion based on cuisine and price
    const dish = getSuggestedDish()
    if (dish) {
      setSelectedDish(dish)
      const coupon = getApplicableCoupon(dish.fullPrice || dish.price || 0)
      setApplicableCoupon(coupon)
      setStep(3)
    }
  }

  const handleAddToCart = () => {
    if (selectedDish) {
      if (selectedDish.halfPrice && selectedDish.fullPrice) {
        addItem({
          id: selectedDish.id,
          name: selectedDish.name,
          price: selectedDish.fullPrice,
          image: selectedDish.image,
          size: 'full',
          quantity: 1,
        })
      } else if (selectedDish.price) {
        addItem({
          id: selectedDish.id,
          name: selectedDish.name,
          price: selectedDish.price,
          image: selectedDish.image,
          size: 'regular',
          quantity: 1,
        })
      }
      onClose()
    }
  }

  const handleTryAgain = () => {
    setStep(1)
    setCuisine(null)
    setPriceRange(null)
    setSelectedDish(null)
    setApplicableCoupon(null)
  }

  // Step 1: Cuisine Selection
  if (step === 1) {
    return (
      <div className="fixed inset-0 z-50 bg-black/50 flex items-end">
        <div className="w-full bg-background rounded-t-3xl max-h-[90vh] overflow-hidden flex flex-col animate-in slide-in-from-bottom duration-300">
          {/* Header */}
          <div className="flex items-center justify-between px-4 py-3 border-b border-border shrink-0">
            <div className="flex items-center gap-2">
              <Sparkles className="w-5 h-5 text-primary" />
              <h2 className="text-lg font-bold text-foreground">Surprise Me!</h2>
            </div>
            <Button variant="ghost" size="icon" onClick={onClose}>
              <X className="w-5 h-5" />
            </Button>
          </div>

          {/* Content */}
          <div className="flex-1 overflow-y-auto p-6 flex flex-col justify-center">
            <div className="text-center space-y-6">
              <div>
                <h3 className="text-xl font-bold text-foreground mb-2">What's your food preference?</h3>
                <p className="text-muted-foreground text-sm">Let us suggest something delicious for you</p>
              </div>

              <div className="space-y-3">
                <button
                  onClick={() => handleSelectCuisine('any')}
                  className="w-full p-4 rounded-lg border-2 border-border hover:border-primary hover:bg-primary/5 transition-all text-left"
                >
                  <span className="font-semibold text-foreground">Any Cuisine</span>
                  <p className="text-sm text-muted-foreground">Mix of veg and non-veg</p>
                </button>

                <button
                  onClick={() => handleSelectCuisine('veg')}
                  className="w-full p-4 rounded-lg border-2 border-border hover:border-green-500 hover:bg-green-50 transition-all text-left"
                >
                  <span className="font-semibold text-foreground">Vegetarian</span>
                  <p className="text-sm text-muted-foreground">🥬 Pure veg options</p>
                </button>

                <button
                  onClick={() => handleSelectCuisine('non-veg')}
                  className="w-full p-4 rounded-lg border-2 border-border hover:border-orange-500 hover:bg-orange-50 transition-all text-left"
                >
                  <span className="font-semibold text-foreground">Non-Vegetarian</span>
                  <p className="text-sm text-muted-foreground">🍗 Meat & protein dishes</p>
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
    )
  }

  // Step 2: Price Range Selection
  if (step === 2) {
    return (
      <div className="fixed inset-0 z-50 bg-black/50 flex items-end">
        <div className="w-full bg-background rounded-t-3xl max-h-[90vh] overflow-hidden flex flex-col animate-in slide-in-from-bottom duration-300">
          {/* Header */}
          <div className="flex items-center justify-between px-4 py-3 border-b border-border shrink-0">
            <div className="flex items-center gap-2">
              <Sparkles className="w-5 h-5 text-primary" />
              <h2 className="text-lg font-bold text-foreground">Select Price Range</h2>
            </div>
            <Button variant="ghost" size="icon" onClick={onClose}>
              <X className="w-5 h-5" />
            </Button>
          </div>

          {/* Content */}
          <div className="flex-1 overflow-y-auto p-6 flex flex-col justify-center">
            <div className="text-center space-y-6">
              <div>
                <h3 className="text-xl font-bold text-foreground mb-2">What's your budget?</h3>
                <p className="text-muted-foreground text-sm">Select a price range for your meal</p>
              </div>

              <div className="space-y-3">
                {PRICE_RANGES.map(range => (
                  <button
                    key={range.id}
                    onClick={() => handleSelectPriceRange(range)}
                    className="w-full p-4 rounded-lg border-2 border-border hover:border-primary hover:bg-primary/5 transition-all text-left font-semibold text-foreground"
                  >
                    {range.label}
                  </button>
                ))}
              </div>

              <Button
                variant="outline"
                onClick={() => {
                  setStep(1)
                  setCuisine(null)
                }}
                className="w-full"
              >
                Back
              </Button>
            </div>
          </div>
        </div>
      </div>
    )
  }

  // Step 3: Result with Dish Suggestion
  if (step === 3 && selectedDish) {
    const dishPrice = selectedDish.fullPrice || selectedDish.price || 0
    const discount = applicableCoupon ? applicableCoupon.discountPercent : 0
    const discountedPrice = dishPrice - (dishPrice * discount / 100)

    return (
      <div className="fixed inset-0 z-50 bg-black/50 flex items-end">
        <div className="w-full bg-background rounded-t-3xl max-h-[90vh] overflow-hidden flex flex-col animate-in slide-in-from-bottom duration-300">
          {/* Header */}
          <div className="flex items-center justify-between px-4 py-3 border-b border-border shrink-0">
            <h2 className="text-lg font-bold text-foreground">Our Suggestion</h2>
            <Button variant="ghost" size="icon" onClick={onClose}>
              <X className="w-5 h-5" />
            </Button>
          </div>

          {/* Content */}
          <div className="flex-1 overflow-y-auto p-6">
            <div className="space-y-6">
              {/* Dish Image */}
              <div className="relative w-full aspect-square rounded-lg overflow-hidden bg-muted">
                <Image
                  src={selectedDish.image || '/images/placeholder-dish.jpg'}
                  alt={selectedDish.name}
                  fill
                  className="object-cover"
                  onError={(e) => {
                    e.currentTarget.src = '/images/placeholder-dish.jpg'
                  }}
                />
              </div>

              {/* Dish Details */}
              <div className="space-y-3">
                <div>
                  <h3 className="text-2xl font-bold text-foreground mb-1">{selectedDish.name}</h3>
                  <p className="text-muted-foreground text-sm">{selectedDish.description}</p>
                </div>

                <div className="flex items-center gap-4">
                  <div className="flex items-center gap-1">
                    <span className="text-lg font-bold text-primary">★</span>
                    <span className="font-semibold text-foreground">{selectedDish.rating}</span>
                    <span className="text-xs text-muted-foreground">({selectedDish.reviews} reviews)</span>
                  </div>
                  {selectedDish.isPopular && (
                    <span className="text-xs px-2 py-1 bg-primary/20 text-primary rounded-full font-semibold">Popular</span>
                  )}
                  {selectedDish.isNew && (
                    <span className="text-xs px-2 py-1 bg-orange-100 text-orange-700 rounded-full font-semibold">New</span>
                  )}
                </div>
              </div>

              {/* Coupon Section */}
              {applicableCoupon && (
                <div className="p-4 bg-green-50 border-2 border-green-200 rounded-lg">
                  <div className="flex items-start justify-between mb-2">
                    <div>
                      <p className="font-bold text-green-700">{applicableCoupon.code}</p>
                      <p className="text-sm text-green-600">{applicableCoupon.description}</p>
                    </div>
                    <span className="text-lg font-bold text-green-700">{applicableCoupon.discountPercent}% OFF</span>
                  </div>
                  <div className="flex items-center justify-between text-sm">
                    <span className="text-muted-foreground">Price: ₹{dishPrice}</span>
                    <span className="text-green-700 font-bold">After discount: ₹{Math.round(discountedPrice)}</span>
                  </div>
                </div>
              )}

              {/* Price Section */}
              {!applicableCoupon && (
                <div className="p-3 bg-muted rounded-lg">
                  <p className="text-sm text-muted-foreground">Price</p>
                  <p className="text-2xl font-bold text-foreground">₹{dishPrice}</p>
                </div>
              )}
            </div>
          </div>

          {/* Footer */}
          <div className="flex gap-2 px-4 py-3 border-t border-border shrink-0">
            <Button
              variant="outline"
              onClick={handleTryAgain}
              className="flex-1"
            >
              Try Again
            </Button>
            <Button
              onClick={handleAddToCart}
              className="flex-1 bg-primary text-primary-foreground"
            >
              Add to Cart
            </Button>
          </div>
        </div>
      </div>
    )
  }

  return null
}
