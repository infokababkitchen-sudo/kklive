"use client"

import { Gift, Percent } from 'lucide-react'

interface PromoBannerProps {
  code: string
  description: string
  validTill: string
}

export function PromoBanner({ code, description, validTill }: PromoBannerProps) {
  return (
    <div className="mx-4 my-3 rounded-xl bg-gradient-to-r from-primary to-accent p-4 relative overflow-hidden">
      <div className="absolute top-0 right-0 w-32 h-32 bg-white/10 rounded-full -translate-y-1/2 translate-x-1/2" />
      <div className="absolute bottom-0 left-0 w-24 h-24 bg-white/10 rounded-full translate-y-1/2 -translate-x-1/2" />
      
      <div className="relative flex items-start justify-between">
        <div>
          <div className="flex items-center gap-2">
            <Percent className="w-5 h-5 text-primary-foreground" />
            <span className="text-lg font-bold text-primary-foreground">{code}</span>
          </div>
          <p className="text-sm text-primary-foreground/90 mt-1">{description}</p>
          <p className="text-xs text-primary-foreground/70 mt-1">Valid till {validTill}</p>
        </div>
        <div className="bg-white/20 rounded-full p-3">
          <Gift className="w-6 h-6 text-primary-foreground" />
        </div>
      </div>
    </div>
  )
}
