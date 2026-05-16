"use client"

import { useState, useEffect } from 'react'
import { X, Sparkles } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { DishCard } from '@/components/dish-card'
import menuData from '@/data/menu.json'
import { MenuData, Dish } from '@/types/menu'
import { cn } from '@/lib/utils'

const data = menuData as MenuData

type Mood = 'hungry' | 'light' | 'adventurous' | 'comfort' | 'celebratory'
type SpiceLevel = 'mild' | 'medium' | 'hot' | 'any'
type DietPreference = 'veg' | 'non-veg' | 'any'

const moodNames = ['Surprise Me', 'Hungry Me', 'Pata Nahi']
const moods: Mood[] = ['hungry', 'light', 'adventurous', 'comfort', 'celebratory']
const spiceLevels: SpiceLevel[] = ['mild', 'medium', 'hot', 'any']
const dietPreferences: DietPreference[] = ['veg', 'non-veg', 'any']

interface SurpriseMePopupProps {
  onClose: () => void
}

export function SurpriseMePopup({ onClose }: SurpriseMePopupProps) {
  const [currentNameIndex, setCurrentNameIndex] = useState(0)
  const [step, setStep] = useState(1)
  const [mood, setMood] = useState<Mood | null>(null)
  const [spiceLevel, setSpiceLevel] = useState<SpiceLevel | null>(null)
  const [dietPreference, setDietPreference] = useState<DietPreference | null>(null)
  const [recommendations, setRecommendations] = useState<Dish[]>([])

  // Change name every 3 seconds
  useEffect(() => {
    const interval = setInterval(() => {
      setCurrentNameIndex((prev) => (prev + 1) % moodNames.length)
    }, 3000)
    return () => clearInterval(interval)
  }, [])

  const getRecommendations = () => {
    if (!mood || !spiceLevel || !dietPreference) return []

    let dishes = [...data.dishes]

    // Filter by diet preference
    if (dietPreference === 'veg') {
      dishes = dishes.filter(d => d.isVeg)
    } else if (dietPreference === 'non-veg') {
      dishes = dishes.filter(d => !d.isVeg)
    }

    // Filter by spice level
    if (spiceLevel !== 'any') {
      dishes = dishes.filter(d => d.spiceLevel === spiceLevel || d.spiceLevel === 'none')
    }

    // Sort by mood
    switch (mood) {
      case 'hungry':
        dishes = dishes.filter(d => d.calories > 350)
        break
      case 'light':
        dishes = dishes.filter(d => d.calories < 350)
        break
      case 'adventurous':
        dishes = dishes.filter(d => d.isNew || d.isPopular)
        break
      case 'comfort':
        dishes = dishes.filter(d => 
          ['non-veg-main', 'pure-veg', 'chaap-chinese'].includes(d.category)
        )
        break
      case 'celebratory':
        dishes = dishes.filter(d => d.isPopular)
        break
    }

    dishes.sort((a, b) => b.rating - a.rating)
    return dishes.slice(0, 6)
  }

  const handleNext = () => {
    if (step === 1) {
      setMood(moods[Math.floor(Math.random() * moods.length)])
      setStep(2)
    } else if (step === 2) {
      setSpiceLevel(spiceLevels[Math.floor(Math.random() * spiceLevels.length)])
      setStep(3)
    } else if (step === 3) {
      setDietPreference(dietPreferences[Math.floor(Math.random() * dietPreferences.length)])
      const recs = getRecommendations()
      setRecommendations(recs)
      setStep(4)
    }
  }

  if (step === 4) {
    return (
      <div className="fixed inset-0 z-50 bg-black/50 flex items-end">
        <div className="w-full bg-background rounded-t-3xl max-h-[90vh] overflow-hidden flex flex-col animate-in slide-in-from-bottom duration-300">
          {/* Header */}
          <div className="flex items-center justify-between px-4 py-3 border-b border-border shrink-0">
            <h2 className="text-lg font-bold text-foreground">Your Surprise Selection</h2>
            <Button
              variant="ghost"
              size="icon"
              onClick={onClose}
              className="text-muted-foreground"
            >
              <X className="w-5 h-5" />
            </Button>
          </div>

          {/* Results */}
          <div className="flex-1 overflow-y-auto p-4">
            {recommendations.length > 0 ? (
              <div className="grid grid-cols-2 gap-3">
                {recommendations.map(dish => (
                  <DishCard key={dish.id} dish={dish} />
                ))}
              </div>
            ) : (
              <div className="flex flex-col items-center justify-center h-full text-center">
                <p className="text-muted-foreground">No dishes found with those preferences</p>
              </div>
            )}
          </div>

          {/* Footer */}
          <div className="flex gap-2 px-4 py-3 border-t border-border shrink-0">
            <Button
              variant="outline"
              onClick={() => {
                setStep(1)
                setMood(null)
                setSpiceLevel(null)
                setDietPreference(null)
                setRecommendations([])
              }}
              className="flex-1"
            >
              Try Again
            </Button>
            <Button
              onClick={onClose}
              className="flex-1 bg-primary text-primary-foreground"
            >
              Continue to Menu
            </Button>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="fixed inset-0 z-50 bg-black/50 flex items-end">
      <div className="w-full bg-background rounded-t-3xl max-h-[90vh] overflow-hidden animate-in slide-in-from-bottom duration-300 flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between px-4 py-3 border-b border-border shrink-0">
          <div className="flex items-center gap-2">
            <Sparkles className="w-5 h-5 text-primary" />
            <h2 className="text-lg font-bold text-foreground">{moodNames[currentNameIndex]}</h2>
          </div>
          <Button
            variant="ghost"
            size="icon"
            onClick={onClose}
            className="text-muted-foreground"
          >
            <X className="w-5 h-5" />
          </Button>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto p-4 flex flex-col justify-center">
          <div className="text-center">
            {step === 1 && (
              <div className="space-y-6">
                <div>
                  <h3 className="text-xl font-bold text-foreground mb-2">Don't know what to order?</h3>
                  <p className="text-muted-foreground text-sm">We'll pick something delicious for you based on your preferences!</p>
                </div>
                <div className="space-y-3">
                  <p className="text-sm text-muted-foreground">Your selections will be randomized, so relax and enjoy!</p>
                </div>
              </div>
            )}
            {step === 2 && (
              <div className="space-y-4">
                <Sparkles className="w-12 h-12 text-primary mx-auto animate-pulse" />
                <div>
                  <h3 className="text-xl font-bold text-foreground mb-1">Selecting your mood...</h3>
                  <p className="text-muted-foreground text-sm">Random: {mood}</p>
                </div>
              </div>
            )}
            {step === 3 && (
              <div className="space-y-4">
                <Sparkles className="w-12 h-12 text-primary mx-auto animate-pulse" />
                <div>
                  <h3 className="text-xl font-bold text-foreground mb-1">Choosing spice level...</h3>
                  <p className="text-muted-foreground text-sm">Random: {spiceLevel}</p>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Footer */}
        <div className="px-4 py-3 border-t border-border shrink-0">
          <Button
            onClick={handleNext}
            className="w-full bg-primary text-primary-foreground"
          >
            {step === 1 ? 'Start Magic' : 'Next'}
          </Button>
        </div>
      </div>
    </div>
  )
}
