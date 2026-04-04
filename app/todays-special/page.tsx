"use client"

import { useState } from 'react'
import Link from 'next/link'
import { ArrowLeft, Sparkles, PartyPopper, Heart, Cake, Users, Calendar, Phone, MessageCircle, Clock, MapPin } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { DishCard } from '@/components/dish-card'
import { BottomNav } from '@/components/bottom-nav'
import menuData from '@/data/menu.json'
import { MenuData } from '@/types/menu'
import { cn } from '@/lib/utils'

const data = menuData as MenuData

const bookingSections = [
  {
    id: 'festivals',
    title: 'Festival Celebrations',
    icon: PartyPopper,
    description: 'Celebrate Diwali, Eid, Holi & more with our special festive menus',
    color: 'bg-amber-500',
    placeholder: 'Coming Soon - Festival menus and special packages',
  },
  {
    id: 'occasions',
    title: 'Special Occasions',
    icon: Sparkles,
    description: 'Birthdays, promotions, achievements - make them memorable',
    color: 'bg-primary',
    placeholder: 'Coming Soon - Special occasion packages',
  },
  {
    id: 'anniversary',
    title: 'Anniversary Specials',
    icon: Heart,
    description: 'Celebrate your love with romantic dinner packages',
    color: 'bg-rose-500',
    placeholder: 'Coming Soon - Anniversary dinner packages',
  },
  {
    id: 'parties',
    title: 'Small Party Bookings',
    icon: Users,
    description: 'Perfect for gatherings of 10-50 people',
    color: 'bg-blue-500',
    placeholder: 'Coming Soon - Party booking details',
  },
]

