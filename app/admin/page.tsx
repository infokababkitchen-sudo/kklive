"use client"

import { useMemo, useState } from 'react'
import type { Dish, Category } from '@/types/menu'
import type { DishOverride, MenuOverrides, Variant, VariantKey, DishMedia } from '@/lib/menu-overrides'
import { mediaTypeOf } from '@/lib/menu-overrides'
import { OrdersTab } from '@/components/orders-tab'

interface DuplicateGroup {
  name: string
  category: string
  ids: { id: number; price: number | null }[]
}

const VARIANT_LABELS: { key: VariantKey; label: string; note: string }[] = [
  { key: 'dry', label: 'Dry', note: '2 seekh, 1 portion' },
  { key: 'roll', label: 'Roll', note: '1 seekh roll, stuffed onion & masala' },
  { key: 'half', label: 'Half', note: '' },
  { key: 'full', label: 'Full', note: '' },
]

type Tab = 'orders' | 'stock' | 'dishes' | 'variants' | 'new' | 'settings' | 'customers' | 'banners' | 'reviews'

export default function AdminDashboard() {
  const [key, setKey] = useState('')
  const [user, setUser] = useState('')
  const [pass, setPass] = useState('')
  const [useKey, setUseKey] = useState(false)
  const [unlocked, setUnlocked] = useState(false)
  const [busy, setBusy] = useState(false)
  const [msg, setMsg] = useState('')

  const [tab, setTab] = useState<Tab>('stock')
  const [dishes, setDishes] = useState<Dish[]>([])
  const [categories, setCategories] = useState<Category[]>([])
  const [duplicates, setDuplicates] = useState<DuplicateGroup[]>([])
  const [edits, setEdits] = useState<Record<string, DishOverride>>({})
  const [newDishes, setNewDishes] = useState<Dish[]>([])
  const [info, setInfo] = useState<Record<string, string>>({})
  const [health, setHealth] = useState<{ dbConfigured?: boolean; blobConfigured?: boolean }>({})
  const [customers, setCustomers] = useState<any[] | null>(null)
  const [banners, setBanners] = useState<any[]>([])
  const [delivery, setDelivery] = useState<any>({})
  const [panelOrders, setPanelOrders] = useState(false)
  const [reviews, setReviews] = useState<any | null>(null)

  const [search, setSearch] = useState('')
  const [cat, setCat] = useState('all')
  const [uploading, setUploading] = useState<number | null>(null)

  async function signIn() {
    setBusy(true)
    setMsg('')
    try {
      const res = await fetch('/api/auth/login', {
        method: 'POST',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify({ email: user, password: pass }),
      })
      const d = await res.json().catch(() => ({}))
      if (!res.ok) {
        setMsg(d.error || 'Wrong username or password.')
        return
      }
      // the session cookie now authorises every admin call
      await unlock()
    } catch {
      setMsg('Could not sign in.')
    } finally {
      setBusy(false)
    }
  }

  async function unlock() {
    setBusy(true)
    setMsg('')
    try {
      const res = await fetch('/api/admin/settings', { headers: { 'x-admin-key': key } })
      if (!res.ok) {
        setMsg('That admin key is not correct.')
        return
      }
      const d = await res.json()
      setDishes(d.dishes)
      setCategories(d.categories.filter((c: Category) => c.id !== 'all'))
      setDuplicates(d.duplicates || [])
      const o = d.overrides as MenuOverrides
      setEdits(o?.dishes || {})
      setNewDishes(o?.newDishes || [])
      setHealth(d.health || {})
      setBanners(o?.banners || [])
      setDelivery(o?.delivery || {})
      setPanelOrders(o?.panelOrders === true)
      const ri = o?.restaurantInfo || {}
      setInfo({
        phone: ri.phone ?? d.restaurantInfo?.phone ?? '',
        whatsapp: ri.whatsapp ?? d.restaurantInfo?.whatsapp ?? '',
        outlet: ri.outlet ?? d.restaurantInfo?.outlet ?? '',
        lunch: ri.timings?.lunch ?? d.restaurantInfo?.timings?.lunch ?? '',
        dinner: ri.timings?.dinner ?? d.restaurantInfo?.timings?.dinner ?? '',
      })
      setUnlocked(true)
    } catch {
      setMsg('Could not load. Try again.')
    } finally {
      setBusy(false)
    }
  }

  async function save(next?: {
    edits?: Record<string, DishOverride>
    newDishes?: Dish[]
    panelOrders?: boolean
  }) {
    setBusy(true)
    setMsg('')
    try {
      const res = await fetch('/api/admin/settings', {
        method: 'PUT',
        headers: { 'content-type': 'application/json', 'x-admin-key': key },
        body: JSON.stringify({
          dishes: next?.edits ?? edits,
          newDishes: next?.newDishes ?? newDishes,
          banners,
          delivery,
          panelOrders: next?.panelOrders ?? panelOrders,
          restaurantInfo: {
            phone: info.phone,
            whatsapp: info.whatsapp,
            outlet: info.outlet,
            timings: { lunch: info.lunch, dinner: info.dinner },
          },
        }),
      })
      setMsg(res.ok ? 'Saved. Live on the site now.' : (await res.json().catch(() => ({}))).error || 'Save failed.')
    } catch {
      setMsg('Save failed. Check your connection.')
    } finally {
      setBusy(false)
    }
  }

  function patch(id: number, p: Partial<DishOverride>) {
    setEdits(prev => ({ ...prev, [String(id)]: { ...prev[String(id)], ...p } }))
  }

  async function upload(id: number, file: File) {
    setUploading(id)
    try {
      const form = new FormData()
      form.append('file', file)
      form.append('dishId', String(id))
      const res = await fetch('/api/admin/upload', {
        method: 'POST',
        headers: { 'x-admin-key': key },
        body: form,
      })
      const d = await res.json()
      if (!res.ok) {
        setMsg(d.error || 'Photo upload failed.')
        return
      }
      setEdits(prev => {
        const cur = prev[String(id)] || {}
        const list = (cur.media || []).slice(0, 2)
        return { ...prev, [String(id)]: { ...cur, image: d.url, media: [...list, { url: d.url, type: 'image' }] } }
      })
      setMsg('Photo attached. Tap Save changes to publish it.')
    } catch {
      setMsg('Photo upload failed.')
    } finally {
      setUploading(null)
    }
  }

  const allDishes = useMemo(() => [...dishes, ...newDishes], [dishes, newDishes])

  const visible = useMemo(
    () =>
      allDishes.filter(d => {
        if (cat !== 'all' && d.category !== cat) return false
        if (search && !d.name.toLowerCase().includes(search.toLowerCase())) return false
        return true
      }),
    [allDishes, search, cat]
  )

  const changed = Object.values(edits).filter(o => o && Object.keys(o).length).length
  const isPlaceholderWhatsapp = /^9?1?0{6,}$/.test((info.whatsapp || '').replace(/\D/g, ''))

  // ------------------------------------------------------------ locked
  if (!unlocked) {
    return (
      <main className="mx-auto flex min-h-screen max-w-md flex-col justify-center gap-5 p-6">
        <div>
          <p className="text-sm font-semibold text-primary">Kabab Kitchen</p>
          <h1 className="text-3xl font-bold">Admin dashboard</h1>
          <p className="mt-2 text-sm text-muted-foreground">
            Sign in to manage orders, prices, stock, photos and offers.
          </p>
        </div>

        {useKey ? (
          <>
            <input
              type="password"
              value={key}
              placeholder="Admin key"
              onChange={e => setKey(e.target.value)}
              onKeyDown={e => e.key === 'Enter' && unlock()}
              className="rounded-xl border bg-background p-3"
            />
            <button
              onClick={unlock}
              disabled={busy || !key}
              className="rounded-xl bg-primary p-3 font-semibold text-primary-foreground disabled:opacity-50"
            >
              {busy ? 'Checking...' : 'Unlock'}
            </button>
          </>
        ) : (
          <>
            <input
              value={user}
              placeholder="Username"
              autoComplete="username"
              onChange={e => setUser(e.target.value)}
              onKeyDown={e => e.key === 'Enter' && signIn()}
              className="rounded-xl border bg-background p-3"
            />
            <input
              type="password"
              value={pass}
              placeholder="Password"
              autoComplete="current-password"
              onChange={e => setPass(e.target.value)}
              onKeyDown={e => e.key === 'Enter' && signIn()}
              className="rounded-xl border bg-background p-3"
            />
            <button
              onClick={signIn}
              disabled={busy || !user || !pass}
              className="rounded-xl bg-primary p-3 font-semibold text-primary-foreground disabled:opacity-50"
            >
              {busy ? 'Signing in...' : 'Sign in'}
            </button>
          </>
        )}

        <button
          onClick={() => {
            setUseKey(!useKey)
            setMsg('')
          }}
          className="text-xs text-muted-foreground underline"
        >
          {useKey ? 'Sign in with username instead' : 'Use the admin key instead'}
        </button>

        {msg && <p className="text-sm text-red-600">{msg}</p>}
      </main>
    )
  }

  // ---------------------------------------------------------- unlocked
  return (
    <main className="mx-auto min-h-screen max-w-3xl p-4 pb-28">
      <div className="mb-3">
        <p className="text-sm font-semibold text-primary">Kabab Kitchen</p>
        <h1 className="text-2xl font-bold">Admin dashboard</h1>
        <p className="text-sm text-muted-foreground">
          {allDishes.length} dishes · {changed} edited
        </p>
      </div>

      <div className="mb-4 flex gap-1 border-b">
        {(
          [
            ['orders', 'Orders'],
            ['stock', 'Stock'],
            ['dishes', 'Dishes'],
            ['variants', `Variants (${duplicates.length})`],
            ['new', 'Add dish'],
            ['settings', 'Contact'],
            ['banners', 'Banners'],
            ['customers', 'Customers'],
            ['reviews', 'Reviews'],
          ] as [Tab, string][]
        ).map(([t, label]) => (
          <button
            key={t}
            onClick={() => setTab(t)}
            className={`px-3 py-2 text-sm font-medium ${
              tab === t ? 'border-b-2 border-primary text-primary' : 'text-muted-foreground'
            }`}
          >
            {label}
          </button>
        ))}
      </div>

      {health.dbConfigured === false && (
        <div className="mb-4 rounded-xl border border-red-300 bg-red-50 p-3">
          <p className="text-sm font-semibold text-red-800">
            Database not connected, so nothing can be saved.
          </p>
          <p className="mt-1 text-xs text-red-700">
            No connection string found. Run <code>npx vercel env pull .env.local</code>{' '}
            locally, and make sure DATABASE_URL is set in Vercel for the live site.
          </p>
        </div>
      )}

      {health.blobConfigured === false && (
        <div className="mb-4 rounded-xl border border-amber-300 bg-amber-50 p-3">
          <p className="text-sm font-semibold text-amber-900">Photo upload is off</p>
          <p className="mt-1 text-xs text-amber-800">
            Everything else saves normally. To add a photo, paste an image link in the
            &quot;Photos and clips&quot; box on any dish.
          </p>
        </div>
      )}

      {isPlaceholderWhatsapp && (
        <div className="mb-4 rounded-xl border border-amber-300 bg-amber-50 p-3">
          <p className="text-sm font-semibold text-amber-900">
            Orders are going to a placeholder WhatsApp number.
          </p>
          <p className="mt-1 text-xs text-amber-800">
            Open the Contact tab and enter your real number, otherwise checkout
            sends orders nowhere.
          </p>
        </div>
      )}

      {tab === 'banners' && (
        <BannersTab banners={banners} setBanners={setBanners} adminKey={key} />
      )}

      {tab === 'reviews' && <ReviewsTab data={reviews} adminKey={key} onLoad={setReviews} />}

      {tab === 'customers' && (
        <CustomersTab list={customers} adminKey={key} onLoad={setCustomers} />
      )}

      {tab === 'settings' && (
        <div className="space-y-3">
          <div className="rounded-xl border p-3">
            <p className="text-sm font-semibold">Delivery</p>
            <p className="mt-0.5 text-xs text-muted-foreground">
              While a free-delivery promo is running, every order ships free with no
              minimum. Clear the date to switch back to the normal rule.
            </p>

            <div className="mt-3 flex flex-wrap gap-2">
              {[
                ['1 month', 1],
                ['2 months', 2],
                ['3 months', 3],
              ].map(([label, months]) => (
                <button
                  key={label as string}
                  onClick={() => {
                    const d = new Date()
                    d.setMonth(d.getMonth() + (months as number))
                    setDelivery({ ...delivery, freeUntil: d.toISOString().slice(0, 10) })
                  }}
                  className="rounded-full border px-3 py-1.5 text-xs"
                >
                  Free for {label as string}
                </button>
              ))}
              <button
                onClick={() => setDelivery({ ...delivery, freeUntil: '' })}
                className="rounded-full border px-3 py-1.5 text-xs text-red-600"
              >
                Stop promo
              </button>
            </div>

            <label className="mt-3 block">
              <span className="text-xs text-muted-foreground">
                Free delivery for everyone until
              </span>
              <input
                type="date"
                value={delivery.freeUntil || ''}
                onChange={e => setDelivery({ ...delivery, freeUntil: e.target.value })}
                className="mt-1 w-full rounded-lg border bg-background p-2 text-sm"
              />
            </label>

            <div className="mt-2 flex gap-2">
              <label className="flex-1">
                <span className="text-xs text-muted-foreground">Otherwise free above Rs.</span>
                <input
                  type="number"
                  value={delivery.freeAbove ?? ''}
                  placeholder="299"
                  onChange={e =>
                    setDelivery({
                      ...delivery,
                      freeAbove: e.target.value === '' ? undefined : Number(e.target.value),
                    })
                  }
                  className="mt-1 w-full rounded-lg border bg-background p-2 text-sm"
                />
              </label>
              <label className="flex-1">
                <span className="text-xs text-muted-foreground">Delivery charge Rs.</span>
                <input
                  type="number"
                  value={delivery.fee ?? ''}
                  placeholder="40"
                  onChange={e =>
                    setDelivery({
                      ...delivery,
                      fee: e.target.value === '' ? undefined : Number(e.target.value),
                    })
                  }
                  className="mt-1 w-full rounded-lg border bg-background p-2 text-sm"
                />
              </label>
            </div>

            <p className="mt-2 text-xs font-medium text-green-700">
              {delivery.freeUntil
                ? 'Free delivery on every order until ' + delivery.freeUntil
                : 'Normal rule: free above Rs.' + (delivery.freeAbove ?? 299)}
            </p>
          </div>

          <p className="rounded-xl bg-muted/50 p-3 text-xs text-muted-foreground">
            Checkout sends every order to the WhatsApp number below. Use the
            country code with no plus sign or spaces, for example 919266321191.
          </p>
          {(
            [
              ['whatsapp', 'WhatsApp number (orders go here)', '919266321191'],
              ['phone', 'Phone shown to customers', '+91 98765 43210'],
              ['outlet', 'Outlet address', 'Kabab Kitchen, Ghaziabad'],
              ['lunch', 'Lunch timings', '12:00 PM - 4:00 PM'],
              ['dinner', 'Dinner timings', '7:00 PM - 11:00 PM'],
            ] as [string, string, string][]
          ).map(([k, label, ph]) => (
            <label key={k} className="block">
              <span className="text-xs text-muted-foreground">{label}</span>
              <input
                value={info[k] || ''}
                placeholder={ph}
                onChange={e => setInfo(prev => ({ ...prev, [k]: e.target.value }))}
                className="mt-1 w-full rounded-xl border bg-background p-2.5 text-sm"
              />
            </label>
          ))}
        </div>
      )}

      {tab === 'orders' && (
        <>
          <label className="mb-3 flex items-start gap-2 rounded-xl border p-3">
            <input
              type="checkbox"
              checked={panelOrders}
              onChange={e => {
                const on = e.target.checked
                setPanelOrders(on)
                save({ panelOrders: on } as any)
              }}
              className="mt-0.5"
            />
            <span className="text-xs">
              <span className="block text-sm font-medium">Show orders in this panel</span>
              <span className="text-muted-foreground">
                Off means WhatsApp only, exactly as today. On sends every order to both,
                so WhatsApp still works if this tab is closed.
              </span>
            </span>
          </label>
          {panelOrders ? (
            <OrdersTab adminKey={key} />
          ) : (
            <p className="py-8 text-center text-sm text-muted-foreground">
              Panel orders are off. Orders are going to WhatsApp only.
            </p>
          )}
        </>
      )}

      {tab === 'stock' && (
        <StockTab
          dishes={allDishes}
          edits={edits}
          busy={busy}
          onToggle={(id, inStock) => {
            const next = { ...edits, [String(id)]: { ...edits[String(id)], inStock } }
            setEdits(next)
            save({ edits: next })
          }}
          onAll={inStock => {
            const next = { ...edits }
            allDishes.forEach(d => {
              next[String(d.id)] = { ...next[String(d.id)], inStock }
            })
            setEdits(next)
            save({ edits: next })
          }}
        />
      )}

      {tab === 'dishes' && (
        <>
          <div className="mb-3 flex flex-col gap-2 sm:flex-row">
            <input
              value={search}
              placeholder="Search dishes…"
              onChange={e => setSearch(e.target.value)}
              className="flex-1 rounded-xl border bg-background p-2.5 text-sm"
            />
            <select
              value={cat}
              onChange={e => setCat(e.target.value)}
              className="rounded-xl border bg-background p-2.5 text-sm"
            >
              <option value="all">All categories</option>
              {categories.map(c => (
                <option key={c.id} value={c.id}>
                  {c.name}
                </option>
              ))}
            </select>
          </div>

          <div className="space-y-2">
            {visible.map(dish => {
              const o = edits[String(dish.id)] || {}
              const hidden = o.hidden === true
              const out = o.inStock === false
              const split = dish.halfPrice !== undefined || dish.fullPrice !== undefined
              return (
                <div
                  key={dish.id}
                  className={`rounded-xl border p-3 ${hidden ? 'opacity-40' : ''}`}
                >
                  <div className="flex items-start justify-between gap-2">
                    <div className="min-w-0">
                      <p className="font-medium leading-tight">
                        <span className={dish.isVeg ? 'text-green-600' : 'text-red-600'}>●</span>{' '}
                        {o.name || dish.name}
                      </p>
                      <p className="text-xs text-muted-foreground">
                        #{dish.id} · {dish.category}
                        {o.variants?.length ? ` · ${o.variants.length} variants` : ''}
                      </p>
                    </div>
                    <div className="flex shrink-0 flex-col items-end gap-1 text-xs">
                      <label className="flex items-center gap-1.5">
                        <input
                          type="checkbox"
                          checked={!out}
                          onChange={e => patch(dish.id, { inStock: e.target.checked })}
                        />
                        In stock
                      </label>
                      <label className="flex items-center gap-1.5">
                        <input
                          type="checkbox"
                          checked={hidden}
                          onChange={e => patch(dish.id, { hidden: e.target.checked })}
                        />
                        Hide from menu
                      </label>
                    </div>
                  </div>

                  <div className="mt-3 flex flex-wrap items-end gap-3">
                    {split ? (
                      <>
                        <Num
                          label="Half"
                          orig={dish.halfPrice}
                          val={o.halfPrice}
                          on={v => patch(dish.id, { halfPrice: v })}
                        />
                        <Num
                          label="Full"
                          orig={dish.fullPrice}
                          val={o.fullPrice}
                          on={v => patch(dish.id, { fullPrice: v })}
                        />
                      </>
                    ) : (
                      <Num
                        label="Price"
                        orig={dish.price}
                        val={o.price}
                        on={v => patch(dish.id, { price: v })}
                      />
                    )}
                    <label className="cursor-pointer rounded-lg border px-3 py-2 text-xs">
                      {uploading === dish.id ? 'Uploading...' : 'Upload photo'}
                      <input
                        type="file"
                        accept="image/*"
                        className="hidden"
                        onChange={e => {
                          const f = e.target.files?.[0]
                          if (f) upload(dish.id, f)
                        }}
                      />
                    </label>
                  </div>

                  <MediaEditor
                    media={o.media || []}
                    fallback={dish.image}
                    onChange={m => patch(dish.id, { media: m })}
                  />
                </div>
              )
            })}
            {!visible.length && (
              <p className="py-8 text-center text-sm text-muted-foreground">No dishes match.</p>
            )}
          </div>
        </>
      )}

      {tab === 'variants' && (
        <VariantsTab
          duplicates={duplicates}
          edits={edits}
          setEdits={setEdits}
        />
      )}

      {tab === 'new' && (
        <NewDishTab
          categories={categories}
          newDishes={newDishes}
          setNewDishes={setNewDishes}
          onRemove={id => setNewDishes(prev => prev.filter(d => d.id !== id))}
        />
      )}

      <div className="fixed inset-x-0 bottom-0 border-t bg-background p-3">
        <div className="mx-auto flex max-w-3xl items-center gap-3">
          {msg && <p className="flex-1 text-xs text-muted-foreground">{msg}</p>}
          <button
            onClick={() => save()}
            disabled={busy}
            className="ml-auto rounded-xl bg-primary px-6 py-3 font-semibold text-primary-foreground disabled:opacity-50"
          >
            {busy ? 'Saving...' : 'Save changes'}
          </button>
        </div>
      </div>
    </main>
  )
}

