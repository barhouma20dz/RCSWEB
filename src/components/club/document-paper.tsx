'use client'

/**
 * ورقة وثيقة رسمية قابلة للطباعة — تُستخدم في مصمم كتب النادي (الإدارة)
 * وفي عرض الوثائق الواردة لمكاتب الفروع
 */

import { useMemo } from 'react'
import { Star } from 'lucide-react'
import { formatDateDMY } from '@/lib/date-format'
import type { ClubDocumentItem } from './types'

export interface DocumentDesign {
  style: 'official' | 'minimal' | 'ceremonial'
  accent: 'navy' | 'silver' | 'red' | 'green' | 'gold'
  showLogo: boolean
  showStamp: boolean
  showWatermark: boolean
  signatureName: string
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
    return { ...DEFAULT_DESIGN, ...d }
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
  id,
}: {
  doc: Pick<
    ClubDocumentItem,
    'refNumber' | 'title' | 'type' | 'category' | 'content' | 'design' | 'createdAt' | 'member' | 'branch'
  >
  compact?: boolean
  id?: string
}) {
  const design = useMemo(() => parseDesign(doc.design), [doc.design])
  const accent = ACCENT_HEX[design.accent] ?? ACCENT_HEX.navy

  return (
    <div
      id={id}
      className={`doc-paper doc-print-area mx-auto w-full ${compact ? 'max-w-[520px] p-5 sm:p-7' : 'max-w-[680px] p-6 sm:p-10'}`}
      style={{ ['--doc-accent' as string]: accent }}
      dir="rtl"
    >
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
        {/* الترويسة الوطنية الموحدة */}
        <div className="text-center pb-2 mb-2 border-b border-neutral-300">
          <div className={`${compact ? 'text-[9.5px]' : 'text-[11px]'} font-black tracking-wide text-neutral-800`}>
            الجمهورية الجزائرية الديمقراطية الشعبية
          </div>
          <div className={`${compact ? 'text-[8px]' : 'text-[9.5px]'} font-bold text-neutral-600 mt-0.5`}>
            وزارة الشباب والرياضة — ولاية سعيدة — مديرية الشباب والرياضة
          </div>
        </div>

        {/* الترويسة الخاصة بالنادي */}
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

/**
 * دالة طباعة مخصصة للوثائق — تضمن:
 * 1. عدم طباعة ترويسة وتذييل المتصفح (حذف التاريخ، الرابط، واسم الموقع)
 * 2. بدء الوثيقة مباشرة من أعلى الصفحة الأولى A4 بدون أي صفحات بيضاء سابقة
 * 3. ملاءمة دقيقة لقياس A4 القياسي
 */
export function printClubDocument(elementOrId?: HTMLElement | string | null) {
  let targetEl: HTMLElement | null = null

  if (typeof elementOrId === 'string') {
    targetEl = document.getElementById(elementOrId)
  } else if (elementOrId instanceof HTMLElement) {
    targetEl = elementOrId
  } else {
    // الأولوية للورقة المعروضة في النافذة المنبثقة إن وُجدت، أو الورقة في الصفحة
    const dialogPaper = document.querySelector('[role="dialog"] .doc-paper') as HTMLElement | null
    const anyPaper = document.querySelector('.doc-paper') as HTMLElement | null
    targetEl = dialogPaper || anyPaper
  }

  if (!targetEl) {
    window.print()
    return
  }

  const iframe = document.createElement('iframe')
  iframe.style.position = 'fixed'
  iframe.style.right = '0'
  iframe.style.bottom = '0'
  iframe.style.width = '0'
  iframe.style.height = '0'
  iframe.style.border = '0'
  iframe.style.visibility = 'hidden'
  document.body.appendChild(iframe)

  const doc = iframe.contentWindow?.document
  if (!doc) {
    window.print()
    return
  }

  const clone = targetEl.cloneNode(true) as HTMLElement
  clone.classList.add('doc-print-isolated')

  const styles = Array.from(document.querySelectorAll('style, link[rel="stylesheet"]'))
    .map((s) => s.outerHTML)
    .join('\n')

  doc.open()
  doc.write(`<!DOCTYPE html>
<html dir="rtl" lang="ar">
<head>
  <meta charset="utf-8" />
  <title></title>
  ${styles}
  <style>
    @page {
      size: A4 portrait;
      margin: 0 !important;
    }
    *, *::before, *::after {
      box-sizing: border-box !important;
      -webkit-print-color-adjust: exact !important;
      print-color-adjust: exact !important;
    }
    html, body {
      margin: 0 !important;
      padding: 0 !important;
      background: #ffffff !important;
      width: 210mm !important;
      min-height: 297mm !important;
      font-family: var(--font-cairo), 'Segoe UI', Tahoma, sans-serif !important;
      direction: rtl;
    }
    .doc-print-isolated {
      width: 210mm !important;
      max-width: 210mm !important;
      min-height: 297mm !important;
      margin: 0 auto !important;
      padding: 14mm 16mm !important;
      box-shadow: none !important;
      border-radius: 0 !important;
      background: #fdfcf8 !important;
      position: relative !important;
      overflow: hidden !important;
      page-break-after: avoid !important;
      page-break-inside: avoid !important;
      break-inside: avoid !important;
    }
    .doc-paper-frame {
      position: absolute !important;
      inset: 8mm !important;
      border: 1.5px solid var(--doc-accent, #1d2f5e) !important;
      border-radius: 3px !important;
      pointer-events: none !important;
    }
    .doc-paper-frame::after {
      content: '' !important;
      position: absolute !important;
      inset: 3px !important;
      border: 0.5px solid var(--doc-accent, #1d2f5e) !important;
      border-radius: 2px !important;
    }
    .doc-stamp {
      border: 2.5px solid var(--doc-accent, #1d2f5e) !important;
      color: var(--doc-accent, #1d2f5e) !important;
      border-radius: 9999px !important;
      transform: rotate(-12deg) !important;
      opacity: 0.85 !important;
    }
  </style>
</head>
<body>
  ${clone.outerHTML}
</body>
</html>`)
  doc.close()

  const doPrint = () => {
    try {
      iframe.contentWindow?.focus()
      iframe.contentWindow?.print()
    } catch {
      window.print()
    } finally {
      setTimeout(() => {
        iframe.remove()
      }, 3000)
    }
  }

  const images = doc.querySelectorAll('img')
  if (images.length === 0) {
    setTimeout(doPrint, 250)
  } else {
    let loaded = 0
    const total = images.length
    const onImg = () => {
      loaded++
      if (loaded >= total) doPrint()
    }
    images.forEach((img) => {
      if (img.complete) onImg()
      else {
        img.onload = onImg
        img.onerror = onImg
      }
    })
    setTimeout(doPrint, 800)
  }
}
