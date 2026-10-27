'use client'

/**
 * استمارة الانخراط الموحدة الرسمية — صفحة واحدة لجميع الرياضات (A4 طولي/عرضي، A5 طولي/عرضي):
 *
 *   1) رأس الاستمارة: الترويسة الموحدة للنادي + عنوان الاستمارة + الموسم وأرقام الملف/الانخراط
 *   2) معلومات المنخرط: تُجلب تلقائياً من ملف المنخرط في قاعدة البيانات
 *   3) الشهادة الطبية: النموذج الرسمي المعتمد — يملؤه الطبيب ويوقّع ويختم (لا تصريح «سليم» تلقائي)
 *   4) التصريح الأبوي: للأقل من سن الرشد فقط — نصه قابل للتعديل من لوحة الإدارة
 *   5) رسوم الاشتراك: نوعان حسب الفئة العمرية — أقل من 14 سنة / 14 سنة فما فوق
 *      (يُحدد مبلغ المنخرط آلياً حسب سنه عند تاريخ التسجيل)
 *   6) القوانين الأساسية للنادي: نقاط مختصرة قابلة للتعديل من لوحة الإدارة
 *   7) معلومات النادي ووسائل الاتصال: تذييل من إعدادات الموقع المعتمدة (لا بيانات مختلقة)
 *
 * — بدون جدول توقيت التدريب نهائياً (الالتزام بمواعيد الفرع فقط)
 * — بدون أي بوابة دفع إلكتروني: التسديد عن طريق البنك خارج الموقع
 * — الإعدادات (الرسوم لكل فرع، النصوص، القوانين، الحقول الظاهرة) تُدار من
 *   حساب الإدارة العامة → إعدادات الموقع → استمارة الانخراط → «الاستمارة المطبوعة A4»
 */

