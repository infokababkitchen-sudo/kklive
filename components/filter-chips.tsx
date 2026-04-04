"use client"

import { Leaf, Drumstick, TrendingUp, Sparkles } from 'lucide-react'
import { cn } from '@/lib/utils'

export type FilterType = 'veg' | 'non-veg' | 'popular' | 'new'

interface FilterChipsProps {
  activeFilters: FilterType[]
  onFilterToggle: (filter: FilterType) => void
}

const filters: { id: FilterType; label: string; icon: React.ReactNode }[] = [
  { id: 'veg', label: 'Veg', icon: <div className="w-4 h-4 rounded border-2 border-green-600 flex items-center justify-center"><div className="w-2 h-2 rounded-full bg-green-600" /></div> },
  { id: 'non-veg', label: 'Non-Veg', icon: <div className="w-4 h-4 rounded border-2 border-red-600 flex items-center justify-center"><div className="w-2 h-2 rounded-full bg-red-600" /></div> },
  { id: 'popular', label: 'Popular', icon: <TrendingUp className="w-4 h-4" /> },
  { id: 'new', label: 'New', icon: <Sparkles className="w-4 h-4" /> },
]

export function FilterChips({ activeFilters, onFilterToggle }: FilterChipsProps) {
  return (
    <div className="flex items-center gap-2 px-4 py-2 overflow-x-auto scrollbar-hide">
      <span className="text-sm text-muted-foreground font-medium shrink-0">Filters:</span>
      {filters.map(filter => {
        const isActive = activeFilters.includes(filter.id)
        return (
          <button
            key={filter.id}
            onClick={() => onFilterToggle(filter.id)}
            className={cn(
              "flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-medium transition-all whitespace-nowrap border",
              isActive 
                ? "bg-primary/10 text-primary border-primary" 
                : "bg-background text-foreground border-border hover:border-primary/50"
            )}
          >
            {filter.icon}
            <span>{filter.label}</span>
          </button>
        )
      })}
    </div>
  )
}
