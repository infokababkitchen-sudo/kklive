/**
 * Kabab Kitchen - setup v2
 *
 * Chalane se pehle downloaded files apni jagah par daal do.
 * Chalao (repo ke root se):  node setup-kk-v2.js
 *
 * Dobara chalane par kuch kharab nahi hoga.
 */
const fs = require('fs')

const done = []
const skipped = []
const problems = []

// ------------------------------------------------- 0. galat jagah padi files
const STRAY_FILES = ['page.tsx', 'menu.ts', 'route.ts', 'tsconfig.tsbuildinfo']
const STRAY_DIRS = ['mnt', 'app/menu']

STRAY_FILES.forEach((f) => {
  if (fs.existsSync(f)) {
    fs.unlinkSync(f)
    done.push('hataya (galat jagah tha): ' + f)
  }
})
STRAY_DIRS.forEach((d) => {
  if (fs.existsSync(d)) {
    fs.rmSync(d, { recursive: true, force: true })
    done.push('hataya (galat jagah tha): ' + d + '/')
  }
})

// ------------------------------------------------------- 1. files maujood?
const REQUIRED = {
  'app/admin/page.tsx': 'Admin dashboard',
  'app/admin/settings/page.tsx': 'Purane URL ka redirect',
  'app/api/admin/settings/route.ts': 'Admin API',
  'app/api/admin/upload/route.ts': 'Photo upload API',
  'app/api/menu/route.ts': 'Public menu API',
  'lib/menu-overrides.ts': 'Merge logic',
  'hooks/use-menu.ts': 'Storefront hook',
  'types/menu.ts': 'Types',
  'components/dish-card.tsx': 'Variant bottom sheet',
  'components/category-tabs.tsx': 'Category sheet',
  'context/cart-context.tsx': 'Cart (refresh par bacha rahe)',
  'components/cart-overlay.tsx': 'Added-to-cart toast',
  'data/menu.json': 'Menu data',
}
const missing = Object.keys(REQUIRED).filter((f) => !fs.existsSync(f))
if (missing.length) {
  console.error('\nRUKO. Ye files nahi mili:\n')
  missing.forEach((f) => console.error('   ' + f + '   (' + REQUIRED[f] + ')'))
  console.error('\nInhe sahi folder mein daalo, phir dobara chalao.')
  console.error('Aur dhyan: script repo ke root se chalani hai (jahan package.json hai).\n')
  process.exit(1)
}

// naye version aaye hain ya nahi, ye check karo
const checks = [
  ['context/cart-context.tsx', 'localStorage', 'Cart persistence'],
  ['components/cart-overlay.tsx', 'clearLastAdded', 'Toast auto-dismiss'],
  ['components/dish-card.tsx', 'showSheet', 'Variant bottom sheet'],
  ['components/category-tabs.tsx', '85dvh', 'Category scroll fix'],
  ['app/admin/page.tsx', 'StockTab', 'Live stock dashboard'],
  ['app/api/admin/settings/route.ts', 'allowOverwrite', 'Blob overwrite fix'],
  ['lib/menu-overrides.ts', 'findDuplicatePairs', 'Variants support'],
]
checks.forEach(([file, needle, label]) => {
  if (!fs.readFileSync(file, 'utf8').includes(needle)) {
    problems.push(file + ' purana lag raha hai (' + label + ' nahi mila) - naya version daalo.')
  }
})

// ------------------------------------------------------ 2. cart page patch
const CART = 'app/cart/page.tsx'
let cart = fs.readFileSync(CART, 'utf8')
let cartChanged = false

