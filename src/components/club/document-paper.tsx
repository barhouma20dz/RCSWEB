'use client'

/**
 * ورقة وثيقة رسمية قابلة للطباعة — تُستخدم في مصمم كتب النادي (الإدارة)
 * وفي عرض الوثائق الواردة لمكاتب الفروع
 */

import { useMemo } from 'react'
import { Star } from 'lucide-react'
import { formatDateDMY } from '@/lib/date-format'
import { isA5, normalizePaperSize, paperHalfClass, paperWidthClass, PrintPageSize, type PaperSize } from './doc-blocks'
import type { ClubDocumentItem } from './types'

export interface DocumentDesign {
  style: 'official' | 'minimal' | 'ceremonial'
  accent: 'navy' | 'silver' | 'red' | 'green' | 'gold'
  showLogo: boolean
  showStamp: boolean
  showWatermark: boolean
  signatureName: string
  /** مقاس واتجاه الورقة حسب الاختيار — A4 طولي افتراضياً */
  paperSize?: PaperSize
}

const DEFAULT_DESIGN: DocumentDesign = {
  style: 'official',
  accent: 'navy',
  showLogo: true,
  showStamp: true,
  showWatermark: true,
  signatureName: 'رئيس النادي',
}

export function parseDesign(json: string): DocumentDesign {
  if (!json) return { ...DEFAULT_DESIGN }
  try {
    const d = JSON.parse(json) as Partial<DocumentDesign>
    const merged = { ...DEFAULT_DESIGN, ...d }
    // تطبيع المقاس المحفوظ — الأوراق القديمة 'A4'/'A5' تُحوّل تلقائياً إلى الطولي
    return { ...merged, paperSize: normalizePaperSize(merged.paperSize) }
  } catch {
    return { ...DEFAULT_DESIGN }
  }
}

export const DOC_TYPE_LABELS: Record<ClubDocumentItem['type'], string> = {
  file: 'ملف',
  minute: 'محضر',
  letter: 'مراسلة',
  request: 'طلب',
  design: 'ورقة رسمية',
  issued: 'وثيقة مُصدرة',
}

const ACCENT_HEX: Record<DocumentDesign['accent'], string> = {
  navy: '#1d2f5e',
  silver: '#5c6a85',
  red: '#a30c28',
  green: '#0a4f2f',
  gold: '#9a7a25',
}

function formatDate(d: string | Date): string {
  return formatDateDMY(d) || String(d).slice(0, 10)
}

