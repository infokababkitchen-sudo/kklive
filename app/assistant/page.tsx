"use client"

import { useState, useMemo } from 'react'
import Link from 'next/link'
import { ArrowLeft, Sparkles, Flame, Leaf, Coffee, Sun, Moon, Zap, Heart, Utensils, ChefHat } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { DishCard } from '@/components/dish-card'
import { BottomNav } from '@/components/bottom-nav'
import menuData from '@/data/menu.json'
import { MenuData, Dish } from '@/types/menu'
import { cn } from '@/lib/utils'

const data = menuData as MenuData

type Mood = 'hungry' | 'light' | 'adventurous' | 'comfort' | 'celebratory'
type SpiceLevel = 'mild' | 'medium' | 'hot' | 'any'
type DietPreference = 'veg' | 'non-veg' | 'any'

const moods = [
  { id: 'hungry' as Mood, label: 'Super Hungry', icon: Zap, description: 'Give me something filling!' },
  { id: 'light' as Mood, label: 'Light Bite', icon: Coffee, description: 'Just a small snack' },
  { id: 'adventurous' as Mood, label: 'Adventurous', icon: Sparkles, description: 'Surprise me!' },
  { id: 'comfort' as Mood, label: 'Comfort Food', icon: Heart, description: 'Something warm & cozy' },
  { id: 'celebratory' as Mood, label: 'Celebrating', icon: Sun, description: 'Make it special!' },
]

const spiceLevels = [
  { id: 'mild' as SpiceLevel, label: 'Mild', icon: '🌶️', description: 'Keep it gentle' },
  { id: 'medium' as SpiceLevel, label: 'Medium', icon: '🌶️🌶️', description: 'Some kick please' },
  { id: 'hot' as SpiceLevel, label: 'Hot', icon: '🌶️🌶️🌶️', description: 'Bring the heat!' },
  { id: 'any' as SpiceLevel, label: 'Any', icon: '✨', description: 'Surprise me' },
]

const dietPreferences = [
  { id: 'veg' as DietPreference, label: 'Vegetarian', icon: Leaf, color: 'text-green-600 bg-green-100' },
  { id: 'non-veg' as DietPreference, label: 'Non-Vegetarian', icon: Utensils, color: 'text-red-600 bg-red-100' },
  { id: 'any' as DietPreference, label: 'Any', icon: ChefHat, color: 'text-primary bg-primary/10' },
]

