import { NextRequest, NextResponse } from 'next/server'
import { z } from 'zod'
import { db } from '@/lib/db'
import { clientIp, logSecurityEvent } from '@/lib/auth'
import { statusQueryLimit } from '@/lib/rate-limit'

/**
 * استعلام عن حالة طلب الانخراط — محمي الخصوصية:
 * يتطلب رقم الهاتف + اللقب معاً (إثبات هوية بسيط) حتى لا يستطيع أي
 * شخص تعداد المنخرطين بتجربة أرقام هواتف عشوائية.
 */

const schema = z.object({
  phone: z.string().min(6, 'يرجى إدخال رقم الهاتف الذي سجلت به').max(20),
  lastName: z.string().trim().min(2, 'يرجى إدخال اللقب الذي سجلت به').max(60),
})

export async function POST(req: NextRequest) {
  try {
    const ip = clientIp(req)

    // حد استعلامات: 10 / 10 دقائق لكل IP
    const limit = statusQueryLimit(ip)
    if (!limit.allowed) {
      await logSecurityEvent('rate_limited', null, ip, 'استعلام حالة: تجاوز حد الاستعلامات')
      return NextResponse.json(
        { error: `استعلامات كثيرة جداً — أعد المحاولة بعد ${Math.ceil(limit.retryAfter / 60)} دقيقة` },
        { status: 429, headers: { 'Retry-After': String(limit.retryAfter) } }
      )
    }

    const body = await req.json().catch(() => null)
    const parsed = schema.safeParse(body)
    if (!parsed.success) {
      return NextResponse.json(
        { error: parsed.error.issues[0]?.message || 'بيانات غير صالحة' },
        { status: 400 }
      )
    }

    // مطابقة مرنة للهاتف: كما أُدخل أو بأرقام فقط (بدون فواصل وشرطات)
    const phone = parsed.data.phone.trim()
    const digits = phone.replace(/[^0-9]/g, '')
    const variants = Array.from(new Set([phone, digits].filter((p) => p.length > 0)))
    const lastName = parsed.data.lastName.trim()

    // الهاتف + اللقب معاً — لا عرض للبيانات بإحداهما فقط
    const enrollments = await db.enrollment.findMany({
      where: {
        phone: { in: variants },
        lastName: { equals: lastName },
      },
      orderBy: { createdAt: 'desc' },
      include: { branch: { select: { name: true, color: true } } },
    })

    return NextResponse.json({
      requests: enrollments.map((r) => ({
        id: r.id,
        fullName: r.fullName,
        status: r.status,
        createdAt: r.createdAt,
        branch: { name: r.branch.name, color: r.branch.color },
      })),
    })
  } catch (e) {
    console.error('enroll-status error', e)
    return NextResponse.json({ error: 'حدث خطأ أثناء الاستعلام عن حالة الطلب' }, { status: 500 })
  }
}
