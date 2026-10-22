'use client'

/**
 * النماذج النظامية الرسمية لمكتب النادي:
 *
 * 1) تصريح أبوي — ورقة رسمية للمنخرطين الأقل من 18 سنة:
 *    - تُولَّد تلقائياً بمعلومات الولي والابن بعد تسجيل استمارة انخراط قاصر
 *    - تتوفر فارغة للطباعة من قائمة النماذج في مكتب النادي
 *    - أرشفتها في كتب النادي بأمر الإدارة
 *
 * 2) طلب حصة تدريبية — مراسلة رسمية بترويسة ثنائية اللغة موجهة
 *    إلى رئيس المجلس الشعبي البلدي لطلب حصص تدريبية في الملاعب البلدية،
 *    بمولّد ذكي يحوّل أسطر الحصص (المكان/الأيام/التوقيت/الفرع) إلى نص رسمي.
 *
 * كل الأوراق تطبع بمقاس نظيف عبر آلية doc-print-area القائمة.
 */

import { useMemo, useState, useSyncExternalStore } from 'react'
import { createPortal } from 'react-dom'
import {
  Loader2,
  Plus,
  Trash2,
  FileSignature,
  Landmark,
  Printer,
  Archive,
  Search,
  Stamp,
  Info,
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import { Label } from '@/components/ui/label'
import { Badge } from '@/components/ui/badge'
import { Switch } from '@/components/ui/switch'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { useToast } from '@/hooks/use-toast'
import { apiFetch } from '@/lib/session'
import { formatDateDMY } from '@/lib/date-format'
import type { EnrollmentItem, BranchWithAccount } from './types'
import { ClubLetterhead, PaperWatermark, useAccentColor, seasonLabel } from './letterhead-settings'

// إعادة تصدير الأدوات المشتركة (توافقاً مع بقية الملفات)
export { seasonLabel }

// ==================================================================
// أدوات مشتركة
// ==================================================================

/**
 * بوابة الطباعة: تُرندر نسخة الورقة على مستوى document.body (خارج نافذة الحوار)
 * حتى لا يقصّها أي سلف أثناء الطباعة — تظهر في الوسائط المطبوعة فقط.
 */
export function PrintPortal({ children }: { children: React.ReactNode }) {
  // كشف التركيب من دون setState داخل effect (متوافق مع SSR وقواعد React)
  const mounted = useSyncExternalStore(
    subscribeNoop,
    () => true,
    () => false
  )
  if (!mounted) return null
  return createPortal(<div className="doc-only-print">{children}</div>, document.body)
}

const subscribeNoop = () => () => {}

export interface AuthorizationData {
  guardianName: string // اسم الولي (أسماؤه السبعة)
  guardianBirth: string // تاريخ ومكان ميلاد الولي
  guardianId: string // رقم بط.ت / ج.س / ر.س
  guardianIdDate: string // الصدارة بتاريخ
  address: string // السكن في
  childName: string // اسم الابن(ة)
  childBirth: string // تاريخ ميلاد الابن(ة)
  sport: string // الرياضة الممارسة
  childGender: 'male' | 'female'
}

export const EMPTY_AUTHORIZATION: AuthorizationData = {
  guardianName: '',
  guardianBirth: '',
  guardianId: '',
  guardianIdDate: '',
  address: '',
  childName: '',
  childBirth: '',
  sport: '',
  childGender: 'male',
}

interface SystemDesign {
  systemForm?: string
  params?: Record<string, string>
}

/** يستخرج توقيع النموذج النظامي من تصميم وثيقة مؤرشفة (إن وجد) */
export function parseSystemDesign(json: string): { systemForm: string; params: Record<string, string> } | null {
  if (!json) return null
  try {
    const d = JSON.parse(json) as SystemDesign
    if (d && typeof d.systemForm === 'string' && d.systemForm) {
      const form: string = d.systemForm
      return { systemForm: form, params: d.params ?? {} }
    }
    return null
  } catch {
    return null
  }
}

/** يعيد بناء بيانات تصريح من معاملات وثيقة مؤرشفة */
export function authFromParams(p: Record<string, string> | undefined): AuthorizationData {
  return {
    guardianName: p?.guardianName ?? '',
    guardianBirth: p?.guardianBirth ?? '',
    guardianId: p?.guardianId ?? '',
    guardianIdDate: p?.guardianIdDate ?? '',
    address: p?.address ?? '',
    childName: p?.childName ?? '',
    childBirth: p?.childBirth ?? '',
    sport: p?.sport ?? '',
    childGender: p?.childGender === 'female' ? 'female' : 'male',
  }
}

/** سطر حقل بقيمة معبأة أو متقطعة للطباعة اليدوية */
function FieldLine({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex items-end gap-2">
      <span className="shrink-0 text-[13.5px] font-black">{label}:</span>
      {value.trim() ? (
        <span className="flex-1 border-b border-dotted border-neutral-500 px-2 text-center text-[13.5px] font-bold leading-8">
          {value}
        </span>
      ) : (
        <span className="flex-1 border-b border-dotted border-neutral-400 leading-8">&nbsp;</span>
      )}
    </div>
  )
}

// ClubLetterhead نُقلت إلى letterhead-settings.tsx (ترويسة موحدة قابلة للتخصيص) وتُستورد أعلاه.

// ==================================================================
// 1) ورقة تصريح أبوي
// ==================================================================

export function ParentAuthorizationPaper({
  data,
  printable = true,
}: {
  data: AuthorizationData
  printable?: boolean
}) {
  const d = data
  const accent = useAccentColor()
  return (
    <div
      className={`doc-paper mx-auto w-full max-w-[680px] p-6 sm:p-9 ${printable ? 'doc-print-area' : ''}`}
      style={{ ['--doc-accent' as string]: accent }}
      dir="rtl"
    >
      <div className="doc-paper-frame" />

      {/* علامة مائية خفيفة */}
      <PaperWatermark />

      <div className="relative px-1 sm:px-2">
        <ClubLetterhead compact />
        <div className="mt-1.5 text-[10px] font-black text-neutral-600">
          الموسم: <span dir="ltr">{seasonLabel()}</span>
        </div>

        <h3 className="mt-4 text-center text-xl font-black underline decoration-2 underline-offset-8">
          تصريح أبوي
        </h3>

        <div className="mt-6 space-y-5">
          <FieldLine label="أنا الموقع أسمائه السبعة" value={d.guardianName} />
          <FieldLine label="تاريخ ومكان الميلاد" value={d.guardianBirth} />
          <FieldLine label="رقم بط.ت / ج.س / ر.س" value={d.guardianId} />
          <FieldLine label="الصدارة بتاريخ" value={d.guardianIdDate} />
          <FieldLine label="السكن في" value={d.address} />

          {/* جملة التصريح */}
          <div className="flex flex-wrap items-end gap-x-2 gap-y-1 text-[13.5px] leading-8">
            <span className="font-black">أصرح {d.childGender === 'female' ? 'لأبنتي' : 'لأبني'}</span>
            {d.childName.trim() ? (
              <span className="min-w-44 flex-1 border-b border-dotted border-neutral-500 px-2 text-center font-bold leading-8">
                {d.childName}
              </span>
            ) : (
              <span className="min-w-44 flex-1 border-b border-dotted border-neutral-400 leading-8">&nbsp;</span>
            )}
            {d.childBirth.trim() && (
              <>
                <span className="font-black">المولود(ة) في</span>
                <span className="border-b border-dotted border-neutral-500 px-2 text-center font-bold leading-8">
                  {d.childBirth}
                </span>
              </>
            )}
            <span className="font-black">للقيام بممارسة رياضة</span>
            {d.sport.trim() ? (
              <span className="min-w-32 border-b border-dotted border-neutral-500 px-2 text-center font-bold leading-8">
                {d.sport}
              </span>
            ) : (
              <span className="min-w-32 border-b border-dotted border-neutral-400 leading-8">&nbsp;</span>
            )}
            <span className="font-black">.</span>
          </div>
        </div>

        {/* التوقيعات */}
        <footer className="mt-12 flex items-end justify-between px-2 text-[11px] font-black">
          <div className="text-center">
            <div>أعضاء المكتب المسؤول</div>
            <div className="mt-12 w-28 border-t border-dashed border-neutral-400" />
          </div>
          <div className="text-center">
            <div>إمضاء صاحب البطاقة</div>
            <div className="mt-12 w-28 border-t border-dashed border-neutral-400" />
          </div>
        </footer>
      </div>
    </div>
  )
}

/** بيانات تصريح مبدئية من طلب انخراط قاصر */
export function authorizationFromEnrollment(
  e: EnrollmentItem,
  sportName: string
): AuthorizationData {
  return {
    ...EMPTY_AUTHORIZATION,
    guardianName: e.parentName || '',
    address: e.address || '',
    childName: e.fullName || `${e.firstName} ${e.lastName}`.trim(),
    childBirth: formatDateDMY(e.birthDate),
    sport: sportName,
    childGender: e.gender === 'female' ? 'female' : 'male',
  }
}

/** نافذة تحرير وطباعة تصريح أبوي (إدارة / مكتب فرع / الواجهة العامة) */
export function ParentAuthorizationDialog({
  open,
  onClose,
  initial,
  canArchive = false,
  onSaved,
  publicMode = false,
}: {
  open: boolean
  onClose: () => void
  initial: Partial<AuthorizationData>
  canArchive?: boolean
  onSaved?: () => void
  publicMode?: boolean
}) {
  const { toast } = useToast()
  const [d, setD] = useState<AuthorizationData>({ ...EMPTY_AUTHORIZATION })
  const [seed, setSeed] = useState('')
  const [saving, setSaving] = useState(false)

  // إعادة التهيئة عند كل فتح بقيم جديدة
  const seedKey = open ? JSON.stringify(initial) : ''
  if (open && seedKey && seedKey !== seed) {
    setSeed(seedKey)
    setD({ ...EMPTY_AUTHORIZATION, ...initial, childGender: initial.childGender === 'female' ? 'female' : 'male' })
  }
  if (!open && seed) setSeed('')

  const set = (k: keyof AuthorizationData) => (v: string) =>
    setD((prev) => ({ ...prev, [k]: v }))

  const saveArchive = async () => {
    setSaving(true)
    try {
      const res = await apiFetch('/api/admin/documents', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'create',
          data: {
            refNumber: '',
            title: `تصريح أبوي — ${d.childName || 'غير معبأ'}`,
            type: 'file',
            category: 'تصاريح الآباء',
            content: `تصريح أبوي للمنخرط(ة) ${d.childName || '—'}${d.childBirth ? ` المولود(ة) في ${d.childBirth}` : ''} — ولي الأمر: ${d.guardianName || '—'} — رياضة ${d.sport || '—'} — حرر بتاريخ ${formatDateDMY(new Date())}.`,
            design: JSON.stringify({
              style: 'official',
              accent: 'navy',
              showLogo: true,
              showStamp: false,
              showWatermark: true,
              signatureName: 'صاحب البطاقة',
              systemForm: 'parent-authorization',
              params: { ...d },
            }),
            visibleToBranch: false,
          },
        }),
      })
      const j = await res.json()
      if (!res.ok) throw new Error(j?.error || 'فشل الحفظ في الأرشيف')
      toast({ title: 'تم أرشفة التصريح في مكتب النادي' })
      onSaved?.()
      onClose()
    } catch (e) {
      toast({ title: e instanceof Error ? e.message : 'فشل الحفظ', variant: 'destructive' })
    } finally {
      setSaving(false)
    }
  }

  return (
    <Dialog open={open} onOpenChange={(v) => !v && onClose()}>
      <DialogContent className="sm:max-w-5xl max-h-[92vh] overflow-y-auto nice-scroll">
        <DialogHeader className="doc-print-hide">
          <DialogTitle className="flex items-center gap-2">
            <FileSignature className="h-5 w-5 text-(--club)" />
            تصريح أبوي — ورقة رسمية قابلة للطباعة
          </DialogTitle>
          <DialogDescription>
            {publicMode
              ? 'أكمل الحقول الناقصة (تاريخ ومكان ميلادك، رقم البطاقة، الصدارة) ثم اطبع الورقة ووقّعها وسلّمها للنادي.'
              : 'تحقق من البيانات وأكمل الحقول الناقصة ثم اطبع الورقة — ويمكنك أرشفتها في مكتب النادي.'}
          </DialogDescription>
        </DialogHeader>

        <div className="grid grid-cols-1 lg:grid-cols-[400px_1fr] gap-5">
          {/* نموذج التحرير */}
          <div className="space-y-3 doc-print-hide lg:order-1">
            <div className="rounded-xl bg-(--club-light) border border-(--club)/15 p-3 flex items-start gap-2">
              <Info className="h-4 w-4 text-(--club) shrink-0 mt-0.5" />
              <p className="text-[11px] font-bold text-(--club-dark) leading-relaxed">
                الحقول الفارغة تُطبع بخطوط منقطة لتُملأ يدوياً بالقلم — كما في النموذج الورقي للنادي.
              </p>
            </div>
            <div className="space-y-1.5">
              <Label>اسم الولي (أسماؤه السبعة)</Label>
              <Input value={d.guardianName} onChange={(e) => set('guardianName')(e.target.value)} placeholder="مثال: محمد أمين بلقاسم" />
            </div>
            <div className="space-y-1.5">
              <Label>تاريخ ومكان ميلاد الولي</Label>
              <Input value={d.guardianBirth} onChange={(e) => set('guardianBirth')(e.target.value)} placeholder="مثال: 12/05/1978 بسعيدة" />
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1.5">
                <Label>رقم بط.ت / ج.س / ر.س</Label>
                <Input value={d.guardianId} onChange={(e) => set('guardianId')(e.target.value)} placeholder="123456789" />
              </div>
              <div className="space-y-1.5">
                <Label>الصدارة بتاريخ</Label>
                <Input value={d.guardianIdDate} onChange={(e) => set('guardianIdDate')(e.target.value)} placeholder="01/01/2020" />
              </div>
            </div>
            <div className="space-y-1.5">
              <Label>السكن في</Label>
              <Input value={d.address} onChange={(e) => set('address')(e.target.value)} placeholder="عنوان السكن" />
            </div>
            <SeparatorLine />
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1.5">
                <Label>اسم الابن(ة)</Label>
                <Input value={d.childName} onChange={(e) => set('childName')(e.target.value)} placeholder="الاسم الكامل" />
              </div>
              <div className="space-y-1.5">
                <Label>تاريخ ميلاده(ا)</Label>
                <Input value={d.childBirth} onChange={(e) => set('childBirth')(e.target.value)} placeholder="يوم/شهر/سنة" />
              </div>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1.5">
                <Label>الصيغة</Label>
                <select
                  value={d.childGender}
                  onChange={(e) => setD((prev) => ({ ...prev, childGender: e.target.value as 'male' | 'female' }))}
                  className="flex h-9 w-full rounded-md border border-input bg-transparent px-3 py-1 text-sm shadow-xs"
                >
                  <option value="male">لأبني</option>
                  <option value="female">لأبنتي</option>
                </select>
              </div>
              <div className="space-y-1.5">
                <Label>الرياضة</Label>
                <Input value={d.sport} onChange={(e) => set('sport')(e.target.value)} placeholder="مثال: ألعاب القوى" />
              </div>
            </div>

            <div className="flex flex-wrap gap-2 pt-1">
              <Button onClick={() => window.print()} className="flex-1 bg-(--club) hover:bg-(--club)/90 text-white font-bold">
                <Printer className="h-4 w-4 ml-1" /> طباعة الورقة
              </Button>
              {canArchive && (
                <Button variant="outline" onClick={saveArchive} disabled={saving} className="font-bold">
                  {saving ? <Loader2 className="h-4 w-4 animate-spin ml-1" /> : <Archive className="h-4 w-4 ml-1" />}
                  أرشفة
                </Button>
              )}
            </div>
          </div>

          {/* المعاينة الحية (الطباعة تمر عبر بوابة doc-only-print) */}
          <div className="rounded-xl bg-muted/50 p-3 lg:order-2">
            <div className="max-h-[62vh] overflow-y-auto nice-scroll">
              <ParentAuthorizationPaper data={d} printable={false} />
            </div>
          </div>
        </div>
      </DialogContent>
      {open && (
        <PrintPortal>
          <ParentAuthorizationPaper data={d} />
        </PrintPortal>
      )}
    </Dialog>
  )
}

