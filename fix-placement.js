/**
 * Kabab Kitchen - files ko sahi jagah bhejo.
 *
 * Chalao (repo ke root se):  node fix-placement.js
 *
 * Ye script file ka NAAM nahi, uska ANDAR ka code dekh kar pehchanti hai ki
 * kaunsi file kahan jaani chahiye. Isliye aapne file kahin bhi rakhi ho -
 * root par, files/ folder mein, ya kahin aur - ye khud dhoond kar sahi
 * jagah par bhej degi. Phir saara kachra saaf kar degi.
 *
 * Dobara chalane par kuch kharab nahi hoga.
 */
const fs = require('fs')
const path = require('path')

if (!fs.existsSync('package.json') || !fs.existsSync('data')) {
  console.error('\nRUKO. Ye repo ka root folder nahi lag raha (package.json nahi mili).')
  console.error('Pehle `cd kklive` karo, phir dobara chalao.\n')
  process.exit(1)
}

// ---------------------------------------------------------------- signatures
// har destination ke liye: file ka naam + andar kya hona chahiye
const TARGETS = [
  {
    dest: 'context/cart-context.tsx',
    base: 'cart-context.tsx',
    must: ['localStorage', 'CartProvider'],
    label: 'Cart persistence',
  },
  {
    dest: 'components/cart-overlay.tsx',
    base: 'cart-overlay.tsx',
    must: ['clearLastAdded'],
    label: 'Toast auto-dismiss',
  },
  {
    dest: 'components/dish-card.tsx',
    base: 'dish-card.tsx',
    must: ['showSheet'],
    label: 'Variant bottom sheet',
  },
  {
    dest: 'components/category-tabs.tsx',
    base: 'category-tabs.tsx',
    must: ['85dvh'],
    label: 'Category scroll fix',
  },
  {
    dest: 'lib/menu-overrides.ts',
    base: 'menu-overrides.ts',
    must: ['findDuplicatePairs'],
    label: 'Variants support',
  },
  {
    dest: 'hooks/use-menu.ts',
    base: 'use-menu.ts',
    must: ['useMenu'],
    label: 'Storefront hook',
  },
  {
    dest: 'types/menu.ts',
    base: 'menu.ts',
    must: ['MenuData', 'variants'],
    label: 'Types',
  },
  {
    dest: 'app/admin/page.tsx',
    base: 'page.tsx',
    must: ['AdminDashboard', 'StockTab'],
    label: 'Admin dashboard',
  },
  {
    dest: 'app/admin/settings/page.tsx',
    base: 'page.tsx',
    must: ["redirect('/admin')"],
    label: 'Purane URL ka redirect',
  },
  {
    dest: 'app/api/admin/settings/route.ts',
    base: 'route.ts',
    must: ['allowOverwrite', 'findDuplicatePairs'],
    label: 'Admin API',
  },
  {
    dest: 'app/api/admin/upload/route.ts',
    base: 'route.ts',
    must: ['formData'],
    label: 'Photo upload API',
  },
  {
    dest: 'app/api/menu/route.ts',
    base: 'route.ts',
    must: ['EMPTY_OVERRIDES'],
    not: ['allowOverwrite', 'formData'],
    label: 'Public menu API',
  },
  {
    dest: 'data/menu.json',
    base: 'menu.json',
    must: ['"dishes"', '"categories"', '"todaysSpecials"'],
    label: 'Menu data',
  },
]

// ye folders asli source hain - inke andar dhoondna nahi
const SKIP_DIRS = new Set([
  'node_modules', '.git', '.next', '.vercel', 'public',
  'app', 'components', 'lib', 'hooks', 'context', 'types', 'data', 'styles',
])

/** Repo mein padi hui "bekaar jagah" ki saari files list karo. */
function scanStray(dir, out = []) {
  for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
    const full = path.join(dir, entry.name)
    const rel = path.relative('.', full)
    if (entry.isDirectory()) {
      if (dir === '.' && SKIP_DIRS.has(entry.name)) continue
      if (entry.name === 'node_modules' || entry.name === '.git') continue
      scanStray(full, out)
    } else if (/\.(tsx?|json)$/.test(entry.name)) {
      out.push(rel)
    }
  }
  return out
}

const PROTECTED = new Set([
  'package.json', 'package-lock.json', 'components.json',
  'tsconfig.json', 'next-env.d.ts',
])

const stray = scanStray('.').filter(f => !PROTECTED.has(path.basename(f)))

// ------------------------------------------------------------------- move
const moved = []
const already = []
const notFound = []

for (const t of TARGETS) {
  // pehle dekho destination already naya to nahi
  if (fs.existsSync(t.dest)) {
    const cur = fs.readFileSync(t.dest, 'utf8')
    if (t.must.every(m => cur.includes(m))) {
      already.push(`${t.dest}  (${t.label})`)
      continue
    }
  }

  // ab kahin bhi padi hui sahi file dhoondo
  const match = stray.find(f => {
    if (path.basename(f) !== t.base) return false
    let s
    try {
      s = fs.readFileSync(f, 'utf8')
    } catch {
      return false
    }
    if (!t.must.every(m => s.includes(m))) return false
    if (t.not && t.not.some(n => s.includes(n))) return false
    return true
  })

  if (!match) {
    notFound.push(`${t.dest}  (${t.label})`)
    continue
  }

  fs.mkdirSync(path.dirname(t.dest), { recursive: true })
  fs.copyFileSync(match, t.dest)
  moved.push(`${match}  ->  ${t.dest}`)
}

// ---------------------------------------------------------------- cleanup
const JUNK_FILES = [
  'page.tsx', 'menu.ts', 'route.ts', 'menu.json',
  'cart-context.tsx', 'cart-overlay.tsx', 'category-tabs.tsx',
  'dish-card.tsx', 'menu-overrides.ts', 'use-menu.ts',
  'files.zip', 'cleanup-and-install.sh', 'tsconfig.tsbuildinfo',
]
const JUNK_DIRS = ['files', 'mnt', 'app/menu']

const cleaned = []
JUNK_FILES.forEach(f => {
  if (fs.existsSync(f) && fs.statSync(f).isFile()) {
    fs.unlinkSync(f)
    cleaned.push(f)
  }
})
JUNK_DIRS.forEach(d => {
  if (fs.existsSync(d)) {
    fs.rmSync(d, { recursive: true, force: true })
    cleaned.push(d + '/')
  }
})

// ----------------------------------------------------------------- report
console.log('\n=========== FILE PLACEMENT ===========\n')

if (moved.length) {
  console.log('SAHI JAGAH BHEJI:')
  moved.forEach(m => console.log('  -> ' + m))
  console.log()
}
if (already.length) {
  console.log('PEHLE SE SAHI THI:')
  already.forEach(m => console.log('  OK ' + m))
  console.log()
}
if (cleaned.length) {
  console.log('KACHRA SAAF KIYA:')
  cleaned.forEach(m => console.log('  x  ' + m))
  console.log()
}
if (notFound.length) {
  console.log('!! YE NAHI MILI - dobara download karke repo mein kahin bhi rakh do,')
  console.log('   phir ye script dobara chalao (jagah ki chinta mat karo):')
  notFound.forEach(m => console.log('   ' + m))
  console.log()
}

console.log('Agla kadam:')
console.log('  npm run build')
console.log('  git add -A && git commit -m "Fix file placement" && git push origin main\n')
