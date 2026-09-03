/**
 * Kabab Kitchen - database setup and staff accounts.
 *
 *   node db/setup.js                              create the tables
 *   node db/setup.js list                         show every account
 *   node db/setup.js add <user> "<name>" <pass>   add an account
 *   node db/setup.js reset <user> <pass>          change a password
 *   node db/setup.js remove <user>                delete an account
 *
 * <user> can be an email or a plain username such as admin.
 * Reads the connection string from .env, .env.local or the environment.
 * Safe to run twice: every statement is CREATE TABLE IF NOT EXISTS.
 */
const fs = require('fs')
const path = require('path')
const { randomBytes, scryptSync } = require('crypto')

// ---------------------------------------------------------------- env
function loadEnv() {
  for (const file of ['.env.local', '.env']) {
    if (!fs.existsSync(file)) continue
    for (const raw of fs.readFileSync(file, 'utf8').split('\n')) {
      const line = raw.trim()
      if (!line || line.startsWith('#')) continue
      const eq = line.indexOf('=')
      if (eq === -1) continue
      const key = line.slice(0, eq).trim()
      let val = line.slice(eq + 1).trim()
      if (
        (val.startsWith('"') && val.endsWith('"')) ||
        (val.startsWith("'") && val.endsWith("'"))
      ) {
        val = val.slice(1, -1)
      }
      if (!process.env[key]) process.env[key] = val
    }
  }
}
loadEnv()

// Vercel's Neon integration sets several names; take whichever exists.
const CANDIDATES = [
  'DATABASE_URL',
  'POSTGRES_URL',
  'DATABASE_URL_UNPOOLED',
  'POSTGRES_URL_NON_POOLING',
  'POSTGRES_PRISMA_URL',
]
const found = CANDIDATES.find(k => process.env[k])

if (!found) {
  console.error('\nNo database connection string found.\n')
  console.error('Looked for: ' + CANDIDATES.join(', '))
  console.error('\nFix it one of these ways:')
  console.error('  a) npx vercel env pull .env.local        (pulls everything from Vercel)')
  console.error('  b) Neon dashboard -> Connection string -> paste into .env as:')
  console.error('     DATABASE_URL=postgresql://...\n')
  process.exit(1)
}
console.log('Using ' + found)

