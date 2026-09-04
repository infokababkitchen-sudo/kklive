import { NextRequest, NextResponse } from 'next/server'
import { db, dbReady } from '@/lib/db'

export const dynamic = 'force-dynamic'

/**
 * Fills the checkout form for a returning customer.
 * Only the name and address they typed themselves come back, and only for an
 * exact 10-digit match, so this cannot be used to browse the customer list.
 */
export async function GET(request: NextRequest) {
  const phone = (new URL(request.url).searchParams.get('phone') || '').replace(/\D/g, '')
  if (phone.length !== 10) return NextResponse.json({ found: false })
  if (!dbReady()) return NextResponse.json({ found: false })
  try {
    const sql = db()
    const rows = (await sql`
      SELECT name, address FROM customers WHERE phone = ${phone} LIMIT 1
    `) as any[]
    if (!rows[0]) return NextResponse.json({ found: false })
    return NextResponse.json({ found: true, name: rows[0].name, address: rows[0].address })
  } catch {
    return NextResponse.json({ found: false })
  }
}
