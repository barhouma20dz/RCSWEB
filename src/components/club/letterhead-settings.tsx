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
import { Settings2, RotateCcw, Palette, PenLine } from 'lucide-react'

// ==================================================================
// الإمضاءات الموحدة — إدارة النادي هي من يحدد الإمضاءات
// في جميع الوثائق والنماذج الرسمية
// ==================================================================

export type SignatureRoleKey = 'president' | 'branch' | 'municipality' | 'concerned'

export interface SignatureRole {
  /** هل يظهر هذا الإمضاء على الأوراق */
  enabled: boolean
  /** المسمى المعروض على الورقة — قابل للتعديل حسب الحاجة */
  label: string
  /** الاسم واللقب (اختياري — فارغ = خط منقط للتعبئة اليدوية بالإمضاء) */
  name: string
}

export const SIGNATURE_ROLES: { key: SignatureRoleKey; hint: string }[] = [
  { key: 'president', hint: 'يوقّع المراسلات الرسمية ويضع تأشيرته على العقود والوثائق' },
  { key: 'branch', hint: 'يوقّع وثائق فرعه الرياضية عند تفويضه بذلك' },
  { key: 'municipality', hint: 'تأشيرة مصالح البلدية على الوثائق الموجهة إليها أو المصادق عليها' },
  { key: 'concerned', hint: 'إمضاء المعني بالأمر (العامل، ولي الأمر، المستلم…)' },
]

export const DEFAULT_SIGNATURES: Record<SignatureRoleKey, SignatureRole> = {
  president: { enabled: true, label: 'رئيس النادي', name: '' },
  branch: { enabled: false, label: 'رئيس الفرع', name: '' },
  municipality: { enabled: false, label: 'مصالح البلدية', name: '' },
  concerned: { enabled: true, label: 'المعني بالأمر', name: '' },
}

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
  /** الإمضاءات المفعّلة ومسمياتها — تُطبّق على جميع الوثائق والنماذج */
  signatures: Record<SignatureRoleKey, SignatureRole>
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
  signatures: DEFAULT_SIGNATURES,
}

const LS_KEY = 'rcs-club-letterhead-v1'

let cache: LetterheadSettings | null = null
const listeners = new Set<() => void>()

