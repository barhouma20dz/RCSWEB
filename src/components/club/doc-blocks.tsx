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
 *     • حجم الورقة واتجاهها — 4 خيارات: A4 طولي/عرضي، A5 طولي/عرضي (المعاينة والطباعة @page)
 *
 * — التنسيق يُحفظ مع الوثيقة المؤرشفة (JSON في params) وتُعاد بناؤه عند العرض،
 *   والأوراق القديمة تُعرض بالإعدادات الافتراضية دون أي كسر.
 */

import { useLayoutEffect, useRef, useState, type ReactNode } from 'react'
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
  RectangleVertical,
  RectangleHorizontal,
  Scissors,
} from 'lucide-react'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'

// ==================================================================
// الأنواع والقيم الافتراضية
// ==================================================================

export type TextAlign = 'right' | 'center' | 'left' | 'justify'

/** مقاس الورقة مع اتجاهها — أربعة خيارات: A4 طولي، A4 عرضي، A5 طولي، A5 عرضي */
export type PaperSize = 'A4-portrait' | 'A4-landscape' | 'A5-portrait' | 'A5-landscape'

/** الحجم الافتراضي — A4 طولي */
export const DEFAULT_PAPER_SIZE: PaperSize = 'A4-portrait'

/** هل الورقة من عائلة A5؟ */
export function isA5(s: PaperSize | undefined | null): boolean {
  return s === 'A5-portrait' || s === 'A5-landscape'
}

/** هل الورقة عرضية (Landscape)؟ */
export function isLandscape(s: PaperSize | undefined | null): boolean {
  return s === 'A4-landscape' || s === 'A5-landscape'
}

/**
 * تطبيع القيمة المحفوظة إلى أحد المقاسات الأربعة:
 * الأوراق القديمة كانت تحفظ 'A4' / 'A5' (طولي دائماً) — تُحوّل تلقائياً دون أي كسر.
 */
export function normalizePaperSize(v: unknown): PaperSize {
  switch (v) {
    case 'A4':
    case 'A4-portrait':
      return 'A4-portrait'
    case 'A4-landscape':
      return 'A4-landscape'
    case 'A5':
    case 'A5-portrait':
      return 'A5-portrait'
    case 'A5-landscape':
      return 'A5-landscape'
    default:
      return DEFAULT_PAPER_SIZE
  }
}

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

