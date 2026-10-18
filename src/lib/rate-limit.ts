/**
 * ============================================================
 *  محدد المعدل في الذاكرة (In-Memory Rate Limiter)
 * ============================================================
 *  حماية ضد:
 *   - القوة الغاشمة على تسجيل الدخول (قفل لكل مستخدم+IP بعد 5 إخفاقات)
 *   - إغراق النماذج العامة (انخراط/اتصال/طلب متجر)
 *   - تعداد البيانات عبر استعلام الحالة
 *
 *  ملاحظة: التخزين في الذاكرة يكفي لنشر خادم واحد، ويُصفَّر
 *  تلقائياً عند إعادة التشغيل — بدون أي تبعيات خارجية.
 * ============================================================
 */

interface Bucket {
  count: number
  resetAt: number
  /** لحظة انتهاء القفل (للحسابات المقفلة بعد إخفاقات متكررة) */
  lockedUntil?: number
}

const buckets = new Map<string, Bucket>()

/** تنظيف دوري للدلاء المنتهية */
function sweep(now: number) {
  if (buckets.size < 1000) return
  for (const [k, b] of buckets) {
    if (b.resetAt < now && (b.lockedUntil ?? 0) < now) buckets.delete(k)
  }
}

export interface RateResult {
  /** مسموح بالمرور؟ */
  allowed: boolean
  /** عدد المحاولات المتبقية قبل الحجب */
  remaining: number
  /** ثوانٍ حتى إعادة المحاولة (عند الحجب) */
  retryAfter: number
}

/** نافذة منزلقة بسيطة: max طلبات لكل windowMs لكل مفتاح */
export function rateLimit(key: string, max: number, windowMs: number): RateResult {
  const now = Date.now()
  sweep(now)
  let bucket = buckets.get(key)
  if (!bucket || bucket.resetAt < now) {
    bucket = { count: 0, resetAt: now + windowMs }
    buckets.set(key, bucket)
  }
  bucket.count++
  if (bucket.count > max) {
    return { allowed: false, remaining: 0, retryAfter: Math.ceil((bucket.resetAt - now) / 1000) }
  }
  return { allowed: true, remaining: Math.max(0, max - bucket.count), retryAfter: 0 }
}

// ===== إعدادات تسجيل الدخول =====
/** أقصى محاولات دخول لكل IP خلال 5 دقائق (يحصر تعداد المستخدمين) */
const LOGIN_IP_MAX = 25
const LOGIN_IP_WINDOW = 5 * 60_000
/** إخفاقات مسموحة لكل username+IP قبل القفل */
const LOGIN_FAIL_MAX = 5
/** مدة القفل بعد تجاوز الإخفاقات */
const LOGIN_LOCK_MS = 10 * 60_000
const LOGIN_FAIL_WINDOW = 15 * 60_000

/** هل هذا المستخدم+IP مقفل حالياً بسبب إخفاقات متكررة؟ */
export function isLoginLocked(ip: string, username: string): RateResult {
  const bucket = buckets.get(`login:fail:${ip}:${username}`)
  const now = Date.now()
  if (bucket?.lockedUntil && bucket.lockedUntil > now) {
    return { allowed: false, remaining: 0, retryAfter: Math.ceil((bucket.lockedUntil - now) / 1000) }
  }
  return { allowed: true, remaining: LOGIN_FAIL_MAX, retryAfter: 0 }
}

/** حد IP العام لتسجيل الدخول */
export function loginIpLimit(ip: string): RateResult {
  return rateLimit(`login:ip:${ip}`, LOGIN_IP_MAX, LOGIN_IP_WINDOW)
}

/** تسجيل إخفاق دخول — يقفل username+IP بعد LOGIN_FAIL_MAX إخفاقات */
export function registerLoginFailure(ip: string, username: string): void {
  const key = `login:fail:${ip}:${username}`
  const now = Date.now()
  let bucket = buckets.get(key)
  if (!bucket || bucket.resetAt < now) {
    bucket = { count: 0, resetAt: now + LOGIN_FAIL_WINDOW }
    buckets.set(key, bucket)
  }
  bucket.count++
  if (bucket.count >= LOGIN_FAIL_MAX) {
    bucket.lockedUntil = now + LOGIN_LOCK_MS
    bucket.count = 0
  }
}

/** مسح الإخفاقات بعد دخول ناجح */
export function clearLoginFailures(ip: string, username: string): void {
  buckets.delete(`login:fail:${ip}:${username}`)
}

// ===== حدود النماذج العامة =====
/** النماذج العامة: 8 طلبات / 10 دقائق لكل IP (انخراط، اتصال، طلب متجر) */
export function publicFormLimit(route: string, ip: string): RateResult {
  return rateLimit(`form:${route}:${ip}`, 8, 10 * 60_000)
}

/** استعلام الحالة: 10 استعلامات / 10 دقائق لكل IP */
export function statusQueryLimit(ip: string): RateResult {
  return rateLimit(`status:${ip}`, 10, 10 * 60_000)
}
