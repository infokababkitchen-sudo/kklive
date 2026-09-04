import { NextRequest, NextResponse } from 'next/server'
import { db, dbReady } from '@/lib/db'

export const dynamic = 'force-dynamic'

/** Stores a browser's push subscription. Re-subscribing updates the same row. */
export async function POST(request: NextRequest) {
  if (!dbReady()) return NextResponse.json({ ok: false })
  try {
    const sub = await request.json()
    const endpoint = sub?.endpoint
    const p256dh = sub?.keys?.p256dh
    const auth = sub?.keys?.auth
    if (!endpoint || !p256dh || !auth) {
      return NextResponse.json({ ok: false, error: 'Incomplete subscription' }, { status: 400 })
    }
    const sql = db()
    await sql`
      INSERT INTO push_subscriptions (endpoint, p256dh, auth, phone)
      VALUES (${endpoint}, ${p256dh}, ${auth}, ${sub.phone || null})
      ON CONFLICT (endpoint) DO UPDATE SET p256dh = EXCLUDED.p256dh, auth = EXCLUDED.auth
    `
    return NextResponse.json({ ok: true })
  } catch {
    return NextResponse.json({ ok: false })
  }
}
