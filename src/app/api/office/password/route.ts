import { NextRequest, NextResponse } from 'next/server'
import { z } from 'zod'
import { db } from '@/lib/db'
import { getSessionAccount, unauthorized, badRequest, verifyPassword, hashPassword, createToken, SESSION_COOKIE, clientIp, logSecurityEvent } from '@/lib/auth'

const schema = z.object({
  currentPassword: z.string().min(1, 'يرجى إدخال كلمة المرور الحالية'),
  newPassword: z
    .string()
    .min(8, 'كلمة المرور الجديدة يجب أن تكون 8 أحرف على الأقل')
    .max(100, 'كلمة المرور طويلة جداً')
    .regex(/[a-zA-Z]/, 'كلمة المرور يجب أن تحتوي حرفاً إنجليزياً واحداً على الأقل')
    .regex(/[0-9]/, 'كلمة المرور يجب أن تحتوي رقماً واحداً على الأقل'),
})

export async function POST(req: NextRequest) {
  try {
    const account = await getSessionAccount(req)
    if (!account) return unauthorized()

    const body = await req.json().catch(() => null)
    const parsed = schema.safeParse(body)
    if (!parsed.success) return badRequest(parsed.error.issues[0]?.message || 'بيانات غير صالحة')

    const { currentPassword, newPassword } = parsed.data

    if (!verifyPassword(currentPassword, account.passwordHash)) {
      await logSecurityEvent('login_failed', account.username, clientIp(req), 'كلمة مرور حالية خاطئة عند محاولة التغيير (مكتب فرع)')
      return badRequest('كلمة المرور الحالية غير صحيحة')
    }

    if (verifyPassword(newPassword, account.passwordHash)) {
      return badRequest('كلمة المرور الجديدة يجب أن تختلف عن الحالية')
    }

    const passwordHash = hashPassword(newPassword)
    const now = new Date()
    await db.branchAccount.update({
      where: { id: account.id },
      data: { passwordHash, tokenInvalidBefore: now },
    })

    const token = createToken('office', account.id, account.branchId)
    await logSecurityEvent('password_changed', account.username, clientIp(req), 'تغيير كلمة مرور مكتب فرع')

    const res = NextResponse.json({ success: true, message: 'تم تغيير كلمة المرور بنجاح' })
    res.cookies.set(SESSION_COOKIE, token, {
      httpOnly: true,
      sameSite: 'lax' as const,
      path: '/',
      maxAge: 60 * 60 * 24,
    })
    return res
  } catch (e) {
    console.error('office password error', e)
    return NextResponse.json({ error: 'حدث خطأ أثناء تغيير كلمة المرور' }, { status: 500 })
  }
}
