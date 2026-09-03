// Kabab Kitchen v5 - self-contained patch. Run: node patch-v5.js
const DISH_CARD = `
"use client"

import { useEffect, useMemo, useState } from 'react'
import Image from 'next/image'
import { Plus, Minus, Star, Flame, Leaf, X } from 'lucide-react'
import { Badge } from '@/components/ui/badge'
import { useCart, makeLineId, CartAddOn } from '@/context/cart-context'
import { useMenu } from '@/hooks/use-menu'
import { Dish } from '@/types/menu'
import { cn } from '@/lib/utils'

interface DishCardProps {
  dish: Dish
  discountPercent?: number
}

type VariantKey = 'half' | 'full' | 'dry' | 'roll'
interface Choice {
  key: VariantKey
  label: string
  price: number
  note?: string
}

interface AddOnOption {
  id: string
  name: string
  price: number
  isVeg?: boolean
}
interface AddOnGroup {
  id: string
  name: string
  maxSelect: number
  appliesTo: string[]
  options: AddOnOption[]
}

function getChoices(dish: Dish): Choice[] {
  if (dish.variants?.length) return dish.variants as Choice[]
  const out: Choice[] = []
  if (dish.halfPrice) out.push({ key: 'half', label: 'Half', price: dish.halfPrice })
  if (dish.fullPrice) out.push({ key: 'full', label: 'Full', price: dish.fullPrice })
  return out
}

export function DishCard({ dish, discountPercent }: DishCardProps) {
  const [open, setOpen] = useState(false)
  const { addItem, countForDish } = useCart()
  const menu = useMenu()

  const choices = getChoices(dish)
  const groups = useMemo(() => {
    const all = ((menu as unknown as { addOnGroups?: AddOnGroup[] }).addOnGroups || [])
    return all.filter(g => g.appliesTo.includes('all') || g.appliesTo.includes(dish.category))
  }, [menu, dish.category])

  const outOfStock = dish.inStock === false
  const inCart = countForDish(dish.id)

  const basePrice = dish.price ?? choices[0]?.price ?? 0
  const discounted = (p: number) =>
    discountPercent ? Math.round(p * (1 - discountPercent / 100)) : p

  const needsSheet = choices.length > 0 || groups.length > 0

  const handleAdd = () => {
    if (outOfStock) return
    if (needsSheet) return setOpen(true)
    addItem({
      id: dish.id,
      name: dish.name,
      price: discounted(basePrice),
      quantity: 1,
      image: dish.image,
      isVeg: dish.isVeg,
      lineId: makeLineId(dish.id),
    })
  }

  const spice =
    dish.spiceLevel === 'hot' ? (
      <Flame className="w-3 h-3 text-red-500" />
    ) : dish.spiceLevel === 'medium' ? (
      <Flame className="w-3 h-3 text-amber-500" />
    ) : null

  return (
    <>
      <div
        className={cn(
          'bg-card rounded-xl border border-border overflow-hidden',
          outOfStock && 'opacity-60'
        )}
      >
        <div className="relative aspect-square">
          <Image
            src={dish.image}
            alt={dish.name}
            fill
            className={cn('object-cover', outOfStock && 'grayscale')}
            sizes="(max-width: 768px) 50vw, 25vw"
            onError={e => {
              ;(e.target as HTMLImageElement).src = '/images/placeholder-dish.jpg'
            }}
          />
          <div className="absolute top-2 left-2 flex gap-1">
            {dish.isVeg && (
              <div className="w-5 h-5 bg-white rounded flex items-center justify-center">
                <Leaf className="w-3 h-3 text-green-600" />
              </div>
            )}
            {dish.isNew && !outOfStock && (
              <Badge className="bg-accent text-accent-foreground text-[10px] px-1.5 py-0.5">
                New
              </Badge>
            )}
          </div>

          {discountPercent && !outOfStock && (
            <Badge className="absolute top-2 right-2 bg-green-600 text-white text-[10px]">
              {discountPercent}% OFF
            </Badge>
          )}

          {outOfStock ? (
            <div className="absolute inset-0 flex items-center justify-center bg-black/40">
              <span className="rounded-full bg-background px-3 py-1 text-xs font-semibold">
                Out of stock
              </span>
            </div>
          ) : (
            <button
              onClick={handleAdd}
              className={cn(
                'absolute bottom-2 right-2 flex h-8 items-center gap-1 rounded-md px-3 text-xs font-semibold shadow',
                inCart > 0
                  ? 'bg-background text-primary border border-primary'
                  : 'bg-primary text-primary-foreground'
              )}
            >
              {inCart > 0 ? (
                <>
                  <span className="text-sm font-bold">{inCart}</span>
                  <span className="opacity-70">in cart</span>
                  <Plus className="w-3 h-3" />
                </>
              ) : (
                <>
                  <Plus className="w-3 h-3" />
                  Add
                </>
              )}
            </button>
          )}
        </div>

        <div className="p-3">
          <h3 className="font-semibold text-sm line-clamp-1">{dish.name}</h3>
          <div className="flex items-center gap-1 mt-1">
            <Star className="w-3 h-3 fill-amber-400 text-amber-400" />
            <span className="text-xs text-muted-foreground">
              {dish.rating} ({dish.reviews})
            </span>
            {spice}
          </div>
          <p className="text-xs text-muted-foreground mt-1 line-clamp-2">{dish.description}</p>
          <div className="flex items-center gap-2 mt-2">
            {discountPercent ? (
              <>
                <span className="text-sm font-bold text-primary">
                  Rs.{discounted(basePrice)}
                </span>
                <span className="text-xs text-muted-foreground line-through">Rs.{basePrice}</span>
              </>
            ) : (
              <span className="text-sm font-bold text-primary">
                {choices.length > 1 && (
                  <span className="text-[10px] font-normal text-muted-foreground">from </span>
                )}
                Rs.{basePrice}
              </span>
            )}
          </div>
        </div>
      </div>

      {open && (
        <DishSheet
          dish={dish}
          choices={choices}
          groups={groups}
          discountPercent={discountPercent}
          onClose={() => setOpen(false)}
        />
      )}
    </>
  )
}

// ---------------------------------------------------------------- the sheet
function DishSheet({
  dish,
  choices,
  groups,
  discountPercent,
  onClose,
}: {
  dish: Dish
  choices: Choice[]
  groups: AddOnGroup[]
  discountPercent?: number
  onClose: () => void
}) {
  const { addItem } = useCart()
  const [variant, setVariant] = useState<Choice | undefined>(choices[0])
  const [picked, setPicked] = useState<Record<string, AddOnOption[]>>({})
  const [request, setRequest] = useState('')
  const [qty, setQty] = useState(1)

  useEffect(() => {
    const prev = document.body.style.overflow
    document.body.style.overflow = 'hidden'
    return () => {
      document.body.style.overflow = prev
    }
  }, [])

  const toggle = (group: AddOnGroup, option: AddOnOption) => {
    setPicked(prev => {
      const cur = prev[group.id] || []
      const has = cur.some(o => o.id === option.id)
      if (has) return { ...prev, [group.id]: cur.filter(o => o.id !== option.id) }
      if (cur.length >= group.maxSelect) return prev
      return { ...prev, [group.id]: [...cur, option] }
    })
  }

  const addOns: CartAddOn[] = Object.values(picked)
    .flat()
    .map(o => ({ id: o.id, name: o.name, price: o.price }))

  const base = variant?.price ?? dish.price ?? 0
  const unit = base + addOns.reduce((s, a) => s + a.price, 0)
  const unitAfter = discountPercent ? Math.round(unit * (1 - discountPercent / 100)) : unit
  const total = unitAfter * qty

  const confirm = () => {
    addItem({
      id: dish.id,
      name: dish.name,
      price: unitAfter,
      quantity: qty,
      size: variant?.key,
      image: dish.image,
      isVeg: dish.isVeg,
      addOns: addOns.length ? addOns : undefined,
      cookingRequest: request.trim() || undefined,
      lineId: makeLineId(dish.id, variant?.key, addOns, request),
    })
    onClose()
  }

  return (
    <div className="fixed inset-0 z-[80]">
      <div className="absolute inset-0 bg-black/60" onClick={onClose} />
      <div className="absolute bottom-0 left-0 right-0 mx-auto flex max-h-[92dvh] max-w-lg flex-col rounded-t-2xl bg-background">
        <div className="flex shrink-0 items-center justify-between border-b px-4 py-3">
          <div className="flex min-w-0 items-center gap-2">
            <div className="relative h-9 w-9 shrink-0 overflow-hidden rounded-lg">
              <Image src={dish.image} alt="" fill className="object-cover" sizes="36px" />
            </div>
            <h2 className="truncate text-base font-bold">{dish.name}</h2>
          </div>
          <button
            onClick={onClose}
            className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-muted"
          >
            <X className="h-5 w-5 text-muted-foreground" />
          </button>
        </div>

        <div className="flex-1 space-y-3 overflow-y-auto overscroll-contain p-4">
          <p className="text-sm text-muted-foreground">{dish.description}</p>

          {choices.length > 0 && (
            <section className="rounded-xl border">
              <div className="border-b px-3 py-2">
                <p className="text-sm font-semibold">Choose portion</p>
                <p className="text-xs text-muted-foreground">Required &middot; select 1 option</p>
              </div>
              {choices.map(c => (
                <button
                  key={c.key}
                  onClick={() => setVariant(c)}
                  className="flex w-full items-center justify-between gap-3 border-b px-3 py-2.5 text-left last:border-b-0"
                >
                  <span className="min-w-0">
                    <span className="block text-sm">{c.label}</span>
                    {c.note && (
                      <span className="block text-xs text-muted-foreground">{c.note}</span>
                    )}
                  </span>
                  <span className="flex shrink-0 items-center gap-2">
                    <span className="text-sm font-semibold">Rs.{c.price}</span>
                    <span
                      className={cn(
                        'flex h-4 w-4 items-center justify-center rounded-full border-2',
                        variant?.key === c.key ? 'border-primary' : 'border-muted-foreground/40'
                      )}
                    >
                      {variant?.key === c.key && (
                        <span className="h-2 w-2 rounded-full bg-primary" />
                      )}
                    </span>
                  </span>
                </button>
              ))}
            </section>
          )}

          {groups.map(g => {
            const cur = picked[g.id] || []
            return (
              <section key={g.id} className="rounded-xl border">
                <div className="border-b px-3 py-2">
                  <p className="text-sm font-semibold">{g.name}</p>
                  <p className="text-xs text-muted-foreground">
                    Optional &middot; up to {g.maxSelect}
                  </p>
                </div>
                {g.options.map(o => {
                  const on = cur.some(x => x.id === o.id)
                  const full = !on && cur.length >= g.maxSelect
                  return (
                    <button
                      key={o.id}
                      onClick={() => toggle(g, o)}
                      disabled={full}
                      className={cn(
                        'flex w-full items-center justify-between gap-3 border-b px-3 py-2.5 text-left last:border-b-0',
                        full && 'opacity-40'
                      )}
                    >
                      <span className="flex min-w-0 items-center gap-2">
                        {o.isVeg && <Leaf className="h-3 w-3 shrink-0 text-green-600" />}
                        <span className="truncate text-sm">{o.name}</span>
                      </span>
                      <span className="flex shrink-0 items-center gap-2">
                        <span className="text-sm font-semibold">+Rs.{o.price}</span>
                        <span
                          className={cn(
                            'flex h-4 w-4 items-center justify-center rounded border-2',
                            on ? 'border-primary bg-primary' : 'border-muted-foreground/40'
                          )}
                        >
                          {on && <span className="text-[10px] font-bold text-white">&#10003;</span>}
                        </span>
                      </span>
                    </button>
                  )
                })}
              </section>
            )
          })}

          <section className="rounded-xl border p-3">
            <p className="text-sm font-semibold">Add a cooking request</p>
            <p className="text-xs text-muted-foreground">
              The kitchen will try its best. Refunds are not possible for these requests.
            </p>
            <textarea
              value={request}
              maxLength={120}
              onChange={e => setRequest(e.target.value)}
              placeholder="e.g. Don't make it too spicy"
              className="mt-2 w-full resize-none rounded-lg border bg-background p-2 text-sm"
              rows={2}
            />
            <div className="mt-1 flex flex-wrap gap-1.5">
              {['Less spicy', 'Extra spicy', 'No onion', 'Well done'].map(t => (
                <button
                  key={t}
                  onClick={() => setRequest(t)}
                  className="rounded-full border px-2.5 py-1 text-xs"
                >
                  {t}
                </button>
              ))}
            </div>
          </section>
        </div>

        <div className="flex shrink-0 items-center gap-3 border-t p-3 pb-[calc(0.75rem+env(safe-area-inset-bottom))]">
          <div className="flex items-center gap-3 rounded-xl border px-3 py-2">
            <button onClick={() => setQty(q => Math.max(1, q - 1))} aria-label="Decrease">
              <Minus className="h-4 w-4 text-primary" />
            </button>
            <span className="w-4 text-center text-sm font-bold">{qty}</span>
            <button onClick={() => setQty(q => q + 1)} aria-label="Increase">
              <Plus className="h-4 w-4 text-primary" />
            </button>
          </div>
          <button
            onClick={confirm}
            className="flex-1 rounded-xl bg-primary px-4 py-3 text-sm font-bold text-primary-foreground"
          >
            Add item &middot; Rs.{total}
          </button>
        </div>
      </div>
    </div>
  )
}
`