function SeparatorLine() {
  return <div className="border-t border-dashed border-(--border) my-1" />
}

// ==================================================================
// 2) طلب حصة تدريبية — مراسلة رسمية
// ==================================================================

export interface TrainingRequestData {
  refNumber: string
  dateText: string
  recipient: string
  subject: string
  body: string
}

export function TrainingRequestPaper({
  data,
  printable = true,
}: {
  data: TrainingRequestData
  printable?: boolean
}) {
  const accent = useAccentColor()
  return (
    <div
      className={`doc-paper mx-auto w-full max-w-[680px] p-6 sm:p-9 ${printable ? 'doc-print-area' : ''}`}
      style={{ ['--doc-accent' as string]: accent }}
      dir="rtl"
    >
      <div className="doc-paper-frame" />
      <PaperWatermark />

      <div className="relative px-1 sm:px-2">
        <ClubLetterhead />

        <div className="mt-3 flex flex-wrap items-center justify-between gap-2 text-[11.5px] font-black">
          <span>
            الرقم: <span className="font-mono" dir="ltr">{data.refNumber || '..........'}</span>
          </span>
          <span>
            سعيدة في: <span dir="ltr">{data.dateText || '..........'}</span>
          </span>
        </div>

        <p className="mt-4 text-[13.5px] font-black">إلى السيد: {data.recipient || '.....................'}</p>

        <p className="mt-4 text-center text-[15px] font-black underline decoration-2 underline-offset-8">
          الموضوع: {data.subject || '.....................'}
        </p>

        <div className="mt-5 min-h-[190px] whitespace-pre-wrap text-[13.5px] font-medium leading-[2.1] text-neutral-800">
          {data.body}
        </div>

        <p className="mt-2 text-[13.5px] font-bold leading-[2]">
          وفي انتظار استجابتكم، تقبلوا فائق عبارات الاحترام والتقدير.
        </p>

        <footer className="mt-10 flex items-end justify-between px-2">
          <div className="doc-stamp h-20 w-20 flex flex-col items-center justify-center text-[8px] font-black">
            <Stamp className="h-4 w-4 fill-current" />
            <span>الجمهورية الجزائرية</span>
            <span>جمعية الرائد الرياضي</span>
          </div>
          <div className="text-center">
            <div className="text-[13px] font-black underline">الرئيس</div>
            <div className="mt-10 w-28 border-t border-dashed border-neutral-400" />
          </div>
        </footer>
      </div>
    </div>
  )
}

