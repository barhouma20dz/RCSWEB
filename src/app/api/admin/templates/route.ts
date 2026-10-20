import { NextRequest, NextResponse } from 'next/server'
import { z } from 'zod'
import { db } from '@/lib/db'
import { getSessionAdmin, unauthorized } from '@/lib/auth'

/**
 * ============================================================
 *  مكتب النادي — إدارة قوالب النماذج والمراجع الإدارية
 * ============================================================
 *  GET    ?id=...  → قالب واحد مع الملف (للإصدار/المعاينة)
 *  GET             → قائمة كل القوالب بدون fileData (ثقيل — يُجلب عند الطلب)
 *  POST            → إنشاء قالب (رفع نموذج جديد بصيغة data URL)
 *  PATCH           → تحديث بيانات القالب (الاسم، التصنيف، النوع، الحقول، التفعيل)
 *  DELETE          → حذف قالب نهائياً
 * ============================================================
 */

/** الحد الأقصى لحجم ملف النموذج: ~8 ميغابايت (data URL base64) */
const MAX_FILE_BYTES = 8 * 1024 * 1024

/** حقل نصي قابل للتعبئة فوق قالب — الإحداثيات نسب مئوية 0-100 من صفحة A4 */
const fieldSchema = z.object({
  key: z
    .string()
    .min(1, 'مفتاح الحقل مطلوب')
    .max(40, 'مفتاح الحقل طويل جداً')
    .regex(/^[a-zA-Z_][a-zA-Z0-9_]*$/, 'مفتاح الحقل يجب أن يكون بحروف لاتينية بدون مسافات'),
  label: z.string().max(80, 'تسمية الحقل طويلة جداً').optional().default(''),
  x: z
    .number({ message: 'إحداثية x يجب أن تكون رقماً' })
    .min(0, 'إحداثية x بين 0 و 100')
    .max(100, 'إحداثية x بين 0 و 100'),
  y: z
    .number({ message: 'إحداثية y يجب أن تكون رقماً' })
    .min(0, 'إحداثية y بين 0 و 100')
    .max(100, 'إحداثية y بين 0 و 100'),
  w: z
    .number({ message: 'عرض الصندوق يجب أن يكون رقماً' })
    .min(2, 'عرض الصندوق 2% على الأقل')
    .max(100, 'عرض الصندوق بين 2 و 100')
    .optional()
    .default(24),
  size: z
    .number({ message: 'حجم الخط يجب أن يكون رقماً' })
    .min(5, 'حجم الخط 5 على الأقل')
    .max(48, 'حجم الخط 48 كحد أقصى')
    .optional()
    .default(12),
  bold: z.boolean().optional().default(false),
})

const fieldsListSchema = z.array(fieldSchema).max(40, 'لا يمكن تجاوز 40 حقلاً في نموذج واحد')

/** التحقق من صيغة data URL للملفات المقبولة (صورة أو PDF) */
function validateFileData(fileData: string): string | null {
  if (!fileData.startsWith('data:')) return 'ملف النموذج يجب أن يكون بصيغة data URL صالحة'
  const match = fileData.match(/^data:((image\/(png|jpeg|jpg|webp|gif|svg\+xml))|(application\/pdf));base64,/)
  if (!match) return 'صيغة الملف غير مدعومة — المقبول: صورة PNG/JPG/WebP أو ملف PDF'
  const base64 = fileData.slice(fileData.indexOf(',') + 1)
  if (!base64) return 'ملف النموذج فارغ'
  const bytes = Math.floor((base64.length * 3) / 4)
  if (bytes > MAX_FILE_BYTES) return 'حجم الملف كبير جداً — الحد الأقصى 8 ميغابايت'
  return null
}

const createSchema = z.object({
  name: z.string().min(2, 'اسم النموذج مطلوب (حرفان على الأقل)').max(120, 'اسم النموذج طويل جداً'),
  kind: z.enum(['template', 'reference'], { message: "نوع النموذج يجب أن يكون 'template' أو 'reference'" }),
  category: z.string().max(80, 'التصنيف طويل جداً').optional().default(''),
  fileType: z.enum(['image', 'pdf'], { message: "نوع الملف يجب أن يكون 'image' أو 'pdf'" }),
  fileData: z.string().min(1, 'ملف النموذج مطلوب (صورة أو PDF)'),
  fields: fieldsListSchema.optional().default([]),
})

const updateSchema = z.object({
  name: z.string().min(2, 'اسم النموذج مطلوب (حرفان على الأقل)').max(120, 'اسم النموذج طويل جداً').optional(),
  category: z.string().max(80, 'التصنيف طويل جداً').optional(),
  kind: z.enum(['template', 'reference'], { message: "نوع النموذج يجب أن يكون 'template' أو 'reference'" }).optional(),
  fields: fieldsListSchema.optional(),
  active: z.boolean({ message: 'قيمة التفعيل يجب أن تكون صحيحة/خاطئة' }).optional(),
})

const idSchema = z.object({ id: z.string().min(1, 'المعرف مطلوب') })

function firstIssue(e: z.ZodError): string {
  return e.issues[0]?.message || 'بيانات غير صالحة'
}

