import { NextRequest, NextResponse } from 'next/server'
import { requireStaff } from '@/lib/auth'
import { db, dbReady } from '@/lib/db'
import { configured, pushReady } from '@/lib/push'

export const dynamic = 'force-dynamic'
export const maxDuration = 60

/** Sends one message to everyone subscribed. Dead subscriptions are removed. */
export async function POST(request: NextRequest) {
  if (!(await requireStaff(request))) {
    return NextResponse.json({ error: 'Not signed in' }, { status: 401 })
  }
  if (!dbReady()) return NextResponse.json({ error: 'Database not configured' }, { status: 500 })
  if (!pushReady()) {
    return NextResponse.json(
      { error: 'VAPID keys are not set. See SETUP-PUSH.md.' },
      { status: 500 }
    )
  }

  const { title, body, url } = await request.json()
  if (!title) return NextResponse.json({ error: 'Title required' }, { status: 400 })

  const webpush = configured()!
  const sql = db()
  const subs = (await sql`SELECT endpoint, p256dh, auth FROM push_subscriptions`) as any[]

  let sent = 0
  const dead: string[] = []
  const payload = JSON.stringify({ title, body: body || '', url: url || '/' })

  for (const s of subs) {
    try {
      await webpush.sendNotification(
        { endpoint: s.endpoint, keys: { p256dh: s.p256dh, auth: s.auth } },
        payload
      )
      sent++
    } catch (e: any) {
      // 404 or 410 means the browser dropped it for good
      if (e?.statusCode === 404 || e?.statusCode === 410) dead.push(s.endpoint)
    }
  }

  if (dead.length) {
    await sql`DELETE FROM push_subscriptions WHERE endpoint = ANY(${dead})`
  }

  return NextResponse.json({ ok: true, sent, removed: dead.length, total: subs.length })
}

/** How many people can be reached. */
export async function GET(request: NextRequest) {
  if (!(await requireStaff(request))) {
    return NextResponse.json({ error: 'Not signed in' }, { status: 401 })
  }
  if (!dbReady()) return NextResponse.json({ subscribers: 0, ready: false })
  const sql = db()
  const rows = (await sql`SELECT count(*)::int AS n FROM push_subscriptions`) as any[]
  return NextResponse.json({ subscribers: rows[0].n, ready: pushReady() })
}
