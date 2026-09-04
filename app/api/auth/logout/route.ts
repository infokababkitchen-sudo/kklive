import { NextRequest, NextResponse } from 'next/server'
import { destroySession, SESSION_COOKIE } from '@/lib/auth'
import { db, dbReady } from '@/lib/db'

export const dynamic = 'force-dynamic'

export async function POST(request: NextRequest) {
  const token = request.cookies.get(SESSION_COOKIE)?.value
  if (token) {
    try {
      await destroySession(token)
    } catch {
      // cookie is cleared regardless
    }
  }
  // Clear the heartbeat at once, so checkout falls back to WhatsApp
  // immediately instead of waiting for it to go stale.
  if (dbReady()) {
    try {
      const sql = db()
      await sql`DELETE FROM settings WHERE key = 'panel-heartbeat'`
    } catch {
      /* it will go stale on its own within a minute */
    }
  }

  const res = NextResponse.json({ ok: true })
  res.cookies.set(SESSION_COOKIE, '', { path: '/', maxAge: 0 })
  return res
}
