import { NextRequest, NextResponse } from 'next/server'
import { destroySession, SESSION_COOKIE } from '@/lib/auth'

export const dynamic = 'force-dynamic'

export async function POST(request: NextRequest) {
  const token = request.cookies.get(SESSION_COOKIE)?.value
  if (token) {
    try {
      await destroySession(token)
    } catch {
      // cookie is cleared regardless
    }
  }
  const res = NextResponse.json({ ok: true })
  res.cookies.set(SESSION_COOKIE, '', { path: '/', maxAge: 0 })
  return res
}
