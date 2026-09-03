import { NextRequest, NextResponse } from 'next/server'
import { db, dbReady } from '@/lib/db'

export const dynamic = 'force-dynamic'

/**
 * Public order tracking. Only the order code opens it, and only the few
 * fields a customer needs come back, so nothing else leaks.
 */
export async function GET(request: NextRequest) {
  const code = new URL(request.url).searchParams.get('code')
  if (!code) return NextResponse.json({ error: 'No code' }, { status: 400 })
  if (!dbReady()) return NextResponse.json({ error: 'Not available' }, { status: 503 })

  const sql = db()
  const rows = (await sql`
    SELECT code, status, total, created_at, accepted_at, closed_at
    FROM orders WHERE code = ${code} LIMIT 1
  `) as any[]

  if (!rows[0]) return NextResponse.json({ error: 'Order not found' }, { status: 404 })
  return NextResponse.json({ order: rows[0] })
}

/**
 * Lets the customer confirm they received it. Deliberately narrow: only
 * 'out' can become 'delivered', so this cannot be used to change anything else.
 */
export async function PATCH(request: NextRequest) {
  if (!dbReady()) return NextResponse.json({ error: 'Not available' }, { status: 503 })
  const { code } = await request.json()
  if (!code) return NextResponse.json({ error: 'No code' }, { status: 400 })

  const sql = db()
  const rows = (await sql`
    UPDATE orders SET status = 'delivered', closed_at = now()
    WHERE code = ${code} AND status = 'out'
    RETURNING code, status
  `) as any[]

  if (!rows[0]) {
    return NextResponse.json({ error: 'Cannot confirm this order yet' }, { status: 409 })
  }
  return NextResponse.json({ ok: true, order: rows[0] })
}