import { useLayoutEffect, useMemo, useRef, useState } from 'react'
import {
  Loader2,
  Plus,
  Printer,
  Trash2,
  FileDown,
  Pencil,
  Eye,
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import { Label } from '@/components/ui/label'
import { Switch } from '@/components/ui/switch'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { ClubLetterhead, PaperWatermark, useLetterheadSettings } from './letterhead-settings'
import { PrintPortal } from './system-papers'
import {
  PaperSizeSelector,
  PrintPageSize,
  SheetPreview,
  preparePrintFit,
  paperHalfClass,
  type PaperSize,
} from './doc-blocks'
import { useSiteSettings } from './site-store'
import { formatDateDMY } from '@/lib/date-format'
import type {
  EnrollmentFormFee,
  EnrollmentFormSettings,
  EnrollmentFeeTiers,
  SiteSettings,
} from './types'

// ==================================================================
// الإعدادات الافتراضية (يعدّلها مدير النادي من حساب الإدارة — وتُبذر افتراضياً)
// ==================================================================

export const DEFAULT_FORM_SETTINGS: EnrollmentFormSettings = {
  rules: [
    'احترام النظام الداخلي للنادي واحترام المدربين والإدارة والمنخرطين.',
    'الالتزام بمواعيد التدريب التي يحددها الفرع الرياضي المعني.',
    'المحافظة على التجهيزات والممتلكات والمرافق الرياضية للنادي.',
    'الالتزام بتعليمات السلامة والنظافة داخل المنشآت الرياضية.',
    'عدم التدخل في الحصص التدريبية أو عرقلة سيرها.',
    'احترام تعليمات مسؤولي النادي والمنشأة الرياضية.',
    'التقيد بالإجراءات المعتمدة لدى النادي في كل العمليات.',
    'لا يتحمل النادي مسؤولية الممتلكات الشخصية للمنخرطين.',
  ],
  parentalText:
    'أنا الممضي أسفله، ولي أمر الطفل(ة) المذكور(ة) في هذه الاستمارة، أصرح بموافقتي على انضمامه(ا) إلى النادي الرياضي الهاوي المتعدد الرياضات الرائد لبلدية سعيدة، وممارسة الرياضة المحددة في الاستمارة، مع الالتزام بالقوانين والتنظيمات المعمول بها لدى النادي.',
  medicalDefault: '',
  medicalByBranch: {},
  // (قديم — للتوافق فقط، لم يعد يُطبع)
  fees: {},
  // رسوم الاشتراك الرسمية — نوعان حسب الفئة العمرية (تُعدَّل المبالغ من حساب الإدارة)
  feeTiers: { enabled: true, under14: 1300, above14: 1500, insurance: 500 },
  // تفعيل/تعطيل الرسوم حسب الفرع — يضبطه الفرع من إعداداته أو الإدارة من إعدادات الموقع
  feeByBranch: {},
  bankInfo: '',
  showBirthPlace: true,
  showSpecialty: true,
  showBloodType: true,
  showMunicipalityStamp: true,
}

/** العبارة المالية الثابتة المطلوبة رسمياً في قسم الرسوم */
export const FEES_NOTICE =
  'يتم تسديد حقوق الاشتراك عن طريق البنك وفق الإجراءات المعتمدة لدى النادي. ولا يُعد التسجيل الإلكتروني إثباتًا للدفع.'

/** تسميات الفئتين العمريتين للرسوم */
export const TIER_UNDER14_LABEL = 'أقل من 14 سنة'
export const TIER_ABOVE14_LABEL = '14 سنة فما فوق'

/** حساب سن المنخرط عند تاريخ معين (null إذا التاريخ غير صالح) */
export function ageAt(birthDate: string, atIso: string): number | null {
  if (!birthDate?.trim()) return null
  const b = new Date(birthDate)
  if (isNaN(b.getTime())) return null
  const a = new Date(atIso)
  if (isNaN(a.getTime())) return null
  let age = a.getFullYear() - b.getFullYear()
  const m = a.getMonth() - b.getMonth()
  if (m < 0 || (m === 0 && a.getDate() < b.getDate())) age--
  return age >= 0 && age < 130 ? age : null
}

/** دمج آمن لإعدادات الاستمارة مع الافتراضي (يتحمل بيانات قديمة أو ناقصة) */
export function mergeFormSettings(raw: unknown): EnrollmentFormSettings {
  const s = (raw ?? {}) as Partial<EnrollmentFormSettings>
  const fees: Record<string, EnrollmentFormFee> = {}
  if (s.fees && typeof s.fees === 'object') {
    for (const [k, v] of Object.entries(s.fees as Record<string, EnrollmentFormFee>)) {
      if (!v || typeof v !== 'object') continue
      fees[k] = {
        enabled: v.enabled === true,
        subscription: typeof v.subscription === 'number' && v.subscription >= 0 ? v.subscription : 0,
        insurance: typeof v.insurance === 'number' && v.insurance >= 0 ? v.insurance : 0,
      }
    }
  }
  // رسوم الاشتراك — نوعان حسب الفئة العمرية + التأمين (قيم افتراضية رسمية عند الغياب)
  const t = (s.feeTiers ?? {}) as Partial<EnrollmentFeeTiers>
  const feeTiers: EnrollmentFeeTiers = {
    enabled: t.enabled !== false,
    under14:
      typeof t.under14 === 'number' && t.under14 >= 0
        ? t.under14
        : DEFAULT_FORM_SETTINGS.feeTiers.under14,
    above14:
      typeof t.above14 === 'number' && t.above14 >= 0
        ? t.above14
        : DEFAULT_FORM_SETTINGS.feeTiers.above14,
    insurance:
      typeof t.insurance === 'number' && t.insurance >= 0
        ? t.insurance
        : DEFAULT_FORM_SETTINGS.feeTiers.insurance,
  }
  // تفعيل/تعطيل الرسوم حسب الفرع (يتجاوز الافتراض العام)
  const feeByBranch: Record<string, boolean> =
    s.feeByBranch && typeof s.feeByBranch === 'object'
      ? Object.fromEntries(
          Object.entries(s.feeByBranch).filter(([, v]) => typeof v === 'boolean')
        )
      : {}
  return {
    feeTiers,
    feeByBranch,
    rules: Array.isArray(s.rules) ? s.rules.filter((r) => typeof r === 'string' && r.trim()) : [...DEFAULT_FORM_SETTINGS.rules],
    parentalText: typeof s.parentalText === 'string' ? s.parentalText : DEFAULT_FORM_SETTINGS.parentalText,
    medicalDefault: typeof s.medicalDefault === 'string' ? s.medicalDefault : '',
    medicalByBranch:
      s.medicalByBranch && typeof s.medicalByBranch === 'object'
        ? Object.fromEntries(
            Object.entries(s.medicalByBranch).filter(([, v]) => typeof v === 'string')
          )
        : {},
    fees,
    bankInfo: typeof s.bankInfo === 'string' ? s.bankInfo : '',
    showBirthPlace: s.showBirthPlace !== false,
    showSpecialty: s.showSpecialty !== false,
    showBloodType: s.showBloodType !== false,
    showMunicipalityStamp: s.showMunicipalityStamp !== false,
  }
}

/** يقرأ إعدادات الاستمارة من إعدادات الموقع (مع الدمج الآمن) */
export function useFormSettings(): EnrollmentFormSettings {
  const settings = useSiteSettings((s) => s.settings)
  return useMemo(() => mergeFormSettings(settings?.enrollment?.form), [settings])
}

// ==================================================================
// بيانات الاستمارة (من ملف المنخرط في قاعدة البيانات)
// ==================================================================

export interface EnrollmentFormData {
  id: string
  /** الرقم التسلسلي للتسجيل (مثال: 007) */
  regNumber: string
  /** سنة التسجيل */
  regYear: string
  fullName: string
  gender: string // male | female | ''
  birthDate: string // YYYY-MM-DD
  birthPlace: string
  address: string
  phone: string
  parentName: string // '' للبالغ — القسم الأبوي يظهر فقط عند امتلائه
  /** بيانات ولي الأمر التكميلية (تُطبع بخطوط منقطة عند غيابها) */
  guardianBirth: string // تاريخ ميلاد ولي الأمر
  guardianBirthPlace: string // مكان ميلاده
  guardianIdCard: string // رقم بطاقة التعريف الوطنية
  guardianIdIssueDate: string // تاريخ إصدار البطاقة
  guardianIdIssuePlace: string // مكان إصدار البطاقة
  bloodType: string
  specialty: string
  branchName: string
  branchSlug?: string
  note?: string
  /** ISO — تاريخ التسجيل */
  createdAt: string
  /** الموسم المعتمد في إعدادات الموقع */
  season: string
}

/** يبني بيانات الاستمارة من سجل منخرط كما هو في قاعدة البيانات */
export function enrollmentFromItem(
  e: {
    id: string
    firstName: string
    lastName: string
    fullName: string
    gender: string
    birthDate: string
    birthPlace?: string
    specialty?: string
    bloodType?: string
    address: string
    phone: string
    parentName: string
    guardianBirth?: string
    guardianBirthPlace?: string
    guardianIdCard?: string
    guardianIdIssueDate?: string
    guardianIdIssuePlace?: string
    note?: string
    createdAt: string
  },
  branch: { name: string; slug?: string },
  regNumber: string,
  regYear: string,
  season: string
): EnrollmentFormData {
  return {
    id: e.id,
    regNumber,
    regYear,
    fullName: e.fullName || `${e.firstName} ${e.lastName}`.trim(),
    gender: e.gender ?? '',
    birthDate: e.birthDate ?? '',
    birthPlace: e.birthPlace ?? '',
    address: e.address ?? '',
    phone: e.phone ?? '',
    parentName: e.parentName ?? '',
    guardianBirth: e.guardianBirth ?? '',
    guardianBirthPlace: e.guardianBirthPlace ?? '',
    guardianIdCard: e.guardianIdCard ?? '',
    guardianIdIssueDate: e.guardianIdIssueDate ?? '',
    guardianIdIssuePlace: e.guardianIdIssuePlace ?? '',
    bloodType: e.bloodType ?? '',
    specialty: e.specialty ?? '',
    branchName: branch.name,
    branchSlug: branch.slug,
    note: e.note ?? '',
    createdAt: e.createdAt,
    season,
  }
}

/** رقم الملف الرسمي: مشتق من معرف الطلب بشكل ثابت */
export function dossierNumber(id: string): string {
  return `RCS-${id.slice(-6).toUpperCase()}`
}

/** حساب الرقم التسلسلي من قائمة الطلبات الكاملة (ترتيب زمني) */
export function computeRegNumberFromList<T extends { createdAt: string; id: string }>(
  list: T[],
  target: T
): string {
  const t = new Date(target.createdAt).getTime()
  const count = list.filter((x) => {
    const xt = new Date(x.createdAt).getTime()
    return xt < t || (xt === t && x.id <= target.id)
  }).length
  return String(Math.max(1, count)).padStart(3, '0')
}

// ==================================================================
// عناصر مساعدة للورقة
// ==================================================================

/** خانة معلومة: تسمية صغيرة + قيمة، أو خط منقّط للتعبئة اليدوية عند غياب القيمة */
function InfoCell({
  label,
  value,
  wide = false,
  dir,
}: {
  label: string
  value?: string
  wide?: boolean
  dir?: 'ltr' | 'rtl'
}) {
  const filled = !!value?.trim()
  return (
    <div
      className={`border border-neutral-300 px-2 py-[3px] min-h-[26px] ${wide ? 'col-span-2' : ''}`}
    >
      <div className="text-[8.5px] font-bold text-neutral-500 leading-none">{label}</div>
      {filled ? (
        <div className="text-[11px] font-bold text-neutral-900 leading-tight mt-[2px]" dir={dir}>
          {value}
        </div>
      ) : (
        <div className="mt-[6px] border-b border-dotted border-neutral-400" aria-label={label} />
      )}
    </div>
  )
}

/** شريط عنوان قسم — ترقيم رسمي ولون الهوية */
function SectionBar({ n, title, aside }: { n?: number; title: string; aside?: string }) {
  const [ls] = useLetterheadSettings()
  return (
    <div
      className="flex items-center justify-between gap-2 border border-b-0 px-2 py-[3px]"
      style={{ borderColor: 'rgb(212 212 212)', background: `${ls.accentColor}14` }}
    >
      <div className="text-[10.5px] font-black" style={{ color: ls.accentColor }}>
        {n !== undefined && <span className="ml-1">{n}.</span>}
        {title}
      </div>
      {aside && <div className="text-[8px] font-bold text-neutral-500">{aside}</div>}
    </div>
  )
}

// ==================================================================
// الورقة — 4 مقاسات: A4 طولي/عرضي، A5 طولي/عرضي
// ==================================================================

export function EnrollmentFormPaper({
  data,
  settings,
  contact,
  printable = true,
  paperSize = 'A4-portrait',
}: {
  data: EnrollmentFormData
  settings: EnrollmentFormSettings
  contact?: SiteSettings['contact']
  /** doc-print-area تجعل الورقة مرئية في الطباعة — false داخل معاينة الحوار */
  printable?: boolean
  /** حجم الورقة حسب اختيار المستخدم — A4 الافتراضي */
  paperSize?: PaperSize
}) {
  const [ls] = useLetterheadSettings()
  const isMinor = !!data.parentName.trim()
  // رسوم الاشتراك — نوعان حسب الفئة العمرية + التأمين (يُحدد مبلغ المنخرط آلياً حسب سنه)
  // وإظهار القسم حسب الفرع: تفعيل/تعطيل من الفرع أو الإدارة — وإلا الافتراض العام
  const tiers = settings.feeTiers
  const feeOn = (data.branchSlug && data.branchSlug in settings.feeByBranch
    ? settings.feeByBranch[data.branchSlug]
    : tiers.enabled) ?? tiers.enabled
  const ins = tiers.insurance || 0
  const age = ageAt(data.birthDate, data.createdAt)
  const isUnder14 = age !== null && age < 14
  const myFee = age !== null ? (isUnder14 ? tiers.under14 : tiers.above14) + ins : null
  const myTierLabel = isUnder14 ? TIER_UNDER14_LABEL : TIER_ABOVE14_LABEL
  const medicalHint = (data.branchSlug && settings.medicalByBranch[data.branchSlug]) || settings.medicalDefault
  const genderLabel = data.gender === 'female' ? 'أنثى' : data.gender === 'male' ? 'ذكر' : ''

  const fmtDz = (n: number) => `${new Intl.NumberFormat('fr-DZ').format(n)} دج`

  const contactItems = [
    contact?.address?.trim() ? contact.address.trim() : '',
    contact?.phone?.trim() ? `الهاتف: ${contact.phone.trim()}` : '',
    contact?.email?.trim() ? `البريد: ${contact.email.trim()}` : '',
    contact?.facebook?.trim() ? 'فيسبوك: cs.raed.saida' : '',
  ].filter(Boolean)

  return (
    <div
      className={`doc-paper bg-white mx-auto relative max-w-full ${paperSize === 'A4-landscape' ? 'w-[960px]' : 'w-[680px]'} ${paperSize === 'A5-portrait' ? 'max-w-[min(480px,100%)]' : ''} ${paperHalfClass(paperSize)} ${printable ? 'doc-print-area' : ''}`}
      dir="rtl"
      style={{ background: '#ffffff', color: '#1c2434' }}
    >
      <PaperWatermark />
      {/* ارتفاع أدنى حسب المقاس — A5 عرضي = نصف ورقة A4 طولية فيسقط النصف السفلي صالحاً للاستعمال
          — doc-print-fit: عنصر الملاءمة التلقائية للطباعة (صفحة واحدة دائماً) */}
      <div
        className="doc-print-fit relative px-[26px] py-[18px] flex flex-col"
        style={{
          minHeight:
            paperSize === 'A4-portrait'
              ? '940px'
              : paperSize === 'A4-landscape'
                ? '700px'
                : paperSize === 'A5-portrait'
                  ? '680px'
                  : '520px',
        }}
      >
        {/* ===== رأس الاستمارة ===== */}
        <ClubLetterhead />
        <div className="text-center mt-2">
          <h1 className="text-[16px] font-black tracking-tight" style={{ color: ls.accentColor }}>
            استمارة معلومات وانخراط رياضي
          </h1>
          <div className="text-[8px] font-bold tracking-[0.18em] text-neutral-500 mt-[1px]" dir="ltr">
            RCS SAÏDA — FORMULAIRE D&apos;ADHÉSION SPORTIVE
          </div>
        </div>

        {/* شريط الموسم والأرقام */}
        <div className="grid grid-cols-3 border border-neutral-300 border-t-2 mt-2" style={{ borderTopColor: ls.accentColor }}>
          <div className="px-2 py-[3px] text-[9.5px] font-bold text-neutral-700 border-l border-neutral-300 text-center">
            الموسم الرياضي: <span className="font-black text-neutral-900">{data.season}</span>
          </div>
          <div className="px-2 py-[3px] text-[9.5px] font-bold text-neutral-700 border-l border-neutral-300 text-center">
            رقم الملف: <span className="font-black text-neutral-900" dir="ltr">{dossierNumber(data.id)}</span>
          </div>
          <div className="px-2 py-[3px] text-[9.5px] font-bold text-neutral-700 text-center">
            رقم الانخراط: <span className="font-black text-neutral-900" dir="ltr">{data.regNumber}/{data.regYear}</span>
          </div>
        </div>

        {/* ===== 1) معلومات المنخرط ===== */}
        <div className="mt-2">
          <SectionBar n={1} title="معلومات المنخرط" />
          <div className="grid grid-cols-2 border-t border-neutral-300">
            <InfoCell label="الاسم واللقب" value={data.fullName} wide />
            <InfoCell label="تاريخ الميلاد" value={formatDateDMY(data.birthDate)} dir="ltr" />
            <InfoCell label="الجنس" value={genderLabel} />
            {settings.showBirthPlace && (
              <InfoCell label="مكان الميلاد" value={data.birthPlace} wide />
            )}
            <InfoCell label="العنوان" value={data.address} wide />
            <InfoCell label="رقم الهاتف" value={data.phone} dir="ltr" />
            {settings.showBloodType && <InfoCell label="فصيلة الدم (إن وُجدت)" value={data.bloodType} />}
            <InfoCell label="الفرع الرياضي (الرياضة)" value={data.branchName} />
            {settings.showSpecialty && (
              <InfoCell label="التخصص / الفئة (إن وُجدت)" value={data.specialty} />
            )}
            <InfoCell label="الموسم الرياضي" value={data.season} />
            <InfoCell label="تاريخ التسجيل" value={formatDateDMY(data.createdAt)} dir="ltr" />
            {isMinor && (
              <>
                <InfoCell label="الاسم واللقب لولي الأمر" value={data.parentName} wide />
                <InfoCell label="تاريخ ميلاد ولي الأمر" value={formatDateDMY(data.guardianBirth)} dir="ltr" />
                <InfoCell label="مكان ميلاد ولي الأمر" value={data.guardianBirthPlace} />
                <InfoCell label="رقم بطاقة التعريف الوطنية لولي الأمر" value={data.guardianIdCard} dir="ltr" />
                <InfoCell label="تاريخ إصدار البطاقة" value={formatDateDMY(data.guardianIdIssueDate)} dir="ltr" />
                <InfoCell label="مكان إصدار البطاقة" value={data.guardianIdIssuePlace} />
                <InfoCell label="هاتف ولي الأمر" value={data.phone} dir="ltr" />
              </>
            )}
          </div>
        </div>

        {/* ===== 2) الشهادة الطبية — النموذج الرسمي المعتمد (يملؤه الطبيب ويوقّع ويختم) ===== */}
        <div className="mt-2">
          <SectionBar n={2} title="الشهادة الطبية" aside="تُملأ من طرف الطبيب المعالج" />
          <div className="border border-neutral-300 px-2 py-1.5">
            <div className="text-[10.5px] font-bold text-neutral-800 leading-[1.9]">
              <div className="flex items-end gap-1">
                <span className="shrink-0">أنا الموقع أسفله الدكتور:</span>
                <span className="flex-1 border-b border-dotted border-neutral-400 min-h-[16px]" />
              </div>
              <div className="flex items-end gap-1">
                <span className="shrink-0">يشهد بأن السيد(ة):</span>
                <span className="flex-1 border-b border-dotted border-neutral-400 min-h-[16px] text-center font-black text-neutral-900">
                  {data.fullName}
                </span>
              </div>
              <div className="flex items-end gap-1">
                <span className="shrink-0">المولود (ة) بتاريخ ومكان:</span>
                <span className="flex-1 border-b border-dotted border-neutral-400 min-h-[16px] text-center font-black text-neutral-900">
                  {[
                    formatDateDMY(data.birthDate),
                    data.birthPlace?.trim(),
                  ]
                    .filter(Boolean)
                    .join(' — ')}
                </span>
              </div>
              <div className="flex items-end gap-1">
                <span className="shrink-0">بأن لا وجود لأي خطر لممارسة رياضة:</span>
                <span className="flex-1 border-b border-dotted border-neutral-400 min-h-[16px]" />
              </div>
              <div className="flex items-end gap-1">
                <span className="shrink-0">وتذكر الرياضة المحددة:</span>
                <span className="flex-1 border-b border-dotted border-neutral-400 min-h-[16px] text-center font-black text-neutral-900">
                  {data.branchName}
                </span>
              </div>
            </div>
            {medicalHint.trim() && (
              <p className="text-[9px] font-bold text-neutral-500 mt-1 leading-snug">
                ({medicalHint.trim()})
              </p>
            )}
            <div className="flex items-end gap-3 mt-2">
              <div className="flex-1 text-[9.5px] font-bold text-neutral-700 space-y-[8px]">
                <div>
                  اسم الطبيب وصفته:{' '}
                  <span className="inline-block w-[52%] border-b border-dotted border-neutral-400" />
                </div>
                <div>
                  تاريخ الفحص:{' '}
                  <span className="inline-block w-[52%] border-b border-dotted border-neutral-400" />
                </div>
              </div>
              <div className="w-[92px] h-[52px] border border-dashed border-neutral-400 rounded-sm flex items-center justify-center text-[8px] font-bold text-neutral-400 text-center leading-tight shrink-0">
                إمضاء
                <br />
                وختم الطبيب
              </div>
            </div>
          </div>
        </div>

        {/* ===== 3) التصريح الأبوي — للأقل من سن الرشد فقط ===== */}
        {isMinor && (
          <div className="mt-2">
            <SectionBar n={3} title="تصريح أبوي" aside="خاص بالأقل من سن الرشد" />
            <div className="border border-neutral-300 px-2 py-1.5">
              <p className="text-[10px] font-bold text-neutral-800 leading-relaxed text-justify">
                {settings.parentalText}
              </p>
              <div className="flex flex-wrap items-end gap-x-4 gap-y-1 mt-1.5 text-[9.5px] font-bold text-neutral-700">
                <span className="flex-1 min-w-[160px]">
                  الاسم واللقب لولي الأمر:{' '}
                  <span className="inline-block w-[60%] border-b border-dotted border-neutral-400 text-center">
                    {data.parentName}
                  </span>
                </span>
                <span>
                  هاتف ولي الأمر:{' '}
                  <span className="inline-block w-[70px] border-b border-dotted border-neutral-400 text-center" dir="ltr">
                    {data.phone}
                  </span>
                </span>
                <span>
                  بتاريخ:{' '}
                  <span className="inline-block w-[70px] border-b border-dotted border-neutral-400" />
                </span>
              </div>
              <div className="mt-1.5 flex gap-2">
                <div className="flex-1 h-[50px] border border-dashed border-neutral-400 rounded-sm relative">
                  <span className="absolute top-1 right-2 text-[8px] font-bold text-neutral-400">
                    إمضاء ولي الأمر
                  </span>
                </div>
                {settings.showMunicipalityStamp && (
                  <div className="flex-1 h-[50px] border border-dashed border-neutral-400 rounded-sm relative">
                    <span className="absolute top-1 right-2 text-[8px] font-bold text-neutral-400">
                      ختم وإمضاء مصالح البلدية
                    </span>
                  </div>
                )}
              </div>
            </div>
          </div>
        )}

        {/* ===== 4) رسوم الاشتراك — نوعان حسب الفئة العمرية ===== */}
        {feeOn && (
          <div className="mt-2">
            <SectionBar
              n={isMinor ? 4 : 3}
              title="رسوم الاشتراك"
              aside="حسب الفئة العمرية"
            />
            <div className="border border-neutral-300 px-2 py-1.5">
              <div className="grid grid-cols-2 gap-2">
                <div
                  className={`border rounded-sm py-1 text-center ${isUnder14 ? 'bg-neutral-50' : ''}`}
                  style={isUnder14 ? { borderColor: ls.accentColor, borderWidth: 1.5 } : { borderColor: 'rgb(229 229 229)' }}
                >
                  <div className="text-[8.5px] font-bold text-neutral-500">{TIER_UNDER14_LABEL}</div>
                  <div className="text-[12px] font-black text-neutral-900">
                    {fmtDz(tiers.under14 || 0)}
                    {ins > 0 && <span className="text-[9px] font-bold"> + مصاريف التأمين {fmtDz(ins)}</span>}
                  </div>
                  <div className="text-[10px] font-black" style={{ color: ls.accentColor }}>
                    ({fmtDz((tiers.under14 || 0) + ins)})
                  </div>
                  {isUnder14 && (
                    <div className="text-[7.5px] font-black" style={{ color: ls.accentColor }}>
                        فئة المنخرط(ة)
                    </div>
                  )}
                </div>
                <div
                  className={`border rounded-sm py-1 text-center ${age !== null && !isUnder14 ? 'bg-neutral-50' : ''}`}
                  style={
                    age !== null && !isUnder14
                      ? { borderColor: ls.accentColor, borderWidth: 1.5 }
                      : { borderColor: 'rgb(229 229 229)' }
                  }
                >
                  <div className="text-[8.5px] font-bold text-neutral-500">{TIER_ABOVE14_LABEL}</div>
                  <div className="text-[12px] font-black text-neutral-900">
                    {fmtDz(tiers.above14 || 0)}
                    {ins > 0 && <span className="text-[9px] font-bold"> + مصاريف التأمين {fmtDz(ins)}</span>}
                  </div>
                  <div className="text-[10px] font-black" style={{ color: ls.accentColor }}>
                    ({fmtDz((tiers.above14 || 0) + ins)})
                  </div>
                  {age !== null && !isUnder14 && (
                    <div className="text-[7.5px] font-black" style={{ color: ls.accentColor }}>
                      فئة المنخرط(ة)
                    </div>
                  )}
                </div>
              </div>
              <div className="text-[9.5px] font-bold text-neutral-700 mt-1.5">
                {myFee !== null ? (
                  <>
                    المبلغ المستحق عن المنخرط(ة):{' '}
                    <span className="font-black" style={{ color: ls.accentColor }}>
                      {fmtDz(myFee)}
                    </span>{' '}
                    — الفئة: <span className="font-black">{myTierLabel}</span>
                    {ins > 0 && <span className="text-[9px] text-neutral-500"> (يشمل مصاريف التأمين {fmtDz(ins)})</span>}
                    {age !== null && <span className="text-[9px] text-neutral-500"> (السن: {age} سنة)</span>}
                  </>
                ) : (
                  <>يُحدد المبلغ المستحق حسب سن المنخرط(ة) بتاريخ التسجيل.</>
                )}
              </div>
              <div className="text-[9.5px] font-bold text-neutral-700 mt-0.5">
                الموسم الرياضي المعني: <span className="font-black">{data.season}</span>
              </div>
              {settings.bankInfo.trim() && (
                <div className="text-[9.5px] font-bold text-neutral-700 mt-0.5">
                  الحساب البنكي للجمعية: <span className="font-black" dir="ltr">{settings.bankInfo}</span>
                </div>
              )}
              <p className="text-[8.5px] font-bold text-neutral-700 border-t border-neutral-200 mt-1.5 pt-1 leading-snug">
                {FEES_NOTICE}
              </p>
            </div>
          </div>
        )}

        {/* ===== 5) القوانين الأساسية للنادي ===== */}
        {settings.rules.length > 0 && (
          <div className="mt-2">
            <SectionBar n={feeOn ? (isMinor ? 5 : 4) : isMinor ? 4 : 3} title="القوانين الأساسية للنادي" />
            <div className="border border-neutral-300 px-2 py-1.5 grid grid-cols-2 gap-x-3 gap-y-[2px]">
              {settings.rules.map((r, i) => (
                <div key={i} className="text-[9px] font-bold text-neutral-800 leading-snug flex gap-1">
                  <span style={{ color: ls.accentColor }}>•</span>
                  <span className="flex-1">{r}</span>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* ===== 6) معلومات النادي ووسائل الاتصال — التذييل ===== */}
        <div className="mt-auto pt-2">
          <div className="border-t-2 pt-1" style={{ borderTopColor: ls.accentColor }}>
            <div className="text-center text-[9.5px] font-black" style={{ color: ls.accentColor }}>
              النادي الرياضي الهاوي المتعدد الرياضات الرائد لبلدية سعيدة — سعيدة، الجزائر
            </div>
            {contactItems.length > 0 && (
              <div className="text-center text-[8.5px] font-bold text-neutral-600 mt-[2px] leading-snug">
                {contactItems.map((c, i) => (
                  <span key={i}>
                    {i > 0 && <span className="mx-1.5 text-neutral-300">|</span>}
                    <span dir={/^\+?[0-9\s-]+$/.test(c) ? 'ltr' : undefined}>{c}</span>
                  </span>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}

// ==================================================================
// نافذة المعاينة والطباعة — معاينة حية + إكمال الحقول الناقصة + طباعة/حفظ PDF
// ==================================================================

/** غلاف معاينة يُكبّر/يُصغّر الورقة لتناسب المساحة المتاحة — تظهر الاستمارة كاملة بلا تمرير */
function FitPreview({ children }: { children: React.ReactNode }) {
  const hostRef = useRef<HTMLDivElement>(null)
  const innerRef = useRef<HTMLDivElement>(null)
  const [scale, setScale] = useState(1)

  useLayoutEffect(() => {
    const host = hostRef.current
    const inner = innerRef.current
    if (!host || !inner) return
    const fit = () => {
      const w = inner.offsetWidth
      const h = inner.offsetHeight
      if (!w || !h) return
      const next = Math.min(1, (host.clientWidth - 12) / w, (host.clientHeight - 12) / h)
      setScale(next > 0 ? next : 1)
    }
    fit()
    const ro = new ResizeObserver(fit)
    ro.observe(host)
    ro.observe(inner)
    return () => ro.disconnect()
  }, [])

  return (
    <div ref={hostRef} className="w-full h-full flex items-start justify-center overflow-hidden">
      <div ref={innerRef} style={{ transform: `scale(${scale})`, transformOrigin: 'top center' }}>
        {children}
      </div>
    </div>
  )
}

export function EnrollmentFormDialog({
  open,
  onClose,
  initial,
  allowEdit = false,
  fullWindow = false,
}: {
  open: boolean
  onClose: () => void
  /** يقبل null عندما لا يوجد منخرط مختار بعد (النافذة مغلقة) */
  initial: EnrollmentFormData | null
  /** إكمال/تصحيح البيانات يظهر فقط لحساب النادي أو الفرع — لا للزوار */
  allowEdit?: boolean
  /** نافذة كاملة تُظهر ورقة الاستمارة كاملة — تُستخدم فور التسجيل من الموقع العام */
  fullWindow?: boolean
}) {
  const settings = useFormSettings()
  const siteSettings = useSiteSettings((s) => s.settings)
  const [data, setData] = useState<EnrollmentFormData | null>(initial)
  const [mode, setMode] = useState<'preview' | 'edit'>('preview')
  // مقاس واتجاه ورقة الطباعة حسب اختيار المستخدم — A4 طولي افتراضياً
  const [paperSize, setPaperSize] = useState<PaperSize>('A4-portrait')

  // مزامنة البيانات عند فتح نافذة جديدة لمنخرط آخر (بلا null داخل الترتيب)
  const key = initial?.id ?? ''
  const [lastKey, setLastKey] = useState(key)
  if (open && initial && key !== lastKey) {
    setLastKey(key)
    setData(initial)
    setMode('preview')
  }

  const contact = siteSettings?.contact
  const set = (patch: Partial<EnrollmentFormData>) =>
    setData((d) => (d ? { ...d, ...patch } : d))

  // لا نرندر شيئاً بلا بيانات (يمنع أي انهيار عند الإغلاق أو قبل الاختيار)
  if (!open || !initial || !data) return null

  const print = () => {
    // ملاءمة الورقة أولاً (صفحة واحدة دائماً بالمقاس والاتجاه المختارين)
    // ثم البوابة ترندر نسخة الطباعة خارج الحوار ونفتح حوار الطباعة/حفظ PDF
    try {
      preparePrintFit(paperSize)
    } catch {
      /* الطباعة تكمل بلا ملاءمة عند أي فشل في القياس */
    }
    window.print()
  }

  return (
    <>
      <Dialog open={open} onOpenChange={(v) => !v && onClose()}>
        <DialogContent
          className={
            fullWindow
              ? 'w-[100vw] max-w-[100vw] sm:max-w-[100vw] h-[100vh] max-h-[100vh] rounded-none sm:rounded-none top-0 left-0 translate-x-0 translate-y-0 border-0 overflow-hidden flex flex-col'
              : 'max-w-[980px] w-[96vw] max-h-[94vh] overflow-hidden flex flex-col'
          }
          dir="rtl"
        >
          <DialogHeader className="shrink-0">
            <DialogTitle className="flex items-center gap-2 text-base">
              <FileDown className="h-5 w-5 text-(--club)" />
              استمارة الانخراط الرسمية — {data.fullName || 'منخرط جديد'}
            </DialogTitle>
            <DialogDescription className="text-xs">
              أربعة خيارات للورقة: A4 طولية / A4 عرضية / A5 طولية / A5 عرضية — المعاينة تطابق الطباعة
              تماماً (صفحة واحدة دائماً)، وأوضاع A5 تُطبع على نصف ورقة A4 لتوفير الورق.
            </DialogDescription>
          </DialogHeader>

          {/* أدوات */}
          <div className="shrink-0 flex flex-wrap items-center gap-2 border-y border-(--border) py-2">
            {/* المعاينة/التصحيح — التصحيح لحساب النادي أو الفرع فقط */}
            {allowEdit && (
              <>
                <Button
                  size="sm"
                  variant={mode === 'preview' ? 'default' : 'outline'}
                  onClick={() => setMode('preview')}
                  className="font-bold"
                >
                  <Eye className="h-4 w-4 ml-1" /> المعاينة
                </Button>
                <Button
                  size="sm"
                  variant={mode === 'edit' ? 'default' : 'outline'}
                  onClick={() => setMode('edit')}
                  className="font-bold"
                >
                  <Pencil className="h-4 w-4 ml-1" /> إكمال / تصحيح البيانات
                </Button>
              </>
            )}
            <div className="flex-1" />
            <PaperSizeSelector value={paperSize} onChange={setPaperSize} />
            <Button
              size="sm"
              onClick={print}
              className="bg-(--club) hover:bg-(--club)/90 text-white font-bold"
            >
              <Printer className="h-4 w-4 ml-1" /> طباعة / حفظ PDF
            </Button>
          </div>

          {/* إعدادات نافذة الطباعة بالمتصفح لأفضل نتيجة */}
          <p className="shrink-0 text-[10.5px] font-bold text-muted-foreground leading-relaxed px-1">
            في نافذة الطباعة بالمتصفح: اختر «المقاس A4» و «الهوامش: بلا / None»، وألغِ
            «الترويسة والتذييل / Headers and footers»، وفعّل «رسومات الخلفية / Background graphics».
          </p>

          <div className={`doc-print-host bg-neutral-100 dark:bg-neutral-900 rounded-lg ${fullWindow ? 'flex-1 min-h-0 p-2' : 'flex-1 overflow-y-auto nice-scroll p-3'}`}>
            {mode === 'edit' ? (
              <div className="max-w-[640px] mx-auto space-y-3 overflow-y-auto nice-scroll h-full">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                  <div>
                    <Label className="text-xs font-bold">الاسم واللقب</Label>
                    <Input value={data.fullName} onChange={(e) => set({ fullName: e.target.value })} className="mt-1 bg-white text-right" />
                  </div>
                  <div>
                    <Label className="text-xs font-bold">الجنس</Label>
                    <select
                      value={data.gender}
                      onChange={(e) => set({ gender: e.target.value })}
                      className="mt-1 w-full h-9 rounded-md border border-(--border) bg-white px-2 text-sm font-bold text-right"
                      aria-label="الجنس"
                    >
                      <option value="">— غير محدد —</option>
                      <option value="male">ذكر</option>
                      <option value="female">أنثى</option>
                    </select>
                  </div>
                  <div>
                    <Label className="text-xs font-bold">تاريخ الميلاد (YYYY-MM-DD)</Label>
                    <Input value={data.birthDate} onChange={(e) => set({ birthDate: e.target.value })} className="mt-1 bg-white text-right" dir="ltr" />
                  </div>
                  <div>
                    <Label className="text-xs font-bold">مكان الميلاد</Label>
                    <Input value={data.birthPlace} onChange={(e) => set({ birthPlace: e.target.value })} className="mt-1 bg-white text-right" />
                  </div>
                  <div className="sm:col-span-2">
                    <Label className="text-xs font-bold">العنوان</Label>
                    <Textarea value={data.address} onChange={(e) => set({ address: e.target.value })} rows={2} className="mt-1 bg-white text-right" />
                  </div>
                  <div>
                    <Label className="text-xs font-bold">رقم الهاتف</Label>
                    <Input value={data.phone} onChange={(e) => set({ phone: e.target.value })} className="mt-1 bg-white text-right" dir="ltr" />
                  </div>
                  <div>
                    <Label className="text-xs font-bold">فصيلة الدم (اختياري)</Label>
                    <Input value={data.bloodType} onChange={(e) => set({ bloodType: e.target.value })} className="mt-1 bg-white text-right" dir="ltr" placeholder="O+ مثلاً" />
                  </div>
                  <div>
                    <Label className="text-xs font-bold">الفرع الرياضي</Label>
                    <Input value={data.branchName} onChange={(e) => set({ branchName: e.target.value })} className="mt-1 bg-white text-right" />
                  </div>
                  <div>
                    <Label className="text-xs font-bold">التخصص / الفئة (اختياري)</Label>
                    <Input value={data.specialty} onChange={(e) => set({ specialty: e.target.value })} className="mt-1 bg-white text-right" />
                  </div>
                  <div className="sm:col-span-2">
                    <Label className="text-xs font-bold">
                      اسم ولي الأمر — يظهر قسم التصريح الأبوي فقط عند ملئه (للأقل من سن الرشد)
                    </Label>
                    <Input
                      value={data.parentName}
                      onChange={(e) => set({ parentName: e.target.value })}
                      className="mt-1 bg-white text-right"
                      placeholder="اتركه فارغاً للمنخرط البالغ"
                    />
                  </div>
                  {data.parentName.trim() && (
                    <>
                      <div className="sm:col-span-2 -mx-1 mt-1 border-t border-(--border)" />
                      <div className="sm:col-span-2 text-[11px] font-black text-(--club-dark)">معلومات ولي الأمر (تظهر في الاستمارة المطبوعة)</div>
                      <div>
                        <Label className="text-xs font-bold">تاريخ ميلاد ولي الأمر</Label>
                        <Input value={data.guardianBirth} onChange={(e) => set({ guardianBirth: e.target.value })} className="mt-1 bg-white text-right" dir="ltr" placeholder="YYYY-MM-DD" />
                      </div>
                      <div>
                        <Label className="text-xs font-bold">مكان ميلاد ولي الأمر</Label>
                        <Input value={data.guardianBirthPlace} onChange={(e) => set({ guardianBirthPlace: e.target.value })} className="mt-1 bg-white text-right" />
                      </div>
                      <div>
                        <Label className="text-xs font-bold">رقم بطاقة التعريف الوطنية</Label>
                        <Input value={data.guardianIdCard} onChange={(e) => set({ guardianIdCard: e.target.value })} className="mt-1 bg-white text-right" dir="ltr" />
                      </div>
                      <div>
                        <Label className="text-xs font-bold">تاريخ إصدار البطاقة</Label>
                        <Input value={data.guardianIdIssueDate} onChange={(e) => set({ guardianIdIssueDate: e.target.value })} className="mt-1 bg-white text-right" dir="ltr" placeholder="YYYY-MM-DD" />
                      </div>
                      <div>
                        <Label className="text-xs font-bold">مكان إصدار البطاقة</Label>
                        <Input value={data.guardianIdIssuePlace} onChange={(e) => set({ guardianIdIssuePlace: e.target.value })} className="mt-1 bg-white text-right" />
                      </div>
                    </>
                  )}
                </div>
                <p className="text-[11px] text-muted-foreground leading-relaxed border border-(--border) rounded-lg p-2.5 bg-white">
                  هذه النافذة تصحّح بيانات الاستمارة المطبوعة فقط ولا تغيّر ملف المنخرط في قاعدة
                  البيانات. الحقول الفارغة تُطبع بخطوط منقّطة للتعبئة اليدوية.
                </p>
              </div>
            ) : fullWindow ? (
              <FitPreview>
                <SheetPreview size={paperSize}>
                  <EnrollmentFormPaper data={data} settings={settings} contact={contact} printable={false} paperSize={paperSize} />
                </SheetPreview>
              </FitPreview>
            ) : (
              <div className="w-full flex justify-center py-2">
                <SheetPreview size={paperSize}>
                  <EnrollmentFormPaper data={data} settings={settings} contact={contact} printable={false} paperSize={paperSize} />
                </SheetPreview>
              </div>
            )}
          </div>
        </DialogContent>
      </Dialog>

      {/* بوابة الطباعة: نسخة الورقة خارج الحوار تُطبع وحدها — بالمقاس والاتجاه المختارين */}
      {open && (
        <PrintPortal size={paperSize}>
          <PrintPageSize size={paperSize} />
          <EnrollmentFormPaper data={data} settings={settings} contact={contact} paperSize={paperSize} />
        </PrintPortal>
      )}
    </>
  )
}

/** غلاف تحميل بسيط أثناء جلب بيانات الاستمارة من الخادم */
export function EnrollFormLoading() {
  return (
    <div className="flex items-center justify-center gap-2 py-10 text-sm font-bold text-muted-foreground">
      <Loader2 className="h-5 w-5 animate-spin" />
      جاري تحضير الاستمارة...
    </div>
  )
}
