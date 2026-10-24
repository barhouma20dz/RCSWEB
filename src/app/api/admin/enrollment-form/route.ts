import { NextRequest, NextResponse } from 'next/server'
import { getSessionAdmin, unauthorized } from '@/lib/auth'
import { buildEnrollmentFormPayload } from '@/lib/enroll-form'

/**
 * استمارة الانخراط الرسمية — للإدارة العامة (أي منخرط من أي فرع).
 */
export async function GET(req: NextRequest) {
  try {
    const admin = await getSessionAdmin(req)
    if (!admin) return unauthorized()

    const id = req.nextUrl.searchParams.get('id') ?? ''
    if (!id) return NextResponse.json({ error: 'المعرف مطلوب' }, { status: 400 })

    const payload = await buildEnrollmentFormPayload(id)
    if (!payload) return NextResponse.json({ error: 'الطلب غير موجود' }, { status: 404 })
    return NextResponse.json(payload)
  } catch (e) {
    console.error('admin enrollment-form error', e)
    return NextResponse.json({ error: 'حدث خطأ أثناء جلب الاستمارة' }, { status: 500 })
  }
}
