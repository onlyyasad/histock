const CACHE = 'histock-v1'
const OFFLINE_URL = '/offline'

self.addEventListener('install', (e) => {
  e.waitUntil(
    caches.open(CACHE).then((cache) =>
      cache.addAll([OFFLINE_URL, '/dashboard', '/orders', '/products', '/customers'])
    )
  )
  self.skipWaiting()
})

self.addEventListener('activate', (e) => {
  e.waitUntil(
    caches.keys().then((keys) =>
      Promise.all(keys.filter((k) => k !== CACHE).map((k) => caches.delete(k)))
    )
  )
  self.clients.claim()
})

self.addEventListener('fetch', (e) => {
  // Only intercept GET navigation requests (page loads)
  if (e.request.method !== 'GET' || !e.request.headers.get('accept')?.includes('text/html')) return

  e.respondWith(
    fetch(e.request).catch(() => caches.match(OFFLINE_URL) ?? Response.error())
  )
})
