'use client'

/**
 * نظام النصوص المنسقة الموحد لنماذج مكتب النادي:
 *
 * — إعدادات التنسيق المطلوبة عند تعديل النماذج (تُطبَّق على كل نص/فقاعة):
 *     • المحاذاة: يمين / وسط / يسار / ضبط (Aligner / Justifier)
 *     • حجم الكتابة لكل نص (+/−)
 *     • عريض (Gras) ونقاط (Puces)
 *     • سطر جديد داخل نفس النص أو الحقل (Enter → سطر جديد يُطبع كما هو)
 *     • ترتيب النصوص يدوياً (أعلى / أسفل) وإضافة وحذف الفقرات
 *     • عنوان الوثيقة: نص قابل للتحرير + محاذاة وحجم وخط عريض
 *     • تحديد حجم الورقة A4 / A5 (يُطبَّق على المعاينة وعلى الطباعة @page)
 *
 * — التنسيق يُحفظ مع الوثيقة المؤرشفة (JSON في params) وتُعاد بناؤه عند العرض،
 *   والأوراق القديمة تُعرض بالإعدادات الافتراضية دون أي كسر.
 */

import {
  AlignCenter,
  AlignJustify,
  AlignLeft,
  AlignRight,
  Bold,
  ChevronDown,
  ChevronUp,
  List,
  Minus,
  Plus,
  Trash2,
  FileText,
  File,
} from 'lucide-react'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'

// ==================================================================
// الأنواع والقيم الافتراضية
// ==================================================================

export type TextAlign = 'right' | 'center' | 'left' | 'justify'
export type PaperSize = 'A4' | 'A5'

/** نص واحد منسق (عنوان وثيقة، سطر افتتاحي، موضوع…) */
export interface DocText {
  text: string
  align: TextAlign
  fontSize: number
  bold: boolean
}

/** فقاعة نصية قابلة للترتيب داخل المتن — مع خيار النقاط */
export interface DocBlock extends DocText {
  id: string
  bullets: boolean
}

export const ALIGN_OPTIONS: { key: TextAlign; label: string }[] = [
  { key: 'right', label: 'محاذاة لليمين (Aligner à droite)' },
  { key: 'center', label: 'توسيط (Centrer)' },
  { key: 'left', label: 'محاذاة لليسار (Aligner à gauche)' },
  { key: 'justify', label: 'ضبط الأسطر (Justifier)' },
]

export const MIN_FONT = 10
export const MAX_FONT = 26

let uidCounter = 0
export function blockId(): string {
  uidCounter += 1
  return `b${Date.now().toString(36)}${uidCounter.toString(36)}`
}

export function makeDocText(text = '', extra?: Partial<DocText>): DocText {
  return { text, align: 'center', fontSize: 15, bold: true, ...extra }
}

export function makeBlock(text = '', extra?: Partial<DocBlock>): DocBlock {
  return { id: blockId(), text, align: 'right', fontSize: 13.5, bold: false, bullets: false, ...extra }
}

// ==================================================================
// التسلسل (للأرشفة في params) والقراءة مع توافق خلفي كامل
// ==================================================================

export function docTextToJson(t: DocText): string {
  return JSON.stringify({ text: t.text, align: t.align, fontSize: t.fontSize, bold: t.bold })
}

export function docTextFromJson(s: string | undefined, fallback: DocText): DocText {
  if (!s) return fallback
  try {
    const p = JSON.parse(s) as Partial<DocText>
    if (typeof p !== 'object' || p === null) return fallback
    return {
      text: typeof p.text === 'string' ? p.text : fallback.text,
      align: p.align === 'right' || p.align === 'center' || p.align === 'left' || p.align === 'justify' ? p.align : fallback.align,
      fontSize: typeof p.fontSize === 'number' && p.fontSize >= MIN_FONT && p.fontSize <= MAX_FONT ? p.fontSize : fallback.fontSize,
      bold: typeof p.bold === 'boolean' ? p.bold : fallback.bold,
    }
  } catch {
    return fallback
  }
}

export function blocksToJson(blocks: DocBlock[]): string {
  return JSON.stringify(
    blocks.map((b) => ({ text: b.text, align: b.align, fontSize: b.fontSize, bold: b.bold, bullets: b.bullets }))
  )
}

/** يقرأ الفقرات من JSON — وإن لم توجد يعيد بناءها من النص العادي (أرشيف قديم) */
export function blocksFromJson(s: string | undefined, fallbackText = ''): DocBlock[] {
  if (s) {
    try {
      const arr = JSON.parse(s) as unknown
      if (Array.isArray(arr) && arr.length > 0) {
        return arr.map((raw) => {
          const p = (raw ?? {}) as Partial<DocBlock>
          return makeBlock(typeof p.text === 'string' ? p.text : '', {
            align: p.align === 'center' || p.align === 'left' || p.align === 'justify' ? p.align : p.align === 'right' ? 'right' : 'right',
            fontSize: typeof p.fontSize === 'number' ? Math.min(MAX_FONT, Math.max(MIN_FONT, p.fontSize)) : 13.5,
            bold: p.bold === true,
            bullets: p.bullets === true,
          })
        })
      }
    } catch {
      /* نص قديم */
    }
  }
  return [makeBlock(fallbackText)]
}