// ------------------------------------------------------------------- stock
function StockTab({
  dishes,
  edits,
  busy,
  onToggle,
  onAll,
}: {
  dishes: Dish[]
  edits: Record<string, DishOverride>
  busy: boolean
  onToggle: (id: number, inStock: boolean) => void
  onAll: (inStock: boolean) => void
}) {
  const [q, setQ] = useState('')
  const isOut = (d: Dish) => edits[String(d.id)]?.inStock === false
  const outCount = dishes.filter(isOut).length
  const list = dishes.filter(d => !q || d.name.toLowerCase().includes(q.toLowerCase()))

  return (
    <div className="space-y-3">
      <div className="grid grid-cols-2 gap-2">
        <div className="rounded-xl border p-3">
          <p className="text-2xl font-bold text-green-600">{dishes.length - outCount}</p>
          <p className="text-xs text-muted-foreground">In stock</p>
        </div>
        <div className="rounded-xl border p-3">
          <p className="text-2xl font-bold text-red-600">{outCount}</p>
          <p className="text-xs text-muted-foreground">Out of stock</p>
        </div>
      </div>

      <p className="rounded-xl bg-muted/50 p-3 text-xs text-muted-foreground">
        Yahan toggle dabate hi turant save ho jaata hai. Customer ke card par
        &quot;Out of stock&quot; aa jayega, Add button hat jayega, aur agar cart mein
        pehle se pada hai to checkout ruk jayega.
      </p>

      <div className="flex gap-2">
        <input
          value={q}
          onChange={e => setQ(e.target.value)}
          placeholder="Search dishes…"
          className="flex-1 rounded-xl border bg-background p-2.5 text-sm"
        />
        <button
          onClick={() => onAll(true)}
          disabled={busy}
          className="rounded-xl border px-3 text-xs font-medium disabled:opacity-50"
        >
          All in stock
        </button>
      </div>

      <div className="divide-y rounded-xl border">
        {list.map(d => {
          const out = isOut(d)
          return (
            <div key={d.id} className="flex items-center justify-between gap-3 p-3">
              <div className="min-w-0">
                <p className={`truncate text-sm ${out ? 'text-muted-foreground line-through' : ''}`}>
                  {d.name}
                </p>
                <p className="text-xs text-muted-foreground">#{d.id} &middot; {d.category}</p>
              </div>
              <button
                onClick={() => onToggle(d.id, out)}
                disabled={busy}
                className={`shrink-0 rounded-full px-3 py-1.5 text-xs font-semibold disabled:opacity-50 ${
                  out ? 'bg-red-100 text-red-700' : 'bg-green-100 text-green-700'
                }`}
              >
                {out ? 'Out of stock' : 'In stock'}
              </button>
            </div>
          )
        })}
        {!list.length && (
          <p className="p-6 text-center text-sm text-muted-foreground">No dishes match.</p>
        )}
      </div>
    </div>
  )
}

