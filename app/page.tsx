"use client"

import { useState, useMemo, useEffect } from 'react'
import { Header } from '@/components/header'
import { BottomNav } from '@/components/bottom-nav'
import { CategoryTabs } from '@/components/category-tabs'
import { FilterChips, FilterType } from '@/components/filter-chips'
import { DishCard } from '@/components/dish-card'
import { SurpriseMePopup } from '@/components/surprise-me-popup'
import { FeaturedCarousel } from '@/components/featured-carousel'
import { useCart } from '@/context/cart-context'
import menuData from '@/data/menu.json'
import { MenuData, Dish } from '@/types/menu'
import Image from 'next/image'

const data = menuData as MenuData

export default function MenuPage() {
  const [activeCategory, setActiveCategory] = useState('all')
  const [activeFilters, setActiveFilters] = useState<FilterType[]>([])
  const [showSurpriseMe, setShowSurpriseMe] = useState(false)
  const [hasShownSurpriseMe, setHasShownSurpriseMe] = useState(false)
  const { items } = useCart()

  // Show surprise me popup after 3 seconds on first load
  useEffect(() => {
    const timer = setTimeout(() => {
      if (!hasShownSurpriseMe) {
        setShowSurpriseMe(true)
        setHasShownSurpriseMe(true)
      }
    }, 3000)
    return () => clearTimeout(timer)
  }, [hasShownSurpriseMe])

  const handleFilterToggle = (filter: FilterType) => {
    setActiveFilters(prev => {
      if (prev.includes(filter)) {
        return prev.filter(f => f !== filter)
      }
      // If selecting veg, remove non-veg and vice versa
      if (filter === 'veg') {
        return [...prev.filter(f => f !== 'non-veg'), filter]
      }
      if (filter === 'non-veg') {
        return [...prev.filter(f => f !== 'veg'), filter]
      }
      return [...prev, filter]
    })
  }

  const dishCounts = useMemo(() => {
    const counts: Record<string, number> = { all: data.dishes.length }
    data.categories.forEach(cat => {
      if (cat.id !== 'all') {
        counts[cat.id] = data.dishes.filter(d => d.category === cat.id).length
      }
    })
    return counts
  }, [])

  const filteredDishes = useMemo(() => {
    let dishes = data.dishes

    // Filter by category
    if (activeCategory !== 'all') {
      dishes = dishes.filter(d => d.category === activeCategory)
    }

    // Filter by veg/non-veg
    if (activeFilters.includes('veg')) {
      dishes = dishes.filter(d => d.isVeg)
    }
    if (activeFilters.includes('non-veg')) {
      dishes = dishes.filter(d => !d.isVeg)
    }

    // Filter by popular
    if (activeFilters.includes('popular')) {
      dishes = dishes.filter(d => d.isPopular)
    }

    // Filter by new
    if (activeFilters.includes('new')) {
      dishes = dishes.filter(d => d.isNew)
    }

    return dishes
  }, [activeCategory, activeFilters])

  const popularDishes = filteredDishes.filter(d => d.isPopular)
  const regularDishes = filteredDishes.filter(d => !d.isPopular)

  return (
    <div className="min-h-screen bg-background pb-20">
      <Header />
      
      {/* Selected Dishes Preview Above Bottom Nav */}
      {items.length > 0 && (
        <div className="fixed bottom-20 left-0 right-0 z-40 bg-background border-t border-border">
          <div className="flex gap-2 px-4 py-2 overflow-x-auto scrollbar-hide">
            {items.slice(0, 5).map((item, index) => (
              <div key={`${item.id}-${item.size}-${index}`} className="relative shrink-0">
                <div className="w-14 h-14 rounded-lg overflow-hidden border-2 border-primary">
                  <Image
                    src={item.image}
                    alt={item.name}
                    width={56}
                    height={56}
                    className="w-full h-full object-cover"
                  />
                </div>
                <span className="absolute -top-2 -right-2 w-5 h-5 bg-primary text-primary-foreground text-xs font-bold rounded-full flex items-center justify-center">
                  {item.quantity}
                </span>
              </div>
            ))}
            {items.length > 5 && (
              <div className="w-14 h-14 rounded-lg bg-secondary border-2 border-secondary flex items-center justify-center text-xs font-bold text-secondary-foreground shrink-0">
                +{items.length - 5}
              </div>
            )}
          </div>
        </div>
      )}
      
      <CategoryTabs
        categories={data.categories}
        activeCategory={activeCategory}
        onCategoryChange={setActiveCategory}
        dishCounts={dishCounts}
      />

      <FilterChips
        activeFilters={activeFilters}
        onFilterToggle={handleFilterToggle}
      />

      {/* Featured Carousel - Replaces first 50% promo */}
      <FeaturedCarousel />

      {/* Popular Items Section */}
      {popularDishes.length > 0 && !activeFilters.includes('new') && (
        <section className="px-4 py-4">
          <div className="flex items-center gap-2 mb-4">
            <div className="w-1 h-5 bg-primary rounded-full" />
            <h2 className="text-lg font-bold text-foreground">Popular Items</h2>
          </div>
          <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-3">
            {popularDishes.slice(0, 6).map(dish => (
              <DishCard key={dish.id} dish={dish} />
            ))}
          </div>
        </section>
      )}

      {/* All Items Section */}
      <section className="px-4 py-4">
        <div className="flex items-center gap-2 mb-4">
          <div className="w-1 h-5 bg-primary rounded-full" />
          <h2 className="text-lg font-bold text-foreground">
            {activeCategory === 'all' ? 'All Items' : data.categories.find(c => c.id === activeCategory)?.name}
          </h2>
          <span className="text-sm text-muted-foreground">({filteredDishes.length})</span>
        </div>
        {filteredDishes.length > 0 ? (
          <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-3">
            {filteredDishes.map(dish => (
              <DishCard key={dish.id} dish={dish} />
            ))}
          </div>
        ) : (
          <div className="text-center py-12">
            <p className="text-muted-foreground">No dishes found with the selected filters</p>
          </div>
        )}
      </section>

      <BottomNav />
      {showSurpriseMe && <SurpriseMePopup onClose={() => setShowSurpriseMe(false)} />}
    </div>
  )
}