// ---------------------------------------------------------------- run
;(async () => {
  let neon
  try {
    ;({ neon } = require('@neondatabase/serverless'))
  } catch {
    console.error('\nMissing dependency. Run: npm install\n')
    process.exit(1)
  }

  const sql = neon(process.env[found])
  const schemaPath = path.join(__dirname, 'schema.sql')
  if (!fs.existsSync(schemaPath)) {
    console.error('\ndb/schema.sql not found. Run this from the repo root.\n')
    process.exit(1)
  }

  // strip comments, then split on ';' - this schema has no semicolons in literals
  const statements = fs
    .readFileSync(schemaPath, 'utf8')
    .split('\n')
    .filter(l => !l.trim().startsWith('--'))
    .join('\n')
    .split(';')
    .map(s => s.trim())
    .filter(Boolean)

  console.log('Creating tables...')
  for (const stmt of statements) {
    try {
      await sql.query(stmt)
    } catch (e) {
      console.error('\nFailed on:\n' + stmt.slice(0, 120) + '\n\n' + e.message + '\n')
      process.exit(1)
    }
  }

  const tables = await sql.query(
    "SELECT table_name FROM information_schema.tables WHERE table_schema='public' ORDER BY 1"
  )
  console.log('Tables ready: ' + tables.map(r => r.table_name).join(', '))

  // ---------------------------------------------------------- accounts
  const hashOf = pw => {
    const salt = randomBytes(16)
    return salt.toString('hex') + ':' + scryptSync(pw, salt, 64).toString('hex')
  }
  const norm = u => String(u).trim().toLowerCase()

  const args = process.argv.slice(2)
  const cmd = args[0]

  async function list() {
    const rows = await sql.query('SELECT id, email, name, role, created_at FROM staff ORDER BY id')
    if (!rows.length) {
      console.log('\nNo accounts yet. Create one:')
      console.log('  node db/setup.js add admin "Owner" your-password\n')
      return
    }
    console.log('\nAccounts:')
    for (const r of rows) {
      console.log('  ' + String(r.id).padEnd(3) + r.email.padEnd(28) + r.name + '  (' + r.role + ')')
    }
    console.log('')
  }

  if (!cmd) {
    await list()
    return
  }

  if (cmd === 'list') {
    await list()
    return
  }

  if (cmd === 'remove') {
    const user = args[1]
    if (!user) {
      console.error('\nUsage: node db/setup.js remove <user>\n')
      process.exit(1)
    }
    const rows = await sql.query('DELETE FROM staff WHERE lower(email) = $1 RETURNING email', [norm(user)])
    if (!rows.length) {
      console.error('\nNo account called ' + norm(user) + '\n')
      process.exit(1)
    }
    console.log('\nRemoved ' + rows[0].email + '. Its sessions are gone too.\n')
    await list()
    return
  }

  if (cmd === 'reset') {
    const [, user, password] = args
    if (!user || !password || password.length < 8) {
      console.error('\nUsage: node db/setup.js reset <user> <password of 8+ chars>\n')
      process.exit(1)
    }
    const rows = await sql.query(
      'UPDATE staff SET password_hash = $2 WHERE lower(email) = $1 RETURNING email',
      [norm(user), hashOf(password)]
    )
    if (!rows.length) {
      console.error('\nNo account called ' + norm(user) + '\n')
      process.exit(1)
    }
    // old sessions must not survive a password change
    await sql.query(
      'DELETE FROM sessions WHERE staff_id IN (SELECT id FROM staff WHERE lower(email) = $1)',
      [norm(user)]
    )
    console.log('\nPassword changed for ' + rows[0].email + '. Everyone signed out.\n')
    return
  }

  if (cmd === 'add') {
    const [, user, name, password] = args
    if (!user || !password || password.length < 8) {
      console.error('\nUsage: node db/setup.js add <user> "<name>" <password of 8+ chars>\n')
      process.exit(1)
    }
    const clash = await sql.query('SELECT 1 FROM staff WHERE lower(email) = $1', [norm(user)])
    if (clash.length) {
      console.error('\n' + norm(user) + ' already exists. Use reset to change its password.\n')
      process.exit(1)
    }
    const n = await sql.query('SELECT count(*)::int AS n FROM staff')
    await sql.query(
      'INSERT INTO staff (email, name, password_hash, role) VALUES ($1, $2, $3, $4)',
      [norm(user), name || 'Staff', hashOf(password), n[0].n === 0 ? 'owner' : 'staff']
    )
    console.log('\nCreated ' + norm(user) + '. Sign in at /admin.\n')
    await list()
    return
  }

  // legacy form: node db/setup.js <email> "<name>" <password>
  const [user, name, password] = args
  if (!password || password.length < 8) {
    console.error('\nUnknown command. Try:')
    console.error('  node db/setup.js list')
    console.error('  node db/setup.js add admin "Owner" your-password')
    console.error('  node db/setup.js reset admin new-password')
    console.error('  node db/setup.js remove admin\n')
    process.exit(1)
  }
  const clash = await sql.query('SELECT 1 FROM staff WHERE lower(email) = $1', [norm(user)])
  if (clash.length) {
    console.error('\n' + norm(user) + ' already exists. Use reset to change its password.\n')
    process.exit(1)
  }
  const n = await sql.query('SELECT count(*)::int AS n FROM staff')
  await sql.query(
    'INSERT INTO staff (email, name, password_hash, role) VALUES ($1, $2, $3, $4)',
    [norm(user), name || 'Owner', hashOf(password), n[0].n === 0 ? 'owner' : 'staff']
  )
  console.log('\nCreated ' + norm(user) + '. Sign in at /admin.\n')
})().catch(e => {
  console.error('\n' + e.message + '\n')
  process.exit(1)
})
