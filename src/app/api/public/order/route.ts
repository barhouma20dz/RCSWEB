import { NextRequest, NextResponse } from 'next/server'
import { z } from 'zod'
import { db } from '@/lib/db'
import { clientIp } from '@/lib/auth'
import { publicFormLimit } from '@/lib/rate-limit'

const schema = z.object({
  productId: z.string().min(1, 'يرجى تحديد المنتج'),
  customerName: z.string().min(2, 'الاسم مطلوب'),
  phone: z.string().regex(/^[0-9+\s-]{9,15}$/, 'رقم هاتف غير صالح'),
  size: z.string().max(20).optional().default(''),
  note: z.string().max(500).optional().default(''),
})

export async function POST(req: NextRequest) {
  try {
    // حد طلبات المتجر: 8 طلبات / 10 دقائق لكل IP
    const limit = publicFormLimit('order', clientIp(req))
    if (!limit.allowed) {
      return NextResponse.json(
        { error: `طلبات كثيرة جداً — أعد المحاولة بعد ${Math.ceil(limit.retryAfter / 60)} دقيقة` },
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

    const product = await db.product.findUnique({ where: { id: parsed.data.productId } })
    if (!product || !product.active) {
      return NextResponse.json({ error: 'المنتج غير متاح حالياً' }, { status: 400 })
    }

    const order = await db.shopOrder.create({
      data: {
        productId: product.id,
        customerName: parsed.data.customerName,
        phone: parsed.data.phone,
        size: parsed.data.size,
        note: parsed.data.note,
        status: 'pending',
      },
    })

    return NextResponse.json({
      success: true,
      message: 'تم استلام طلبك بنجاح! سنتواصل معك قريباً لتأكيد الطلب والتوصيل.',
      id: order.id,
    })
  } catch (e) {
    console.error('order error', e)
    return NextResponse.json({ error: 'حدث خطأ أثناء إرسال الطلب' }, { status: 500 })
  }
}