const CART_CONTEXT = `
"use client"

import { createContext, useContext, useState, useEffect, ReactNode } from 'react'

export interface CartAddOn {
  id: string
  name: string
  price: number
}

export interface CartItem {
  id: number
  name: string
  /** Base price plus every selected add-on, for one unit */
  price: number
  quantity: number
  size?: 'half' | 'full' | 'dry' | 'roll'
  image: string
  isVeg: boolean
  addOns?: CartAddOn[]
  cookingRequest?: string
  /**
   * Identifies one cart line. The same dish can sit in the cart twice with
   * different add-ons or a different cooking request, so id alone is not enough.
   */
  lineId: string
}

/** Builds the lineId from everything that makes a line distinct. */
export function makeLineId(
  id: number,
  size?: string,
  addOns?: { id: string }[],
  cookingRequest?: string
) {
  const a = (addOns || []).map(x => x.id).sort().join('+')
  return [id, size || '', a, (cookingRequest || '').trim()].join('|')
}

interface CartContextType {
  items: CartItem[]
  lastAddedItem?: CartItem
  /** false jab tak localStorage se cart load nahi hua - flicker rokne ke liye */
  hydrated: boolean
  addItem: (item: CartItem) => void
  removeItem: (lineId: string) => void
  updateQuantity: (lineId: string, quantity: number) => void
  /** Total units of a dish across every line, for the card badge */
  countForDish: (id: number) => number
  clearCart: () => void
  clearLastAdded: () => void
  getTotal: () => number
  getItemCount: () => number
}

const CartContext = createContext<CartContextType | undefined>(undefined)
const STORAGE_KEY = 'kk-cart-v2'

export function CartProvider({ children }: { children: ReactNode }) {
  const [items, setItems] = useState<CartItem[]>([])
  const [lastAddedItem, setLastAddedItem] = useState<CartItem>()
  const [hydrated, setHydrated] = useState(false)

  // Refresh ke baad cart wapis load karo.
  // Server par localStorage nahi hota, isliye pehla render hamesha khaali -
  // warna hydration mismatch aata hai.
  useEffect(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEY)
      if (saved) {
        const parsed = JSON.parse(saved)
        if (Array.isArray(parsed)) {
          setItems(
            parsed.map((i: CartItem) => ({
              ...i,
              lineId: i.lineId || makeLineId(i.id, i.size, i.addOns, i.cookingRequest),
            }))
          )
        }
      }
    } catch {
      // kharab data - ignore karo, khaali cart se shuru
    }
    setHydrated(true)
  }, [])

  // Har change par save
  useEffect(() => {
    if (!hydrated) return
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(items))
    } catch {
      // storage full ya blocked - cart phir bhi is session mein chalega
    }
  }, [items, hydrated])

  const addItem = (item: CartItem) => {
    setLastAddedItem(item)
    setItems(prev => {
      const i = prev.findIndex(x => x.lineId === item.lineId)
      if (i >= 0) {
        const updated = [...prev]
        updated[i] = { ...updated[i], quantity: updated[i].quantity + item.quantity }
        return updated
      }
      return [...prev, item]
    })
  }

  const removeItem = (lineId: string) => {
    setItems(prev => prev.filter(i => i.lineId !== lineId))
  }

  const updateQuantity = (lineId: string, quantity: number) => {
    if (quantity <= 0) return removeItem(lineId)
    setItems(prev => prev.map(i => (i.lineId === lineId ? { ...i, quantity } : i)))
  }

  const countForDish = (id: number) =>
    items.filter(i => i.id === id).reduce((s, i) => s + i.quantity, 0)

  const clearCart = () => setItems([])
  const clearLastAdded = () => setLastAddedItem(undefined)
  const getTotal = () => items.reduce((s, i) => s + i.price * i.quantity, 0)
  const getItemCount = () => items.reduce((s, i) => s + i.quantity, 0)

  return (
    <CartContext.Provider
      value={{
        items,
        lastAddedItem,
        hydrated,
        addItem,
        removeItem,
        updateQuantity,
        countForDish,
        clearCart,
        clearLastAdded,
        getTotal,
        getItemCount,
      }}
    >
      {children}
    </CartContext.Provider>
  )
}

export function useCart() {
  const context = useContext(CartContext)
  if (!context) throw new Error('useCart must be used within a CartProvider')
  return context
}
`

