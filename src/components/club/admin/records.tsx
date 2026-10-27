'use client'

/**
 * مكتب النادي — أهم صفحة إدارية في الموقع: تُصدر كل أوراق النادي ونماذجه وملفاته الإدارية.
 *
 * ثلاث تبويبات داخلية:
 *  1) النماذج والمراجع: مكتبة القوالب — استيراد نموذج/مرجع (صورة أو PDF) + مصمم حقول التعبئة بإحداثيات %
 *  2) إصدار وثيقة: نموذج ديناميكي من حقول القالب + معاينة A4 حية بترويسة موحدة + طباعة/PDF + حفظ في الأرشيف
 *  3) أرشيف الوثائق: كل الوثائق (ملفات/محاضر/مراسلات/تصاميم + الوثائق المُصدرة) مع إعادة فتح الإصدار
 */

import { useEffect, useMemo, useState } from 'react'
import {
  Archive,
  BookOpen,
  Crosshair,
  Download,
  Eye,
  EyeOff,
  FilePlus2,
  FileText,
  Inbox,
  Library,
  Loader2,
  Mail,
  Palette,
  Pencil,
  Plus,
  Power,
  Printer,
  RotateCcw,
  ScrollText,
  Search,
  Stamp,
  Star,
  Trash2,
  Upload,
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import { Label } from '@/components/ui/label'
import { Badge } from '@/components/ui/badge'
import { Switch } from '@/components/ui/switch'
import { Separator } from '@/components/ui/separator'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog'
import { useToast } from '@/hooks/use-toast'
import { apiFetch } from '@/lib/session'
import { formatDateDMY } from '@/lib/date-format'
import { DocumentPaper, parseDesign, type DocumentDesign } from '../document-paper'
import { parseSystemDesign } from '../system-papers'
import { PaperSizeSelector, PrintPageSize, isA5, normalizePaperSize, paperHalfClass, type PaperSize } from '../doc-blocks'
import { AdminPaperLibrarySection, SystemPaperView } from '../admin-papers'
import type {
  AdminData,
  ClubDocumentItem,
  ClubDocumentType,
  DocumentTemplateItem,
  TemplateField,
} from '../types'

// ============================================================
//  ثوابت وأدوات مشتركة
// ============================================================

/** مفاتيح الحقول الثابتة وتسمياتها العربية الجاهزة في نموذج الإصدار */
const FIELD_KEYS: Array<{ value: string; label: string }> = [
  { value: 'fullName', label: 'الاسم الكامل' },
  { value: 'firstName', label: 'الاسم' },
  { value: 'lastName', label: 'اللقب' },
  { value: 'birthDate', label: 'تاريخ الميلاد' },
  { value: 'date', label: 'التاريخ' },
  { value: 'phone', label: 'رقم الهاتف' },
  { value: 'position', label: 'المنصب' },
  { value: 'custom', label: 'حقل حر' },
]

const FIELD_KEY_LABELS: Record<string, string> = Object.fromEntries(
  FIELD_KEYS.map((k) => [k.value, k.label]),
)

/** تصنيفات جاهزة لاستيراد النماذج (مع إمكانية تصنيف حر) */
const TEMPLATE_CATEGORIES = ['كتاب إداري', 'محضر', 'شهادة', 'ترخيص', 'مراسلة', 'استدعاء', 'قرار']

const KIND_LABELS: Record<string, string> = {
  template: 'نموذج قابل للإصدار',
  reference: 'مرجع للقراءة',
}

/** يقرأ حجم الورقة المحفوظ في تصميم وثيقة (A4 افتراضياً) */
function docPaperSize(designJson: string | undefined): PaperSize {
  return normalizePaperSize(parseDesign(designJson ?? '').paperSize)
}

/** تسميات أنواع وثائق الأرشيف — محلية لتغطية النوع المُصدَر أيضاً */
const TYPE_LABELS: Record<ClubDocumentType, string> = {
  file: 'ملف',
  minute: 'محضر',
  letter: 'مراسلة',
  request: 'طلب',
  design: 'ورقة رسمية',
  issued: 'وثيقة مُصدرة',
}

const TYPE_ICONS: Record<ClubDocumentType, React.ComponentType<{ className?: string }>> = {
  file: FileText,
  minute: ScrollText,
  letter: Mail,
  request: Inbox,
  design: Palette,
  issued: Stamp,
}

const TYPE_BADGE: Record<ClubDocumentType, string> = {
  file: 'bg-(--club)/10 text-(--club)',
  minute: 'bg-(--flag-red)/10 text-(--flag-red)',
  letter: 'bg-(--flag-green)/10 text-(--flag-green)',
  request: 'bg-amber-500/10 text-amber-700',
  design: 'bg-purple-500/10 text-purple-700',
  issued: 'bg-[#9a7a25]/15 text-[#7c621d]',
}

const OLD_CATEGORIES = [
  'محاضر التنصيب',
  'ملفات الإطارات',
  'ملفات إدارية',
  'مراسلات',
  'طلبات',
  'تصاميم أوراق',
  'قرارات',
]

const DEFAULT_FORM = {
  refNumber: '',
  title: '',
  type: 'file' as ClubDocumentType,
  category: '',
  content: '',
  branchId: '',
  memberId: '',
  visibleToBranch: false,
  design: '',
}

const DEFAULT_DESIGN: DocumentDesign = {
  style: 'official',
  accent: 'navy',
  showLogo: true,
  showStamp: true,
  showWatermark: true,
  signatureName: 'رئيس النادي',
}

function todayDMY(): string {
  const d = new Date()
  return `${String(d.getDate()).padStart(2, '0')}/${String(d.getMonth() + 1).padStart(2, '0')}/${d.getFullYear()}`
}

/** تحويل قيمة حقل للعرض على الورقة (تواريخ ISO مخزّنة → يوم/شهر/سنة) */
function displayFieldValue(value: string): string {
  if (!value) return ''
  return formatDateDMY(value) || value
}

/** تسمية حقل الإصدار: التسمية المحفوظة أو الترجمة الجاهزة للمفتاح */
function fieldLabel(f: TemplateField): string {
  return (f.label || '').trim() || FIELD_KEY_LABELS[f.key] || f.key
}

/**
 * حجم خط الحقل بوحدة cqw (نسبة من عرض الصفحة): A4 = 595.28pt عرضاً،
 * بحيث تطابق المعاينة على الشاشة المقاس المطبوع فعلياً على ورقة A4.
 */
function fieldFontSizeCqw(size: number): string {
  return `${((size * 100) / 595.28).toFixed(3)}cqw`
}

/** تنظيف حقول قادمة من قاعدة البيانات إلى شكل TemplateField سليم */
function normalizeFields(raw: unknown): TemplateField[] {
  if (!Array.isArray(raw)) return []
  return raw
    .filter((f) => f && typeof f === 'object')
    .map((f) => {
      const o = f as Record<string, unknown>
      return {
        key: String(o.key ?? 'custom'),
        label: String(o.label ?? ''),
        x: Math.min(100, Math.max(0, Number(o.x) || 0)),
        y: Math.min(100, Math.max(0, Number(o.y) || 0)),
        w: Math.min(100, Math.max(2, Number(o.w) || 24)),
        size: Math.min(48, Math.max(5, Number(o.size) || 12)),
        bold: Boolean(o.bold),
      }
    })
}

/** ذاكرة مؤقتة مشتركة لمعاينات القوالب المصغرة (تُجلب مرة واحدة لكل جلسة) */
const thumbCache = new Map<string, string>()

// ============================================================
//  مكوّنات مساعدة داخل الملف
// ============================================================

/** زر تبويب داخلي */
function TabBtn({
  active,
  onClick,
  icon: Icon,
  label,
  count,
}: {
  active: boolean
  onClick: () => void
  icon: React.ComponentType<{ className?: string }>
  label: string
  count: number
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      aria-current={active ? 'true' : undefined}
      className={`flex items-center gap-2 rounded-xl px-4 py-2.5 text-sm font-bold transition-all ${
        active ? 'bg-(--club) text-white shadow' : 'bg-muted text-(--club-dark) hover:bg-muted/70'
      }`}
    >
      <Icon className="h-4 w-4" />
      {label}
      <span
        className={`rounded-full px-1.5 py-0.5 text-[10px] font-black ${
          active ? 'bg-white/20 text-white' : 'bg-(--club)/10 text-(--club)'
        }`}
      >
        {count}
      </span>
    </button>
  )
}

/** معاينة مصغرة لقالب — تُجلب أولاً صفحة الصورة عند الطلب (مع ذاكرة مشتركة) */
function TemplateThumb({ template, className }: { template: DocumentTemplateItem; className?: string }) {
  const [src, setSrc] = useState<string>(() => thumbCache.get(template.id) ?? '')

  useEffect(() => {
    if (template.fileType !== 'image' || src) return
    let alive = true
    apiFetch(`/api/admin/templates?id=${template.id}`)
      .then((r) => (r.ok ? r.json() : null))
      .then((d) => {
        const url = d?.template?.fileData as string | undefined
        if (alive && url) {
          thumbCache.set(template.id, url)
          setSrc(url)
        }
      })
      .catch(() => {})
    return () => {
      alive = false
    }
  }, [template.id, template.fileType, src])

  if (template.fileType === 'pdf') {
    return (
      <div
        className={`flex items-center justify-center rounded-lg border border-(--border) bg-muted/50 text-muted-foreground ${className ?? ''}`}
      >
        <FileText className="h-7 w-7 opacity-60" />
      </div>
    )
  }
  if (src) {
    return (
      <img
        src={src}
        alt={`معاينة النموذج: ${template.name}`}
        className={`rounded-lg border border-(--border) bg-white object-contain ${className ?? ''}`}
      />
    )
  }
  return (
    <div
      className={`flex items-center justify-center rounded-lg border border-(--border) bg-muted/40 ${className ?? ''}`}
    >
      <Loader2 className="h-5 w-5 animate-spin text-muted-foreground" />
    </div>
  )
}

/**
 * إطار A4 حي لمصمم الحقول — النقر على أي نقطة يضيف حقلاً عند تلك الإحداثيات
 * (نسبة مئوية من الإطار). العلامات مرئية بحدود متقطعة لتمييز مواضع الحقول.
 */
function DesignerCanvas({
  fileType,
  fileData,
  fields,
  selected,
  onAdd,
  onSelect,
}: {
  fileType: string
  fileData: string
  fields: TemplateField[]
  selected: number
  onAdd: (x: number, y: number) => void
  onSelect: (i: number) => void
}) {
  const [pulse, setPulse] = useState<{ x: number; y: number } | null>(null)

  const handleClick = (e: React.MouseEvent<HTMLDivElement>) => {
    const rect = e.currentTarget.getBoundingClientRect()
    const x = Math.min(100, Math.max(0, ((e.clientX - rect.left) / rect.width) * 100))
    const y = Math.min(100, Math.max(0, ((e.clientY - rect.top) / rect.height) * 100))
    const rounded = { x: Math.round(x * 10) / 10, y: Math.round(y * 10) / 10 }
    setPulse(rounded)
    window.setTimeout(() => setPulse(null), 700)
    onAdd(rounded.x, rounded.y)
  }

  return (
    <div
      onClick={handleClick}
      role="button"
      tabIndex={0}
      aria-label="منطقة النموذج — انقر لإضافة حقل تعبئة عند النقطة"
      className="relative aspect-[210/297] w-full cursor-crosshair select-none overflow-hidden rounded-xl border-2 border-dashed border-(--club)/30 bg-white shadow-inner"
      style={{ containerType: 'inline-size' }}
    >
      {fileType === 'image' && fileData ? (
        <img
          src={fileData}
          alt="قالب النموذج"
          className="pointer-events-none absolute inset-0 h-full w-full object-contain"
        />
      ) : (
        <div
          className="pointer-events-none absolute inset-0 flex flex-col items-center justify-center gap-2 text-muted-foreground"
          style={{
            backgroundImage:
              'repeating-linear-gradient(0deg, transparent, transparent 23px, oklch(0.88 0.01 260 / 0.45) 23px, oklch(0.88 0.01 260 / 0.45) 24px)',
          }}
        >
          <FileText className="h-10 w-10 opacity-40" />
          <p className="text-xs font-bold">ملف PDF — أضف الحقول حسب مواضعها في المستند</p>
        </div>
      )}

      {/* وميض نقرة الإضافة */}
      {pulse && (
        <span
          className="animate-pulse-ring pointer-events-none absolute h-6 w-6 -translate-x-1/2 -translate-y-1/2 rounded-full border-2 border-(--club) bg-(--club)/20"
          style={{ left: `${pulse.x}%`, top: `${pulse.y}%` }}
        />
      )}

      {/* علامات الحقول */}
      {fields.map((f, i) => (
        <button
          key={`${f.key}-${i}`}
          type="button"
          onClick={(e) => {
            e.stopPropagation()
            onSelect(i)
          }}
          className={`absolute z-10 -translate-x-1/2 -translate-y-1/2 rounded border-2 px-1 text-center leading-tight transition-all ${
            selected === i
              ? 'border-(--club) bg-(--club)/15 text-(--club-dark) shadow-md'
              : 'border-dashed border-[#9a7a25]/70 bg-white/75 text-neutral-700 hover:bg-white'
          }`}
          style={{
            left: `${f.x}%`,
            top: `${f.y}%`,
            width: `${f.w}%`,
            fontSize: fieldFontSizeCqw(f.size),
            fontWeight: f.bold ? 800 : 500,
          }}
          title={`${fieldLabel(f)} — انقر لتحديد الحقل`}
        >
          <span className="block whitespace-nowrap">{fieldLabel(f)}</span>
        </button>
      ))}
    </div>
  )
}

/**
 * ورقة الوثيقة المُصدرة — الترويسة الموحدة (شعار يمين + اسم النادي وسط + موسم/تواصل يسار
 * + فاصل ذهبي/فضي) ثم القالب مع القيم موضوعة فوق إحداثياتها، وتذييل التوقيع والختم.
 * قابلة للطباعة مباشرة عبر صنف doc-print-area (يُطبع الورقة وحدها).
 */
function IssuedPaper({
  template,
  fields,
  values,
  refNumber,
  title,
  note,
  branchName,
  season,
  phone,
  address,
  issueDate,
  paperSize = 'A4-portrait',
}: {
  template: { fileType: string; fileData?: string; category?: string }
  fields: TemplateField[]
  values: string[]
  refNumber: string
  title: string
  note?: string
  branchName?: string
  season?: string
  phone?: string
  address?: string
  issueDate: string
  /** حجم الورقة حسب الاختيار — A4 افتراضياً */
  paperSize?: PaperSize
}) {
  return (
    <div
      dir="rtl"
      className={`doc-paper doc-print-area mx-auto w-full ${
        isA5(paperSize)
          ? 'max-w-[560px]'
          : paperSize === 'A4-landscape'
            ? 'max-w-[1010px]'
            : 'max-w-[760px]'
      } ${paperHalfClass(paperSize)} px-[4.5%] py-[3.5%]`}
      style={{ ['--doc-accent' as string]: '#9a7a25', containerType: 'inline-size' }}
    >
      {/* مقاس واتجاه صفحة الطباعة الفعلي — 4 خيارات */}
      <PrintPageSize size={paperSize} />
      <div className="doc-paper-frame" />

      <div className="relative">
        {/* الترويسة الموحدة */}
        <header className="flex items-start justify-between gap-[2%]">
          <img
            src="/images/logo.png"
            alt="شعار النادي"
            className="h-[11cqw] w-auto shrink-0 object-contain"
          />
          <div className="flex-1 text-center leading-tight">
            <div className="text-[3.3cqw] font-black text-neutral-900">
              النادي الرياضي المتعدد الرياضات
            </div>
            <div className="text-[2.7cqw] font-black text-neutral-800">الرائد — بلدية سعيدة</div>
            {branchName ? (
              <div className="mt-[0.5cqw] text-[2cqw] font-bold text-neutral-600">
                نيابة: فرع {branchName}
              </div>
            ) : null}
          </div>
          <div className="shrink-0 text-left text-[1.9cqw] font-bold leading-relaxed text-neutral-700">
            {season ? <div>الموسم: {season}</div> : null}
            {phone ? (
              <div dir="ltr" className="text-right">
                {phone}
              </div>
            ) : null}
            {address ? <div className="max-w-[24cqw] text-right">{address}</div> : null}
          </div>
        </header>

        {/* فاصل ذهبي/فضي */}
        <div
          className="mt-[1.4%] h-[0.55cqw] rounded-full"
          style={{ background: 'linear-gradient(to left, #c9a227, #8a97ab 50%, #c9a227)' }}
        />

        {/* الرقم والعنوان */}
        <div className="mt-[2%] flex items-center justify-between text-[2cqw] font-bold text-neutral-600">
          <span>
            الرقم:{' '}
            <span className="font-mono" dir="ltr">
              {refNumber || '—'}
            </span>
          </span>
          <span>{template.category || issueDate}</span>
        </div>
        <h3 className="mt-[1%] text-center text-[3.5cqw] font-black text-neutral-900 underline decoration-1 underline-offset-[0.8cqw]">
          {title}
        </h3>
        {note ? (
          <p className="mt-[1%] text-center text-[2.2cqw] font-bold text-neutral-600">{note}</p>
        ) : null}

        {/* القالب مع القيم المعبأة فوق إحداثياتها */}
        <div
          className="relative mt-[2.5%] w-full overflow-hidden rounded-sm bg-white"
          style={{ aspectRatio: '210 / 297' }}
        >
          {template.fileType === 'image' && template.fileData ? (
            <img
              src={template.fileData}
              alt="نموذج الوثيقة"
              className="absolute inset-0 h-full w-full object-contain"
            />
          ) : template.fileData ? (
            <object
              data={template.fileData}
              type="application/pdf"
              className="absolute inset-0 h-full w-full"
              aria-label="نموذج الوثيقة PDF"
            />
          ) : (
            <div className="absolute inset-0 flex items-center justify-center text-muted-foreground">
              <FileText className="h-16 w-16 opacity-30" />
            </div>
          )}
          {fields.map((f, i) => {
            const v = displayFieldValue(values[i] ?? '')
            if (!v) return null
            return (
              <div
                key={`${f.key}-${i}`}
                className="absolute -translate-x-1/2 -translate-y-1/2"
                style={{ left: `${f.x}%`, top: `${f.y}%`, width: `${f.w}%` }}
              >
                <span
                  className="block whitespace-nowrap text-center text-neutral-900"
                  style={{ fontSize: fieldFontSizeCqw(f.size), fontWeight: f.bold ? 800 : 600 }}
                >
                  {v}
                </span>
              </div>
            )
          })}
        </div>

        {/* التذييل: الختم والتوقيع وتاريخ الإصدار */}
        <footer className="mt-[3%] flex items-end justify-between px-[1%] pb-[1%]">
          <div className="doc-stamp flex h-[13cqw] w-[13cqw] flex-col items-center justify-center text-center font-black leading-relaxed text-[1.55cqw]">
            <Star className="h-[2.6cqw] w-[2.6cqw] fill-current" />
            <span>الجمهورية الجزائرية</span>
            <span>الإدارة العامة</span>
          </div>
          <div className="text-center">
            <div className="text-[2cqw] font-bold text-neutral-500">الإدارة العامة — التوقيع والختم</div>
            <div className="mx-auto mt-[2cqw] w-[26cqw] border-t border-dashed border-neutral-400" />
            <div className="mt-[1cqw] text-[1.9cqw] font-bold text-neutral-600">
              حرر بسعيدة في {issueDate}
            </div>
          </div>
        </footer>
      </div>
    </div>
  )
}

// ============================================================
//  المكوّن الرئيسي — مكتب النادي
// ============================================================

export function RecordsManager({ data, reload }: { data: AdminData; reload: () => void }) {
  const { toast } = useToast()
  const [tab, setTab] = useState<'templates' | 'issue' | 'archive'>('templates')

  const documents = data.documents ?? []
  const members = data.members ?? []
  const branches = data.branches ?? []
  const templates = data.templates ?? []
  const settings = data.settings

  const season = settings?.design?.season || ''
  const contactPhone = settings?.contact?.phone || ''
  const contactAddress = settings?.contact?.address || ''
  const issuedCount = useMemo(() => documents.filter((d) => d.type === 'issued').length, [documents])
  const activeTemplates = useMemo(
    () => templates.filter((t) => t.kind === 'template' && t.active),
    [templates],
  )

  const nextRef = useMemo(() => {
    const year = new Date().getFullYear()
    return `CRS/${year}/${String(documents.length + 1).padStart(3, '0')}`
  }, [documents.length])

  // ====== حالة تبويب النماذج: الاستيراد ======
  const [importOpen, setImportOpen] = useState(false)
  const [importSaving, setImportSaving] = useState(false)
  const [importForm, setImportForm] = useState({
    name: '',
    category: '__none',
    freeCategory: '',
    kind: 'template',
  })
  const [importFile, setImportFile] = useState<{
    name: string
    type: 'image' | 'pdf'
    dataUrl: string
    bytes: number
  } | null>(null)

  // ====== حالة مصمم الحقول ======
  const [designerOpen, setDesignerOpen] = useState(false)
  const [designerLoading, setDesignerLoading] = useState(false)
  const [designerSaving, setDesignerSaving] = useState(false)
  const [designer, setDesigner] = useState<{
    id: string
    name: string
    fileType: string
    fileData: string
    fields: TemplateField[]
    selected: number
  } | null>(null)

  // ====== حالة تبويب الإصدار ======
  const [issueTplId, setIssueTplId] = useState('')
  const [issueTpl, setIssueTpl] = useState<DocumentTemplateItem | null>(null)
  const [issueLoading, setIssueLoading] = useState(false)
  const [issueValues, setIssueValues] = useState<string[]>([])
  const [issueMeta, setIssueMeta] = useState({
    refNumber: '',
    title: '',
    note: '',
    branchId: '',
    visibleToBranch: false,
  })
  const [issueSaving, setIssueSaving] = useState(false)
  // حجم ورقة الإصدار حسب الاختيار — A4 أو A5
  const [issueSize, setIssueSize] = useState<PaperSize>('A4-portrait')

  // ====== حالة تبويب الأرشيف (كما كانت + الوثائق المُصدرة) ======
  const [query, setQuery] = useState('')
  const [typeFilter, setTypeFilter] = useState<string>('all')
  const [branchFilter, setBranchFilter] = useState<string>('all')
  const [open, setOpen] = useState(false)
  const [editing, setEditing] = useState<ClubDocumentItem | null>(null)
  const [saving, setSaving] = useState(false)
  const [viewDoc, setViewDoc] = useState<ClubDocumentItem | null>(null)
  // حجم ورقة العرض/الطباعة في نافذة الأرشيف — يتذكّر اختيار الوثيقة
  const [viewSize, setViewSize] = useState<PaperSize>('A4-portrait')
  const [formTab, setFormTab] = useState<'data' | 'design'>('data')
  const [form, setForm] = useState({ ...DEFAULT_FORM })
  const [design, setDesign] = useState<DocumentDesign>({ ...DEFAULT_DESIGN })
  const [deleteDoc, setDeleteDoc] = useState<ClubDocumentItem | null>(null)
  const [deleteTpl, setDeleteTpl] = useState<DocumentTemplateItem | null>(null)

  // ====== عرض/تنزيل مرجع ======
  const [viewRef, setViewRef] = useState<DocumentTemplateItem | null>(null)

  // ============================================================
  //  الأرشيف — منطق قديم كما هو
  // ============================================================

  const filtered = useMemo(() => {
    return documents.filter((d) => {
      if (typeFilter !== 'all' && d.type !== typeFilter) return false
      if (branchFilter === 'general' && d.branchId) return false
      if (branchFilter !== 'all' && branchFilter !== 'general' && d.branchId !== branchFilter)
        return false
      if (query) {
        const q = query.trim()
        if (
          !d.title.includes(q) &&
          !(d.refNumber || '').toLowerCase().includes(q.toLowerCase()) &&
          !d.category.includes(q)
        )
          return false
      }
      return true
    })
  }, [documents, typeFilter, branchFilter, query])

  const typeCounts = useMemo(() => {
    const c: Record<string, number> = { all: documents.length }
    for (const d of documents) c[d.type] = (c[d.type] ?? 0) + 1
    return c
  }, [documents])

  const availableMembers = useMemo(() => {
    if (form.branchId) return members.filter((m) => m.branchId === form.branchId)
    return members
  }, [members, form.branchId])

  const openCreate = () => {
    setEditing(null)
    setForm({ ...DEFAULT_FORM, refNumber: nextRef })
    setDesign({ ...DEFAULT_DESIGN })
    setFormTab('data')
    setOpen(true)
  }

  const openEdit = (doc: ClubDocumentItem) => {
    setEditing(doc)
    setForm({
      refNumber: doc.refNumber,
      title: doc.title,
      type: doc.type,
      category: doc.category,
      content: doc.content,
      branchId: doc.branchId ?? '',
      memberId: doc.memberId ?? '',
      visibleToBranch: doc.visibleToBranch,
      design: doc.design,
    })
    setDesign(parseDesign(doc.design))
    setFormTab('data')
    setOpen(true)
  }

  const save = async () => {
    setSaving(true)
    try {
      const res = await apiFetch('/api/admin/documents', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: editing ? 'update' : 'create',
          id: editing?.id,
          data: {
            refNumber: form.refNumber,
            title: form.title,
            type: form.type,
            category: form.category,
            content: form.content,
            branchId: form.branchId || null,
            memberId: form.memberId || null,
            visibleToBranch: form.visibleToBranch,
            design: JSON.stringify(design),
          },
        }),
      })
      const d = await res.json()
      if (!res.ok) throw new Error(d?.error || 'فشل الحفظ')
      toast({ title: editing ? 'تم تحديث الوثيقة في الأرشيف' : 'تم تسجيل الوثيقة في الأرشيف' })
      setOpen(false)
      reload()
    } catch (e) {
      toast({ title: e instanceof Error ? e.message : 'فشل الحفظ', variant: 'destructive' })
    } finally {
      setSaving(false)
    }
  }

  const toggleVisible = async (doc: ClubDocumentItem) => {
    try {
      const res = await apiFetch('/api/admin/documents', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: doc.visibleToBranch ? 'hide' : 'show',
          id: doc.id,
        }),
      })
      const d = await res.json()
      if (!res.ok) throw new Error(d?.error || 'فشل تنفيذ الأمر')
      toast({
        title: doc.visibleToBranch
          ? `تم إخفاء «${doc.title}» من حساب الفرع`
          : `تم ${doc.branchId ? 'إرسال' : 'عرض'} «${doc.title}» في حساب الفرع`,
      })
      reload()
    } catch (e) {
      toast({ title: e instanceof Error ? e.message : 'فشل التنفيذ', variant: 'destructive' })
    }
  }

  const removeDoc = async (doc: ClubDocumentItem) => {
    try {
      const res = await apiFetch('/api/admin/documents', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'delete', id: doc.id }),
      })
      const d = await res.json()
      if (!res.ok) throw new Error(d?.error || 'فشل الحذف')
      toast({ title: 'تم حذف الوثيقة' })
      setDeleteDoc(null)
      reload()
    } catch (e) {
      toast({ title: e instanceof Error ? e.message : 'فشل الحذف', variant: 'destructive' })
    }
  }

  // ============================================================
  //  النماذج والمراجع — استيراد وتعديل وحذف
  // ============================================================

  const openImport = () => {
    setImportForm({ name: '', category: '__none', freeCategory: '', kind: 'template' })
    setImportFile(null)
    setImportOpen(true)
  }

  const handleImportFile = (file: File) => {
    const okTypes = ['image/png', 'image/jpeg', 'image/webp', 'application/pdf']
    if (!okTypes.includes(file.type)) {
      toast({
        title: 'صيغة الملف غير مدعومة — المقبول: صورة PNG/JPG/WebP أو ملف PDF',
        variant: 'destructive',
      })
      return
    }
    if (file.size > 8 * 1024 * 1024) {
      toast({ title: 'حجم الملف كبير جداً — الحد الأقصى 8 ميغابايت', variant: 'destructive' })
      return
    }
    const reader = new FileReader()
    reader.onload = () => {
      setImportFile({
        name: file.name,
        type: file.type.startsWith('image/') ? 'image' : 'pdf',
        dataUrl: String(reader.result),
        bytes: file.size,
      })
    }
    reader.readAsDataURL(file)
  }

  const submitImport = async () => {
    if (!importFile) return
    setImportSaving(true)
    try {
      const res = await apiFetch('/api/admin/templates', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: importForm.name.trim(),
          kind: importForm.kind,
          category:
            importForm.category === '__free' ? importForm.freeCategory.trim() : importForm.category,
          fileType: importFile.type,
          fileData: importFile.dataUrl,
          fields: [],
        }),
      })
      const d = await res.json()
      if (!res.ok) throw new Error(d?.error || 'فشل استيراد النموذج')
      toast({ title: 'تم استيراد النموذج إلى المكتبة — حدِّد حقوله القابلة للتعبئة' })
      setImportOpen(false)
      reload()
      if (d?.item?.id) void openDesigner(d.item.id as string)
    } catch (e) {
      toast({ title: e instanceof Error ? e.message : 'فشل الاستيراد', variant: 'destructive' })
    } finally {
      setImportSaving(false)
    }
  }

  const openDesigner = async (id: string) => {
    setDesigner(null)
    setDesignerLoading(true)
    setDesignerOpen(true)
    try {
      const res = await apiFetch(`/api/admin/templates?id=${id}`)
      const d = await res.json()
      if (!res.ok) throw new Error(d?.error || 'فشل تحميل النموذج')
      const tpl = d.template as DocumentTemplateItem
      setDesigner({
        id: tpl.id,
        name: tpl.name,
        fileType: tpl.fileType,
        fileData: tpl.fileData ?? '',
        fields: normalizeFields(tpl.fields),
        selected: -1,
      })
    } catch (e) {
      toast({ title: e instanceof Error ? e.message : 'فشل تحميل النموذج', variant: 'destructive' })
      setDesignerOpen(false)
    } finally {
      setDesignerLoading(false)
    }
  }

  const addDesignerField = (x: number, y: number) => {
    setDesigner((d) => {
      if (!d) return d
      if (d.fields.length >= 40) {
        toast({ title: 'لا يمكن تجاوز 40 حقلاً في نموذج واحد', variant: 'destructive' })
        return d
      }
      return {
        ...d,
        selected: d.fields.length,
        fields: [
          ...d.fields,
          { key: 'fullName', label: FIELD_KEY_LABELS.fullName, x, y, w: 24, size: 12, bold: false },
        ],
      }
    })
  }

  const updateDesignerField = (i: number, patch: Partial<TemplateField>) => {
    setDesigner((d) =>
      d ? { ...d, fields: d.fields.map((f, idx) => (idx === i ? { ...f, ...patch } : f)) } : d,
    )
  }

  const removeDesignerField = (i: number) => {
    setDesigner((d) =>
      d
        ? {
            ...d,
            selected: -1,
            fields: d.fields.filter((_, idx) => idx !== i),
          }
        : d,
    )
  }

  const saveDesignerFields = async () => {
    if (!designer) return
    setDesignerSaving(true)
    try {
      const res = await apiFetch('/api/admin/templates', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id: designer.id, data: { fields: designer.fields } }),
      })
      const d = await res.json()
      if (!res.ok) throw new Error(d?.error || 'فشل حفظ الحقول')
      toast({ title: 'تم حفظ حقول النموذج في المكتبة' })
      setDesignerOpen(false)
      setDesigner(null)
      reload()
    } catch (e) {
      toast({ title: e instanceof Error ? e.message : 'فشل حفظ الحقول', variant: 'destructive' })
    } finally {
      setDesignerSaving(false)
    }
  }

  const toggleTemplateActive = async (t: DocumentTemplateItem) => {
    try {
      const res = await apiFetch('/api/admin/templates', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id: t.id, data: { active: !t.active } }),
      })
      const d = await res.json()
      if (!res.ok) throw new Error(d?.error || 'فشل تنفيذ الأمر')
      toast({ title: t.active ? `تم تعطيل «${t.name}»` : `تم تفعيل «${t.name}»` })
      reload()
    } catch (e) {
      toast({ title: e instanceof Error ? e.message : 'فشل التنفيذ', variant: 'destructive' })
    }
  }

  const removeTemplate = async (t: DocumentTemplateItem) => {
    try {
      const res = await apiFetch('/api/admin/templates', {
        method: 'DELETE',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id: t.id }),
      })
      const d = await res.json()
      if (!res.ok) throw new Error(d?.error || 'فشل الحذف')
      toast({ title: 'تم حذف النموذج من المكتبة' })
      setDeleteTpl(null)
      thumbCache.delete(t.id)
      reload()
    } catch (e) {
      toast({ title: e instanceof Error ? e.message : 'فشل الحذف', variant: 'destructive' })
    }
  }

  const openViewRef = async (t: DocumentTemplateItem) => {
    setViewRef(t)
    try {
      const res = await apiFetch(`/api/admin/templates?id=${t.id}`)
      const d = await res.json()
      if (!res.ok) throw new Error(d?.error || 'فشل تحميل الملف')
      setViewRef(d.template as DocumentTemplateItem)
    } catch (e) {
      toast({ title: e instanceof Error ? e.message : 'فشل تحميل الملف', variant: 'destructive' })
      setViewRef(null)
    }
  }

  // ============================================================
  //  إصدار وثيقة
  // ============================================================

  const selectIssueTemplate = async (id: string) => {
    setIssueTplId(id)
    setIssueTpl(null)
    if (!id) return
    setIssueLoading(true)
    try {
      const res = await apiFetch(`/api/admin/templates?id=${id}`)
      const d = await res.json()
      if (!res.ok) throw new Error(d?.error || 'فشل تحميل النموذج')
      const tpl = d.template as DocumentTemplateItem
      const fields = normalizeFields(tpl.fields)
      setIssueTpl({ ...tpl, fields })
      setIssueValues(fields.map((f) => (f.key === 'date' ? todayDMY() : '')))
      setIssueMeta({
        refNumber: nextRef,
        title: tpl.name,
        note: '',
        branchId: '',
        visibleToBranch: false,
      })
    } catch (e) {
      toast({ title: e instanceof Error ? e.message : 'فشل تحميل النموذج', variant: 'destructive' })
      setIssueTplId('')
    } finally {
      setIssueLoading(false)
    }
  }

  const issueSummary = (): string => {
    if (!issueTpl) return ''
    const parts = issueTpl.fields.map(
      (f, i) => `${fieldLabel(f)}: ${displayFieldValue(issueValues[i] ?? '') || '—'}`,
    )
    if (issueMeta.note.trim()) parts.push(`ملاحظة: ${issueMeta.note.trim()}`)
    return parts.length
      ? parts.join(' — ')
      : `وثيقة مُصدرة إلكترونياً من نموذج «${issueTpl.name}»`
  }

  const saveIssued = async () => {
    if (!issueTpl) return
    if (issueMeta.title.trim().length < 3) {
      toast({ title: 'عنوان الوثيقة مطلوب (3 أحرف على الأقل)', variant: 'destructive' })
      return
    }
    setIssueSaving(true)
    try {
      const res = await apiFetch('/api/admin/documents', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'create',
          data: {
            refNumber: issueMeta.refNumber,
            title: issueMeta.title.trim(),
            type: 'issued',
            category: issueTpl.category,
            content: issueSummary(),
            templateId: issueTpl.id,
            issuedValues: JSON.stringify({
              note: issueMeta.note,
              fields: issueTpl.fields.map((f, i) => ({
                key: f.key,
                label: fieldLabel(f),
                value: issueValues[i] ?? '',
              })),
            }),
            branchId: issueMeta.branchId || null,
            visibleToBranch: issueMeta.visibleToBranch,
          },
        }),
      })
      const d = await res.json()
      if (!res.ok) throw new Error(d?.error || 'فشل حفظ الوثيقة')
      toast({ title: 'تم إصدار الوثيقة وحفظها في الأرشيف' })
      reload()
      setTab('archive')
    } catch (e) {
      toast({ title: e instanceof Error ? e.message : 'فشل الحفظ', variant: 'destructive' })
    } finally {
      setIssueSaving(false)
    }
  }

  /** إعادة فتح وثيقة مُصدرة: جلب القالب بملفه وإعادة تعبئة القيم للتعديل والطباعة */
  const reopenIssued = async (doc: ClubDocumentItem) => {
    if (!doc.templateId) {
      toast({ title: 'لا يوجد نموذج مرتبط بهذه الوثيقة', variant: 'destructive' })
      return
    }
    setIssueLoading(true)
    try {
      const res = await apiFetch(`/api/admin/templates?id=${doc.templateId}`)
      const d = await res.json()
      if (!res.ok || !d?.template) throw new Error('النموذج الأصلي غير موجود (قد يكون محذوفاً)')
      const tpl = d.template as DocumentTemplateItem
      const fields = normalizeFields(tpl.fields)
      const restored = fields.map(() => '')
      let note = ''
      try {
        const parsed = JSON.parse(doc.issuedValues || '{}') as {
          note?: string
          fields?: Array<{ key: string; value?: string }>
        }
        note = parsed.note ?? ''
        const saved = Array.isArray(parsed.fields) ? parsed.fields : []
        if (saved.length === fields.length) {
          saved.forEach((pf, i) => {
            restored[i] = pf.value ?? ''
          })
        } else {
          saved.forEach((pf) => {
            const i = fields.findIndex((f) => f.key === pf.key)
            if (i >= 0 && !restored[i]) restored[i] = pf.value ?? ''
          })
        }
      } catch {
        // قيم قديمة أو تالفة — نبدأ من فراغ
      }
      setIssueTplId(tpl.id)
      setIssueTpl({ ...tpl, fields })
      setIssueValues(restored)
      setIssueMeta({
        refNumber: doc.refNumber,
        title: doc.title,
        note,
        branchId: doc.branchId ?? '',
        visibleToBranch: doc.visibleToBranch,
      })
      setTab('issue')
      toast({ title: 'أُعيد فتح الوثيقة للتعديل — عدِّل القيم ثم احفظ أو اطبع من جديد' })
    } catch (e) {
      toast({ title: e instanceof Error ? e.message : 'فشل إعادة الفتح', variant: 'destructive' })
    } finally {
      setIssueLoading(false)
    }
  }

  // ============================================================
  //  الواجهة
  // ============================================================

  return (
    <div>
      {/* رأس القسم */}
      <header className="rounded-3xl club-gradient relative mb-5 overflow-hidden p-5 md:p-6">
        <div className="absolute -left-8 -bottom-8 h-36 w-36 rounded-full bg-(--silver)/10" />
        <div className="flex items-center gap-3">
          <Library className="h-8 w-8 text-(--silver)" />
          <div>
            <h2 className="text-xl font-black text-white md:text-2xl">مكتب النادي</h2>
            <p className="mt-1 max-w-3xl text-sm leading-relaxed text-white/70">
              هنا تُصدر كل أوراق النادي ونماذجه وملفاته الإدارية بترويسة موحدة — استورد نماذجك الورقية
              وسمِّها، حدِّد حقول التعبئة، ثم املأ التاريخ والاسم واللقب لتخرج الوثيقة جاهزة للطباعة
              والأرشفة، مع أمر الإدارة بالإظهار في حسابات الفروع.
            </p>
          </div>
        </div>
        <div className="mt-4 flex flex-wrap gap-2">
          <Badge className="bg-(--silver) text-(--club-dark)">{templates.length} نموذج ومرجع</Badge>
          <Badge variant="outline" className="border-white/30 text-white/85">
            {documents.length} وثيقة مؤرشفة
          </Badge>
          <Badge variant="outline" className="border-white/30 text-white/85">
            {issuedCount} وثيقة مُصدرة
          </Badge>
        </div>
      </header>

      {/* تبويبات مكتب النادي */}
      <nav
        aria-label="أقسام مكتب النادي"
        className="mb-4 flex flex-wrap gap-2 rounded-2xl border border-(--border) bg-white p-2"
      >
        <TabBtn
          active={tab === 'templates'}
          onClick={() => setTab('templates')}
          icon={Library}
          label="النماذج والمراجع"
          count={templates.length}
        />
        <TabBtn
          active={tab === 'issue'}
          onClick={() => setTab('issue')}
          icon={FilePlus2}
          label="إصدار وثيقة"
          count={activeTemplates.length}
        />
        <TabBtn
          active={tab === 'archive'}
          onClick={() => setTab('archive')}
          icon={Archive}
          label="أرشيف الوثائق"
          count={documents.length}
        />
      </nav>

      {/* ====================================================== */}
      {/* تبويب 1: النماذج والمراجع (مكتبة القوالب) */}
      {/* ====================================================== */}
      {tab === 'templates' && (
        <section aria-label="مكتبة النماذج والمراجع">
          <div className="mb-4 flex flex-col gap-3 rounded-2xl border border-(--border) bg-white p-4 md:flex-row md:items-center">
            <div className="flex-1">
              <div className="text-sm font-black text-(--club-dark)">مكتبة النماذج والمراجع</div>
              <p className="mt-0.5 text-xs text-muted-foreground">
                استورد نماذج النادي الورقية (صورة ممسوحة أو PDF)، سمِّها وحدِّد حقولها القابلة للتعبئة
                لتصدر منها وثائق جاهزة بترويسة موحدة — أو اجعلها مرجعاً للقراءة والتنزيل.
              </p>
            </div>
            <Button
              onClick={openImport}
              className="shrink-0 bg-(--club) font-bold text-white hover:bg-(--club)/90"
            >
              <Upload className="ml-1 h-4 w-4" />
              استيراد نموذج
            </Button>
          </div>

          {/* النماذج النظامية والإدارية الجاهزة (10 نماذج + ترويسة قابلة للتخصيص) */}
          <AdminPaperLibrarySection
            enrollments={data.enrollments}
            branches={data.branches}
            requestCount={documents.filter((x) => x.category === 'طلبات الملاعب').length}
            onSaved={reload}
          />

          {templates.length === 0 ? (
            <div className="rounded-2xl border border-(--border) bg-white p-10 text-center text-muted-foreground">
              <Library className="mx-auto mb-3 h-10 w-10 opacity-40" />
              المكتبة فارغة — استورد أول نموذج أو مرجع للنادي
            </div>
          ) : (
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-3">
              {templates.map((t) => (
                <article
                  key={t.id}
                  className={`flex gap-4 rounded-2xl border border-(--border) bg-white p-4 ${
                    t.active ? '' : 'opacity-70'
                  }`}
                >
                  <TemplateThumb template={t} className="aspect-[210/297] w-24 shrink-0" />
                  <div className="flex min-w-0 flex-1 flex-col">
                    <div className="flex flex-wrap items-center gap-1.5">
                      <span className="text-sm font-black text-(--club-dark)">{t.name}</span>
                      <Badge
                        className={
                          t.kind === 'template'
                            ? 'bg-(--club)/10 text-(--club)'
                            : 'bg-muted text-muted-foreground'
                        }
                      >
                        {KIND_LABELS[t.kind] ?? t.kind}
                      </Badge>
                      {!t.active && (
                        <Badge className="bg-red-500/10 text-red-700">معطَّل</Badge>
                      )}
                    </div>
                    <div className="mt-1 flex flex-wrap items-center gap-1.5">
                      {t.category && (
                        <Badge variant="outline" className="text-[10px]">
                          {t.category}
                        </Badge>
                      )}
                      <Badge variant="outline" className="text-[10px]">
                        {t.fileType === 'pdf' ? 'PDF' : 'صورة'}
                      </Badge>
                      <span className="text-[11px] text-muted-foreground">
                        {(Array.isArray(t.fields) ? t.fields.length : 0)} حقل تعبئة
                      </span>
                    </div>
                    <div className="mt-auto flex flex-wrap items-center gap-1.5 pt-3">
                      {t.kind === 'template' && (
                        <>
                          <Button
                            size="sm"
                            onClick={() => {
                              setIssueTplId(t.id)
                              void selectIssueTemplate(t.id)
                              setTab('issue')
                            }}
                            disabled={!t.active}
                            title={t.active ? 'إصدار وثيقة من هذا النموذج' : 'النموذج معطَّل'}
                            className="bg-(--club) font-bold text-white hover:bg-(--club)/90"
                          >
                            <FilePlus2 className="ml-1 h-4 w-4" />
                            إصدار وثيقة
                          </Button>
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => void openDesigner(t.id)}
                            title="تعديل حقول التعبئة"
                          >
                            <Pencil className="h-4 w-4" />
                            الحقول
                          </Button>
                        </>
                      )}
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => void openViewRef(t)}
                        title="عرض / تنزيل الملف"
                      >
                        <Eye className="h-4 w-4" />
                        عرض
                      </Button>
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => void toggleTemplateActive(t)}
                        title={t.active ? 'تعطيل النموذج' : 'تفعيل النموذج'}
                      >
                        <Power className="h-4 w-4" />
                        {t.active ? 'تعطيل' : 'تفعيل'}
                      </Button>
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => setDeleteTpl(t)}
                        className="text-destructive hover:text-destructive"
                        title="حذف النموذج"
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>
                </article>
              ))}
            </div>
          )}
        </section>
      )}

      {/* ====================================================== */}
      {/* تبويب 2: إصدار وثيقة */}
      {/* ====================================================== */}
      {tab === 'issue' && (
        <section aria-label="إصدار وثيقة من نموذج جاهز">
          {activeTemplates.length === 0 ? (
            <div className="rounded-2xl border border-(--border) bg-white p-10 text-center">
              <FilePlus2 className="mx-auto mb-3 h-10 w-10 text-muted-foreground opacity-40" />
              <p className="font-bold text-(--club-dark)">لا توجد نماذج نشطة قابلة للإصدار بعد</p>
              <p className="mt-1 text-sm text-muted-foreground">
                استورد نموذجاً من تبويب «النماذج والمراجع» وفعِّله لتصدر منه وثائقك.
              </p>
              <Button
                className="mt-4 bg-(--club) font-bold text-white hover:bg-(--club)/90"
                onClick={() => setTab('templates')}
              >
                <Library className="ml-1 h-4 w-4" />
                الذهاب إلى المكتبة
              </Button>
            </div>
          ) : (
            <>
              {/* بيانات الإصدار */}
              <div className="mb-4 space-y-4 rounded-2xl border border-(--border) bg-white p-4">
                <div className="grid grid-cols-1 gap-3 md:grid-cols-3">
                  <div className="space-y-1.5">
                    <Label>النموذج *</Label>
                    <Select value={issueTplId} onValueChange={(v) => void selectIssueTemplate(v)}>
                      <SelectTrigger>
                        <SelectValue placeholder="اختر نموذجاً نشطاً" />
                      </SelectTrigger>
                      <SelectContent>
                        {activeTemplates.map((t) => (
                          <SelectItem key={t.id} value={t.id}>
                            {t.name}
                            {t.category ? ` — ${t.category}` : ''}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-1.5">
                    <Label>رقم المرجع</Label>
                    <Input
                      dir="ltr"
                      className="text-left font-mono"
                      value={issueMeta.refNumber}
                      onChange={(e) => setIssueMeta({ ...issueMeta, refNumber: e.target.value })}
                      placeholder="CRS/2026/001"
                    />
                  </div>
                  <div className="space-y-1.5">
                    <Label>عنوان الوثيقة *</Label>
                    <Input
                      value={issueMeta.title}
                      onChange={(e) => setIssueMeta({ ...issueMeta, title: e.target.value })}
                      placeholder="مثال: استدعاء لاعب للمعسكر التدريبي"
                    />
                  </div>
                </div>

                {/* الحقول الديناميكية من القالب */}
                {issueLoading ? (
                  <div className="flex items-center justify-center gap-2 py-4 text-sm text-muted-foreground">
                    <Loader2 className="h-4 w-4 animate-spin" />
                    جارٍ تحميل النموذج...
                  </div>
                ) : issueTpl ? (
                  issueTpl.fields.length === 0 ? (
                    <p className="rounded-xl border border-(--border) bg-muted/40 p-3 text-xs text-muted-foreground">
                      هذا النموذج بلا حقول تعبئة — أضف حقولاً من مصمم الحقول ليظهر النص فوق الورقة عند
                      إحداثياتها.
                    </p>
                  ) : (
                    <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3">
                      {issueTpl.fields.map((f, i) => (
                        <div key={`${f.key}-${i}`} className="space-y-1.5">
                          <Label className="text-xs">{fieldLabel(f)}</Label>
                          <Input
                            type={f.key === 'birthDate' ? 'date' : 'text'}
                            value={issueValues[i] ?? ''}
                            onChange={(e) =>
                              setIssueValues(issueValues.map((v, idx) => (idx === i ? e.target.value : v)))
                            }
                            placeholder={
                              f.key === 'date'
                                ? 'يوم/شهر/سنة'
                                : f.key === 'phone'
                                  ? '0X XX XX XX XX'
                                  : f.key === 'position'
                                    ? 'مثال: لاعب — مدافع'
                                    : ''
                            }
                          />
                        </div>
                      ))}
                    </div>
                  )
                ) : (
                  <p className="rounded-xl border border-(--border) bg-muted/40 p-3 text-xs text-muted-foreground">
                    اختر النموذج أولاً — ستظهر هنا حقول تعبئته تلقائياً (التاريخ يُملأ باليوم
                    الحالي).
                  </p>
                )}

                {/* ملاحظة + إظهار لحساب الفرع */}
                {issueTpl && !issueLoading && (
                  <div className="grid grid-cols-1 gap-3 md:grid-cols-2">
                    <div className="space-y-1.5">
                      <Label>ملاحظة تظهر على الورقة (اختياري)</Label>
                      <Input
                        value={issueMeta.note}
                        onChange={(e) => setIssueMeta({ ...issueMeta, note: e.target.value })}
                        placeholder="مثال: يرجى الحضور يوم الأحد على الساعة التاسعة صباحاً"
                      />
                    </div>
                    <div className="flex items-center justify-between gap-3 rounded-xl border border-(--border) bg-muted/40 p-3">
                      <div className="min-w-0 flex-1">
                        <div className="text-sm font-bold text-(--club-dark)">إظهار في حساب الفرع</div>
                        {issueMeta.visibleToBranch && (
                          <Select
                            value={issueMeta.branchId || '__general'}
                            onValueChange={(v) =>
                              setIssueMeta({ ...issueMeta, branchId: v === '__general' ? '' : v })
                            }
                          >
                            <SelectTrigger className="mt-2 h-8 text-xs">
                              <SelectValue placeholder="اختر الفرع" />
                            </SelectTrigger>
                            <SelectContent>
                              <SelectItem value="__general">عامة لجميع الفروع</SelectItem>
                              {branches.map((b) => (
                                <SelectItem key={b.id} value={b.id}>
                                  {b.name}
                                </SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                        )}
                      </div>
                      <Switch
                        checked={issueMeta.visibleToBranch}
                        onCheckedChange={(v) => setIssueMeta({ ...issueMeta, visibleToBranch: v })}
                      />
                    </div>
                  </div>
                )}
              </div>

              {/* المعاينة الحية */}
              <div className="rounded-2xl border border-(--border) bg-white p-4">
                <div className="mb-3 flex flex-wrap items-center justify-between gap-2">
                  <div className="flex items-center gap-1.5 text-xs font-black text-(--club-dark)">
                    <Eye className="h-3.5 w-3.5" />
                    معاينة حية — كما ستُطبع بترويسة النادي الموحدة
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="text-[11px] font-bold text-muted-foreground">حجم الورقة:</span>
                    <PaperSizeSelector value={issueSize} onChange={setIssueSize} />
                  </div>
                </div>
                {issueTpl && !issueLoading ? (
                  <>
                    <div className="nice-scroll max-h-[720px] overflow-y-auto rounded-xl bg-muted/50 p-3">
                      <IssuedPaper
                        template={issueTpl}
                        fields={issueTpl.fields}
                        values={issueValues}
                        refNumber={issueMeta.refNumber}
                        title={issueMeta.title || 'عنوان الوثيقة'}
                        note={issueMeta.note}
                        branchName={branches.find((b) => b.id === issueMeta.branchId)?.name}
                        season={season}
                        phone={contactPhone}
                        address={contactAddress}
                        issueDate={todayDMY()}
                        paperSize={issueSize}
                      />
                    </div>
                    <div className="mt-3 flex flex-wrap justify-end gap-2">
                      <Button
                        variant="outline"
                        onClick={() => window.print()}
                        title="إظهار نافذة الطباعة — تُطبع الورقة وحدها"
                      >
                        <Printer className="ml-1 h-4 w-4" />
                        طباعة / PDF
                      </Button>
                      <Button
                        onClick={saveIssued}
                        disabled={issueSaving}
                        className="bg-(--club) font-bold text-white hover:bg-(--club)/90"
                      >
                        {issueSaving ? (
                          <Loader2 className="ml-1 h-4 w-4 animate-spin" />
                        ) : (
                          <Archive className="ml-1 h-4 w-4" />
                        )}
                        حفظ في الأرشيف
                      </Button>
                    </div>
                  </>
                ) : (
                  <div className="py-16 text-center text-muted-foreground">
                    {issueLoading ? (
                      <>
                        <Loader2 className="mx-auto mb-2 h-6 w-6 animate-spin" />
                        جارٍ تحميل النموذج...
                      </>
                    ) : (
                      <>
                        <FileText className="mx-auto mb-2 h-10 w-10 opacity-40" />
                        اختر نموذجاً لعرض المعاينة الحية
                      </>
                    )}
                  </div>
                )}
              </div>
            </>
          )}
        </section>
      )}

      {/* ====================================================== */}
      {/* تبويب 3: أرشيف الوثائق */}
      {/* ====================================================== */}
      {tab === 'archive' && (
        <section aria-label="أرشيف وثائق مكتب النادي">
          {/* أدوات الفلترة */}
          <div className="mb-4 flex flex-col gap-3 rounded-2xl border border-(--border) bg-white p-4 md:flex-row md:items-center">
            <div className="relative flex-1">
              <Search className="absolute right-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
              <Input
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                placeholder="ابحث بعنوان الوثيقة أو رقم المرجع أو التصنيف..."
                className="pr-9"
              />
            </div>
            <Select value={typeFilter} onValueChange={setTypeFilter}>
              <SelectTrigger className="md:w-44">
                <SelectValue placeholder="كل الأنواع" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">كل الأنواع ({typeCounts.all ?? 0})</SelectItem>
                {(Object.keys(TYPE_LABELS) as ClubDocumentType[]).map((t) => (
                  <SelectItem key={t} value={t}>
                    {TYPE_LABELS[t]} ({typeCounts[t] ?? 0})
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            <Select value={branchFilter} onValueChange={setBranchFilter}>
              <SelectTrigger className="md:w-48">
                <SelectValue placeholder="كل الفروع" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">كل الفروع</SelectItem>
                <SelectItem value="general">عامة لجميع الفروع</SelectItem>
                {branches.map((b) => (
                  <SelectItem key={b.id} value={b.id}>
                    {b.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            <Button
              onClick={openCreate}
              className="shrink-0 bg-(--club) font-bold text-white hover:bg-(--club)/90"
            >
              <Plus className="ml-1 h-4 w-4" />
              وثيقة جديدة
            </Button>
          </div>

          {/* قائمة الوثائق */}
          <div className="overflow-hidden rounded-2xl border border-(--border) bg-white">
            {filtered.length === 0 ? (
              <div className="p-10 text-center text-muted-foreground">
                <Archive className="mx-auto mb-3 h-10 w-10 opacity-40" />
                لا توجد وثائق مطابقة — سجّل أول وثيقة في الأرشيف
              </div>
            ) : (
              <ul className="divide-y divide-(--border)">
                {filtered.map((doc) => {
                  const Icon = TYPE_ICONS[doc.type]
                  return (
                    <li
                      key={doc.id}
                      className="flex flex-col gap-3 p-4 transition-colors hover:bg-muted/40 md:flex-row md:items-center"
                    >
                      <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-(--club-light)">
                        <Icon className="h-5 w-5 text-(--club)" />
                      </div>
                      <div className="min-w-0 flex-1">
                        <div className="flex flex-wrap items-center gap-2">
                          <span className="text-sm font-black text-(--club-dark)">{doc.title}</span>
                          <Badge variant="outline" className="font-mono text-[10px]" dir="ltr">
                            {doc.refNumber || 'بلا رقم'}
                          </Badge>
                          <Badge className={`text-[10px] ${TYPE_BADGE[doc.type]}`}>
                            {TYPE_LABELS[doc.type]}
                          </Badge>
                          {doc.category && (
                            <Badge variant="outline" className="text-[10px]">
                              {doc.category}
                            </Badge>
                          )}
                        </div>
                        <div className="mt-1 flex flex-wrap items-center gap-x-3 gap-y-0.5 text-xs text-muted-foreground">
                          <span>{doc.branch ? `فرع ${doc.branch.name}` : 'عامة لجميع الفروع'}</span>
                          {doc.member && (
                            <span>
                              الإطار: {doc.member.firstName} {doc.member.lastName}
                            </span>
                          )}
                          <span>{formatDateDMY(doc.createdAt)}</span>
                        </div>
                      </div>
                      <div className="flex shrink-0 items-center gap-1.5">
                        {doc.visibleToBranch ? (
                          <Badge className="bg-(--flag-green)/15 text-[10px] text-(--flag-green)">
                            <Eye className="ml-1 h-3 w-3" /> معروضة في الفرع
                          </Badge>
                        ) : (
                          <Badge variant="outline" className="text-[10px] text-muted-foreground">
                            <EyeOff className="ml-1 h-3 w-3" /> مؤرشفة
                          </Badge>
                        )}
                        {doc.type === 'issued' && (
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => void reopenIssued(doc)}
                            title="إعادة فتح الإصدار — تعديل القيم والطباعة من جديد"
                          >
                            <RotateCcw className="h-4 w-4" />
                          </Button>
                        )}
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => {
                            setViewSize(docPaperSize(doc.design))
                            setViewDoc(doc)
                          }}
                          title="عرض الورقة"
                        >
                          <FileText className="h-4 w-4" />
                        </Button>
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => void toggleVisible(doc)}
                          title={doc.visibleToBranch ? 'إخفاء من حساب الفرع' : 'إظهار/إرسال إلى حساب الفرع'}
                        >
                          {doc.visibleToBranch ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                        </Button>
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => openEdit(doc)}
                          title="تعديل"
                          disabled={doc.type === 'issued'}
                        >
                          <Pencil className="h-4 w-4" />
                        </Button>
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => setDeleteDoc(doc)}
                          className="text-destructive hover:text-destructive"
                          title="حذف"
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                    </li>
                  )
                })}
              </ul>
            )}
          </div>
        </section>
      )}

      {/* ====================================================== */}
      {/* نافذة استيراد نموذج */}
      {/* ====================================================== */}
      <Dialog open={importOpen} onOpenChange={setImportOpen}>
        <DialogContent className="nice-scroll max-h-[92vh] overflow-y-auto sm:max-w-2xl">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Library className="h-5 w-5 text-(--club)" />
              استيراد نموذج أو مرجع إلى مكتب النادي
            </DialogTitle>
            <DialogDescription>
              ارفع نموذجاً ورقياً ممسوحاً (صورة) أو ملف PDF، سمِّه وحدِّد تصنيفه ونوعه — ثم افتح مصمم
              الحقول لتحديد مواضع التعبئة.
            </DialogDescription>
          </DialogHeader>

          <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
            <div className="space-y-1.5">
              <Label>اسم النموذج *</Label>
              <Input
                value={importForm.name}
                onChange={(e) => setImportForm({ ...importForm, name: e.target.value })}
                placeholder="مثال: كتاب استدعاء للاعب"
              />
            </div>
            <div className="space-y-1.5">
              <Label>التصنيف</Label>
              <Select
                value={importForm.category}
                onValueChange={(v) => setImportForm({ ...importForm, category: v })}
              >
                <SelectTrigger>
                  <SelectValue placeholder="اختر التصنيف" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="__none">بلا تصنيف</SelectItem>
                  {TEMPLATE_CATEGORIES.map((c) => (
                    <SelectItem key={c} value={c}>
                      {c}
                    </SelectItem>
                  ))}
                  <SelectItem value="__free">تصنيف آخر (حقل حر)...</SelectItem>
                </SelectContent>
              </Select>
            </div>
            {importForm.category === '__free' && (
              <div className="space-y-1.5 md:col-span-2">
                <Label>التصنيف الحر</Label>
                <Input
                  value={importForm.freeCategory}
                  onChange={(e) => setImportForm({ ...importForm, freeCategory: e.target.value })}
                  placeholder="اكتب التصنيف الذي يناسب نموذجك"
                />
              </div>
            )}
            <div className="space-y-1.5 md:col-span-2">
              <Label>نوع المستند *</Label>
              <Select
                value={importForm.kind}
                onValueChange={(v) => setImportForm({ ...importForm, kind: v })}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="template">نموذج قابل للإصدار (تُملأ حقوله وتُطبع)</SelectItem>
                  <SelectItem value="reference">مرجع للقراءة والتنزيل فقط</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2 md:col-span-2">
              <Label>ملف النموذج * (صورة PNG/JPG/WebP أو PDF — حتى 8 ميغابايت)</Label>
              <label className="flex cursor-pointer flex-col items-center justify-center gap-2 rounded-xl border-2 border-dashed border-(--club)/30 bg-muted/40 p-6 text-center transition-colors hover:bg-muted/70">
                <Upload className="h-6 w-6 text-(--club)" />
                <span className="text-sm font-bold text-(--club-dark)">
                  {importFile ? importFile.name : 'انقر لاختيار ملف من جهازك'}
                </span>
                <span className="text-xs text-muted-foreground">
                  {importFile
                    ? `${(importFile.bytes / 1024 / 1024).toFixed(2)} ميغابايت — انقر للاستبدال`
                    : 'PNG · JPG · WebP · PDF'}
                </span>
                <input
                  type="file"
                  accept=".png,.jpg,.jpeg,.webp,.pdf,image/png,image/jpeg,image/webp,application/pdf"
                  className="sr-only"
                  aria-label="اختيار ملف النموذج"
                  onChange={(e) => {
                    const f = e.target.files?.[0]
                    if (f) handleImportFile(f)
                    e.target.value = ''
                  }}
                />
              </label>

              {/* معاينة فورية */}
              {importFile && importFile.type === 'image' && (
                <div className="rounded-xl border border-(--border) bg-muted/30 p-3">
                  <div
                    className="mx-auto w-44 overflow-hidden rounded-lg border border-(--border) bg-white"
                    style={{ aspectRatio: '210 / 297' }}
                  >
                    <img
                      src={importFile.dataUrl}
                      alt="معاينة النموذج المستورد"
                      className="h-full w-full object-contain"
                    />
                  </div>
                  <p className="mt-2 text-center text-[11px] text-muted-foreground">
                    معاينة فورية — بعد الاستيراد انقر على النموذج في المصمم لإضافة حقول التعبئة
                  </p>
                </div>
              )}
              {importFile && importFile.type === 'pdf' && (
                <div className="flex items-center gap-3 rounded-xl border border-(--border) bg-muted/30 p-3">
                  <FileText className="h-8 w-8 text-(--club)" />
                  <div className="text-xs">
                    <div className="font-bold text-(--club-dark)">ملف PDF جاهز للاستيراد</div>
                    <div className="text-muted-foreground">
                      المعاينة المرئية وحقول التعبئة تعمل أفضل مع صور النماذج الممسوحة
                    </div>
                  </div>
                </div>
              )}
            </div>
          </div>

          <div className="flex items-center justify-end gap-2 border-t border-(--border) pt-2">
            <Button variant="outline" onClick={() => setImportOpen(false)} disabled={importSaving}>
              إلغاء
            </Button>
            <Button
              onClick={submitImport}
              disabled={importSaving || importForm.name.trim().length < 2 || !importFile}
              className="bg-(--club) font-bold text-white hover:bg-(--club)/90"
            >
              {importSaving ? (
                <Loader2 className="ml-1 h-4 w-4 animate-spin" />
              ) : (
                <Upload className="ml-1 h-4 w-4" />
              )}
              استيراد إلى المكتبة
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      {/* ====================================================== */}
      {/* نافذة مصمم الحقول */}
      {/* ====================================================== */}
      <Dialog
        open={designerOpen}
        onOpenChange={(v) => {
          setDesignerOpen(v)
          if (!v) setDesigner(null)
        }}
      >
        <DialogContent className="nice-scroll max-h-[92vh] overflow-y-auto sm:max-w-5xl">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Crosshair className="h-5 w-5 text-(--club)" />
              مصمم حقول النموذج{designer ? `: ${designer.name}` : ''}
            </DialogTitle>
            <DialogDescription>
              انقر على أي نقطة في النموذج لإضافة حقل تعبئة عند تلك الإحداثيات، ثم اضبط مفتاحه وتسميته
              وعرضه وحجم خطه من اللوحة الجانبية — للحذف أو تغيير الموضع: احذف الحقل وأضفه من جديد.
            </DialogDescription>
          </DialogHeader>

          {designerLoading || !designer ? (
            <div className="flex flex-col items-center justify-center gap-2 py-16 text-muted-foreground">
              <Loader2 className="h-6 w-6 animate-spin" />
              جارٍ تحميل النموذج...
            </div>
          ) : (
            <div className="grid grid-cols-1 gap-5 lg:grid-cols-[1fr_330px]">
              {/* الإطار الحي بنسبة A4 */}
              <div className="mx-auto w-full max-w-[520px]">
                <DesignerCanvas
                  fileType={designer.fileType}
                  fileData={designer.fileData}
                  fields={designer.fields}
                  selected={designer.selected}
                  onAdd={addDesignerField}
                  onSelect={(i) => setDesigner({ ...designer, selected: i })}
                />
                <p className="mt-2 flex items-center justify-center gap-1 text-center text-[11px] text-muted-foreground">
                  <Crosshair className="h-3 w-3" />
                  النقر يضيف حقلاً عند تلك النقطة (نسبة % من صفحة A4)
                </p>
              </div>

              {/* لوحة الحقول الجانبية */}
              <div className="space-y-3">
                {designer.fields.length === 0 ? (
                  <p className="rounded-xl border border-dashed border-(--border) bg-muted/40 p-4 text-center text-xs text-muted-foreground">
                    لا توجد حقول بعد — انقر على النموذج لإضافة أول حقل تعبئة
                  </p>
                ) : (
                  <div className="nice-scroll max-h-[46vh] space-y-3 overflow-y-auto pl-1">
                    {designer.fields.map((f, i) => (
                      <div
                        key={`${f.key}-${i}`}
                        className={`space-y-2.5 rounded-xl border p-3 ${
                          designer.selected === i
                            ? 'border-(--club) bg-(--club)/5'
                            : 'border-(--border)'
                        }`}
                      >
                        <div className="flex items-center justify-between gap-2">
                          <Badge variant="outline" className="font-mono text-[10px]">
                            حقل {i + 1}
                          </Badge>
                          <Button
                            size="sm"
                            variant="outline"
                            className="h-7 px-2 text-destructive hover:text-destructive"
                            onClick={() => removeDesignerField(i)}
                            title="حذف الحقل"
                          >
                            <Trash2 className="h-3.5 w-3.5" />
                          </Button>
                        </div>
                        <div className="space-y-1">
                          <Label className="text-xs">المفتاح</Label>
                          <Select
                            value={f.key}
                            onValueChange={(v) =>
                              updateDesignerField(i, { key: v, label: FIELD_KEY_LABELS[v] ?? f.label })
                            }
                          >
                            <SelectTrigger className="h-8 text-xs">
                              <SelectValue />
                            </SelectTrigger>
                            <SelectContent>
                              {FIELD_KEYS.map((k) => (
                                <SelectItem key={k.value} value={k.value}>
                                  {k.label} <span className="font-mono text-[10px]">({k.value})</span>
                                </SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                        </div>
                        <div className="space-y-1">
                          <Label className="text-xs">التسمية في نموذج الإصدار</Label>
                          <Input
                            className="h-8 text-xs"
                            value={f.label}
                            onChange={(e) => updateDesignerField(i, { label: e.target.value })}
                            placeholder={FIELD_KEY_LABELS[f.key] ?? 'تسمية الحقل'}
                          />
                        </div>
                        <div className="grid grid-cols-3 items-end gap-2">
                          <div className="space-y-1">
                            <Label className="text-xs">العرض %</Label>
                            <Input
                              type="number"
                              min={2}
                              max={100}
                              className="h-8 text-xs"
                              value={f.w}
                              onChange={(e) =>
                                updateDesignerField(i, {
                                  w: Math.min(100, Math.max(2, Number(e.target.value) || 24)),
                                })
                              }
                            />
                          </div>
                          <div className="space-y-1">
                            <Label className="text-xs">حجم الخط</Label>
                            <Input
                              type="number"
                              min={5}
                              max={48}
                              className="h-8 text-xs"
                              value={f.size}
                              onChange={(e) =>
                                updateDesignerField(i, {
                                  size: Math.min(48, Math.max(5, Number(e.target.value) || 12)),
                                })
                              }
                            />
                          </div>
                          <div className="flex flex-col items-center gap-1 pb-0.5">
                            <Label className="text-xs">{f.bold ? 'غليظ' : 'عادي'}</Label>
                            <Switch
                              checked={f.bold}
                              onCheckedChange={(v) => updateDesignerField(i, { bold: v })}
                            />
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
                <Separator />
                <Button
                  onClick={saveDesignerFields}
                  disabled={designerSaving}
                  className="w-full bg-(--club) font-bold text-white hover:bg-(--club)/90"
                >
                  {designerSaving ? (
                    <Loader2 className="ml-1 h-4 w-4 animate-spin" />
                  ) : (
                    <Pencil className="ml-1 h-4 w-4" />
                  )}
                  حفظ الحقول في النموذج
                </Button>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>

      {/* ====================================================== */}
      {/* نافذة عرض/تنزيل مرجع */}
      {/* ====================================================== */}
      <Dialog open={!!viewRef} onOpenChange={(v) => !v && setViewRef(null)}>
        <DialogContent className="nice-scroll max-h-[92vh] overflow-y-auto sm:max-w-3xl">
          <DialogHeader className="doc-print-hide">
            <DialogTitle>عرض المستند</DialogTitle>
            <DialogDescription>{viewRef?.name}</DialogDescription>
          </DialogHeader>
          {viewRef?.fileData ? (
            viewRef.fileType === 'image' ? (
              <img
                src={viewRef.fileData}
                alt={`المستند: ${viewRef.name}`}
                className="mx-auto max-h-[60vh] w-auto rounded-lg border border-(--border) bg-white object-contain"
              />
            ) : (
              <object
                data={viewRef.fileData}
                type="application/pdf"
                className="h-[60vh] w-full rounded-lg border border-(--border)"
                aria-label={`المستند: ${viewRef.name}`}
              />
            )
          ) : (
            <div className="flex flex-col items-center justify-center gap-2 py-12 text-muted-foreground">
              <Loader2 className="h-6 w-6 animate-spin" />
              جارٍ تحميل الملف...
            </div>
          )}
          <div className="doc-print-hide flex justify-end gap-2">
            <Button variant="outline" onClick={() => setViewRef(null)}>
              إغلاق
            </Button>
            {viewRef?.fileData && (
              <a
                href={viewRef.fileData}
                download={`${viewRef.name}.${viewRef.fileType === 'pdf' ? 'pdf' : 'png'}`}
              >
                <Button className="bg-(--club) font-bold text-white hover:bg-(--club)/90">
                  <Download className="ml-1 h-4 w-4" />
                  تنزيل
                </Button>
              </a>
            )}
          </div>
        </DialogContent>
      </Dialog>

      {/* ====================================================== */}
      {/* نافذة الإنشاء/التعديل مع مصمم الأوراق (الأرشيف) */}
      {/* ====================================================== */}
      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="nice-scroll max-h-[92vh] overflow-y-auto sm:max-w-4xl">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <BookOpen className="h-5 w-5 text-(--club)" />
              {editing ? 'تعديل وثيقة من الأرشيف' : 'تسجيل وثيقة جديدة في الأرشيف'}
            </DialogTitle>
            <DialogDescription>
              سجّل بيانات الوثيقة ثم صمّم ورقتها الرسمية (الترويسة، الختم، التوقيع) بمعاينة حية قبل
              الحفظ.
            </DialogDescription>
          </DialogHeader>

          {/* تبويبات */}
          <div className="flex gap-1.5">
            <button
              onClick={() => setFormTab('data')}
              className={`rounded-xl px-4 py-2 text-sm font-bold transition-all ${
                formTab === 'data'
                  ? 'bg-(--club) text-white shadow'
                  : 'bg-muted text-(--club-dark) hover:bg-muted/70'
              }`}
            >
              بيانات الوثيقة
            </button>
            <button
              onClick={() => setFormTab('design')}
              className={`flex items-center gap-1.5 rounded-xl px-4 py-2 text-sm font-bold transition-all ${
                formTab === 'design'
                  ? 'bg-(--club) text-white shadow'
                  : 'bg-muted text-(--club-dark) hover:bg-muted/70'
              }`}
            >
              <Palette className="h-4 w-4" />
              تصميم الورقة
            </button>
          </div>

          {formTab === 'data' ? (
            <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
              <div className="space-y-1.5">
                <Label>رقم المرجع</Label>
                <Input
                  value={form.refNumber}
                  onChange={(e) => setForm({ ...form, refNumber: e.target.value })}
                  placeholder="CRS/2025/001"
                  dir="ltr"
                  className="text-left font-mono"
                />
              </div>
              <div className="space-y-1.5">
                <Label>نوع الوثيقة *</Label>
                <Select
                  value={form.type}
                  onValueChange={(v) => setForm({ ...form, type: v as ClubDocumentType })}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {(Object.keys(TYPE_LABELS) as ClubDocumentType[]).map((t) => (
                      <SelectItem key={t} value={t}>
                        {TYPE_LABELS[t]}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-1.5 md:col-span-2">
                <Label>عنوان الوثيقة *</Label>
                <Input
                  value={form.title}
                  onChange={(e) => setForm({ ...form, title: e.target.value })}
                  placeholder="مثال: محضر تنصيب مكتب فرع كرة القدم"
                />
              </div>
              <div className="space-y-1.5">
                <Label>التصنيف</Label>
                <Select
                  value={form.category || '__none'}
                  onValueChange={(v) => setForm({ ...form, category: v === '__none' ? '' : v })}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="اختر التصنيف" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="__none">بلا تصنيف</SelectItem>
                    {OLD_CATEGORIES.map((c) => (
                      <SelectItem key={c} value={c}>
                        {c}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-1.5">
                <Label>الفرع المعني</Label>
                <Select
                  value={form.branchId || '__general'}
                  onValueChange={(v) =>
                    setForm({ ...form, branchId: v === '__general' ? '' : v, memberId: '' })
                  }
                >
                  <SelectTrigger>
                    <SelectValue placeholder="اختر الفرع" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="__general">عامة لجميع الفروع</SelectItem>
                    {branches.map((b) => (
                      <SelectItem key={b.id} value={b.id}>
                        {b.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-1.5 md:col-span-2">
                <Label>الإطار المعني بالوثيقة</Label>
                <Select
                  value={form.memberId || '__none'}
                  onValueChange={(v) => setForm({ ...form, memberId: v === '__none' ? '' : v })}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="اختر الإطار (اختياري)" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="__none">بلا إطار محدد</SelectItem>
                    {availableMembers.map((m) => (
                      <SelectItem key={m.id} value={m.id}>
                        {m.firstName} {m.lastName} — {m.position}
                        {m.branch ? ` (${m.branch.name})` : ''}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <p className="text-[11px] text-muted-foreground">
                  ملفات الإطارات تُوزَّع حسب التخصص والتعيين — وتظهر في حساب الفرع بأمر من الإدارة.
                </p>
              </div>
              <div className="space-y-1.5 md:col-span-2">
                <Label>نص الوثيقة *</Label>
                <Textarea
                  value={form.content}
                  onChange={(e) => setForm({ ...form, content: e.target.value })}
                  rows={7}
                  placeholder="اكتب نص الوثيقة... (يُحفظ تنسيق الأسطر كما هو)"
                />
              </div>
              <div className="flex items-center justify-between rounded-xl border border-(--border) bg-muted/40 p-3.5 md:col-span-2">
                <div>
                  <div className="text-sm font-bold text-(--club-dark)">إظهار في حساب الفرع</div>
                  <p className="mt-0.5 text-xs text-muted-foreground">
                    أمر الإدارة: تظهر هذه الوثيقة مباشرة في مكتب الفرع المعني (أو في كل الفروع إذا كانت
                    عامة).
                  </p>
                </div>
                <Switch
                  checked={form.visibleToBranch}
                  onCheckedChange={(v) => setForm({ ...form, visibleToBranch: v })}
                />
              </div>
            </div>
          ) : (
            /* مصمم الورقة مع المعاينة الحية */
            <div className="grid grid-cols-1 gap-5 lg:grid-cols-2">
              <div className="space-y-4">
                <div className="space-y-1.5">
                  <Label>نمط الورقة</Label>
                  <Select
                    value={design.style}
                    onValueChange={(v) =>
                      setDesign({ ...design, style: v as DocumentDesign['style'] })
                    }
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="official">رسمي (إداري)</SelectItem>
                      <SelectItem value="minimal">مبسّط</SelectItem>
                      <SelectItem value="ceremonial">احتفالي (شهادات وشكر)</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-1.5">
                  <Label>لون الإطار والختم</Label>
                  <Select
                    value={design.accent}
                    onValueChange={(v) =>
                      setDesign({ ...design, accent: v as DocumentDesign['accent'] })
                    }
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="navy">كحلي رسمي</SelectItem>
                      <SelectItem value="silver">فضي</SelectItem>
                      <SelectItem value="red">أحمر جزائري</SelectItem>
                      <SelectItem value="green">أخضر جزائري</SelectItem>
                      <SelectItem value="gold">ذهبي</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-1.5">
                  <Label>اسم الموقّع</Label>
                  <Input
                    value={design.signatureName}
                    onChange={(e) => setDesign({ ...design, signatureName: e.target.value })}
                    placeholder="رئيس النادي"
                  />
                </div>
                <div className="flex items-center justify-between gap-2">
                  <Label>مقاس الورقة واتجاهها (A4/A5 — طولي/عرضي)</Label>
                  <PaperSizeSelector
                    value={normalizePaperSize(design.paperSize)}
                    onChange={(s) => setDesign({ ...design, paperSize: s })}
                  />
                </div>
                <Separator />
                <div className="flex items-center justify-between">
                  <Label className="cursor-pointer">شعار النادي في الترويسة</Label>
                  <Switch
                    checked={design.showLogo}
                    onCheckedChange={(v) => setDesign({ ...design, showLogo: v })}
                  />
                </div>
                <div className="flex items-center justify-between">
                  <Label className="flex cursor-pointer items-center gap-1.5">
                    <Stamp className="h-4 w-4" /> الختم الرسمي
                  </Label>
                  <Switch
                    checked={design.showStamp}
                    onCheckedChange={(v) => setDesign({ ...design, showStamp: v })}
                  />
                </div>
                <div className="flex items-center justify-between">
                  <Label className="cursor-pointer">العلامة المائية (شعار خلفي)</Label>
                  <Switch
                    checked={design.showWatermark}
                    onCheckedChange={(v) => setDesign({ ...design, showWatermark: v })}
                  />
                </div>
              </div>
              {/* المعاينة الحية */}
              <div>
                <div className="mb-2 flex items-center gap-1.5 text-xs font-black text-(--club-dark)">
                  <Eye className="h-3.5 w-3.5" /> معاينة حية للورقة
                </div>
                <div className="nice-scroll max-h-[430px] overflow-y-auto rounded-xl bg-muted/50 p-3">
                  <DocumentPaper
                    compact
                    doc={{
                      refNumber: form.refNumber,
                      title: form.title || 'عنوان الوثيقة',
                      type: form.type,
                      category: form.category,
                      content: form.content || 'نص الوثيقة يظهر هنا كما سيُطبع...',
                      design: JSON.stringify(design),
                      createdAt: new Date().toISOString(),
                      member: availableMembers.find((m) => m.id === form.memberId)
                        ? {
                            id: form.memberId,
                            firstName: availableMembers.find((m) => m.id === form.memberId)!.firstName,
                            lastName: availableMembers.find((m) => m.id === form.memberId)!.lastName,
                            position: availableMembers.find((m) => m.id === form.memberId)!.position,
                          }
                        : null,
                      branch: branches.find((b) => b.id === form.branchId)
                        ? {
                            name: branches.find((b) => b.id === form.branchId)!.name,
                            slug: branches.find((b) => b.id === form.branchId)!.slug,
                            color: branches.find((b) => b.id === form.branchId)!.color,
                          }
                        : null,
                    }}
                  />
                </div>
              </div>
            </div>
          )}

          <div className="flex items-center justify-end gap-2 border-t border-(--border) pt-2">
            <Button variant="outline" onClick={() => setOpen(false)} disabled={saving}>
              إلغاء
            </Button>
            <Button
              onClick={save}
              disabled={saving}
              className="bg-(--club) font-bold text-white hover:bg-(--club)/90"
            >
              {saving ? (
                <Loader2 className="ml-1 h-4 w-4 animate-spin" />
              ) : (
                <BookOpen className="ml-1 h-4 w-4" />
              )}
              {editing ? 'حفظ التعديلات' : 'تسجيل في الأرشيف'}
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      {/* نافذة عرض الورقة (الأرشيف) */}
      <Dialog open={!!viewDoc} onOpenChange={(v) => !v && setViewDoc(null)}>
        <DialogContent className="nice-scroll max-h-[92vh] overflow-y-auto sm:max-w-3xl">
          <DialogHeader className="doc-print-hide">
            <DialogTitle>عرض الورقة الرسمية</DialogTitle>
            <DialogDescription>{viewDoc?.title}</DialogDescription>
          </DialogHeader>
          {viewDoc && (
            <>
              {/* محدد حجم الورقة A4/A5 — يطبَّق على المعاينة والطباعة معاً */}
              <div className="doc-print-hide flex items-center justify-between gap-2 pb-2">
                <span className="text-xs font-bold text-muted-foreground">حجم الورقة:</span>
                <PaperSizeSelector value={viewSize} onChange={setViewSize} />
              </div>
              {(() => {
                const sys = parseSystemDesign(viewDoc.design)
                if (sys) {
                  return <SystemPaperView form={sys.systemForm} params={sys.params} />
                }
                return <DocumentPaper doc={viewDoc} paperSize={viewSize} />
              })()}
              <div className="doc-print-hide flex justify-end gap-2">
                <Button variant="outline" onClick={() => setViewDoc(null)}>
                  إغلاق
                </Button>
                <Button
                  onClick={() => window.print()}
                  className="bg-(--club) font-bold text-white hover:bg-(--club)/90"
                >
                  <Printer className="ml-1 h-4 w-4" /> طباعة الورقة
                </Button>
              </div>
            </>
          )}
        </DialogContent>
      </Dialog>

      {/* تأكيد حذف وثيقة */}
      <AlertDialog open={!!deleteDoc} onOpenChange={(v) => !v && setDeleteDoc(null)}>
        <AlertDialogContent dir="rtl">
          <AlertDialogHeader>
            <AlertDialogTitle>حذف الوثيقة نهائياً؟</AlertDialogTitle>
            <AlertDialogDescription>
              سيُحذف «{deleteDoc?.title}» نهائياً من أرشيف مكتب النادي ولا يمكن استرجاعه.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>إلغاء</AlertDialogCancel>
            <AlertDialogAction
              className="bg-destructive text-white hover:bg-destructive/90"
              onClick={() => deleteDoc && void removeDoc(deleteDoc)}
            >
              نعم، احذف الوثيقة
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* تأكيد حذف نموذج */}
      <AlertDialog open={!!deleteTpl} onOpenChange={(v) => !v && setDeleteTpl(null)}>
        <AlertDialogContent dir="rtl">
          <AlertDialogHeader>
            <AlertDialogTitle>حذف النموذج نهائياً؟</AlertDialogTitle>
            <AlertDialogDescription>
              سيُحذف «{deleteTpl?.name}» مع ملفه وحقوله من مكتبة النماذج. الوثائق المُصدرة سابقاً تبقى
              في الأرشيف لكن إعادة فتحها للتعديل لن تعود ممكنة.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>إلغاء</AlertDialogCancel>
            <AlertDialogAction
              className="bg-destructive text-white hover:bg-destructive/90"
              onClick={() => deleteTpl && void removeTemplate(deleteTpl)}
            >
              نعم، احذف النموذج
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  )
}
