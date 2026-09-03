"use client"

import { useEffect, useState } from 'react'
import Image from 'next/image'
import { Grid3X3, Check, X } from 'lucide-react'
import { cn } from '@/lib/utils'
import { Category } from '@/types/menu'

interface CategoryTabsProps {
  categories: Category[]
  activeCategory: string
  onCategoryChange: (id: string) => void
  dishCounts: Record<string, number>
}

export function CategoryTabs({
  categories,
  activeCategory,
  onCategoryChange,
  dishCounts,
}: CategoryTabsProps) {
  const [showCategorySheet, setShowCategorySheet] = useState(false)

  // Sheet khuli ho to peeche wala page scroll na ho
  useEffect(() => {
    if (!showCategorySheet) return
    const prev = document.body.style.overflow
    document.body.style.overflow = 'hidden'
    return () => {
      document.body.style.overflow = prev
    }
  }, [showCategorySheet])

  const handleCategoryClick = (categoryId: string) => {
    if (categoryId === 'all') setShowCategorySheet(true)
    else onCategoryChange(categoryId)
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
                  'flex items-center gap-1.5 rounded-full py-1 pl-1 pr-2.5 text-[11px] font-medium transition-all whitespace-nowrap',
                  isActive
                    ? 'bg-primary text-primary-foreground shadow-sm'
                    : 'bg-secondary text-secondary-foreground hover:bg-secondary/80'
                )}
              >
                {category.id === 'all' || !category.image ? (
                  <span className="flex h-5 w-5 items-center justify-center">
                    <Grid3X3 className="h-3.5 w-3.5" />
                  </span>
                ) : (
                  <span className="relative h-5 w-5 overflow-hidden rounded-full">
                    <Image
                      src={category.image}
                      alt=""
                      fill
                      className="object-cover"
                      sizes="20px"
                      onError={e => {
                        ;(e.target as HTMLImageElement).src = '/images/placeholder-dish.jpg'
                      }}
                    />
                  </span>
                )}
                <span>{category.name}</span>
                <span
                  className={cn(
                    'text-[9px]',
                    isActive ? 'text-primary-foreground/80' : 'text-muted-foreground'
                  )}
                >
                  {count}
                </span>
              </button>
            )
          })}
        </div>
      </div>

      {showCategorySheet && (
        <div className="fixed inset-0 z-[70]">
          <div
            className="absolute inset-0 bg-black/50"
            onClick={() => setShowCategorySheet(false)}
          />

          {/*
            dvh (vh nahi) - mobile browser ka URL bar vh ko galat kar deta hai,
            isliye aakhri category kat jaati thi.
          */}
          <div className="absolute bottom-0 left-0 right-0 flex max-h-[85dvh] flex-col overflow-hidden rounded-t-2xl bg-background animate-in slide-in-from-bottom duration-300">
            <div className="flex shrink-0 justify-center pt-3 pb-1">
              <div className="h-1 w-10 rounded-full bg-muted-foreground/30" />
            </div>

            <div className="flex shrink-0 items-center justify-between border-b border-border px-4 py-3">
              <h2 className="text-lg font-bold text-foreground">Select Category</h2>
              <button
                onClick={() => setShowCategorySheet(false)}
                className="flex h-8 w-8 items-center justify-center rounded-full bg-muted"
              >
                <X className="h-5 w-5 text-muted-foreground" />
              </button>
            </div>

            {/* overscroll-contain: touch scroll sheet ke andar hi rahe */}
            <div className="flex-1 overflow-y-auto overscroll-contain p-4 pb-[calc(7rem+env(safe-area-inset-bottom))]">
              <div className="grid grid-cols-2 gap-2">
                {categories.map(category => {
                  const isActive = activeCategory === category.id
                  const count = dishCounts[category.id] || 0
                  return (
                    <button
                      key={category.id}
                      onClick={() => handleSelectCategory(category.id)}
                      className={cn(
                        'flex items-center gap-2 rounded-xl border-2 p-2.5 text-left transition-all',
                        isActive
                          ? 'border-primary bg-primary/10'
                          : 'border-border hover:border-primary/50 hover:bg-muted/50'
                      )}
                    >
                      {category.id === 'all' || !category.image ? (
                        <div
                          className={cn(
                            'flex h-11 w-11 shrink-0 items-center justify-center rounded-lg',
                            isActive
                              ? 'bg-primary text-primary-foreground'
                              : 'bg-muted text-muted-foreground'
                          )}
                        >
                          <Grid3X3 className="h-5 w-5" />
                        </div>
                      ) : (
                        <div className="relative h-11 w-11 shrink-0 overflow-hidden rounded-lg">
                          <Image
                            src={category.image}
                            alt=""
                            fill
                            className="object-cover"
                            sizes="44px"
                            onError={e => {
                              ;(e.target as HTMLImageElement).src = '/images/placeholder-dish.jpg'
                            }}
                          />
                        </div>
                      )}
                      <div className="min-w-0 flex-1">
                        <div className="flex items-center gap-1">
                          <span
                            className={cn(
                              'truncate text-xs font-medium',
                              isActive ? 'text-primary' : 'text-foreground'
                            )}
                          >
                            {category.name}
                          </span>
                          {isActive && <Check className="h-3.5 w-3.5 shrink-0 text-primary" />}
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