interface SlotRow {
  place: string
  days: string
  time: string
  branch: string
}

const DEFAULT_ROWS: SlotRow[] = [
  { place: 'ملعب الإخوة براسي (المضمار)', days: 'كل يوم', time: '', branch: 'فرع ألعاب القوى' },
  { place: 'الملعب الصغير ملحق (2)', days: 'يوم الخميس مساءً', time: '17:00', branch: 'فرع كرة القدم داخل القاعة' },
]

/** تركيب نص الطلب الرسمي من أسطر الحصص */
function composeBody(rows: SlotRow[], recipient: string): string {
  const parts = rows
    .filter((r) => r.place.trim() || r.days.trim() || r.branch.trim() || r.time.trim())
    .map((r) => {
      let s = r.days.trim() ? `${r.days.trim()} ` : ''
      s += `في ${r.place.trim() || '................'}`
      if (r.branch.trim()) s += ` (${r.branch.trim()})`
      if (r.time.trim()) s += ` ابتداءً من الساعة ${r.time.trim()}`
      return s
    })
  const who = recipient.includes('المجلس الشعبي') ? 'سيادتكم' : 'سعادتكم'
  const list = parts.join('، و')
  return `يشرفني أن أتقدم إلي ${who} بطلبي هذا، المتمثل في طلب حصص تدريبية ${list}، وذلك من أجل التحضيرات للدخول في المنافسات الولائية والجهوية والوطنية.`
}

