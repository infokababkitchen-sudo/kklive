"use client"

import { UtensilsCrossed, ShoppingCart, Sparkles, CalendarDays, MessageCircle } from 'lucide-react'
import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { useCart } from '@/context/cart-context'
import { cn } from '@/lib/utils'

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

  return (
    <nav className="fixed bottom-0 left-0 right-0 z-50 bg-background border-t border-border safe-area-pb">
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
      </div>
    </nav>
  )
}
