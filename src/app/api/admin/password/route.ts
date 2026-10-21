import { NextRequest, NextResponse } from 'next/server'
import { z } from 'zod'
import { db } from '@/lib/db'
import { getSessionAdmin, unauthorized, badRequest, verifyPassword, hashPassword, createToken, SESSION_COOKIE, clientIp, logSecurityEvent } from '@/lib/auth'

const schema = z.object({
  currentPassword: z.string().min(1, 'يرجى إدخال كلمة المرور الحالية لتأكيد الهوية'),
  newUsername: z
    .string()
    .trim()
    .min(3, 'اسم المستخدم يجب أن يكون 3 أحرف على الأقل')
    .max(40, 'اسم المستخدم طويل جداً')
    .regex(/^[a-zA-Z0-9_.-]+$/, 'اسم المستخدم يجب أن يحتوي أحرفاً أو أرقاماً إنجليزية فقط')
    .optional(),
  newName: z.string().trim().max(80).optional(),
  newPassword: z
    .string()
    .min(8, 'كلمة المرور الجديدة يجب أن تكون 8 أحرف على الأقل')
    .max(100, 'كلمة المرور طويلة جداً')
    .regex(/[a-zA-Z]/, 'كلمة المرور يجب أن تحتوي حرفاً إنجليزياً واحداً على الأقل')
    .regex(/[0-9]/, 'كلمة المرور يجب أن تحتوي رقماً واحداً على الأقل')
    .optional(),
})

export async function POST(req: NextRequest) {
  try {
    const admin = await getSessionAdmin(req)
    if (!admin) return unauthorized()

    const body = await req.json().catch(() => null)
    const parsed = schema.safeParse(body)
    if (!parsed.success) return badRequest(parsed.error.issues[0]?.message || 'بيانات غير صالحة')

    const { currentPassword, newUsername, newName, newPassword } = parsed.data

    if (!verifyPassword(currentPassword, admin.passwordHash)) {
      await logSecurityEvent('login_failed', admin.username, clientIp(req), 'كلمة مرور حالية خاطئة عند محاولة تعديل الحساب')
      return badRequest('كلمة المرور الحالية غير صحيحة')
    }

    if (!newUsername && !newPassword && newName === undefined) {
      return badRequest('لم يتم تقديم أي بيانات جديدة للتحديث')
    }

    const updateData: { username?: string; name?: string; passwordHash?: string; tokenInvalidBefore?: Date } = {}

    if (newUsername && newUsername !== admin.username) {
      const existing = await db.admin.findUnique({ where: { username: newUsername } })
      if (existing) {
        return badRequest('اسم المستخدم هذا محجوز مسبقاً، اختر اسماً آخر')
      }
      updateData.username = newUsername
    }

    if (newName !== undefined && newName.trim() !== '') {
      updateData.name = newName.trim()
    }

    if (newPassword) {
      if (verifyPassword(newPassword, admin.passwordHash)) {
        return badRequest('كلمة المرور الجديدة يجب أن تختلف عن الحالية')
      }
      updateData.passwordHash = hashPassword(newPassword)
      updateData.tokenInvalidBefore = new Date()
    }

    const updated = await db.admin.update({
      where: { id: admin.id },
      data: updateData,
    })

    const token = createToken('admin', admin.id)
    await logSecurityEvent(
      newPassword ? 'password_changed' : 'account_updated',
      updated.username,
      clientIp(req),
      newPassword ? 'تغيير كلمة المرور وتحديث الحساب' : 'تحديث اسم المستخدم وبيانات الحساب'
    )

    const res = NextResponse.json({
      success: true,
      message: 'تم تحديث بيانات الحساب بنجاح',
      username: updated.username,
      name: updated.name,
    })
    res.cookies.set(SESSION_COOKIE, token, {
      httpOnly: true,
      sameSite: 'lax' as const,
      path: '/',
      maxAge: 60 * 60 * 24,
    })
    return res
  } catch (e) {
    console.error('admin account error', e)
    return NextResponse.json({ error: 'حدث خطأ أثناء تحديث بيانات الحساب' }, { status: 500 })
  }
}
