import { NextResponse } from 'next/server'
import { db, dbReady } from '@/lib/db'

export const dynamic = 'force-dynamic'

/** How stale a heartbeat may be before we treat the panel as closed. */
const STALE_MS = 70000

/**
 * Public. Checkout asks this to decide whether WhatsApp is still needed.
 * Nothing but a boolean comes back.
 */
export async function GET() {
  if (!dbReady()) return NextResponse.json({ live: false })
  try {
    const sql = db()
    const rows = (await sql`
      SELECT value, updated_at FROM settings WHERE key = 'panel-heartbeat'
    `) as any[]
    if (!rows[0]) return NextResponse.json({ live: false })
    const age = Date.now() - new Date(rows[0].updated_at).getTime()
    return NextResponse.json({ live: age < STALE_MS })
  } catch {
    // if we cannot tell, assume the panel is closed so WhatsApp still fires
    return NextResponse.json({ live: false })
  }
}
