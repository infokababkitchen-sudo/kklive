import { NextResponse } from 'next/server'

export const dynamic = 'force-dynamic'

/** Public key only. The private key never leaves the server. */
export async function GET() {
  return NextResponse.json({ key: process.env.VAPID_PUBLIC_KEY || null })
}