/** بيانات القالب كما تُعاد في القائمة (بدون fileData الثقيل) */
function listShape(t: {
  id: string
  name: string
  kind: string
  category: string
  fileType: string
  fields: string
  active: boolean
  createdAt: Date
  updatedAt: Date
}) {
  let fields: unknown = []
  try {
    fields = JSON.parse(t.fields)
  } catch {
    fields = []
  }
  return { ...t, fields }
}

export async function GET(req: NextRequest) {
  try {
    const admin = await getSessionAdmin(req)
    if (!admin) return unauthorized()

    const id = req.nextUrl.searchParams.get('id')

    // قالب واحد مع الملف — للإصدار والمعاينة وتعديل الحقول
    if (id) {
      const parsedId = idSchema.safeParse({ id })
      if (!parsedId.success) return NextResponse.json({ error: firstIssue(parsedId.error) }, { status: 400 })
      const t = await db.documentTemplate.findUnique({ where: { id: parsedId.data.id } })
      if (!t) return NextResponse.json({ error: 'النموذج غير موجود' }, { status: 404 })
      let fields: unknown = []
      try {
        fields = JSON.parse(t.fields)
      } catch {
        fields = []
      }
      return NextResponse.json({ template: { ...t, fields } })
    }

    // القائمة الكاملة بدون fileData
    const templates = await db.documentTemplate.findMany({ orderBy: { createdAt: 'desc' } })
    return NextResponse.json({ templates: templates.map(listShape) })
  } catch (e) {
    console.error('admin templates GET error', e)
    return NextResponse.json({ error: 'فشل تحميل قوالب مكتب النادي' }, { status: 500 })
  }
}

export async function POST(req: NextRequest) {
  try {
    const admin = await getSessionAdmin(req)
    if (!admin) return unauthorized()

    const body = await req.json().catch(() => null)
    const parsed = createSchema.safeParse(body)
    if (!parsed.success) return NextResponse.json({ error: firstIssue(parsed.error) }, { status: 400 })

    const fileError = validateFileData(parsed.data.fileData)
    if (fileError) return NextResponse.json({ error: fileError }, { status: 400 })

    const item = await db.documentTemplate.create({
      data: {
        name: parsed.data.name,
        kind: parsed.data.kind,
        category: parsed.data.category,
        fileType: parsed.data.fileType,
        fileData: parsed.data.fileData,
        fields: JSON.stringify(parsed.data.fields),
        active: true,
      },
    })
    return NextResponse.json({
      success: true,
      item: { ...item, fileData: undefined, fields: JSON.parse(item.fields) },
    })
  } catch (e) {
    console.error('admin templates POST error', e)
    return NextResponse.json({ error: 'فشل إنشاء النموذج' }, { status: 500 })
  }
}

export async function PATCH(req: NextRequest) {
  try {
    const admin = await getSessionAdmin(req)
    if (!admin) return unauthorized()

    const body = await req.json().catch(() => null)
    const id = body?.id
    const data = body?.data ?? {}

    const parsedId = idSchema.safeParse({ id })
    if (!parsedId.success) return NextResponse.json({ error: firstIssue(parsedId.error) }, { status: 400 })
    const parsed = updateSchema.safeParse(data)
    if (!parsed.success) return NextResponse.json({ error: firstIssue(parsed.error) }, { status: 400 })
    if (Object.keys(parsed.data).length === 0) {
      return NextResponse.json({ error: 'لا توجد بيانات لتحديثها' }, { status: 400 })
    }

    const existing = await db.documentTemplate.findUnique({ where: { id: parsedId.data.id } })
    if (!existing) return NextResponse.json({ error: 'النموذج غير موجود' }, { status: 404 })

    // ملاحظة معمارية: fileData لا يُعدَّل عبر PATCH — يُستبدل بحذف القالب وإنشائه من جديد
    const item = await db.documentTemplate.update({
      where: { id: parsedId.data.id },
      data: {
        ...(parsed.data.name !== undefined ? { name: parsed.data.name } : {}),
        ...(parsed.data.category !== undefined ? { category: parsed.data.category } : {}),
        ...(parsed.data.kind !== undefined ? { kind: parsed.data.kind } : {}),
        ...(parsed.data.active !== undefined ? { active: parsed.data.active } : {}),
        ...(parsed.data.fields !== undefined ? { fields: JSON.stringify(parsed.data.fields) } : {}),
      },
    })
    return NextResponse.json({
      success: true,
      item: { ...item, fileData: undefined, fields: JSON.parse(item.fields) },
    })
  } catch (e) {
    console.error('admin templates PATCH error', e)
    return NextResponse.json({ error: 'فشل تحديث النموذج' }, { status: 500 })
  }
}

export async function DELETE(req: NextRequest) {
  try {
    const admin = await getSessionAdmin(req)
    if (!admin) return unauthorized()

    const body = await req.json().catch(() => null)
    const parsedId = idSchema.safeParse({ id: body?.id })
    if (!parsedId.success) return NextResponse.json({ error: firstIssue(parsedId.error) }, { status: 400 })

    const existing = await db.documentTemplate.findUnique({ where: { id: parsedId.data.id } })
    if (!existing) return NextResponse.json({ error: 'النموذج غير موجود' }, { status: 404 })

    await db.documentTemplate.delete({ where: { id: parsedId.data.id } })
    return NextResponse.json({ success: true })
  } catch (e) {
    console.error('admin templates DELETE error', e)
    return NextResponse.json({ error: 'فشل حذف النموذج' }, { status: 500 })
  }
}
