import { neon } from '@neondatabase/serverless'

/**
 * Neon over HTTP: no pool to manage, which suits serverless.
 * Vercel's Neon integration sets several variable names, so take the first
 * one that exists rather than insisting on DATABASE_URL.
 */
const CANDIDATES = [
  'DATABASE_URL',
  'POSTGRES_URL',
  'DATABASE_URL_UNPOOLED',
  'POSTGRES_URL_NON_POOLING',
  'POSTGRES_PRISMA_URL',
]

export function connectionString(): string | undefined {
  for (const k of CANDIDATES) {
    const v = process.env[k]
    if (v) return v
  }
  return undefined
}

let cached: ReturnType<typeof neon> | null = null

export function db() {
  const url = connectionString()
  if (!url) throw new Error('No database connection string set')
  if (!cached) cached = neon(url)
  return cached
}

export function dbReady() {
  return Boolean(connectionString())
}
