"use client"
import { useRouter } from 'next/navigation'
import { useCart } from '@/context/cart-context'
export function CartOverlay() { const { lastAddedItem } = useCart(); const router = useRouter(); if (!lastAddedItem) return null; return <div className="fixed bottom-16 left-3 right-3 z-[70] flex items-center justify-between gap-3 rounded-2xl border border-border bg-card p-3 shadow-xl"><span className="truncate text-sm font-medium">{lastAddedItem.name} added to cart</span><button onClick={() => router.push('/cart')} className="shrink-0 rounded-xl bg-primary px-4 py-2 text-sm font-semibold text-primary-foreground">Checkout</button></div> }
