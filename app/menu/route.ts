import { list } from '@vercel/blob'
import { NextResponse } from 'next/server'
import { EMPTY_OVERRIDES } from '@/lib/menu-overrides'

export const dynamic = 'force-dynamic'
export const OVERRIDES_PATH = 'kabab-kitchen/menu-overrides.json'

/** Public. The storefront reads this to get the admin's latest prices. */
export async function GET() {
  try {
    const result = await list({ prefix: OVERRIDES_PATH })
    if (!result.blobs[0]) return NextResponse.json(EMPTY_OVERRIDES)
    const response = await fetch(result.blobs[0].url, { cache: 'no-store' })
    return NextResponse.json(await response.json())
  } catch {
    // blob not configured yet -> storefront just uses menu.json
    return NextResponse.json(EMPTY_OVERRIDES)
  }
}
