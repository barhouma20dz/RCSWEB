'use client'

/**
 * استمارة الانخراط الموحدة الرسمية — صفحة A4 عمودية واحدة لجميع الرياضات:
 *
 *   1) رأس الاستمارة: الترويسة الموحدة للنادي + عنوان الاستمارة + الموسم وأرقام الملف/الانخراط
 *   2) معلومات المنخرط: تُجلب تلقائياً من ملف المنخرط في قاعدة البيانات
 *   3) الشهادة الطبية: مساحة يملؤها الطبيب ويوقّع ويختم (لا تصريح «سليم» تلقائي)
 *   4) التصريح الأبوي: للأقل من سن الرشد فقط — نصه قابل للتعديل من لوحة الإدارة
 *   5) رسوم الاشتراك والتأمين: تظهر للفروع المعنية فقط (مثل السباحة) حسب إعدادات الإدارة
 *   6) القوانين الأساسية للنادي: نقاط مختصرة قابلة للتعديل من لوحة الإدارة
 *   7) معلومات النادي ووسائل الاتصال: تذييل من إعدادات الموقع المعتمدة (لا بيانات مختلقة)
 *
 * — بدون جدول توقيت التدريب نهائياً (الالتزام بمواعيد الفرع فقط)
 * — بدون أي بوابة دفع إلكتروني: التسديد عن طريق البنك خارج الموقع
 * — الإعدادات (الرسوم لكل فرع، النصوص، القوانين، الحقول الظاهرة) تُدار من
 *   حساب الإدارة العامة → إعدادات الموقع → استمارة الانخراط → «الاستمارة المطبوعة A4»
 */

import { useMemo, useState } from 'react'
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
import { PrintPageSize, PaperSizeSelector, type PaperSize } from './doc-blocks'
import { useSiteSettings } from './site-store'
import { formatDateDMY } from '@/lib/date-format'
import type { EnrollmentFormFee, EnrollmentFormSettings, SiteSettings } from './types'

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
  // الرسوم للفروع المعنية فقط (مفتاح = slug الفرع) — تُعدَّل المبالغ من حساب الإدارة
  fees: {
    swimming: { enabled: true, subscription: 1000, insurance: 500 },
  },
  bankInfo: '',
  showBirthPlace: true,
  showSpecialty: true,
  showBloodType: true,
  showMunicipalityStamp: true,
}