/** نافذة مولّد طلب حصة تدريبية (الإدارة) */
export function TrainingRequestDialog({
  open,
  onClose,
  branches,
  requestCount,
  onSaved,
}: {
  open: boolean
  onClose: () => void
  branches: BranchWithAccount[]
  requestCount: number
  onSaved?: () => void
}) {
  const { toast } = useToast()
  const [refNumber, setRefNumber] = useState('')
  const [dateText, setDateText] = useState('')
  const [recipient, setRecipient] = useState('رئيس المجلس الشعبي البلدي لبلدية سعيدة')
  const [subject, setSubject] = useState('طلب حصة تدريبية في ملعب الإخوة براسي')
  const [rows, setRows] = useState<SlotRow[]>(DEFAULT_ROWS)
  const [manual, setManual] = useState(false)
  const [manualBody, setManualBody] = useState('')
  const [saving, setSaving] = useState(false)
  const [seed, setSeed] = useState('')

  const seedKey = open ? 'open' : ''
  if (open && seedKey && seedKey !== seed) {
    setSeed(seedKey)
    setRefNumber(`${String(requestCount + 1).padStart(2, '0')}/ن.ر.ه.ر.س/${new Date().getFullYear()}`)
    setDateText(formatDateDMY(new Date()))
    setRecipient('رئيس المجلس الشعبي البلدي لبلدية سعيدة')
    setSubject('طلب حصة تدريبية في ملعب الإخوة براسي')
    setRows(DEFAULT_ROWS.map((r) => ({ ...r })))
    setManual(false)
    setManualBody('')
  }
  if (!open && seed) setSeed('')

  const composed = useMemo(() => composeBody(rows, recipient), [rows, recipient])
  const data: TrainingRequestData = {
    refNumber,
    dateText,
    recipient,
    subject,
    body: manual && manualBody.trim() ? manualBody.trim() : composed,
  }

  const setRow = (i: number, k: keyof SlotRow) => (v: string) =>
    setRows((prev) => prev.map((r, idx) => (idx === i ? { ...r, [k]: v } : r)))
  const addRow = () => setRows((prev) => [...prev, { place: '', days: '', time: '', branch: '' }])
  const removeRow = (i: number) => setRows((prev) => (prev.length > 1 ? prev.filter((_, idx) => idx !== i) : prev))

  const saveArchive = async () => {
    setSaving(true)
    try {
      const res = await apiFetch('/api/admin/documents', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'create',
          data: {
            refNumber,
            title: subject || 'طلب حصة تدريبية',
            type: 'request',
            category: 'طلبات الملاعب',
            content: data.body,
            design: JSON.stringify({
              style: 'official',
              accent: 'navy',
              showLogo: true,
              showStamp: true,
              showWatermark: true,
              signatureName: 'الرئيس',
              systemForm: 'training-request',
              params: {
                refNumber,
                dateText,
                recipient,
                subject,
                body: data.body,
              },
            }),
            visibleToBranch: false,
          },
        }),
      })
      const j = await res.json()
      if (!res.ok) throw new Error(j?.error || 'فشل الحفظ في الأرشيف')
      toast({ title: 'تم أرشفة الطلب في مكتب النادي' })
      onSaved?.()
      onClose()
    } catch (e) {
      toast({ title: e instanceof Error ? e.message : 'فشل الحفظ', variant: 'destructive' })
    } finally {
      setSaving(false)
    }
  }

  return (
    <Dialog open={open} onOpenChange={(v) => !v && onClose()}>
      <DialogContent className="sm:max-w-5xl max-h-[92vh] overflow-y-auto nice-scroll">
        <DialogHeader className="doc-print-hide">
          <DialogTitle className="flex items-center gap-2">
            <Landmark className="h-5 w-5 text-(--club)" />
            طلب حصة تدريبية — مراسلة رسمية
          </DialogTitle>
          <DialogDescription>
            مراسلة بترويسة النادي الرسمية موجهة للسلطات البلدية — عدّل أسطر الحصص وسيُركَّب النص الرسمي تلقائياً.
          </DialogDescription>
        </DialogHeader>

        <div className="grid grid-cols-1 lg:grid-cols-[400px_1fr] gap-5">
          {/* نموذج التحرير */}
          <div className="space-y-3 doc-print-hide">
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1.5">
                <Label>الرقم</Label>
                <Input value={refNumber} onChange={(e) => setRefNumber(e.target.value)} />
              </div>
              <div className="space-y-1.5">
                <Label>التاريخ (سعيدة في)</Label>
                <Input value={dateText} onChange={(e) => setDateText(e.target.value)} placeholder="يوم/شهر/سنة" />
              </div>
            </div>
            <div className="space-y-1.5">
              <Label>إلى السيد</Label>
              <Input value={recipient} onChange={(e) => setRecipient(e.target.value)} />
            </div>
            <div className="space-y-1.5">
              <Label>الموضوع</Label>
              <Input value={subject} onChange={(e) => setSubject(e.target.value)} />
            </div>

            <SeparatorLine />

            <div className="flex items-center justify-between">
              <Label className="font-black">حصص التدريب المطلوبة</Label>
              <Button type="button" size="sm" variant="outline" onClick={addRow} className="font-bold">
                <Plus className="h-3.5 w-3.5 ml-1" /> سطر
              </Button>
            </div>

            <div className="space-y-3">
              {rows.map((r, i) => (
                <div key={i} className="rounded-xl border border-(--border) bg-muted/30 p-3 space-y-2">
                  <div className="flex items-center justify-between">
                    <Badge variant="outline" className="text-[10px]">حصة {i + 1}</Badge>
                    {rows.length > 1 && (
                      <Button
                        type="button"
                        size="icon"
                        variant="ghost"
                        className="h-7 w-7 text-destructive"
                        aria-label="حذف السطر"
                        onClick={() => removeRow(i)}
                      >
                        <Trash2 className="h-3.5 w-3.5" />
                      </Button>
                    )}
                  </div>
                  <Input value={r.place} onChange={(e) => setRow(i, 'place')(e.target.value)} placeholder="المكان — مثال: ملعب الإخوة براسي (المضمار)" />
                  <div className="grid grid-cols-2 gap-2">
                    <Input value={r.days} onChange={(e) => setRow(i, 'days')(e.target.value)} placeholder="الأيام — مثال: كل يوم" />
                    <Input value={r.time} onChange={(e) => setRow(i, 'time')(e.target.value)} placeholder="التوقيت — مثال: 17:00" />
                  </div>
                  <Input value={r.branch} onChange={(e) => setRow(i, 'branch')(e.target.value)} placeholder="الفرع المعني — مثال: فرع ألعاب القوى" />
                  {branches.length > 0 && (
                    <select
                      value=""
                      onChange={(e) => e.target.value && setRow(i, 'branch')(`فرع ${e.target.value}`)}
                      className="flex h-8 w-full rounded-md border border-input bg-transparent px-2 py-1 text-xs"
                      aria-label="اختيار سريع للفرع"
                    >
                      <option value="">اختيار سريع من فروع النادي…</option>
                      {branches.map((b) => (
                        <option key={b.id} value={b.name}>{b.name}</option>
                      ))}
                    </select>
                  )}
                </div>
              ))}
            </div>

            <div className="flex items-center justify-between rounded-xl border border-(--border) bg-muted/40 p-3">
              <div>
                <div className="text-xs font-black text-(--club-dark)">تحرير النص يدوياً</div>
                <p className="text-[10px] text-muted-foreground mt-0.5">لتعديل الصياغة الرسمية بحرية كاملة</p>
              </div>
              <Switch checked={manual} onCheckedChange={setManual} />
            </div>
            {manual && (
              <Textarea value={manualBody} onChange={(e) => setManualBody(e.target.value)} rows={6} placeholder="اكتب نص الطلب…" />
            )}

            <div className="flex flex-wrap gap-2 pt-1">
              <Button onClick={() => window.print()} className="flex-1 bg-(--club) hover:bg-(--club)/90 text-white font-bold">
                <Printer className="h-4 w-4 ml-1" /> طباعة الطلب
              </Button>
              <Button variant="outline" onClick={saveArchive} disabled={saving} className="font-bold">
                {saving ? <Loader2 className="h-4 w-4 animate-spin ml-1" /> : <Archive className="h-4 w-4 ml-1" />}
                أرشفة
              </Button>
            </div>
          </div>

          {/* المعاينة الحية (الطباعة تمر عبر بوابة doc-only-print) */}
          <div className="rounded-xl bg-muted/50 p-3">
            <div className="max-h-[62vh] overflow-y-auto nice-scroll">
              <TrainingRequestPaper data={data} printable={false} />
            </div>
          </div>
        </div>
      </DialogContent>
      {open && (
        <PrintPortal>
          <TrainingRequestPaper data={data} />
        </PrintPortal>
      )}
    </Dialog>
  )
}

