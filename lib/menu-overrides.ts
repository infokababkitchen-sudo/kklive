import menuData from '@/data/menu.json'
import { MenuData, Dish } from '@/types/menu'

export const baseMenu = menuData as MenuData

/** What the admin panel can change per dish. Everything is optional. */
export interface DishOverride {
  price?: number
  halfPrice?: number
  fullPrice?: number
  image?: string
  available?: boolean
}

export interface MenuOverrides {
  updatedAt?: string
  dishes: Record<string, DishOverride>
}

export const EMPTY_OVERRIDES: MenuOverrides = { dishes: {} }

/**
 * Lays the admin's saved changes on top of data/menu.json.
 * menu.json stays the source of truth for anything the admin hasn't touched,
 * so the site still works if the blob is empty or unreachable.
 */
export function applyOverrides(base: MenuData, overrides: MenuOverrides | null): MenuData {
  if (!overrides?.dishes) return base

  const dishes = base.dishes
    .map((dish): Dish & { available?: boolean } => {
      const o = overrides.dishes[String(dish.id)]
      if (!o) return dish
      const merged = { ...dish }
      if (typeof o.price === 'number') merged.price = o.price
      if (typeof o.halfPrice === 'number') merged.halfPrice = o.halfPrice
      if (typeof o.fullPrice === 'number') merged.fullPrice = o.fullPrice
      if (o.image) merged.image = o.image
      return { ...merged, available: o.available }
    })
    // a dish marked unavailable disappears from the storefront
    .filter(dish => dish.available !== false)

  return { ...base, dishes }
}