/**
 * Kabab Kitchen - v5. Self-contained: this script writes every file itself.
 * Nothing to download, nothing to place by hand.
 *
 * Run from the repo root:   node patch-v5.js
 * Safe to run twice.
 */
const fs = require('fs')

if (!fs.existsSync('package.json') || !fs.existsSync('data')) {
  console.error('\nStop: not the repo root. Run "cd kklive" first.\n')
  process.exit(1)
}

const T = String.fromCharCode(96) // backtick, kept out of literals below
const done = []
const warn = []

// ------------------------------------- 0. clear stray copies at the repo root
;['dish-card.tsx', 'cart-context.tsx', 'menu.json', 'menu.ts', 'page.tsx', 'route.ts',
  'menu-overrides.ts', 'category-tabs.tsx', 'cart-overlay.tsx', 'use-menu.ts',
  'patch-v3.js', 'patch-v4.js', 'files.zip', 'tsconfig.tsbuildinfo',
].forEach(f => {
  if (fs.existsSync(f) && fs.statSync(f).isFile()) {
    fs.unlinkSync(f)
    done.push('removed stray ' + f + ' from the repo root')
  }
})
;['files', 'mnt', 'app/menu'].forEach(d => {
  if (fs.existsSync(d)) {
    fs.rmSync(d, { recursive: true, force: true })
    done.push('removed stray ' + d + '/')
  }
})

