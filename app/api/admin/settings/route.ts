import { NextRequest, NextResponse } from 'next/server'
import { requireStaff } from '@/lib/auth'
import { dbReady } from '@/lib/db'
import { baseMenu, MenuOverrides, findDuplicatePairs } from '@/lib/menu-overrides'
import { readOverrides, writeOverrides } from '@/lib/settings'

export const dynamic = 'force-dynamic'

/** Full menu, saved changes, duplicate pairs and config health. */
export async function GET(request: NextRequest) {
  if (!(await requireStaff(request))) {
    return NextResponse.json({ error: 'Not signed in' }, { status: 401 })
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
      dbConfigured: dbReady(),
      // photo uploads still need Blob; links pasted in the admin do not
      blobConfigured: Boolean(process.env.BLOB_READ_WRITE_TOKEN),
    },
  })
}

/** Saves changes to Postgres. */
export async function PUT(request: NextRequest) {
  if (!(await requireStaff(request))) {
    return NextResponse.json({ error: 'Not signed in' }, { status: 401 })
  }
  if (!dbReady()) {
    return NextResponse.json({ error: 'Database is not configured' }, { status: 500 })
  }
  const body = (await request.json()) as MenuOverrides
  const payload: MenuOverrides = {
    updatedAt: new Date().toISOString(),
    dishes: body.dishes || {},
    newDishes: body.newDishes || [],
    restaurantInfo: body.restaurantInfo || {},
    banners: body.banners || [],
    delivery: body.delivery || {},
    panelOrders: body.panelOrders === true,
  }
  try {
    await writeOverrides(payload)
    return NextResponse.json({ ok: true, updatedAt: payload.updatedAt })
  } catch (e) {
    return NextResponse.json(
      { error: e instanceof Error ? e.message : 'Save failed' },
      { status: 500 }
    )
  }
}