export default function AssistantPage() {
  const [step, setStep] = useState(1)
  const [mood, setMood] = useState<Mood | null>(null)
  const [spiceLevel, setSpiceLevel] = useState<SpiceLevel | null>(null)
  const [dietPreference, setDietPreference] = useState<DietPreference | null>(null)
  const [showResults, setShowResults] = useState(false)

  const recommendations = useMemo(() => {
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

    // Sort and filter by mood
    switch (mood) {
      case 'hungry':
        // Prioritize filling items like main courses and thalis
        dishes = dishes.filter(d => 
          ['non-veg-main', 'pure-veg', 'thali'].includes(d.category) || d.calories > 350
        )
        break
      case 'light':
        // Prioritize lighter items
        dishes = dishes.filter(d => 
          ['momos', 'beverages', 'kabab'].includes(d.category) || d.calories < 350
        )
        break
      case 'adventurous':
        // Mix of different categories, prioritize new and popular
        dishes = dishes.filter(d => d.isNew || d.isPopular)
        break
      case 'comfort':
        // Main courses and classic items
        dishes = dishes.filter(d => 
          ['non-veg-main', 'pure-veg', 'chaap-chinese'].includes(d.category)
        )
        break
      case 'celebratory':
        // Chef specials and premium items
        dishes = dishes.filter(d => 
          ['chef-specials', 'thali', 'kfc'].includes(d.category) || d.isPopular
        )
        break
    }

    // Sort by rating
    dishes.sort((a, b) => b.rating - a.rating)

    // Return top 6
    return dishes.slice(0, 6)
  }, [mood, spiceLevel, dietPreference])

  const handleNext = () => {
    if (step === 3) {
      setShowResults(true)
    } else {
      setStep(step + 1)
    }
  }

  const handleReset = () => {
    setStep(1)
    setMood(null)
    setSpiceLevel(null)
    setDietPreference(null)
    setShowResults(false)
  }

  const getRecommendationMessage = () => {
    if (!mood) return ''
    
    const messages: Record<Mood, string> = {
      hungry: "Here are some filling dishes to satisfy your appetite!",
      light: "Perfect light bites for a quick snack!",
      adventurous: "Ready to try something exciting? Here you go!",
      comfort: "Warm, cozy comfort food coming right up!",
      celebratory: "Special dishes for your special moment!",
    }
    return messages[mood]
  }

  if (showResults) {
    return (
      <div className="min-h-screen bg-background pb-20">
        <header className="sticky top-0 z-50 bg-background border-b border-border">
          <div className="flex items-center gap-4 px-4 py-3">
            <Button variant="ghost" size="icon" onClick={handleReset}>
              <ArrowLeft className="w-5 h-5" />
            </Button>
            <h1 className="text-lg font-bold">Your Recommendations</h1>
          </div>
        </header>

        <div className="p-4">
          <div className="bg-gradient-to-br from-primary to-accent p-4 rounded-2xl mb-6">
            <div className="flex items-center gap-2 mb-2">
              <Sparkles className="w-5 h-5 text-primary-foreground" />
              <span className="text-primary-foreground font-semibold">AI Recommendation</span>
            </div>
            <p className="text-primary-foreground/90 text-sm">{getRecommendationMessage()}</p>
            <div className="flex gap-2 mt-3 flex-wrap">
              <span className="bg-white/20 text-primary-foreground text-xs px-2 py-1 rounded-full">
                {moods.find(m => m.id === mood)?.label}
              </span>
              <span className="bg-white/20 text-primary-foreground text-xs px-2 py-1 rounded-full">
                {spiceLevels.find(s => s.id === spiceLevel)?.label} Spice
              </span>
              <span className="bg-white/20 text-primary-foreground text-xs px-2 py-1 rounded-full">
                {dietPreferences.find(d => d.id === dietPreference)?.label}
              </span>
            </div>
          </div>

          {recommendations.length > 0 ? (
            <div className="grid grid-cols-2 gap-3">
              {recommendations.map(dish => (
                <DishCard key={dish.id} dish={dish} />
              ))}
            </div>
          ) : (
            <div className="text-center py-12">
              <p className="text-muted-foreground mb-4">No dishes match your exact preferences.</p>
              <Button onClick={handleReset} variant="outline">
                Try Different Options
              </Button>
            </div>
          )}

          <div className="mt-6">
            <Button onClick={handleReset} variant="outline" className="w-full">
              Start Over
            </Button>
          </div>
        </div>

        <BottomNav />
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-background pb-20">
      <header className="sticky top-0 z-50 bg-background border-b border-border">
        <div className="flex items-center gap-4 px-4 py-3">
          <Link href="/">
            <Button variant="ghost" size="icon">
              <ArrowLeft className="w-5 h-5" />
            </Button>
          </Link>
          <h1 className="text-lg font-bold">Food Assistant</h1>
        </div>
      </header>

      {/* Progress Indicator */}
      <div className="px-4 py-4">
        <div className="flex items-center gap-2 mb-2">
          {[1, 2, 3].map(s => (
            <div key={s} className="flex-1 h-1.5 rounded-full overflow-hidden bg-muted">
              <div 
                className={cn(
                  "h-full bg-primary transition-all duration-300",
                  s <= step ? "w-full" : "w-0"
                )}
              />
            </div>
          ))}
        </div>
        <p className="text-xs text-muted-foreground">Step {step} of 3</p>
      </div>

      {/* Step 1: Mood */}
      {step === 1 && (
        <div className="px-4">
          <div className="mb-6">
            <h2 className="text-xl font-bold text-foreground mb-1">What&apos;s your mood?</h2>
            <p className="text-sm text-muted-foreground">Tell us how you&apos;re feeling today</p>
          </div>

          <div className="space-y-3">
            {moods.map(m => (
              <button
                key={m.id}
                onClick={() => setMood(m.id)}
                className={cn(
                  "w-full flex items-center gap-4 p-4 rounded-xl border transition-all",
                  mood === m.id 
                    ? "border-primary bg-primary/5" 
                    : "border-border bg-card hover:border-primary/50"
                )}
              >
                <div className={cn(
                  "w-12 h-12 rounded-xl flex items-center justify-center",
                  mood === m.id ? "bg-primary text-primary-foreground" : "bg-muted text-muted-foreground"
                )}>
                  <m.icon className="w-6 h-6" />
                </div>
                <div className="text-left">
                  <h3 className="font-semibold text-foreground">{m.label}</h3>
                  <p className="text-sm text-muted-foreground">{m.description}</p>
                </div>
              </button>
            ))}
          </div>
        </div>
      )}

      {/* Step 2: Spice Level */}
      {step === 2 && (
        <div className="px-4">
          <div className="mb-6">
            <h2 className="text-xl font-bold text-foreground mb-1">How spicy?</h2>
            <p className="text-sm text-muted-foreground">Choose your preferred spice level</p>
          </div>

          <div className="grid grid-cols-2 gap-3">
            {spiceLevels.map(s => (
              <button
                key={s.id}
                onClick={() => setSpiceLevel(s.id)}
                className={cn(
                  "flex flex-col items-center gap-2 p-4 rounded-xl border transition-all",
                  spiceLevel === s.id 
                    ? "border-primary bg-primary/5" 
                    : "border-border bg-card hover:border-primary/50"
                )}
              >
                <span className="text-2xl">{s.icon}</span>
                <h3 className="font-semibold text-foreground">{s.label}</h3>
                <p className="text-xs text-muted-foreground text-center">{s.description}</p>
              </button>
            ))}
          </div>
        </div>
      )}

      {/* Step 3: Diet Preference */}
      {step === 3 && (
        <div className="px-4">
          <div className="mb-6">
            <h2 className="text-xl font-bold text-foreground mb-1">Diet preference?</h2>
            <p className="text-sm text-muted-foreground">What would you like to eat?</p>
          </div>

          <div className="space-y-3">
            {dietPreferences.map(d => (
              <button
                key={d.id}
                onClick={() => setDietPreference(d.id)}
                className={cn(
                  "w-full flex items-center gap-4 p-4 rounded-xl border transition-all",
                  dietPreference === d.id 
                    ? "border-primary bg-primary/5" 
                    : "border-border bg-card hover:border-primary/50"
                )}
              >
                <div className={cn(
                  "w-12 h-12 rounded-xl flex items-center justify-center",
                  d.color
                )}>
                  <d.icon className="w-6 h-6" />
                </div>
                <h3 className="font-semibold text-foreground">{d.label}</h3>
              </button>
            ))}
          </div>
        </div>
      )}

      {/* Navigation Buttons */}
      <div className="fixed bottom-20 left-0 right-0 px-4 py-4 bg-background border-t border-border">
        <div className="flex gap-3">
          {step > 1 && (
            <Button 
              variant="outline" 
              onClick={() => setStep(step - 1)}
              className="flex-1"
            >
              Back
            </Button>
          )}
          <Button 
            onClick={handleNext}
            disabled={
              (step === 1 && !mood) || 
              (step === 2 && !spiceLevel) || 
              (step === 3 && !dietPreference)
            }
            className="flex-1 bg-primary text-primary-foreground"
          >
            {step === 3 ? 'Get Recommendations' : 'Next'}
          </Button>
        </div>
      </div>

      <BottomNav />
    </div>
  )
}
