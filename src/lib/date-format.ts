/**
 * صيغة التاريخ الموحّدة في كامل الموقع: DD/MM/YYYY (يوم/شهر/سنة)
 *
 * - «YYYY-MM-DD» (تواريخ الميلاد والتعيين المخزّنة) تُحوَّل مباشرة
 *   بلا مرور عبر Date لتجنّب أي انزياح في المنطقة الزمنية
 * - التواريخ الكاملة (ISO مع وقت) أو Date تُنسَّق حسب التوقيت المحلي
 * - أي قيمة غير صالحة تُعاد كما هي (أو سلسلة فارغة للقيم الفارغة)
 */
export function formatDateDMY(value: string | Date | null | undefined): string {
  if (!value) return ''

  if (typeof value === 'string') {
    const m = value.match(/^(\d{4})-(\d{2})-(\d{2})/)
    if (m) return `${m[3]}/${m[2]}/${m[1]}`
  }

  const d = value instanceof Date ? value : new Date(value)
  if (Number.isNaN(d.getTime())) return typeof value === 'string' ? value : ''

  const dd = String(d.getDate()).padStart(2, '0')
  const mm = String(d.getMonth() + 1).padStart(2, '0')
  return `${dd}/${mm}/${d.getFullYear()}`
}
