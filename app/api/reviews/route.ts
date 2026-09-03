import { NextRequest, NextResponse } from 'next/server'
import { requireStaff } from '@/lib/auth'
import { db, dbReady } from '@/lib/db'

export const dynamic = 'force-dynamic'

/** Public: average and recent reviews. */
export async function GET(request: NextRequest) {
  if (!dbReady()) return NextResponse.json({ average: 0, count: 0, reviews: [] })
  try {
    const isAdmin = Boolean(await requireStaff(request))
    const sql = db()
    const agg = (await sql`
      SELECT count(*)::int AS count, coalesce(round(avg(rating), 1), 0) AS average FROM reviews
    `) as any[]
    const rows = isAdmin
      ? ((await sql`SELECT * FROM reviews ORDER BY created_at DESC LIMIT 500`) as any[])
      : ((await sql`SELECT * FROM reviews ORDER BY created_at DESC LIMIT 20`) as any[])

    return NextResponse.json({
      average: Number(agg[0].average),
      count: agg[0].count,
      reviews: rows.map(r => ({
        id: String(r.id),
        rating: r.rating,
        comment: r.comment,
        name: r.name,
        createdAt: r.created_at,
      })),
    })
  } catch {
    return NextResponse.json({ average: 0, count: 0, reviews: [] })
  }
}

/** Public: leave a rating after ordering. */
export async function POST(request: NextRequest) {
  if (!dbReady()) return NextResponse.json({ ok: false, error: 'Not configured' })
  try {
    const body = await request.json()
    const rating = Number(body.rating)
    if (!Number.isInteger(rating) || rating < 1 || rating > 5) {
      return NextResponse.json({ ok: false, error: 'Rating must be 1 to 5' }, { status: 400 })
    }
    const sql = db()
    await sql`
      INSERT INTO reviews (rating, comment, name)
      VALUES (${rating}, ${String(body.comment || '').slice(0, 500)},
              ${String(body.name || '').slice(0, 60)})
    `
    return NextResponse.json({ ok: true })
  } catch {
    return NextResponse.json({ ok: false })
  }
}
