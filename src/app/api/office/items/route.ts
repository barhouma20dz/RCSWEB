import { NextRequest, NextResponse } from 'next/server'
import { z } from 'zod'
import { db } from '@/lib/db'
import { getSessionAccount, unauthorized } from '@/lib/auth'

/** المناصب الرسمية بالترتيب الهرمي — نفس ترتيب الإدارة العامة */
const POSITION_ORDER = [
  'رئيس الفرع',
  'نائب رئيس الفرع',
  'الأمين العام للفرع',
  'المدير التقني للفرع',
  'نائب المدير التقني',
  'مدرب',
  'عضو مكتب الفرع',
  'عضو',
]

const memberSchema = z.object({
  firstName: z.string().min(2, 'الاسم مطلوب (حرفان على الأقل)').max(100, 'الاسم طويل جداً'),
  lastName: z.string().min(2, 'اللقب مطلوب (حرفان على الأقل)').max(100, 'اللقب طويل جداً'),
  birthDate: z.string().max(20).optional().default(''),
  position: z.string().min(2, 'المنصب مطلوب').max(100, 'المنصب طويل جداً'),
  specialty: z.string().max(200).optional().default(''),
  phone: z.string().max(20).optional().default(''),
  appointedAt: z.string().max(20).optional().default(''),
  notes: z.string().max(1000, 'الملاحظات طويلة جداً').optional().default(''),
})

const schemas = {
  news: z.object({
    title: z.string().min(3, 'عنوان الخبر مطلوب').max(200, 'عنوان الخبر طويل جداً'),
    content: z.string().min(5, 'محتوى الخبر مطلوب').max(20000, 'محتوى الخبر طويل جداً'),
    image: z.string().max(600).optional().default(''),
    featured: z.boolean().optional().default(false),
  }),
  players: z.object({
    name: z.string().min(2, 'اسم اللاعب مطلوب').max(100, 'اسم اللاعب طويل جداً'),
    position: z.string().max(100).optional().default(''),
    number: z.coerce.number().int().min(0).max(99).optional().nullable(),
    age: z.coerce.number().int().min(5).max(60).optional().nullable(),
    photo: z.string().max(600).optional().default(''),
  }),
  matches: z.object({
    opponent: z.string().min(2, 'اسم الفريق المنافس مطلوب').max(100, 'اسم الفريق طويل جداً'),
    date: z.string().min(4, 'تاريخ المباراة مطلوب').max(30),
    venue: z.enum(['home', 'away']).default('home'),
    location: z.string().max(200).optional().default(''),
    competition: z.string().max(200).optional().default(''),
    homeScore: z.coerce.number().int().min(0).max(99).optional().nullable(),
    awayScore: z.coerce.number().int().min(0).max(99).optional().nullable(),
    status: z.enum(['upcoming', 'finished']).default('upcoming'),
  }),
  trainings: z.object({
    day: z.string().min(2, 'اليوم مطلوب').max(50, 'اليوم طويل جداً'),
    time: z.string().min(2, 'التوقيت مطلوب').max(50, 'التوقيت طويل جداً'),
    location: z.string().max(200).optional().default(''),
    coach: z.string().max(100).optional().default(''),
    groupName: z.string().max(100).optional().default(''),
  }),
  gallery: z.object({
    url: z.string().min(3, 'رابط الصورة مطلوب').max(600, 'الرابط طويل جداً'),
    caption: z.string().max(300).optional().default(''),
  }),
  standing: z.object({
    teamName: z.string().min(2, 'اسم الفريق مطلوب').max(100, 'اسم الفريق طويل جداً'),
    played: z.coerce.number().int().min(0).max(999).optional().default(0),
    won: z.coerce.number().int().min(0).max(999).optional().default(0),
    drawn: z.coerce.number().int().min(0).max(999).optional().default(0),
    lost: z.coerce.number().int().min(0).max(999).optional().default(0),
    goalsFor: z.coerce.number().int().min(0).max(999).optional().default(0),
    goalsAgainst: z.coerce.number().int().min(0).max(999).optional().default(0),
    points: z.coerce.number().int().min(0).max(999).optional().default(0),
  }),
  video: z.object({
    title: z.string().min(2, 'عنوان الفيديو مطلوب').max(200, 'العنوان طويل جداً'),
    url: z.string().min(3, 'رابط الفيديو مطلوب').max(600, 'الرابط طويل جداً'),
    thumb: z.string().max(600).optional().default(''),
  }),
}

type ItemType = keyof typeof schemas

type ParseResult<T> = { ok: true; data: T } | { ok: false; error: string }

