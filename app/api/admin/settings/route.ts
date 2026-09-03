import { list, put } from '@vercel/blob'
import { NextRequest, NextResponse } from 'next/server'
import { baseMenu, EMPTY_OVERRIDES, MenuOverrides, findDuplicatePairs } from '@/lib/menu-overrides'

export const dynamic = 'force-dynamic'
const PATH = 'kabab-kitchen/menu-overrides.json'

function authorized(request: NextRequest) {
  const key = request.headers.get('x-admin-key')
  return Boolean(process.env.ADMIN_SETTINGS_KEY && key === process.env.ADMIN_SETTINGS_KEY)
}

let blobReadable = false

async function readOverrides(): Promise<MenuOverrides> {
  try {
    const result = await list({ prefix: PATH })
    blobReadable = true
    if (!result.blobs[0]) return EMPTY_OVERRIDES
    const response = await fetch(result.blobs[0].url, { cache: 'no-store' })
    return await response.json()
  } catch {
    blobReadable = false
    return EMPTY_OVERRIDES
  }
}

/** Poora menu + admin ke ab tak ke changes + duplicate pairs. */
export async function GET(request: NextRequest) {
  if (!authorized(request)) {
    return NextResponse.json({ error: 'Invalid admin key' }, { status: 401 })
  }
  const overrides = await readOverrides()
  const duplicates = findDuplicatePairs(baseMenu.dishes).map(group => ({
    name: group[0].name,
    category: group[0].category,
    ids: group.map(d => ({ id: d.id, price: d.price ?? null })),
  }))
  return NextResponse.json({
    dishes: baseMenu.dishes,
    categories: baseMenu.categories,
    restaurantInfo: baseMenu.restaurantInfo,
    overrides,
    duplicates,
    health: {
      blobConfigured: Boolean(process.env.BLOB_READ_WRITE_TOKEN),
      blobReadable,
    },
  })
}

/** Admin ke changes save karta hai. */
export async function PUT(request: NextRequest) {
  if (!authorized(request)) {
    return NextResponse.json({ error: 'Invalid admin key' }, { status: 401 })
  }
  if (!process.env.BLOB_READ_WRITE_TOKEN) {
    return NextResponse.json(
      { error: 'BLOB_READ_WRITE_TOKEN is not set, so changes cannot be saved.' },
      { status: 500 }
    )
  }

  const body = (await request.json()) as MenuOverrides
  const payload: MenuOverrides = {
    updatedAt: new Date().toISOString(),
    dishes: body.dishes || {},
    newDishes: body.newDishes || [],
    restaurantInfo: body.restaurantInfo || {},
  }

  try {
    const blob = await put(PATH, JSON.stringify(payload), {
      access: 'public',
      addRandomSuffix: false,
      allowOverwrite: true,
      contentType: 'application/json',
    })
    return NextResponse.json({ ok: true, url: blob.url, updatedAt: payload.updatedAt })
  } catch (e) {
    return NextResponse.json(
      { error: e instanceof Error ? e.message : 'Blob write failed' },
      { status: 500 }
    )
  }
}
