"use client"

import { useMemo, useState } from 'react'
import type { Dish, Category } from '@/types/menu'
import type { DishOverride, MenuOverrides, Variant, VariantKey } from '@/lib/menu-overrides'

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

type Tab = 'stock' | 'dishes' | 'variants' | 'new'

export default function AdminDashboard() {
  const [key, setKey] = useState('')
  const [unlocked, setUnlocked] = useState(false)
  const [busy, setBusy] = useState(false)
  const [msg, setMsg] = useState('')

  const [tab, setTab] = useState<Tab>('stock')
  const [dishes, setDishes] = useState<Dish[]>([])
  const [categories, setCategories] = useState<Category[]>([])
  const [duplicates, setDuplicates] = useState<DuplicateGroup[]>([])
  const [edits, setEdits] = useState<Record<string, DishOverride>>({})
  const [newDishes, setNewDishes] = useState<Dish[]>([])

  const [search, setSearch] = useState('')
  const [cat, setCat] = useState('all')
  const [uploading, setUploading] = useState<number | null>(null)

  async function unlock() {
    setBusy(true)
    setMsg('')
    try {
      const res = await fetch('/api/admin/settings', { headers: { 'x-admin-key': key } })
      if (!res.ok) {
        setMsg('Galat admin key.')
        return
      }
      const d = await res.json()
      setDishes(d.dishes)
      setCategories(d.categories.filter((c: Category) => c.id !== 'all'))
      setDuplicates(d.duplicates || [])
      const o = d.overrides as MenuOverrides
      setEdits(o?.dishes || {})
      setNewDishes(o?.newDishes || [])
      setUnlocked(true)
    } catch {
      setMsg('Load nahi ho paya.')
    } finally {
      setBusy(false)
    }
  }

  async function save(next?: {
    edits?: Record<string, DishOverride>
    newDishes?: Dish[]
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
        }),
      })
      setMsg(res.ok ? 'Saved. Site par turant dikh jayega.' : 'Save fail hua.')
    } catch {
      setMsg('Save fail hua.')
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
        setMsg(d.error || 'Photo upload fail hui.')
        return
      }
      patch(id, { image: d.url })
      setMsg('Photo lag gayi. Save dabana mat bhoolna.')
    } catch {
      setMsg('Photo upload fail hui.')
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

  // ------------------------------------------------------------ locked
  if (!unlocked) {
    return (
      <main className="mx-auto flex min-h-screen max-w-md flex-col justify-center gap-6 p-6">
        <div>
          <p className="text-sm font-semibold text-primary">Kabab Kitchen</p>
          <h1 className="text-3xl font-bold">Admin dashboard</h1>
          <p className="mt-2 text-sm text-muted-foreground">
            Key daalo. Phir prices, stock, variants aur photos sab yahin se manage kar sakte ho.
          </p>
        </div>
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
          {allDishes.length} dishes · {changed} mein changes
        </p>
      </div>

      <div className="mb-4 flex gap-1 border-b">
        {(
          [
            ['stock', 'Stock'],
            ['dishes', 'Dishes'],
            ['variants', `Variants (${duplicates.length})`],
            ['new', 'Nayi dish'],
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
              placeholder="Dish dhoondo..."
              onChange={e => setSearch(e.target.value)}
              className="flex-1 rounded-xl border bg-background p-2.5 text-sm"
            />
            <select
              value={cat}
              onChange={e => setCat(e.target.value)}
              className="rounded-xl border bg-background p-2.5 text-sm"
            >
              <option value="all">Saari categories</option>
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
                        Menu se hatao
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
                      {uploading === dish.id ? 'Uploading...' : o.image ? 'Photo lagi' : 'Photo'}
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
                </div>
              )
            })}
            {!visible.length && (
              <p className="py-8 text-center text-sm text-muted-foreground">Koi dish nahi mili.</p>
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
          placeholder="Dish dhoondo..."
          className="flex-1 rounded-xl border bg-background p-2.5 text-sm"
        />
        <button
          onClick={() => onAll(true)}
          disabled={busy}
          className="rounded-xl border px-3 text-xs font-medium disabled:opacity-50"
        >
          Sab on
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
          <p className="p-6 text-center text-sm text-muted-foreground">Koi dish nahi mili.</p>
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
    return <p className="py-8 text-center text-sm text-muted-foreground">Koi duplicate nahi mila.</p>
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
                    <option value="">Ye kaunsa hai?</option>
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

  function add() {
    if (!name || !price || !category) return
    setNewDishes(prev => {
      const id = Math.max(999, ...prev.map(d => d.id)) + 1
      const dish: Dish = {
        id,
        name,
        category,
        isVeg,
        price: Number(price),
        description: desc || name,
        calories: 0,
        spiceLevel: 'medium',
        rating: 4.5,
        reviews: 0,
        isPopular: false,
        isNew: true,
        image: '/images/placeholder-dish.jpg',
      }
      return [...prev, dish]
    })
    setName('')
    setPrice('')
    setDesc('')
  }

  return (
    <div className="space-y-4">
      <div className="space-y-2 rounded-xl border p-3">
        <input
          value={name}
          onChange={e => setName(e.target.value)}
          placeholder="Dish ka naam"
          className="w-full rounded-lg border bg-background p-2.5 text-sm"
        />
        <div className="flex gap-2">
          <input
            value={price}
            onChange={e => setPrice(e.target.value)}
            type="number"
            placeholder="Price"
            className="w-32 rounded-lg border bg-background p-2.5 text-sm"
          />
          <select
            value={category}
            onChange={e => setCategory(e.target.value)}
            className="flex-1 rounded-lg border bg-background p-2.5 text-sm"
          >
            {categories.map(c => (
              <option key={c.id} value={c.id}>
                {c.name}
              </option>
            ))}
          </select>
        </div>
        <input
          value={desc}
          onChange={e => setDesc(e.target.value)}
          placeholder="Description (optional)"
          className="w-full rounded-lg border bg-background p-2.5 text-sm"
        />
        <label className="flex items-center gap-2 text-sm">
          <input type="checkbox" checked={isVeg} onChange={e => setIsVeg(e.target.checked)} />
          Veg
        </label>
        <button
          onClick={add}
          disabled={!name || !price}
          className="w-full rounded-lg bg-primary p-2.5 text-sm font-semibold text-primary-foreground disabled:opacity-50"
        >
          Add dish
        </button>
        <p className="text-xs text-muted-foreground">
          Add karne ke baad neeche &quot;Save changes&quot; dabana zaroori hai. Photo Dishes tab se
          lagana.
        </p>
      </div>

      {newDishes.length > 0 && (
        <div>
          <p className="mb-2 text-sm font-medium">Aapki added dishes</p>
          <div className="space-y-2">
            {newDishes.map(d => (
              <div key={d.id} className="flex items-center justify-between rounded-xl border p-3">
                <div>
                  <p className="text-sm font-medium">{d.name}</p>
                  <p className="text-xs text-muted-foreground">
                    #{d.id} · {d.category} · Rs.{d.price}
                  </p>
                </div>
                <button
                  onClick={() => onRemove(d.id)}
                  className="text-xs text-red-600"
                >
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
