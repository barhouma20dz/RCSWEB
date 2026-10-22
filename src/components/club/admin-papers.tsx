'use client'

/**
 * مكتبة النماذج الإدارية الرسمية لمكتب النادي (الإدارة العامة):
 *
 * 1) استعمال الزمن — جدول حصص المدرب الأسبوعي (7 أيام × فترات قابلة للتسمية)
 * 2) عقد عمل محدد المدة (CDD) — النموذج الرسمي الكامل: 14 مادة + الملحق رقم 01
 *    (بطاقة المنصب والمهام) في صفحة مستقلة — عقد واحد لكل الفروع الرياضية
 * 3) محضر استئناف العمل — بعد استيفاء العطلة
 * 4) طلب وسيلة نقل — مراسلة للمجلس الشعبي البلدي
 * 5) جدول إرسال (Bordereau d'envoi) — بقائمة الوثائق والأعداد
 * 6) شهادة ثبوت مكان مزاولة النشاط — تصديق من مدير الملعب البلدي
 * 7) طلب إعانة مالية — مراسلة للمجلس الشعبي البلدي
 * 8) وصل استلام مستحقات — للدفعات المالية للمنتسبين
 *
 * كل نموذج: نافذة تحرير بمعاينة حية + طباعة + أرشفة في مكتب النادي.
 * كل الأوراق تحمل الترويسة الموحدة القابلة للتخصيص (letterhead-settings).
 * إعدادات التنسيق عند التعديل (doc-blocks): محاذاة/ضبط، عنوان الوثيقة، ترتيب النصوص
 * يدوياً، سطر جديد في نفس النص، حجم الكتابة والعريض والنقاط لكل نص، وحجم الورقة A4/A5.
 */

import { useState } from 'react'
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
  CalendarClock,
  FileText,
  FileCheck2,
  Truck,
  SendHorizonal,
  Building2,
  Wallet,
  ReceiptText,
  Settings2,
  PenLine,
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
import type { EnrollmentItem, BranchWithAccount, ClubDocumentItem } from './types'
import {
  ClubLetterhead,
  PaperWatermark,
  useAccentColor,
  seasonLabel,
  LetterheadQuickSettings,
  LetterheadSettingsDialog,
  SignaturesQuickSettings,
  SignatureSettingsDialog,
  SignatureStrip,
} from './letterhead-settings'
import {
  DocBlocksEditor,
  DocBlocksView,
  DocTextEditor,
  DocTextView,
  PaperSizeSelector,
  PrintPageSize,
  blocksFromJson,
  blocksToJson,
  blocksToPlain,
  docTextFromJson,
  docTextToJson,
  makeBlock,
  makeDocText,
  paperSizeFromParams,
  paperWidthClass,
  type DocBlock,
  type DocText,
  type PaperSize,
} from './doc-blocks'
import {
  PrintPortal,
  parseSystemDesign,
  authFromParams,
  authorizationFromEnrollment,
  ParentAuthorizationDialog,
  TrainingRequestDialog,
  ParentAuthorizationPaper,
  TrainingRequestPaper,
  type AuthorizationData,
} from './system-papers'

// ==================================================================
// أدوات مشتركة
// ==================================================================

/** غلاف الورقة الموحد: خلفية + إطار + علامة مائية + لون الهوية */
function PaperShell({
  children,
  printable = true,
  wide = false,
  flow = false,
  paperSize = 'A4',
}: {
  children: React.ReactNode
  printable?: boolean
  wide?: boolean
  /** ورقة ممتدة على عدة صفحات (العقود) — بلا إطار زخرفي عند الطباعة */
  flow?: boolean
  /** حجم الورقة A4 / A5 — يضبط عرض المعاينة */
  paperSize?: PaperSize
}) {
  const accent = useAccentColor()
  return (
    <div
      className={`doc-paper mx-auto w-full ${paperWidthClass(paperSize, wide)} ${paperSize === 'A5' ? 'p-5 sm:p-7' : 'p-6 sm:p-9'} ${flow ? 'doc-paper-flow' : ''} ${printable ? 'doc-print-area' : ''}`}
      style={{ ['--doc-accent' as string]: accent }}
      dir="rtl"
    >
      <div className="doc-paper-frame" />
      <PaperWatermark />
      <div className="relative px-1 sm:px-2">{children}</div>
    </div>
  )
}

/** سطر حقل رسمي — معبأ أو بخط منقط للتعبئة اليدوية */
function FieldLine({ label, value, strong = false }: { label: string; value: string; strong?: boolean }) {
  return (
    <div className="flex items-end gap-2">
      <span className={`shrink-0 text-[13.5px] ${strong ? 'font-black' : 'font-bold'}`}>{label}</span>
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

/** عنوان قسم داخل نموذج التحرير */
function EditorGroup({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div className="space-y-2">
      <div className="text-[11px] font-black text-(--club-dark) flex items-center gap-1.5">
        <span className="h-1.5 w-1.5 rounded-full bg-(--club)" />
        {title}
      </div>
      {children}
    </div>
  )
}

/** صندوق المعاينة الحية */
function PreviewPane({ children }: { children: React.ReactNode }) {
  return (
    <div className="rounded-xl bg-muted/50 p-3 lg:order-2">
      <div className="max-h-[62vh] overflow-y-auto nice-scroll">{children}</div>
    </div>
  )
}

/** أزرار الطباعة والأرشفة */
function PrintArchiveButtons({
  onPrint,
  onArchive,
  saving,
}: {
  onPrint: () => void
  onArchive?: () => void
  saving: boolean
}) {
  return (
    <div className="flex flex-wrap gap-2 pt-1">
      <Button onClick={onPrint} className="flex-1 bg-(--club) hover:bg-(--club)/90 text-white font-bold">
        <Printer className="h-4 w-4 ml-1" /> طباعة الورقة
      </Button>
      {onArchive && (
        <Button variant="outline" onClick={onArchive} disabled={saving} className="font-bold">
          {saving ? <Loader2 className="h-4 w-4 animate-spin ml-1" /> : <Archive className="h-4 w-4 ml-1" />}
          أرشفة
        </Button>
      )}
    </div>
  )
}

/** دالة أرشفة موحدة لكل النماذج */
function useArchivePaper(onSaved?: () => void, close?: () => void) {
  const { toast } = useToast()
  const [saving, setSaving] = useState(false)
  const archive = async (payload: {
    refNumber: string
    title: string
    type: string
    category: string
    content: string
    systemForm: string
    params: Record<string, string>
  }) => {
    setSaving(true)
    try {
      const res = await apiFetch('/api/admin/documents', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'create',
          data: {
            refNumber: payload.refNumber,
            title: payload.title,
            type: payload.type,
            category: payload.category,
            content: payload.content,
            design: JSON.stringify({
              style: 'official',
              accent: 'navy',
              showLogo: true,
              showStamp: true,
              showWatermark: true,
              signatureName: 'الرئيس',
              systemForm: payload.systemForm,
              params: payload.params,
            }),
            visibleToBranch: false,
          },
        }),
      })
      const j = await res.json()
      if (!res.ok) throw new Error(j?.error || 'فشل الحفظ في الأرشيف')
      toast({ title: 'تم أرشفة الوثيقة في مكتب النادي' })
      onSaved?.()
      close?.()
      return true
    } catch (e) {
      toast({ title: e instanceof Error ? e.message : 'فشل الحفظ', variant: 'destructive' })
      return false
    } finally {
      setSaving(false)
    }
  }
  return { saving, archive }
}

/** ترويسة رقم + تاريخ أعلى الورقة */
function RefDateLine({ refNumber, dateText, refPrefix }: { refNumber: string; dateText: string; refPrefix?: string }) {
  return (
    <div className="flex flex-wrap items-center justify-between gap-2 text-[11.5px] font-black">
      <span>
        الرقم: <span className="font-mono" dir="ltr">{refNumber || '..........'}</span>
        {refPrefix && <span className="text-[10px] font-bold text-neutral-500"> {refPrefix}</span>}
      </span>
      <span>
        سعيدة في: <span dir="ltr">{dateText || '..........'}</span>
      </span>
    </div>
  )
}

/** ختم دائري رسمي */
function OfficialStamp({ lines }: { lines: [string, string] }) {
  return (
    <div className="doc-stamp h-20 w-20 flex flex-col items-center justify-center text-[8px] font-black">
      <Stamp className="h-4 w-4 fill-current" />
      <span>{lines[0]}</span>
      <span>{lines[1]}</span>
    </div>
  )
}

// ==================================================================
// 1) استعمال الزمن — جدول الحصص الأسبوعي
// ==================================================================

const DAYS = ['الأحد', 'الاثنين', 'الثلاثاء', 'الأربعاء', 'الخميس', 'الجمعة', 'السبت']

export interface TimeScheduleData {
  refNumber: string
  dateText: string
  clubName: string
  personName: string
  rank: string
  workPlace: string
  assignment: string
  periods: string[]
  cells: string[] // 7 أيام × 3 فترات
  rightSign: string
  rightRole: string
  leftSign: string
  /** عنوان الوثيقة المنسق — فارغ = العنوان المُركّب تلقائياً */
  titleStyle: string
  paperSize: PaperSize
}

function defaultScheduleCells(): string[] {
  const full = [0, 1, 3, 4] // أحد، اثنين، أربعاء، خميس
  const cells: string[] = []
  for (let d = 0; d < 7; d++) {
    for (let p = 0; p < 3; p++) cells.push(full.includes(d) ? 'مقر الرابطة' : '')
  }
  return cells
}

export const EMPTY_TIME_SCHEDULE: TimeScheduleData = {
  refNumber: '',
  dateText: '',
  clubName: '',
  personName: '',
  rank: 'مربي رئيسي الأنشطة البدنية والرياضية',
  workPlace: 'مقر الرابطة الولائية لألعاب القوى',
  assignment: 'الرابطة الولائية لألعاب القوى',
  periods: ['08 – 10', '10 – 12', '14 – 15'],
  cells: defaultScheduleCells(),
  rightSign: '',
  rightRole: 'رئيس الرابطة',
  leftSign: '',
  titleStyle: '',
  paperSize: 'A4',
}

export function timeScheduleFromParams(p: Record<string, string> | undefined): TimeScheduleData {
  let periods = [...EMPTY_TIME_SCHEDULE.periods]
  let cells = defaultScheduleCells()
  try {
    if (p?.periods) periods = JSON.parse(p.periods) as string[]
    if (p?.cells) cells = JSON.parse(p.cells) as string[]
  } catch { /* افتراضيات */ }
  return {
    refNumber: p?.refNumber ?? '',
    dateText: p?.dateText ?? '',
    clubName: p?.clubName ?? '',
    personName: p?.personName ?? '',
    rank: p?.rank ?? EMPTY_TIME_SCHEDULE.rank,
    workPlace: p?.workPlace ?? EMPTY_TIME_SCHEDULE.workPlace,
    assignment: p?.assignment ?? EMPTY_TIME_SCHEDULE.assignment,
    periods: periods.length === 3 ? periods : [...EMPTY_TIME_SCHEDULE.periods],
    cells: cells.length === 21 ? cells : defaultScheduleCells(),
    rightSign: p?.rightSign ?? '',
    rightRole: p?.rightRole ?? EMPTY_TIME_SCHEDULE.rightRole,
    leftSign: p?.leftSign ?? '',
    titleStyle: p?.titleStyle ?? '',
    paperSize: paperSizeFromParams(p),
  }
}

/** العنوان المُركّب تلقائياً — يستخدم عندما يُترك عنوان الوثيقة فارغاً */
export function composeScheduleTitle(d: TimeScheduleData): string {
  return `استعمال الزمن لنـاد: ${d.clubName.trim() || '..................'} — الموسم: ${seasonLabel()}`
}

