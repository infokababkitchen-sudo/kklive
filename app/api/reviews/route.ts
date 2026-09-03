import { list, put } from '@vercel/blob'
import { NextRequest, NextResponse } from 'next/server'
import { requireStaff } from '@/lib/auth'

export const dynamic = 'force-dynamic'
const PATH = 'kabab-kitchen/reviews.json'

export interface Review {
  id: string
  rating: number
  comment: string
  name: string
  createdAt: string
}

async function readAll(): Promise<Review[]> {
  try {
    const result = await list({ prefix: PATH })
    if (!result.blobs[0]) return []
    const res = await fetch(result.blobs[0].url, { cache: 'no-store' })
    const data = await res.json()
    return Array.isArray(data) ? data : []
  } catch {
    return []
  }
}

/** Public: average and recent reviews for the storefront. */
export async function GET(request: NextRequest) {
  const all = await readAll()
  const isAdmin = Boolean(await requireStaff(request))

  const count = all.length
  const average = count ? Math.round((all.reduce((s, r) => s + r.rating, 0) / count) * 10) / 10 : 0

  return NextResponse.json({
    average,
    count,
    reviews: all
      .slice()
      .sort((a, b) => b.createdAt.localeCompare(a.createdAt))
      .slice(0, isAdmin ? 500 : 20),
  })
}

/** Public: leave a rating after ordering. */
export async function POST(request: NextRequest) {
  if (!process.env.BLOB_READ_WRITE_TOKEN) {
    return NextResponse.json({ ok: false, error: 'Storage not configured' }, { status: 200 })
  }
  try {
    const body = await request.json()
    const rating = Number(body.rating)
    if (!Number.isInteger(rating) || rating < 1 || rating > 5) {
      return NextResponse.json({ ok: false, error: 'Rating must be 1 to 5' }, { status: 400 })
    }

    const review: Review = {
      id: Date.now().toString(36) + Math.random().toString(36).slice(2, 7),
      rating,
      comment: String(body.comment || '').slice(0, 500),
      name: String(body.name || '').slice(0, 60),
      createdAt: new Date().toISOString(),
    }

    const all = await readAll()
    all.push(review)

    await put(PATH, JSON.stringify(all), {
      access: 'public',
      addRandomSuffix: false,
      allowOverwrite: true,
      contentType: 'application/json',
    })
    return NextResponse.json({ ok: true })
  } catch {
    return NextResponse.json({ ok: false }, { status: 200 })
  }
}
