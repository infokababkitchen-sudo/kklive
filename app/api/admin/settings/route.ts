import { list, put } from '@vercel/blob'
import { NextRequest, NextResponse } from 'next/server'

const PATH = 'kabab-kitchen/settings.json'
function authorized(request: NextRequest) {
  const key = request.headers.get('x-admin-key') || request.nextUrl.searchParams.get('key')
  return Boolean(process.env.ADMIN_SETTINGS_KEY && key === process.env.ADMIN_SETTINGS_KEY)
}
export async function GET(request: NextRequest) {
  if (!authorized(request)) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  const result = await list({ prefix: PATH })
  if (!result.blobs[0]) return NextResponse.json({ rates: { multiplier: 1 }, offers: [], availability: {} })
  const response = await fetch(result.blobs[0].url, { cache: 'no-store' })
  return NextResponse.json(await response.json())
}
export async function PUT(request: NextRequest) {
  if (!authorized(request)) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  const body = await request.json()
  const blob = await put(PATH, JSON.stringify(body), { access: 'public', addRandomSuffix: false, contentType: 'application/json' })
  return NextResponse.json({ ok: true, url: blob.url })
}
