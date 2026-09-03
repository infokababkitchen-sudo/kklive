import menuData from '@/data/menu.json'
import { MenuData, Dish } from '@/types/menu'

export const baseMenu = menuData as unknown as MenuData

export type VariantKey = 'half' | 'full' | 'dry' | 'roll'

export interface Variant {
  key: VariantKey
  label: string
  price: number
  /** "2 seekh", "1 seekh roll, stuffed onion & masala" */
  note?: string
}

/** Admin panel se ek dish par kya kya badal sakta hai. Sab optional. */
/** Extra fields an admin-created dish can carry. */
export interface DishExtras {
  /** ISO date, e.g. 2026-09-07. After this day the dish disappears. */
  availableUntil?: string
  /** 0=Sun .. 6=Sat. Empty or missing means every day. */
  availableDays?: number[]
}

export interface DishMedia {
  url: string
  /** 'video' covers mp4/webm; gifs are treated as images */
  type: 'image' | 'video'
}

/** Works out the kind from the file extension so the admin need not pick. */
export function mediaTypeOf(url: string): 'image' | 'video' {
  return /\.(mp4|webm|mov|m4v)(\?|$)/i.test(url.trim()) ? 'video' : 'image'
}

export interface DishOverride {
  /** Up to 3 photos, gifs or clips. Falls back to the bundled photo. */
  media?: DishMedia[]
  name?: string
  description?: string
  price?: number
  halfPrice?: number
  fullPrice?: number
  image?: string
  /** false = "Out of stock" dikhega, add nahi kar payenge */
  inStock?: boolean
  /** true = menu se poori tarah gayab */
  hidden?: boolean
  /** Add dabane par jo bottom sheet khulti hai */
  variants?: Variant[]
}

export interface RestaurantInfoOverride {
  phone?: string
  whatsapp?: string
  outlet?: string
  timings?: { lunch?: string; dinner?: string }
}

export interface Banner {
  id: string
  title: string
  subtitle?: string
  /** Blob URL uploaded from the admin dashboard */
  image?: string
  active: boolean
}

export interface DeliveryPromo {
  /** ISO date. Until this day delivery is free on every order, any amount. */
  freeUntil?: string
  /** Outside the promo, free above this subtotal. */
  freeAbove?: number
  /** Charged when neither rule applies. */
  fee?: number
}

export interface MenuOverrides {
  /** true = orders also land in the admin Orders panel, not only WhatsApp */
  panelOrders?: boolean
  delivery?: DeliveryPromo
  banners?: Banner[]
  restaurantInfo?: RestaurantInfoOverride
  updatedAt?: string
  dishes: Record<string, DishOverride>
  /** Admin panel se banayi gayi nayi dishes */
  newDishes?: Dish[]
}

export const EMPTY_OVERRIDES: MenuOverrides = { dishes: {}, newDishes: [] }

/** Admin panel se banayi dish ko 1000+ id milti hai, taaki menu.json se na takraye */
export const NEW_DISH_ID_START = 1000

export function nextNewDishId(overrides: MenuOverrides): number {
  const ids = (overrides.newDishes || []).map(d => d.id)
  return Math.max(NEW_DISH_ID_START - 1, ...ids) + 1
}

/**
 * menu.json ke upar admin ke changes lagata hai.
 * Jo cheez admin ne chhui nahi, wo menu.json se hi aati hai - isliye blob
 * khaali ho ya down ho, site purane prices ke saath chalti rahegi.
 */
