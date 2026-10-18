import { NextRequest, NextResponse } from 'next/server'
import { z } from 'zod'
import { db } from '@/lib/db'
import { getSessionAccount, unauthorized } from '@/lib/auth'

const schema = z.object({
  id: z.string().min(1),
  status: z.enum(['pending', 'accepted', 'rejected']),
})

const deleteSchema = z.object({
  id: z.string().min(1, 'المعرف مطلوب'),
})

export async function DELETE(req: NextRequest) {
  try {
    const account = await getSessionAccount(req)
    if (!account) return unauthorized()

    const body = await req.json().catch(() => null)
    const parsed = deleteSchema.safeParse(body)
    if (!parsed.success) return NextResponse.json({ error: 'المعرف مطلوب' }, { status: 400 })

    const enrollment = await db.enrollment.findFirst({
      where: { id: parsed.data.id, branchId: account.branchId },
    })
    if (!enrollment) return NextResponse.json({ error: 'الطلب غير موجود' }, { status: 404 })

    await db.enrollment.delete({ where: { id: parsed.data.id } })
    return NextResponse.json({ success: true })
  } catch (e) {
    console.error('enrollment delete error', e)
    return NextResponse.json({ error: 'حدث خطأ أثناء حذف الطلب' }, { status: 500 })
  }
}

export async function PATCH(req: NextRequest) {
  try {
    const account = await getSessionAccount(req)
    if (!account) return unauthorized()

    const body = await req.json().catch(() => null)
    const parsed = schema.safeParse(body)
    if (!parsed.success) return NextResponse.json({ error: 'بيانات غير صالحة' }, { status: 400 })

    const enrollment = await db.enrollment.findFirst({
      where: { id: parsed.data.id, branchId: account.branchId },
    })
    if (!enrollment) return NextResponse.json({ error: 'الطلب غير موجود' }, { status: 404 })

    const updated = await db.enrollment.update({
      where: { id: parsed.data.id },
      data: { status: parsed.data.status },
    })
    return NextResponse.json({ success: true, item: updated })
  } catch (e) {
    console.error('enrollment update error', e)
    return NextResponse.json({ error: 'حدث خطأ أثناء تحديث الطلب' }, { status: 500 })
  }
}
