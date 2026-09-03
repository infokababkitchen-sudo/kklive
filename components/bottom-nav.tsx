"use client"

import { UtensilsCrossed, ShoppingCart, Sparkles, CalendarDays, MessageCircle, Wand2 } from 'lucide-react'
import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { useCart } from '@/context/cart-context'
import { cn } from '@/lib/utils'
import { useState } from 'react'
import { SurpriseMePopup } from '@/components/surprise-me-popup'

const navItems = [
  { href: '/', icon: UtensilsCrossed, label: 'Menu' },
  { href: '/todays-special', icon: Sparkles, label: 'Specials' },
  { href: '/assistant', icon: MessageCircle, label: 'Assistant' },
  { href: '/cart', icon: ShoppingCart, label: 'Cart', showBadge: true },
]

export function BottomNav() {
  const pathname = usePathname()
  const { getItemCount } = useCart()
  const itemCount = getItemCount()
  const [showSurpriseMe, setShowSurpriseMe] = useState(false)

  return (
    <>
      <nav className="fixed bottom-0 left-0 right-0 z-50 bg-background border-t border-border safe-area-pb rounded-t-3xl">
        <div className="flex items-center justify-around py-2">
          {navItems.map(item => {
            const isActive = pathname === item.href
            return (
              <Link
                key={item.href}
                href={item.href}
                className={cn(
                  "flex flex-col items-center gap-1 px-4 py-2 rounded-lg transition-colors relative",
                  isActive ? "text-primary" : "text-muted-foreground"
                )}
              >
                <div className="relative">
                  <item.icon className="w-5 h-5" />
                  {item.showBadge && itemCount > 0 && (
                    <span className="absolute -top-2 -right-2 w-4 h-4 bg-primary text-primary-foreground text-[10px] font-bold rounded-full flex items-center justify-center">
                      {itemCount}
                    </span>
                  )}
                </div>
                <span className="text-xs font-medium">{item.label}</span>
              </Link>
            )
          })}
          <button
            onClick={() => setShowSurpriseMe(true)}
            className="group flex flex-col items-center gap-1 rounded-lg px-4 py-2 text-muted-foreground transition-colors hover:text-primary"
          >
            <span className="relative flex h-5 w-5 items-center justify-center">
              <span className="kk-halo absolute inset-0 rounded-full bg-primary/25" />
              <Wand2 className="kk-wand relative h-5 w-5 text-primary" />
              <span className="kk-spark absolute -right-1 -top-1 h-1.5 w-1.5 rounded-full bg-primary" />
            </span>
            <span className="text-xs font-medium">Surprise</span>
          </button>
        </div>
      </nav>
      {showSurpriseMe && <SurpriseMePopup onClose={() => setShowSurpriseMe(false)} />}
    </>
  )
}
