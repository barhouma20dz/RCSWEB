/* Service Worker لموقع النادي الرياضي الرائد — تخزين مؤقت للأصول الثابتة فقط */
const CACHE_NAME = 'raed-static-v4'

// بادئات المسارات القابلة للتخزين (أصول ثابتة فقط)
const CACHEABLE_PREFIXES = ['/images/', '/videos/', '/logo.svg']

self.addEventListener('install', () => {
  // تثبيت بلا تخزين مسبق
  self.skipWaiting()
})

self.addEventListener('activate', (event) => {
  event.waitUntil(
    (async () => {
      // حذف الكاشات القديمة
      const keys = await caches.keys()
      await Promise.all(keys.filter((k) => k !== CACHE_NAME).map((k) => caches.delete(k)))
      await self.clients.claim()
    })()
  )
})

self.addEventListener('fetch', (event) => {
  const req = event.request

  // تجاهل أي طلب غير GET
  if (req.method !== 'GET') return

  let url
  try {
    url = new URL(req.url)
  } catch {
    return
  }

  // نفس الأصل فقط
  if (url.origin !== self.location.origin) return

  // الأصول الثابتة فقط: الصور والفيديوهات والشعار
  const cacheable = CACHEABLE_PREFIXES.some((p) =>
    p.endsWith('.svg') ? url.pathname === p : url.pathname.startsWith(p)
  )
  if (!cacheable) return

  // استراتيجية cache-first
  event.respondWith(
    (async () => {
      const cached = await caches.match(req)
      if (cached) return cached
      try {
        const res = await fetch(req)
        if (res && res.ok) {
          const copy = res.clone()
          const cache = await caches.open(CACHE_NAME)
          await cache.put(req, copy)
        }
        return res
      } catch (err) {
        throw err
      }
    })()
  )
})