function parseWith<S extends z.ZodType>(schema: S, data: unknown): ParseResult<z.output<S>> {
  const parsed = schema.safeParse(data)
  if (!parsed.success) {
    return { ok: false, error: parsed.error.issues[0]?.message || 'بيانات غير صالحة' }
  }
  return { ok: true, data: parsed.data }
}

function parseNumberField(value: unknown): number | null {
  if (value === null || value === undefined || value === '') return null
  const n = Number(value)
  return Number.isFinite(n) ? n : null
}

interface ItemOps<T> {
  parse: () => ParseResult<T>
  find: (branchId: string, id: string) => Promise<unknown>
  create: (branchId: string, data: T) => Promise<unknown>
  update: (id: string, data: T) => Promise<unknown>
  remove: (id: string) => Promise<unknown>
}

function missingId() {
  return NextResponse.json({ error: 'المعرف مطلوب' }, { status: 400 })
}

function itemNotFound() {
  return NextResponse.json({ error: 'العنصر غير موجود' }, { status: 404 })
}

async function runItemAction<T>(
  branchId: string,
  action: string,
  id: string | undefined,
  ops: ItemOps<T>
): Promise<NextResponse> {
  // ===== الحذف =====
  if (action === 'delete') {
    if (!id) return missingId()
    const existing = await ops.find(branchId, id)
    if (!existing) return itemNotFound()
    await ops.remove(id)
    return NextResponse.json({ success: true })
  }

  const parsed = ops.parse()
  if (!parsed.ok) {
    return NextResponse.json({ error: parsed.error }, { status: 400 })
  }

  // ===== الإضافة =====
  if (action === 'create') {
    const item = await ops.create(branchId, parsed.data)
    return NextResponse.json({ success: true, item })
  }

  // ===== التعديل =====
  if (!id) return missingId()
  const existing = await ops.find(branchId, id)
  if (!existing) return itemNotFound()
  const item = await ops.update(id, parsed.data)
  return NextResponse.json({ success: true, item })
}

