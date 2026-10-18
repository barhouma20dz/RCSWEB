import { NextRequest, NextResponse } from 'next/server'
import { z } from 'zod'
import { db } from '@/lib/db'
import { getSessionAdmin, unauthorized, badRequest, hashPassword } from '@/lib/auth'

const slugSchema = z
  .string()
  .min(2, 'المعرف (slug) يجب أن يكون حرفين على الأقل')
  .max(50, 'المعرف (slug) طويل جداً')
  .transform((s) => s.trim().toLowerCase())
  .pipe(
    z
      .string()
      .regex(/^[a-z0-9]+(?:-[a-z0-9]+)*$/, 'المعرف (slug) يجب أن يحتوي أحرفاً إنجليزية صغيرة وأرقاماً وشرطات فقط')
  )

const usernameSchema = z
  .string()
  .min(3, 'اسم المستخدم يجب أن يكون 3 أحرف على الأقل')
  .max(30, 'اسم المستخدم طويل جداً')
  .transform((s) => s.trim().toLowerCase())
  .pipe(
    z
      .string()
      .regex(/^[a-z0-9_-]+$/, 'اسم المستخدم يجب أن يحتوي أحرفاً إنجليزية صغيرة وأرقاماً وشرطات سفلية فقط')
  )

const credentialsSchema = z.object({
  username: usernameSchema,
  password: z.string().min(6, 'كلمة المرور يجب أن تكون 6 أحرف على الأقل').max(100),
})