export function TimeSchedulePaper({ data, printable = true }: { data: TimeScheduleData; printable?: boolean }) {
  const title = docTextFromJson(data.titleStyle, makeDocText('', { fontSize: 17, bold: true, align: 'center' }))
  return (
    <PaperShell printable={printable} paperSize={data.paperSize}>
      <ClubLetterhead compact />
      <RefDateLine refNumber={data.refNumber} dateText={data.dateText} />

      <DocTextView
        t={title}
        fallback={composeScheduleTitle(data)}
        className="mt-4 underline decoration-2 underline-offset-8"
      />

      <div className="mt-5 space-y-1.5 text-[13px]">
        <div className="flex items-end gap-2"><span className="font-black shrink-0 w-28">الأسم واللقب:</span><span className="flex-1 border-b border-dotted border-neutral-400 text-center font-bold leading-7">{data.personName || '\u00A0'}</span></div>
        <div className="flex items-end gap-2"><span className="font-black shrink-0 w-28">الرتبــة:</span><span className="flex-1 border-b border-dotted border-neutral-400 text-center font-bold leading-7">{data.rank || '\u00A0'}</span></div>
        <div className="flex items-end gap-2"><span className="font-black shrink-0 w-28">مكـان العمل:</span><span className="flex-1 border-b border-dotted border-neutral-400 text-center font-bold leading-7">{data.workPlace || '\u00A0'}</span></div>
        <div className="flex items-end gap-2"><span className="font-black shrink-0 w-28">التعيـين:</span><span className="flex-1 border-b border-dotted border-neutral-400 text-center font-bold leading-7">{data.assignment || '\u00A0'}</span></div>
      </div>

      {/* جدول الحصص */}
      <table className="mt-6 w-full border-collapse text-[12px]">
        <thead>
          <tr>
            <th className="border border-neutral-500 bg-neutral-100 p-1.5 font-black">الأيام</th>
            {data.periods.map((p, i) => (
              <th key={i} className="border border-neutral-500 bg-neutral-100 p-1.5 font-black" dir="ltr">{p}</th>
            ))}
          </tr>
        </thead>
        <tbody>
          {DAYS.map((day, d) => (
            <tr key={day}>
              <td className="border border-neutral-500 p-1.5 text-center font-black bg-neutral-50">{day}</td>
              {[0, 1, 2].map((p) => (
                <td key={p} className="border border-neutral-500 p-1.5 text-center font-bold min-h-8">
                  {data.cells[d * 3 + p]?.trim() ? data.cells[d * 3 + p] : '\u00A0'}
                </td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>

      <footer className="mt-10 flex items-end justify-between px-2 text-[11px] font-black">
        <div className="text-center">
          <div>{data.rightRole || 'رئيس الرابطة'}</div>
          {data.rightSign.trim() && <div className="mt-1 text-[10px] font-bold">{data.rightSign}</div>}
          <div className="mt-10 w-28 border-t border-dashed border-neutral-400" />
        </div>
        <div className="text-center">
          <div>المنع بالأمر</div>
          {data.leftSign.trim() && <div className="mt-1 text-[10px] font-bold">{data.leftSign}</div>}
          <div className="mt-10 w-28 border-t border-dashed border-neutral-400" />
        </div>
      </footer>
    </PaperShell>
  )
}

export function TimeScheduleDialog({
  open,
  onClose,
  onSaved,
  onOpenLetterhead,
  onOpenSignatures,
}: {
  open: boolean
  onClose: () => void
  onSaved?: () => void
  onOpenLetterhead?: () => void
  onOpenSignatures?: () => void
}) {
  const [d, setD] = useState<TimeScheduleData>({ ...EMPTY_TIME_SCHEDULE })
  const [titleDoc, setTitleDoc] = useState<DocText>(makeDocText('', { fontSize: 17, bold: true }))
  const [seed, setSeed] = useState('')
  const { saving, archive } = useArchivePaper(onSaved, onClose)

  if (open && !seed) {
    setSeed('open')
    setD({
      ...EMPTY_TIME_SCHEDULE,
      refNumber: `.../ر.أ.ق.س/${new Date().getFullYear()}`,
      dateText: formatDateDMY(new Date()),
      cells: defaultScheduleCells(),
    })
    setTitleDoc(makeDocText('', { fontSize: 17, bold: true }))
  }
  if (!open && seed) setSeed('')

  const set = (k: keyof TimeScheduleData) => (v: string) => setD((prev) => ({ ...prev, [k]: v }))
  const setCell = (i: number) => (v: string) =>
    setD((prev) => ({ ...prev, cells: prev.cells.map((c, idx) => (idx === i ? v : c)) }))
  const setPeriod = (i: number) => (v: string) =>
    setD((prev) => ({ ...prev, periods: prev.periods.map((p, idx) => (idx === i ? v : p)) }))

  const data: TimeScheduleData = { ...d, titleStyle: docTextToJson(titleDoc) }

  const saveArchive = () =>
    archive({
      refNumber: d.refNumber,
      title: `استعمال الزمن — ${d.personName || 'غير معبأ'}`,
      type: 'file',
      category: 'وثائق الإدارة',
      content: `استعمال الزمن لناد ${d.clubName || '—'} للموسم ${seasonLabel()} — ${d.personName || '—'} (${d.rank}) — ${d.workPlace}.`,
      systemForm: 'time-schedule',
      params: { ...data, periods: JSON.stringify(d.periods), cells: JSON.stringify(d.cells) },
    })

  return (
    <Dialog open={open} onOpenChange={(v) => !v && onClose()}>
      <DialogContent className="sm:max-w-5xl max-h-[92vh] overflow-y-auto nice-scroll">
        <DialogHeader className="doc-print-hide">
          <DialogTitle className="flex items-center gap-2">
            <CalendarClock className="h-5 w-5 text-(--club)" />
            استعمال الزمن — جدول الحصص الأسبوعي
          </DialogTitle>
          <DialogDescription>
            املأ بيانات المدرب وجدول الحصص الأسبوعي (7 أيام × 3 فترات) ثم اطبع الورقة ويمكنك أرشفتها.
          </DialogDescription>
        </DialogHeader>
        <div className="grid grid-cols-1 lg:grid-cols-[400px_1fr] gap-5">
          <div className="space-y-3 doc-print-hide lg:order-1">
            <div className="flex flex-wrap items-center gap-2">
              {onOpenLetterhead && <LetterheadQuickSettings onOpen={onOpenLetterhead} />}
              {onOpenSignatures && <SignaturesQuickSettings onOpen={onOpenSignatures} />}
              <PaperSizeSelector value={d.paperSize} onChange={(s) => set('paperSize')(s)} />
            </div>
            <DocTextEditor
              label="عنوان الوثيقة"
              value={titleDoc}
              onChange={setTitleDoc}
              fallbackHint={composeScheduleTitle(d)}
            />
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1.5">
                <Label>الرقم</Label>
                <Input value={d.refNumber} onChange={(e) => set('refNumber')(e.target.value)} dir="ltr" className="text-right" />
              </div>
              <div className="space-y-1.5">
                <Label>التاريخ (سعيدة في)</Label>
                <Input value={d.dateText} onChange={(e) => set('dateText')(e.target.value)} placeholder="يوم/شهر/سنة" />
              </div>
            </div>
            <EditorGroup title="بيانات الاستعمال">
              <Input value={d.clubName} onChange={(e) => set('clubName')(e.target.value)} placeholder="اسم النادي/اللجنة — مثال: فرع ألعاب القوى" />
              <Input value={d.personName} onChange={(e) => set('personName')(e.target.value)} placeholder="الأسم واللقب — مثال: عرفي محمد" />
              <Input value={d.rank} onChange={(e) => set('rank')(e.target.value)} placeholder="الرتبة" />
              <Input value={d.workPlace} onChange={(e) => set('workPlace')(e.target.value)} placeholder="مكان العمل" />
              <Input value={d.assignment} onChange={(e) => set('assignment')(e.target.value)} placeholder="التعيين" />
            </EditorGroup>
            <EditorGroup title="تسمية الفترات الزمنية">
              <div className="grid grid-cols-3 gap-2">
                {d.periods.map((p, i) => (
                  <Input key={i} value={p} onChange={(e) => setPeriod(i)(e.target.value)} className="h-8 text-center text-xs" dir="ltr" aria-label={`الفترة ${i + 1}`} />
                ))}
              </div>
            </EditorGroup>
            <EditorGroup title="خلايا الجدول (7 أيام × 3 فترات)">
              <div className="space-y-1.5 max-h-64 overflow-y-auto nice-scroll rounded-xl border border-(--border) bg-muted/30 p-2">
                {DAYS.map((day, di) => (
                  <div key={day} className="grid grid-cols-[64px_1fr_1fr_1fr] items-center gap-1.5">
                    <span className="text-[10.5px] font-black text-muted-foreground">{day}</span>
                    {[0, 1, 2].map((pi) => (
                      <Input
                        key={pi}
                        value={d.cells[di * 3 + pi] ?? ''}
                        onChange={(e) => setCell(di * 3 + pi)(e.target.value)}
                        className="h-7 text-[11px]"
                        placeholder="—"
                        aria-label={`${day} فترة ${pi + 1}`}
                      />
                    ))}
                  </div>
                ))}
              </div>
            </EditorGroup>
            <EditorGroup title="التذييل">
              <div className="grid grid-cols-2 gap-2">
                <Input value={d.rightRole} onChange={(e) => set('rightRole')(e.target.value)} placeholder="رئيس الرابطة" />
                <Input value={d.rightSign} onChange={(e) => set('rightSign')(e.target.value)} placeholder="اسم الرئيس (اختياري)" />
              </div>
              <Input value={d.leftSign} onChange={(e) => set('leftSign')(e.target.value)} placeholder="المنع بالأمر — اسم (اختياري)" />
            </EditorGroup>
            <PrintArchiveButtons onPrint={() => window.print()} onArchive={saveArchive} saving={saving} />
          </div>
          <PreviewPane>
            <TimeSchedulePaper data={data} printable={false} />
          </PreviewPane>
        </div>
      </DialogContent>
      {open && (
        <PrintPortal>
          <PrintPageSize size={data.paperSize} />
          <TimeSchedulePaper data={data} />
        </PrintPortal>
      )}
    </Dialog>
  )
}

// ==================================================================
// 2) عقد عمل محدد المدة (CDD) — النموذج الموحد (11 مادة) لكل الفروع
// ==================================================================

export interface WorkContractData {
  refNumber: string
  // الطرف الأول: المستخدم (صاحب العمل)
  party1Org: string
  party1Branch: string
  party1Seat: string
  party1Rep: string
  party1Role: string
  // الطرف الثاني: العامل
  party2Name: string
  party2Birth: string
  party2Address: string
  party2Id: string
  party2Phone: string
  // المادة 01 — الصفة والفرع
  sportBranch: string
  jobTitle: string
  // المادة 02 — المدة وسبب اللجوء
  contractCause: string
  startAt: string
  endAt: string
  // المادة 03 — مكان العمل
  facility: string
  // المادة 05 — الأجر
  salaryAmount: string
  salaryMethod: string
  allowances: string
  paymentPeriodicity: string
  // المادة 06 — المهام الخاصة بالمنصب
  clause6: string
  /** عرض المهام كنقاط تعداد (Puces) */
  dutiesBullets: string
  // المادة 11 + الإمضاءات
  placeDate: string
  signName1: string
  signRole1: string
  signName2: string
  /** عنوان الوثيقة المنسق — فارغ = العنوان الافتراضي */
  titleStyle: string
  paperSize: PaperSize
}

export const EMPTY_WORK_CONTRACT: WorkContractData = {
  refNumber: '',
  party1Org: 'الجمعية الرياضية الهاوية النادي الرياضي متعدد الرياضات الرائد لبلدية سعيدة',
  party1Branch: '',
  party1Seat: 'طاب لحسن، بلدية سعيدة',
  party1Rep: '',
  party1Role: '',
  party2Name: '',
  party2Birth: '',
  party2Address: 'سعيدة',
  party2Id: '',
  party2Phone: '',
  sportBranch: '',
  jobTitle: '',
  contractCause: '',
  startAt: '',
  endAt: '',
  facility: '',
  salaryAmount: '',
  salaryMethod: 'شهري',
  allowances: '',
  paymentPeriodicity: 'شهرياً',
  clause6: '',
  dutiesBullets: '',
  placeDate: '',
  signName1: '',
  signRole1: '',
  signName2: '',
  titleStyle: '',
  paperSize: 'A4',
}

/** عنوان العقد الافتراضي */
export const CONTRACT_TITLE_FALLBACK = 'عقد عمل محدد المدة (CDD)'

export function workContractFromParams(p: Record<string, string> | undefined): WorkContractData {
  return {
    refNumber: p?.refNumber ?? '',
    party1Org: p?.party1Org ?? EMPTY_WORK_CONTRACT.party1Org,
    party1Branch: p?.party1Branch ?? '',
    party1Seat: p?.party1Seat ?? EMPTY_WORK_CONTRACT.party1Seat,
    party1Rep: p?.party1Rep ?? '',
    party1Role: p?.party1Role ?? '',
    party2Name: p?.party2Name ?? '',
    party2Birth: p?.party2Birth ?? '',
    party2Address: p?.party2Address ?? EMPTY_WORK_CONTRACT.party2Address,
    party2Id: p?.party2Id ?? '',
    party2Phone: p?.party2Phone ?? '',
    sportBranch: p?.sportBranch ?? '',
    jobTitle: p?.jobTitle ?? '',
    contractCause: p?.contractCause ?? '',
    startAt: p?.startAt ?? '',
    endAt: p?.endAt ?? '',
    facility: p?.facility ?? '',
    salaryAmount: p?.salaryAmount ?? '',
    salaryMethod: p?.salaryMethod ?? EMPTY_WORK_CONTRACT.salaryMethod,
    allowances: p?.allowances ?? '',
    paymentPeriodicity: p?.paymentPeriodicity ?? EMPTY_WORK_CONTRACT.paymentPeriodicity,
    // توافق مع الأرشيف القديم: مهام بطاقة المنصب تُعرض كمهام المادة 06
    clause6: p?.clause6 ?? p?.annexDuties ?? '',
    dutiesBullets: p?.dutiesBullets === 'true' ? 'true' : '',
    placeDate: p?.placeDate ?? p?.placeText ?? '',
    signName1: p?.signName1 ?? '',
    signRole1: p?.signRole1 ?? '',
    signName2: p?.signName2 ?? '',
    titleStyle: p?.titleStyle ?? '',
    paperSize: paperSizeFromParams(p),
  }
}

/** اقتراحات المناصب بحسب الفرع الرياضي — العقد واحد لكل الفروع مع تغيير بطاقة المنصب والمهام */
export const POSITION_SUGGESTIONS: Record<string, string[]> = {
  'السباحة': ['حارس سباحة', 'مدرب سباحة', 'مساعد مدرب'],
  'كرة القدم': ['مدرب', 'مساعد مدرب', 'مسؤول تجهيزات'],
  'كرة اليد': ['مدرب', 'مساعد مدرب'],
  'كرة السلة': ['مدرب', 'مساعد مدرب'],
  'الكرة الطائرة': ['مدرب', 'مساعد مدرب'],
  'ألعاب القوى': ['مدرب', 'مساعد فني'],
  'الفنون القتالية': ['مدرب', 'مساعد مدرب'],
  'الملاكمة': ['مدرب', 'مساعد مدرب'],
  'الجمباز': ['مدرب', 'مساعد مدرب'],
  'تنس الطاولة': ['مدرب'],
  'الشطرنج': ['مدرب', 'مدرّب محكم'],
  'الدراجات': ['مدرب', 'مساعد فني'],
}

/** اقتراحات لأسباب اللجوء إلى العقد محدد المدة (للإرشاد — تُعدّل بحسب واقع كل عقد) */
export const CAUSE_SUGGESTIONS: string[] = [
  'نشاط موسمي مرتبط بالموسم الرياضي الجاري.',
  'زيادة النشاط خلال التظاهرات والمنافسات الرياضية.',
  'اللحاق بمنصب عامل غائب عنه بصفة مؤقتة.',
  'عمل ذو طبيعة مؤقتة لا يتجاوز مدته مدة العقد.',
]

/** يُركّب وصف المهام إن لم تُحرَّر يدوياً — من الفرع والمنصب */
function composeClause6(d: WorkContractData): string {
  return `المهام المرتبطة بمنصب ${d.jobTitle.trim() || '................'} ضمن فرع ${d.sportBranch.trim() || '................'}، كما تحددها الإدارة وفق طبيعة النشاط الرياضي.`
}

/** عنوان مادة داخل العقد */
function ContractArticle({ num, title, children }: { num: string; title: string; children: React.ReactNode }) {
  return (
    <div className="break-inside-avoid">
      <h4 className="text-[13px] font-black" style={{ color: 'var(--doc-accent, #1d2f5e)' }}>
        المادة {num}: {title}
      </h4>
      <div className="mt-0.5 space-y-1 text-[12.5px] font-medium leading-[1.85] text-neutral-800">{children}</div>
    </div>
  )
}

function ContractUl({ items }: { items: string[] }) {
  return (
    <ul className="list-disc space-y-0.5 pr-5">
      {items.map((t, i) => (
        <li key={i}>{t}</li>
      ))}
    </ul>
  )
}

/** حقل منقط ضمن سطر نصي — قيمة معبأة أو خط للتعبئة اليدوية */
function DottedInline({ value }: { value: string }) {
  return value.trim() ? (
    <span className="border-b border-dotted border-neutral-500 px-2 font-black">{value}</span>
  ) : (
    <span className="inline-block w-32 border-b border-dotted border-neutral-400">&nbsp;</span>
  )
}

export function WorkContractPaper({ data, printable = true }: { data: WorkContractData; printable?: boolean }) {
  const d = data
  const duties = d.clause6.trim() || composeClause6(d)
  const cause = d.contractCause.trim()
  const title = docTextFromJson(d.titleStyle, makeDocText('', { fontSize: 19, bold: true, align: 'center' }))

  const sheet = (
    <PaperShell printable={false} wide flow paperSize={d.paperSize}>
      <ClubLetterhead compact />
      <div className="mt-2 text-center">
        <p className="text-[11.5px] font-black text-neutral-700">الجمهورية الجزائرية الديمقراطية الشعبية</p>
        <DocTextView t={title} fallback={CONTRACT_TITLE_FALLBACK} className="mt-1" />
        <p className="mt-1 text-[12px] font-bold text-neutral-600">
          رقم: <span className="font-mono">{d.refNumber || `................. / ن.ر.ر.س / ${new Date().getFullYear()}`}</span>
        </p>
      </div>

      <div className="mt-3 rounded-lg border border-neutral-400/60 bg-neutral-50/60 px-3 py-2 text-center text-[13px] font-black">
        بين الموقعين أدناه:
      </div>

      <div className="mt-3 space-y-2.5 text-[13px] leading-[2.05]">
        <p className="font-black underline decoration-2 underline-offset-4">الطرف الأول (المستخدم):</p>
        <p>
          {d.party1Org}، فرع: <DottedInline value={d.party1Branch} />، الكائن مقرها بـ:{' '}
          <DottedInline value={d.party1Seat} />، ويمثلها في هذا العقد السيد: <DottedInline value={d.party1Rep} />، بصفته:{' '}
          <DottedInline value={d.party1Role} />.
        </p>
        <p>ويشار إليه في هذا العقد بـ «الطرف الأول».</p>

        <p className="font-black underline decoration-2 underline-offset-4">الطرف الثاني (العامل):</p>
        <div className="space-y-1 pr-1">
          <FieldLine label="الاسم واللقب" value={d.party2Name} strong />
          <FieldLine label="تاريخ ومكان الميلاد" value={d.party2Birth} />
          <FieldLine label="العنوان" value={d.party2Address} />
          <FieldLine label="رقم بطاقة التعريف الوطنية" value={d.party2Id} />
          <FieldLine label="رقم الهاتف" value={d.party2Phone} />
        </div>
        <p>ويشار إليه في هذا العقد بـ «الطرف الثاني».</p>
      </div>

      <div className="mt-4 space-y-3.5">
        <ContractArticle num="01" title="موضوع العقد">
          <p>
            يوظف الطرف الأول الطرف الثاني بصفة: <DottedInline value={d.jobTitle} />، للعمل ضمن فرع:{' '}
            <DottedInline value={d.sportBranch} />، وذلك للقيام بالمهام المرتبطة بمنصبه، وفقًا للمؤهلات المطلوبة وطبيعة
            النشاط الرياضي، وتحت إشراف المسؤول المختص.
          </p>
        </ContractArticle>

        <ContractArticle num="02" title="مدة العقد">
          <p>
            أُبرم هذا العقد لمدة محددة، ابتداءً من:{' '}
            <span dir="ltr" className="font-black">{d.startAt || '....../....../..........'}</span> إلى غاية:{' '}
            <span dir="ltr" className="font-black">{d.endAt || '....../....../..........'}</span>
          </p>
          <p>
            سبب اللجوء إلى العقد محدد المدة:{' '}
            {cause ? (
              <span className="border-b border-dotted border-neutral-500 px-2 font-bold">{cause}</span>
            ) : (
              <span className="inline-block w-64 border-b border-dotted border-neutral-400">&nbsp;</span>
            )}
          </p>
          <p>ينتهي العقد عند حلول أجله، مع مراعاة الحالات والشروط القانونية المتعلقة بالتجديد أو الإنهاء.</p>
        </ContractArticle>

        <ContractArticle num="03" title="مكان العمل">
          <p>يمارس الطرف الثاني مهامه في المنشأة الرياضية أو المرفق التابع للنادي، والمحدد كما يأتي:</p>
          {d.facility.trim() ? (
            <p className="whitespace-pre-wrap border-b border-dotted border-neutral-500 px-2 font-bold leading-8">
              {d.facility}
            </p>
          ) : (
            <div className="space-y-5 py-1.5">
              <div className="border-b border-dotted border-neutral-400" />
              <div className="border-b border-dotted border-neutral-400" />
            </div>
          )}
          <p>ويجوز تكليفه بالعمل في منشأة أخرى تابعة للنادي وفقًا لطبيعة منصبه والتشريع المعمول به.</p>
        </ContractArticle>

        <ContractArticle num="04" title="أوقات العمل">
          <ContractUl
            items={[
              'يلتزم الطرف الثاني باحترام جدول العمل الذي تحدده الإدارة.',
              'يلتزم بمواعيد الحضور والانصراف المحددة.',
              'لا يجوز له مغادرة مكان العمل أثناء ساعات العمل دون ترخيص، مع مراعاة حالات الضرورة المهنية.',
              'يُحدد الحجم الساعي وجدول العمل وفقًا للتشريع والتنظيم المعمول بهما.',
            ]}
          />
        </ContractArticle>

        <ContractArticle num="05" title="الأجر">
          <p>يتقاضى الطرف الثاني أجرًا مقابل العمل المتفق عليه، وفق التفاصيل الآتية:</p>
          <ContractUl
            items={[
              `الأجر المتفق عليه: ${d.salaryAmount.trim() || '................'} دج.`,
              `طريقة احتساب الأجر: ${d.salaryMethod.trim() || '..................'}.`,
              `دورية الدفع: ${d.paymentPeriodicity.trim() || '..................'}.`,
              `التعويضات، إن وجدت: ${d.allowances.trim() || '..................'}.`,
            ]}
          />
          <p>ويخضع الأجر للاقتطاعات والاشتراكات القانونية الواجبة التطبيق.</p>
        </ContractArticle>

        <ContractArticle num="06" title="المهام المهنية">
          <p>
            يلتزم الطرف الثاني بأداء المهام المرتبطة بمنصبه، والمحددة من طرف الإدارة، وفقًا لطبيعة الفرع الرياضي
            والنشاط المكلف به.
          </p>
          <p>وتحدد المهام الخاصة بالمنصب كما يأتي:</p>
          {d.dutiesBullets === 'true' ? (
            <ContractUl items={duties.split('\n').filter((l) => l.trim())} />
          ) : (
            <p className="whitespace-pre-wrap border-b border-dotted border-neutral-500 px-2 font-bold leading-8">
              {duties}
            </p>
          )}
        </ContractArticle>

        <ContractArticle num="07" title="الالتزامات المهنية">
          <p>يلتزم الطرف الثاني بما يأتي:</p>
          <ContractUl
            items={[
              'أداء مهامه بجدية وأمانة ومسؤولية.',
              'احترام التعليمات المهنية والتنظيمية المشروعة.',
              'المحافظة على ممتلكات النادي وتجهيزاته.',
              'احترام المسؤولين والزملاء والمنخرطين وأوليائهم.',
              'المحافظة على السر المهني والبيانات التي يطلع عليها بحكم عمله.',
              'احترام قواعد الصحة والسلامة والوقاية المرتبطة بمنصبه.',
              'الإبلاغ عن الحوادث والأعطال والمخاطر المهنية.',
              'المحافظة على نظافة وترتيب مكان العمل.',
              'تقديم المؤهلات والشهادات اللازمة لممارسة مهامه، متى كانت مطلوبة قانونًا.',
            ]}
          />
        </ContractArticle>

        <ContractArticle num="08" title="الغياب والعطل">
          <p>
            يلتزم الطرف الثاني بإبلاغ المسؤول المباشر عن أي غياب أو تأخر في أقرب وقت ممكن، وتقديم المبررات والوثائق
            اللازمة وفقًا للإجراءات المعمول بها.
          </p>
          <p>وتحدد العطل والراحة الأسبوعية والحقوق المرتبطة بالغياب وفقًا للتشريع والتنظيم المعمول بهما.</p>
        </ContractArticle>

        <ContractArticle num="09" title="إنهاء العقد">
          <p>
            ينتهي العقد بانتهاء مدته، وتخضع حالات إنهائه قبل الأجل أو فسخه أو تجديده للشروط والإجراءات التي يحددها
            التشريع الجزائري المعمول به.
          </p>
          <p>وتُسوّى الحقوق المالية والاجتماعية المستحقة للطرف الثاني وفقًا للقانون.</p>
        </ContractArticle>

        <ContractArticle num="10" title="الضمان الاجتماعي">
          <p>
            يلتزم الطرف الأول باستيفاء إجراءات التصريح بالطرف الثاني لدى هيئات الضمان الاجتماعي المختصة، والوفاء
            بالالتزامات القانونية المرتبطة بعلاقة العمل، متى كانت واجبة التطبيق.
          </p>
        </ContractArticle>

        <ContractArticle num="11" title="أحكام عامة">
          <p>
            يخضع هذا العقد للتشريع والتنظيم المعمول بهما في الجمهورية الجزائرية الديمقراطية الشعبية، وللنظام الداخلي
            للجمعية في حدود مطابقته للقانون.
          </p>
          <p>وتعتبر الملاحق الموقعة من الطرفين، عند وجودها، جزءًا من هذا العقد.</p>
          <p>
            حرر بمدينة سعيدة في: <span dir="ltr" className="font-black">{d.placeDate || '....../....../..........'}</span>
          </p>
          <p>في نسختين أصليتين، تسلم نسخة لكل طرف للعمل بموجبها.</p>
        </ContractArticle>
      </div>

      {/* إمضاء الطرفين */}
      <div className="mt-5 grid grid-cols-2 gap-3 text-[11.5px] font-black">
        <div className="rounded-lg border border-neutral-400/60 p-3 text-center">
          <div className="font-black underline">الطرف الأول (المستخدم)</div>
          <div className="mt-1 text-[10.5px] font-bold text-neutral-500">
            الاسم واللقب: {d.signName1 || '..................'}
          </div>
          <div className="text-[10.5px] font-bold text-neutral-500">الصفة: {d.signRole1 || '..................'}</div>
          <div className="mt-9 text-[10px] font-bold text-neutral-500">الإمضاء والختم</div>
        </div>
        <div className="rounded-lg border border-neutral-400/60 p-3 text-center">
          <div className="font-black underline">الطرف الثاني (العامل)</div>
          <div className="mt-1 text-[10.5px] font-bold text-neutral-500">
            الاسم واللقب: {d.signName2 || d.party2Name || '..................'}
          </div>
          <div className="mt-9 text-[10px] font-bold text-neutral-500">الإمضاء</div>
        </div>
      </div>

      {/* التأشيرات — تحددها إدارة النادي من نافذة اختيار الإمضاءات وتُطبَّق على جميع الوثائق */}
      <SignatureStrip keys={['president', 'branch', 'municipality']} variant="box" titlePrefix="تأشيرة" className="mt-3" />
    </PaperShell>
  )

  if (printable) return <div className="doc-print-area">{sheet}</div>
  return sheet
}

export function WorkContractDialog({
  open,
  onClose,
  onSaved,
  onOpenLetterhead,
  onOpenSignatures,
  branches = [],
}: {
  open: boolean
  onClose: () => void
  onSaved?: () => void
  onOpenLetterhead?: () => void
  onOpenSignatures?: () => void
  branches?: BranchWithAccount[]
}) {
  const [d, setD] = useState<WorkContractData>({ ...EMPTY_WORK_CONTRACT })
  const [titleDoc, setTitleDoc] = useState<DocText>(makeDocText('', { fontSize: 19, bold: true }))
  const [seed, setSeed] = useState('')
  const { saving, archive } = useArchivePaper(onSaved, onClose)

  if (open && !seed) {
    setSeed('open')
    setD({
      ...EMPTY_WORK_CONTRACT,
      refNumber: `................. / ن.ر.ر.س / ${new Date().getFullYear()}`,
      placeDate: formatDateDMY(new Date()),
    })
    setTitleDoc(makeDocText('', { fontSize: 19, bold: true }))
  }
  if (!open && seed) setSeed('')

  const set = (k: keyof WorkContractData) => (v: string) => setD((prev) => ({ ...prev, [k]: v }))

  /** اختيار الفرع: يملأ فرع الطرف الأول وفرع المادة 01 تلقائياً ما كان فارغاً */
  const setSportBranch = (v: string) =>
    setD((prev) => ({
      ...prev,
      sportBranch: v,
      party1Branch: prev.party1Branch.trim() || v,
    }))

  const saveArchive = () =>
    archive({
      refNumber: d.refNumber,
      title: `عقد عمل — ${d.party2Name || 'غير معبأ'} (${d.jobTitle || '—'})`,
      type: 'file',
      category: 'عقود العمل',
      content: `عقد عمل محدد المدة (CDD) بين النادي (فرع ${d.party1Branch || d.sportBranch || '—'}) والسيد ${d.party2Name || '—'} بصفة ${d.jobTitle || '—'}، من ${d.startAt || '—'} إلى ${d.endAt || '—'}.`,
      systemForm: 'work-contract',
      params: { ...d, titleStyle: docTextToJson(titleDoc) },
    })

  const data: WorkContractData = { ...d, titleStyle: docTextToJson(titleDoc) }

  const positions = POSITION_SUGGESTIONS[d.sportBranch.trim()]
  const branchSelectClass = 'flex h-9 w-full rounded-md border border-input bg-transparent px-3 py-1 text-sm shadow-xs'

  return (
    <Dialog open={open} onOpenChange={(v) => !v && onClose()}>
      <DialogContent className="sm:max-w-5xl max-h-[92vh] overflow-y-auto nice-scroll">
        <DialogHeader className="doc-print-hide">
          <DialogTitle className="flex items-center gap-2">
            <FileText className="h-5 w-5 text-(--club)" />
            عقد عمل محدد المدة (CDD)
          </DialogTitle>
          <DialogDescription>
            النموذج الموحد الرسمي (11 مادة) — عقد واحد لكل الفروع الرياضية: غيّر الفرع والمنصب والمهام والأجر فقط، وحدّد
            الإمضاءات من نافدة الإدارة، ثم اطبع أو أرشف.
          </DialogDescription>
        </DialogHeader>
        <div className="grid grid-cols-1 lg:grid-cols-[400px_1fr] gap-5">
          <div className="space-y-3 doc-print-hide lg:order-1">
            <div className="flex flex-wrap items-center gap-2">
              {onOpenLetterhead && <LetterheadQuickSettings onOpen={onOpenLetterhead} />}
              {onOpenSignatures && <SignaturesQuickSettings onOpen={onOpenSignatures} />}
              <PaperSizeSelector value={d.paperSize} onChange={(s) => set('paperSize')(s)} />
            </div>
            <DocTextEditor
              label="عنوان الوثيقة"
              value={titleDoc}
              onChange={setTitleDoc}
              fallbackHint={CONTRACT_TITLE_FALLBACK}
            />
            <div className="space-y-1.5">
              <Label>رقم العقد</Label>
              <Input value={d.refNumber} onChange={(e) => set('refNumber')(e.target.value)} dir="ltr" className="text-right" />
            </div>

            <EditorGroup title="الطرف الأول — المستخدم (صاحب العمل)">
              <Input value={d.party1Org} onChange={(e) => set('party1Org')(e.target.value)} placeholder="اسم الجهة المستخدمة" />
              <Input value={d.party1Branch} onChange={(e) => set('party1Branch')(e.target.value)} placeholder="الفرع — يُملأ تلقائياً من المادة 01" />
              <Input value={d.party1Seat} onChange={(e) => set('party1Seat')(e.target.value)} placeholder="المقر" />
              <div className="grid grid-cols-2 gap-2">
                <Input value={d.party1Rep} onChange={(e) => set('party1Rep')(e.target.value)} placeholder="اسم الممثل" />
                <Input value={d.party1Role} onChange={(e) => set('party1Role')(e.target.value)} placeholder="صفته" />
              </div>
            </EditorGroup>

            <EditorGroup title="الطرف الثاني — العامل">
              <Input value={d.party2Name} onChange={(e) => set('party2Name')(e.target.value)} placeholder="الاسم واللقب" />
              <Input value={d.party2Birth} onChange={(e) => set('party2Birth')(e.target.value)} placeholder="تاريخ ومكان الميلاد — 24/06/1995" />
              <Input value={d.party2Address} onChange={(e) => set('party2Address')(e.target.value)} placeholder="العنوان" />
              <div className="grid grid-cols-2 gap-2">
                <Input value={d.party2Id} onChange={(e) => set('party2Id')(e.target.value)} placeholder="رقم بط.ت.و" dir="ltr" className="text-right" />
                <Input value={d.party2Phone} onChange={(e) => set('party2Phone')(e.target.value)} placeholder="رقم الهاتف" dir="ltr" className="text-right" />
              </div>
            </EditorGroup>

            <EditorGroup title="المادة 01 — الصفة والفرع">
              {branches.length > 0 && (
                <select
                  value={d.sportBranch}
                  onChange={(e) => setSportBranch(e.target.value)}
                  className={branchSelectClass}
                  aria-label="الفرع الرياضي"
                >
                  <option value="">الفرع الرياضي…</option>
                  {branches.map((b) => (
                    <option key={b.id} value={b.name}>{b.name}</option>
                  ))}
                </select>
              )}
              <Input value={d.jobTitle} onChange={(e) => set('jobTitle')(e.target.value)} placeholder="الصفة — مثال: مدرب سباحة" />
              {positions && (
                <div className="flex flex-wrap gap-1.5">
                  {positions.map((p) => (
                    <button
                      key={p}
                      type="button"
                      onClick={() => set('jobTitle')(p)}
                      className="rounded-full border border-(--border) bg-muted/50 px-2.5 py-0.5 text-[10.5px] font-bold text-muted-foreground transition-colors hover:border-(--club)/50 hover:text-(--club)"
                    >
                      {p}
                    </button>
                  ))}
                </div>
              )}
            </EditorGroup>

            <EditorGroup title="المادة 02 — مدة العقد وسبب اللجوء">
              <div className="grid grid-cols-2 gap-2">
                <Input value={d.startAt} onChange={(e) => set('startAt')(e.target.value)} placeholder="ابتداءً من — يوم/شهر/سنة" />
                <Input value={d.endAt} onChange={(e) => set('endAt')(e.target.value)} placeholder="إلى غاية — يوم/شهر/سنة" />
              </div>
              <Textarea value={d.contractCause} onChange={(e) => set('contractCause')(e.target.value)} rows={2} placeholder="سبب اللجوء إلى العقد محدد المدة — حقيقي ومحدد وفق قانون العمل الجزائري 90-11" />
              <div className="flex flex-wrap gap-1.5">
                {CAUSE_SUGGESTIONS.map((c) => (
                  <button
                    key={c}
                    type="button"
                    onClick={() => set('contractCause')(c)}
                    title="انقر للإدراج — عدّله بحسب واقع العقد"
                    className="rounded-full border border-(--border) bg-muted/50 px-2.5 py-0.5 text-[10px] font-bold text-muted-foreground transition-colors hover:border-(--club)/50 hover:text-(--club)"
                  >
                    {c}
                  </button>
                ))}
              </div>
            </EditorGroup>

            <EditorGroup title="المادة 03 — مكان العمل">
              <Input value={d.facility} onChange={(e) => set('facility')(e.target.value)} placeholder="المنشأة الرياضية أو المرفق — مثال: ملعب الإخوة براسي" />
            </EditorGroup>

            <EditorGroup title="المادة 05 — الأجر">
              <div className="grid grid-cols-2 gap-2">
                <Input value={d.salaryAmount} onChange={(e) => set('salaryAmount')(e.target.value)} placeholder="الأجر المتفق عليه (دج)" dir="ltr" className="text-right" />
                <select
                  value={d.salaryMethod}
                  onChange={(e) => set('salaryMethod')(e.target.value)}
                  className={branchSelectClass}
                  aria-label="طريقة احتساب الأجر"
                >
                  <option value="شهري">شهري</option>
                  <option value="بالساعة">بالساعة</option>
                  <option value="حسب الحصة">حسب الحصة</option>
                </select>
              </div>
              <div className="grid grid-cols-2 gap-2">
                <Input value={d.paymentPeriodicity} onChange={(e) => set('paymentPeriodicity')(e.target.value)} placeholder="دورية الدفع — شهرياً" />
                <Input value={d.allowances} onChange={(e) => set('allowances')(e.target.value)} placeholder="التعويضات، إن وجدت" />
              </div>
            </EditorGroup>

            <EditorGroup title="المادة 06 — المهام الخاصة بالمنصب">
              <Textarea
                value={d.clause6}
                onChange={(e) => set('clause6')(e.target.value)}
                rows={4}
                placeholder="المهام الخاصة بالمنصب… (Enter لسطر جديد — فارغ = يُركّب وصف عام من الفرع والصفة)"
              />
              <div className="flex items-center justify-between rounded-xl border border-(--border) bg-muted/40 px-3 py-2">
                <div>
                  <div className="text-[11px] font-black text-(--club-dark)">عرض المهام كنقاط تعداد</div>
                  <p className="text-[9.5px] text-muted-foreground">Puces — كل سطر يُطبع بنقطة</p>
                </div>
                <Switch
                  checked={d.dutiesBullets === 'true'}
                  onCheckedChange={(v) => set('dutiesBullets')(v ? 'true' : '')}
                  aria-label="عرض المهام كنقاط"
                />
              </div>
            </EditorGroup>

            <EditorGroup title="المادة 11 — التحرير والإمضاءات">
              <Input value={d.placeDate} onChange={(e) => set('placeDate')(e.target.value)} placeholder="حرر بمدينة سعيدة في — يوم/شهر/سنة" />
              <div className="grid grid-cols-2 gap-2">
                <Input value={d.signName1} onChange={(e) => set('signName1')(e.target.value)} placeholder="اسم الطرف الأول" />
                <Input value={d.signRole1} onChange={(e) => set('signRole1')(e.target.value)} placeholder="صفته" />
              </div>
              <Input value={d.signName2} onChange={(e) => set('signName2')(e.target.value)} placeholder="اسم الطرف الثاني (فارغ = اسم العامل)" />
              <div className="rounded-xl border border-(--border) bg-muted/40 p-2.5 text-[10.5px] font-bold text-muted-foreground leading-relaxed">
                التأشيرات (رئيس النادي، رئيس الفرع، مصالح البلدية) تُحدَّد من نافذة «اختيار الإمضاءات» وتُطبَّق على جميع
                الوثائق والنماذج.
              </div>
            </EditorGroup>

            <PrintArchiveButtons onPrint={() => window.print()} onArchive={saveArchive} saving={saving} />
          </div>
          <PreviewPane>
            <WorkContractPaper data={data} printable={false} />
          </PreviewPane>
        </div>
      </DialogContent>
      {open && (
        <PrintPortal>
          <PrintPageSize size={data.paperSize} />
          <WorkContractPaper data={data} />
        </PrintPortal>
      )}
    </Dialog>
  )
}

// ==================================================================
// 3) محضر استئناف العمل
// ==================================================================

export interface WorkResumptionData {
  refNumber: string
  authorityLines: string
  openingLine: string
  authorityName: string
  personName: string
  personRank: string
  specialty: string
  leaveType: string
  leaveDays: string
  leaveYear: string
  leaveFrom: string
  leaveTo: string
  backAt: string
  placeDate: string
  /** السطر الافتتاحي المنسق — فارغ = النص الافتراضي */
  openingStyle: string
  paperSize: PaperSize
}

export const EMPTY_WORK_RESUMPTION: WorkResumptionData = {
  refNumber: '',
  authorityLines: 'الجمهورية الجزائرية الديمقراطية الشعبية\nوزارة الشباب والرياضة\nولاية سعيدة\nديوان المركب المتعدد الرياضات',
  openingLine: 'في اليوم الأول من شهر سبتمبر من عام ألفين وستة وعشرين.',
  authorityName: '',
  personName: '',
  personRank: 'مربي رئيسي الأنشطة البدنية والرياضية',
  specialty: '',
  leaveType: 'السنوية',
  leaveDays: '50',
  leaveYear: String(new Date().getFullYear()),
  leaveFrom: '',
  leaveTo: '',
  backAt: '',
  placeDate: '',
  openingStyle: '',
  paperSize: 'A4',
}

/** السطر الافتتاحي الافتراضي */
export const RESUMPTION_OPENING_FALLBACK = 'في اليوم الأول من شهر سبتمبر من عام ألفين وستة وعشرين.'

export function workResumptionFromParams(p: Record<string, string> | undefined): WorkResumptionData {
  return {
    refNumber: p?.refNumber ?? '',
    authorityLines: p?.authorityLines ?? EMPTY_WORK_RESUMPTION.authorityLines,
    openingLine: p?.openingLine ?? EMPTY_WORK_RESUMPTION.openingLine,
    authorityName: p?.authorityName ?? '',
    personName: p?.personName ?? '',
    personRank: p?.personRank ?? EMPTY_WORK_RESUMPTION.personRank,
    specialty: p?.specialty ?? '',
    leaveType: p?.leaveType ?? EMPTY_WORK_RESUMPTION.leaveType,
    leaveDays: p?.leaveDays ?? '',
    leaveYear: p?.leaveYear ?? EMPTY_WORK_RESUMPTION.leaveYear,
    leaveFrom: p?.leaveFrom ?? '',
    leaveTo: p?.leaveTo ?? '',
    backAt: p?.backAt ?? '',
    placeDate: p?.placeDate ?? '',
    openingStyle: p?.openingStyle ?? '',
    paperSize: paperSizeFromParams(p),
  }
}

export function WorkResumptionPaper({ data, printable = true }: { data: WorkResumptionData; printable?: boolean }) {
  const d = data
  const opening = docTextFromJson(d.openingStyle, makeDocText('', { fontSize: 13, bold: true, align: 'center' }))
  return (
    <PaperShell printable={printable} paperSize={d.paperSize}>
      <ClubLetterhead compact />
      <div className="mt-2 whitespace-pre-line text-right text-[11px] font-bold leading-[1.7] text-neutral-700">
        {d.authorityLines}
      </div>
      <RefDateLine refNumber={d.refNumber} dateText="" />

      <DocTextView t={opening} fallback={d.openingLine.trim() || RESUMPTION_OPENING_FALLBACK} className="mt-4" />

      <div className="mt-4 space-y-1 text-[13.5px] leading-[2]">
        <p>نشهد نحن مسؤول الهيئة: <span className="font-black">{d.authorityName || '..................'}</span>.</p>
        <p>بأن السيد: <span className="font-black">{d.personName || '..................'}</span></p>
        <FieldLine label="الرتبة" value={d.personRank} />
        <FieldLine label="التخصص" value={d.specialty} />
        <p>قد استوفى عطلته: <span className="font-black">{d.leaveType || '..................'}</span></p>
        <p>
          المقدرة ب: <span className="font-black">{d.leaveDays || '....'}</span> يوماً بعنوان سنة{' '}
          <span className="font-black">{d.leaveYear || '....'}</span> ابتداء من يوم:{' '}
          <span dir="ltr" className="font-bold">{d.leaveFrom || '..........'}</span>
        </p>
        <p>
          إلى غاية: <span dir="ltr" className="font-bold">{d.leaveTo || '..........'}</span> وقد تم إعادته إلى منصبه ابتداء من:{' '}
          <span dir="ltr" className="font-bold">{d.backAt || '..........'}</span>
        </p>
      </div>

      <p className="mt-6 text-[13px] font-black">
        حرر في سعيدة : <span dir="ltr">{d.placeDate || '..........'}</span>
      </p>

      <footer className="mt-12 flex items-end justify-between px-2 text-[11px] font-black">
        <div className="text-center">
          <div>إمضاء وختم الهيئة</div>
          <div className="mt-12 w-28 border-t border-dashed border-neutral-400" />
        </div>
        <SignatureStrip keys={['concerned']} variant="compact" />
      </footer>
    </PaperShell>
  )
}

export function WorkResumptionDialog({
  open,
  onClose,
  onSaved,
  onOpenLetterhead,
  onOpenSignatures,
}: {
  open: boolean
  onClose: () => void
  onSaved?: () => void
  onOpenLetterhead?: () => void
  onOpenSignatures?: () => void
}) {
  const [d, setD] = useState<WorkResumptionData>({ ...EMPTY_WORK_RESUMPTION })
  const [openingDoc, setOpeningDoc] = useState<DocText>(makeDocText('', { fontSize: 13, bold: true }))
  const [seed, setSeed] = useState('')
  const { saving, archive } = useArchivePaper(onSaved, onClose)

  if (open && !seed) {
    setSeed('open')
    setD({ ...EMPTY_WORK_RESUMPTION, refNumber: `.... / ر.أ.ق.س /${new Date().getFullYear()}`, placeDate: formatDateDMY(new Date()) })
    setOpeningDoc(makeDocText('', { fontSize: 13, bold: true }))
  }
  if (!open && seed) setSeed('')

  const set = (k: keyof WorkResumptionData) => (v: string) => setD((prev) => ({ ...prev, [k]: v }))

  const data: WorkResumptionData = {
    ...d,
    openingLine: openingDoc.text,
    openingStyle: docTextToJson(openingDoc),
  }

  const saveArchive = () =>
    archive({
      refNumber: d.refNumber,
      title: `محضر استئناف العمل — ${d.personName || 'غير معبأ'}`,
      type: 'file',
      category: 'وثائق الإدارة',
      content: `محضر استئناف العمل: ${d.personName || '—'} (${d.personRank}) — استوفى عطلته ${d.leaveType} المقدرة بـ ${d.leaveDays} يوماً من ${d.leaveFrom} إلى ${d.leaveTo}، وأعيد إلى منصبه ابتداء من ${d.backAt}.`,
      systemForm: 'work-resumption',
      params: { ...data },
    })

  return (
    <Dialog open={open} onOpenChange={(v) => !v && onClose()}>
      <DialogContent className="sm:max-w-5xl max-h-[92vh] overflow-y-auto nice-scroll">
        <DialogHeader className="doc-print-hide">
          <DialogTitle className="flex items-center gap-2">
            <FileCheck2 className="h-5 w-5 text-(--club)" />
            محضر استئناف العمل
          </DialogTitle>
          <DialogDescription>
            يوثّق استيفاء العطلة وإعادة المعني إلى منصبه — عدّل بيانات الهيئة والمعني ثم اطبع.
          </DialogDescription>
        </DialogHeader>
        <div className="grid grid-cols-1 lg:grid-cols-[400px_1fr] gap-5">
          <div className="space-y-3 doc-print-hide lg:order-1">
            <div className="flex flex-wrap items-center gap-2">
              {onOpenLetterhead && <LetterheadQuickSettings onOpen={onOpenLetterhead} />}
              {onOpenSignatures && <SignaturesQuickSettings onOpen={onOpenSignatures} />}
              <PaperSizeSelector value={d.paperSize} onChange={(s) => set('paperSize')(s)} />
            </div>
            <EditorGroup title="الجهة المصدرة (تظهر تحت الترويسة) — Enter لسطر جديد">
              <Textarea value={d.authorityLines} onChange={(e) => set('authorityLines')(e.target.value)} rows={4} placeholder="سطر لكل جهة…" />
            </EditorGroup>
            <div className="grid grid-cols-2 gap-2">
              <div className="space-y-1.5">
                <Label>الرقم</Label>
                <Input value={d.refNumber} onChange={(e) => set('refNumber')(e.target.value)} dir="ltr" className="text-right" />
              </div>
              <div className="space-y-1.5">
                <Label>تاريخ التحرير</Label>
                <Input value={d.placeDate} onChange={(e) => set('placeDate')(e.target.value)} placeholder="يوم/شهر/سنة" />
              </div>
            </div>
            <EditorGroup title="المعني">
              <Input value={d.authorityName} onChange={(e) => set('authorityName')(e.target.value)} placeholder="مسؤول الهيئة — مثال: الرابطة الولائية لألعاب القوى لولاية سعيدة" />
              <Input value={d.personName} onChange={(e) => set('personName')(e.target.value)} placeholder="اسم المعني" />
              <Input value={d.personRank} onChange={(e) => set('personRank')(e.target.value)} placeholder="الرتبة" />
              <Input value={d.specialty} onChange={(e) => set('specialty')(e.target.value)} placeholder="التخصص" />
            </EditorGroup>
            <EditorGroup title="العطلة">
              <div className="grid grid-cols-2 gap-2">
                <Input value={d.leaveType} onChange={(e) => set('leaveType')(e.target.value)} placeholder="نوعها — السنوية" />
                <Input value={d.leaveDays} onChange={(e) => set('leaveDays')(e.target.value)} placeholder="عدد الأيام" />
              </div>
              <Input value={d.leaveYear} onChange={(e) => set('leaveYear')(e.target.value)} placeholder="بعنوان سنة" />
              <div className="grid grid-cols-3 gap-2">
                <Input value={d.leaveFrom} onChange={(e) => set('leaveFrom')(e.target.value)} placeholder="ابتداء من" />
                <Input value={d.leaveTo} onChange={(e) => set('leaveTo')(e.target.value)} placeholder="إلى غاية" />
                <Input value={d.backAt} onChange={(e) => set('backAt')(e.target.value)} placeholder="الاستئناف" />
              </div>
            </EditorGroup>
            <DocTextEditor
              label="الافتتاحية (تاريخ بالحروف) — سطر جديد داخل نفس الحقل بمفتاح Enter"
              value={openingDoc}
              onChange={setOpeningDoc}
              fallbackHint={RESUMPTION_OPENING_FALLBACK}
            />
            <PrintArchiveButtons onPrint={() => window.print()} onArchive={saveArchive} saving={saving} />
          </div>
          <PreviewPane>
            <WorkResumptionPaper data={data} printable={false} />
          </PreviewPane>
        </div>
      </DialogContent>
      {open && (
        <PrintPortal>
          <PrintPageSize size={data.paperSize} />
          <WorkResumptionPaper data={data} />
        </PrintPortal>
      )}
    </Dialog>
  )
}

// ==================================================================
// 4) طلب وسيلة نقل
// ==================================================================

export interface TransportRequestData {
  refNumber: string
  dateText: string
  recipient: string
  subject: string
  /** تنسيق الموضوع (عنوان الوثيقة) — JSON DocText */
  subjectStyle: string
  destination: string
  event: string
  schedule: string
  /** النص العادي — للتوافق والأرشفة القديمة */
  body: string
  /** فقرات المتن المنسقة — JSON DocBlock[] */
  bodyBlocks: string
  paperSize: PaperSize
}

export const EMPTY_TRANSPORT: TransportRequestData = {
  refNumber: '',
  dateText: '',
  recipient: 'رئيس المجلس الشعبي البلدي لبلدية سعيدة',
  subject: '',
  subjectStyle: '',
  destination: '',
  event: '',
  schedule: '',
  body: '',
  bodyBlocks: '',
  paperSize: 'A4',
}

export function transportFromParams(p: Record<string, string> | undefined): TransportRequestData {
  return {
    refNumber: p?.refNumber ?? '',
    dateText: p?.dateText ?? '',
    recipient: p?.recipient ?? EMPTY_TRANSPORT.recipient,
    subject: p?.subject ?? '',
    subjectStyle: p?.subjectStyle ?? '',
    destination: p?.destination ?? '',
    event: p?.event ?? '',
    schedule: p?.schedule ?? '',
    body: p?.body ?? '',
    bodyBlocks: p?.bodyBlocks ?? '',
    paperSize: paperSizeFromParams(p),
  }
}

function composeTransportBody(d: TransportRequestData): string {
  return `لي عظيم الشرف أن أتقدم إلى سيادتكم المحترمة بطلبي هذا، والمتمثل في طلب وسيلة نقل للتنقل إلى مدينة ${d.destination.trim() || '................'} وذلك من أجل ${d.event.trim() || '................'}، و ذلك ${d.schedule.trim() || '................'}.`
}

export function TransportRequestPaper({ data, printable = true }: { data: TransportRequestData; printable?: boolean }) {
  const subjectDoc = docTextFromJson(
    data.subjectStyle,
    makeDocText(data.subject, { fontSize: 15, bold: true, align: 'center' })
  )
  const blocks = blocksFromJson(data.bodyBlocks, data.body.trim() || composeTransportBody(data))
  return (
    <PaperShell printable={printable} paperSize={data.paperSize}>
      <ClubLetterhead />
      <RefDateLine refNumber={data.refNumber} dateText={data.dateText} />
      <p className="mt-4 text-[13.5px] font-black">إلى السيد: {data.recipient || '.....................'}</p>
      <p
        className="mt-4 underline decoration-2 underline-offset-8"
        style={{
          textAlign: subjectDoc.align,
          fontSize: `${subjectDoc.fontSize}px`,
          fontWeight: subjectDoc.bold ? 900 : 600,
        }}
      >
        الموضوع: {subjectDoc.text.trim() || '.....................'}
      </p>
      <DocBlocksView blocks={blocks} className="mt-5 min-h-[170px] text-neutral-800" />
      <p className="mt-2 text-[13.5px] font-bold leading-[2]">
        في الأخير تقبلوا مني سيدي فائق الاحترام والتقدير.
      </p>
      <footer className="mt-10 flex items-end justify-between px-2">
        <OfficialStamp lines={['الجمهورية الجزائرية', 'جمعية الرائد الرياضي']} />
        {/* الإمضاءات المفعّلة من إدارة النادي (رئيس النادي / رئيس الفرع) */}
        <SignatureStrip keys={['president', 'branch']} variant="compact" />
      </footer>
    </PaperShell>
  )
}

export function TransportRequestDialog({
  open,
  onClose,
  onSaved,
  onOpenLetterhead,
  onOpenSignatures,
}: {
  open: boolean
  onClose: () => void
  onSaved?: () => void
  onOpenLetterhead?: () => void
  onOpenSignatures?: () => void
}) {
  const [d, setD] = useState<TransportRequestData>({ ...EMPTY_TRANSPORT })
  const [subjectDoc, setSubjectDoc] = useState<DocText>(makeDocText('', { fontSize: 15, bold: true }))
  const [blocks, setBlocks] = useState<DocBlock[]>([makeBlock('')])
  const [seed, setSeed] = useState('')
  const { saving, archive } = useArchivePaper(onSaved, onClose)

  if (open && !seed) {
    setSeed('open')
    const init: TransportRequestData = {
      ...EMPTY_TRANSPORT,
      refNumber: `.../ن.ر.ه.ر.س ${new Date().getFullYear()}`,
      dateText: formatDateDMY(new Date()),
      subject: 'طلب وسيلة نقل للتنقل إلى مدينة .........',
    }
    setD(init)
    setSubjectDoc(makeDocText(init.subject, { fontSize: 15, bold: true }))
    setBlocks([makeBlock(composeTransportBody(init))])
  }
  if (!open && seed) setSeed('')

  const set = (k: keyof TransportRequestData) => (v: string) => setD((prev) => ({ ...prev, [k]: v }))
  const data: TransportRequestData = {
    ...d,
    subject: subjectDoc.text,
    subjectStyle: docTextToJson(subjectDoc),
    body: blocksToPlain(blocks),
    bodyBlocks: blocksToJson(blocks),
  }

  const saveArchive = () =>
    archive({
      refNumber: d.refNumber,
      title: `طلب وسيلة نقل — ${d.destination || 'غير معبأ'}`,
      type: 'request',
      category: 'مراسلات رسمية',
      content: data.body || composeTransportBody(d),
      systemForm: 'transport-request',
      params: { ...data, body: data.body || composeTransportBody(d) },
    })

  return (
    <Dialog open={open} onOpenChange={(v) => !v && onClose()}>
      <DialogContent className="sm:max-w-5xl max-h-[92vh] overflow-y-auto nice-scroll">
        <DialogHeader className="doc-print-hide">
          <DialogTitle className="flex items-center gap-2">
            <Truck className="h-5 w-5 text-(--club)" />
            طلب وسيلة نقل — مراسلة رسمية
          </DialogTitle>
          <DialogDescription>
            مراسلة بترويسة النادي لطلب وسيلة نقل لفريق النادي — عدّل التفاصيل وسيُركّب النص الرسمي تلقائياً.
          </DialogDescription>
        </DialogHeader>
        <div className="grid grid-cols-1 lg:grid-cols-[400px_1fr] gap-5">
          <div className="space-y-3 doc-print-hide lg:order-1">
            <div className="flex flex-wrap items-center gap-2">
              {onOpenLetterhead && <LetterheadQuickSettings onOpen={onOpenLetterhead} />}
              {onOpenSignatures && <SignaturesQuickSettings onOpen={onOpenSignatures} />}
              <PaperSizeSelector value={d.paperSize} onChange={(s) => set('paperSize')(s)} />
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1.5">
                <Label>الرقم</Label>
                <Input value={d.refNumber} onChange={(e) => set('refNumber')(e.target.value)} dir="ltr" className="text-right" />
              </div>
              <div className="space-y-1.5">
                <Label>التاريخ (سعيدة في)</Label>
                <Input value={d.dateText} onChange={(e) => set('dateText')(e.target.value)} />
              </div>
            </div>
            <div className="space-y-1.5">
              <Label>إلى السيد</Label>
              <Input value={d.recipient} onChange={(e) => set('recipient')(e.target.value)} />
            </div>
            <DocTextEditor
              label="الموضوع — عنوان الوثيقة"
              value={subjectDoc}
              onChange={setSubjectDoc}
              hint="Aligner / حجم الكتابة / عريض"
            />
            <EditorGroup title="تفاصيل الطلب (تُركّب في النص)">
              <Input value={d.destination} onChange={(e) => set('destination')(e.target.value)} placeholder="الوجهة — مثال: سيدي بلعباس" />
              <Input value={d.event} onChange={(e) => set('event')(e.target.value)} placeholder="المناسبة — مثال: المشاركة في الجائزة الكبرى لترياتلون" />
              <Textarea value={d.schedule} onChange={(e) => set('schedule')(e.target.value)} rows={3} placeholder="الموعد — مثال: يومي الخميس والجمعة 04-09-2025، الانطلاق الساعة 06:30 والعودة يوم الجمعة عند انتهاء المنافسة" />
            </EditorGroup>
            <DocBlocksEditor
              label="نصوص الطلب — قابلة للترتيب والتنسيق"
              blocks={blocks}
              onChange={setBlocks}
              hint="Aligner / Justifier + حجم الكتابة + عريض + نقاط + ترتيب يدوي بالأسهم، وEnter لسطر جديد في نفس النص"
              addLabel="إضافة نص جديد"
            />
            <PrintArchiveButtons onPrint={() => window.print()} onArchive={saveArchive} saving={saving} />
          </div>
          <PreviewPane>
            <TransportRequestPaper data={data} printable={false} />
          </PreviewPane>
        </div>
      </DialogContent>
      {open && (
        <PrintPortal>
          <PrintPageSize size={data.paperSize} />
          <TransportRequestPaper data={data} />
        </PrintPortal>
      )}
    </Dialog>
  )
}

// ==================================================================
// 5) جدول إرسال (Bordereau d'envoi)
// ==================================================================

export interface BordereauRow {
  doc: string
  count: string
  note: string
}

export interface BordereauData {
  refNumber: string
  dateText: string
  recipient: string
  rows: BordereauRow[]
  /** عنوان الوثيقة المنسق — فارغ = «جدول إرسال» */
  titleStyle: string
  paperSize: PaperSize
}

export const EMPTY_BORDEREAU: BordereauData = {
  refNumber: '',
  dateText: '',
  recipient: '',
  rows: [{ doc: '', count: '', note: '' }],
  titleStyle: '',
  paperSize: 'A4',
}

/** عنوان جدول الإرسال الافتراضي */
export const BORDEREAU_TITLE_FALLBACK = 'جدول إرســــال'

export function bordereauFromParams(p: Record<string, string> | undefined): BordereauData {
  let rows: BordereauRow[] = [{ doc: '', count: '', note: '' }]
  try {
    if (p?.rows) rows = JSON.parse(p.rows) as BordereauRow[]
  } catch { /* افتراضي */ }
  return {
    refNumber: p?.refNumber ?? '',
    dateText: p?.dateText ?? '',
    recipient: p?.recipient ?? '',
    rows: Array.isArray(rows) && rows.length ? rows : [{ doc: '', count: '', note: '' }],
    titleStyle: p?.titleStyle ?? '',
    paperSize: paperSizeFromParams(p),
  }
}

function bordereauTotal(rows: BordereauRow[]): string {
  const total = rows.reduce((acc, r) => acc + (parseInt(r.count, 10) || 0), 0)
  return total > 0 ? String(total) : ''
}

export function BordereauPaper({ data, printable = true }: { data: BordereauData; printable?: boolean }) {
  const total = bordereauTotal(data.rows)
  const title = docTextFromJson(data.titleStyle, makeDocText('', { fontSize: 24, bold: true, align: 'center' }))
  return (
    <PaperShell printable={printable} paperSize={data.paperSize}>
      <ClubLetterhead compact />
      <RefDateLine refNumber={data.refNumber} dateText="" />
      <p className="mt-4 text-[13.5px] font-black">إلى السيد:</p>
      <p className="mt-1 text-[13.5px] font-black text-center">{data.recipient || '.....................'}</p>

      <DocTextView
        t={title}
        fallback={BORDEREAU_TITLE_FALLBACK}
        className="mt-5 tracking-wide"
      />
      <p className="mt-2 text-[11.5px] font-bold text-center">
        سعيدة في: <span dir="ltr">{data.dateText || '..........'}</span>
      </p>

      <table className="mt-5 w-full border-collapse text-[13px]">
        <thead>
          <tr>
            <th className="border-2 border-neutral-600 bg-neutral-100 p-2.5 font-black w-[52%]">الوثائق</th>
            <th className="border-2 border-neutral-600 bg-neutral-100 p-2.5 font-black w-[18%]">العدد</th>
            <th className="border-2 border-neutral-600 bg-neutral-100 p-2.5 font-black">الملاحظات</th>
          </tr>
        </thead>
        <tbody>
          {data.rows.map((r, i) => (
            <tr key={i}>
              <td className="border-2 border-neutral-600 p-2.5 text-center font-bold leading-7">{r.doc || '\u00A0'}</td>
              <td className="border-2 border-neutral-600 p-2.5 text-center font-black" dir="ltr">{r.count || '\u00A0'}</td>
              <td className="border-2 border-neutral-600 p-2.5 text-center font-bold">{r.note || '\u00A0'}</td>
            </tr>
          ))}
          <tr>
            <td className="border-2 border-neutral-600 p-2.5 text-center font-black">المجموع</td>
            <td className="border-2 border-neutral-600 p-2.5 text-center font-black" dir="ltr">{total || '\u00A0'}</td>
            <td className="border-2 border-neutral-600 p-2.5" />
          </tr>
        </tbody>
      </table>

      <footer className="mt-12 text-center">
        <SignatureStrip keys={['president']} variant="compact" className="justify-center" />
      </footer>
    </PaperShell>
  )
}

export function BordereauDialog({
  open,
  onClose,
  onSaved,
  onOpenLetterhead,
  onOpenSignatures,
}: {
  open: boolean
  onClose: () => void
  onSaved?: () => void
  onOpenLetterhead?: () => void
  onOpenSignatures?: () => void
}) {
  const [d, setD] = useState<BordereauData>({ ...EMPTY_BORDEREAU })
  const [titleDoc, setTitleDoc] = useState<DocText>(makeDocText('', { fontSize: 24, bold: true }))
  const [seed, setSeed] = useState('')
  const { saving, archive } = useArchivePaper(onSaved, onClose)

  if (open && !seed) {
    setSeed('open')
    setD({
      ...EMPTY_BORDEREAU,
      refNumber: `.../ن.ر.ه.ر.س ${new Date().getFullYear()}`,
      dateText: formatDateDMY(new Date()),
      rows: [{ doc: 'شهادة مدرسية', count: '', note: 'للإعلام' }],
    })
    setTitleDoc(makeDocText('', { fontSize: 24, bold: true }))
  }
  if (!open && seed) setSeed('')

  const setRow = (i: number, k: keyof BordereauRow) => (v: string) =>
    setD((prev) => ({ ...prev, rows: prev.rows.map((r, idx) => (idx === i ? { ...r, [k]: v } : r)) }))
  const addRow = () => setD((prev) => ({ ...prev, rows: [...prev.rows, { doc: '', count: '', note: '' }] }))
  const removeRow = (i: number) =>
    setD((prev) => ({ ...prev, rows: prev.rows.length > 1 ? prev.rows.filter((_, idx) => idx !== i) : prev.rows }))

  const data: BordereauData = { ...d, titleStyle: docTextToJson(titleDoc) }

  const saveArchive = () =>
    archive({
      refNumber: d.refNumber,
      title: `جدول إرسال إلى ${d.recipient || '—'}`,
      type: 'request',
      category: 'مراسلات رسمية',
      content: `جدول إرسال (${d.rows.length} وثائق — المجموع ${bordereauTotal(d.rows) || '—'}) إلى ${d.recipient || '—'} بتاريخ ${d.dateText}.`,
      systemForm: 'bordereau',
      params: { ...data, rows: JSON.stringify(d.rows) },
    })

  return (
    <Dialog open={open} onOpenChange={(v) => !v && onClose()}>
      <DialogContent className="sm:max-w-5xl max-h-[92vh] overflow-y-auto nice-scroll">
        <DialogHeader className="doc-print-hide">
          <DialogTitle className="flex items-center gap-2">
            <SendHorizonal className="h-5 w-5 text-(--club)" />
            جدول إرسال (Bordereau d&apos;envoi)
          </DialogTitle>
          <DialogDescription>
            يرفق مع الوثائق المرسلة للهيئات — أضف أسطر الوثائق وسيُحسب المجموع تلقائياً.
          </DialogDescription>
        </DialogHeader>
        <div className="grid grid-cols-1 lg:grid-cols-[400px_1fr] gap-5">
          <div className="space-y-3 doc-print-hide lg:order-1">
            <div className="flex flex-wrap items-center gap-2">
              {onOpenLetterhead && <LetterheadQuickSettings onOpen={onOpenLetterhead} />}
              {onOpenSignatures && <SignaturesQuickSettings onOpen={onOpenSignatures} />}
              <PaperSizeSelector value={d.paperSize} onChange={(s) => setD((p) => ({ ...p, paperSize: s }))} />
            </div>
            <DocTextEditor
              label="عنوان الوثيقة"
              value={titleDoc}
              onChange={setTitleDoc}
              fallbackHint={BORDEREAU_TITLE_FALLBACK}
            />
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1.5">
                <Label>الرقم</Label>
                <Input value={d.refNumber} onChange={(e) => setD((p) => ({ ...p, refNumber: e.target.value }))} dir="ltr" className="text-right" />
              </div>
              <div className="space-y-1.5">
                <Label>التاريخ (سعيدة في)</Label>
                <Input value={d.dateText} onChange={(e) => setD((p) => ({ ...p, dateText: e.target.value }))} />
              </div>
            </div>
            <div className="space-y-1.5">
              <Label>إلى السيد (الصفة)</Label>
              <Input value={d.recipient} onChange={(e) => setD((p) => ({ ...p, recipient: e.target.value }))} placeholder="مثال: مدير ديوان المركب المتعدد الرياضات لولاية سعيدة" />
            </div>
            <EditorGroup title="الوثائق المرسلة">
              <div className="space-y-2">
                {d.rows.map((r, i) => (
                  <div key={i} className="rounded-xl border border-(--border) bg-muted/30 p-2.5 space-y-1.5">
                    <div className="flex items-center justify-between">
                      <Badge variant="outline" className="text-[10px]">سطر {i + 1}</Badge>
                      {d.rows.length > 1 && (
                        <Button type="button" size="icon" variant="ghost" className="h-6 w-6 text-destructive" aria-label="حذف السطر" onClick={() => removeRow(i)}>
                          <Trash2 className="h-3.5 w-3.5" />
                        </Button>
                      )}
                    </div>
                    <Input value={r.doc} onChange={(e) => setRow(i, 'doc')(e.target.value)} placeholder="الوثيقة — مثال: شهادة مدرسية" />
                    <div className="grid grid-cols-2 gap-2">
                      <Input value={r.count} onChange={(e) => setRow(i, 'count')(e.target.value)} placeholder="العدد" dir="ltr" className="text-right" />
                      <Input value={r.note} onChange={(e) => setRow(i, 'note')(e.target.value)} placeholder="ملاحظة — مثال: للإعلام" />
                    </div>
                  </div>
                ))}
                <Button type="button" size="sm" variant="outline" onClick={addRow} className="font-bold">
                  <Plus className="h-3.5 w-3.5 ml-1" /> سطر
                </Button>
              </div>
            </EditorGroup>
            <PrintArchiveButtons onPrint={() => window.print()} onArchive={saveArchive} saving={saving} />
          </div>
          <PreviewPane>
            <BordereauPaper data={data} printable={false} />
          </PreviewPane>
        </div>
      </DialogContent>
      {open && (
        <PrintPortal>
          <PrintPageSize size={data.paperSize} />
          <BordereauPaper data={data} />
        </PrintPortal>
      )}
    </Dialog>
  )
}

// ==================================================================
// 6) شهادة ثبوت مكان مزاولة النشاط
// ==================================================================

export interface ActivityCertificateData {
  witness: string
  org: string
  /** النص العادي — للتوافق والأرشفة القديمة */
  body: string
  /** فقرات نص الشهادة المنسقة — JSON DocBlock[] */
  bodyBlocks: string
  placeDate: string
  signer: string
  /** عنوان الوثيقة المنسق — فارغ = العنوان الافتراضي */
  titleStyle: string
  paperSize: PaperSize
}

export const EMPTY_ACTIVITY_CERT: ActivityCertificateData = {
  witness: '',
  org: 'جمعية النادي الرياضي الهاوي متعدد الرياضات الرائد بلدية سعيدة',
  body: '',
  bodyBlocks: '',
  placeDate: '',
  signer: '',
  titleStyle: '',
  paperSize: 'A4',
}

/** عنوان الشهادة الافتراضي */
export const CERT_TITLE_FALLBACK = 'شَهَادَة إِثْبَات مَكَان مُزَاوَلَة النَّشَاط'

export function activityCertFromParams(p: Record<string, string> | undefined): ActivityCertificateData {
  return {
    witness: p?.witness ?? '',
    org: p?.org ?? EMPTY_ACTIVITY_CERT.org,
    body: p?.body ?? '',
    bodyBlocks: p?.bodyBlocks ?? '',
    placeDate: p?.placeDate ?? '',
    signer: p?.signer ?? '',
    titleStyle: p?.titleStyle ?? '',
    paperSize: paperSizeFromParams(p),
  }
}

function composeActivityBody(place: string): string {
  return `تزاول نشاطاتها الرياضية والتدريبية بصفة منتظمة على مستوى ${place.trim() || 'المنشأة الرياضية البلدية'}، وذلك في إطار ممارسة أنشطتها الرياضية لفائدة الرياضيين المنخرطين بالجمعية.

وقد سلمت هذه الشهادة للمعنيين بالأمر قصد إثبات مكان مزاولة النشاط الرياضي للجمعية، ولتقديمها لدى مختلف الهيئات والمصالح الإدارية عند الحاجة.

حررت هذه الشهادة بناءً على طلب الجمعية، للإدلاء بها فيما يسمح به القانون.`
}

export function ActivityCertificatePaper({ data, printable = true }: { data: ActivityCertificateData; printable?: boolean }) {
  const title = docTextFromJson(data.titleStyle, makeDocText('', { fontSize: 19, bold: true, align: 'center' }))
  const blocks = blocksFromJson(data.bodyBlocks, data.body.trim() || composeActivityBody(''))
  return (
    <PaperShell printable={printable} paperSize={data.paperSize}>
      <ClubLetterhead />
      <DocTextView
        t={title}
        fallback={CERT_TITLE_FALLBACK}
        className="mt-5 tracking-wide"
      />

      <p className="mt-6 text-[13.5px] font-black leading-[2]">{data.witness || 'يشهد .................. أن:'}</p>

      <p className="mt-3 text-center text-[14.5px] font-black leading-[2] underline decoration-1 underline-offset-4">
        {data.org}
      </p>

      <DocBlocksView blocks={blocks} className="mt-4 text-neutral-800" />

      <p className="mt-5 text-[13px] font-black">
        حرر بسعيدة في: <span dir="ltr">{data.placeDate || '........ / ........ / ........'}</span>
      </p>

      <footer className="mt-14 text-center">
        <div className="text-[13px] font-black underline">{data.signer || 'مدير الملعب البلدي'}</div>
        <div className="mx-auto mt-12 w-28 border-t border-dashed border-neutral-400" />
      </footer>
    </PaperShell>
  )
}

export function ActivityCertificateDialog({
  open,
  onClose,
  onSaved,
  onOpenLetterhead,
  onOpenSignatures,
}: {
  open: boolean
  onClose: () => void
  onSaved?: () => void
  onOpenLetterhead?: () => void
  onOpenSignatures?: () => void
}) {
  const [d, setD] = useState<ActivityCertificateData>({ ...EMPTY_ACTIVITY_CERT })
  const [titleDoc, setTitleDoc] = useState<DocText>(makeDocText('', { fontSize: 19, bold: true }))
  const [blocks, setBlocks] = useState<DocBlock[]>([makeBlock('')])
  const [seed, setSeed] = useState('')
  const { saving, archive } = useArchivePaper(onSaved, onClose)

  if (open && !seed) {
    setSeed('open')
    const init: ActivityCertificateData = {
      ...EMPTY_ACTIVITY_CERT,
      witness: 'يشهد مدير الملعب البلدي الإخوة براسي – سعيدة أن:',
      placeDate: formatDateDMY(new Date()),
      signer: 'مدير الملعب البلدي الإخوة براسي',
    }
    setD(init)
    setTitleDoc(makeDocText('', { fontSize: 19, bold: true }))
    setBlocks([makeBlock(composeActivityBody(''))])
  }
  if (!open && seed) setSeed('')

  const set = (k: keyof ActivityCertificateData) => (v: string) => setD((prev) => ({ ...prev, [k]: v }))
  const data: ActivityCertificateData = {
    ...d,
    body: blocksToPlain(blocks),
    bodyBlocks: blocksToJson(blocks),
    titleStyle: docTextToJson(titleDoc),
  }

  const saveArchive = () =>
    archive({
      refNumber: '',
      title: `شهادة ثبوت مكان مزاولة النشاط — ${d.signer || 'مدير الملعب'}`,
      type: 'file',
      category: 'وثائق الإدارة',
      content: `شهادة صادرة عن ${d.signer || 'مدير الملعب البلدي'} تثبت مزاولة ${d.org} لأنشطتها الرياضية بانتظام.`,
      systemForm: 'activity-certificate',
      params: { ...data },
    })

  return (
    <Dialog open={open} onOpenChange={(v) => !v && onClose()}>
      <DialogContent className="sm:max-w-5xl max-h-[92vh] overflow-y-auto nice-scroll">
        <DialogHeader className="doc-print-hide">
          <DialogTitle className="flex items-center gap-2">
            <Building2 className="h-5 w-5 text-(--club)" />
            شهادة ثبوت مكان مزاولة النشاط
          </DialogTitle>
          <DialogDescription>
            تصديق من مدير المنشأة البلدية بأن النادي يزاول نشاطاته بانتظام — تُقدَّم للهيئات الإدارية عند الحاجة.
          </DialogDescription>
        </DialogHeader>
        <div className="grid grid-cols-1 lg:grid-cols-[400px_1fr] gap-5">
          <div className="space-y-3 doc-print-hide lg:order-1">
            <div className="flex flex-wrap items-center gap-2">
              {onOpenLetterhead && <LetterheadQuickSettings onOpen={onOpenLetterhead} />}
              {onOpenSignatures && <SignaturesQuickSettings onOpen={onOpenSignatures} />}
              <PaperSizeSelector value={d.paperSize} onChange={(s) => set('paperSize')(s)} />
            </div>
            <DocTextEditor
              label="عنوان الوثيقة"
              value={titleDoc}
              onChange={setTitleDoc}
              fallbackHint={CERT_TITLE_FALLBACK}
            />
            <div className="space-y-1.5">
              <Label>الشاهد (الجهة المصدرة)</Label>
              <Input value={d.witness} onChange={(e) => set('witness')(e.target.value)} placeholder="مثال: يشهد مدير الملعب البلدي الإخوة براسي – سعيدة أن:" />
            </div>
            <div className="space-y-1.5">
              <Label>الجهة المستفيدة</Label>
              <Input value={d.org} onChange={(e) => set('org')(e.target.value)} />
            </div>
            <DocBlocksEditor
              label="نص الشهادة — قابلة للترتيب والتنسيق"
              blocks={blocks}
              onChange={setBlocks}
              hint="Aligner / Justifier + حجم الكتابة + عريض + نقاط + ترتيب يدوي، وEnter لسطر جديد في نفس النص"
              addLabel="إضافة نص جديد"
            />
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1.5">
                <Label>تاريخ التحرير</Label>
                <Input value={d.placeDate} onChange={(e) => set('placeDate')(e.target.value)} placeholder="يوم/شهر/سنة" />
              </div>
              <div className="space-y-1.5">
                <Label>الموقّع</Label>
                <Input value={d.signer} onChange={(e) => set('signer')(e.target.value)} placeholder="مدير الملعب البلدي…" />
              </div>
            </div>
            <PrintArchiveButtons onPrint={() => window.print()} onArchive={saveArchive} saving={saving} />
          </div>
          <PreviewPane>
            <ActivityCertificatePaper data={data} printable={false} />
          </PreviewPane>
        </div>
      </DialogContent>
      {open && (
        <PrintPortal>
          <PrintPageSize size={data.paperSize} />
          <ActivityCertificatePaper data={data} />
        </PrintPortal>
      )}
    </Dialog>
  )
}

// ==================================================================
// 7) طلب إعانة مالية
// ==================================================================

export interface SubsidyRequestData {
  refNumber: string
  dateText: string
  recipient: string
  subject: string
  /** تنسيق الموضوع — JSON DocText */
  subjectStyle: string
  /** النص العادي — للتوافق والأرشفة القديمة */
  body: string
  /** فقرات نص الطلب المنسقة — JSON DocBlock[] */
  bodyBlocks: string
  paperSize: PaperSize
}

export const EMPTY_SUBSIDY: SubsidyRequestData = {
  refNumber: '',
  dateText: '',
  recipient: 'رئيس المجلس الشعبي البلدي لبلدية سعيدة',
  subject: 'طلب إعانة مالية',
  subjectStyle: '',
  body: '',
  bodyBlocks: '',
  paperSize: 'A4',
}

export function subsidyFromParams(p: Record<string, string> | undefined): SubsidyRequestData {
  return {
    refNumber: p?.refNumber ?? '',
    dateText: p?.dateText ?? '',
    recipient: p?.recipient ?? EMPTY_SUBSIDY.recipient,
    subject: p?.subject ?? EMPTY_SUBSIDY.subject,
    subjectStyle: p?.subjectStyle ?? '',
    body: p?.body ?? '',
    bodyBlocks: p?.bodyBlocks ?? '',
    paperSize: paperSizeFromParams(p),
  }
}

const SUBSIDY_DEFAULT_BODY = `يشرفني أن أتقدم إلى سيادتكم المحترمة بهذا الطلب، راجيًا منكم التفضل بالموافقة على منح جمعية النادي الرياضي الهاوي المتعدد الرياضات الرائد – بلدية سعيدة إعانة مالية، وذلك قصد المساهمة في دعم نشاطات الجمعية الرياضية وتمكينها من مواصلة برامجها الرياضية وتغطية جزء من احتياجاتها ونفقاتها المتعلقة بمختلف النشاطات والتظاهرات الرياضية.`

export function SubsidyRequestPaper({ data, printable = true }: { data: SubsidyRequestData; printable?: boolean }) {
  const subjectDoc = docTextFromJson(
    data.subjectStyle,
    makeDocText(data.subject, { fontSize: 15, bold: true, align: 'center' })
  )
  const blocks = blocksFromJson(data.bodyBlocks, data.body.trim() || SUBSIDY_DEFAULT_BODY)
  return (
    <PaperShell printable={printable} paperSize={data.paperSize}>
      <ClubLetterhead />
      <RefDateLine refNumber={data.refNumber} dateText={data.dateText} />
      <p className="mt-4 text-[13.5px] font-black">إلى السيد: {data.recipient || '.....................'}</p>
      <p
        className="mt-4 underline decoration-2 underline-offset-8"
        style={{
          textAlign: subjectDoc.align,
          fontSize: `${subjectDoc.fontSize}px`,
          fontWeight: subjectDoc.bold ? 900 : 600,
        }}
      >
        الموضوع: {subjectDoc.text.trim() || '.....................'}
      </p>
      <DocBlocksView blocks={blocks} className="mt-5 min-h-[170px] text-neutral-800" />
      <p className="mt-2 text-[13.5px] font-bold leading-[2]">
        وفي انتظار استجابتكم، تقبلوا فائق عبارات الاحترام والتقدير.
      </p>
      <footer className="mt-10 flex items-end justify-between px-2">
        <OfficialStamp lines={['الجمهورية الجزائرية', 'جمعية الرائد الرياضي']} />
        {/* الإمضاءات المفعّلة من إدارة النادي (رئيس النادي / رئيس الفرع) */}
        <SignatureStrip keys={['president', 'branch']} variant="compact" />
      </footer>
    </PaperShell>
  )
}

export function SubsidyRequestDialog({
  open,
  onClose,
  onSaved,
  onOpenLetterhead,
  onOpenSignatures,
}: {
  open: boolean
  onClose: () => void
  onSaved?: () => void
  onOpenLetterhead?: () => void
  onOpenSignatures?: () => void
}) {
  const [d, setD] = useState<SubsidyRequestData>({ ...EMPTY_SUBSIDY })
  const [subjectDoc, setSubjectDoc] = useState<DocText>(makeDocText(EMPTY_SUBSIDY.subject, { fontSize: 15, bold: true }))
  const [blocks, setBlocks] = useState<DocBlock[]>([makeBlock('')])
  const [seed, setSeed] = useState('')
  const { saving, archive } = useArchivePaper(onSaved, onClose)

  if (open && !seed) {
    setSeed('open')
    setD({ ...EMPTY_SUBSIDY, refNumber: `.../ن.ر.ه.ر.س ${new Date().getFullYear()}`, dateText: formatDateDMY(new Date()) })
    setSubjectDoc(makeDocText(EMPTY_SUBSIDY.subject, { fontSize: 15, bold: true }))
    setBlocks([makeBlock(SUBSIDY_DEFAULT_BODY)])
  }
  if (!open && seed) setSeed('')

  const set = (k: keyof SubsidyRequestData) => (v: string) => setD((prev) => ({ ...prev, [k]: v }))
  const data: SubsidyRequestData = {
    ...d,
    subject: subjectDoc.text,
    subjectStyle: docTextToJson(subjectDoc),
    body: blocksToPlain(blocks),
    bodyBlocks: blocksToJson(blocks),
  }

  const saveArchive = () =>
    archive({
      refNumber: d.refNumber,
      title: 'طلب إعانة مالية',
      type: 'request',
      category: 'مراسلات رسمية',
      content: data.body || SUBSIDY_DEFAULT_BODY,
      systemForm: 'subsidy-request',
      params: { ...data, body: data.body || SUBSIDY_DEFAULT_BODY },
    })

  return (
    <Dialog open={open} onOpenChange={(v) => !v && onClose()}>
      <DialogContent className="sm:max-w-5xl max-h-[92vh] overflow-y-auto nice-scroll">
        <DialogHeader className="doc-print-hide">
          <DialogTitle className="flex items-center gap-2">
            <Wallet className="h-5 w-5 text-(--club)" />
            طلب إعانة مالية — مراسلة رسمية
          </DialogTitle>
          <DialogDescription>
            مراسلة بترويسة النادي موجهة للمجلس الشعبي البلدي لطلب دعم مالي — عدّل النص ثم اطبع.
          </DialogDescription>
        </DialogHeader>
        <div className="grid grid-cols-1 lg:grid-cols-[400px_1fr] gap-5">
          <div className="space-y-3 doc-print-hide lg:order-1">
            <div className="flex flex-wrap gap-2">
              {onOpenLetterhead && <LetterheadQuickSettings onOpen={onOpenLetterhead} />}
              {onOpenSignatures && <SignaturesQuickSettings onOpen={onOpenSignatures} />}
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1.5">
                <Label>الرقم</Label>
                <Input value={d.refNumber} onChange={(e) => set('refNumber')(e.target.value)} dir="ltr" className="text-right" />
              </div>
              <div className="space-y-1.5">
                <Label>التاريخ (سعيدة في)</Label>
                <Input value={d.dateText} onChange={(e) => set('dateText')(e.target.value)} />
              </div>
            </div>
            <div className="space-y-1.5">
              <Label>إلى السيد</Label>
              <Input value={d.recipient} onChange={(e) => set('recipient')(e.target.value)} />
            </div>
            <div className="space-y-1.5">
              <Label>الموضوع</Label>
              <Input value={d.subject} onChange={(e) => set('subject')(e.target.value)} />
            </div>
            <div className="space-y-1.5">
              <Label>نص الطلب (فارغ = النص الرسمي الافتراضي)</Label>
              <Textarea value={d.body} onChange={(e) => set('body')(e.target.value)} rows={8} />
            </div>
            <PrintArchiveButtons onPrint={() => window.print()} onArchive={saveArchive} saving={saving} />
          </div>
          <PreviewPane>
            <SubsidyRequestPaper data={d} printable={false} />
          </PreviewPane>
        </div>
      </DialogContent>
      {open && (
        <PrintPortal>
          <SubsidyRequestPaper data={d} />
        </PrintPortal>
      )}
    </Dialog>
  )
}

// ==================================================================
// 8) وصل استلام مستحقات
// ==================================================================

export interface ReceiptData {
  name: string
  idNumber: string
  job: string
  receivedFrom: string
  amount: string
  amountNote: string
  reason: string
  dateText: string
  /** عنوان الوثيقة المنسق — فارغ = «وصل استلام مستحقات» */
  titleStyle: string
  paperSize: PaperSize
}

export const EMPTY_RECEIPT: ReceiptData = {
  name: '',
  idNumber: '',
  job: '',
  receivedFrom: 'النادي الرياضي الهاوي متعدد الرياضات الرائد بلدية سعيدة',
  amount: '',
  amountNote: '',
  reason: 'أجر شهر',
  dateText: '',
  titleStyle: '',
  paperSize: 'A4',
}

/** عنوان الوصل الافتراضي */
export const RECEIPT_TITLE_FALLBACK = 'وصل استلام مستحقات'

export function receiptFromParams(p: Record<string, string> | undefined): ReceiptData {
  return {
    name: p?.name ?? '',
    idNumber: p?.idNumber ?? '',
    job: p?.job ?? '',
    receivedFrom: p?.receivedFrom ?? EMPTY_RECEIPT.receivedFrom,
    amount: p?.amount ?? '',
    amountNote: p?.amountNote ?? '',
    reason: p?.reason ?? EMPTY_RECEIPT.reason,
    dateText: p?.dateText ?? '',
    titleStyle: p?.titleStyle ?? '',
    paperSize: paperSizeFromParams(p),
  }
}

export function ReceiptPaper({ data, printable = true }: { data: ReceiptData; printable?: boolean }) {
  const d = data
  const title = docTextFromJson(d.titleStyle, makeDocText('', { fontSize: 22, bold: true, align: 'center' }))
  return (
    <PaperShell printable={printable} paperSize={d.paperSize}>
      <ClubLetterhead compact />
      <DocTextView t={title} fallback={RECEIPT_TITLE_FALLBACK} className="mt-5 tracking-wide" />
      <p className="mt-1 text-center text-[12px] font-bold text-muted-foreground">أنا الممضي أسفله</p>

      <div className="mt-7 space-y-6 text-[13.5px]">
        <FieldLine label="أنا الممضي أسفله:" value={d.name} strong />
        <FieldLine label="حامل بطاقة التعريف رقم:" value={d.idNumber} strong />
        <FieldLine label="الوظيفة:" value={d.job} strong />

        <p className="text-center text-[14.5px] font-black leading-[2]">
          استلمت من <span className="underline decoration-1 underline-offset-4">{d.receivedFrom}</span>
        </p>

        <FieldLine label="مبلغًا قدره:" value={d.amount} strong />
        {d.amountNote.trim() && <FieldLine label="" value={d.amountNote} />}

        <p className="text-[14px] font-black leading-[2]">
          وذلك بعنوان: <span className="border-b border-dotted border-neutral-500 px-2 font-bold">{d.reason || '\u00A0'}</span>
        </p>

        <FieldLine label="بتاريخ:" value={d.dateText} strong />
      </div>

      <footer className="mt-14 flex items-end justify-between px-2 text-[11.5px] font-black">
        <div className="text-center">
          <div className="underline">ختم الجمعية:</div>
          <div className="mt-12 w-28 border-t border-dashed border-neutral-400" />
        </div>
        <SignatureStrip keys={['concerned']} variant="compact" />
      </footer>
    </PaperShell>
  )
}

export function ReceiptDialog({
  open,
  onClose,
  onSaved,
  onOpenLetterhead,
  onOpenSignatures,
}: {
  open: boolean
  onClose: () => void
  onSaved?: () => void
  onOpenLetterhead?: () => void
  onOpenSignatures?: () => void
}) {
  const [d, setD] = useState<ReceiptData>({ ...EMPTY_RECEIPT })
  const [titleDoc, setTitleDoc] = useState<DocText>(makeDocText('', { fontSize: 22, bold: true }))
  const [seed, setSeed] = useState('')
  const { saving, archive } = useArchivePaper(onSaved, onClose)

  if (open && !seed) {
    setSeed('open')
    setD({ ...EMPTY_RECEIPT, dateText: formatDateDMY(new Date()) })
    setTitleDoc(makeDocText('', { fontSize: 22, bold: true }))
  }
  if (!open && seed) setSeed('')

  const set = (k: keyof ReceiptData) => (v: string) => setD((prev) => ({ ...prev, [k]: v }))
  const data: ReceiptData = { ...d, titleStyle: docTextToJson(titleDoc) }

  const saveArchive = () =>
    archive({
      refNumber: '',
      title: `وصل استلام مستحقات — ${d.name || 'غير معبأ'}`,
      type: 'file',
      category: 'المستحقات',
      content: `وصل استلام: ${d.name || '—'} (${d.job || '—'}) استلم مبلغاً قدره ${d.amount || '—'} بعنوان ${d.reason || '—'} بتاريخ ${d.dateText || '—'}.`,
      systemForm: 'receipt',
      params: { ...data },
    })

  return (
    <Dialog open={open} onOpenChange={(v) => !v && onClose()}>
      <DialogContent className="sm:max-w-5xl max-h-[92vh] overflow-y-auto nice-scroll">
        <DialogHeader className="doc-print-hide">
          <DialogTitle className="flex items-center gap-2">
            <ReceiptText className="h-5 w-5 text-(--club)" />
            وصل استلام مستحقات
          </DialogTitle>
          <DialogDescription>
            وصل رسمي بالدفعات المالية (أجور، مستحقات، منح…) — الحقول الفارغة تُطبع بخطوط منقطة للتعبئة اليدوية.
          </DialogDescription>
        </DialogHeader>
        <div className="grid grid-cols-1 lg:grid-cols-[400px_1fr] gap-5">
          <div className="space-y-3 doc-print-hide lg:order-1">
            <div className="flex flex-wrap items-center gap-2">
              {onOpenLetterhead && <LetterheadQuickSettings onOpen={onOpenLetterhead} />}
              {onOpenSignatures && <SignaturesQuickSettings onOpen={onOpenSignatures} />}
              <PaperSizeSelector value={d.paperSize} onChange={(s) => set('paperSize')(s)} />
            </div>
            <DocTextEditor
              label="عنوان الوثيقة"
              value={titleDoc}
              onChange={setTitleDoc}
              fallbackHint={RECEIPT_TITLE_FALLBACK}
            />
            <div className="rounded-xl bg-(--club-light) border border-(--club)/15 p-3 flex items-start gap-2">
              <Info className="h-4 w-4 text-(--club) shrink-0 mt-0.5" />
              <p className="text-[11px] font-bold text-(--club-dark) leading-relaxed">
                الحقول الفارغة تُطبع بخطوط منقطة لتُملأ يدوياً بالقلم عند التسليم.
              </p>
            </div>
            <EditorGroup title="المستلم">
              <Input value={d.name} onChange={(e) => set('name')(e.target.value)} placeholder="الاسم واللقب الكامل" />
              <Input value={d.idNumber} onChange={(e) => set('idNumber')(e.target.value)} placeholder="رقم بطاقة التعريف" dir="ltr" className="text-right" />
              <Input value={d.job} onChange={(e) => set('job')(e.target.value)} placeholder="الوظيفة — مثال: مدرب، حارس سباحة…" />
            </EditorGroup>
            <EditorGroup title="المبلغ">
              <Input value={d.receivedFrom} onChange={(e) => set('receivedFrom')(e.target.value)} placeholder="استلمت من…" />
              <Input value={d.amount} onChange={(e) => set('amount')(e.target.value)} placeholder="مبلغًا قدره — مثال: 25,000 دج" />
              <Input value={d.amountNote} onChange={(e) => set('amountNote')(e.target.value)} placeholder="المبلغ بالحروف (اختياري)" />
              <Input value={d.reason} onChange={(e) => set('reason')(e.target.value)} placeholder="بعنوان — مثال: أجر شهر أكتوبر 2026" />
              <Input value={d.dateText} onChange={(e) => set('dateText')(e.target.value)} placeholder="بتاريخ — يوم/شهر/سنة" />
            </EditorGroup>
            <PrintArchiveButtons onPrint={() => window.print()} onArchive={saveArchive} saving={saving} />
          </div>
          <PreviewPane>
            <ReceiptPaper data={data} printable={false} />
          </PreviewPane>
        </div>
      </DialogContent>
      {open && (
        <PrintPortal>
          <PrintPageSize size={data.paperSize} />
          <ReceiptPaper data={data} />
        </PrintPortal>
      )}
    </Dialog>
  )
}

// ==================================================================
// عرض ورقة نظامية من وثيقة مؤرشفة (يستخدم في أرشيف مكتب النادي)
// ==================================================================

export function SystemPaperView({ form, params }: { form: string; params?: Record<string, string> }) {
  switch (form) {
    case 'parent-authorization':
      return <ParentAuthorizationPaper data={authFromParams(params)} />
    case 'training-request': {
      const p = params ?? {}
      return (
        <TrainingRequestPaper
          data={{
            refNumber: p.refNumber ?? '',
            dateText: p.dateText ?? '',
            recipient: p.recipient ?? '',
            subject: p.subject ?? '',
            subjectStyle: p.subjectStyle ?? '',
            body: p.body ?? '',
            bodyBlocks: p.bodyBlocks ?? '',
            paperSize: paperSizeFromParams(params),
          }}
        />
      )
    }
    case 'time-schedule':
      return <TimeSchedulePaper data={timeScheduleFromParams(params)} />
    case 'work-contract':
      return <WorkContractPaper data={workContractFromParams(params)} />
    case 'work-resumption':
      return <WorkResumptionPaper data={workResumptionFromParams(params)} />
    case 'transport-request':
      return <TransportRequestPaper data={transportFromParams(params)} />
    case 'bordereau':
      return <BordereauPaper data={bordereauFromParams(params)} />
    case 'activity-certificate':
      return <ActivityCertificatePaper data={activityCertFromParams(params)} />
    case 'subsidy-request':
      return <SubsidyRequestPaper data={subsidyFromParams(params)} />
    case 'receipt':
      return <ReceiptPaper data={receiptFromParams(params)} />
    default:
      return null
  }
}

// ==================================================================
// قسم مكتبة النماذج الإدارية في مكتب النادي (الإدارة)
// ==================================================================

type DialogKey =
  | 'auth'
  | 'training'
  | 'schedule'
  | 'contract'
  | 'resumption'
  | 'transport'
  | 'bordereau'
  | 'certificate'
  | 'subsidy'
  | 'receipt'
  | null

export function AdminPaperLibrarySection({
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
  const [dialog, setDialog] = useState<DialogKey>(null)
  const [letterheadOpen, setLetterheadOpen] = useState(false)
  const [signaturesOpen, setSignaturesOpen] = useState(false)
  const [pickerOpen, setPickerOpen] = useState(false)
  const [pickerQuery, setPickerQuery] = useState('')
  const [authInitial, setAuthInitial] = useState<Partial<AuthorizationData>>({})

  const minors = enrollments.filter((e) => !!e.parentName)
  const filteredMinors = minors.filter((e) => {
    const q = pickerQuery.trim()
    if (!q) return true
    return (e.fullName || `${e.firstName} ${e.lastName}`).includes(q) || (e.parentName || '').includes(q)
  })

  const openBlankAuth = () => {
    setAuthInitial({})
    setDialog('auth')
  }
  const openFor = (e: EnrollmentItem & { branch?: { name: string } }) => {
    setAuthInitial(authorizationFromEnrollment(e, e.branch?.name || ''))
    setPickerOpen(false)
    setDialog('auth')
  }

  const cards: {
    key: Exclude<DialogKey, null>
    title: string
    desc: string
    icon: React.ReactNode
    actions: React.ReactNode
    tag?: string
  }[] = [
    {
      key: 'auth',
      title: 'تصريح أبوي',
      desc: 'للمنخرطين الأقل من 18 سنة — يُولَّد تلقائياً بمعلومات الولي والابن بعد كل استمارة انخراط قاصر، ويُطبع فارغاً لتعبئته يدوياً.',
      icon: <FileSignature className="h-5 w-5 text-(--club)" />,
      actions: (
        <>
          <Button size="sm" variant="outline" onClick={openBlankAuth} className="font-bold">
            <Printer className="h-3.5 w-3.5 ml-1" /> طباعة نموذج فارغ
          </Button>
          <Button
            size="sm"
            onClick={() => setPickerOpen(true)}
            className="bg-(--club) hover:bg-(--club)/90 text-white font-bold"
          >
            <FileSignature className="h-3.5 w-3.5 ml-1" /> إصدار لقاصر ({minors.length})
          </Button>
        </>
      ),
      tag: 'المنخرطون',
    },
    {
      key: 'training',
      title: 'طلب حصة تدريبية',
      desc: 'مراسلة رسمية بترويسة النادي لرئيس المجلس الشعبي البلدي لطلب حصص تدريبية في الملاعب البلدية — يُركّب النص تلقائياً.',
      icon: <Landmark className="h-5 w-5 text-(--club)" />,
      actions: (
        <Button
          size="sm"
          onClick={() => setDialog('training')}
          className="bg-(--club) hover:bg-(--club)/90 text-white font-bold"
        >
          <Landmark className="h-3.5 w-3.5 ml-1" /> إنشاء الطلب الرسمي
        </Button>
      ),
      tag: 'الملاعب البلدية',
    },
    {
      key: 'schedule',
      title: 'استعمال الزمن',
      desc: 'جدول الحصص الأسبوعي للمدرب (7 أيام × فترات قابلة للتسمية) بمعلومات الرتبة ومكان العمل والتعيين.',
      icon: <CalendarClock className="h-5 w-5 text-(--club)" />,
      actions: (
        <Button size="sm" onClick={() => setDialog('schedule')} className="bg-(--club) hover:bg-(--club)/90 text-white font-bold">
          <CalendarClock className="h-3.5 w-3.5 ml-1" /> إنشاء الجدول
        </Button>
      ),
      tag: 'التنظيم التربوي',
    },
    {
      key: 'contract',
      title: 'عقد عمل (CDD)',
      desc: 'النموذج الموحد الرسمي (11 مادة) — عقد واحد لكل الفروع مع تغيير الفرع والصفة والمهام والأجر، وتأشيرات حسب اختيار الإدارة.',
      icon: <FileText className="h-5 w-5 text-(--club)" />,
      actions: (
        <Button size="sm" onClick={() => setDialog('contract')} className="bg-(--club) hover:bg-(--club)/90 text-white font-bold">
          <FileText className="h-3.5 w-3.5 ml-1" /> إبرام العقد
        </Button>
      ),
      tag: 'الموارد البشرية',
    },
    {
      key: 'resumption',
      title: 'محضر استئناف العمل',
      desc: 'يوثّق استيفاء العطلة (السنوية…) وإعادة المعني إلى منصبه — بإمضاء المعني وختم الهيئة.',
      icon: <FileCheck2 className="h-5 w-5 text-(--club)" />,
      actions: (
        <Button size="sm" onClick={() => setDialog('resumption')} className="bg-(--club) hover:bg-(--club)/90 text-white font-bold">
          <FileCheck2 className="h-3.5 w-3.5 ml-1" /> تحرير المحضر
        </Button>
      ),
      tag: 'الموارد البشرية',
    },
    {
      key: 'transport',
      title: 'طلب وسيلة نقل',
      desc: 'مراسلة للمجلس الشعبي البلدي أو الجهات المعنية لطلب نقل الفريق إلى المنافسات والتظاهرات.',
      icon: <Truck className="h-5 w-5 text-(--club)" />,
      actions: (
        <Button size="sm" onClick={() => setDialog('transport')} className="bg-(--club) hover:bg-(--club)/90 text-white font-bold">
          <Truck className="h-3.5 w-3.5 ml-1" /> إنشاء الطلب
        </Button>
      ),
      tag: 'مراسلات رسمية',
    },
    {
      key: 'bordereau',
      title: 'جدول إرسال',
      desc: "Bordereau d'envoi — يرفق مع الوثائق المرسلة للهيئات بأسطر الوثائق والأعداد ومجموع تلقائي.",
      icon: <SendHorizonal className="h-5 w-5 text-(--club)" />,
      actions: (
        <Button size="sm" onClick={() => setDialog('bordereau')} className="bg-(--club) hover:bg-(--club)/90 text-white font-bold">
          <SendHorizonal className="h-3.5 w-3.5 ml-1" /> إعداد الإرسال
        </Button>
      ),
      tag: 'مراسلات رسمية',
    },
    {
      key: 'certificate',
      title: 'شهادة ثبوت مكان النشاط',
      desc: 'تصديق من مدير المنشأة البلدية بأن النادي يزاول نشاطاته الرياضية بانتظام — تُقدَّم للهيئات الإدارية.',
      icon: <Building2 className="h-5 w-5 text-(--club)" />,
      actions: (
        <Button size="sm" onClick={() => setDialog('certificate')} className="bg-(--club) hover:bg-(--club)/90 text-white font-bold">
          <Building2 className="h-3.5 w-3.5 ml-1" /> إصدار الشهادة
        </Button>
      ),
      tag: 'تصديقات',
    },
    {
      key: 'subsidy',
      title: 'طلب إعانة مالية',
      desc: 'مراسلة رسمية للمجلس الشعبي البلدي لطلب دعم مالي لأنشطة النادي وتظاهراته.',
      icon: <Wallet className="h-5 w-5 text-(--club)" />,
      actions: (
        <Button size="sm" onClick={() => setDialog('subsidy')} className="bg-(--club) hover:bg-(--club)/90 text-white font-bold">
          <Wallet className="h-3.5 w-3.5 ml-1" /> إنشاء الطلب
        </Button>
      ),
      tag: 'مراسلات رسمية',
    },
    {
      key: 'receipt',
      title: 'وصل استلام مستحقات',
      desc: 'وصل رسمي بالدفعات المالية (أجور، منح، مستحقات) بإمضاء المستلم وختم الجمعية.',
      icon: <ReceiptText className="h-5 w-5 text-(--club)" />,
      actions: (
        <Button size="sm" onClick={() => setDialog('receipt')} className="bg-(--club) hover:bg-(--club)/90 text-white font-bold">
          <ReceiptText className="h-3.5 w-3.5 ml-1" /> إصدار الوصل
        </Button>
      ),
      tag: 'المالية',
    },
  ]

  return (
    <>
      <div className="rounded-2xl bg-white border border-(--border) p-4 mb-4">
        <div className="flex flex-wrap items-center gap-2 mb-1">
          <Stamp className="h-4.5 w-4.5 text-(--club)" />
          <h3 className="font-black text-(--club-dark) text-sm">النماذج النظامية والإدارية الجاهزة</h3>
          <Badge variant="outline" className="text-[10px]">{cards.length} نموذجاً</Badge>
          <Button
            size="sm"
            variant="outline"
            onClick={() => setLetterheadOpen(true)}
            className="font-bold text-[11px]"
          >
            <Settings2 className="h-3.5 w-3.5 ml-1" /> تخصيص الترويسة الموحدة
          </Button>
          <Button
            size="sm"
            variant="outline"
            onClick={() => setSignaturesOpen(true)}
            className="font-bold text-[11px]"
          >
            <PenLine className="h-3.5 w-3.5 ml-1" /> اختيار الإمضاءات
          </Button>
        </div>
        <p className="text-[11px] text-muted-foreground mb-3">
          كل النماذج تُطبع بترويسة النادي الرسمية وبالإمضاءات التي تحددها إدارة النادي — وعند التعديل: محاذاة وضبط الأسطر،
          عنوان الوثيقة، ترتيب النصوص يدوياً، سطر جديد في نفس النص، حجم الكتابة والعريض والنقاط لكل نص، وحجم الورقة A4/A5،
          مع معاينة حية وأرشفة في مكتب النادي.
        </p>
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-3 max-h-[420px] overflow-y-auto nice-scroll p-0.5">
          {cards.map((c) => (
            <div key={c.key} className="rounded-xl border border-(--border) bg-muted/30 p-4 flex flex-col gap-2.5">
              <div className="flex items-start gap-3">
                <div className="h-10 w-10 rounded-xl bg-(--club-light) flex items-center justify-center shrink-0">
                  {c.icon}
                </div>
                <div className="min-w-0">
                  <div className="font-black text-sm text-(--club-dark) flex items-center gap-1.5 flex-wrap">
                    {c.title}
                    {c.tag && <Badge variant="outline" className="text-[9px] px-1.5 py-0">{c.tag}</Badge>}
                  </div>
                  <p className="text-[11px] text-muted-foreground mt-1 leading-relaxed line-clamp-3">{c.desc}</p>
                </div>
              </div>
              <div className="flex flex-wrap gap-2 mt-auto">{c.actions}</div>
            </div>
          ))}
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

      {/* نوافذ الإصدار */}
      <ParentAuthorizationDialog
        open={dialog === 'auth'}
        onClose={() => setDialog(null)}
        initial={authInitial}
        canArchive
        onSaved={onSaved}
      />
      <TrainingRequestDialog
        open={dialog === 'training'}
        onClose={() => setDialog(null)}
        branches={branches}
        requestCount={requestCount}
        onSaved={onSaved}
      />
      <TimeScheduleDialog open={dialog === 'schedule'} onClose={() => setDialog(null)} onSaved={onSaved} onOpenLetterhead={() => setLetterheadOpen(true)} onOpenSignatures={() => setSignaturesOpen(true)} />
      <WorkContractDialog open={dialog === 'contract'} onClose={() => setDialog(null)} onSaved={onSaved} onOpenLetterhead={() => setLetterheadOpen(true)} onOpenSignatures={() => setSignaturesOpen(true)} branches={branches} />
      <WorkResumptionDialog open={dialog === 'resumption'} onClose={() => setDialog(null)} onSaved={onSaved} onOpenLetterhead={() => setLetterheadOpen(true)} onOpenSignatures={() => setSignaturesOpen(true)} />
      <TransportRequestDialog open={dialog === 'transport'} onClose={() => setDialog(null)} onSaved={onSaved} onOpenLetterhead={() => setLetterheadOpen(true)} onOpenSignatures={() => setSignaturesOpen(true)} />
      <BordereauDialog open={dialog === 'bordereau'} onClose={() => setDialog(null)} onSaved={onSaved} onOpenLetterhead={() => setLetterheadOpen(true)} onOpenSignatures={() => setSignaturesOpen(true)} />
      <ActivityCertificateDialog open={dialog === 'certificate'} onClose={() => setDialog(null)} onSaved={onSaved} onOpenLetterhead={() => setLetterheadOpen(true)} onOpenSignatures={() => setSignaturesOpen(true)} />
      <SubsidyRequestDialog open={dialog === 'subsidy'} onClose={() => setDialog(null)} onSaved={onSaved} onOpenLetterhead={() => setLetterheadOpen(true)} onOpenSignatures={() => setSignaturesOpen(true)} />
      <ReceiptDialog open={dialog === 'receipt'} onClose={() => setDialog(null)} onSaved={onSaved} onOpenLetterhead={() => setLetterheadOpen(true)} onOpenSignatures={() => setSignaturesOpen(true)} />

      <LetterheadSettingsDialog open={letterheadOpen} onClose={() => setLetterheadOpen(false)} />
      <SignatureSettingsDialog open={signaturesOpen} onClose={() => setSignaturesOpen(false)} />
    </>
  )
}
