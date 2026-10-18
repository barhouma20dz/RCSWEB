import { NextRequest, NextResponse } from 'next/server'
import { z } from 'zod'
import { db } from '@/lib/db'
import { getSessionAdmin, unauthorized } from '@/lib/auth'

const newsSchema = z.object({
  branchId: z.string().min(1, 'يرجى اختيار الفرع'),
  title: z.string().min(3, 'عنوان الخبر مطلوب'),
  content: z.string().min(5, 'محتوى الخبر مطلوب'),
  image: z.string().optional().default(''),
  featured: z.boolean().optional().default(false),
})

const enrollmentCreateSchema = z.object({
  branchId: z.string().min(1, 'يرجى اختيار الفرع'),
  fullName: z.string().min(3, 'الاسم الكامل مطلوب (3 أحرف على الأقل)'),
  age: z.coerce
    .number()
    .int()
    .min(5, 'العمر يجب أن يكون 5 سنوات على الأقل')
    .max(60, 'العمر الأقصى للتسجيل 60 سنة'),
  phone: z.string().regex(/^[0-9+\s-]{9,15}$/, 'رقم هاتف غير صالح'),
  note: z.string().max(500).optional().default(''),
})

const enrollmentStatusSchema = z.object({
  status: z.enum(['pending', 'accepted', 'rejected']),
})

const productSchema = z.object({
  name: z.string().min(2, 'اسم المنتج مطلوب'),
  description: z.string().max(1000).optional().default(''),
  price: z.coerce.number().int().min(0, 'السعر غير صالح').max(10000000, 'السعر كبير جداً'),
  image: z.string().optional().default(''),
  category: z.string().optional().default('ملابس'),
  active: z.boolean().optional().default(true),
})

const videoSchema = z.object({
  title: z.string().min(2, 'عنوان الفيديو مطلوب'),
  url: z.string().min(3, 'رابط الفيديو مطلوب'),
  thumb: z.string().optional().default(''),
  branchId: z.string().optional(),
})

const orderStatusSchema = z.object({
  status: z.enum(['pending', 'done']),
})

const idSchema = z.object({
  id: z.string().min(1, 'المعرف مطلوب'),
})

function firstIssue(e: z.ZodError): string {
  return e.issues[0]?.message || 'بيانات غير صالحة'
}

function missingId() {
  return NextResponse.json({ error: 'المعرف مطلوب' }, { status: 400 })
}

function itemNotFound() {
  return NextResponse.json({ error: 'العنصر غير موجود' }, { status: 404 })
}

async function ensureBranchExists(branchId: string): Promise<boolean> {
  const branch = await db.branch.findUnique({ where: { id: branchId } })
  return Boolean(branch)
}

