/**
 * Kabab Kitchen - v3 patch. No downloads needed.
 * Run from the repo root:  node patch-v3.js
 *
 * Fixes: checkout WhatsApp number, English UI, Contact tab, save diagnostics.
 * Safe to run twice.
 */
const fs = require('fs')

if (!fs.existsSync('package.json') || !fs.existsSync('data')) {
  console.error('\nStop: not the repo root. Run "cd kklive" first.\n')
  process.exit(1)
}

const done = []
const skip = []
const fail = []

function edit(file, label, pairs, guard) {
  if (!fs.existsSync(file)) return fail.push(`${file} not found`)
  let s = fs.readFileSync(file, 'utf8')
  if (guard && s.includes(guard)) return skip.push(label)
  let n = 0
  for (const [a, b] of pairs) {
    if (!s.includes(a)) {
      fail.push(`${label}: anchor not found -> ${a.slice(0, 55).replace(/\n/g, ' ')}`)
      continue
    }
    s = s.split(a).join(b)
    n++
  }
  if (n) {
    fs.writeFileSync(file, s)
    done.push(`${label} (${n} edits)`)
  }
}

// ---------------------------------------------- 1. contact details override
edit('lib/menu-overrides.ts', 'Contact details override', [
  [
    `export interface MenuOverrides {`,
    `export interface RestaurantInfoOverride {
  phone?: string
  whatsapp?: string
  outlet?: string
  timings?: { lunch?: string; dinner?: string }
}

export interface MenuOverrides {
  restaurantInfo?: RestaurantInfoOverride`,
  ],
  [
    `return { ...base, dishes: [...existing, ...added] }`,
    `const restaurantInfo = overrides.restaurantInfo
    ? {
        ...base.restaurantInfo,
        ...Object.fromEntries(
          Object.entries(overrides.restaurantInfo).filter(([, v]) => v !== undefined && v !== '')
        ),
      }
    : base.restaurantInfo

  return { ...base, dishes: [...existing, ...added], restaurantInfo }`,
  ],
], 'RestaurantInfoOverride')

// ------------------------------------------------------- 2. admin save API
edit('app/api/admin/settings/route.ts', 'Admin API (save errors + health)', [
  [
    `async function readOverrides(): Promise<MenuOverrides> {
  try {
    const result = await list({ prefix: PATH })`,
    `let blobReadable = false

async function readOverrides(): Promise<MenuOverrides> {
  try {
    const result = await list({ prefix: PATH })
    blobReadable = true`,
  ],
  [
    `  } catch {
    return EMPTY_OVERRIDES
  }
}`,
    `  } catch {
    blobReadable = false
    return EMPTY_OVERRIDES
  }
}`,
  ],
  [
    `    overrides,
    duplicates,
  })`,
    `    restaurantInfo: baseMenu.restaurantInfo,
    overrides,
    duplicates,
    health: {
      blobConfigured: Boolean(process.env.BLOB_READ_WRITE_TOKEN),
      blobReadable,
    },
  })`,
  ],
  [
    `  const body = (await request.json()) as MenuOverrides
  const payload: MenuOverrides = {
    updatedAt: new Date().toISOString(),
    dishes: body.dishes || {},
    newDishes: body.newDishes || [],
  }
  const blob = await put(PATH, JSON.stringify(payload), {
    access: 'public',
    addRandomSuffix: false,
    allowOverwrite: true,
    contentType: 'application/json',
  })
  return NextResponse.json({ ok: true, url: blob.url, updatedAt: payload.updatedAt })`,
    `  if (!process.env.BLOB_READ_WRITE_TOKEN) {
    return NextResponse.json(
      { error: 'BLOB_READ_WRITE_TOKEN is not set, so changes cannot be saved.' },
      { status: 500 }
    )
  }

  const body = (await request.json()) as MenuOverrides
  const payload: MenuOverrides = {
    updatedAt: new Date().toISOString(),
    dishes: body.dishes || {},
    newDishes: body.newDishes || [],
    restaurantInfo: body.restaurantInfo || {},
  }

  try {
    const blob = await put(PATH, JSON.stringify(payload), {
      access: 'public',
      addRandomSuffix: false,
      allowOverwrite: true,
      contentType: 'application/json',
    })
    return NextResponse.json({ ok: true, url: blob.url, updatedAt: payload.updatedAt })
  } catch (e) {
    return NextResponse.json(
      { error: e instanceof Error ? e.message : 'Blob write failed' },
      { status: 500 }
    )
  }`,
  ],
], 'blobConfigured')

