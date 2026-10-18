import { NextRequest, NextResponse } from 'next/server'
import { z } from 'zod'
import { db } from '@/lib/db'
import { clientIp } from '@/lib/auth'
import { publicFormLimit } from '@/lib/rate-limit'

const schema = z.object({
  name: z.string().min(2, 'الاسم مطلوب'),
  email: z.string().email('بريد إلكتروني غير صالح').optional().or(z.literal('')),
  phone: z.string().max(20).optional().default(''),
  message: z.string().min(5, 'الرسالة قصيرة جداً').max(2000),
})

export async function POST(req: NextRequest) {
  try {
    // حد إرسال: 8 رسائل / 10 دقائق لكل IP — يمنع إغراق صندوق الرسائل
    const limit = publicFormLimit('contact', clientIp(req))
    if (!limit.allowed) {
      return NextResponse.json(
        { error: `رسائل كثيرة جداً — أعد المحاولة بعد ${Math.ceil(limit.retryAfter / 60)} دقيقة` },
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

    await db.contactMessage.create({
      data: {
        name: parsed.data.name,
        email: parsed.data.email || '',
        phone: parsed.data.phone || '',
        message: parsed.data.message,
      },
    })

    return NextResponse.json({ success: true, message: 'تم إرسال رسالتك بنجاح، شكراً لتواصلك معنا!' })
  } catch (e) {
    console.error('contact error', e)
    return NextResponse.json({ error: 'حدث خطأ أثناء إرسال الرسالة' }, { status: 500 })
  }
}