// ---------------------------------------------- 1. files written in full
fs.mkdirSync('components', { recursive: true })
fs.mkdirSync('context', { recursive: true })
fs.writeFileSync('components/dish-card.tsx', DISH_CARD.replace(/^\n/, ''))
done.push('components/dish-card.tsx written (Zomato-style sheet)')
fs.writeFileSync('context/cart-context.tsx', CART_CONTEXT.replace(/^\n/, ''))
done.push('context/cart-context.tsx written (remove fix + add-ons)')

// ------------------------------------------------------------- 2. types
let t = fs.readFileSync('types/menu.ts', 'utf8')
if (!t.includes('AddOnGroup')) {
  t = t.replace(
    '  restaurantInfo: RestaurantInfo',
    '  addOnGroups?: AddOnGroup[]\n  restaurantInfo: RestaurantInfo'
  )
  t +=
    '\nexport interface AddOnOption {\n' +
    '  id: string\n  name: string\n  price: number\n  isVeg?: boolean\n}\n\n' +
    'export interface AddOnGroup {\n' +
    '  id: string\n  name: string\n  maxSelect: number\n' +
    '  appliesTo: string[]\n  options: AddOnOption[]\n}\n'
  fs.writeFileSync('types/menu.ts', t)
  done.push('types/menu.ts: AddOnGroup added')
}
t = fs.readFileSync('types/menu.ts', 'utf8')
if (!t.includes('variants?:')) {
  t = t.replace(
    '  image: string',
    '  image: string\n' +
      "  variants?: { key: 'half' | 'full' | 'dry' | 'roll'; label: string; price: number; note?: string }[]\n" +
      '  inStock?: boolean\n  hidden?: boolean'
  )
  fs.writeFileSync('types/menu.ts', t)
  done.push('types/menu.ts: variants added')
}