/** النص العادي للفقرات — للبحث والمحتوى في الأرشيف */
export function blocksToPlain(blocks: DocBlock[]): string {
  return blocks
    .map((b) => b.text)
    .join('\n')
    .trim()
}

/** حجم ورقة من معاملات مؤرشفة */
export function paperSizeFromParams(p: Record<string, string> | undefined): PaperSize {
  return p?.paperSize === 'A5' ? 'A5' : 'A4'
}

// ==================================================================
// عناصر العرض داخل الأوراق (المعاينة والطباعة)
// ==================================================================

/** عرض نص واحد منسق — مع نص بديل عند ترك الحقل فارغاً */
export function DocTextView({
  t,
  fallback,
  className = '',
  underline = false,
}: {
  t: DocText
  /** نص افتراضي عندما يُترك نص العنوان فارغاً (مثل العناوين الثابتة) */
  fallback?: string
  className?: string
  underline?: boolean
}) {
  return (
    <p
      className={`${underline ? 'underline decoration-2 underline-offset-8' : ''} ${className}`}
      style={{
        textAlign: t.align,
        fontSize: `${t.fontSize}px`,
        fontWeight: t.bold ? 900 : 600,
      }}
    >
      {t.text.trim() || fallback || '\u00A0'}
    </p>
  )
}

/** عرض فقرات المتن كما ستُطبع: محاذاة/حجم/عريض/نقاط/أسطر جديدة */
export function DocBlocksView({ blocks, className = '' }: { blocks: DocBlock[]; className?: string }) {
  return (
    <div className={className}>
      {blocks.map((b) =>
        b.bullets && b.text.trim() ? (
          <ul
            key={b.id}
            className="mb-2 list-disc space-y-1 pr-6 leading-[2] font-medium"
            style={{ textAlign: b.align, fontSize: `${b.fontSize}px`, fontWeight: b.bold ? 800 : 500 }}
          >
            {b.text
              .split('\n')
              .filter((l) => l.trim())
              .map((line, i) => (
                <li key={i}>{line}</li>
              ))}
          </ul>
        ) : (
          <p
            key={b.id}
            className="mb-2 whitespace-pre-wrap leading-[2.05] font-medium"
            style={{ textAlign: b.align, fontSize: `${b.fontSize}px`, fontWeight: b.bold ? 800 : 500 }}
          >
            {b.text}
          </p>
        )
      )}
    </div>
  )
}

// ==================================================================
// شريط التنسيق — Aligner / Justifier / الحجم / Gras / Puces / الترتيب
// ==================================================================

const TOOL_BTN = 'inline-flex h-7 w-7 items-center justify-center rounded-md border transition-colors'

function ToolButton({
  onClick,
  active = false,
  title,
  disabled = false,
  danger = false,
  children,
}: {
  onClick: () => void
  active?: boolean
  title: string
  disabled?: boolean
  danger?: boolean
  children: React.ReactNode
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      disabled={disabled}
      title={title}
      aria-label={title}
      className={`${TOOL_BTN} ${
        active
          ? 'border-(--club) bg-(--club) text-white'
          : danger
            ? 'border-transparent text-destructive hover:border-destructive/40 hover:bg-destructive/10'
            : 'border-(--border) bg-white text-neutral-600 hover:border-(--club)/50 hover:text-(--club)'
      } disabled:cursor-not-allowed disabled:opacity-40`}
    >
      {children}
    </button>
  )
}