const createSchema = z.object({
  slug: slugSchema,
  name: z.string().min(2, 'اسم الفرع مطلوب'),
  motto: z.string().max(120).optional().default(''),
  description: z.string().max(2000).optional().default(''),
  icon: z.string().optional().default('Trophy'),
  color: z.string().regex(/^#[0-9a-fA-F]{6}$/, 'صيغة اللون غير صالحة').optional().default('#16a34a'),
  image: z.string().optional().default(''),
  visible: z.boolean().optional().default(true),
  sortOrder: z.coerce.number().int().min(0).max(999).optional(),
})

const updateSchema = z.object({
  id: z.string().min(1, 'معرف الفرع مطلوب'),
  slug: slugSchema.optional(),
  name: z.string().min(2, 'اسم الفرع مطلوب').optional(),
  motto: z.string().max(120).optional(),
  description: z.string().max(2000).optional(),
  icon: z.string().optional(),
  color: z.string().regex(/^#[0-9a-fA-F]{6}$/, 'صيغة اللون غير صالحة').optional(),
  image: z.string().optional(),
  visible: z.boolean().optional(),
  sortOrder: z.coerce.number().int().min(0).max(999).optional(),
})

function firstIssue(e: z.ZodError): string {
  return e.issues[0]?.message || 'بيانات غير صالحة'
}

/** التأكد من أن اسم المستخدم لا يتعارض مع حساب مكتب آخر أو حساب الإدارة */
async function ensureUsernameFree(username: string, excludeBranchId?: string): Promise<string | null> {
  const clash = await db.branchAccount.findFirst({
    where: { username, ...(excludeBranchId ? { NOT: { branchId: excludeBranchId } } : {}) },
  })
  if (clash) return 'اسم المستخدم مستخدم بالفعل لحساب فرع آخر'
  const adminClash = await db.admin.findUnique({ where: { username } })
  if (adminClash) return 'اسم المستخدم محجوز لحساب الإدارة'
  return null
}

export async function POST(req: NextRequest) {
  try {
    const admin = await getSessionAdmin(req)
    if (!admin) return unauthorized()

    const body = await req.json().catch(() => null)
    const action = body?.action as string
    const data = body?.data ?? {}

    if (!['create', 'update', 'delete'].includes(action)) {
      return badRequest('عملية غير صالحة')
    }

    // ===== إنشاء فرع =====
    if (action === 'create') {
      const parsed = createSchema.safeParse(data)
      if (!parsed.success) return badRequest(firstIssue(parsed.error))

      const exists = await db.branch.findUnique({ where: { slug: parsed.data.slug } })
      if (exists) return badRequest('هذا المعرف (slug) مستخدم لفرع آخر')

      let credentials: z.infer<typeof credentialsSchema> | null = null
      if (body?.credentials) {
        const creds = credentialsSchema.safeParse(body.credentials)
        if (!creds.success) return badRequest(firstIssue(creds.error))
        const clash = await ensureUsernameFree(creds.data.username)
        if (clash) return badRequest(clash)
        credentials = creds.data
      }

      const maxSort = await db.branch.aggregate({ _max: { sortOrder: true } })
      const branch = await db.$transaction(async (tx) => {
        const created = await tx.branch.create({
          data: {
            slug: parsed.data.slug,
            name: parsed.data.name,
            motto: parsed.data.motto,
            description: parsed.data.description,
            icon: parsed.data.icon,
            color: parsed.data.color,
            image: parsed.data.image,
            visible: parsed.data.visible,
            sortOrder: parsed.data.sortOrder ?? (maxSort._max.sortOrder ?? 0) + 1,
          },
        })
        if (credentials) {
          await tx.branchAccount.create({
            data: {
              username: credentials.username,
              passwordHash: hashPassword(credentials.password),
              branchId: created.id,
            },
          })
        }
        return created
      })

      return NextResponse.json({
        success: true,
        branch,
        accountUsername: credentials?.username ?? null,
      })
    }

    // ===== تعديل فرع =====
    if (action === 'update') {
      const parsed = updateSchema.safeParse(data)
      if (!parsed.success) return badRequest(firstIssue(parsed.error))

      const { id, ...fields } = parsed.data
      if (Object.keys(fields).length === 0 && !body?.credentials) {
        return badRequest('لا توجد بيانات للتحديث')
      }

      const branch = await db.branch.findUnique({ where: { id } })
      if (!branch) return NextResponse.json({ error: 'الفرع غير موجود' }, { status: 404 })

      if (fields.slug && fields.slug !== branch.slug) {
        const taken = await db.branch.findUnique({ where: { slug: fields.slug } })
        if (taken) return badRequest('هذا المعرف (slug) مستخدم لفرع آخر')
      }

      let credentials: z.infer<typeof credentialsSchema> | null = null
      if (body?.credentials) {
        const creds = credentialsSchema.safeParse(body.credentials)
        if (!creds.success) return badRequest(firstIssue(creds.error))
        const clash = await ensureUsernameFree(creds.data.username, id)
        if (clash) return badRequest(clash)
        credentials = creds.data
      }

      const updated = await db.$transaction(async (tx) => {
        const branchUpdated = await tx.branch.update({ where: { id }, data: fields })
        if (credentials) {
          const passwordHash = hashPassword(credentials.password)
          await tx.branchAccount.upsert({
            where: { branchId: id },
            update: { username: credentials.username, passwordHash },
            create: { username: credentials.username, passwordHash, branchId: id },
          })
        }
        return branchUpdated
      })

      return NextResponse.json({ success: true, branch: updated })
    }

    // ===== حذف فرع =====
    const parsed = z.object({ id: z.string().min(1, 'معرف الفرع مطلوب') }).safeParse(data)
    if (!parsed.success) return badRequest(firstIssue(parsed.error))

    const branch = await db.branch.findUnique({ where: { id: parsed.data.id } })
    if (!branch) return NextResponse.json({ error: 'الفرع غير موجود' }, { status: 404 })

    await db.branch.delete({ where: { id: parsed.data.id } })
    return NextResponse.json({ success: true })
  } catch (e) {
    console.error('admin branches error', e)
    return NextResponse.json({ error: 'حدث خطأ أثناء تنفيذ العملية' }, { status: 500 })
  }
}
