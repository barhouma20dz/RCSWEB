import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { getSessionAccount, unauthorized } from '@/lib/auth'

/**
 * رسوم الاشتراك حسب الفرع — يفعّل/يعطّل مكتب الفرع إظهار قسم الرسوم
 * في استمارة انخراط فرعه (يُحدَّد أيضاً من إدارة النادي في إعدادات الموقع).
 *
 * GET  → الحالة الحالية: { enabled, override, globalDefault }
 * POST { enabled: boolean } → يكتب تجاوز الفرع في enrollment.form.feeByBranch[slug]
 */

async function readFormSettings(): Promise<Record<string, unknown>> {
  try {
    const setting = await db.siteSetting.findUnique({ where: { key: 'site' } })
    if (!setting) return {}
    const parsed = JSON.parse(setting.value) as { enrollment?: { form?: Record<string, unknown> } }
    return parsed?.enrollment?.form ?? {}
  } catch {
    return {}
  }
}

export async function GET(req: NextRequest) {
  try {
    const account = await getSessionAccount(req)
    if (!account) return unauthorized()

    const form = await readFormSettings()
    const feeTiers = (form.feeTiers ?? {}) as { enabled?: boolean }
    const feeByBranch = (form.feeByBranch ?? {}) as Record<string, boolean>

    const branch = await db.branch.findUnique({ where: { id: account.branchId }, select: { slug: true } })
    if (!branch) return NextResponse.json({ error: 'الفرع غير موجود' }, { status: 404 })

    const override = branch.slug in feeByBranch ? feeByBranch[branch.slug] : null
    return NextResponse.json({
      enabled: override ?? feeTiers.enabled !== false,
      override,
      globalDefault: feeTiers.enabled !== false,
    })
  } catch (e) {
    console.error('office enroll-fee get error', e)
    return NextResponse.json({ error: 'فشل جلب إعدادات الرسوم' }, { status: 500 })
  }
}

export async function POST(req: NextRequest) {
  try {
    const account = await getSessionAccount(req)
    if (!account) return unauthorized()

    const body = await req.json().catch(() => null)
    const enabled = (body as { enabled?: unknown } | null)?.enabled
    if (typeof enabled !== 'boolean') {
      return NextResponse.json({ error: 'قيمة التفعيل غير صالحة' }, { status: 400 })
    }

    const branch = await db.branch.findUnique({ where: { id: account.branchId }, select: { slug: true } })
    if (!branch) return NextResponse.json({ error: 'الفرع غير موجود' }, { status: 404 })

    // قراءة الإعدادات الحالية وتحديث تجاوز هذا الفرع فقط
    const setting = await db.siteSetting.findUnique({ where: { key: 'site' } })
    let settings: Record<string, unknown> = {}
    if (setting) {
      try {
        settings = JSON.parse(setting.value) as Record<string, unknown>
      } catch {
        settings = {}
      }
    }
    const enrollment = (settings.enrollment ?? {}) as Record<string, unknown>
    const form = (enrollment.form ?? {}) as Record<string, unknown>
    const feeByBranch = {
      ...((form.feeByBranch ?? {}) as Record<string, unknown>),
      [branch.slug]: enabled,
    }
    const next = {
      ...settings,
      enrollment: { ...enrollment, form: { ...form, feeByBranch } },
    }
    await db.siteSetting.upsert({
      where: { key: 'site' },
      update: { value: JSON.stringify(next) },
      create: { key: 'site', value: JSON.stringify(next) },
    })

    return NextResponse.json({ success: true, enabled })
  } catch (e) {
    console.error('office enroll-fee post error', e)
    return NextResponse.json({ error: 'فشل تحديث إعدادات الرسوم' }, { status: 500 })
  }
}