function readSettings(): LetterheadSettings {
  if (typeof window === 'undefined') return DEFAULT_LETTERHEAD
  if (cache) return cache
  try {
    const raw = window.localStorage.getItem(LS_KEY)
    const parsed = raw ? (JSON.parse(raw) as Partial<LetterheadSettings>) : {}
    cache = {
      ...DEFAULT_LETTERHEAD,
      ...parsed,
      signatures: { ...DEFAULT_SIGNATURES, ...(parsed.signatures ?? {}) },
    }
  } catch {
    cache = { ...DEFAULT_LETTERHEAD }
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

// ==================================================================
// شريط الإمضاءات الموحد — يُبنى من إعدادات الإدارة
// ==================================================================

/**
 * يعرض أعمدة/صناديق الإمضاءات المفعّلة من نافدة اختيار الإمضاءات.
 * - variant="compact": أعمدة إمضاء (المراسلات، الوصولات، الجداول).
 * - variant="box": صناديق مؤطرة (تأشيرات العقود).
 * الإمضاءات غير المفعّلة لا تُطبع — إدارة النادي هي من يحددها.
 */
export function SignatureStrip({
  keys,
  variant = 'compact',
  titlePrefix,
  className = '',
}: {
  keys: SignatureRoleKey[]
  variant?: 'compact' | 'box'
  /** بادئة عنوان الصندوق — مثال: «تأشيرة» */
  titlePrefix?: string
  className?: string
}) {
  const [s] = useLetterheadSettings()
  const active = keys.filter((k) => s.signatures[k]?.enabled)
  if (active.length === 0) return null

  if (variant === 'box') {
    const grid = active.length === 1 ? 'grid-cols-1' : active.length === 2 ? 'grid-cols-2' : 'grid-cols-3'
    return (
      <div className={`grid gap-3 ${grid} ${className}`}>
        {active.map((k) => {
          const r = s.signatures[k]
          return (
            <div key={k} className="rounded-lg border border-neutral-400/60 p-3 text-center">
              <div className="text-[11.5px] font-black underline">
                {titlePrefix ? `${titlePrefix} ${r.label}` : r.label}
              </div>
              <div className="mt-1 text-[10.5px] font-bold text-neutral-500">
                الاسم واللقب: {r.name || '..................'}
              </div>
              <div className="mt-8 text-[10px] font-bold text-neutral-500">الإمضاء والختم</div>
            </div>
          )
        })}
      </div>
    )
  }

  return (
    <div className={`flex flex-wrap items-end gap-8 ${className}`}>
      {active.map((k) => {
        const r = s.signatures[k]
        return (
          <div key={k} className="text-center">
            <div className="text-[13px] font-black underline">{r.name || '..................'}</div>
            {r.label.trim() && <div className="text-[10.5px] font-bold text-neutral-500">{r.label}</div>}
            <div className="mt-10 w-28 border-t border-dashed border-neutral-400" />
          </div>
        )
      })}
    </div>
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
// نافذة اختيار الإمضاءات (إعدادات عامة لجميع الوثائق والنماذج)
// ==================================================================

export function SignatureSettingsDialog({ open, onClose }: { open: boolean; onClose: () => void }) {
  const [s, setS] = useLetterheadSettings()
  if (!open) return null

  const setRole = (k: SignatureRoleKey, patch: Partial<SignatureRole>) =>
    setS({ ...s, signatures: { ...s.signatures, [k]: { ...s.signatures[k], ...patch } } })
  const anyEnabled = (Object.keys(s.signatures) as SignatureRoleKey[]).some((k) => s.signatures[k].enabled)

  return (
    <Dialog open={open} onOpenChange={(v) => !v && onClose()}>
      <DialogContent className="sm:max-w-3xl max-h-[92vh] overflow-y-auto nice-scroll">
        <DialogHeader className="doc-print-hide">
          <DialogTitle className="flex items-center gap-2">
            <PenLine className="h-5 w-5" style={{ color: s.accentColor }} />
            اختيار الإمضاءات — نافدة الإدارة
          </DialogTitle>
          <DialogDescription>
            إدارة النادي هي من تحدد الإمضاءات في جميع الوثائق والنماذج: فعّل الإمضاءات المطلوبة وعدّل مسمياتها وأسماء
            الموقّعين — تُطبَّق فوراً على كل الأوراق (العقود، المراسلات، الوصولات، الجداول) وتُحفظ في هذا المتصفح.
          </DialogDescription>
        </DialogHeader>

        <div className="grid grid-cols-1 lg:grid-cols-[1fr_300px] gap-5">
          <div className="space-y-2.5 doc-print-hide">
            {SIGNATURE_ROLES.map(({ key, hint }) => {
              const r = s.signatures[key]
              return (
                <div
                  key={key}
                  className={`rounded-xl border p-3 transition-colors ${
                    r.enabled ? 'border-(--club)/40 bg-(--club-light)/40' : 'border-(--border) bg-muted/30'
                  }`}
                >
                  <div className="flex items-center justify-between gap-3">
                    <div className="min-w-0">
                      <div className="text-[13px] font-black">{r.label}</div>
                      <p className="text-[10.5px] text-muted-foreground">{hint}</p>
                    </div>
                    <Switch
                      checked={r.enabled}
                      onCheckedChange={(v) => setRole(key, { enabled: v })}
                      aria-label={`تفعيل إمضاء ${r.label}`}
                    />
                  </div>
                  {r.enabled && (
                    <div className="mt-2.5 grid grid-cols-1 sm:grid-cols-2 gap-2">
                      <Input
                        value={r.label}
                        onChange={(e) => setRole(key, { label: e.target.value })}
                        placeholder="المسمى المعروض على الورقة"
                        aria-label="مسمى الإمضاء"
                      />
                      <Input
                        value={r.name}
                        onChange={(e) => setRole(key, { name: e.target.value })}
                        placeholder="الاسم واللقب (اختياري — فارغ = إمضاء يدوي)"
                        aria-label="اسم الموقّع"
                      />
                    </div>
                  )}
                </div>
              )
            })}

            <Button variant="outline" onClick={resetLetterheadSettings} className="font-bold">
              <RotateCcw className="h-4 w-4 ml-1" /> استعادة الإمضاءات الافتراضية
            </Button>
          </div>

          {/* معاينة حية */}
          <div className="rounded-xl bg-muted/50 p-3">
            <div className="mb-2 text-[11px] font-black text-muted-foreground text-center">
              معاينة — صندوق الإمضاء كما سيطبع
            </div>
            <div className="rounded-lg bg-white p-4 shadow-sm" dir="rtl">
              <SignatureStrip
                keys={['president', 'branch', 'municipality', 'concerned']}
                variant="box"
              />
              {!anyEnabled && (
                <p className="py-4 text-center text-[11px] text-neutral-400">لم تُفعّل أي إمضاء بعد</p>
              )}
            </div>
            <p className="mt-3 text-[10px] leading-relaxed text-muted-foreground text-center">
              في العقود تظهر الإضافية كتأشيرات أسفل الطرفين، وفي المراسلات كأعمدة إمضاء أسفل الورقة.
            </p>
          </div>
        </div>
      </DialogContent>
    </Dialog>
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

/** زر عائم صغير يفتح نافذة اختيار الإمضاءات — يُستخدم داخل نوافذ الأوراق */
export function SignaturesQuickSettings({ onOpen }: { onOpen: () => void }) {
  return (
    <button
      type="button"
      onClick={onOpen}
      className="doc-print-hide inline-flex items-center gap-1.5 rounded-full border border-(--border) bg-muted/50 px-3 py-1 text-[10.5px] font-bold text-muted-foreground transition-colors hover:border-(--club)/50 hover:text-(--club)"
      title="اختيار الإمضاءات — تُطبَّق على جميع الوثائق والنماذج"
    >
      <PenLine className="h-3 w-3" />
      اختيار الإمضاءات
    </button>
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
