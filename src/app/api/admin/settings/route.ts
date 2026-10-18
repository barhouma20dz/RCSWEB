import { NextRequest, NextResponse } from 'next/server'
import { z } from 'zod'
import { db } from '@/lib/db'
import { getSessionAdmin, unauthorized } from '@/lib/auth'

const settingsSchema = z.record(z.string(), z.unknown())

export async function GET(req: NextRequest) {
  try {
    const admin = await getSessionAdmin(req)
    if (!admin) return unauthorized()

    const setting = await db.siteSetting.findUnique({ where: { key: 'site' } })
    if (!setting) return NextResponse.json({ settings: null })
    try {
      return NextResponse.json({ settings: JSON.parse(setting.value) })
    } catch {
      return NextResponse.json({ settings: null })
    }
  } catch (e) {
    console.error('admin settings get error', e)
    return NextResponse.json({ error: 'فشل تحميل إعدادات الموقع' }, { status: 500 })
  }
}

export async function POST(req: NextRequest) {
  try {
    const admin = await getSessionAdmin(req)
    if (!admin) return unauthorized()

    const body = await req.json().catch(() => null)
    const parsed = settingsSchema.safeParse(body?.settings ?? body)
    if (!parsed.success) {
      return NextResponse.json({ error: 'بيانات الإعدادات غير صالحة' }, { status: 400 })
    }

    await db.siteSetting.upsert({
      where: { key: 'site' },
      update: { value: JSON.stringify(parsed.data) },
      create: { key: 'site', value: JSON.stringify(parsed.data) },
    })

    return NextResponse.json({ success: true })
  } catch (e) {
    console.error('admin settings post error', e)
    return NextResponse.json({ error: 'فشل حفظ إعدادات الموقع' }, { status: 500 })
  }
}