// --------------------------------------------------------- 3. data/menu.json
const menu = JSON.parse(fs.readFileSync('data/menu.json', 'utf8'))

// Dry = 2 seekh, so the dearer row of each duplicate pair is Dry, the cheaper is Roll.
if (!menu.dishes.some(d => d.variants && d.variants.some(v => v.key === 'dry'))) {
  const groups = {}
  menu.dishes.forEach(x => {
    const k = x.name + '|' + x.category
    ;(groups[k] = groups[k] || []).push(x)
  })
  const drop = new Set()
  let merged = 0
  Object.values(groups)
    .filter(g => g.length === 2)
    .forEach(g => {
      const pair = g.sort((p, q) => (q.price || 0) - (p.price || 0))
      const hi = pair[0]
      const lo = pair[1]
      hi.variants = [
        { key: 'dry', label: 'Dry', price: hi.price, note: '2 seekh, 1 portion' },
        {
          key: 'roll',
          label: 'Roll',
          price: lo.price,
          note: '1 seekh roll, stuffed onion & masala',
        },
      ]
      delete hi.price
      drop.add(lo.id)
      merged++
    })
  menu.dishes = menu.dishes.filter(x => !drop.has(x.id))
  done.push('Merged ' + merged + ' duplicate pairs into Dry/Roll variants')
}

