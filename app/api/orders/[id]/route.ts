import { NextRequest, NextResponse } from 'next/server'
import { db, dbReady } from '@/lib/db'
import { requireStaff } from '@/lib/auth'

export const dynamic = 'force-dynamic'

const ALLOWED = ['new', 'accepted', 'preparing', 'out', 'delivered', 'cancelled']

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  if (!dbReady()) return NextResponse.json({ error: 'Database is not configured' }, { status: 500 })
  if (!(await requireStaff(request))) {
    return NextResponse.json({ error: 'Not signed in' }, { status: 401 })
  }

  const { id } = await params
  const { status } = await request.json()
  if (!ALLOWED.includes(status)) {
    return NextResponse.json({ error: 'Unknown status' }, { status: 400 })
  }

  const sql = db()
  const rows = (await sql`
    UPDATE orders SET
      status = ${status},
      accepted_at = CASE WHEN ${status} = 'accepted' AND accepted_at IS NULL
                         THEN now() ELSE accepted_at END,
      closed_at   = CASE WHEN ${status} IN ('delivered', 'cancelled')
                         THEN now() ELSE closed_at END
    WHERE id = ${Number(id)}
    RETURNING id, code, status
  `) as any[]

  if (!rows[0]) return NextResponse.json({ error: 'Order not found' }, { status: 404 })
  return NextResponse.json({ ok: true, order: rows[0] })
}
