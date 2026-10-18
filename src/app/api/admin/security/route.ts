import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { getSessionAdmin, unauthorized, verifyPassword } from '@/lib/auth'

/**
 * الحالة الأمنية للإدارة العامة:
 * - هل كلمة المرور الافتراضية (admin123) ما زالت مستخدمة؟
 * - آخر 100 حدث أمني (دخول ناجح/فاشل، قفل حسابات، تجاوز حدود، تغيير كلمات مرور)
 */
export async function GET(req: NextRequest) {
  try {
    const admin = await getSessionAdmin(req)
    if (!admin) return unauthorized()

    const [events, failedCount, lockedCount, usingDefault] = await Promise.all([
      db.securityEvent.findMany({ orderBy: { createdAt: 'desc' }, take: 100 }),
      db.securityEvent.count({ where: { type: 'login_failed', createdAt: { gte: new Date(Date.now() - 7 * 24 * 3600 * 1000) } } }),
      db.securityEvent.count({ where: { type: 'login_locked', createdAt: { gte: new Date(Date.now() - 7 * 24 * 3600 * 1000) } } }),
      // فحص مباشر: هل كلمة المرور الحالية هي الافتراضية؟
      db.admin.findFirst({ where: { id: admin.id } }).then((a) => (a ? verifyPassword('admin123', a.passwordHash) : false)),
    ])

    return NextResponse.json({
      usingDefaultPassword: usingDefault,
      passwordAgeNote: 'مدة الجلسة 24 ساعة مع إبطال فوري لكل الجلسات عند تغيير كلمة المرور',
      stats: {
        failedLogins7d: failedCount,
        lockedAccounts7d: lockedCount,
        totalEvents: events.length,
      },
      events: events.map((e) => ({
        id: e.id,
        type: e.type,
        actor: e.actor,
        ip: e.ip,
        detail: e.detail,
        createdAt: e.createdAt,
      })),
    })
  } catch (e) {
    console.error('admin security error', e)
    return NextResponse.json({ error: 'حدث خطأ أثناء تحميل الحالة الأمنية' }, { status: 500 })
  }
}