if (!menu.addOnGroups) {
  menu.addOnGroups = [
    {
      id: 'accompaniments',
      name: 'Add Accompaniments',
      maxSelect: 3,
      appliesTo: ['all'],
      options: [
        { id: 'mint-chutney', name: 'Extra Mint Chutney', price: 15, isVeg: true },
        { id: 'onion-salad', name: 'Onion Salad', price: 20, isVeg: true },
        { id: 'green-chutney', name: 'Green Chutney', price: 15, isVeg: true },
        { id: 'extra-masala', name: 'Extra Masala', price: 10, isVeg: true },
      ],
    },
    {
      id: 'beverages',
      name: 'Add Beverages',
      maxSelect: 2,
      appliesTo: ['all'],
      options: [
        { id: 'pepsi', name: 'Pepsi (475ml)', price: 60, isVeg: true },
        { id: 'coke', name: 'Coca-Cola (475ml)', price: 60, isVeg: true },
        { id: 'water', name: 'Mineral Water', price: 20, isVeg: true },
        { id: 'buttermilk', name: 'Chaas', price: 40, isVeg: true },
      ],
    },
    {
      id: 'breads',
      name: 'Add Breads',
      maxSelect: 3,
      appliesTo: ['kabab-khazana', 'non-veg-main-course', 'pure-veg-main-course', 'soya-chaap'],
      options: [
        { id: 'tawa-roti', name: 'Plain Tawa Roti', price: 15, isVeg: true },
        { id: 'butter-roti', name: 'Butter Tawa Roti', price: 20, isVeg: true },
      ],
    },
  ]
  done.push('Seeded 3 add-on groups')
  warn.push('Add-on prices in data/menu.json are made up. Set your real ones.')
}
fs.writeFileSync('data/menu.json', JSON.stringify(menu, null, 2) + '\n')

