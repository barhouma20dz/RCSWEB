'use client'

/**
 * الترويسة الموحدة القابلة للتخصيص لكل النماذج الرسمية للنادي:
 *
 * - إعدادات يحددها المستخدم (حسب ذوقه الشخصي) وتُحفظ محلياً في المتصفح:
 *     • نص السطر العربي والفرنسي
 *     • إظهار/إخفاء كل شعار
 *     • حجم الشعار ولون الهوية ونمط الفاصل
 *     • العلامة المائية ونص الموسم
 * - كل أوراق مكتب النادي (النظامية والإدارية) تستخدم هذه الترويسة
 *   حتى تخرج للطباعة بهوية موحدة يمكن تغييرها متى شاء.
 */

import { useSyncExternalStore } from 'react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Switch } from '@/components/ui/switch'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { Settings2, RotateCcw, Palette } from 'lucide-react'

/** الموسم الرياضي الحالي (يبدأ من جويلية) — مثل: 2026/2027 */
export function seasonLabel(date = new Date()): string {
  const y = date.getFullYear()
  return date.getMonth() + 1 >= 7 ? `${y}/${y + 1}` : `${y - 1}/${y}`
}

// ==================================================================
// الإعدادات + التخزين المحلي
// ==================================================================

export interface LetterheadSettings {
  titleAr: string
  titleFr: string
  showFr: boolean
  showLogoLeft: boolean
  showLogoRight: boolean
  logoSize: number
  accentColor: string
  divider: 'double' | 'thick' | 'thin' | 'dashed'
  watermark: boolean
  showSeason: boolean
  seasonText: string
}

export const DEFAULT_LETTERHEAD: LetterheadSettings = {
  titleAr: 'جمعية الرائد الرياضي الهوايي المتعدد الرياضات — الرائد — بلدية سعيدة',
  titleFr: 'CLUB SPORTIF AMATEUR OMNISPORTS — RAYED APC DE SAÏDA',
  showFr: true,
  showLogoLeft: true,
  showLogoRight: true,
  logoSize: 56,
  accentColor: '#1d2f5e',
  divider: 'double',
  watermark: true,
  showSeason: true,
  seasonText: '',
}

const LS_KEY = 'rcs-club-letterhead-v1'

let cache: LetterheadSettings | null = null
const listeners = new Set<() => void>()

function readSettings(): LetterheadSettings {
  if (typeof window === 'undefined') return DEFAULT_LETTERHEAD
  if (cache) return cache
  try {
    const raw = window.localStorage.getItem(LS_KEY)
    cache = raw ? { ...DEFAULT_LETTERHEAD, ...(JSON.parse(raw) as Partial<LetterheadSettings>) } : DEFAULT_LETTERHEAD
  } catch {
    cache = DEFAULT_LETTERHEAD
  }
  return cache
}

function subscribe(cb: () => void) {
  listeners.add(cb)
  return () => listeners.delete(cb)
}

const getSnapshot = () => readSettings()
const getServerSnapshot = () => DEFAULT_LETTERHEAD

export function saveLetterheadSettings(next: LetterheadSettings) {
  cache = { ...next }
  try {
    window.localStorage.setItem(LS_KEY, JSON.stringify(next))
  } catch {
    /* التخزين غير متاح — تبقى القيم للجلسة فقط */
  }
  listeners.forEach((l) => l())
}

export function resetLetterheadSettings() {
  saveLetterheadSettings({ ...DEFAULT_LETTERHEAD })
}

/** hook يقرأ الإعدادات ويعيد [الإعدادات، دالة الحفظ] */
export function useLetterheadSettings(): [LetterheadSettings, (s: LetterheadSettings) => void] {
  const settings = useSyncExternalStore(subscribe, getSnapshot, getServerSnapshot)
  return [settings, saveLetterheadSettings]
}

// ==================================================================
// الترويسة الرسمية (تُستخدم داخل كل الأوراق)
// ==================================================================

const DIVIDERS: Record<LetterheadSettings['divider'], string> = {
  double: 'border-b-[3px] border-double',
  thick: 'border-b-[4px] border-solid',
  thin: 'border-b border-solid',
  dashed: 'border-b-[2.5px] border-dashed',
}

