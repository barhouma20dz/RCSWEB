import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { getSessionAccount, unauthorized } from '@/lib/auth'
import { buildEnrollmentFormPayload } from '@/lib/enroll-form'

/**
 * استمارة الانخراط الرسمية لمكتب الفرع — يقتصر على طلبات فرعه فقط.
 */
export async function GET(req: NextRequest) {
  try {
    const account = await getSessionAccount(req)
    if (!account) return unauthorized()

    const id = req.nextUrl.searchParams.get('id') ?? ''
    if (!id) return NextResponse.json({ error: 'المعرف مطلوب' }, { status: 400 })

    // التأكد أن الطلب يعود لفرع هذا الحساب قبل الجلب
    const owned = await db.enrollment.findFirst({ where: { id, branchId: account.branchId } })
    if (!owned) return NextResponse.json({ error: 'الطلب غير موجود' }, { status: 404 })

    const payload = await buildEnrollmentFormPayload(id)
    if (!payload) return NextResponse.json({ error: 'الطلب غير موجود' }, { status: 404 })
    return NextResponse.json(payload)
  } catch (e) {
    console.error('office enrollment-form error', e)
    return NextResponse.json({ error: 'حدث خطأ أثناء جلب الاستمارة' }, { status: 500 })
  }
}
