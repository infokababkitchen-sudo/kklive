import { randomBytes, scrypt as _scrypt, timingSafeEqual, createHash } from 'crypto'
import { promisify } from 'util'
import { cookies } from 'next/headers'
import { db } from '@/lib/db'

const scrypt = promisify(_scrypt) as (
  p: string,
  s: Buffer,
  k: number
) => Promise<Buffer>

export const SESSION_COOKIE = 'kk_session'
const SESSION_DAYS = 14

/** scrypt with a per-password salt. Stored as salt:hash. */
export async function hashPassword(password: string) {
  const salt = randomBytes(16)
  const key = await scrypt(password, salt, 64)
  return salt.toString('hex') + ':' + key.toString('hex')
}

export async function verifyPassword(password: string, stored: string) {
  const [saltHex, keyHex] = stored.split(':')
  if (!saltHex || !keyHex) return false
  const key = await scrypt(password, Buffer.from(saltHex, 'hex'), 64)
  const expected = Buffer.from(keyHex, 'hex')
  // constant time, and length-guarded so timingSafeEqual cannot throw
  return key.length === expected.length && timingSafeEqual(key, expected)
}

/** Only the hash goes in the database, so a dump cannot be replayed. */
export function hashToken(token: string) {
  return createHash('sha256').update(token).digest('hex')
}

export async function createSession(staffId: number) {
  const token = randomBytes(32).toString('hex')
  const expires = new Date(Date.now() + SESSION_DAYS * 864e5)
  const sql = db()
  await sql`
    INSERT INTO sessions (token_hash, staff_id, expires_at)
    VALUES (${hashToken(token)}, ${staffId}, ${expires.toISOString()})
  `
  return { token, expires }
}

export interface Staff {
  id: number
  email: string
  name: string
  role: string
}

/** Reads the session cookie and returns the signed-in staff member. */
export async function currentStaff(): Promise<Staff | null> {
  try {
    const jar = await cookies()
    const token = jar.get(SESSION_COOKIE)?.value
    if (!token) return null
    const sql = db()
    const rows = (await sql`
      SELECT s.id, s.email, s.name, s.role
      FROM sessions ses
      JOIN staff s ON s.id = ses.staff_id
      WHERE ses.token_hash = ${hashToken(token)}
        AND ses.expires_at > now()
      LIMIT 1
    `) as unknown as Staff[]
    return rows[0] || null
  } catch {
    return null
  }
}

export async function destroySession(token: string) {
  const sql = db()
  await sql`DELETE FROM sessions WHERE token_hash = ${hashToken(token)}`
}

/**
 * Staff access for API routes. A valid session works; so does the old
 * ADMIN_SETTINGS_KEY header, so nobody is locked out mid-migration.
 */
export async function requireStaff(request: Request): Promise<Staff | null> {
  const key = request.headers.get('x-admin-key')
  if (process.env.ADMIN_SETTINGS_KEY && key === process.env.ADMIN_SETTINGS_KEY) {
    return { id: 0, email: 'admin-key', name: 'Admin key', role: 'owner' }
  }
  return currentStaff()
}
