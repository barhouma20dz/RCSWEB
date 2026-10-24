import { createClient } from '@libsql/client'
import { DEFAULT_FORM_SETTINGS } from '../src/components/club/enrollment-form'

/**
 * ترقية قاعدة Turso لاستمارة الانخراط الموحدة — آمنة وبدون مسح أي بيانات:
 *   1) إضافة أعمدة Enrollment الجديدة (birthPlace / specialty / bloodType) إن لم تكن موجودة
 *   2) دمج إعدادات الاستمارة الافتراضية في SiteSetting('site').enrollment.form
 *      (يحتفظ بأي إعدادات حالية ويدمج المفاتيح الناقصة فقط)
 *
 * التشغيل: TURSO_DATABASE_URL=... TURSO_AUTH_TOKEN=... bun scripts/turso-upgrade-enroll-form.ts
 */
async function main() {
  const client = createClient({
    url: process.env.TURSO_DATABASE_URL!,
    authToken: process.env.TURSO_AUTH_TOKEN!,
  })

  // 1) الأعمدة الجديدة
  const cols = await client.execute('PRAGMA table_info(Enrollment)')
  const existing = new Set(cols.rows.map((r) => String(r.name)))
  const wanted: Array<{ name: string; ddl: string }> = [
    { name: 'birthPlace', ddl: `ALTER TABLE Enrollment ADD COLUMN birthPlace TEXT NOT NULL DEFAULT ''` },
    { name: 'specialty', ddl: `ALTER TABLE Enrollment ADD COLUMN specialty TEXT NOT NULL DEFAULT ''` },
    { name: 'bloodType', ddl: `ALTER TABLE Enrollment ADD COLUMN bloodType TEXT NOT NULL DEFAULT ''` },
  ]
  for (const c of wanted) {
    if (existing.has(c.name)) {
      console.log(`ⓘ العمود موجود مسبقاً: ${c.name}`)
    } else {
      await client.execute(c.ddl)
      console.log(`✓ أُضيف العمود: ${c.name}`)
    }
  }

  // 2) إعدادات الاستمارة الافتراضية
  const setting = await client.execute({
    sql: 'SELECT value FROM SiteSetting WHERE key = ?',
    args: ['site'],
  })
  if (setting.rows.length === 0) {
    console.log('ⓘ لا يوجد سجل إعدادات site — شغّل scripts/seed.ts للبذر الكامل')
    return
  }
  const parsed = JSON.parse(String(setting.rows[0].value)) as Record<string, unknown>
  const enrollment = (parsed.enrollment ?? {}) as Record<string, unknown>
  const currentForm = (enrollment.form ?? {}) as Record<string, unknown>

  const mergedForm = {
    ...DEFAULT_FORM_SETTINGS,
    ...currentForm,
    // مفاتيح الحاوية: ندمج عميقاً حتى لا نفقد إعدادات الفروع الحالية
    fees: { ...DEFAULT_FORM_SETTINGS.fees, ...(currentForm.fees ?? {}) },
    medicalByBranch: { ...DEFAULT_FORM_SETTINGS.medicalByBranch, ...(currentForm.medicalByBranch ?? {}) },
  }

  await client.execute({
    sql: 'UPDATE SiteSetting SET value = ? WHERE key = ?',
    args: [JSON.stringify({ ...parsed, enrollment: { ...enrollment, form: mergedForm } }), 'site'],
  })
  console.log('✓ دُمجت إعدادات استمارة الانخراط في SiteSetting(site) — البيانات الحالية محفوظة')
  console.log('🎉 الترقية اكتملت')
}

main()
