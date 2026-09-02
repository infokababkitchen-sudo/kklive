"use client"

import { useMemo, useState } from 'react'
import type { DishOverride, MenuOverrides } from '@/lib/menu-overrides'

interface AdminDish {
  id: number
  name: string
  category: string
  isVeg: boolean
  image: string
  price?: number
  halfPrice?: number
  fullPrice?: number
}

interface Category {
  id: string
  name: string
}

export default function AdminSettingsPage() {
  const [key, setKey] = useState('')
  const [unlocked, setUnlocked] = useState(false)
  const [loading, setLoading] = useState(false)
  const [message, setMessage] = useState('')

  const [dishes, setDishes] = useState<AdminDish[]>([])
  const [categories, setCategories] = useState<Category[]>([])
  const [edits, setEdits] = useState<Record<string, DishOverride>>({})

  const [search, setSearch] = useState('')
  const [category, setCategory] = useState('all')
  const [uploadingId, setUploadingId] = useState<number | null>(null)

  async function unlock() {
    setLoading(true)
    setMessage('')
    try {
      const res = await fetch('/api/admin/settings', { headers: { 'x-admin-key': key } })
      if (!res.ok) {
        setMessage('Galat admin key.')
        return
      }
      const data = await res.json()
      setDishes(data.dishes)
      setCategories(data.categories.filter((c: Category) => c.id !== 'all'))
      setEdits((data.overrides as MenuOverrides)?.dishes || {})
      setUnlocked(true)
    } catch {
      setMessage('Load nahi ho paya. Dobara try karo.')
    } finally {
      setLoading(false)
    }
  }

  function setField(id: number, field: keyof DishOverride, value: string | boolean) {
    setEdits(prev => {
      const next = { ...prev[String(id)] }
      if (field === 'available') {
        next.available = value as boolean
      } else if (field === 'image') {
        next.image = value as string
      } else if (value === '') {
        delete next[field]
      } else {
        next[field] = Number(value)
      }
      return { ...prev, [String(id)]: next }
    })
  }

  async function uploadImage(dishId: number, file: File) {
    setUploadingId(dishId)
    setMessage('')
    try {
      const form = new FormData()
      form.append('file', file)
      form.append('dishId', String(dishId))
      const res = await fetch('/api/admin/upload', {
        method: 'POST',
        headers: { 'x-admin-key': key },
        body: form,
      })
      const data = await res.json()
      if (!res.ok) {
        setMessage(data.error || 'Photo upload fail hui.')
        return
      }
      setField(dishId, 'image', data.url)
      setMessage('Photo upload ho gayi. Ab Save dabana mat bhoolna.')
    } catch {
      setMessage('Photo upload fail hui.')
    } finally {
      setUploadingId(null)
    }
  }

  async function save() {
    setLoading(true)
    setMessage('')
    try {
      const res = await fetch('/api/admin/settings', {
        method: 'PUT',
        headers: { 'content-type': 'application/json', 'x-admin-key': key },
        body: JSON.stringify({ dishes: edits }),
      })
      setMessage(res.ok ? 'Saved. Site par 1 minute mein dikh jayega.' : 'Save fail hua.')
    } catch {
      setMessage('Save fail hua.')
    } finally {
      setLoading(false)
    }
  }

  const visible = useMemo(() => {
    return dishes.filter(d => {
      if (category !== 'all' && d.category !== category) return false
      if (search && !d.name.toLowerCase().includes(search.toLowerCase())) return false
      return true
    })
  }, [dishes, search, category])

  const changedCount = Object.values(edits).filter(o => o && Object.keys(o).length > 0).length

  if (!unlocked) {
    return (
      <main className="mx-auto flex min-h-screen max-w-md flex-col justify-center gap-6 p-6">
        <div>
          <p className="text-sm font-semibold text-primary">Kabab Kitchen</p>
          <h1 className="text-3xl font-bold">Store settings</h1>
          <p className="mt-2 text-sm text-muted-foreground">
            Admin key daalo, phir saari dishes ke naam aur price edit kar sakte ho.
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
          disabled={loading || !key}
          className="rounded-xl bg-primary p-3 font-semibold text-primary-foreground disabled:opacity-50"
        >
          {loading ? 'Checking...' : 'Unlock'}
        </button>
        {message && <p role="status" className="text-sm text-red-600">{message}</p>}
      </main>
    )
  }

  return (
    <main className="mx-auto min-h-screen max-w-3xl p-4 pb-28">
      <div className="mb-4">
        <p className="text-sm font-semibold text-primary">Kabab Kitchen</p>
        <h1 className="text-2xl font-bold">Menu manage karo</h1>
        <p className="mt-1 text-sm text-muted-foreground">
          {dishes.length} dishes · {changedCount} mein changes
        </p>
      </div>

      <div className="mb-4 flex flex-col gap-2 sm:flex-row">
        <input
          value={search}
          placeholder="Dish dhoondo..."
          onChange={e => setSearch(e.target.value)}
          className="flex-1 rounded-xl border bg-background p-2.5 text-sm"
        />
        <select
          value={category}
          onChange={e => setCategory(e.target.value)}
          className="rounded-xl border bg-background p-2.5 text-sm"
        >
          <option value="all">Saari categories</option>
          {categories.map(c => (
            <option key={c.id} value={c.id}>{c.name}</option>
          ))}
        </select>
      </div>

      <div className="space-y-2">
        {visible.map(dish => {
          const o = edits[String(dish.id)] || {}
          const hidden = o.available === false
          const hasSplit = dish.halfPrice !== undefined || dish.fullPrice !== undefined
          return (
            <div key={dish.id} className={`rounded-xl border p-3 ${hidden ? 'opacity-50' : ''}`}>
              <div className="flex items-start justify-between gap-3">
                <div className="min-w-0">
                  <p className="font-medium leading-tight">
                    <span className={dish.isVeg ? 'text-green-600' : 'text-red-600'}>●</span>{' '}
                    {dish.name}
                  </p>
                  <p className="text-xs text-muted-foreground">#{dish.id} · {dish.category}</p>
                </div>
                <label className="flex shrink-0 items-center gap-1.5 text-xs">
                  <input
                    type="checkbox"
                    checked={!hidden}
                    onChange={e => setField(dish.id, 'available', e.target.checked)}
                  />
                  Available
                </label>
              </div>

              <div className="mt-3 flex flex-wrap gap-3">
                {hasSplit ? (
                  <>
                    <PriceInput
                      label="Half"
                      original={dish.halfPrice}
                      value={o.halfPrice}
                      onChange={v => setField(dish.id, 'halfPrice', v)}
                    />
                    <PriceInput
                      label="Full"
                      original={dish.fullPrice}
                      value={o.fullPrice}
                      onChange={v => setField(dish.id, 'fullPrice', v)}
                    />
                  </>
                ) : (
                  <PriceInput
                    label="Price"
                    original={dish.price}
                    value={o.price}
                    onChange={v => setField(dish.id, 'price', v)}
                  />
                )}

                <div className="flex flex-col gap-1">
                  <span className="text-xs text-muted-foreground">Photo</span>
                  <label className="cursor-pointer rounded-lg border px-3 py-1.5 text-xs">
                    {uploadingId === dish.id
                      ? 'Uploading...'
                      : o.image
                        ? 'Nayi photo lagi'
                        : 'Upload'}
                    <input
                      type="file"
                      accept="image/*"
                      className="hidden"
                      onChange={e => {
                        const f = e.target.files?.[0]
                        if (f) uploadImage(dish.id, f)
                      }}
                    />
                  </label>
                </div>
              </div>
            </div>
          )
        })}
        {visible.length === 0 && (
          <p className="py-8 text-center text-sm text-muted-foreground">Koi dish nahi mili.</p>
        )}
      </div>

      <div className="fixed inset-x-0 bottom-0 border-t bg-background p-3">
        <div className="mx-auto flex max-w-3xl items-center gap-3">
          {message && <p role="status" className="flex-1 text-xs text-muted-foreground">{message}</p>}
          <button
            onClick={save}
            disabled={loading}
            className="ml-auto rounded-xl bg-primary px-6 py-3 font-semibold text-primary-foreground disabled:opacity-50"
          >
            {loading ? 'Saving...' : `Save changes${changedCount ? ` (${changedCount})` : ''}`}
          </button>
        </div>
      </div>
    </main>
  )
}

function PriceInput({
  label,
  original,
  value,
  onChange,
}: {
  label: string
  original?: number
  value?: number
  onChange: (v: string) => void
}) {
  return (
    <div className="flex flex-col gap-1">
      <span className="text-xs text-muted-foreground">
        {label} {original !== undefined && <span className="opacity-60">(abhi Rs.{original})</span>}
      </span>
      <input
        type="number"
        min="0"
        placeholder={original !== undefined ? String(original) : '-'}
        value={value ?? ''}
        onChange={e => onChange(e.target.value)}
        className="w-28 rounded-lg border bg-background p-2 text-sm"
      />
    </div>
  )
}
