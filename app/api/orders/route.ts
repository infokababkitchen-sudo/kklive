import { NextRequest, NextResponse } from 'next/server'
import { db, dbReady } from '@/lib/db'
import { requireStaff } from '@/lib/auth'

export const dynamic = 'force-dynamic'

/** Placed by a customer at checkout. Public on purpose. */
export async function POST(request: NextRequest) {
  if (!dbReady()) {
    // panel is optional; never block an order because the database is off
    return NextResponse.json({ ok: false, reason: 'no-db' })
  }
  try {
    const b = await request.json()
    const code = 'KK-' + Math.floor(1000 + Math.random() * 9000) + '-' +
      Date.now().toString(36).slice(-3).toUpperCase()

    const sql = db()
    const rows = (await sql`
      INSERT INTO orders (code, customer_name, phone, address, payment_method,
                          coupon_code, subtotal, discount, tax, delivery_fee, total, free_item)
      VALUES (${code}, ${b.name || ''}, ${String(b.phone || '')}, ${b.address || ''},
              ${b.paymentMethod || 'cod'}, ${b.couponCode || null},
              ${b.subtotal || 0}, ${b.discount || 0}, ${b.tax || 0},
              ${b.deliveryFee || 0}, ${b.total || 0}, ${b.freeItem || null})
      RETURNING id, code
    `) as any[]

    const orderId = rows[0].id
    for (const it of b.items || []) {
      await sql`
        INSERT INTO order_items (order_id, dish_id, name, variant, quantity,
                                 unit_price, addons, cooking_request)
        VALUES (${orderId}, ${it.id || null}, ${it.name}, ${it.size || null},
                ${it.quantity || 1}, ${it.price || 0},
                ${JSON.stringify(it.addOns || [])}::jsonb, ${it.cookingRequest || null})
      `
    }
    return NextResponse.json({ ok: true, code: rows[0].code })
  } catch (e) {
    return NextResponse.json({ ok: false, reason: 'error' })
  }
}

/** Staff list. ?scope=live for the kitchen queue, ?date=YYYY-MM-DD for history. */
export async function GET(request: NextRequest) {
  if (!dbReady()) return NextResponse.json({ error: 'Database is not configured' }, { status: 500 })
  if (!(await requireStaff(request))) {
    return NextResponse.json({ error: 'Not signed in' }, { status: 401 })
  }

  const url = new URL(request.url)
  const scope = url.searchParams.get('scope') || 'live'
  const date = url.searchParams.get('date')
  const sql = db()

  const orders = (
    date
      ? await sql`
          SELECT * FROM orders
          WHERE created_at >= ${date}::date AND created_at < (${date}::date + interval '1 day')
          ORDER BY created_at DESC LIMIT 200
        `
      : scope === 'all'
        ? await sql`SELECT * FROM orders ORDER BY created_at DESC LIMIT 100`
        : await sql`
            SELECT * FROM orders
            WHERE status NOT IN ('delivered', 'cancelled')
               OR created_at >= now() - interval '6 hours'
            ORDER BY created_at DESC LIMIT 100
          `
  ) as any[]

  const ids = orders.map(o => o.id)
  const items = ids.length
    ? ((await sql`SELECT * FROM order_items WHERE order_id = ANY(${ids})`) as any[])
    : []

  const stats = (await sql`
    SELECT count(*)::int AS orders,
           coalesce(sum(total), 0)::int AS sales
    FROM orders
    WHERE created_at >= date_trunc('day', now()) AND status <> 'cancelled'
  `) as any[]

  return NextResponse.json({
    orders: orders.map(o => ({ ...o, items: items.filter(i => i.order_id === o.id) })),
    today: stats[0],
  })
}
