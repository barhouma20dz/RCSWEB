import { NextRequest, NextResponse } from 'next/server'
import { z } from 'zod'
import { db } from '@/lib/db'
import { getSessionAdmin, unauthorized, badRequest } from '@/lib/auth'

/**
 * إدارة الإنجازات يدوياً من الإدارة العامة —
 * الإنجازات المسجلة هنا تظهر في قسم الإنجازات بالصفحة الرئيسية
 * وتدخل في حساب عدد الألقاب تلقائياً (ما لم تُحدد قيمة يدوية في إحصائيات الموقع)
 */

const achievementSchema = z.object({
  title: z.string().min(2, 'عنوان الإنجاز مطلوب (حرفان على الأقل)').max(200),
  year: z
    .string()
    .min(4, 'السنة مطلوبة (مثل 2026)')
    .max(9)
    .regex(/^\d{4}([/-]\d{4})?$/, 'السنة يجب أن تكون بصيغة 2026 أو 2025/2026'),
  description: z.string().max(2000).optional().default(''),
  branchId: z.string().optional().nullable(),
})

const idSchema = z.object({ id: z.string().min(1, 'المعرف مطلوب') })

export async function POST(req: NextRequest) {
  try {
    const admin = await getSessionAdmin(req)
    if (!admin) return unauthorized()

    const body = await req.json().catch(() => null)
    const parsed = achievementSchema.safeParse(body)
    if (!parsed.success) return badRequest(parsed.error.issues[0]?.message || 'بيانات غير صالحة')

    if (parsed.data.branchId) {
      const branch = await db.branch.findUnique({ where: { id: parsed.data.branchId } })
      if (!branch) return badRequest('الفرع المحدد غير موجود')
    }

    const item = await db.achievement.create({
      data: {
        title: parsed.data.title,
        year: parsed.data.year,
        description: parsed.data.description,
        branchId: parsed.data.branchId || null,
      },
      include: { branch: { select: { name: true, slug: true, color: true } } },
    })
    return NextResponse.json({ success: true, item })
  } catch (e) {
    console.error('admin achievements post error', e)
    return NextResponse.json({ error: 'فشل إضافة الإنجاز' }, { status: 500 })
  }
}

export async function PUT(req: NextRequest) {
  try {
    const admin = await getSessionAdmin(req)
    if (!admin) return unauthorized()

    const body = await req.json().catch(() => null)
    const id = body?.id as string | undefined
    const parsedId = idSchema.safeParse({ id })
    if (!parsedId.success) return badRequest('المعرف مطلوب')

    const parsed = achievementSchema.safeParse(body?.data ?? body)
    if (!parsed.success) return badRequest(parsed.error.issues[0]?.message || 'بيانات غير صالحة')

    const existing = await db.achievement.findUnique({ where: { id: parsedId.data.id } })
    if (!existing) return NextResponse.json({ error: 'الإنجاز غير موجود' }, { status: 404 })

    if (parsed.data.branchId) {
      const branch = await db.branch.findUnique({ where: { id: parsed.data.branchId } })
      if (!branch) return badRequest('الفرع المحدد غير موجود')
    }

    const item = await db.achievement.update({
      where: { id: parsedId.data.id },
      data: {
        title: parsed.data.title,
        year: parsed.data.year,
        description: parsed.data.description,
        branchId: parsed.data.branchId || null,
      },
      include: { branch: { select: { name: true, slug: true, color: true } } },
    })
    return NextResponse.json({ success: true, item })
  } catch (e) {
    console.error('admin achievements put error', e)
    return NextResponse.json({ error: 'فشل تعديل الإنجاز' }, { status: 500 })
  }
}

export async function DELETE(req: NextRequest) {
  try {
    const admin = await getSessionAdmin(req)
    if (!admin) return unauthorized()

    const body = await req.json().catch(() => null)
    const id = body?.id as string | undefined
    const parsedId = idSchema.safeParse({ id })
    if (!parsedId.success) return badRequest('المعرف مطلوب')

    const existing = await db.achievement.findUnique({ where: { id: parsedId.data.id } })
    if (!existing) return NextResponse.json({ error: 'الإنجاز غير موجود' }, { status: 404 })

    await db.achievement.delete({ where: { id: parsedId.data.id } })
    return NextResponse.json({ success: true })
  } catch (e) {
    console.error('admin achievements delete error', e)
    return NextResponse.json({ error: 'فشل حذف الإنجاز' }, { status: 500 })
  }
}