export async function POST(req: NextRequest) {
  try {
    const admin = await getSessionAdmin(req)
    if (!admin) return unauthorized()

    const body = await req.json().catch(() => null)
    const action = body?.action as string
    const type = body?.type as string
    const id = body?.id as string | undefined
    const data = body?.data ?? {}

    if (!['news', 'enrollment', 'message', 'product', 'order', 'video'].includes(type)) {
      return NextResponse.json({ error: 'نوع غير معروف' }, { status: 400 })
    }
    if (!['create', 'update', 'delete'].includes(action)) {
      return NextResponse.json({ error: 'عملية غير صالحة' }, { status: 400 })
    }

    // ===== الأخبار =====
    if (type === 'news') {
      if (action === 'delete') {
        if (!id) return missingId()
        const existing = await db.news.findUnique({ where: { id } })
        if (!existing) return itemNotFound()
        await db.news.delete({ where: { id } })
        return NextResponse.json({ success: true })
      }

      const parsed = newsSchema.safeParse(data)
      if (!parsed.success) return NextResponse.json({ error: firstIssue(parsed.error) }, { status: 400 })
      if (!(await ensureBranchExists(parsed.data.branchId))) {
        return NextResponse.json({ error: 'الفرع المحدد غير موجود' }, { status: 400 })
      }

      const payload = {
        branchId: parsed.data.branchId,
        title: parsed.data.title,
        content: parsed.data.content,
        image: parsed.data.image,
        featured: parsed.data.featured,
      }

      if (action === 'create') {
        const item = await db.news.create({ data: payload })
        return NextResponse.json({ success: true, item })
      }

      if (!id) return missingId()
      const existing = await db.news.findUnique({ where: { id } })
      if (!existing) return itemNotFound()
      const item = await db.news.update({ where: { id }, data: payload })
      return NextResponse.json({ success: true, item })
    }

    // ===== طلبات الانضمام =====
    if (type === 'enrollment') {
      if (action === 'delete') {
        if (!id) return missingId()
        const existing = await db.enrollment.findUnique({ where: { id } })
        if (!existing) return itemNotFound()
        await db.enrollment.delete({ where: { id } })
        return NextResponse.json({ success: true })
      }

      if (action === 'update') {
        const parsed = enrollmentStatusSchema.safeParse(data)
        if (!parsed.success) return NextResponse.json({ error: firstIssue(parsed.error) }, { status: 400 })
        if (!id) return missingId()
        const existing = await db.enrollment.findUnique({ where: { id } })
        if (!existing) return itemNotFound()
        const item = await db.enrollment.update({ where: { id }, data: { status: parsed.data.status } })
        return NextResponse.json({ success: true, item })
      }

      const parsed = enrollmentCreateSchema.safeParse(data)
      if (!parsed.success) return NextResponse.json({ error: firstIssue(parsed.error) }, { status: 400 })
      if (!(await ensureBranchExists(parsed.data.branchId))) {
        return NextResponse.json({ error: 'الفرع المحدد غير موجود' }, { status: 400 })
      }

      const item = await db.enrollment.create({
        data: {
          fullName: parsed.data.fullName,
          age: parsed.data.age,
          phone: parsed.data.phone,
          note: parsed.data.note,
          branchId: parsed.data.branchId,
        },
      })
      return NextResponse.json({ success: true, item })
    }

    // ===== رسائل التواصل (حذف فقط) =====
    if (type === 'message') {
      if (action !== 'delete') {
        return NextResponse.json({ error: 'يمكن حذف الرسائل فقط' }, { status: 400 })
      }
      const parsed = idSchema.safeParse({ id: id ?? data?.id })
      if (!parsed.success) return missingId()
      const existing = await db.contactMessage.findUnique({ where: { id: parsed.data.id } })
      if (!existing) return itemNotFound()
      await db.contactMessage.delete({ where: { id: parsed.data.id } })
      return NextResponse.json({ success: true })
    }

    // ===== المنتجات =====
    if (type === 'product') {
      if (action === 'delete') {
        if (!id) return missingId()
        const existing = await db.product.findUnique({ where: { id } })
        if (!existing) return itemNotFound()
        await db.product.delete({ where: { id } })
        return NextResponse.json({ success: true })
      }

      const parsed = productSchema.safeParse(data)
      if (!parsed.success) return NextResponse.json({ error: firstIssue(parsed.error) }, { status: 400 })

      const payload = {
        name: parsed.data.name,
        description: parsed.data.description,
        price: parsed.data.price,
        image: parsed.data.image,
        category: parsed.data.category,
        active: parsed.data.active,
      }

      if (action === 'create') {
        const item = await db.product.create({ data: payload })
        return NextResponse.json({ success: true, item })
      }

      if (!id) return missingId()
      const existing = await db.product.findUnique({ where: { id } })
      if (!existing) return itemNotFound()
      const item = await db.product.update({ where: { id }, data: payload })
      return NextResponse.json({ success: true, item })
    }

    // ===== طلبات المتجر =====
    if (type === 'order') {
      if (action === 'create') {
        return NextResponse.json({ error: 'تأتي طلبات المتجر من الزوار فقط' }, { status: 400 })
      }

      if (action === 'update') {
        const parsed = orderStatusSchema.safeParse(data)
        if (!parsed.success) return NextResponse.json({ error: firstIssue(parsed.error) }, { status: 400 })
        if (!id) return missingId()
        const existing = await db.shopOrder.findUnique({ where: { id } })
        if (!existing) return itemNotFound()
        const item = await db.shopOrder.update({ where: { id }, data: { status: parsed.data.status } })
        return NextResponse.json({ success: true, item })
      }

      if (!id) return missingId()
      const existing = await db.shopOrder.findUnique({ where: { id } })
      if (!existing) return itemNotFound()
      await db.shopOrder.delete({ where: { id } })
      return NextResponse.json({ success: true })
    }

    // ===== الفيديوهات =====
    if (type === 'video') {
      if (action === 'delete') {
        if (!id) return missingId()
        const existing = await db.videoItem.findUnique({ where: { id } })
        if (!existing) return itemNotFound()
        await db.videoItem.delete({ where: { id } })
        return NextResponse.json({ success: true })
      }

      const parsed = videoSchema.safeParse(data)
      if (!parsed.success) return NextResponse.json({ error: firstIssue(parsed.error) }, { status: 400 })
      if (parsed.data.branchId && !(await ensureBranchExists(parsed.data.branchId))) {
        return NextResponse.json({ error: 'الفرع المحدد غير موجود' }, { status: 400 })
      }

      const payload = {
        title: parsed.data.title,
        url: parsed.data.url,
        thumb: parsed.data.thumb,
        branchId: parsed.data.branchId || null,
      }

      if (action === 'create') {
        const item = await db.videoItem.create({ data: payload })
        return NextResponse.json({ success: true, item })
      }

      if (!id) return missingId()
      const existing = await db.videoItem.findUnique({ where: { id } })
      if (!existing) return itemNotFound()
      const item = await db.videoItem.update({ where: { id }, data: payload })
      return NextResponse.json({ success: true, item })
    }

    return NextResponse.json({ error: 'نوع غير معروف' }, { status: 400 })
  } catch (e) {
    if (e instanceof z.ZodError) {
      return NextResponse.json({ error: firstIssue(e) }, { status: 400 })
    }
    console.error('admin items error', e)
    return NextResponse.json({ error: 'حدث خطأ أثناء تنفيذ العملية' }, { status: 500 })
  }
}
