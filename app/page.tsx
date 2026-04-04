"use client"

import { useState, useMemo } from 'react'
import { Header } from '@/components/header'
import { BottomNav } from '@/components/bottom-nav'
import { CategoryTabs } from '@/components/category-tabs'
import { FilterChips, FilterType } from '@/components/filter-chips'
import { DishCard } from '@/components/dish-card'
import { PromoBanner } from '@/components/promo-banner'
import menuData from '@/data/menu.json'
import { MenuData, Dish } from '@/types/menu'

const data = menuData as MenuData

export default function MenuPage() {
  const [activeCategory, setActiveCategory] = useState('all')
  const [activeFilters, setActiveFilters] = useState<FilterType[]>([])

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

  const activePromo = data.promoCodes[0]

  return (
    <div className="min-h-screen bg-background pb-20">
      <Header />
      
      <CategoryTabs
        categories={data.categories}
        activeCategory={activeCategory}
        onCategoryChange={setActiveCategory}
        dishCounts={dishCounts}
      />

      <PromoBanner
        code={activePromo.code}
        description={activePromo.description}
        validTill={new Date(activePromo.validTill).toLocaleDateString('en-IN', { 
          day: 'numeric', 
          month: 'long', 
          year: 'numeric' 
        })}
      />

      <FilterChips
        activeFilters={activeFilters}
        onFilterToggle={handleFilterToggle}
      />

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
            {(activeFilters.includes('new') || popularDishes.length === 0 ? filteredDishes : regularDishes).map(dish => (
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
    </div>
  )
}