// ----------------------------------------------------------- 4. small edits
function edit(file, label, pairs, guard) {
  if (!fs.existsSync(file)) return warn.push(file + ' not found')
  let s = fs.readFileSync(file, 'utf8')
  if (guard && s.includes(guard)) return
  let n = 0
  for (const p of pairs) {
    if (!s.includes(p[0])) {
      warn.push(label + ': anchor missing')
      continue
    }
    s = s.split(p[0]).join(p[1])
    n++
  }
  if (n) {
    fs.writeFileSync(file, s)
    done.push(label + ' (' + n + ' edits)')
  }
}

// The order-message rebuild, assembled with T so no nested literals are needed.
const OLD_ORDER =
  '    const orderItems = items.map(item => \n' +
  '      ' + T + '  ${item.name}${item.size ? ' + T + ' (${item.size})' + T + " : ''}" +
  ' x${item.quantity} = Rs.${item.price * item.quantity}' + T + '\n' +
  "    ).join('\\n')"

const NEW_ORDER =
  '    const orderItems = items.map(item => {\n' +
  '      let line = ' + T + '  ${item.name}${item.size ? ' + T + ' (${item.size})' + T + " : ''}" +
  ' x${item.quantity} = Rs.${item.price * item.quantity}' + T + '\n' +
  '      if (item.addOns?.length) {\n' +
  '        line += ' + T + '\\n     + ${item.addOns.map(a => ' + T + '${a.name} (Rs.${a.price})' +
  T + ").join(', ')}" + T + '\n' +
  '      }\n' +
  '      if (item.cookingRequest) {\n' +
  '        line += ' + T + '\\n     * Request: ${item.cookingRequest}' + T + '\n' +
  '      }\n' +
  '      return line\n' +
  "    }).join('\\n')"

edit('app/cart/page.tsx', 'Order message carries add-ons + cooking requests', [
  [OLD_ORDER, NEW_ORDER],
  [
    'onClick={() => soldOut.forEach(i => removeItem(i.id, i.size))}',
    'onClick={() => soldOut.forEach(i => removeItem(i.lineId))}',
  ],
  ['removeItem(item.id, item.size)', 'removeItem(item.lineId)'],
  ['updateQuantity(item.id, item.quantity - 1, item.size)', 'updateQuantity(item.lineId, item.quantity - 1)'],
  ['updateQuantity(item.id, item.quantity + 1, item.size)', 'updateQuantity(item.lineId, item.quantity + 1)'],
], 'item.cookingRequest')

edit('components/category-tabs.tsx', 'Category sheet scrolls above the nav', [
  ['<div className="fixed inset-0 z-50">', '<div className="fixed inset-0 z-[70]">'],
  ['pb-[calc(2rem+env(safe-area-inset-bottom))]', 'pb-[calc(7rem+env(safe-area-inset-bottom))]'],
], 'z-[70]')