/** العبارة المالية الثابتة المطلوبة رسمياً في قسم الرسوم */
export const FEES_NOTICE =
  'يتم تسديد حقوق الاشتراك والتأمين عن طريق البنك وفق الإجراءات المعتمدة لدى النادي. ولا يُعد التسجيل الإلكتروني إثباتًا للدفع.'

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
  return {
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
// الورقة — A4 عمودية واحدة
// ==================================================================

export function EnrollmentFormPaper({
  data,
  settings,
  contact,
  printable = true,
  paperSize = 'A4',
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
  const fee: EnrollmentFormFee | undefined = data.branchSlug
    ? settings.fees[data.branchSlug]
    : undefined
  const feeOn = !!fee?.enabled
  const feeTotal = fee ? (fee.subscription || 0) + (fee.insurance || 0) : 0
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
      className={`doc-paper bg-white w-[680px] mx-auto relative ${paperSize === 'A5' ? 'max-w-[min(480px,100%)]' : 'max-w-full'} ${printable ? 'doc-print-area' : ''}`}
      dir="rtl"
      style={{ background: '#ffffff', color: '#1c2434' }}
    >
      <PaperWatermark />
      <div className="relative px-[26px] py-[18px] flex flex-col" style={{ minHeight: '940px' }}>
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
                <InfoCell label="الاسم واللقب لولي الأمر" value={data.parentName} />
                <InfoCell label="هاتف ولي الأمر" value={data.phone} dir="ltr" />
              </>
            )}
          </div>
        </div>

        {/* ===== 2) الشهادة الطبية — يملؤها الطبيب ويوقّع ويختم ===== */}
        <div className="mt-2">
          <SectionBar n={2} title="الشهادة الطبية" aside="تُملأ من طرف الطبيب المعالج" />
          <div className="border border-neutral-300 px-2 py-1.5">
            <div className="flex flex-wrap gap-x-4 text-[10px] font-bold text-neutral-800">
              <span>
                فحصت(ُ) المنخرط(ة): <span className="font-black">{data.fullName || '........................'}</span>
              </span>
              <span>
                بشأن ممارسة رياضة: <span className="font-black">{data.branchName || '........................'}</span>
              </span>
            </div>
            {medicalHint.trim() && (
              <p className="text-[9px] font-bold text-neutral-500 mt-1 leading-snug">
                ({medicalHint.trim()})
              </p>
            )}
            <div className="mt-1 space-y-[7px] pt-[2px]">
              <div className="border-b border-dotted border-neutral-400" />
              <div className="border-b border-dotted border-neutral-400" />
              <div className="border-b border-dotted border-neutral-400" />
            </div>
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

        {/* ===== 4) رسوم الاشتراك والتأمين — للفروع المعنية فقط ===== */}
        {feeOn && fee && (
          <div className="mt-2">
            <SectionBar n={isMinor ? 4 : 3} title="رسوم الاشتراك والتأمين" />
            <div className="border border-neutral-300 px-2 py-1.5">
              <div className="grid grid-cols-3 gap-2 text-center">
                <div className="border border-neutral-200 rounded-sm py-1">
                  <div className="text-[8.5px] font-bold text-neutral-500">الاشتراك الرياضي</div>
                  <div className="text-[11px] font-black text-neutral-900">{fmtDz(fee.subscription || 0)}</div>
                </div>
                <div className="border border-neutral-200 rounded-sm py-1">
                  <div className="text-[8.5px] font-bold text-neutral-500">مصاريف التأمين</div>
                  <div className="text-[11px] font-black text-neutral-900">{fmtDz(fee.insurance || 0)}</div>
                </div>
                <div className="border rounded-sm py-1" style={{ borderColor: ls.accentColor }}>
                  <div className="text-[8.5px] font-bold text-neutral-500">المبلغ الإجمالي المستحق</div>
                  <div className="text-[11px] font-black" style={{ color: ls.accentColor }}>
                    {fmtDz(feeTotal)}
                  </div>
                </div>
              </div>
              <div className="text-[9.5px] font-bold text-neutral-700 mt-1.5">
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

export function EnrollmentFormDialog({
  open,
  onClose,
  initial,
  allowEdit = false,
}: {
  open: boolean
  onClose: () => void
  /** يقبل null عندما لا يوجد منخرط مختار بعد (النافذة مغلقة) */
  initial: EnrollmentFormData | null
  /** إكمال/تصحيح البيانات يظهر فقط لحساب النادي أو الفرع — لا للزوار */
  allowEdit?: boolean
}) {
  const settings = useFormSettings()
  const siteSettings = useSiteSettings((s) => s.settings)
  const [data, setData] = useState<EnrollmentFormData | null>(initial)
  const [mode, setMode] = useState<'preview' | 'edit'>('preview')
  // حجم ورقة الطباعة حسب اختيار المستخدم — A4 الافتراضي
  const [paperSize, setPaperSize] = useState<PaperSize>('A4')

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
    // البوابة ترندر نسخة الطباعة خارج الحوار ثم نفتح حوار الطباعة/حفظ PDF
    window.print()
  }

  return (
    <>
      <Dialog open={open} onOpenChange={(v) => !v && onClose()}>
        <DialogContent className="max-w-[980px] w-[96vw] max-h-[94vh] overflow-hidden flex flex-col" dir="rtl">
          <DialogHeader className="shrink-0">
            <DialogTitle className="flex items-center gap-2 text-base">
              <FileDown className="h-5 w-5 text-(--club)" />
              استمارة الانخراط الرسمية — {data.fullName || 'منخرط جديد'}
            </DialogTitle>
            <DialogDescription className="text-xs">
              صفحة واحدة بمقاس A4 أو A5 حسب اختيارك — معاينة حية، ثم الطباعة أو الحفظ بصيغة PDF
              (اختر «حفظ كـ PDF» في نافذة الطباعة).
            </DialogDescription>
          </DialogHeader>

          {/* أدوات */}
          <div className="shrink-0 flex flex-wrap items-center gap-2 border-y border-(--border) py-2">
            <Button
              size="sm"
              variant={mode === 'preview' ? 'default' : 'outline'}
              onClick={() => setMode('preview')}
              className="font-bold"
            >
              <Eye className="h-4 w-4 ml-1" /> المعاينة
            </Button>
            {/* إكمال/تصحيح البيانات — لحساب النادي أو الفرع فقط */}
            {allowEdit && (
              <Button
                size="sm"
                variant={mode === 'edit' ? 'default' : 'outline'}
                onClick={() => setMode('edit')}
                className="font-bold"
              >
                <Pencil className="h-4 w-4 ml-1" /> إكمال / تصحيح البيانات
              </Button>
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

          <div className="flex-1 overflow-y-auto nice-scroll doc-print-host bg-neutral-100 dark:bg-neutral-900 p-3 rounded-lg">
            {mode === 'edit' ? (
              <div className="max-w-[640px] mx-auto space-y-3">
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
                </div>
                <p className="text-[11px] text-muted-foreground leading-relaxed border border-(--border) rounded-lg p-2.5 bg-white">
                  هذه النافذة تصحّح بيانات الاستمارة المطبوعة فقط ولا تغيّر ملف المنخرط في قاعدة
                  البيانات. الحقول الفارغة تُطبع بخطوط منقّطة للتعبئة اليدوية.
                </p>
              </div>
            ) : (
              <EnrollmentFormPaper data={data} settings={settings} contact={contact} printable={false} paperSize={paperSize} />
            )}
          </div>
        </DialogContent>
      </Dialog>

      {/* بوابة الطباعة: نسخة الورقة خارج الحوار تُطبع وحدها — A4 أو A5 حسب الاختيار */}
      {open && (
        <PrintPortal>
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