export async function POST(req: NextRequest) {
  try {
    const account = await getSessionAccount(req)
    if (!account) return unauthorized()
    const branchId = account.branchId

    const body = await req.json().catch(() => null)
    const action = body?.action as string
    const type = body?.type as string
    const id = body?.id as string | undefined
    const data = body?.data ?? {}

    // ===== أعضاء وإطارات الفرع (إضافة/تعديل/حذف بأمر مكتب الفرع) =====
    if (type === 'member') {
      if (!['create', 'update', 'delete'].includes(action)) {
        return NextResponse.json({ error: 'عملية غير صالحة' }, { status: 400 })
      }

      if (action === 'delete') {
        if (!id) return missingId()
        const existing = await db.branchMember.findFirst({ where: { id, branchId } })
        if (!existing) return itemNotFound()
        await db.branchMember.delete({ where: { id } })
        return NextResponse.json({ success: true })
      }

      const parsed = memberSchema.safeParse(data)
      if (!parsed.success) {
        return NextResponse.json({ error: parsed.error.issues[0]?.message || 'بيانات غير صالحة' }, { status: 400 })
      }

      // ترتيب تلقائي حسب المنصب الهرمي
      const rank = POSITION_ORDER.indexOf(parsed.data.position)
      const payload = {
        firstName: parsed.data.firstName,
        lastName: parsed.data.lastName,
        birthDate: parsed.data.birthDate,
        position: parsed.data.position,
        specialty: parsed.data.specialty,
        phone: parsed.data.phone,
        appointedAt: parsed.data.appointedAt,
        notes: parsed.data.notes,
        sortOrder: rank >= 0 ? rank : POSITION_ORDER.length + 1,
      }

      if (action === 'create') {
        const item = await db.branchMember.create({ data: { ...payload, branchId } })
        return NextResponse.json({ success: true, item })
      }

      if (!id) return missingId()
      const existing = await db.branchMember.findFirst({ where: { id, branchId } })
      if (!existing) return itemNotFound()
      const item = await db.branchMember.update({ where: { id }, data: payload })
      return NextResponse.json({ success: true, item })
    }

    // ===== تعديل معلومات الفرع =====
    if (type === 'settings') {
      if (action !== 'update') return NextResponse.json({ error: 'عملية غير صالحة' }, { status: 400 })
      const s = z
        .object({
          motto: z.string().max(120).optional(),
          description: z.string().min(10, 'الوصف يجب أن يكون 10 أحرف على الأقل').max(2000).optional(),
        })
        .parse(data)
      const updated = await db.branch.update({ where: { id: branchId }, data: s })
      return NextResponse.json({ success: true, item: updated })
    }

    if (!type || !(type in schemas)) {
      return NextResponse.json({ error: 'نوع غير معروف' }, { status: 400 })
    }
    if (!['create', 'update', 'delete'].includes(action)) {
      return NextResponse.json({ error: 'عملية غير صالحة' }, { status: 400 })
    }

    switch (type as ItemType) {
      case 'news':
        return runItemAction(branchId, action, id, {
          parse: () => parseWith(schemas.news, data),
          find: (bid, i) => db.news.findFirst({ where: { id: i, branchId: bid } }),
          create: (bid, d) => db.news.create({ data: { ...d, branchId: bid } }),
          update: (i, d) => db.news.update({ where: { id: i }, data: d }),
          remove: (i) => db.news.delete({ where: { id: i } }),
        })

      case 'players':
        return runItemAction(branchId, action, id, {
          parse: () => {
            const raw = (data ?? {}) as Record<string, unknown>
            return parseWith(schemas.players, {
              ...raw,
              number: parseNumberField(raw.number),
              age: parseNumberField(raw.age),
            })
          },
          find: (bid, i) => db.player.findFirst({ where: { id: i, branchId: bid } }),
          create: (bid, d) => db.player.create({ data: { ...d, branchId: bid } }),
          update: (i, d) => db.player.update({ where: { id: i }, data: d }),
          remove: (i) => db.player.delete({ where: { id: i } }),
        })

      case 'matches':
        return runItemAction(branchId, action, id, {
          parse: () => {
            const raw = (data ?? {}) as Record<string, unknown>
            return parseWith(schemas.matches, {
              ...raw,
              homeScore: parseNumberField(raw.homeScore),
              awayScore: parseNumberField(raw.awayScore),
            })
          },
          find: (bid, i) => db.match.findFirst({ where: { id: i, branchId: bid } }),
          create: (bid, d) => db.match.create({ data: { ...d, date: new Date(d.date), branchId: bid } }),
          update: (i, d) => db.match.update({ where: { id: i }, data: { ...d, date: new Date(d.date) } }),
          remove: (i) => db.match.delete({ where: { id: i } }),
        })

      case 'trainings':
        return runItemAction(branchId, action, id, {
          parse: () => parseWith(schemas.trainings, data),
          find: (bid, i) => db.training.findFirst({ where: { id: i, branchId: bid } }),
          create: (bid, d) => db.training.create({ data: { ...d, branchId: bid } }),
          update: (i, d) => db.training.update({ where: { id: i }, data: d }),
          remove: (i) => db.training.delete({ where: { id: i } }),
        })

      case 'gallery':
        return runItemAction(branchId, action, id, {
          parse: () => parseWith(schemas.gallery, data),
          find: (bid, i) => db.galleryItem.findFirst({ where: { id: i, branchId: bid } }),
          create: (bid, d) => db.galleryItem.create({ data: { ...d, branchId: bid } }),
          update: (i, d) => db.galleryItem.update({ where: { id: i }, data: d }),
          remove: (i) => db.galleryItem.delete({ where: { id: i } }),
        })

      case 'standing':
        return runItemAction(branchId, action, id, {
          parse: () => parseWith(schemas.standing, data),
          find: (bid, i) => db.standing.findFirst({ where: { id: i, branchId: bid } }),
          create: (bid, d) => db.standing.create({ data: { ...d, branchId: bid } }),
          update: (i, d) => db.standing.update({ where: { id: i }, data: d }),
          remove: (i) => db.standing.delete({ where: { id: i } }),
        })

      case 'video':
        return runItemAction(branchId, action, id, {
          parse: () => parseWith(schemas.video, data),
          find: (bid, i) => db.videoItem.findFirst({ where: { id: i, branchId: bid } }),
          create: (bid, d) => db.videoItem.create({ data: { ...d, branchId: bid } }),
          update: (i, d) => db.videoItem.update({ where: { id: i }, data: d }),
          remove: (i) => db.videoItem.delete({ where: { id: i } }),
        })
    }

    return NextResponse.json({ error: 'نوع غير معروف' }, { status: 400 })
  } catch (e) {
    if (e instanceof z.ZodError) {
      return NextResponse.json({ error: e.issues[0]?.message || 'بيانات غير صالحة' }, { status: 400 })
    }
    console.error('office items error', e)
    return NextResponse.json({ error: 'حدث خطأ أثناء تنفيذ العملية' }, { status: 500 })
  }
}
