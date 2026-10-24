import { NextRequest, NextResponse } from 'next/server'
import { z } from 'zod'
import { clientIp } from '@/lib/auth'
import { publicFormLimit } from '@/lib/rate-limit'
import { buildEnrollmentFormPayload, normalizePhone } from '@/lib/enroll-form'

/**
 * إعادة إنشاء استمارة الانخراط الرسمية لمنخرط مسجل سابقاً — بوابة عامة:
 * تتطلب الهاتف + اللقب (نفس تحقق تتبع الطلب) حتى لا يطّلع أي طرف
 * على بيانات شخصية بمجرد معرفة المعرّف.
 */
const schema = z.object({
  id: z.string().min(1),
  phone: z.string().min(6),
  lastName: z.string().min(2),
})

export async function POST(req: NextRequest) {
  try {
    const limit = publicFormLimit('enroll-form', clientIp(req))
    if (!limit.allowed) {
      return NextResponse.json(
        { error: `محاولات كثيرة — أعد المحاولة بعد ${Math.ceil(limit.retryAfter / 60)} دقيقة` },
        { status: 429, headers: { 'Retry-After': String(limit.retryAfter) } }
      )
    }

    const body = await req.json().catch(() => null)
    const parsed = schema.safeParse(body)
    if (!parsed.success) return NextResponse.json({ error: 'بيانات غير صالحة' }, { status: 400 })

    const payload = await buildEnrollmentFormPayload(parsed.data.id)
    // رد موحّد بلا تفاصيل حتى لا يكشف وجود المعرّف أو عدم تطابق التحقق
    if (!payload) return NextResponse.json({ error: 'لم يتم العثور على الطلب' }, { status: 404 })

    const phoneOk = normalizePhone(payload.enrollment.phone) === normalizePhone(parsed.data.phone)
    const nameOk =
      payload.enrollment.lastName.trim().toLowerCase() === parsed.data.lastName.trim().toLowerCase()
    if (!phoneOk || !nameOk) {
      return NextResponse.json({ error: 'لم يتم العثور على الطلب' }, { status: 404 })
    }

    return NextResponse.json(payload)
  } catch (e) {
    console.error('public enroll-form error', e)
    return NextResponse.json({ error: 'حدث خطأ أثناء جلب الاستمارة' }, { status: 500 })
  }
}