/** شريط أدوات التنسيق الكامل — يُستخدم داخل محرر النصوص والفقرات */
export function DocTextToolbar({
  t,
  onChange,
  bullets,
  onBullets,
  onMoveUp,
  onMoveDown,
  onRemove,
  canMoveUp = true,
  canMoveDown = true,
}: {
  t: DocText
  onChange: (patch: Partial<DocText>) => void
  bullets?: boolean
  onBullets?: (v: boolean) => void
  onMoveUp?: () => void
  onMoveDown?: () => void
  onRemove?: () => void
  canMoveUp?: boolean
  canMoveDown?: boolean
}) {
  const step = (d: number) =>
    onChange({ fontSize: Math.min(MAX_FONT, Math.max(MIN_FONT, Math.round((t.fontSize + d) * 2) / 2)) })

  return (
    <div className="flex flex-wrap items-center gap-1.5">
      {/* المحاذاة */}
      <div className="flex items-center gap-0.5 rounded-lg border border-(--border) bg-muted/40 p-0.5">
        {ALIGN_OPTIONS.map(({ key, label }) => {
          const Icon = key === 'right' ? AlignRight : key === 'center' ? AlignCenter : key === 'left' ? AlignLeft : AlignJustify
          return (
            <ToolButton
              key={key}
              onClick={() => onChange({ align: key })}
              active={t.align === key}
              title={label}
            >
              <Icon className="h-3.5 w-3.5" />
            </ToolButton>
          )
        })}
      </div>

      {/* حجم الكتابة */}
      <div className="flex items-center gap-1 rounded-lg border border-(--border) bg-muted/40 px-1 py-0.5">
        <ToolButton onClick={() => step(-1)} title="تصغير الخط" disabled={t.fontSize <= MIN_FONT}>
          <Minus className="h-3.5 w-3.5" />
        </ToolButton>
        <span className="w-8 text-center text-[11px] font-black tabular-nums" dir="ltr">
          {t.fontSize}
        </span>
        <ToolButton onClick={() => step(1)} title="تكبير الخط" disabled={t.fontSize >= MAX_FONT}>
          <Plus className="h-3.5 w-3.5" />
        </ToolButton>
      </div>

      {/* عريض */}
      <ToolButton onClick={() => onChange({ bold: !t.bold })} active={t.bold} title="خط عريض (Gras)">
        <Bold className="h-3.5 w-3.5" />
      </ToolButton>

      {/* نقاط */}
      {onBullets && (
        <ToolButton onClick={() => onBullets(!bullets)} active={!!bullets} title="نقاط التعداد (Puces)">
          <List className="h-3.5 w-3.5" />
        </ToolButton>
      )}

      {/* الترتيب اليدوي */}
      {onMoveUp && (
        <ToolButton onClick={onMoveUp} disabled={!canMoveUp} title="نقل النص إلى الأعلى">
          <ChevronUp className="h-4 w-4" />
        </ToolButton>
      )}
      {onMoveDown && (
        <ToolButton onClick={onMoveDown} disabled={!canMoveDown} title="نقل النص إلى الأسفل">
          <ChevronDown className="h-4 w-4" />
        </ToolButton>
      )}

      {/* حذف */}
      {onRemove && (
        <ToolButton onClick={onRemove} title="حذف هذا النص" danger>
          <Trash2 className="h-3.5 w-3.5" />
        </ToolButton>
      )}
    </div>
  )
}

// ==================================================================
// محرر نص واحد (عنوان الوثيقة / الموضوع / السطر الافتتاحي…)
// — Enter يعطي سطراً جديداً في نفس الحقل
// ==================================================================

export function DocTextEditor({
  label,
  value,
  onChange,
  hint,
  fallbackHint,
  rows,
}: {
  label: string
  value: DocText
  onChange: (t: DocText) => void
  hint?: string
  /** يظهر عندما يكون النص فارغاً — قيمة العنوان الافتراضي */
  fallbackHint?: string
  rows?: number
}) {
  const lineCount = Math.max(1, value.text.split('\n').length)
  const autoRows = rows ?? Math.min(6, Math.max(2, lineCount))
  return (
    <div className="space-y-1.5 rounded-xl border border-(--border) bg-muted/20 p-2.5">
      <div className="flex items-center justify-between gap-2">
        <Label className="text-[11px] font-black">{label}</Label>
        <DocTextToolbar t={value} onChange={(patch) => onChange({ ...value, ...patch })} />
      </div>
      <Textarea
        value={value.text}
        onChange={(e) => onChange({ ...value, text: e.target.value })}
        rows={autoRows}
        placeholder={fallbackHint ? `${fallbackHint} — اتركه فارغاً لاستخدام العنوان الافتراضي` : 'اكتب النص… Enter لسطر جديد'}
        className="min-h-0 resize-y bg-white text-[13px] font-bold leading-relaxed"
      />
      {fallbackHint && !value.text.trim() && (
        <p className="text-[10px] text-muted-foreground">سيُطبع: {fallbackHint}</p>
      )}
    </div>
  )
}

// ==================================================================
// محرر فقرات المتن — ترتيب يدوي + إضافة + حذف + تنسيق لكل نص
// ==================================================================

