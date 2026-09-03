import { NextResponse } from 'next/server'
import { EMPTY_OVERRIDES } from '@/lib/menu-overrides'
import { readOverrides } from '@/lib/settings'

export const dynamic = 'force-dynamic'

/** Public. The storefront reads this to get the admin's latest prices. */
export async function GET() {
  try {
    return NextResponse.json(await readOverrides())
  } catch {
    return NextResponse.json(EMPTY_OVERRIDES)
  }
}
