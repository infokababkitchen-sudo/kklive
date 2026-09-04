import { NextRequest, NextResponse } from 'next/server'
import { requireStaff } from '@/lib/auth'
import { db, dbReady } from '@/lib/db'

export const dynamic = 'force-dynamic'

/** Public: the active announcement shown at the top of the menu. */
export async function GET() {
  if (!dbReady()) return NextResponse.json({ announcement: null })
  try {
    const sql = db()
    const rows = (await sql`
      SELECT id, title, body FROM announcements
      WHERE active = true ORDER BY created_at DESC LIMIT 1
    `) as any[]
    return NextResponse.json({ announcement: rows[0] || null })
  } catch {
    return NextResponse.json({ announcement: null })
  }
}

/** Staff: post one. Anything older stops showing. */
export async function POST(request: NextRequest) {
  if (!(await requireStaff(request))) {
    return NextResponse.json({ error: 'Not signed in' }, { status: 401 })
  }
  if (!dbReady()) return NextResponse.json({ error: 'Database not configured' }, { status: 500 })

  const { title, body } = await request.json()
  if (!title) return NextResponse.json({ error: 'Title required' }, { status: 400 })

  const sql = db()
  await sql`UPDATE announcements SET active = false WHERE active = true`
  const rows = (await sql`
    INSERT INTO announcements (title, body) VALUES (${title}, ${body || ''})
    RETURNING id, title, body, created_at
  `) as any[]
  return NextResponse.json({ ok: true, announcement: rows[0] })
}

/** Staff: take the current one down. */
export async function DELETE(request: NextRequest) {
  if (!(await requireStaff(request))) {
    return NextResponse.json({ error: 'Not signed in' }, { status: 401 })
  }
  if (!dbReady()) return NextResponse.json({ error: 'Database not configured' }, { status: 500 })
  const sql = db()
  await sql`UPDATE announcements SET active = false WHERE active = true`
  return NextResponse.json({ ok: true })
}
