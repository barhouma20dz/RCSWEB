import { db } from '@/lib/db'

/**
 * مساعد خادم موحد لاستمارة الانخراط الرسمية (A4):
 * يجلب بيانات المنخرط + الفرع + يحسب رقم الانخراط التسلسلي
 * (ترتيب زمني بين كل طلبات النادي) + يجلب الموسم من إعدادات الموقع.
 */

export interface EnrollmentFormPayload {
  enrollment: {
    id: string
    firstName: string
    lastName: string
    fullName: string
    gender: string
    birthDate: string
    birthPlace: string
    specialty: string
    bloodType: string
    address: string
    phone: string
    parentName: string
    note: string
    status: string
    createdAt: string
  }
  branch: { name: string; color: string; slug: string }
  /** الرقم التسلسلي (مثال: 007) */
  regNumber: string
  /** سنة التسجيل لعرضها مع الرقم */
  regYear: string
  season: string
}

async function getSeason(): Promise<string> {
  try {
    const setting = await db.siteSetting.findUnique({ where: { key: 'site' } })
    if (setting) {
      const parsed = JSON.parse(setting.value) as { design?: { season?: string } }
      const s = parsed?.design?.season?.trim()
      if (s) return s
    }
  } catch {
    // افتراضي آمن
  }
  return '2026/2027'
}

export async function buildEnrollmentFormPayload(
  id: string
): Promise<EnrollmentFormPayload | null> {
  const e = await db.enrollment.findUnique({
    where: { id },
    include: { branch: { select: { name: true, color: true, slug: true } } },
  })
  if (!e) return null

  // الرقم التسلسلي: ترتيب الطلب زمنياً بين كل الطلبات (عدد الطلبات السابقة + 1)
  const count = await db.enrollment.count({
    where: { createdAt: { lte: e.createdAt } },
  })
  const regNumber = String(count).padStart(3, '0')

  return {
    enrollment: {
      id: e.id,
      firstName: e.firstName,
      lastName: e.lastName,
      fullName: e.fullName || `${e.firstName} ${e.lastName}`.trim(),
      gender: e.gender,
      birthDate: e.birthDate,
      birthPlace: e.birthPlace ?? '',
      specialty: e.specialty ?? '',
      bloodType: e.bloodType ?? '',
      address: e.address,
      phone: e.phone,
      parentName: e.parentName,
      note: e.note,
      status: e.status,
      createdAt: e.createdAt.toISOString(),
    },
    branch: { name: e.branch.name, color: e.branch.color, slug: e.branch.slug },
    regNumber,
    regYear: String(e.createdAt.getFullYear()),
    season: await getSeason(),
  }
}

/** تطبيع الهاتف للمقارنة (إزالة المسافات والشرطات) */
export function normalizePhone(p: string): string {
  return p.replace(/[\s-]/g, '')
}
