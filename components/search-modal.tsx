"use client"

import { useState, useMemo } from 'react'
import { Search, X, Plus } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { DishCard } from '@/components/dish-card'
import { useCart } from '@/context/cart-context'
import { useMenu } from '@/hooks/use-menu'
import { MenuData, Dish } from '@/types/menu'
import { cn } from '@/lib/utils'


interface SearchModalProps {
  isOpen: boolean
  onClose: () => void
}

export function SearchModal({ isOpen, onClose }: SearchModalProps) {
  const data = useMenu()
  const [searchQuery, setSearchQuery] = useState('')
  const { addItem } = useCart()

  const searchResults = useMemo(() => {
    if (!searchQuery.trim()) return []
    
    const query = searchQuery.toLowerCase()
    return data.dishes.filter(dish => 
      dish.name.toLowerCase().includes(query) ||
      dish.description.toLowerCase().includes(query) ||
      dish.category.toLowerCase().includes(query)
    ).slice(0, 12)
  }, [searchQuery])

  if (!isOpen) return null

  return (
    <div className="fixed inset-0 z-50 bg-background">
      <div className="flex flex-col h-full">
        {/* Header */}
        <div className="flex items-center gap-3 px-4 py-3 border-b border-border">
          <div className="flex-1 flex items-center gap-2 bg-secondary rounded-lg px-3 py-2">
            <Search className="w-5 h-5 text-muted-foreground" />
            <input
              type="text"
              placeholder="Search dishes..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              autoFocus
              className="flex-1 bg-transparent outline-none text-foreground placeholder-muted-foreground"
            />
            {searchQuery && (
              <button
                onClick={() => setSearchQuery('')}
                className="w-5 h-5 flex items-center justify-center text-muted-foreground hover:text-foreground"
              >
                <X className="w-4 h-4" />
              </button>
            )}
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

        {/* Results */}
        <div className="flex-1 overflow-y-auto p-4">
          {searchQuery.trim() === '' ? (
            <div className="flex flex-col items-center justify-center h-full text-center">
              <Search className="w-12 h-12 text-muted-foreground/50 mb-4" />
              <p className="text-muted-foreground text-sm">Start typing to search for dishes</p>
            </div>
          ) : searchResults.length > 0 ? (
            <div className="grid grid-cols-2 gap-3">
              {searchResults.map(dish => (
                <DishCard key={dish.id} dish={dish} />
              ))}
            </div>
          ) : (
            <div className="flex flex-col items-center justify-center h-full text-center">
              <Search className="w-12 h-12 text-muted-foreground/50 mb-4" />
              <p className="text-muted-foreground text-sm">No dishes found for &quot;{searchQuery}&quot;</p>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
