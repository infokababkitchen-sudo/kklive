/**
 * Kabab Kitchen - v4 patch (edits only).
 *
 * FIRST replace these four files with the new versions:
 *   components/dish-card.tsx
 *   context/cart-context.tsx
 *   types/menu.ts
 *   data/menu.json
 *
 * THEN run from the repo root:  node patch-v4.js
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
  if (!fs.existsSync(file)) return fail.push(file + ' not found')
  let s = fs.readFileSync(file, 'utf8')
  if (guard && s.includes(guard)) return skip.push(label)
  let n = 0
  for (const [a, b] of pairs) {
    if (!s.includes(a)) {
      fail.push(label + ': anchor missing -> ' + a.slice(0, 50).replace(/\n/g, ' '))
      continue
    }
    s = s.split(a).join(b)
    n++
  }
  if (n) {
    fs.writeFileSync(file, s)
    done.push(label + ' (' + n + ' edits)')
  }
}

// --------------------------------------------------- 1. checkout WhatsApp
edit('app/cart/page.tsx', 'Order message includes add-ons + cooking request', [
  [
    `    const orderItems = items.map(item => 
      \`  \${item.name}\${item.size ? \` (\${item.size})\` : ''} x\${item.quantity} = Rs.\${item.price * item.quantity}\`
    ).join('\\n')`,
    `    const orderItems = items.map(item => {
      let line = \`  \${item.name}\${item.size ? \` (\${item.size})\` : ''} x\${item.quantity} = Rs.\${item.price * item.quantity}\`
      if (item.addOns?.length) {
        line += \`\\n     + \${item.addOns.map(a => \`\${a.name} (Rs.\${a.price})\`).join(', ')}\`
      }
      if (item.cookingRequest) {
        line += \`\\n     * Request: \${item.cookingRequest}\`
      }
      return line
    }).join('\\n')`,
  ],
  [
    'onClick={() => soldOut.forEach(i => removeItem(i.id, i.size))}',
    'onClick={() => soldOut.forEach(i => removeItem(i.lineId))}',
  ],
  ['removeItem(item.id, item.size)', 'removeItem(item.lineId)'],
  [
    'updateQuantity(item.id, item.quantity - 1, item.size)',
    'updateQuantity(item.lineId, item.quantity - 1)',
  ],
  [
    'updateQuantity(item.id, item.quantity + 1, item.size)',
    'updateQuantity(item.lineId, item.quantity + 1)',
  ],
], 'item.cookingRequest')

// ------------------------------------- 2. mini-cart thumbnails: remove button
edit('app/page.tsx', 'Cart thumbnails get a minus button', [
  [
    `import Image from 'next/image'`,
    `import Image from 'next/image'
import { Minus } from 'lucide-react'`,
  ],
  ['const { items } = useCart()', 'const { items, removeItem } = useCart()'],
  [
    `              <div key={\`\${item.id}-\${item.size}-\${index}\`} className="relative shrink-0">
                <div className="w-14 h-14 rounded-lg overflow-hidden border-2 border-primary">
                  <Image
                    src={item.image}
                    alt={item.name}
                    width={56}
                    height={56}
                    className="w-full h-full object-cover"
                  />
                </div>
                <span className="absolute -top-2 -right-2 w-5 h-5 bg-primary text-primary-foreground text-xs font-bold rounded-full flex items-center justify-center">
                  {item.quantity}
                </span>
              </div>`,
    `              <div key={item.lineId} className="relative shrink-0 pt-2 pr-2">
                <div className="w-14 h-14 rounded-lg overflow-hidden border-2 border-primary">
                  <Image
                    src={item.image}
                    alt={item.name}
                    width={56}
                    height={56}
                    className="w-full h-full object-cover"
                  />
                </div>
                <span className="absolute bottom-0 left-0 min-w-5 h-5 px-1 bg-primary text-primary-foreground text-xs font-bold rounded-full flex items-center justify-center">
                  {item.quantity}
                </span>
                <button
                  onClick={() => removeItem(item.lineId)}
                  aria-label={\`Remove \${item.name}\`}
                  className="absolute top-0 right-0 w-5 h-5 rounded-full bg-foreground text-background flex items-center justify-center shadow"
                >
                  <Minus className="w-3 h-3" />
                </button>
              </div>`,
  ],
], 'removeItem(item.lineId)')

// ------------------------------------------------- 3. category sheet scroll
edit('components/category-tabs.tsx', 'Category sheet scrolls above the nav', [
  ['<div className="fixed inset-0 z-50">', '<div className="fixed inset-0 z-[70]">'],
  [
    'pb-[calc(2rem+env(safe-area-inset-bottom))]',
    'pb-[calc(7rem+env(safe-area-inset-bottom))]',
  ],
], 'z-[70]')

console.log('\n=========== PATCH v4 ===========\n')
done.forEach(d => console.log('  OK   ' + d))
skip.forEach(d => console.log('  SKIP ' + d + ' (already applied)'))
if (fail.length) {
  console.log('\n  PROBLEMS:')
  fail.forEach(f => console.log('  !  ' + f))
  console.log('\n  Did you replace the four files first?')
}
console.log('\nNext:')
console.log('  npm run build')
console.log('  npm run dev\n')
console.log('IMPORTANT: add-on prices in data/menu.json are placeholders.')
console.log('Open data/menu.json, find "addOnGroups", and set your real prices.\n')
