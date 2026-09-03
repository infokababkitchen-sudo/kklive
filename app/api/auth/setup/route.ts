import { NextRequest, NextResponse } from 'next/server'
import { db, dbReady } from '@/lib/db'
import { hashPassword } from '@/lib/auth'

export const dynamic = 'force-dynamic'

/**
 * Creates the first owner account. Guarded by ADMIN_SETTINGS_KEY and refuses
 * to run once any staff row exists, so it cannot be used to add accounts later.
 */
export async function POST(request: NextRequest) {
  if (!dbReady()) {
    return NextResponse.json({ error: 'Database is not configured' }, { status: 500 })
  }
  const key = request.headers.get('x-admin-key')
  if (!process.env.ADMIN_SETTINGS_KEY || key !== process.env.ADMIN_SETTINGS_KEY) {
    return NextResponse.json({ error: 'Invalid admin key' }, { status: 401 })
  }

  const { email, name, password } = await request.json()
  if (!email || !password || String(password).length < 8) {
    return NextResponse.json(
      { error: 'Email and a password of at least 8 characters are required' },
      { status: 400 }
    )
  }

  const sql = db()
  const existing = (await sql`SELECT count(*)::int AS n FROM staff`) as any[]
  if (existing[0].n > 0) {
    return NextResponse.json(
      { error: 'An account already exists. Sign in instead.' },
      { status: 409 }
    )
  }

  await sql`
    INSERT INTO staff (email, name, password_hash, role)
    VALUES (${String(email).trim().toLowerCase()}, ${name || 'Owner'},
            ${await hashPassword(String(password))}, 'owner')
  `
  return NextResponse.json({ ok: true })
}
