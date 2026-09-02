import { list, put } from '@vercel/blob'
import { NextRequest, NextResponse } from 'next/server'
import { baseMenu, EMPTY_OVERRIDES, MenuOverrides } from '@/lib/menu-overrides'

export const dynamic = 'force-dynamic'
const PATH = 'kabab-kitchen/menu-overrides.json'

function authorized(request: NextRequest) {
  const key = request.headers.get('x-admin-key')
  return Boolean(process.env.ADMIN_SETTINGS_KEY && key === process.env.ADMIN_SETTINGS_KEY)
}

async function readOverrides(): Promise<MenuOverrides> {
  try {
    const result = await list({ prefix: PATH })
    if (!result.blobs[0]) return EMPTY_OVERRIDES
    const response = await fetch(result.blobs[0].url, { cache: 'no-store' })
    return await response.json()
  } catch {
    return EMPTY_OVERRIDES
  }
}

/** Returns every dish plus whatever the admin has already changed. */
export async function GET(request: NextRequest) {
  if (!authorized(request)) {
    return NextResponse.json({ error: 'Invalid admin key' }, { status: 401 })
  }
  const overrides = await readOverrides()
  return NextResponse.json({
    dishes: baseMenu.dishes.map(d => ({
      id: d.id,
      name: d.name,
      category: d.category,
      isVeg: d.isVeg,
      image: d.image,
      price: d.price,
      halfPrice: d.halfPrice,
      fullPrice: d.fullPrice,
    })),
    categories: baseMenu.categories,
    overrides,
  })
}

/** Saves the admin's edits. */
export async function PUT(request: NextRequest) {
  if (!authorized(request)) {
    return NextResponse.json({ error: 'Invalid admin key' }, { status: 401 })
  }
  const body = (await request.json()) as MenuOverrides
  const payload: MenuOverrides = {
    updatedAt: new Date().toISOString(),
    dishes: body.dishes || {},
  }
  const blob = await put(PATH, JSON.stringify(payload), {
    access: 'public',
    addRandomSuffix: false,
    allowOverwrite: true,
    contentType: 'application/json',
  })
  return NextResponse.json({ ok: true, url: blob.url, updatedAt: payload.updatedAt })
}
