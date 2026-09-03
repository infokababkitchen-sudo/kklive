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

/** Staff only. */
export async function GET(request: NextRequest) {
  if (!(await requireStaff(request))) {
    return NextResponse.json({ error: 'Not signed in' }, { status: 401 })
  }
  if (!dbReady()) return NextResponse.json({ error: 'Database is not configured' }, { status: 500 })

  const sql = db()
  const rows = (await sql`
    SELECT phone, name, address, marketing_consent, order_count,
           first_order_at, last_order_at
    FROM customers ORDER BY last_order_at DESC LIMIT 1000
  `) as any[]

  return NextResponse.json({
    customers: rows.map(r => ({
      phone: r.phone,
      name: r.name,
      address: r.address,
      marketingConsent: r.marketing_consent,
      orderCount: r.order_count,
      firstOrderAt: r.first_order_at,
      lastOrderAt: r.last_order_at,
    })),
    total: rows.length,
    consented: rows.filter(r => r.marketing_consent).length,
  })
}
