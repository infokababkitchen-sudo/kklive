import { NextResponse } from 'next/server'
import { currentStaff } from '@/lib/auth'
import { dbReady } from '@/lib/db'

export const dynamic = 'force-dynamic'

export async function GET() {
  if (!dbReady()) return NextResponse.json({ staff: null, dbReady: false })
  return NextResponse.json({ staff: await currentStaff(), dbReady: true })
}