// ----------------------------------------------------------- 3. upload API
edit('app/api/admin/upload/route.ts', 'Upload API (real errors)', [
  [
    `  const ext = file.name.split('.').pop() || 'jpg'`,
    `  if (!process.env.BLOB_READ_WRITE_TOKEN) {
    return NextResponse.json(
      { error: 'BLOB_READ_WRITE_TOKEN is not set, so photos cannot be uploaded.' },
      { status: 500 }
    )
  }

  const ext = file.name.split('.').pop() || 'jpg'`,
  ],
], 'BLOB_READ_WRITE_TOKEN is not set, so photos')

// ------------------------------------- 4. checkout + English customer text
edit('app/cart/page.tsx', 'Checkout WhatsApp fix + English', [
  [
    'const whatsappUrl = `https://wa.me/${menuData.restaurantInfo.whatsapp}?text=${encodeURIComponent(message)}`',
    'const whatsappUrl = `https://wa.me/${liveMenu.restaurantInfo.whatsapp}?text=${encodeURIComponent(message)}`',
  ],
  ['Cart load ho raha hai...', 'Loading your cart\u2026'],
  [
    "{hasSoldOut ? 'Out of stock item hatao' : `Proceed to Checkout - Rs.${total}`}",
    "{hasSoldOut ? 'Remove out-of-stock items' : `Proceed to Checkout - Rs.${total}`}",
  ],
  ['Ye abhi out of stock hai:', 'Currently unavailable:'],
  ['Cart se hata do', 'Remove from cart'],
], 'liveMenu.restaurantInfo.whatsapp')

// -------------------------------------------------------- 5. variant sheet
edit('components/dish-card.tsx', 'Variant sheet (English)', [
  ['Apna option chuno', 'Choose an option'],
], 'Choose an option')

// ------------------------------------------ 6. admin dashboard: English UI
edit('app/admin/page.tsx', 'Admin dashboard (English)', [
  ["setMsg('Galat admin key.')", "setMsg('That admin key is not correct.')"],
  ["setMsg('Save fail hua.')", "setMsg('Save failed. Check your connection.')"],
  ["setMsg('Load nahi ho paya.')", "setMsg('Could not load. Try again.')"],
  ["setMsg(d.error || 'Photo upload fail hui.')", "setMsg(d.error || 'Photo upload failed.')"],
  ["setMsg('Photo upload fail hui.')", "setMsg('Photo upload failed.')"],
  [
    "setMsg('Photo lag gayi. Save dabana mat bhoolna.')",
    "setMsg('Photo attached. Tap Save changes to publish it.')",
  ],
  [
    "setMsg(res.ok ? 'Saved. Site par turant dikh jayega.' : 'Save fail hua.')",
    "setMsg(res.ok ? 'Saved. Live on the site now.' : (await res.json().catch(() => ({}))).error || 'Save failed.')",
  ],
  [
    'Key daalo. Phir prices, stock, variants aur photos sab yahin se manage kar sakte ho.',
    'Enter your key to manage prices, stock, variants, photos and contact details.',
  ],
  ["['new', 'Nayi dish'],", "['new', 'Add dish'],\n            ['settings', 'Contact'],"],
  ['placeholder="Dish dhoondo..."', 'placeholder="Search dishes\u2026"'],
  ['<option value="all">Saari categories</option>', '<option value="all">All categories</option>'],
  ['Menu se hatao', 'Hide from menu'],
  ['Koi dish nahi mili.', 'No dishes match.'],
  ['Koi duplicate nahi mila.', 'No duplicates found.'],
  ['<option value="">Ye kaunsa hai?</option>', '<option value="">Which one is this?</option>'],
  ['Sab on', 'All in stock'],
  ['placeholder="Dish ka naam"', 'placeholder="Dish name"'],
  ['Aapki added dishes', 'Dishes you added'],
  ['{allDishes.length} dishes · {changed} mein changes', '{allDishes.length} dishes · {changed} edited'],
], "['settings', 'Contact']")