if (cart.includes('hasSoldOut')) {
  skipped.push(CART + ' (pehle se patched)')
} else {
  // a) useMenu import
  if (!cart.includes("from '@/hooks/use-menu'")) {
    if (!cart.includes("import menuData from '@/data/menu.json'")) {
      problems.push(CART + ': menuData import nahi mila - haath se karna padega.')
    } else {
      cart = cart.replace(
        "import menuData from '@/data/menu.json'",
        "import menuData from '@/data/menu.json'\nimport { useMenu } from '@/hooks/use-menu'"
      )
      cartChanged = true
    }
  }

  // b) live stock check
  const oldHook = '  const { items, updateQuantity, removeItem, getTotal, clearCart } = useCart()'
  const newHook = `  const { items, updateQuantity, removeItem, getTotal, clearCart, hydrated } = useCart()
  const liveMenu = useMenu()

  // Admin ne stock band kiya to yahan turant pata chal jaata hai.
  const soldOut = items.filter(item => {
    const dish = liveMenu.dishes.find(d => d.id === item.id)
    return !dish || dish.inStock === false
  })
  const hasSoldOut = soldOut.length > 0`
  if (cart.includes(oldHook)) {
    cart = cart.replace(oldHook, newHook)
    cartChanged = true
  } else {
    problems.push(CART + ': useCart() line nahi mili - haath se karna padega.')
  }

  // c) hydration guard - warna refresh par ek pal ko "cart khaali" dikhta hai
  const oldEmpty = "  if (items.length === 0 && checkoutStep === 'cart') {"
  const newEmpty = `  if (!hydrated) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-background">
        <p className="text-sm text-muted-foreground">Cart load ho raha hai...</p>
      </div>
    )
  }

  if (items.length === 0 && checkoutStep === 'cart') {`
  if (cart.includes(oldEmpty)) {
    cart = cart.replace(oldEmpty, newEmpty)
    cartChanged = true
  } else {
    problems.push(CART + ': empty-cart check nahi mila - haath se karna padega.')
  }

  // d) out of stock hone par checkout band
  const oldBtn = `        <Button 
          onClick={() => setCheckoutStep('details')}
          className="w-full bg-primary text-primary-foreground h-12 text-base font-semibold"
        >
          Proceed to Checkout - Rs.{total}
        </Button>`
  const newBtn = `        {hasSoldOut && (
          <div className="mb-3 rounded-xl border border-red-300 bg-red-50 p-3">
            <p className="text-sm font-medium text-red-700">
              Ye abhi out of stock hai: {soldOut.map(i => i.name).join(', ')}
            </p>
            <button
              onClick={() => soldOut.forEach(i => removeItem(i.id, i.size))}
              className="mt-1 text-xs font-semibold text-red-700 underline"
            >
              Cart se hata do
            </button>
          </div>
        )}
        <Button 
          onClick={() => setCheckoutStep('details')}
          disabled={hasSoldOut}
          className="w-full bg-primary text-primary-foreground h-12 text-base font-semibold disabled:opacity-50"
        >
          {hasSoldOut ? 'Out of stock item hatao' : \`Proceed to Checkout - Rs.\${total}\`}
        </Button>`
  if (cart.includes(oldBtn)) {
    cart = cart.replace(oldBtn, newBtn)
    cartChanged = true
  } else {
    problems.push(CART + ': checkout button nahi mila - haath se karna padega.')
  }

  if (cartChanged) {
    fs.writeFileSync(CART, cart)
    done.push(CART + ' patch ho gayi (stock check + refresh fix)')
  }
}

// ------------------------------------------------------------- 3. menu.json
const menu = JSON.parse(fs.readFileSync('data/menu.json', 'utf8'))
const haveImg = new Set(fs.readdirSync('public/images'))
const catPhoto = {
  'kabab-khazana': 'chicken-malai-kabab.jpg',
  'authentic-kurkure-momos': 'chicken-momo.jpg',
  'kurkure-momos': 'kurkure-momo.jpg',
  'soya-chaap': 'malai-chaap.jpg',
  'chinese-delights': 'chilli-chicken.jpg',
  'chef-s-specials': 'chicken-tikka-masala.jpg',
  'crispy-chicken-specials': 'crispy-chicken.jpg',
  beverages: 'cold-coffee.jpg',
  'pure-veg-main-course': 'shahi-paneer.jpg',
  'special-veg-thalis': 'kadai-paneer.jpg',
  'non-veg-main-course': 'butter-chicken.jpg',
  'non-veg-thalis': 'mutton-rogan-josh.jpg',
  'rice-roti-add-ons': 'dal-tadka.jpg',
}
let catN = 0
menu.categories.forEach((c) => {
  if (c.id === 'all' || c.image) return
  const f = catPhoto[c.id]
  if (f && haveImg.has(f)) {
    c.image = '/images/' + f
    catN++
  }
})
if (catN) {
  fs.writeFileSync('data/menu.json', JSON.stringify(menu, null, 2) + '\n')
  done.push(catN + ' categories ko photo mili')
} else {
  skipped.push('category photos')
}

// ---------------------------------------------------------------- report
console.log('\n=========== HO GAYA ===========\n')
if (done.length) done.forEach((d) => console.log('  OK   ' + d))
if (skipped.length) skipped.forEach((d) => console.log('  SKIP ' + d))
if (problems.length) {
  console.log('\n--- DHYAN DO ---')
  problems.forEach((p) => console.log('  ! ' + p))
}
console.log('\nAgla kadam:')
console.log('  npm install')
console.log('  npm run build      <- 8/8 pages banne chahiye')
console.log('  npm run dev        <- localhost:3000/admin')
console.log('\nTest karne ke liye:')
console.log('  1. /admin -> Stock tab -> koi dish "Out of stock" karo')
console.log('  2. Home page refresh -> us dish par Add button nahi hona chahiye')
console.log('  3. Cart mein kuch daalo, page refresh karo -> cart bacha rehna chahiye\n')