// ------------------------------------------------------------------ variants
function VariantsTab({
  duplicates,
  edits,
  setEdits,
}: {
  duplicates: DuplicateGroup[]
  edits: Record<string, DishOverride>
  setEdits: (f: (p: Record<string, DishOverride>) => Record<string, DishOverride>) => void
}) {
  const [draft, setDraft] = useState<Record<string, Record<number, VariantKey>>>({})

  function merge(group: DuplicateGroup) {
    const picks = draft[group.name] || {}
    const keeper = group.ids[0].id
    const variants: Variant[] = []
    group.ids.forEach(({ id, price }) => {
      const k = picks[id]
      if (!k || price === null) return
      const preset = VARIANT_LABELS.find(v => v.key === k)
      if (!preset) return
      variants.push({ key: k, label: preset.label, price, note: preset.note || undefined })
    })

    if (variants.length < 2) return

    setEdits(prev => {
      const next = { ...prev }
      next[String(keeper)] = { ...next[String(keeper)], variants, hidden: false }
      group.ids.slice(1).forEach(({ id }) => {
        next[String(id)] = { ...next[String(id)], hidden: true }
      })
      return next
    })
  }

  if (!duplicates.length) {
    return <p className="py-8 text-center text-sm text-muted-foreground">No duplicates found.</p>
  }

  return (
    <div className="space-y-3">
      <p className="rounded-xl bg-muted/50 p-3 text-xs text-muted-foreground">
        Ye dishes menu.json mein do baar padi hain — asal mein ye ek hi dish ke variants hain.
        Har row ko Dry / Roll / Half / Full choose karke &quot;Merge&quot; dabao. Phir customer ko
        ek hi card dikhega, aur Add dabane par neeche se options ki sheet khulegi.
      </p>

      {duplicates.map(group => {
        const merged = group.ids.slice(1).every(({ id }) => edits[String(id)]?.hidden)
        return (
          <div key={group.name} className="rounded-xl border p-3">
            <div className="flex items-center justify-between">
              <p className="font-medium">{group.name}</p>
              {merged && <span className="text-xs text-green-600">Merged</span>}
            </div>
            <div className="mt-2 space-y-2">
              {group.ids.map(({ id, price }) => (
                <div key={id} className="flex items-center gap-2">
                  <span className="w-28 shrink-0 text-xs text-muted-foreground">
                    #{id} · Rs.{price ?? '-'}
                  </span>
                  <select
                    value={draft[group.name]?.[id] || ''}
                    onChange={e =>
                      setDraft(p => ({
                        ...p,
                        [group.name]: { ...p[group.name], [id]: e.target.value as VariantKey },
                      }))
                    }
                    className="flex-1 rounded-lg border bg-background p-2 text-sm"
                  >
                    <option value="">Which one is this?</option>
                    {VARIANT_LABELS.map(v => (
                      <option key={v.key} value={v.key}>
                        {v.label}
                        {v.note ? ` — ${v.note}` : ''}
                      </option>
                    ))}
                  </select>
                </div>
              ))}
            </div>
            <button
              onClick={() => merge(group)}
              className="mt-3 rounded-lg border px-4 py-2 text-sm font-medium"
            >
              Merge
            </button>
          </div>
        )
      })}
    </div>
  )
}