// ---------------------------- 7. admin dashboard: Contact tab + diagnostics
edit('app/admin/page.tsx', 'Contact tab + diagnostics', [
  [
    `type Tab = 'stock' | 'dishes' | 'variants' | 'new'`,
    `type Tab = 'stock' | 'dishes' | 'variants' | 'new' | 'settings'`,
  ],
  [
    `  const [newDishes, setNewDishes] = useState<Dish[]>([])`,
    `  const [newDishes, setNewDishes] = useState<Dish[]>([])
  const [info, setInfo] = useState<Record<string, string>>({})
  const [health, setHealth] = useState<{ blobConfigured?: boolean; blobReadable?: boolean }>({})`,
  ],
  [
    `      setNewDishes(o?.newDishes || [])
      setUnlocked(true)`,
    `      setNewDishes(o?.newDishes || [])
      setHealth(d.health || {})
      const ri = o?.restaurantInfo || {}
      setInfo({
        phone: ri.phone ?? d.restaurantInfo?.phone ?? '',
        whatsapp: ri.whatsapp ?? d.restaurantInfo?.whatsapp ?? '',
        outlet: ri.outlet ?? d.restaurantInfo?.outlet ?? '',
        lunch: ri.timings?.lunch ?? d.restaurantInfo?.timings?.lunch ?? '',
        dinner: ri.timings?.dinner ?? d.restaurantInfo?.timings?.dinner ?? '',
      })
      setUnlocked(true)`,
  ],
  [
    `        body: JSON.stringify({
          dishes: next?.edits ?? edits,
          newDishes: next?.newDishes ?? newDishes,
        }),`,
    `        body: JSON.stringify({
          dishes: next?.edits ?? edits,
          newDishes: next?.newDishes ?? newDishes,
          restaurantInfo: {
            phone: info.phone,
            whatsapp: info.whatsapp,
            outlet: info.outlet,
            timings: { lunch: info.lunch, dinner: info.dinner },
          },
        }),`,
  ],
  [
    `  const changed = Object.values(edits).filter(o => o && Object.keys(o).length).length`,
    `  const changed = Object.values(edits).filter(o => o && Object.keys(o).length).length
  const isPlaceholderWhatsapp = /^9?1?0{6,}$/.test((info.whatsapp || '').replace(/\\D/g, ''))`,
  ],
  [
    `      {tab === 'stock' && (`,
    `      {health.blobConfigured === false && (
        <div className="mb-4 rounded-xl border border-red-300 bg-red-50 p-3">
          <p className="text-sm font-semibold text-red-800">
            Storage is not connected, so nothing can be saved.
          </p>
          <p className="mt-1 text-xs text-red-700">
            BLOB_READ_WRITE_TOKEN is missing. In Vercel open Storage, connect a
            Blob store to this project, then redeploy.
          </p>
        </div>
      )}

      {isPlaceholderWhatsapp && (
        <div className="mb-4 rounded-xl border border-amber-300 bg-amber-50 p-3">
          <p className="text-sm font-semibold text-amber-900">
            Orders are going to a placeholder WhatsApp number.
          </p>
          <p className="mt-1 text-xs text-amber-800">
            Open the Contact tab and enter your real number, otherwise checkout
            sends orders nowhere.
          </p>
        </div>
      )}

      {tab === 'settings' && (
        <div className="space-y-3">
          <p className="rounded-xl bg-muted/50 p-3 text-xs text-muted-foreground">
            Checkout sends every order to the WhatsApp number below. Use the
            country code with no plus sign or spaces, for example 919876543210.
          </p>
          {(
            [
              ['whatsapp', 'WhatsApp number (orders go here)', '919876543210'],
              ['phone', 'Phone shown to customers', '+91 98765 43210'],
              ['outlet', 'Outlet address', 'Kabab Kitchen, Ghaziabad'],
              ['lunch', 'Lunch timings', '12:00 PM - 4:00 PM'],
              ['dinner', 'Dinner timings', '7:00 PM - 11:00 PM'],
            ] as [string, string, string][]
          ).map(([k, label, ph]) => (
            <label key={k} className="block">
              <span className="text-xs text-muted-foreground">{label}</span>
              <input
                value={info[k] || ''}
                placeholder={ph}
                onChange={e => setInfo(prev => ({ ...prev, [k]: e.target.value }))}
                className="mt-1 w-full rounded-xl border bg-background p-2.5 text-sm"
              />
            </label>
          ))}
        </div>
      )}

      {tab === 'stock' && (`,
  ],
], 'isPlaceholderWhatsapp')

// -------------------------------------------------- 8. keep secrets out of git
let gi = fs.existsSync('.gitignore') ? fs.readFileSync('.gitignore', 'utf8') : ''
const rules = ['.env', '.env.*', '*.zip', '/files/']
const add = rules.filter(r => !gi.split('\n').includes(r))
if (add.length) {
  fs.writeFileSync('.gitignore', gi.trimEnd() + '\n\n# secrets and stray downloads\n' + add.join('\n') + '\n')
  done.push('.gitignore: ' + add.join(', '))
}

// ------------------------------------------------------------------ report
console.log('\n=========== PATCH v3 ===========\n')
done.forEach(d => console.log('  OK   ' + d))
skip.forEach(d => console.log('  SKIP ' + d + ' (already applied)'))
if (fail.length) {
  console.log('\n  PROBLEMS:')
  fail.forEach(f => console.log('  !  ' + f))
}
console.log('\nNext:')
console.log('  npm run build')
console.log('  git status            <- .env must NOT appear')
console.log('  npm run dev           <- open /admin, go to the Contact tab\n')
