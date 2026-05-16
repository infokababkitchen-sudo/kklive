"use client"

import { useState } from 'react'
import { X, Sparkles, ChevronRight } from 'lucide-react'
import { Button } from '@/components/ui/button'
import menuData from '@/data/menu.json'
import { MenuData, Dish } from '@/types/menu'
import { useCart } from '@/context/cart-context'
import Image from 'next/image'

const data = menuData as MenuData

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
  const [selectedCuisine, setSelectedCuisine] = useState<CuisineType | null>(null)
  const [suggestedDishes, setSuggestedDishes] = useState<Dish[]>([])

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
      setStep(3)
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
    setStep(2)
    setSelectedCuisine(null)
    setSuggestedDishes([])
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

  // Step 2: Cuisine Selection
  if (step === 2) {
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
            <p className="text-sm text-muted-foreground text-center">Budget: <span className="font-bold text-primary">₹{priceRange}</span></p>

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
              onClick={() => setStep(1)}
              className="w-full"
            >
              Back
            </Button>
          </div>
        </div>
      </div>
    )
  }

  // Step 3: Dish Selection (2 options)
  if (step === 3 && suggestedDishes.length > 0) {
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
          <div className="p-6 space-y-4">
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
                    <h3 className="font-bold text-foreground truncate">{dish.name}</h3>
                    <p className="text-xs text-muted-foreground line-clamp-2">{dish.description}</p>
                    
                    <div className="flex items-center justify-between mt-2">
                      <div className="flex items-center gap-1">
                        <span className="text-sm font-semibold text-primary">★ {dish.rating}</span>
                      </div>
                      <span className="font-bold text-foreground">
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