export function ClubLetterhead({ compact = false }: { compact?: boolean }) {
  const [s] = useLetterheadSettings()
  const size = compact ? Math.max(30, Math.round(s.logoSize * 0.65)) : s.logoSize
  const divider = DIVIDERS[s.divider] ?? DIVIDERS.double

  const logo = (side: 'left' | 'right') =>
    (side === 'left' ? s.showLogoLeft : s.showLogoRight) ? (
      <img
        src="/images/logo.png"
        alt="شعار النادي"
        className="object-contain shrink-0"
        style={{ height: size, width: size }}
      />
    ) : (
      <span style={{ width: size }} className="shrink-0" aria-hidden />
    )

  return (
    <header className={`flex items-center justify-between gap-3 pb-2.5 ${divider}`} style={{ borderColor: s.accentColor }}>
      {logo('right')}
      <div className="min-w-0 flex-1 text-center leading-tight">
        <div
          className={`${compact ? 'text-[10.5px]' : 'text-[13.5px]'} font-black`}
          style={{ color: s.accentColor }}
        >
          {s.titleAr}
        </div>
        {s.showFr && (
          <div
            className={`${compact ? 'text-[8.5px]' : 'text-[11px]'} mt-0.5 font-black tracking-wide text-neutral-600`}
            dir="ltr"
          >
            {s.titleFr}
          </div>
        )}
        {s.showSeason && !compact && s.seasonText.trim() && (
          <div className="mt-0.5 text-[10px] font-bold text-neutral-500">{s.seasonText}</div>
        )}
      </div>
      {logo('left')}
    </header>
  )
}

/** لون الهوية الحالي — للأوراق التي تلوّن إطارها وعناوينها بنفس الترويسة */
export function useAccentColor(): string {
  const [s] = useLetterheadSettings()
  return s.accentColor
}

/** هل تظهر العلامة المائية بالشعار الكامل */
export function useWatermark(): boolean {
  const [s] = useLetterheadSettings()
  return s.watermark
}

/** علامة مائية موحدة (شعار شفاف في وسط الورقة) */
export function PaperWatermark({ size = '55%' }: { size?: string }) {
  const enabled = useWatermark()
  if (!enabled) return null
  return (
    <img
      src="/images/logo-full.png"
      alt=""
      aria-hidden
      className="doc-watermark pointer-events-none absolute left-1/2 top-1/2 h-[55%] w-auto -translate-x-1/2 -translate-y-1/2 opacity-[0.04] select-none"
      style={{ height: size }}
    />
  )
}

// ==================================================================
// نافذة إعدادات الترويسة
// ==================================================================

const PRESETS: { name: string; color: string }[] = [
  { name: 'كحلي النادي', color: '#1d2f5e' },
  { name: 'أخضر الملاعب', color: '#166534' },
  { name: 'عنابي', color: '#7f1d1d' },
  { name: 'ذهبي داكن', color: '#713f12' },
  { name: 'أسود رسمي', color: '#1c1917' },
]