export function applyOverrides(base: MenuData, overrides: MenuOverrides | null): MenuData {
  if (!overrides?.dishes) return base

  const existing = base.dishes
    .map((dish): Dish => {
      const o = overrides.dishes[String(dish.id)]
      if (!o) return dish
      const merged: Dish = { ...dish }
      if (o.name) merged.name = o.name
      if (o.description) merged.description = o.description
      if (typeof o.price === 'number') merged.price = o.price
      if (typeof o.halfPrice === 'number') merged.halfPrice = o.halfPrice
      if (typeof o.fullPrice === 'number') merged.fullPrice = o.fullPrice
      if (o.image) merged.image = o.image
      if (o.media?.length) merged.media = o.media.slice(0, 3)
      if (o.variants?.length) merged.variants = o.variants
      merged.inStock = o.inStock !== false
      merged.hidden = o.hidden === true
      return merged
    })
    .filter(dish => !dish.hidden)

  const added = (overrides.newDishes || [])
    .map((d): Dish => {
      const o = overrides.dishes[String(d.id)]
      if (!o) return { ...d, inStock: d.inStock !== false }
      return {
        ...d,
        ...(o.name ? { name: o.name } : {}),
        ...(typeof o.price === 'number' ? { price: o.price } : {}),
        ...(o.image ? { image: o.image } : {}),
        ...(o.media?.length ? { media: o.media.slice(0, 3) } : {}),
        ...(o.variants?.length ? { variants: o.variants } : {}),
        inStock: o.inStock !== false,
        hidden: o.hidden === true,
      }
    })
    .filter(d => !d.hidden)

  const banners = overrides.banners?.filter(b => b.active) ?? []
  const delivery = overrides.delivery
  const panelOrders = overrides.panelOrders === true

  const restaurantInfo = overrides.restaurantInfo
    ? {
        ...base.restaurantInfo,
        ...Object.fromEntries(
          Object.entries(overrides.restaurantInfo).filter(([, v]) => v !== undefined && v !== '')
        ),
      }
    : base.restaurantInfo

  return {
    ...base,
    dishes: [...existing, ...added].filter(isAvailableToday),
    banners,
    delivery,
    panelOrders,
    restaurantInfo,
  }
}

/**
 * Wo dishes dhoondta hai jinka naam ek hi hai (jaise Veg Kabab do baar).
 * Ye asal mein variants hain jo alag-alag rows mein pade hain.
 */
export function findDuplicatePairs(dishes: Dish[]): Dish[][] {
  const groups: Record<string, Dish[]> = {}
  dishes.forEach(d => {
    const k = `${d.name}|${d.category}`
    ;(groups[k] ||= []).push(d)
  })
  return Object.values(groups).filter(g => g.length > 1)
}


/**
 * A daily special only shows on its allowed weekdays and up to its last date.
 * Dishes without these fields are always available.
 */
export function isAvailableToday(dish: Dish & DishExtras): boolean {
  const now = new Date()

  if (dish.availableUntil) {
    // compare date-only so the dish stays up for the whole last day
    const end = new Date(dish.availableUntil + 'T23:59:59')
    if (Number.isFinite(end.getTime()) && now > end) return false
  }

  if (dish.availableDays?.length) {
    if (!dish.availableDays.includes(now.getDay())) return false
  }

  return true
}


/** Works out the delivery fee for a subtotal, honouring any running promo. */
export function deliveryFeeFor(
  subtotal: number,
  delivery: DeliveryPromo | undefined,
  fallbackFreeAbove: number
): { fee: number; promoRunning: boolean } {
  const baseFee = delivery?.fee ?? 40
  const freeAbove = delivery?.freeAbove ?? fallbackFreeAbove

  if (delivery?.freeUntil) {
    const end = new Date(delivery.freeUntil + 'T23:59:59')
    if (Number.isFinite(end.getTime()) && new Date() <= end) {
      return { fee: 0, promoRunning: true }
    }
  }
  return { fee: subtotal >= freeAbove ? 0 : baseFee, promoRunning: false }
}


/**
 * What the dish card should show. Admin media wins; otherwise the single
 * bundled photo, so nothing changes until links are added.
 */
export function mediaFor(dish: { image: string; media?: DishMedia[] }): DishMedia[] {
  const m = (dish.media || []).filter(x => x && x.url && x.url.trim())
  if (m.length) return m.slice(0, 3)
  return dish.image ? [{ url: dish.image, type: 'image' }] : []
}
