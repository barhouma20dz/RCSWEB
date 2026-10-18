import { NextRequest, NextResponse } from 'next/server'
import { z } from 'zod'
import { db } from '@/lib/db'
import { getSessionAdmin, unauthorized } from '@/lib/auth'

/** المناصب الرسمية لإطارات الفروع بالترتيب الهرمي */
const POSITION_ORDER = [
  'رئيس الفرع',
  'نائب رئيس الفرع',
  'الأمين العام للفرع',
  'المدير التقني للفرع',
  'نائب المدير التقني',
  'مدرب',
  'عضو مكتب الفرع',
  'عضو',
]

const memberSchema = z.object({
  branchId: z.string().min(1, 'يرجى اختيار الفرع'),
  firstName: z.string().min(2, 'الاسم مطلوب (حرفان على الأقل)'),
  lastName: z.string().min(2, 'اللقب مطلوب (حرفان على الأقل)'),
  birthDate: z.string().optional().default(''),
  position: z.string().min(2, 'المنصب مطلوب'),
  specialty: z.string().optional().default(''),
  phone: z.string().optional().default(''),
  appointedAt: z.string().optional().default(''),
  notes: z.string().max(1000, 'الملاحظات طويلة جداً').optional().default(''),
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

    if (!['create', 'update', 'delete'].includes(action)) {
      return NextResponse.json({ error: 'عملية غير صالحة' }, { status: 400 })
    }

    // ===== حذف =====
    if (action === 'delete') {
      const parsedId = idSchema.safeParse({ id })
      if (!parsedId.success) return NextResponse.json({ error: 'المعرف مطلوب' }, { status: 400 })
      const existing = await db.branchMember.findUnique({ where: { id: parsedId.data.id } })
      if (!existing) return NextResponse.json({ error: 'العضو غير موجود' }, { status: 404 })
      await db.branchMember.delete({ where: { id: parsedId.data.id } })
      return NextResponse.json({ success: true })
    }

    // ===== إنشاء / تعديل =====
    const parsed = memberSchema.safeParse(data)
    if (!parsed.success) return NextResponse.json({ error: firstIssue(parsed.error) }, { status: 400 })

    const branch = await db.branch.findUnique({ where: { id: parsed.data.branchId } })
    if (!branch) return NextResponse.json({ error: 'الفرع المحدد غير موجود' }, { status: 400 })

    // ترتيب تلقائي حسب المنصب الهرمي
    const rank = POSITION_ORDER.indexOf(parsed.data.position)
    const sortOrder = rank >= 0 ? rank : POSITION_ORDER.length + 1

    const payload = {
      branchId: parsed.data.branchId,
      firstName: parsed.data.firstName,
      lastName: parsed.data.lastName,
      birthDate: parsed.data.birthDate,
      position: parsed.data.position,
      specialty: parsed.data.specialty,
      phone: parsed.data.phone,
      appointedAt: parsed.data.appointedAt,
      notes: parsed.data.notes,
      sortOrder,
    }

    if (action === 'create') {
      const item = await db.branchMember.create({ data: payload })
      return NextResponse.json({ success: true, item })
    }

    if (!id) return NextResponse.json({ error: 'المعرف مطلوب' }, { status: 400 })
    const existing = await db.branchMember.findUnique({ where: { id } })
    if (!existing) return NextResponse.json({ error: 'العضو غير موجود' }, { status: 404 })
    const item = await db.branchMember.update({ where: { id }, data: payload })
    return NextResponse.json({ success: true, item })
  } catch (e) {
    console.error('admin members error', e)
    return NextResponse.json({ error: 'فشل تنفيذ عملية العضو' }, { status: 500 })
  }
}
