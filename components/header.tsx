"use client"

import { ShoppingCart, Search, ChefHat } from 'lucide-react'
import Link from 'next/link'
import Image from 'next/image'
import { useCart } from '@/context/cart-context'
import { Button } from '@/components/ui/button'

// Set to true when you add your logo.png to /public/images/
const HAS_CUSTOM_LOGO = true

export function Header() {
  const { getItemCount } = useCart()
  const itemCount = getItemCount()

  return (
    <header className="sticky top-0 z-50 bg-background border-b border-border">
      <div className="flex items-center justify-between px-4 py-2">
        <Link href="/" className="flex items-center gap-2">
          {HAS_CUSTOM_LOGO ? (
            <Image
              src="/images/logo.png"
              alt="Kabab Kitchen"
              width={44}
              height={44}
              className="rounded-lg object-contain"
            />
          ) : (
            <div className="w-10 h-10 bg-primary rounded-lg flex items-center justify-center">
              <ChefHat className="w-6 h-6 text-primary-foreground" />
            </div>
          )}
          <span className="text-lg font-bold text-foreground">Kabab Kitchen</span>
        </Link>
        
        <div className="flex items-center gap-2">
          <Button variant="ghost" size="icon" className="relative">
            <Search className="w-5 h-5" />
          </Button>
          <Link href="/cart">
            <Button variant="ghost" size="icon" className="relative">
              <ShoppingCart className="w-5 h-5" />
              {itemCount > 0 && (
                <span className="absolute -top-1 -right-1 w-5 h-5 bg-primary text-primary-foreground text-xs font-bold rounded-full flex items-center justify-center">
                  {itemCount}
                </span>
              )}
            </Button>
          </Link>
        </div>
      </div>
    </header>
  )
}
