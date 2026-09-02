"use client"

import { useState, useEffect } from 'react'
import { ChevronLeft, ChevronRight } from 'lucide-react'
import { cn } from '@/lib/utils'

interface CarouselSlide {
  id: number
  title: string
}

const slides: CarouselSlide[] = [
  { id: 1, title: 'Special Offer 1' },
  { id: 2, title: 'Best Sellers' },
  { id: 3, title: 'New Arrivals' },
  { id: 4, title: 'Limited Time' },
  { id: 5, title: 'Trending Now' },
]

export function FeaturedCarousel() {
  const [currentSlide, setCurrentSlide] = useState(0)

  useEffect(() => {
    const interval = setInterval(() => {
      setCurrentSlide((prev) => (prev + 1) % slides.length)
    }, 5000)
    return () => clearInterval(interval)
  }, [])

  const nextSlide = () => {
    setCurrentSlide((prev) => (prev + 1) % slides.length)
  }

  const prevSlide = () => {
    setCurrentSlide((prev) => (prev - 1 + slides.length) % slides.length)
  }

  return (
    <section className="px-4 py-4">
      <div className="relative bg-gradient-to-br from-primary/10 to-accent/10 rounded-2xl overflow-hidden aspect-video">
        {/* Carousel Slides */}
        <div className="relative w-full h-full flex items-center justify-center">
          {slides.map((slide, index) => (
            <div
              key={slide.id}
              className={cn(
                "absolute inset-0 flex items-center justify-center transition-opacity duration-500 ease-in-out",
                index === currentSlide ? "opacity-100" : "opacity-0"
              )}
            >
              <div className="text-center space-y-2">
                <div className="text-6xl font-bold text-primary opacity-20">
                  {slide.id}
                </div>
                <h3 className="text-2xl font-bold text-foreground">{slide.title}</h3>
                <p className="text-muted-foreground">Featured collection</p>
              </div>
            </div>
          ))}
        </div>

        {/* Navigation Buttons */}
        <button
          onClick={prevSlide}
          className="absolute left-4 top-1/2 -translate-y-1/2 z-10 w-10 h-10 rounded-full bg-white/80 hover:bg-white text-foreground flex items-center justify-center transition-colors"
        >
          <ChevronLeft className="w-5 h-5" />
        </button>
        <button
          onClick={nextSlide}
          className="absolute right-4 top-1/2 -translate-y-1/2 z-10 w-10 h-10 rounded-full bg-white/80 hover:bg-white text-foreground flex items-center justify-center transition-colors"
        >
          <ChevronRight className="w-5 h-5" />
        </button>

        {/* Dots Indicator */}
        <div className="absolute bottom-4 left-1/2 -translate-x-1/2 flex gap-2 z-10">
          {slides.map((_, index) => (
            <button
              key={index}
              onClick={() => setCurrentSlide(index)}
              className={cn(
                "w-2 h-2 rounded-full transition-all",
                index === currentSlide 
                  ? "w-6 bg-primary" 
                  : "bg-white/50 hover:bg-white/75"
              )}
            />
          ))}
        </div>
      </div>
    </section>
  )
}
