import { NextRequest, NextResponse } from 'next/server'
import { z } from 'zod'
import { db } from '@/lib/db'
import { clientIp } from '@/lib/auth'
import { publicFormLimit } from '@/lib/rate-limit'

/**
 * استمارة الانخراط الموسمي — يرسل الطلب إلى الفرع المحدد في الاستمارة
 *
 * بنية الحقول حسب العمر (يُحسب آلياً من تاريخ الميلاد):
 * - المنخرط: الاسم الشخصي، اللقب، الجنس، تاريخ الميلاد (شهر/يوم/سنة)
 * - أقل من سن الرشد (18 افتراضياً — قابل للضبط من الإدارة):
 *     الاسم الكامل لولي الأمر + العنوان + رقم الهاتف
 * - سن الرشد فما فوق: العنوان الشخصي + رقم الهاتف
 *
 * إلزامية الحقول وإظهارها تُضبط من حساب الإدارة العامة (SiteSetting.enrollment)
 */

interface EnrollCfg {
  adultAge?: number
  showGender?: boolean
  showNote?: boolean
  requirePhone?: boolean
  requireAddress?: boolean
}

async function getEnrollCfg(): Promise<Required<EnrollCfg>> {
  const defaults = {
    adultAge: 18,
    showGender: true,
    showNote: true,
    requirePhone: true,
    requireAddress: true,
  }
  try {
    const setting = await db.siteSetting.findUnique({ where: { key: 'site' } })
    if (!setting) return defaults
    const parsed = JSON.parse(setting.value) as { enrollment?: EnrollCfg }
    const e = parsed?.enrollment ?? {}
    return {
      adultAge: typeof e.adultAge === 'number' && e.adultAge > 0 ? e.adultAge : defaults.adultAge,
      showGender: e.showGender !== false,
      showNote: e.showNote !== false,
      requirePhone: e.requirePhone !== false,
      requireAddress: e.requireAddress !== false,
    }
  } catch {
    return defaults
  }
}

function computeAge(birthDate: string): number {
  const bd = new Date(birthDate)
  const now = new Date()
  let age = now.getFullYear() - bd.getFullYear()
  const m = now.getMonth() - bd.getMonth()
  if (m < 0 || (m === 0 && now.getDate() < bd.getDate())) age--
  return age
}

export async function POST(req: NextRequest) {
  try {
    // حد انخراط: 8 طلبات / 10 دقائق لكل IP — يمنع إغراق طلبات الفروع
    const limit = publicFormLimit('enroll', clientIp(req))
    if (!limit.allowed) {
      return NextResponse.json(
        { error: `طلبات كثيرة جداً — أعد المحاولة بعد ${Math.ceil(limit.retryAfter / 60)} دقيقة` },
        { status: 429, headers: { 'Retry-After': String(limit.retryAfter) } }
      )
    }

    const body = (await req.json().catch(() => null)) as Record<string, unknown> | null
    if (!body) return NextResponse.json({ error: 'بيانات غير صالحة' }, { status: 400 })

    const cfg = await getEnrollCfg()

    const schema = z
      .object({
        firstName: z.string().trim().min(2, 'الاسم الشخصي مطلوب (حرفان على الأقل)'),
        lastName: z.string().trim().min(2, 'اللقب مطلوب (حرفان على الأقل)'),
        gender: z.enum(['male', 'female']).optional().default('male'),
        birthDate: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, 'تاريخ الميلاد مطلوب (شهر/يوم/سنة)'),
        address: z.string().trim().max(300).optional().default(''),
        phone: z.string().regex(/^[0-9+\s-]{9,15}$/, 'رقم هاتف غير صالح (مثال: 0770123456)'),
        parentName: z.string().trim().max(120).optional().default(''),
        branchId: z.string().min(1, 'يرجى اختيار الفرع الرياضي'),
        note: z.string().max(500).optional().default(''),
      })

    const parsed = schema.safeParse(body)
    if (!parsed.success) {
      return NextResponse.json(
        { error: parsed.error.issues[0]?.message || 'بيانات غير صالحة' },
        { status: 400 }
      )
    }

    const d = parsed.data

    // حساب العمر من تاريخ الميلاد
    const bd = new Date(d.birthDate)
    if (Number.isNaN(bd.getTime())) {
      return NextResponse.json({ error: 'تاريخ الميلاد غير صالح' }, { status: 400 })
    }
    if (bd > new Date()) {
      return NextResponse.json({ error: 'تاريخ الميلاد لا يمكن أن يكون في المستقبل' }, { status: 400 })
    }
    const age = computeAge(d.birthDate)
    if (age < 4 || age > 90) {
      return NextResponse.json({ error: 'العمر يجب أن يكون بين 4 و 90 سنة' }, { status: 400 })
    }

    // التحقق الشرطي حسب العمر وإعدادات الإدارة
    const isMinor = age < cfg.adultAge
    if (isMinor && d.parentName.trim().length < 3) {
      return NextResponse.json(
        { error: `الاسم الكامل لولي الأمر إلزامي للأقل من ${cfg.adultAge} سنة` },
        { status: 400 }
      )
    }
    if (cfg.requireAddress && !d.address.trim()) {
      return NextResponse.json({ error: 'العنوان إلزامي' }, { status: 400 })
    }
    if (cfg.requirePhone && !d.phone.trim()) {
      return NextResponse.json({ error: 'رقم الهاتف إلزامي' }, { status: 400 })
    }

    const branch = await db.branch.findUnique({ where: { id: d.branchId } })
    if (!branch) return NextResponse.json({ error: 'الفرع المختار غير موجود' }, { status: 400 })

    const enrollment = await db.enrollment.create({
      data: {
        firstName: d.firstName,
        lastName: d.lastName,
        fullName: `${d.firstName} ${d.lastName}`,
        gender: cfg.showGender ? d.gender : 'male',
        birthDate: d.birthDate,
        age,
        address: d.address,
        phone: d.phone,
        parentName: isMinor ? d.parentName : '',
        note: cfg.showNote ? d.note : '',
        branchId: d.branchId,
      },
    })

    return NextResponse.json({
      success: true,
      message: `تم استلام طلب انخراطك إلى ${branch.name} بنجاح! سيتواصل معك مكتب الفرع قريباً.`,
      id: enrollment.id,
    })
  } catch (e) {
    console.error('enroll error', e)
    return NextResponse.json({ error: 'حدث خطأ أثناء إرسال الطلب' }, { status: 500 })
  }
}