export function DocBlocksEditor({
  label = 'نصوص الوثيقة',
  blocks,
  onChange,
  hint,
  addLabel = 'إضافة نص',
  minBlocks = 1,
}: {
  label?: string
  blocks: DocBlock[]
  onChange: (blocks: DocBlock[]) => void
  hint?: string
  addLabel?: string
  minBlocks?: number
}) {
  const update = (id: string, patch: Partial<DocBlock>) =>
    onChange(blocks.map((b) => (b.id === id ? { ...b, ...patch } : b)))
  const move = (i: number, dir: -1 | 1) => {
    const j = i + dir
    if (j < 0 || j >= blocks.length) return
    const next = [...blocks]
    ;[next[i], next[j]] = [next[j], next[i]]
    onChange(next)
  }
  const remove = (id: string) => {
    if (blocks.length <= minBlocks) return
    onChange(blocks.filter((b) => b.id !== id))
  }
  const add = () => onChange([...blocks, makeBlock('')])

  return (
    <div className="space-y-2">
      <div className="flex items-center justify-between gap-2">
        <Label className="text-[11px] font-black">{label}</Label>
        <span className="text-[9.5px] text-muted-foreground">{hint ?? 'Enter = سطر جديد داخل نفس النص'}</span>
      </div>

      {blocks.map((b, i) => (
        <div key={b.id} className="space-y-1.5 rounded-xl border border-(--border) bg-muted/20 p-2.5">
          <div className="flex items-center justify-between gap-2">
            <Badge number={i + 1} />
            <DocTextToolbar
              t={b}
              onChange={(patch) => update(b.id, patch)}
              bullets={b.bullets}
              onBullets={(v) => update(b.id, { bullets: v })}
              onMoveUp={() => move(i, -1)}
              onMoveDown={() => move(i, 1)}
              canMoveUp={i > 0}
              canMoveDown={i < blocks.length - 1}
              onRemove={blocks.length > minBlocks ? () => remove(b.id) : undefined}
            />
          </div>
          <Textarea
            value={b.text}
            onChange={(e) => update(b.id, { text: e.target.value })}
            rows={Math.min(8, Math.max(2, Math.max(1, b.text.split('\n').length)))}
            placeholder="اكتب النص… Enter لسطر جديد داخل نفس النص"
            className="min-h-0 resize-y bg-white text-[13px] leading-relaxed"
            style={{ textAlign: b.align, fontSize: `${Math.min(16, b.fontSize)}px`, fontWeight: b.bold ? 800 : 500 }}
          />
        </div>
      ))}

      <button
        type="button"
        onClick={add}
        className="inline-flex items-center gap-1.5 rounded-full border border-dashed border-(--border) bg-muted/30 px-3 py-1 text-[11px] font-bold text-muted-foreground transition-colors hover:border-(--club)/50 hover:text-(--club)"
      >
        <Plus className="h-3.5 w-3.5" />
        {addLabel}
      </button>
    </div>
  )
}

function Badge({ number }: { number: number }) {
  return (
    <span className="rounded-full border border-(--border) bg-white px-2 py-0.5 text-[9.5px] font-black text-muted-foreground">
      نص {number}
    </span>
  )
}

// ==================================================================
// حجم الورقة A4 / A5 — محدد + طباعة بحجم الصفحة الصحيح
// ==================================================================

/** محدد حجم الورقة — يظهر في شريط أدوات كل نموذج */
export function PaperSizeSelector({
  value,
  onChange,
}: {
  value: PaperSize
  onChange: (s: PaperSize) => void
}) {
  const opts: { key: PaperSize; label: string; Icon: typeof FileText }[] = [
    { key: 'A4', label: 'ورقة A4', Icon: FileText },
    { key: 'A5', label: 'ورقة A5', Icon: File },
  ]
  return (
    <div
      className="flex items-center gap-0.5 rounded-full border border-(--border) bg-muted/40 p-0.5"
      role="group"
      aria-label="تحديد حجم الورقة"
    >
      {opts.map(({ key, label, Icon }) => (
        <button
          key={key}
          type="button"
          onClick={() => onChange(key)}
          title={label}
          aria-pressed={value === key}
          className={`inline-flex h-7 items-center gap-1 rounded-full px-2.5 text-[11px] font-black transition-colors ${
            value === key ? 'bg-(--club) text-white' : 'text-neutral-600 hover:text-(--club)'
          }`}
        >
          <Icon className="h-3.5 w-3.5" />
          {key}
        </button>
      ))}
    </div>
  )
}

/**
 * حجم صفحة الطباعة — يُحقن داخل بوابة الطباعة ليخرج PDF/الورق بحجم A4 أو A5 فعلياً.
 */
export function PrintPageSize({ size }: { size: PaperSize }) {
  const css = size === 'A5' ? '@page { size: A5 portrait; margin: 9mm 7mm; }' : '@page { size: A4 portrait; margin: 10mm 9mm; }'
  return <style>{css}</style>
}

/** عرض الورقة في المعاينة بحسب الحجم */
export function paperWidthClass(size: PaperSize, wide = false): string {
  if (size === 'A5') return wide ? 'max-w-[520px]' : 'max-w-[480px]'
  return wide ? 'max-w-[730px]' : 'max-w-[680px]'
}
