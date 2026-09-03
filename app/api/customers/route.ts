import { list, put } from '@vercel/blob'
import { NextRequest, NextResponse } from 'next/server'

export const dynamic = 'force-dynamic'
const PATH = 'kabab-kitchen/customers.json'

export interface Customer {
  phone: string
  name: string
  address: string
  /** true only if the customer ticked the marketing box themselves */
  marketingConsent: boolean
  firstOrderAt: string
  lastOrderAt: string
  orderCount: number
}

async function readAll(): Promise<Customer[]> {
  try {
    const result = await list({ prefix: PATH })
    if (!result.blobs[0]) return []
    const res = await fetch(result.blobs[0].url, { cache: 'no-store' })
    const data = await res.json()
    return Array.isArray(data) ? data : []
  } catch {
    return []
  }
}

/** Called at checkout. Keeps one row per phone number. */
export async function POST(request: NextRequest) {
  if (!process.env.BLOB_READ_WRITE_TOKEN) {
    return NextResponse.json({ ok: false, error: 'Storage not configured' }, { status: 200 })
  }
  try {
    const body = await request.json()
    const phone = String(body.phone || '').replace(/\D/g, '')
    if (phone.length !== 10) {
      return NextResponse.json({ ok: false, error: 'Invalid phone' }, { status: 400 })
    }

    const now = new Date().toISOString()
    const all = await readAll()
    const i = all.findIndex(c => c.phone === phone)

    if (i >= 0) {
      all[i] = {
        ...all[i],
        name: body.name || all[i].name,
        address: body.address || all[i].address,
        marketingConsent: Boolean(body.marketingConsent),
        lastOrderAt: now,
        orderCount: (all[i].orderCount || 0) + 1,
      }
    } else {
      all.push({
        phone,
        name: body.name || '',
        address: body.address || '',
        marketingConsent: Boolean(body.marketingConsent),
        firstOrderAt: now,
        lastOrderAt: now,
        orderCount: 1,
      })
    }

    await put(PATH, JSON.stringify(all), {
      access: 'public',
      addRandomSuffix: false,
      allowOverwrite: true,
      contentType: 'application/json',
    })
    return NextResponse.json({ ok: true })
  } catch {
    // never block an order because the save failed
    return NextResponse.json({ ok: false }, { status: 200 })
  }
}

/** Admin only. Returns the customer list. */
export async function GET(request: NextRequest) {
  const key = request.headers.get('x-admin-key')
  if (!process.env.ADMIN_SETTINGS_KEY || key !== process.env.ADMIN_SETTINGS_KEY) {
    return NextResponse.json({ error: 'Invalid admin key' }, { status: 401 })
  }
  const all = await readAll()
  return NextResponse.json({
    customers: all.sort((a, b) => b.lastOrderAt.localeCompare(a.lastOrderAt)),
    total: all.length,
    consented: all.filter(c => c.marketingConsent).length,
  })
}
