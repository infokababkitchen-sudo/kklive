/* Kabab Kitchen service worker: offline shell + push notifications. */
const CACHE = 'kk-v1'
const SHELL = ['/', '/logo.png', '/logo-192.png', '/logo-96.png']

self.addEventListener('install', event => {
  event.waitUntil(caches.open(CACHE).then(c => c.addAll(SHELL)).then(() => self.skipWaiting()))
})

self.addEventListener('activate', event => {
  event.waitUntil(
    caches
      .keys()
      .then(keys => Promise.all(keys.filter(k => k !== CACHE).map(k => caches.delete(k))))
      .then(() => self.clients.claim())
  )
})

/*
 * Network first, cache as a fallback. Menu prices change, so a stale cache
 * would be worse than a slow load. The cache only rescues a dropped connection.
 */
self.addEventListener('fetch', event => {
  const req = event.request
  if (req.method !== 'GET') return
  const url = new URL(req.url)
  if (url.origin !== self.location.origin) return
  if (url.pathname.startsWith('/api/')) return

  event.respondWith(
    fetch(req)
      .then(res => {
        const copy = res.clone()
        caches.open(CACHE).then(c => c.put(req, copy)).catch(() => {})
        return res
      })
      .catch(() => caches.match(req).then(hit => hit || caches.match('/')))
  )
})

self.addEventListener('push', event => {
  let data = { title: 'Kabab Kitchen', body: 'Something tasty is waiting.' }
  try {
    if (event.data) data = { ...data, ...event.data.json() }
  } catch {
    /* keep the default */
  }
  event.waitUntil(
    self.registration.showNotification(data.title, {
      body: data.body,
      icon: '/logo-192.png',
      badge: '/logo-96.png',
      tag: data.tag || 'kk-news',
      data: { url: data.url || '/' },
    })
  )
})

self.addEventListener('notificationclick', event => {
  event.notification.close()
  const target = (event.notification.data && event.notification.data.url) || '/'
  event.waitUntil(
    self.clients.matchAll({ type: 'window', includeUncontrolled: true }).then(list => {
      for (const c of list) {
        if (c.url.includes(target) && 'focus' in c) return c.focus()
      }
      return self.clients.openWindow(target)
    })
  )
})
