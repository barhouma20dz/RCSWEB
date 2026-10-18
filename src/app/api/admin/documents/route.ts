import { NextRequest, NextResponse } from 'next/server'
import { z } from 'zod'
import { db } from '@/lib/db'
import { getSessionAdmin, unauthorized } from '@/lib/auth'

const documentSchema = z.object({
  refNumber: z.string().max(60).optional().default(''),
  title: z.string().min(3, 'عنوان الوثيقة مطلوب (3 أحرف على الأقل)'),
  type: z.enum(['file', 'minute', 'letter', 'request', 'design'], {
    message: 'نوع الوثيقة غير صالح',
  }),
  category: z.string().max(80).optional().default(''),
  content: z.string().min(5, 'نص الوثيقة مطلوب'),
  design: z.string().optional().default(''),
  memberId: z.string().optional().nullable(),
  branchId: z.string().optional().nullable(),
  visibleToBranch: z.boolean().optional().default(false),
})

const idSchema = z.object({ id: z.string().min(1, 'المعرف مطلوب') })

function firstIssue(e: z.ZodError): string {
  return e.issues[0]?.message || 'بيانات غير صالحة'
}

export async function POST(req: NextRequest) {
  try {
    const admin = await getSessionAdmin(req)
    if (!admin) return unauthorized()

    const body = await req.json().catch(() => null)
    const action = body?.action as string
    const id = body?.id as string | undefined
    const data = body?.data ?? {}

    // ===== عرض/إخفاء في حساب الفرع (أمر الإدارة) =====
    if (action === 'show' || action === 'hide') {
      const parsedId = idSchema.safeParse({ id })
      if (!parsedId.success) return NextResponse.json({ error: 'المعرف مطلوب' }, { status: 400 })
      const existing = await db.clubDocument.findUnique({ where: { id: parsedId.data.id } })
      if (!existing) return NextResponse.json({ error: 'الوثيقة غير موجودة' }, { status: 404 })
      const item = await db.clubDocument.update({
        where: { id: parsedId.data.id },
        data: { visibleToBranch: action === 'show' },
      })
      return NextResponse.json({ success: true, item })
    }

    if (!['create', 'update', 'delete'].includes(action)) {
      return NextResponse.json({ error: 'عملية غير صالحة' }, { status: 400 })
    }

    // ===== حذف =====
    if (action === 'delete') {
      const parsedId = idSchema.safeParse({ id })
      if (!parsedId.success) return NextResponse.json({ error: 'المعرف مطلوب' }, { status: 400 })
      const existing = await db.clubDocument.findUnique({ where: { id: parsedId.data.id } })
      if (!existing) return NextResponse.json({ error: 'الوثيقة غير موجودة' }, { status: 404 })
      await db.clubDocument.delete({ where: { id: parsedId.data.id } })
      return NextResponse.json({ success: true })
    }

    // ===== إنشاء / تعديل =====
    const parsed = documentSchema.safeParse(data)
    if (!parsed.success) return NextResponse.json({ error: firstIssue(parsed.error) }, { status: 400 })

    // التحقق من الفرع والإطار المحددين
    if (parsed.data.branchId) {
      const branch = await db.branch.findUnique({ where: { id: parsed.data.branchId } })
      if (!branch) return NextResponse.json({ error: 'الفرع المحدد غير موجود' }, { status: 400 })
    }
    if (parsed.data.memberId) {
      const member = await db.branchMember.findUnique({ where: { id: parsed.data.memberId } })
      if (!member) return NextResponse.json({ error: 'الإطار المحدد غير موجود' }, { status: 400 })
    }

    const payload = {
      refNumber: parsed.data.refNumber,
      title: parsed.data.title,
      type: parsed.data.type,
      category: parsed.data.category,
      content: parsed.data.content,
      design: parsed.data.design,
      branchId: parsed.data.branchId || null,
      memberId: parsed.data.memberId || null,
      visibleToBranch: parsed.data.visibleToBranch,
    }

    if (action === 'create') {
      const item = await db.clubDocument.create({ data: payload })
      return NextResponse.json({ success: true, item })
    }

    if (!id) return NextResponse.json({ error: 'المعرف مطلوب' }, { status: 400 })
    const existing = await db.clubDocument.findUnique({ where: { id } })
    if (!existing) return NextResponse.json({ error: 'الوثيقة غير موجودة' }, { status: 404 })
    const item = await db.clubDocument.update({ where: { id }, data: payload })
    return NextResponse.json({ success: true, item })
  } catch (e) {
    console.error('admin documents error', e)
    return NextResponse.json({ error: 'فشل تنفيذ عملية الوثيقة' }, { status: 500 })
  }
}