export function DocumentPaper({
  doc,
  compact = false,
  paperSize: paperSizeProp,
}: {
  doc: Pick<
    ClubDocumentItem,
    'refNumber' | 'title' | 'type' | 'category' | 'content' | 'design' | 'createdAt' | 'member' | 'branch'
  >
  compact?: boolean
  /** مقاس واتجاه الورقة عند العرض/الطباعة — يتجاوز المحفوظ في تصميم الوثيقة */
  paperSize?: PaperSize
}) {
  const design = useMemo(() => parseDesign(doc.design), [doc.design])
  const accent = ACCENT_HEX[design.accent] ?? ACCENT_HEX.navy
  const size: PaperSize = normalizePaperSize(paperSizeProp ?? design.paperSize)

  return (
    <div
      className={`doc-paper doc-print-area mx-auto w-full ${
        compact
          ? 'max-w-[520px] p-5 sm:p-7'
          : `${paperWidthClass(size)} ${isA5(size) ? 'p-5 sm:p-7' : 'p-6 sm:p-10'} ${paperHalfClass(size)}`
      }`}
      style={{ ['--doc-accent' as string]: accent }}
      dir="rtl"
    >
      {/* مقاس واتجاه صفحة الطباعة الفعلي — 4 خيارات */}
      {!compact && <PrintPageSize size={size} />}
      <div className="doc-paper-frame" />

      {/* العلامة المائية */}
      {design.showWatermark && (
        <img
          src="/images/logo-full.png"
          alt=""
          aria-hidden
          className="pointer-events-none absolute left-1/2 top-1/2 h-[62%] w-auto -translate-x-1/2 -translate-y-1/2 opacity-[0.045] select-none"
        />
      )}

      <div className={compact ? 'relative px-2' : 'relative px-3'}>
        {/* الترويسة */}
        <header className="flex items-start justify-between gap-3 border-b-2 pb-3" style={{ borderColor: accent }}>
          {design.showLogo ? (
            <div className="flex items-center gap-2.5 min-w-0">
              <img
                src="/images/logo.png"
                alt="شعار النادي"
                className={`${compact ? 'h-11 w-11' : 'h-14 w-14'} object-contain shrink-0`}
              />
              <div className="leading-tight min-w-0">
                <div className={`${compact ? 'text-[11px]' : 'text-[13px]'} font-black truncate`}>
                  النادي الرياضي الرائد
                </div>
                <div
                  className={`${compact ? 'text-[9px]' : 'text-[10px]'} font-bold text-neutral-500 truncate`}
                >
                  Club Sportif Amat. Omnisports Rayed — APC de Saïda
                </div>
                <div className={`${compact ? 'text-[9px]' : 'text-[10px]'} font-bold`}>الإدارة العامة</div>
              </div>
            </div>
          ) : (
            <span />
          )}
          <div
            className={`${compact ? 'text-[9px]' : 'text-[10.5px]'} text-left leading-relaxed font-bold shrink-0 whitespace-nowrap`}
          >
            <div>
              <span className="text-neutral-500">الرقم: </span>
              {doc.refNumber || '—'}
            </div>
            <div>
              <span className="text-neutral-500">التاريخ: </span>
              {formatDate(doc.createdAt)}
            </div>
            {doc.branch && <div>نيابة: فرع {doc.branch.name}</div>}
          </div>
        </header>

        {/* العنوان */}
        <div className="mt-4 text-center">
          <span
            className={`inline-block rounded-full border px-3 py-0.5 ${compact ? 'text-[9px]' : 'text-[10.5px]'} font-black`}
            style={{ borderColor: accent, color: accent }}
          >
            {DOC_TYPE_LABELS[doc.type]}
            {doc.category ? ` — ${doc.category}` : ''}
          </span>
          <h3 className={`${compact ? 'mt-1.5 text-base' : 'mt-2 text-xl'} font-black underline decoration-1 underline-offset-8`}>
            {doc.title}
          </h3>
        </div>

        {/* الإطار المعني */}
        {doc.member && (
          <p className={`${compact ? 'mt-2 text-[10px]' : 'mt-2 text-xs'} font-bold`}>
            المعني: <span className="font-black">{doc.member.firstName} {doc.member.lastName}</span>
            {doc.member.position ? ` — ${doc.member.position}` : ''}
          </p>
        )}

        {/* النص */}
        <div
          className={`${compact ? 'mt-3 min-h-[180px] text-[11.5px]' : 'mt-4 min-h-[260px] text-[13.5px]'} whitespace-pre-wrap leading-[2] font-medium text-neutral-800`}
        >
          {doc.content}
        </div>

        {/* التذييل: توقيع وختم */}
        <footer className={`mt-6 flex items-end justify-between ${compact ? 'px-1' : 'px-3'}`}>
          <div className="text-center">
            {design.showStamp && (
              <div
                className={`doc-stamp ${compact ? 'h-16 w-16 text-[7px]' : 'h-20 w-20 text-[8.5px]'} mb-2 flex flex-col items-center justify-center font-black`}
              >
                <Star className={`${compact ? 'h-3 w-3' : 'h-4 w-4'} fill-current`} />
                <span>الجمهورية الجزائرية</span>
                <span>الإدارة العامة</span>
              </div>
            )}
          </div>
          <div className="text-center">
            <div className={`${compact ? 'text-[9px]' : 'text-[10px]'} font-bold text-neutral-500`}>
              {design.signatureName || 'التوقيع'}
            </div>
            <div className={`${compact ? 'mt-4 w-24' : 'mt-5 w-28'} border-t border-dashed border-neutral-400`} />
          </div>
        </footer>
      </div>
    </div>
  )
}
