import { NextRequest, NextResponse } from 'next/server'
import { requireStaff } from '@/lib/auth'
import { db, dbReady } from '@/lib/db'

export const dynamic = 'force-dynamic'

/** Called at checkout. One row per phone number. */
export async function POST(request: NextRequest) {
  if (!dbReady()) return NextResponse.json({ ok: false, reason: 'no-db' })
  try {
    const body = await request.json()
    const phone = String(body.phone || '').replace(/\D/g, '')
    if (phone.length !== 10) {
      return NextResponse.json({ ok: false, error: 'Invalid phone' }, { status: 400 })
    }
    const sql = db()
    // atomic upsert: two orders in the same second cannot overwrite each other
    await sql`
      INSERT INTO customers (phone, name, address, marketing_consent, order_count)
      VALUES (${phone}, ${body.name || ''}, ${body.address || ''},
              ${Boolean(body.marketingConsent)}, 1)
      ON CONFLICT (phone) DO UPDATE SET
        name              = COALESCE(NULLIF(EXCLUDED.name, ''), customers.name),
        address           = COALESCE(NULLIF(EXCLUDED.address, ''), customers.address),
        marketing_consent = EXCLUDED.marketing_consent,
        order_count       = customers.order_count + 1,
        last_order_at     = now()
    `
    return NextResponse.json({ ok: true })
  } catch {
    // never block an order because the save failed
    return NextResponse.json({ ok: false })
  }
}

/** Staff only. Customers with their real order history, best spender first. */
export async function GET(request: NextRequest) {
  if (!(await requireStaff(request))) {
    return NextResponse.json({ error: 'Not signed in' }, { status: 401 })
  }
  if (!dbReady()) return NextResponse.json({ error: 'Database is not configured' }, { status: 500 })

  const sql = db()
  const rows = (await sql`
    SELECT c.phone, c.name, c.address, c.marketing_consent,
           c.first_order_at, c.last_order_at,
           count(o.id) FILTER (WHERE o.status <> 'cancelled')::int      AS orders,
           coalesce(sum(o.total) FILTER (WHERE o.status <> 'cancelled'), 0)::int AS spent,
           max(o.created_at) AS last_seen
    FROM customers c
    LEFT JOIN orders o ON o.phone = c.phone
    GROUP BY c.phone, c.name, c.address, c.marketing_consent,
             c.first_order_at, c.last_order_at
    ORDER BY spent DESC, c.last_order_at DESC
    LIMIT 500
  `) as any[]

  const totals = (await sql`
    SELECT count(*)::int AS total,
           count(*) FILTER (WHERE marketing_consent)::int AS consented,
           count(*) FILTER (WHERE order_count > 1)::int   AS repeat
    FROM customers
  `) as any[]

  return NextResponse.json({
    customers: rows.map(r => ({
      phone: r.phone,
      name: r.name,
      address: r.address,
      marketingConsent: r.marketing_consent,
      orderCount: r.orders,
      spent: r.spent,
      firstOrderAt: r.first_order_at,
      lastOrderAt: r.last_seen || r.last_order_at,
    })),
    total: totals[0].total,
    consented: totals[0].consented,
    repeat: totals[0].repeat,
  })
}