export default function TodaysSpecialPage() {
  const [activeSection, setActiveSection] = useState<string | null>(null)

  const specialDishes = data.todaysSpecials.map(special => {
    const dish = data.dishes.find(d => d.id === special.id)
    return { ...dish!, discountPercent: special.discountPercent }
  }).filter(d => d)

  const handleBookingInquiry = (sectionTitle: string) => {
    const message = `Hi! I would like to inquire about ${sectionTitle} at Kabab Kitchen.`
    const whatsappUrl = `https://wa.me/${data.restaurantInfo.whatsapp}?text=${encodeURIComponent(message)}`
    window.open(whatsappUrl, '_blank')
  }

  return (
    <div className="min-h-screen bg-background pb-20">
      <header className="sticky top-0 z-50 bg-background border-b border-border">
        <div className="flex items-center gap-4 px-4 py-3">
          <Link href="/">
            <Button variant="ghost" size="icon">
              <ArrowLeft className="w-5 h-5" />
            </Button>
          </Link>
          <h1 className="text-lg font-bold">Today&apos;s Special</h1>
        </div>
      </header>

      {/* Hero Section */}
      <div className="bg-gradient-to-br from-primary to-accent p-6 mx-4 mt-4 rounded-2xl relative overflow-hidden">
        <div className="absolute top-0 right-0 w-40 h-40 bg-white/10 rounded-full -translate-y-1/2 translate-x-1/2" />
        <div className="absolute bottom-0 left-0 w-32 h-32 bg-white/10 rounded-full translate-y-1/2 -translate-x-1/2" />
        <div className="relative">
          <div className="flex items-center gap-2 mb-2">
            <Sparkles className="w-6 h-6 text-primary-foreground" />
            <span className="text-primary-foreground/80 text-sm font-medium">Limited Time Offers</span>
          </div>
          <h2 className="text-2xl font-bold text-primary-foreground mb-1">Today&apos;s Special Dishes</h2>
          <p className="text-primary-foreground/80 text-sm">
            Handpicked by our chef with special discounts
          </p>
        </div>
      </div>

      {/* Special Dishes */}
      <section className="px-4 py-6">
        <div className="flex items-center gap-2 mb-4">
          <div className="w-1 h-5 bg-primary rounded-full" />
          <h2 className="text-lg font-bold text-foreground">Chef&apos;s Picks</h2>
        </div>
        <div className="grid grid-cols-2 gap-3">
          {specialDishes.map(dish => (
            <DishCard 
              key={dish.id} 
              dish={dish} 
              discountPercent={dish.discountPercent} 
            />
          ))}
        </div>
      </section>

      {/* Booking Sections */}
      <section className="px-4 py-4">
        <div className="flex items-center gap-2 mb-4">
          <div className="w-1 h-5 bg-primary rounded-full" />
          <h2 className="text-lg font-bold text-foreground">Book for Events</h2>
        </div>
        <p className="text-sm text-muted-foreground mb-4">
          Plan your special moments with us
        </p>

        <div className="space-y-3">
          {bookingSections.map(section => (
            <div key={section.id} className="bg-card rounded-xl border border-border overflow-hidden">
              <button
                onClick={() => setActiveSection(activeSection === section.id ? null : section.id)}
                className="w-full p-4 flex items-center gap-4 text-left"
              >
                <div className={cn("w-12 h-12 rounded-xl flex items-center justify-center shrink-0", section.color)}>
                  <section.icon className="w-6 h-6 text-white" />
                </div>
                <div className="flex-1 min-w-0">
                  <h3 className="font-semibold text-foreground">{section.title}</h3>
                  <p className="text-sm text-muted-foreground line-clamp-1">{section.description}</p>
                </div>
                <div className={cn(
                  "w-6 h-6 rounded-full border-2 border-muted transition-transform",
                  activeSection === section.id && "rotate-180"
                )}>
                  <svg className="w-full h-full" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <path d="M6 9l6 6 6-6" />
                  </svg>
                </div>
              </button>
              
              {activeSection === section.id && (
                <div className="px-4 pb-4 pt-0">
                  <div className="bg-muted/50 rounded-lg p-4">
                    <p className="text-sm text-muted-foreground mb-4">{section.placeholder}</p>
                    <Button 
                      onClick={() => handleBookingInquiry(section.title)}
                      className="w-full bg-green-600 hover:bg-green-700 text-white"
                    >
                      <MessageCircle className="w-4 h-4 mr-2" />
                      Inquire on WhatsApp
                    </Button>
                  </div>
                </div>
              )}
            </div>
          ))}
        </div>
      </section>

      {/* Day-wise Specials */}
      <section className="px-4 py-4">
        <div className="flex items-center gap-2 mb-4">
          <div className="w-1 h-5 bg-primary rounded-full" />
          <h2 className="text-lg font-bold text-foreground">Weekly Specials</h2>
        </div>
        
        <div className="grid grid-cols-2 gap-3">
          {['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'].map((day, index) => (
            <div 
              key={day}
              className={cn(
                "bg-card rounded-xl border border-border p-4 text-center",
                new Date().getDay() === (index + 1) % 7 && "border-primary bg-primary/5"
              )}
            >
              <Calendar className="w-5 h-5 mx-auto mb-2 text-primary" />
              <h3 className="font-semibold text-sm text-foreground">{day}</h3>
              <p className="text-xs text-muted-foreground mt-1">Special menu coming soon</p>
            </div>
          ))}
        </div>
      </section>

      {/* Contact Section */}
      <section className="px-4 py-6">
        <div className="bg-card rounded-xl border border-border p-4">
          <h3 className="font-semibold text-foreground mb-4">Contact for Bookings</h3>
          <div className="space-y-3">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-green-100 rounded-lg flex items-center justify-center">
                <Phone className="w-5 h-5 text-green-600" />
              </div>
              <div>
                <p className="text-sm font-medium text-foreground">{data.restaurantInfo.phone}</p>
                <p className="text-xs text-muted-foreground">Call us for reservations</p>
              </div>
            </div>
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-primary/10 rounded-lg flex items-center justify-center">
                <Clock className="w-5 h-5 text-primary" />
              </div>
              <div>
                <p className="text-sm font-medium text-foreground">Timings</p>
                <p className="text-xs text-muted-foreground">
                  Lunch: {data.restaurantInfo.timings.lunch} | Dinner: {data.restaurantInfo.timings.dinner}
                </p>
              </div>
            </div>
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-blue-100 rounded-lg flex items-center justify-center">
                <MapPin className="w-5 h-5 text-blue-600" />
              </div>
              <div>
                <p className="text-sm font-medium text-foreground">Location</p>
                <p className="text-xs text-muted-foreground">{data.restaurantInfo.outlet}</p>
              </div>
            </div>
          </div>
          
          <Button 
            onClick={() => {
              const message = `Hi! I would like to make a booking at Kabab Kitchen.`
              const whatsappUrl = `https://wa.me/${data.restaurantInfo.whatsapp}?text=${encodeURIComponent(message)}`
              window.open(whatsappUrl, '_blank')
            }}
            className="w-full mt-4 bg-green-600 hover:bg-green-700 text-white"
          >
            <MessageCircle className="w-4 h-4 mr-2" />
            Book via WhatsApp
          </Button>
        </div>
      </section>

      <BottomNav />
    </div>
  )
}
