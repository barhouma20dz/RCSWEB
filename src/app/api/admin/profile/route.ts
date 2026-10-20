import { NextRequest, NextResponse } from 'next/server'
import { z } from 'zod'
import { db } from '@/lib/db'
import {
  getSessionAdmin,
  unauthorized,
  badRequest,
  verifyPassword,
  clientIp,
  logSecurityEvent,
} from '@/lib/auth'

/**
 * الملف الشخصي للإدارة العامة — تغيير اسم المستخدم:
 * - يتطلب كلمة المرور الحالية للتأكيد (حماية من الاستيلاء على الجلسة)
 * - يرفض الأسماء المستخدمة من حسابات الفروع
 * - يبطل فوراً كل الجلسات السابقة عند التغيير
 */

const usernameSchema = z
  .string()
  .min(3, 'اسم المستخدم يجب أن يكون 3 أحرف على الأقل')
  .max(30, 'اسم المستخدم طويل جداً')
  .transform((s) => s.trim().toLowerCase())
  .pipe(
    z
      .string()
      .regex(/^[a-z0-9_-]+$/, 'اسم المستخدم يجب أن يحتوي أحرفاً إنجليزية صغيرة وأرقاماً وشرطات سفلية فقط')
  )

const schema = z.object({
  username: usernameSchema,
  currentPassword: z.string().min(1, 'كلمة المرور الحالية مطلوبة للتأكيد').max(100),
})

export async function PATCH(req: NextRequest) {
  try {
    const admin = await getSessionAdmin(req)
    if (!admin) return unauthorized()

    const body = await req.json().catch(() => null)
    const parsed = schema.safeParse(body)
    if (!parsed.success) return badRequest(parsed.error.issues[0]?.message || 'بيانات غير صالحة')

    const { username, currentPassword } = parsed.data

    // التأكد من كلمة المرور الحالية
    const full = await db.admin.findUnique({ where: { id: admin.id } })
    if (!full) return unauthorized()
    if (!verifyPassword(currentPassword, full.passwordHash)) {
      await logSecurityEvent('username_change_failed', admin.username, clientIp(req), 'كلمة مرور خاطئة أثناء تغيير اسم المستخدم')
      return badRequest('كلمة المرور الحالية غير صحيحة')
    }

    if (username === full.username) return badRequest('اسم المستخدم الجديد مطابق للحالي')

    // التحقق من التفرد
    const branchClash = await db.branchAccount.findUnique({ where: { username } })
    if (branchClash) return badRequest('اسم المستخدم مستخدم بالفعل لحساب فرع')

    const item = await db.admin.update({
      where: { id: admin.id },
      data: { username, tokenInvalidBefore: new Date() },
    })

    await logSecurityEvent('username_changed', username, clientIp(req), `تم تغيير اسم مستخدم الإدارة من ${full.username} إلى ${username}`)

    return NextResponse.json({ success: true, username: item.username })
  } catch (e) {
    console.error('admin profile error', e)
    return NextResponse.json({ error: 'فشل تغيير اسم المستخدم' }, { status: 500 })
  }
}
