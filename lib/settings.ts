import { db, dbReady } from '@/lib/db'
import { EMPTY_OVERRIDES, MenuOverrides } from '@/lib/menu-overrides'

export const SETTINGS_KEY = 'menu-overrides'

/** Reads the saved overrides. Falls back to empty so the site never breaks. */
export async function readOverrides(): Promise<MenuOverrides> {
  if (!dbReady()) return EMPTY_OVERRIDES
  try {
    const sql = db()
    const rows = (await sql`SELECT value FROM settings WHERE key = ${SETTINGS_KEY}`) as any[]
    return (rows[0]?.value as MenuOverrides) || EMPTY_OVERRIDES
  } catch {
    return EMPTY_OVERRIDES
  }
}

/** Single-row upsert, so two admins saving at once cannot lose each other's work. */
export async function writeOverrides(value: MenuOverrides) {
  const sql = db()
  await sql`
    INSERT INTO settings (key, value)
    VALUES (${SETTINGS_KEY}, ${JSON.stringify(value)}::jsonb)
    ON CONFLICT (key) DO UPDATE SET value = EXCLUDED.value, updated_at = now()
  `
}