export function LetterheadSettingsDialog({ open, onClose }: { open: boolean; onClose: () => void }) {
  const [s, setS] = useLetterheadSettings()
  if (!open) return null

  const set = <K extends keyof LetterheadSettings>(k: K, v: LetterheadSettings[K]) =>
    setS({ ...s, [k]: v })

  return (
    <Dialog open={open} onOpenChange={(v) => !v && onClose()}>
      <DialogContent className="sm:max-w-3xl max-h-[92vh] overflow-y-auto nice-scroll">
        <DialogHeader className="doc-print-hide">
          <DialogTitle className="flex items-center gap-2">
            <Palette className="h-5 w-5" style={{ color: s.accentColor }} />
            إعدادات الترويسة الموحدة
          </DialogTitle>
          <DialogDescription>
            خصّص هوية كل النماذج الرسمية — تُحفظ إعداداتك في هذا المتصفح وتُطبَّق فوراً على كل الأوراق.
          </DialogDescription>
        </DialogHeader>

        <div className="grid grid-cols-1 lg:grid-cols-[1fr_320px] gap-5">
          {/* الحقول */}
          <div className="space-y-3 doc-print-hide">
            <div className="space-y-1.5">
              <Label>السطر الرئيسي (بالعربية)</Label>
              <Input value={s.titleAr} onChange={(e) => set('titleAr', e.target.value)} />
            </div>
            <div className="space-y-1.5">
              <Label>السطر الفرنسي</Label>
              <Input value={s.titleFr} onChange={(e) => set('titleFr', e.target.value)} dir="ltr" />
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div className="flex items-center justify-between rounded-xl border border-(--border) bg-muted/40 p-3">
                <Label className="text-xs font-bold">السطر الفرنسي</Label>
                <Switch checked={s.showFr} onCheckedChange={(v) => set('showFr', v)} />
              </div>
              <div className="flex items-center justify-between rounded-xl border border-(--border) bg-muted/40 p-3">
                <Label className="text-xs font-bold">نص الموسم</Label>
                <Switch checked={s.showSeason} onCheckedChange={(v) => set('showSeason', v)} />
              </div>
              <div className="flex items-center justify-between rounded-xl border border-(--border) bg-muted/40 p-3">
                <Label className="text-xs font-bold">الشعار الأيمن</Label>
                <Switch checked={s.showLogoRight} onCheckedChange={(v) => set('showLogoRight', v)} />
              </div>
              <div className="flex items-center justify-between rounded-xl border border-(--border) bg-muted/40 p-3">
                <Label className="text-xs font-bold">الشعار الأيسر</Label>
                <Switch checked={s.showLogoLeft} onCheckedChange={(v) => set('showLogoLeft', v)} />
              </div>
              <div className="flex items-center justify-between rounded-xl border border-(--border) bg-muted/40 p-3">
                <Label className="text-xs font-bold">العلامة المائية</Label>
                <Switch checked={s.watermark} onCheckedChange={(v) => set('watermark', v)} />
              </div>
              <div className="space-y-1.5">
                <Label className="text-xs font-bold">حجم الشعار: {s.logoSize}px</Label>
                <input
                  type="range"
                  min={30}
                  max={80}
                  value={s.logoSize}
                  onChange={(e) => set('logoSize', Number(e.target.value))}
                  className="w-full accent-(--club)"
                  aria-label="حجم الشعار"
                />
              </div>
            </div>
            {s.showSeason && (
              <div className="space-y-1.5">
                <Label>نص الموسم (اختياري — فارغ = يُحسب تلقائياً في الأوراق التي تطلبه)</Label>
                <Input
                  value={s.seasonText}
                  onChange={(e) => set('seasonText', e.target.value)}
                  placeholder={`مثال: الموسم الرياضي ${seasonLabel()}`}
                />
              </div>
            )}
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1.5">
                <Label>لون الهوية (الفاصل والعناوين)</Label>
                <div className="flex gap-2">
                  <input
                    type="color"
                    value={s.accentColor}
                    onChange={(e) => set('accentColor', e.target.value)}
                    className="h-9 w-12 cursor-pointer rounded-md border border-input bg-transparent p-1"
                    aria-label="اختيار اللون"
                  />
                  <Input value={s.accentColor} onChange={(e) => set('accentColor', e.target.value)} dir="ltr" className="flex-1" />
                </div>
              </div>
              <div className="space-y-1.5">
                <Label>نمط الفاصل</Label>
                <select
                  value={s.divider}
                  onChange={(e) => set('divider', e.target.value as LetterheadSettings['divider'])}
                  className="flex h-9 w-full rounded-md border border-input bg-transparent px-3 py-1 text-sm shadow-xs"
                >
                  <option value="double">مزدوج</option>
                  <option value="thick">سميك</option>
                  <option value="thin">رفيع</option>
                  <option value="dashed">متقطع</option>
                </select>
              </div>
            </div>

            <div className="space-y-1.5">
              <Label className="font-bold">ألوان جاهزة</Label>
              <div className="flex flex-wrap gap-2">
                {PRESETS.map((p) => (
                  <button
                    key={p.color}
                    type="button"
                    onClick={() => set('accentColor', p.color)}
                    className={`flex items-center gap-1.5 rounded-full border px-3 py-1.5 text-[11px] font-bold transition-colors hover:bg-muted ${
                      s.accentColor === p.color ? 'border-(--club) bg-(--club-light)' : 'border-(--border)'
                    }`}
                  >
                    <span className="h-3.5 w-3.5 rounded-full border border-black/10" style={{ background: p.color }} />
                    {p.name}
                  </button>
                ))}
              </div>
            </div>

            <Button variant="outline" onClick={resetLetterheadSettings} className="font-bold">
              <RotateCcw className="h-4 w-4 ml-1" /> استعادة الإعدادات الافتراضية
            </Button>
          </div>

          {/* معاينة حية */}
          <div className="rounded-xl bg-muted/50 p-3">
            <div className="mb-2 text-[11px] font-black text-muted-foreground text-center">معاينة حية</div>
            <div className="rounded-lg bg-white p-4 shadow-sm" dir="rtl">
              <ClubLetterhead />
              <div className="mt-4 space-y-2 text-[11px] text-neutral-500">
                <div className="h-2 w-3/4 rounded bg-neutral-200" />
                <div className="h-2 w-full rounded bg-neutral-200" />
                <div className="h-2 w-2/3 rounded bg-neutral-200 mx-auto" />
                <div className="h-2 w-4/5 rounded bg-neutral-200" />
              </div>
            </div>
            <p className="mt-3 text-[10px] leading-relaxed text-muted-foreground text-center">
              ستظهر الترويسة هكذا أعلى كل ورقة تُطبع من مكتب النادي.
            </p>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  )
}

/** زر عائم صغير يفتح الإعدادات — يُستخدم داخل نوافذ الأوراق */
export function LetterheadQuickSettings({ onOpen }: { onOpen: () => void }) {
  return (
    <button
      type="button"
      onClick={onOpen}
      className="doc-print-hide inline-flex items-center gap-1.5 rounded-full border border-(--border) bg-muted/50 px-3 py-1 text-[10.5px] font-bold text-muted-foreground transition-colors hover:border-(--club)/50 hover:text-(--club)"
      title="إعدادات الترويسة الموحدة"
    >
      <Settings2 className="h-3 w-3" />
      تخصيص الترويسة
    </button>
  )
}
