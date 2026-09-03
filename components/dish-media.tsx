"use client"

import { useEffect, useRef, useState } from 'react'
import Image from 'next/image'
import { cn } from '@/lib/utils'
import type { DishMedia } from '@/lib/menu-overrides'

/**
 * Shows a dish's photos, gifs and clips. One item renders plain; several
 * become a slider that advances on its own and can be swiped.
 *
 * Video autoplays muted and inline, which is the only form mobile browsers
 * permit without a tap.
 */
export function DishMediaView({
  media,
  alt,
  className,
  sizes = '(max-width: 768px) 50vw, 25vw',
  priority = false,
  interval = 3200,
}: {
  media: DishMedia[]
  alt: string
  className?: string
  sizes?: string
  priority?: boolean
  interval?: number
}) {
  const [i, setI] = useState(0)
  const [paused, setPaused] = useState(false)
  const touchX = useRef<number | null>(null)

  const items = media.length ? media : [{ url: '/images/placeholder-dish.jpg', type: 'image' as const }]
  const many = items.length > 1

  useEffect(() => {
    if (!many || paused) return
    const t = setInterval(() => setI(p => (p + 1) % items.length), interval)
    return () => clearInterval(t)
  }, [many, paused, items.length, interval])

  useEffect(() => {
    if (i >= items.length) setI(0)
  }, [items.length, i])

  const onStart = (e: React.TouchEvent) => {
    touchX.current = e.touches[0].clientX
  }
  const onEnd = (e: React.TouchEvent) => {
    if (touchX.current === null) return
    const dx = e.changedTouches[0].clientX - touchX.current
    if (Math.abs(dx) > 40) {
      setI(p => (dx < 0 ? (p + 1) % items.length : (p - 1 + items.length) % items.length))
    }
    touchX.current = null
  }

  return (
    <div
      className={cn('relative h-full w-full overflow-hidden', className)}
      onTouchStart={many ? onStart : undefined}
      onTouchEnd={many ? onEnd : undefined}
      onMouseEnter={() => setPaused(true)}
      onMouseLeave={() => setPaused(false)}
    >
      {items.map((m, idx) => (
        <div
          key={m.url + idx}
          className={cn(
            'absolute inset-0 transition-opacity duration-500',
            idx === i ? 'opacity-100' : 'opacity-0'
          )}
        >
          {m.type === 'video' ? (
            <video
              src={m.url}
              muted
              loop
              playsInline
              autoPlay
              preload="metadata"
              className="h-full w-full object-cover"
              aria-label={alt}
            />
          ) : (
            <Image
              src={m.url}
              alt={alt}
              fill
              sizes={sizes}
              priority={priority && idx === 0}
              className="object-cover"
              onError={e => {
                ;(e.target as HTMLImageElement).src = '/images/placeholder-dish.jpg'
              }}
            />
          )}
        </div>
      ))}

      {many && (
        <div className="absolute bottom-1.5 left-0 right-0 flex justify-center gap-1">
          {items.map((_, idx) => (
            <span
              key={idx}
              className={cn(
                'h-1 rounded-full bg-white transition-all',
                idx === i ? 'w-3 opacity-95' : 'w-1 opacity-55'
              )}
            />
          ))}
        </div>
      )}
    </div>
  )
}
