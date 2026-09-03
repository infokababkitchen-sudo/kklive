import { NextRequest, NextResponse } from 'next/server'
import { db, dbReady } from '@/lib/db'
import { verifyPassword, createSession, SESSION_COOKIE } from '@/lib/auth'

export const dynamic = 'force-dynamic'

export async function POST(request: NextRequest) {
  if (!dbReady()) {
    return NextResponse.json({ error: 'Database is not configured' }, { status: 500 })
  }
  const { email, password } = await request.json()
  if (!email || !password) {
    return NextResponse.json({ error: 'Email and password required' }, { status: 400 })
  }

  const sql = db()
  const rows = (await sql`
    SELECT id, email, name, role, password_hash FROM staff
    WHERE lower(email) = lower(${String(email).trim()}) LIMIT 1
  `) as any[]

  const staff = rows[0]
  // same message either way, so the form cannot be used to discover emails
  const bad = NextResponse.json({ error: 'Wrong email or password' }, { status: 401 })
  if (!staff) return bad
  if (!(await verifyPassword(String(password), staff.password_hash))) return bad

  const { token, expires } = await createSession(staff.id)
  const res = NextResponse.json({
    ok: true,
    staff: { id: staff.id, email: staff.email, name: staff.name, role: staff.role },
  })
  res.cookies.set(SESSION_COOKIE, token, {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'lax',
    path: '/',
    expires,
  })
  return res
}
