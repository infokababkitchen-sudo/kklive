export interface Dish {
  id: number
  name: string
  category: string
  isVeg: boolean
  price?: number
  halfPrice?: number
  fullPrice?: number
  dryPrice?: number
  rollPrice?: number
  pieces?: number
  description: string
  calories: number
  spiceLevel: 'none' | 'mild' | 'medium' | 'hot'
  rating: number
  reviews: number
  isPopular: boolean
  isNew: boolean
  image: string
  variants?: { key: 'half' | 'full' | 'dry' | 'roll'; label: string; price: number; note?: string }[]
  inStock?: boolean
  hidden?: boolean
}

export interface Category {
  id: string
  name: string
  icon: string
  image?: string
}

export interface PromoCode {
  code: string
  description: string
  discountPercent: number
  maxDiscount: number
  minOrder: number
  validTill: string
}

export interface TodaysSpecial {
  id: number
  discountPercent: number
}

export interface RestaurantInfo {
  name: string
  phone: string
  whatsapp: string
  outlet: string
  timings: {
    lunch: string
    dinner: string
  }
  deliveryTime: string
  minOrderForFreeDelivery: number
}

export interface MenuData {
  categories: Category[]
  dishes: Dish[]
  todaysSpecials: TodaysSpecial[]
  promoCodes: PromoCode[]
  restaurantInfo: RestaurantInfo
}
