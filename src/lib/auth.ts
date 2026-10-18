import crypto from 'crypto'
import { NextRequest } from 'next/server'
import { db } from '@/lib/db'

/**
 * ============================================================
 *  طبقة المصادقة المركزية — نادي الرائد الرياضي
 * ============================================================
 *  - التوكن موقّع HMAC-SHA256 بمفتاح سري من بيئة التشغيل (AUTH_SECRET)
 *  - لا يوجد سر افتراضي: غياب AUTH_SECRET يوقف التشغيل (fail-closed)
 *  - كلمات المرور scrypt بملح عشوائي 16 بايت + مقارنة زمنية ثابتة
 *  - إبطال فوري لكل الجلسات عند تغيير كلمة المرور (tokenInvalidBefore)
 * ============================================================
 */

const SECRET = process.env.AUTH_SECRET
if (!SECRET || SECRET.length < 32) {
  // إغلاق آمن: لا جلسات بدون سر قوي — يمنع تزوير التوكنات بمفتاح معروف
  throw new Error('AUTH_SECRET مفقود أو ضعيف — أضفه إلى ملف .env (64 خانة ست عشرية على الأقل)')
}

export const SESSION_COOKIE = 'raed_branch_session'
/** مدة الجلسة: 24 ساعة (كانت أسبوعاً كاملاً — تقليص المدة يقلص نافذة سرقة الجلسة) */
const SESSION_HOURS = 24

export function hashPassword(password: string): string {
  const salt = crypto.randomBytes(16).toString('hex')
  const hash = crypto.scryptSync(password, salt, 64).toString('hex')
  return `${salt}:${hash}`
}

export function verifyPassword(password: string, stored: string): boolean {
  const [salt, hash] = stored.split(':')
  if (!salt || !hash) return false
  const candidate = crypto.scryptSync(password, salt, 64).toString('hex')
  const a = Buffer.from(candidate, 'hex')
  const b = Buffer.from(hash, 'hex')
  return a.length === b.length && crypto.timingSafeEqual(a, b)
}

export type SessionRole = 'office' | 'admin'

interface SessionPayload {
  role: SessionRole
  accountId: string
  branchId?: string
  /** لحظة الإصدار (ms) — تُقارن مع tokenInvalidBefore لإبطال الجلسات القديمة */
  iat: number
  exp: number
}

function sign(data: string): string {
  return crypto.createHmac('sha256', SECRET as string).update(data).digest('base64url')
}

export function createToken(role: SessionRole, accountId: string, branchId?: string): string {
  const payload: SessionPayload = {
    role,
    accountId,
    ...(branchId ? { branchId } : {}),
    iat: Date.now(),
    exp: Date.now() + SESSION_HOURS * 3600 * 1000,
  }
  const body = Buffer.from(JSON.stringify(payload)).toString('base64url')
  return `${body}.${sign(body)}`
}

/** فك التوكن مع التحقق من التوقيع والصلاحية (دون فحص الإبطال في قاعدة البيانات) */
function decodeToken(token: string): SessionPayload | null {
  try {
    const [body, sig] = token.split('.')
    if (!body || !sig) return null
    const expected = sign(body)
    const a = Buffer.from(sig)
    const b = Buffer.from(expected)
    if (a.length !== b.length || !crypto.timingSafeEqual(a, b)) return null
    const payload = JSON.parse(Buffer.from(body, 'base64url').toString()) as SessionPayload
    if (payload.exp < Date.now()) return null
    if (payload.role !== 'office' && payload.role !== 'admin') return null
    if (typeof payload.iat !== 'number') return null
    return payload
  } catch {
    return null
  }
}

/** استخراج التوكن: ترويسة Authorization أولاً (تعمل داخل iframe والمعاينات) ثم الكوكي احتياطاً */
function extractToken(req: NextRequest): string | null {
  const auth = req.headers.get('authorization')
  if (auth && auth.toLowerCase().startsWith('bearer ')) {
    const t = auth.slice(7).trim()
    if (t) return t
  }
  return req.cookies.get(SESSION_COOKIE)?.value ?? null
}

/** عنوان IP للعميل (خلف بوابة Caddy) */
export function clientIp(req: NextRequest): string {
  const fwd = req.headers.get('x-forwarded-for')
  if (fwd) return fwd.split(',')[0].trim()
  return req.headers.get('x-real-ip') ?? 'local'
}

/** تسجيل حدث أمني — مع منع التكرار المزعج (نفس النوع+IP خلال دقيقة = تسجيل واحد) */
const recentLogKeys = new Map<string, number>()
export async function logSecurityEvent(type: string, actor: string | null, ip: string | null, detail?: string): Promise<void> {
  try {
    const key = `${type}:${ip ?? '-'}:${actor ?? '-'}`
    const now = Date.now()
    const last = recentLogKeys.get(key) ?? 0
    if (now - last < 60_000 && type !== 'login_success' && type !== 'password_changed') return
    recentLogKeys.set(key, now)
    if (recentLogKeys.size > 500) {
      // تنظيف الخريطة من المفاتيح القديمة
      for (const [k, v] of recentLogKeys) if (now - v > 300_000) recentLogKeys.delete(k)
    }
    await db.securityEvent.create({
      data: { type, actor: actor ?? null, ip: ip ?? null, detail: detail ?? null },
    })
  } catch {
    // تسجيل الأحداث لا يجب أن يوقف الطلب أبداً
  }
}

/** جلسة مكتب الفرع — تعمل فقط عندما يكون دور الجلسة office وجلسة غير مُبطلَة */
export async function getSessionAccount(req: NextRequest) {
  const token = extractToken(req)
  if (!token) return null
  const payload = decodeToken(token)
  if (!payload || payload.role !== 'office') return null
  const account = await db.branchAccount.findUnique({
    where: { id: payload.accountId },
    include: {
      branch: {
        include: {
          _count: { select: { news: true, players: true, matches: true, enrollments: true, gallery: true } },
        },
      },
    },
  })
  if (!account) return null
  // إبطال الجلسات الصادرة قبل آخر تغيير لكلمة المرور
  if (account.tokenInvalidBefore && payload.iat < account.tokenInvalidBefore.getTime()) return null
  return account
}

/** جلسة الإدارة المركزية — تعمل فقط عندما يكون دور الجلسة admin وجلسة غير مُبطلَة */
export async function getSessionAdmin(req: NextRequest) {
  const token = extractToken(req)
  if (!token) return null
  const payload = decodeToken(token)
  if (!payload || payload.role !== 'admin') return null
  const admin = await db.admin.findUnique({ where: { id: payload.accountId } })
  if (!admin) return null
  if (admin.tokenInvalidBefore && payload.iat < admin.tokenInvalidBefore.getTime()) return null
  return admin
}

export function unauthorized() {
  return Response.json({ error: 'غير مصرح لك بالوصول' }, { status: 401 })
}

export function badRequest(message: string) {
  return Response.json({ error: message }, { status: 400 })
}
