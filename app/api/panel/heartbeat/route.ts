import { NextRequest, NextResponse } from 'next/server'
import { requireStaff } from '@/lib/auth'
import { db, dbReady } from '@/lib/db'

export const dynamic = 'force-dynamic'

/** The open admin panel pings this every 20 seconds. */
export async function POST(request: NextRequest) {
  if (!(await requireStaff(request))) {
    return NextResponse.json({ error: 'Not signed in' }, { status: 401 })
  }
  if (!dbReady()) return NextResponse.json({ ok: false })
  try {
    const sql = db()
    await sql`
      INSERT INTO settings (key, value)
      VALUES ('panel-heartbeat', ${JSON.stringify({ at: Date.now() })}::jsonb)
      ON CONFLICT (key) DO UPDATE SET value = EXCLUDED.value, updated_at = now()
    `
    return NextResponse.json({ ok: true })
  } catch {
    return NextResponse.json({ ok: false })
  }
}