// -------------------------------- 5. home page: 36px strip + Checkout button
const STRIP =
  '      {/* Selected dishes strip above the bottom nav */}\n' +
  '      {items.length > 0 && (\n' +
  '        <div className="fixed bottom-20 left-0 right-0 z-40 border-t border-border bg-background">\n' +
  '          <div className="flex items-center gap-2 px-3 py-2">\n' +
  '            <div className="flex flex-1 gap-1.5 overflow-x-auto scrollbar-hide">\n' +
  '              {items.map(item => (\n' +
  '                <div key={item.lineId} className="relative shrink-0 pt-1.5 pr-1.5">\n' +
  '                  <div className="h-9 w-9 overflow-hidden rounded-md border border-primary">\n' +
  '                    <Image\n' +
  '                      src={item.image}\n' +
  '                      alt={item.name}\n' +
  '                      width={36}\n' +
  '                      height={36}\n' +
  '                      className="h-full w-full object-cover"\n' +
  '                    />\n' +
  '                  </div>\n' +
  '                  <span className="absolute bottom-0 left-0 flex h-3.5 min-w-3.5 items-center justify-center rounded-full bg-primary px-0.5 text-[9px] font-bold text-primary-foreground">\n' +
  '                    {item.quantity}\n' +
  '                  </span>\n' +
  '                  <button\n' +
  '                    onClick={() => removeItem(item.lineId)}\n' +
  '                    aria-label={' + T + 'Remove ${item.name}' + T + '}\n' +
  '                    className="absolute top-0 right-0 flex h-4 w-4 items-center justify-center rounded-full bg-foreground text-background shadow"\n' +
  '                  >\n' +
  '                    <Minus className="h-2.5 w-2.5" />\n' +
  '                  </button>\n' +
  '                </div>\n' +
  '              ))}\n' +
  '            </div>\n' +
  '            <button\n' +
  "              onClick={() => router.push('/cart')}\n" +
  '              className="flex shrink-0 items-center gap-1 rounded-lg bg-primary px-3 py-2 text-xs font-bold text-primary-foreground"\n' +
  '            >\n' +
  '              Checkout\n' +
  '              <ChevronRight className="h-3.5 w-3.5" />\n' +
  '            </button>\n' +
  '          </div>\n' +
  '        </div>\n' +
  '      )}\n      \n'

let home = fs.readFileSync('app/page.tsx', 'utf8')
if (!home.includes("router.push('/cart')")) {
  const a1 = home.indexOf('      {/* Selected Dishes Preview Above Bottom Nav */}')
  const a2 = home.indexOf('      {/* Selected dishes strip above the bottom nav */}')
  const start = a1 !== -1 ? a1 : a2
  const end = home.indexOf('      <CategoryTabs')
  if (start !== -1 && end !== -1 && end > start) {
    home = home.slice(0, start) + STRIP + home.slice(end)
    if (!home.includes("from 'next/navigation'")) {
      home = home.replace(
        "import { useState, useMemo, useEffect } from 'react'",
        "import { useState, useMemo, useEffect } from 'react'\nimport { useRouter } from 'next/navigation'"
      )
    }
    if (home.includes("from 'lucide-react'")) {
      home = home.replace(/import \{[^}]*\} from 'lucide-react'/, "import { Minus, ChevronRight } from 'lucide-react'")
    } else {
      home = home.replace(
        "import Image from 'next/image'",
        "import Image from 'next/image'\nimport { Minus, ChevronRight } from 'lucide-react'"
      )
    }
    home = home.replace('const { items } = useCart()', 'const { items, removeItem } = useCart()')
    if (!home.includes('const router = useRouter()')) {
      home = home.replace(
        'const { items, removeItem } = useCart()',
        'const { items, removeItem } = useCart()\n  const router = useRouter()'
      )
    }
    fs.writeFileSync('app/page.tsx', home)
    done.push('app/page.tsx: 36px thumbnails + Checkout button')
  } else {
    warn.push('app/page.tsx: strip anchors not found')
  }
}

console.log('\n=========== PATCH v5 ===========\n')
done.forEach(d => console.log('  OK   ' + d))
if (warn.length) {
  console.log('\n  NOTE:')
  warn.forEach(w => console.log('  !  ' + w))
}
console.log('\nNext:')
console.log('  npm run build')
console.log('  npm run dev')
console.log('\nYour old cart clears itself once (storage key changed), so the')
console.log('stale duplicate items in your screenshots will disappear.\n')