// ------------------------------------------------------------------ new dish
function NewDishTab({
  categories,
  newDishes,
  setNewDishes,
  onRemove,
}: {
  categories: Category[]
  newDishes: Dish[]
  setNewDishes: (f: (p: Dish[]) => Dish[]) => void
  onRemove: (id: number) => void
}) {
  const [name, setName] = useState('')
  const [price, setPrice] = useState('')
  const [category, setCategory] = useState(categories[0]?.id || '')
  const [desc, setDesc] = useState('')
  const [isVeg, setIsVeg] = useState(true)
  const [until, setUntil] = useState('')
  const [days, setDays] = useState<number[]>([])
  const [rows, setRows] = useState<{ label: string; price: string }[]>([])

  const DAYS = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat']

  function toggleDay(d: number) {
    setDays(p => (p.includes(d) ? p.filter(x => x !== d) : [...p, d]))
  }

  function add() {
    const variants = rows
      .filter(r => r.label.trim() && Number(r.price) > 0)
      .map((r, i) => ({
        key: (['half', 'full', 'dry', 'roll'] as const)[i] || 'full',
        label: r.label.trim(),
        price: Number(r.price),
      }))

    if (!name || !category) return
    if (!variants.length && !price) return

    setNewDishes(prev => {
      const id = Math.max(999, ...prev.map(d => d.id)) + 1
      const dish: any = {
        id,
        name,
        category,
        isVeg,
        description: desc || name,
        calories: 0,
        spiceLevel: 'medium',
        rating: 4.5,
        reviews: 0,
        isPopular: false,
        isNew: true,
        image: '/images/placeholder-dish.jpg',
      }
      if (variants.length) dish.variants = variants
      else dish.price = Number(price)
      if (until) dish.availableUntil = until
      if (days.length) dish.availableDays = days
      return [...prev, dish]
    })
    setName('')
    setPrice('')
    setDesc('')
    setUntil('')
    setDays([])
    setRows([])
  }

  return (
    <div className="space-y-4">
      <p className="rounded-xl bg-muted/50 p-3 text-xs text-muted-foreground">
        Use this for a daily special too. Add sizes as variants, pick the days it runs
        and the last date it should appear. After that date it disappears on its own.
      </p>

      <div className="space-y-2 rounded-xl border p-3">
        <input
          value={name}
          onChange={e => setName(e.target.value)}
          placeholder="Dish name, e.g. Sunday Chicken Biryani"
          className="w-full rounded-lg border bg-background p-2.5 text-sm"
        />
        <input
          value={desc}
          onChange={e => setDesc(e.target.value)}
          placeholder="Description (optional)"
          className="w-full rounded-lg border bg-background p-2.5 text-sm"
        />
        <select
          value={category}
          onChange={e => setCategory(e.target.value)}
          className="w-full rounded-lg border bg-background p-2.5 text-sm"
        >
          {categories.map(c => (
            <option key={c.id} value={c.id}>
              {c.name}
            </option>
          ))}
        </select>

        <div className="rounded-lg border p-2.5">
          <p className="text-xs font-semibold">Sizes</p>
          <p className="text-[11px] text-muted-foreground">
            Leave empty for a single price. Example: 300g / 600g / 1kg.
          </p>
          {rows.map((r, i) => (
            <div key={i} className="mt-2 flex gap-2">
              <input
                value={r.label}
                onChange={e =>
                  setRows(p => p.map((x, j) => (j === i ? { ...x, label: e.target.value } : x)))
                }
                placeholder="300g"
                className="flex-1 rounded-lg border bg-background p-2 text-sm"
              />
              <input
                type="number"
                value={r.price}
                onChange={e =>
                  setRows(p => p.map((x, j) => (j === i ? { ...x, price: e.target.value } : x)))
                }
                placeholder="100"
                className="w-24 rounded-lg border bg-background p-2 text-sm"
              />
              <button
                onClick={() => setRows(p => p.filter((_, j) => j !== i))}
                className="px-2 text-xs text-red-600"
              >
                x
              </button>
            </div>
          ))}
          {rows.length < 4 && (
            <button
              onClick={() => setRows(p => [...p, { label: '', price: '' }])}
              className="mt-2 rounded-lg border px-3 py-1.5 text-xs"
            >
              Add size
            </button>
          )}
        </div>

        {!rows.length && (
          <input
            value={price}
            onChange={e => setPrice(e.target.value)}
            type="number"
            placeholder="Price"
            className="w-32 rounded-lg border bg-background p-2.5 text-sm"
          />
        )}

        <div className="rounded-lg border p-2.5">
          <p className="text-xs font-semibold">Runs on</p>
          <div className="mt-2 flex flex-wrap gap-1.5">
            {DAYS.map((d, i) => (
              <button
                key={d}
                onClick={() => toggleDay(i)}
                className={
                  'rounded-full border px-2.5 py-1 text-xs ' +
                  (days.includes(i) ? 'border-primary text-primary' : 'text-muted-foreground')
                }
              >
                {d}
              </button>
            ))}
          </div>
          <p className="mt-1 text-[11px] text-muted-foreground">
            {days.length ? 'Only on the days above.' : 'No day picked means every day.'}
          </p>

          <label className="mt-2 block">
            <span className="text-xs text-muted-foreground">Last date shown (optional)</span>
            <input
              type="date"
              value={until}
              onChange={e => setUntil(e.target.value)}
              className="mt-1 w-full rounded-lg border bg-background p-2 text-sm"
            />
          </label>
        </div>

        <label className="flex items-center gap-2 text-sm">
          <input type="checkbox" checked={isVeg} onChange={e => setIsVeg(e.target.checked)} />
          Veg
        </label>

        <button
          onClick={add}
          disabled={!name || (!price && !rows.some(r => r.label && r.price))}
          className="w-full rounded-lg bg-primary p-2.5 text-sm font-semibold text-primary-foreground disabled:opacity-50"
        >
          Add dish
        </button>
        <p className="text-xs text-muted-foreground">
          After adding, tap Save changes below to publish. Attach a photo from the Dishes
          tab, and use the Stock tab to mark it sold out.
        </p>
      </div>

      {newDishes.length > 0 && (
        <div>
          <p className="mb-2 text-sm font-medium">Dishes you added</p>
          <div className="space-y-2">
            {newDishes.map((d: any) => (
              <div key={d.id} className="flex items-center justify-between rounded-xl border p-3">
                <div className="min-w-0">
                  <p className="text-sm font-medium">{d.name}</p>
                  <p className="text-xs text-muted-foreground">
                    #{d.id} &middot; {d.category} &middot;{' '}
                    {d.variants?.length
                      ? d.variants.map((v: any) => v.label + ' Rs.' + v.price).join(' / ')
                      : 'Rs.' + d.price}
                  </p>
                  {(d.availableDays?.length || d.availableUntil) && (
                    <p className="text-xs text-amber-700">
                      {d.availableDays?.length
                        ? d.availableDays.map((i: number) => DAYS[i]).join(', ')
                        : 'Every day'}
                      {d.availableUntil ? ' until ' + d.availableUntil : ''}
                    </p>
                  )}
                </div>
                <button onClick={() => onRemove(d.id)} className="text-xs text-red-600">
                  Delete
                </button>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  )
}

function Num({
  label,
  orig,
  val,
  on,
}: {
  label: string
  orig?: number
  val?: number
  on: (v: number | undefined) => void
}) {
  return (
    <div className="flex flex-col gap-1">
      <span className="text-xs text-muted-foreground">
        {label} {orig !== undefined && <span className="opacity-60">(Rs.{orig})</span>}
      </span>
      <input
        type="number"
        min="0"
        placeholder={orig !== undefined ? String(orig) : '-'}
        value={val ?? ''}
        onChange={e => on(e.target.value === '' ? undefined : Number(e.target.value))}
        className="w-24 rounded-lg border bg-background p-2 text-sm"
      />
    </div>
  )
}

// --------------------------------------------------------------- customers
function CustomersTab({
  list,
  adminKey,
  onLoad,
}: {
  list: any[] | null
  adminKey: string
  onLoad: (c: any[]) => void
}) {
  const [busy, setBusy] = useState(false)
  const [err, setErr] = useState('')

  async function load() {
    setBusy(true)
    setErr('')
    try {
      const res = await fetch('/api/customers', { headers: { 'x-admin-key': adminKey } })
      if (!res.ok) {
        setErr('Could not load customers.')
        return
      }
      const d = await res.json()
      onLoad(d.customers || [])
    } catch {
      setErr('Could not load customers.')
    } finally {
      setBusy(false)
    }
  }

  function exportCsv(onlyConsented: boolean) {
    const rows = (list || []).filter(c => !onlyConsented || c.marketingConsent)
    const csv = [
      'phone,name,orders,last_order,marketing_consent',
      ...rows.map(c =>
        [c.phone, JSON.stringify(c.name || ''), c.orderCount, c.lastOrderAt, c.marketingConsent]
          .join(',')
      ),
    ].join('\n')
    const url = URL.createObjectURL(new Blob([csv], { type: 'text/csv' }))
    const a = document.createElement('a')
    a.href = url
    a.download = onlyConsented ? 'customers-consented.csv' : 'customers-all.csv'
    a.click()
    URL.revokeObjectURL(url)
  }

  const consented = (list || []).filter(c => c.marketingConsent).length

  return (
    <div className="space-y-3">
      <p className="rounded-xl bg-muted/50 p-3 text-xs text-muted-foreground">
        Every order saves the customer&apos;s number so they do not retype it and you can
        see repeat buyers. Only tick-the-box customers count as marketing contacts &mdash;
        send promotions to that list only.
      </p>

      {!list && (
        <button
          onClick={load}
          disabled={busy}
          className="w-full rounded-xl bg-primary p-3 font-semibold text-primary-foreground disabled:opacity-50"
        >
          {busy ? 'Loading...' : 'Load customers'}
        </button>
      )}
      {err && <p className="text-sm text-red-600">{err}</p>}

      {list && (
        <>
          <div className="grid grid-cols-2 gap-2">
            <div className="rounded-xl border p-3">
              <p className="text-2xl font-bold">{list.length}</p>
              <p className="text-xs text-muted-foreground">Customers</p>
            </div>
            <div className="rounded-xl border p-3">
              <p className="text-2xl font-bold text-green-600">{consented}</p>
              <p className="text-xs text-muted-foreground">Opted in to marketing</p>
            </div>
          </div>

          <div className="flex gap-2">
            <button onClick={() => exportCsv(true)} className="flex-1 rounded-xl border p-2.5 text-sm">
              Export marketing list
            </button>
            <button onClick={() => exportCsv(false)} className="flex-1 rounded-xl border p-2.5 text-sm">
              Export all
            </button>
          </div>

          <div className="divide-y rounded-xl border">
            {list.map(c => (
              <div key={c.phone} className="flex items-center justify-between gap-3 p-3">
                <div className="min-w-0">
                  <p className="truncate text-sm font-medium">{c.name || 'No name'}</p>
                  <p className="text-xs text-muted-foreground">
                    {c.phone} &middot; {c.orderCount} order{c.orderCount > 1 ? 's' : ''}
                  </p>
                </div>
                {c.marketingConsent && (
                  <span className="shrink-0 rounded-full bg-green-100 px-2 py-1 text-[10px] font-semibold text-green-700">
                    opted in
                  </span>
                )}
              </div>
            ))}
            {!list.length && (
              <p className="p-6 text-center text-sm text-muted-foreground">No customers yet.</p>
            )}
          </div>
        </>
      )}
    </div>
  )
}
// ------------------------------------------------------------------ banners
function BannersTab({
  banners,
  setBanners,
  adminKey,
}: {
  banners: any[]
  setBanners: (b: any[]) => void
  adminKey: string
}) {
  const [uploading, setUploading] = useState<string | null>(null)
  const [msg, setMsg] = useState('')

  function add() {
    setBanners([
      ...banners,
      { id: 'b' + Date.now().toString(36), title: 'New banner', subtitle: '', image: '', active: true },
    ])
  }

  function patch(id: string, p: any) {
    setBanners(banners.map(b => (b.id === id ? { ...b, ...p } : b)))
  }

  async function upload(id: string, file: File) {
    setUploading(id)
    setMsg('')
    try {
      const form = new FormData()
      form.append('file', file)
      form.append('dishId', 'banner-' + id)
      const res = await fetch('/api/admin/upload', {
        method: 'POST',
        headers: { 'x-admin-key': adminKey },
        body: form,
      })
      const d = await res.json()
      if (!res.ok) {
        setMsg(d.error || 'Upload failed.')
        return
      }
      patch(id, { image: d.url })
      setMsg('Image attached. Tap Save changes to publish.')
    } catch {
      setMsg('Upload failed.')
    } finally {
      setUploading(null)
    }
  }

  return (
    <div className="space-y-3">
      <p className="rounded-xl bg-muted/50 p-3 text-xs text-muted-foreground">
        These are the sliding banners at the top of the menu. Add as many as you like.
        With no active banners the app falls back to plain text slides.
      </p>

      {banners.map(b => (
        <div key={b.id} className={'rounded-xl border p-3 ' + (b.active ? '' : 'opacity-50')}>
          <div className="flex items-start gap-3">
            {b.image ? (
              <img src={b.image} alt="" className="h-16 w-24 shrink-0 rounded-lg object-cover" />
            ) : (
              <div className="flex h-16 w-24 shrink-0 items-center justify-center rounded-lg bg-muted text-[10px] text-muted-foreground">
                no image
              </div>
            )}
            <div className="min-w-0 flex-1 space-y-2">
              <input
                value={b.title}
                onChange={e => patch(b.id, { title: e.target.value })}
                placeholder="Title"
                className="w-full rounded-lg border bg-background p-2 text-sm"
              />
              <input
                value={b.subtitle || ''}
                onChange={e => patch(b.id, { subtitle: e.target.value })}
                placeholder="Subtitle (optional)"
                className="w-full rounded-lg border bg-background p-2 text-sm"
              />
            </div>
          </div>

          <div className="mt-3 flex flex-wrap items-center gap-3">
            <label className="cursor-pointer rounded-lg border px-3 py-2 text-xs">
              {uploading === b.id ? 'Uploading...' : b.image ? 'Replace image' : 'Upload image'}
              <input
                type="file"
                accept="image/*"
                className="hidden"
                onChange={e => {
                  const f = e.target.files?.[0]
                  if (f) upload(b.id, f)
                }}
              />
            </label>
            <label className="flex items-center gap-1.5 text-xs">
              <input
                type="checkbox"
                checked={b.active}
                onChange={e => patch(b.id, { active: e.target.checked })}
              />
              Show on site
            </label>
            <button
              onClick={() => setBanners(banners.filter(x => x.id !== b.id))}
              className="ml-auto text-xs text-red-600"
            >
              Delete
            </button>
          </div>
        </div>
      ))}

      <button onClick={add} className="w-full rounded-xl border p-3 text-sm font-medium">
        Add banner
      </button>
      {msg && <p className="text-xs text-muted-foreground">{msg}</p>}
    </div>
  )
}

// ------------------------------------------------------------------ reviews
function ReviewsTab({
  data,
  adminKey,
  onLoad,
}: {
  data: any | null
  adminKey: string
  onLoad: (d: any) => void
}) {
  const [busy, setBusy] = useState(false)

  async function load() {
    setBusy(true)
    try {
      const res = await fetch('/api/reviews', { headers: { 'x-admin-key': adminKey } })
      onLoad(await res.json())
    } catch {
      onLoad({ average: 0, count: 0, reviews: [] })
    } finally {
      setBusy(false)
    }
  }

  if (!data) {
    return (
      <button
        onClick={load}
        disabled={busy}
        className="w-full rounded-xl bg-primary p-3 font-semibold text-primary-foreground disabled:opacity-50"
      >
        {busy ? 'Loading...' : 'Load reviews'}
      </button>
    )
  }

  return (
    <div className="space-y-3">
      <div className="grid grid-cols-2 gap-2">
        <div className="rounded-xl border p-3">
          <p className="text-2xl font-bold text-amber-500">
            {data.average || '-'} <span className="text-base">/ 5</span>
          </p>
          <p className="text-xs text-muted-foreground">Average rating</p>
        </div>
        <div className="rounded-xl border p-3">
          <p className="text-2xl font-bold">{data.count}</p>
          <p className="text-xs text-muted-foreground">Reviews</p>
        </div>
      </div>

      <div className="divide-y rounded-xl border">
        {(data.reviews || []).map((r: any) => (
          <div key={r.id} className="p-3">
            <div className="flex items-center justify-between">
              <p className="text-sm font-medium">{'*'.repeat(r.rating)}{'-'.repeat(5 - r.rating)} {r.rating}/5</p>
              <p className="text-xs text-muted-foreground">
                {new Date(r.createdAt).toLocaleDateString()}
              </p>
            </div>
            {r.name && <p className="text-xs text-muted-foreground">{r.name}</p>}
            {r.comment && <p className="mt-1 text-sm">{r.comment}</p>}
          </div>
        ))}
        {!(data.reviews || []).length && (
          <p className="p-6 text-center text-sm text-muted-foreground">No reviews yet.</p>
        )}
      </div>
    </div>
  )
}


// -------------------------------------------------------------------- media
function MediaEditor({
  media,
  fallback,
  onChange,
}: {
  media: DishMedia[]
  fallback: string
  onChange: (m: DishMedia[]) => void
}) {
  const rows = [0, 1, 2]

  function setUrl(i: number, url: string) {
    const next = [...media]
    if (!url.trim()) {
      next.splice(i, 1)
    } else if (next[i]) {
      next[i] = { url: url.trim(), type: mediaTypeOf(url) }
    } else {
      next.push({ url: url.trim(), type: mediaTypeOf(url) })
    }
    onChange(next.slice(0, 3))
  }

  return (
    <div className="mt-3 rounded-lg border p-2.5">
      <p className="text-xs font-semibold">Photos and clips</p>
      <p className="mt-0.5 text-[11px] text-muted-foreground">
        Up to 3. Paste image, GIF or MP4 links. Two or more turn the card into a
        slider. Leave all empty and the bundled photo keeps showing.
      </p>

      {rows.map(i => {
        const m = media[i]
        return (
          <div key={i} className="mt-2 flex items-center gap-2">
            <div className="h-10 w-10 shrink-0 overflow-hidden rounded border bg-muted">
              {m ? (
                m.type === 'video' ? (
                  <video src={m.url} muted className="h-full w-full object-cover" />
                ) : (
                  <img src={m.url} alt="" className="h-full w-full object-cover" />
                )
              ) : i === 0 ? (
                <img src={fallback} alt="" className="h-full w-full object-cover opacity-50" />
              ) : null}
            </div>
            <input
              value={m?.url || ''}
              placeholder={i === 0 ? 'https://... (leave empty to keep current photo)' : 'https://...'}
              onChange={e => setUrl(i, e.target.value)}
              className="min-w-0 flex-1 rounded-lg border bg-background p-2 text-xs"
            />
            {m && (
              <span className="shrink-0 rounded bg-muted px-1.5 py-0.5 text-[10px] uppercase text-muted-foreground">
                {m.type}
              </span>
            )}
          </div>
        )
      })}
    </div>
  )
}