// ==================================================================
// قسم النماذج النظامية في مكتب النادي (الإدارة)
// ==================================================================

export function SystemFormsSection({
  enrollments,
  branches,
  requestCount,
  onSaved,
}: {
  enrollments: (EnrollmentItem & { branch?: { name: string; color: string; slug: string } })[]
  branches: BranchWithAccount[]
  requestCount: number
  onSaved?: () => void
}) {
  const [authOpen, setAuthOpen] = useState(false)
  const [authInitial, setAuthInitial] = useState<Partial<AuthorizationData>>({})
  const [pickerOpen, setPickerOpen] = useState(false)
  const [pickerQuery, setPickerQuery] = useState('')
  const [trainingOpen, setTrainingOpen] = useState(false)

  const minors = enrollments.filter((e) => !!e.parentName)
  const filteredMinors = minors.filter((e) => {
    const q = pickerQuery.trim()
    if (!q) return true
    return (e.fullName || `${e.firstName} ${e.lastName}`).includes(q) || (e.parentName || '').includes(q)
  })

  const openBlank = () => {
    setAuthInitial({})
    setAuthOpen(true)
  }
  const openFor = (e: EnrollmentItem & { branch?: { name: string } }) => {
    setAuthInitial(authorizationFromEnrollment(e, e.branch?.name || ''))
    setPickerOpen(false)
    setAuthOpen(true)
  }

  return (
    <>
      <div className="rounded-2xl bg-white border border-(--border) p-4 mb-4">
        <div className="flex items-center gap-2 mb-3">
          <Stamp className="h-4.5 w-4.5 text-(--club)" />
          <h3 className="font-black text-(--club-dark) text-sm">النماذج النظامية الجاهزة</h3>
          <Badge variant="outline" className="text-[10px]">تُطبع بترويسة النادي الرسمية</Badge>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
          {/* تصريح أبوي */}
          <div className="rounded-xl border border-(--border) bg-muted/30 p-4 flex flex-col gap-3">
            <div className="flex items-start gap-3">
              <div className="h-10 w-10 rounded-xl bg-(--club-light) flex items-center justify-center shrink-0">
                <FileSignature className="h-5 w-5 text-(--club)" />
              </div>
              <div className="min-w-0">
                <div className="font-black text-sm text-(--club-dark)">تصريح أبوي</div>
                <p className="text-[11px] text-muted-foreground mt-0.5 leading-relaxed">
                  للمنخرطين الأقل من 18 سنة — يُولَّد تلقائياً بمعلومات الولي والابن بعد كل استمارة انخراط قاصر،
                  ويُطبع فارغاً لتعبئته يدوياً.
                </p>
              </div>
            </div>
            <div className="flex flex-wrap gap-2 mt-auto">
              <Button size="sm" variant="outline" onClick={openBlank} className="font-bold">
                <Printer className="h-3.5 w-3.5 ml-1" /> طباعة نموذج فارغ
              </Button>
              <Button
                size="sm"
                onClick={() => setPickerOpen(true)}
                className="bg-(--club) hover:bg-(--club)/90 text-white font-bold"
              >
                <FileSignature className="h-3.5 w-3.5 ml-1" />
                إصدار لمنخرط قاصر ({minors.length})
              </Button>
            </div>
          </div>

          {/* طلب حصة تدريبية */}
          <div className="rounded-xl border border-(--border) bg-muted/30 p-4 flex flex-col gap-3">
            <div className="flex items-start gap-3">
              <div className="h-10 w-10 rounded-xl bg-(--club-light) flex items-center justify-center shrink-0">
                <Landmark className="h-5 w-5 text-(--club)" />
              </div>
              <div className="min-w-0">
                <div className="font-black text-sm text-(--club-dark)">طلب حصة تدريبية</div>
                <p className="text-[11px] text-muted-foreground mt-0.5 leading-relaxed">
                  مراسلة رسمية بترويسة النادي موجهة لرئيس المجلس الشعبي البلدي لطلب حصص تدريبية
                  في الملاعب البلدية — يُركَّب النص تلقائياً من أسطر الحصص.
                </p>
              </div>
            </div>
            <div className="flex flex-wrap gap-2 mt-auto">
              <Button
                size="sm"
                onClick={() => setTrainingOpen(true)}
                className="bg-(--club) hover:bg-(--club)/90 text-white font-bold"
              >
                <Landmark className="h-3.5 w-3.5 ml-1" /> إنشاء الطلب الرسمي
              </Button>
            </div>
          </div>
        </div>
      </div>

      {/* منتقي المنخرط القاصر */}
      <Dialog open={pickerOpen} onOpenChange={setPickerOpen}>
        <DialogContent className="sm:max-w-xl max-h-[85vh] overflow-y-auto nice-scroll">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <FileSignature className="h-5 w-5 text-(--club)" />
              إصدار تصريح أبوي لمنخرط قاصر
            </DialogTitle>
            <DialogDescription>
              اختر طلب انخراط قاصر (يملك معلومات ولي الأمر) — ستُعبأ الورقة تلقائياً.
            </DialogDescription>
          </DialogHeader>
          <div className="relative">
            <Search className="absolute right-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input value={pickerQuery} onChange={(e) => setPickerQuery(e.target.value)} placeholder="ابحث باسم المنخرط أو ولي الأمر…" className="pr-9" />
          </div>
          <div className="space-y-2 max-h-[46vh] overflow-y-auto nice-scroll">
            {filteredMinors.length === 0 && (
              <div className="p-6 text-center text-sm text-muted-foreground">
                {minors.length === 0 ? 'لا توجد طلبات انخراط لأشخاص قاصرين بعد' : 'لا نتائج مطابقة للبحث'}
              </div>
            )}
            {filteredMinors.map((e) => (
              <button
                key={e.id}
                onClick={() => openFor(e)}
                className="w-full text-right rounded-xl border border-(--border) bg-white p-3 hover:border-(--club)/50 hover:bg-(--club-light)/40 transition-colors"
              >
                <div className="flex items-center gap-2 flex-wrap">
                  <span className="font-black text-sm text-(--club-dark)">
                    {e.fullName || `${e.firstName} ${e.lastName}`}
                  </span>
                  <Badge className="bg-amber-100 text-amber-800 border border-amber-200 text-[10px]">قاصر — {e.age} سنة</Badge>
                  {e.branch && <Badge variant="outline" className="text-[10px]">{e.branch.name}</Badge>}
                </div>
                <div className="text-[11px] text-muted-foreground mt-1">
                  ولي الأمر: {e.parentName} {e.birthDate && `— المولود في ${formatDateDMY(e.birthDate)}`}
                </div>
              </button>
            ))}
          </div>
        </DialogContent>
      </Dialog>

      {/* نافذتا الإصدار */}
      <ParentAuthorizationDialog
        open={authOpen}
        onClose={() => setAuthOpen(false)}
        initial={authInitial}
        canArchive
        onSaved={onSaved}
      />
      <TrainingRequestDialog
        open={trainingOpen}
        onClose={() => setTrainingOpen(false)}
        branches={branches}
        requestCount={requestCount}
        onSaved={onSaved}
      />
    </>
  )
}
