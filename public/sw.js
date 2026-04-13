// Nexo HR Service Worker v2 - con Push Notifications
const CACHE = 'nexohr-v2'
const STATIC = ['/','/empleado/fichaje','/empleado/solicitudes','/empleado/nominas']

self.addEventListener('install', e => { e.waitUntil(caches.open(CACHE).then(c=>c.addAll(STATIC)).catch(()=>{})); self.skipWaiting() })
self.addEventListener('activate', e => { e.waitUntil(caches.keys().then(ks=>Promise.all(ks.filter(k=>k!==CACHE).map(k=>caches.delete(k))))); self.clients.claim() })

self.addEventListener('fetch', e => {
  if(e.request.method !== 'GET') return
  if(e.request.url.includes('/rest/v1/') || e.request.url.includes('/auth/v1/')) return
  e.respondWith(
    fetch(e.request).catch(() => caches.match(e.request))
  )
})

// ── Push Notifications ──────────────────────────────────────────────────────
self.addEventListener('push', e => {
  if(!e.data) return
  let data
  try { data = e.data.json() } catch { data = { title: 'Nexo HR', body: e.data.text() } }
  
  const options = {
    body: data.body || '',
    icon: '/icon-192.png',
    badge: '/icon-72.png',
    vibrate: [200, 100, 200],
    tag: data.tag || 'nexohr',
    renotify: true,
    data: { url: data.url || '/' },
    actions: [
      { action: 'open', title: 'Ver ahora' },
      { action: 'close', title: 'Cerrar' }
    ]
  }
  e.waitUntil(self.registration.showNotification(data.title || 'Nexo HR', options))
})

self.addEventListener('notificationclick', e => {
  e.notification.close()
  if(e.action === 'close') return
  const url = e.notification.data?.url || '/'
  e.waitUntil(clients.matchAll({type:'window',includeUncontrolled:true}).then(cs => {
    const c = cs.find(c => c.url.includes(self.location.origin))
    if(c) { c.focus(); c.navigate(url) }
    else clients.openWindow(url)
  }))
})
