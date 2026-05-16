"use client"

import { useState } from 'react'
import { 
  Grid3X3, 
  Drumstick, 
  ChefHat, 
  Leaf, 
  UtensilsCrossed, 
  Circle,
  Flame,
  Coffee,
  Plus,
  Check,
  X
} from 'lucide-react'
import { cn } from '@/lib/utils'
import { Category } from '@/types/menu'

const iconMap: Record<string, React.ReactNode> = {
  grid: <Grid3X3 className="w-3.5 h-3.5" />,
  drumstick: <Drumstick className="w-3.5 h-3.5" />,
  'chef-hat': <ChefHat className="w-3.5 h-3.5" />,
  leaf: <Leaf className="w-3.5 h-3.5" />,
  utensils: <UtensilsCrossed className="w-3.5 h-3.5" />,
  circle: <Circle className="w-3.5 h-3.5" />,
  flame: <Flame className="w-3.5 h-3.5" />,
  coffee: <Coffee className="w-3.5 h-3.5" />,
  plate: <UtensilsCrossed className="w-3.5 h-3.5" />,
  plus: <Plus className="w-3.5 h-3.5" />,
}

const iconMapLarge: Record<string, React.ReactNode> = {
  grid: <Grid3X3 className="w-5 h-5" />,
  drumstick: <Drumstick className="w-5 h-5" />,
  'chef-hat': <ChefHat className="w-5 h-5" />,
  leaf: <Leaf className="w-5 h-5" />,
  utensils: <UtensilsCrossed className="w-5 h-5" />,
  circle: <Circle className="w-5 h-5" />,
  flame: <Flame className="w-5 h-5" />,
  coffee: <Coffee className="w-5 h-5" />,
  plate: <UtensilsCrossed className="w-5 h-5" />,
  plus: <Plus className="w-5 h-5" />,
}

interface CategoryTabsProps {
  categories: Category[]
  activeCategory: string
  onCategoryChange: (categoryId: string) => void
  dishCounts: Record<string, number>
}

export function CategoryTabs({ 
  categories, 
  activeCategory, 
  onCategoryChange,
  dishCounts 
}: CategoryTabsProps) {
  const [showCategorySheet, setShowCategorySheet] = useState(false)

  const handleCategoryClick = (categoryId: string) => {
    if (categoryId === 'all') {
      setShowCategorySheet(true)
    } else {
      onCategoryChange(categoryId)
    }
  }

  const handleSelectCategory = (categoryId: string) => {
    onCategoryChange(categoryId)
    setShowCategorySheet(false)
  }

  return (
    <>
      <div className="overflow-x-auto scrollbar-hide border-b border-border">
        <div className="flex gap-1 px-2 py-1.5 min-w-max">
          {categories.map(category => {
            const isActive = activeCategory === category.id
            const count = dishCounts[category.id] || 0
            return (
              <button
                key={category.id}
                onClick={() => handleCategoryClick(category.id)}
                className={cn(
                  "flex items-center gap-1 px-2.5 py-1 rounded-full text-[11px] font-medium transition-all whitespace-nowrap",
                  isActive 
                    ? "bg-primary text-primary-foreground shadow-sm" 
                    : "bg-secondary text-secondary-foreground hover:bg-secondary/80"
                )}
              >
                {iconMap[category.icon]}
                <span>{category.name}</span>
                <span className={cn(
                  "text-[9px]",
                  isActive ? "text-primary-foreground/80" : "text-muted-foreground"
                )}>
                  {count}
                </span>
              </button>
            )
          })}
        </div>
      </div>

      {/* Mobile-Optimized Bottom Sheet */}
      {showCategorySheet && (
        <div className="fixed inset-0 z-50">
          {/* Backdrop */}
          <div 
            className="absolute inset-0 bg-black/50 transition-opacity"
            onClick={() => setShowCategorySheet(false)}
          />
          
          {/* Sheet Content */}
          <div className="absolute bottom-0 left-0 right-0 bg-background rounded-t-2xl max-h-[85vh] overflow-hidden animate-in slide-in-from-bottom duration-300 flex flex-col">
            {/* Handle */}
            <div className="flex justify-center pt-3 pb-1 shrink-0">
              <div className="w-10 h-1 bg-muted-foreground/30 rounded-full" />
            </div>
            
            {/* Header */}
            <div className="flex items-center justify-between px-4 py-3 border-b border-border shrink-0">
              <h2 className="text-lg font-bold text-foreground">Select Category</h2>
              <button 
                onClick={() => setShowCategorySheet(false)}
                className="w-8 h-8 flex items-center justify-center rounded-full bg-muted"
              >
                <X className="w-5 h-5 text-muted-foreground" />
              </button>
            </div>
            
            {/* Categories Grid - Scrollable */}
            <div className="p-4 overflow-y-auto flex-1">
              <div className="grid grid-cols-2 gap-2">
                {categories.map(category => {
                  const isActive = activeCategory === category.id
                  const count = dishCounts[category.id] || 0
                  return (
                    <button
                      key={category.id}
                      onClick={() => handleSelectCategory(category.id)}
                      className={cn(
                        "flex items-center gap-2 p-3 rounded-xl border-2 transition-all text-left",
                        isActive 
                          ? "border-primary bg-primary/10" 
                          : "border-border hover:border-primary/50 hover:bg-muted/50"
                      )}
                    >
                      <div className={cn(
                        "w-9 h-9 rounded-lg flex items-center justify-center shrink-0",
                        isActive ? "bg-primary text-primary-foreground" : "bg-muted text-muted-foreground"
                      )}>
                        {iconMapLarge[category.icon]}
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-1">
                          <span className={cn(
                            "font-medium text-xs truncate",
                            isActive ? "text-primary" : "text-foreground"
                          )}>
                            {category.name}
                          </span>
                          {isActive && <Check className="w-3.5 h-3.5 text-primary shrink-0" />}
                        </div>
                        <span className="text-[10px] text-muted-foreground">{count} items</span>
                      </div>
                    </button>
                  )
                })}
              </div>
            </div>
          </div>
        </div>
      )}
    </>
  )
}
