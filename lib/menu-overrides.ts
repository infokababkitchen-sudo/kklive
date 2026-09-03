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
export interface DishOverride {
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

export interface MenuOverrides {
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
        ...(o.variants?.length ? { variants: o.variants } : {}),
        inStock: o.inStock !== false,
        hidden: o.hidden === true,
      }
    })
    .filter(d => !d.hidden)

  return { ...base, dishes: [...existing, ...added] }
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