/** مقاس واتجاه ورقة من معاملات مؤرشفة (يتحمل القيم القديمة 'A4'/'A5') */
export function paperSizeFromParams(p: Record<string, string> | undefined): PaperSize {
  return normalizePaperSize(p?.paperSize)
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
// حجم الورقة واتجاهها — 4 خيارات (A4/A5 × طولي/عرضي) — محدد + طباعة بحجم الصفحة الصحيح
// ==================================================================

/** محدد مقاس الورقة واتجاهها — 4 خيارات: A4 طولي/عرضي، A5 طولي/عرضي */
export function PaperSizeSelector({
  value,
  onChange,
}: {
  value: PaperSize
  onChange: (s: PaperSize) => void
}) {
  const opts: { key: PaperSize; label: string; Icon: typeof FileText }[] = [
    { key: 'A4-portrait', label: 'ورقة A4 طولية', Icon: RectangleVertical },
    { key: 'A4-landscape', label: 'ورقة A4 عرضية', Icon: RectangleHorizontal },
    { key: 'A5-portrait', label: 'ورقة A5 طولية', Icon: File },
    { key: 'A5-landscape', label: 'ورقة A5 عرضية', Icon: RectangleHorizontal },
  ]
  return (
    <div
      className="flex items-center gap-0.5 rounded-full border border-(--border) bg-muted/40 p-0.5"
      role="group"
      aria-label="تحديد مقاس الورقة واتجاهها"
    >
      {opts.map(({ key, label, Icon }, i) => (
        <span key={key} className="flex items-center gap-0.5">
          {i === 2 && <span className="mx-0.5 h-4 w-px bg-(--border)" aria-hidden />}
          <button
            type="button"
            onClick={() => onChange(key)}
            title={label}
            aria-pressed={value === key}
            className={`inline-flex h-7 items-center gap-1 rounded-full px-2 text-[11px] font-black transition-colors ${
              value === key ? 'bg-(--club) text-white' : 'text-neutral-600 hover:text-(--club)'
            }`}
          >
            {key === 'A5-portrait' ? <File className="h-3.5 w-3.5" /> : <Icon className="h-3.5 w-3.5" />}
            {key === 'A4-portrait' && 'A4 طولي'}
            {key === 'A4-landscape' && 'A4 عرضي'}
            {key === 'A5-portrait' && 'A5 طولي'}
            {key === 'A5-landscape' && 'A5 عرضي'}
          </button>
        </span>
      ))}
    </div>
  )
}



/**
 * صنف ورقة الطباعة — يُضاف إلى عنصر الورقة ويحدد وضع الطباعة الكامل:
 * ورقة كاملة A4 طولية/عرضية، أو نصف ورقة (أوضاع توفير الورق) — انظر PrintPageSize
 */
export function paperHalfClass(size: PaperSize): string {
  switch (size) {
    case 'A5-portrait':
      return 'doc-sheet-a5-portrait'
    case 'A5-landscape':
      return 'doc-sheet-a5-landscape'
    case 'A4-landscape':
      return 'doc-sheet-a4-landscape'
    default:
      return 'doc-sheet-a4-portrait'
  }
}

// ==================================================================
// محرك الطباعة الدقيق — أوراق ثابتة بالمليمتر + ملاءمة تلقائية صفحة واحدة
// ==================================================================

/** التحويل مم ← بكسل (مقياس CSS المعتمد للطباعة 96dpi) */
export const MM_PX = 96 / 25.4

/**
 * منطقة المحتوى المتاحة داخل الورقة لكل مقاس (مم): [العرض، الارتفاع]
 * = أبعاد الورقة الفعلية ناقص الحشوة الداخلية الآمنة للطابعات
 */
export const PRINT_CONTENT_AREA: Record<PaperSize, [number, number]> = {
  'A4-portrait': [194, 283],    // 210−2×8 ، 297−2×7
  'A4-landscape': [279, 196],   // 297−2×9 ، 210−2×7
  'A5-landscape': [194, 138.5], // النصف العلوي من A4 طولية: 210−2×8 ، 148.5−2×5
  'A5-portrait': [136.5, 200],  // الجهة اليمنى من A4 عرضية: 148.5−2×6 ، 210−2×5
}

/** الحشوة الداخلية للورقة المطبوعة لكل مقاس (مم) */
export const PRINT_SHEET_PADDING: Record<PaperSize, string> = {
  'A4-portrait': '7mm 8mm',
  'A4-landscape': '7mm 9mm',
  'A5-landscape': '5mm 8mm',
  'A5-portrait': '5mm 6mm',
}

/** مجموع الحشوة الرأسية لكل مقاس (مم) — علوي + سفلي */
export const PRINT_SHEET_PAD_TOTAL: Record<PaperSize, number> = {
  'A4-portrait': 14,
  'A4-landscape': 14,
  'A5-landscape': 10,
  'A5-portrait': 10,
}

/**
 * تجهيز الطباعة: يقيس ارتفاع المحتوى الطبيعي بنفس عرض الطباعة الفعلي
 * ويضبط معامل التصغير ليملأ الورقة المختارة في صفحة واحدة دائماً —
 * تصغير ضوئي موحّد (كالنسخ على الآلة المصغّرة) يحافظ على التناسب عبر transform: scale
 * (محرك طباعة Chrome يتجاهل zoom لذا يعتمد التحويل مع ارتفاع صريح للورقة).
 */
export function preparePrintFit(size: PaperSize): void {
  const host = document.querySelector('.doc-only-print') as HTMLElement | null
  if (!host) return
  const paper = host.querySelector('.doc-paper') as HTMLElement | null
  if (!paper) return
  const fitEl = paper.querySelector('.doc-print-fit') as HTMLElement | null
  if (!fitEl) {
    paper.style.setProperty('--doc-fit-scale', '1')
    return
  }
  const [, hmm] = PRINT_CONTENT_AREA[size]
  const wmm = PRINT_CONTENT_AREA[size][0]
  const prevHost = host.getAttribute('style') ?? ''
  const prevPaper = paper.getAttribute('style') ?? ''
  const prevFit = fitEl.getAttribute('style') ?? ''
  let scale = 1
  let naturalH = 0
  try {
    // اعرض البوابة مؤقتاً خارج الشاشة بنفس تخطيط الطباعة بالضبط للقياس
    host.style.cssText =
      'display:block!important;position:fixed!important;left:-30000px!important;top:0!important;margin:0!important;visibility:hidden!important;pointer-events:none!important;'
    paper.style.cssText = `position:absolute!important;top:0!important;right:0!important;margin:0!important;width:${wmm}mm!important;max-width:none!important;min-height:0!important;height:auto!important;padding:${PRINT_SHEET_PADDING[size]}!important;`
    fitEl.style.minHeight = '0'
    fitEl.style.transform = 'none'
    naturalH = fitEl.offsetHeight
    const availH = hmm * MM_PX
    // هامش أمان 0.5% يمنع فيض بكسلات التقريب إلى صفحة ثانية
    scale = naturalH > 0 ? Math.min(1, (availH * 0.995) / naturalH) : 1
  } finally {
    if (prevHost) host.setAttribute('style', prevHost)
    else host.removeAttribute('style')
    if (prevPaper) paper.setAttribute('style', prevPaper)
    else paper.removeAttribute('style')
    if (prevFit) fitEl.setAttribute('style', prevFit)
    else fitEl.removeAttribute('style')
  }
  // نضبط القيم بعد الاستعادة حتى لا تمسحها إعادة الأنماط الأصلية
  paper.style.setProperty('--doc-fit-scale', scale < 0.999 ? scale.toFixed(4) : '1')
  // ارتفاع الورقة الكلي بالمليمتر: المحتوى مصغّراً (أو الحد الأدنى لمنطقة المحتوى) + الحشوة الرأسية
  const minHmm = PRINT_CONTENT_AREA[size][1]
  const sheetHmm = Math.max((naturalH * scale) / MM_PX, minHmm) + PRINT_SHEET_PAD_TOTAL[size]
  paper.style.setProperty('--doc-sheet-h', `${(sheetHmm * MM_PX).toFixed(1)}px`)
}

/**
 * مقاس واتجاه صفحة الطباعة — محرك دقيق بأوضاع توفير الورق المطلوبة رسمياً:
 *
 * — A4 طولي: ورقة A4 طولية كاملة (210×297مم)
 * — A4 عرضي: ورقة A4 عرضية كاملة (297×210مم)
 * — A5 عرضي: يُطبع في النصف العلوي من ورقة A4 طولية — الاستمارة ملتصقة ببداية
 *   الورقة (أعلى-يمين RTL) والنصف السفلي فارغ تماماً ليُقص ويُستعمل مرة أخرى
 * — A5 طولي: يُطبع في الجهة اليمنى من ورقة A4 عرضية — ملتصقاً بالحافة اليمنى
 *   والجهة الأخرى تبقى فارغة صالحة للاستعمال
 *
 * — @page { margin: 0 } والتحكم الكامل داخل الورقة بالمليمتر
 * — print-color-adjust: exact للحفاظ على الألوان والحدود والخلفيات
 * — منع كسر الصفحة: الاستمارة صفحة واحدة دائماً (ملاءمة تلقائية zoom-fit)
 */
export function PrintPageSize({ size }: { size: PaperSize }) {
  const page: Record<PaperSize, string> = {
    'A4-portrait': 'A4 portrait',
    'A4-landscape': 'A4 landscape',
    // A5 عرضي = النصف العلوي من ورقة A4 طولية
    'A5-landscape': 'A4 portrait',
    // A5 طولي = الجهة اليمنى من ورقة A4 عرضية
    'A5-portrait': 'A4 landscape',
  }
  const css = `@page { size: ${page[size] ?? page['A4-portrait']}; margin: 0; }
@media print {
  *, *::before, *::after {
    print-color-adjust: exact !important;
    -webkit-print-color-adjust: exact !important;
  }
  .doc-paper {
    break-inside: avoid !important;
    page-break-inside: avoid !important;
    box-shadow: none !important;
    border-radius: 0 !important;
  }
  /* الأوراق المتدفقة (العقد متعددة الصفحات) تبقى قابلة للامتداد عبر صفحات */
  .doc-paper.doc-paper-flow {
    break-inside: auto !important;
    page-break-inside: auto !important;
    overflow: visible !important;
    height: auto !important;
  }
  /* الملاءمة التلقائية: تصغير ضوئي موحّد ليملأ الورقة في صفحة واحدة دائماً
     (transform: scale — محرك الطباعة يتجاهل zoom) */
  .doc-paper:not(.doc-paper-flow) > .doc-print-fit {
    transform: scale(var(--doc-fit-scale, 1)) !important;
    transform-origin: top right !important;
  }
  /* ===== ورقة كاملة A4 طولية ===== */
  .doc-paper.doc-sheet-a4-portrait:not(.doc-paper-flow),
  .doc-only-print .doc-paper.doc-sheet-a4-portrait:not(.doc-paper-flow) {
    width: 210mm !important;
    max-width: 210mm !important;
    min-height: 296.8mm !important;
    padding: ${PRINT_SHEET_PADDING['A4-portrait']} !important;
    height: var(--doc-sheet-h, auto) !important;
    overflow: hidden !important;
    top: 0 !important;
    right: 0 !important;
    left: auto !important;
    margin: 0 !important;
  }
  .doc-paper.doc-sheet-a4-portrait:not(.doc-paper-flow) > .doc-print-fit {
    min-height: 283mm !important;
  }
  /* ===== ورقة كاملة A4 عرضية ===== */
  .doc-paper.doc-sheet-a4-landscape:not(.doc-paper-flow),
  .doc-only-print .doc-paper.doc-sheet-a4-landscape:not(.doc-paper-flow) {
    width: 297mm !important;
    max-width: 297mm !important;
    min-height: 209.8mm !important;
    padding: ${PRINT_SHEET_PADDING['A4-landscape']} !important;
    height: var(--doc-sheet-h, auto) !important;
    overflow: hidden !important;
    top: 0 !important;
    right: 0 !important;
    left: auto !important;
    margin: 0 !important;
  }
  .doc-paper.doc-sheet-a4-landscape:not(.doc-paper-flow) > .doc-print-fit {
    min-height: 196mm !important;
  }
  /* ===== A5 عرضي = النصف العلوي من ورقة A4 طولية — النصف السفلي فارغ تماماً ===== */
  .doc-paper.doc-sheet-a5-landscape:not(.doc-paper-flow),
  .doc-only-print .doc-paper.doc-sheet-a5-landscape:not(.doc-paper-flow) {
    width: 210mm !important;
    max-width: 210mm !important;
    min-height: 148.3mm !important;
    padding: ${PRINT_SHEET_PADDING['A5-landscape']} !important;
    height: var(--doc-sheet-h, auto) !important;
    overflow: hidden !important;
    top: 0 !important;
    right: 0 !important;
    left: auto !important;
    margin: 0 !important;
  }
  .doc-paper.doc-sheet-a5-landscape:not(.doc-paper-flow) > .doc-print-fit {
    min-height: 138.5mm !important;
  }
  /* ===== A5 طولي = الجهة اليمنى من ورقة A4 عرضية — الجهة الأخرى فارغة ===== */
  .doc-paper.doc-sheet-a5-portrait:not(.doc-paper-flow),
  .doc-only-print .doc-paper.doc-sheet-a5-portrait:not(.doc-paper-flow) {
    width: 148.5mm !important;
    max-width: 148.5mm !important;
    min-height: 209.8mm !important;
    padding: ${PRINT_SHEET_PADDING['A5-portrait']} !important;
    height: var(--doc-sheet-h, auto) !important;
    overflow: hidden !important;
    top: 0 !important;
    right: 0 !important;
    left: auto !important;
    margin: 0 !important;
  }
  .doc-paper.doc-sheet-a5-portrait:not(.doc-paper-flow) > .doc-print-fit {
    min-height: 200mm !important;
  }
}`
  return <style>{css}</style>
}

// ==================================================================
// معاينة طباعة حقيقية — ورقة كاملة كما ستُطبع بالضبط (شاشة فقط)
// ==================================================================

/**
 * معاينة الطباعة الحقيقية: تعرض ورقة الطباعة الكاملة حسب الخيار المختار —
 * أوضاع نصف الورقة تُظهر النصف الفارغ مع خط القص، مع نفس التصغير التلقائي
 * الذي سيُطبّق عند الطباعة (Print Preview حقيقي).
 */
export function SheetPreview({ size, children }: { size: PaperSize; children: ReactNode }) {
  const hostRef = useRef<HTMLDivElement>(null)
  const [, setZoomTick] = useState(1)

  // نفس آلية الملاءمة التلقائية للطباعة — معاينة تطابق الناتج المطبوع
  useLayoutEffect(() => {
    const host = hostRef.current
    if (!host) return
    const paper = host.querySelector('.doc-paper') as HTMLElement | null
    const fitEl = paper?.querySelector('.doc-print-fit') as HTMLElement | null
    if (!paper || !fitEl) return
    const sheetWmm = size === 'A4-landscape' ? 297 : size === 'A5-portrait' ? 148.5 : 210
    const [, chmm] = PRINT_CONTENT_AREA[size]
    const measure = () => {
      const pxPerMm = paper.offsetWidth / sheetWmm
      if (!pxPerMm || !isFinite(pxPerMm)) return
      const availH = chmm * pxPerMm
      const prevMin = fitEl.style.minHeight
      const prevTransform = fitEl.style.transform
      fitEl.style.minHeight = '0'
      fitEl.style.transform = 'none'
      const naturalH = fitEl.offsetHeight
      fitEl.style.minHeight = prevMin
      fitEl.style.transform = prevTransform
      const z = naturalH > 0 ? Math.min(1, (availH * 0.995) / naturalH) : 1
      const cur = parseFloat(paper.style.getPropertyValue('--doc-fit-scale') || '1')
      if (!isFinite(cur) || Math.abs(cur - z) > 0.002) {
        paper.style.setProperty('--doc-fit-scale', z < 0.999 ? z.toFixed(4) : '1')
        setZoomTick((t) => t + 1)
      }
    }
    measure()
    const ro = new ResizeObserver(measure)
    ro.observe(paper)
    ro.observe(fitEl)
    return () => ro.disconnect()
  }, [size])

  const sheet =
    size === 'A4-landscape' || size === 'A5-portrait'
      ? { ratio: '297 / 210', maxW: 960 }
      : { ratio: '210 / 297', maxW: 680 }

  // ورقة الطباعة الكاملة بنسبها الحقيقية — المحتوى داخلها بنفس التصغير التلقائي للطباعة
  // عرض صريح (مع maxWidth: 100%) حتى تبقى النسب محددة داخل حاويات fit-to-screen
  return (
    <div
      ref={hostRef}
      className="sheet-preview relative mx-auto overflow-hidden rounded-md bg-white shadow-xl ring-1 ring-black/10"
      style={{ aspectRatio: sheet.ratio, width: sheet.maxW, maxWidth: '100%' }}
      dir="rtl"
    >
      {size === 'A5-portrait' ? (
        <>
          <div className="absolute inset-y-0 right-0 w-1/2">{children}</div>
          <div className="pointer-events-none absolute inset-y-0 left-1/2 flex w-px items-center" aria-hidden>
            <Scissors className="h-3.5 w-3.5 rotate-90 -translate-x-1/2 text-neutral-300" />
          </div>
          <div
            className="pointer-events-none absolute inset-y-0 left-0 flex w-1/2 items-center justify-center p-4 text-center text-[10px] font-bold leading-relaxed text-neutral-300"
            aria-hidden
          >
            الجهة الأخرى من الورقة تبقى فارغة — صالحة للاستعمال
          </div>
        </>
      ) : (
        <>
          {children}
          {size === 'A5-landscape' && (
            <>
              <div
                className="pointer-events-none absolute inset-x-0 flex items-center gap-1.5 px-3"
                style={{ top: '50%' }}
                aria-hidden
              >
                <span className="h-px flex-1 border-t-2 border-dashed border-neutral-200" />
                <Scissors className="h-3.5 w-3.5 -scale-x-100 text-neutral-300" />
                <span className="h-px flex-1 border-t-2 border-dashed border-neutral-200" />
              </div>
              <div
                className="pointer-events-none absolute inset-x-0 bottom-4 text-center text-[10px] font-bold text-neutral-300"
                aria-hidden
              >
                النصف السفلي من الورقة يبقى فارغاً — يُقص ويُستعمل مرة أخرى
              </div>
            </>
          )}
        </>
      )}
    </div>
  )
}

/** عرض الورقة في المعاينة بحسب المقاس والاتجاه
 *  (A5 عرضي = 210mm = نفس عرض A4 طولي فعلياً؛ A4 عرضي = 297mm أي الأعرض) */
export function paperWidthClass(size: PaperSize, wide = false): string {
  switch (size) {
    case 'A5-portrait':
      return wide ? 'max-w-[520px]' : 'max-w-[480px]'
    case 'A4-landscape':
      return wide ? 'max-w-[1010px]' : 'max-w-[960px]'
    case 'A5-landscape':
    case 'A4-portrait':
    default:
      return wide ? 'max-w-[730px]' : 'max-w-[680px]'
  }
}
