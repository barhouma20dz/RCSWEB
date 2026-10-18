import { NextRequest, NextResponse } from 'next/server'
import { z } from 'zod'
import { db } from '@/lib/db'
import { getSessionAdmin, unauthorized, badRequest, hashPassword, clientIp, logSecurityEvent } from '@/lib/auth'

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
  branchId: z.string().min(1, 'يرجى تحديد الفرع'),
  username: usernameSchema,
  password: z.string().min(6, 'كلمة المرور يجب أن تكون 6 أحرف على الأقل').max(100),
})

export async function POST(req: NextRequest) {
  try {
    const admin = await getSessionAdmin(req)
    if (!admin) return unauthorized()

    const body = await req.json().catch(() => null)
    const parsed = schema.safeParse(body)
    if (!parsed.success) return badRequest(parsed.error.issues[0]?.message || 'بيانات غير صالحة')

    const { branchId, username, password } = parsed.data

    const branch = await db.branch.findUnique({ where: { id: branchId } })
    if (!branch) return NextResponse.json({ error: 'الفرع غير موجود' }, { status: 404 })

    const clash = await db.branchAccount.findFirst({
      where: { username, NOT: { branchId } },
    })
    if (clash) return badRequest('اسم المستخدم مستخدم بالفعل لحساب فرع آخر')

    const adminClash = await db.admin.findUnique({ where: { username } })
    if (adminClash) return badRequest('اسم المستخدم محجوز لحساب الإدارة')

    const passwordHash = hashPassword(password)
    const account = await db.branchAccount.upsert({
      where: { branchId },
      update: { username, passwordHash, tokenInvalidBefore: new Date() },
      create: { username, passwordHash, branchId },
    })

    // إبطال كل جلسات الحساب القديمة عند إعادة تعيين كلمة المرور
    await logSecurityEvent('password_reset', username, clientIp(req), 'إعادة تعيين كلمة مرور مكتب فرع من الإدارة العامة')

    return NextResponse.json({
      success: true,
      account: { username: account.username, branchId: account.branchId },
    })
  } catch (e) {
    console.error('admin accounts error', e)
    return NextResponse.json({ error: 'حدث خطأ أثناء حفظ بيانات الحساب' }, { status: 500 })
  }
}
