// Nexo HR Service Worker v1
const CACHE = 'nexohr-v1'
const OFFLINE_URL = '/'

// Assets esenciales para cachear en install
const PRECACHE = [
  '/',
  '/manifest.json',
]

self.addEventListener('install', e => {
  e.waitUntil(
    caches.open(CACHE).then(c => c.addAll(PRECACHE)).then(() => self.skipWaiting())
  )
})

self.addEventListener('activate', e => {
  e.waitUntil(
    caches.keys().then(keys =>
      Promise.all(keys.filter(k => k !== CACHE).map(k => caches.delete(k)))
    ).then(() => self.clients.claim())
  )
})

self.addEventListener('fetch', e => {
  // Solo interceptar GET del mismo origen
  if (e.request.method !== 'GET') return
  const url = new URL(e.request.url)
  if (url.origin !== location.origin) return

  // Estrategia: Network first, fallback a cache
  e.respondWith(
    fetch(e.request)
      .then(resp => {
        // Cachear respuestas ok de navegación y static assets
        if (resp.ok && (e.request.mode === 'navigate' || url.pathname.startsWith('/_next/static'))) {
          const clone = resp.clone()
          caches.open(CACHE).then(c => c.put(e.request, clone))
        }
        return resp
      })
      .catch(() => {
        return caches.match(e.request).then(cached => {
          if (cached) return cached
          if (e.request.mode === 'navigate') return caches.match(OFFLINE_URL)
          return new Response('Offline', { status: 503 })
        })
      })
  )
})

// Push notifications
self.addEventListener('push', e => {
  if (!e.data) return
  const data = e.data.json()
  e.waitUntil(
    self.registration.showNotification(data.title || 'Nexo HR', {
      body: data.body || '',
      icon: '/icon-192.png',
      badge: '/icon-192.png',
      data: data.url ? { url: data.url } : undefined,
    })
  )
})

self.addEventListener('notificationclick', e => {
  e.notification.close()
  if (e.notification.data?.url) {
    e.waitUntil(clients.openWindow(e.notification.data.url))
  }
})