"use client"

import { useState, useEffect } from 'react'
import Image from 'next/image'
import { ChevronLeft, ChevronRight } from 'lucide-react'
import { cn } from '@/lib/utils'
import { useMenu } from '@/hooks/use-menu'

interface Slide {
  id: string
  title: string
  subtitle?: string
  image?: string
}

/** Used until the owner adds banners in the admin dashboard. */
const FALLBACK: Slide[] = [
  { id: 'f1', title: 'Special Offer', subtitle: 'Featured collection' },
  { id: 'f2', title: 'Best Sellers', subtitle: 'Featured collection' },
  { id: 'f3', title: 'New Arrivals', subtitle: 'Featured collection' },
]

export function FeaturedCarousel() {
  const menu = useMenu()
  const fromAdmin = (menu.banners || []).filter(b => b.active)
  const slides: Slide[] = fromAdmin.length ? fromAdmin : FALLBACK

  const [current, setCurrent] = useState(0)

  useEffect(() => {
    setCurrent(0)
  }, [slides.length])

  useEffect(() => {
    if (slides.length < 2) return
    const t = setInterval(() => setCurrent(p => (p + 1) % slides.length), 5000)
    return () => clearInterval(t)
  }, [slides.length])

  const next = () => setCurrent(p => (p + 1) % slides.length)
  const prev = () => setCurrent(p => (p - 1 + slides.length) % slides.length)

  return (
    <section className="px-4 py-4">
      <div className="relative aspect-video overflow-hidden rounded-2xl bg-gradient-to-br from-primary/10 to-accent/10">
        <div className="relative h-full w-full">
          {slides.map((slide, i) => (
            <div
              key={slide.id}
              className={cn(
                'absolute inset-0 transition-opacity duration-500 ease-in-out',
                i === current ? 'opacity-100' : 'opacity-0'
              )}
            >
              {slide.image ? (
                <>
                  <Image
                    src={slide.image}
                    alt={slide.title}
                    fill
                    className="object-cover"
                    sizes="(max-width: 768px) 100vw, 640px"
                    onError={e => {
                      ;(e.target as HTMLImageElement).style.display = 'none'
                    }}
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-black/65 via-black/20 to-transparent" />
                  <div className="absolute inset-x-0 bottom-0 p-4">
                    <h3 className="text-xl font-bold text-white drop-shadow">{slide.title}</h3>
                    {slide.subtitle && (
                      <p className="text-sm text-white/85 drop-shadow">{slide.subtitle}</p>
                    )}
                  </div>
                </>
              ) : (
                <div className="flex h-full w-full items-center justify-center">
                  <div className="space-y-1 text-center">
                    <h3 className="text-2xl font-bold text-foreground">{slide.title}</h3>
                    {slide.subtitle && (
                      <p className="text-muted-foreground">{slide.subtitle}</p>
                    )}
                  </div>
                </div>
              )}
            </div>
          ))}
        </div>

        {slides.length > 1 && (
          <>
            <button
              onClick={prev}
              aria-label="Previous"
              className="absolute left-3 top-1/2 flex h-9 w-9 -translate-y-1/2 items-center justify-center rounded-full bg-background/85 shadow"
            >
              <ChevronLeft className="h-5 w-5" />
            </button>
            <button
              onClick={next}
              aria-label="Next"
              className="absolute right-3 top-1/2 flex h-9 w-9 -translate-y-1/2 items-center justify-center rounded-full bg-background/85 shadow"
            >
              <ChevronRight className="h-5 w-5" />
            </button>
            <div className="absolute inset-x-0 bottom-2 flex justify-center gap-1.5">
              {slides.map((_, i) => (
                <button
                  key={i}
                  onClick={() => setCurrent(i)}
                  aria-label={'Slide ' + (i + 1)}
                  className={cn(
                    'h-1.5 rounded-full transition-all',
                    i === current ? 'w-6 bg-primary' : 'w-1.5 bg-foreground/25'
                  )}
                />
              ))}
            </div>
          </>
        )}
      </div>
    </section>
  )
}
