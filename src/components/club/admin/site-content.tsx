'use client'

/**
 * محتوى الموقع — تحرير المحتوى التحريري والإحصائيات والإنجازات:
 * - كلمة رئيس النادي (نص بثلاث لغات + اسم الرئيس + صفته) → settings.content.presidentWord
 * - إحصائيات الصفحة الرئيسية (سنة التأسيس، المشجعون، الميداليات، الألقاب) → settings.stats
 * - الإنجازات المسجلة يدوياً (إضافة/تعديل/حذف) → /api/admin/achievements
 *
 * ملاحظة: حفظ الإعدادات يرسل كائن الإعدادات الكامل (مدمجاً مع الحالي) حتى لا تُفقد
 * إعدادات التبويبات الأخرى — لا نستبدل الإعدادات بحقل واحد أبداً.
 */

import { useEffect, useState } from 'react'
import {
  Loader2,
  Save,
  Quote,
  BarChart3,
  Trophy,
  Plus,
  Pencil,
  Trash2,
  RotateCcw,
  Info,
  UserRound,
  Medal,
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import { Label } from '@/components/ui/label'
import { Badge } from '@/components/ui/badge'
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
import { useToast } from '@/hooks/use-toast'
import { apiFetch } from '@/lib/session'
import { useSiteSettings } from '../site-store'
import type { AdminData, AchievementItem, EditableStats, SiteSettings } from '../types'

type ContentTab = 'president' | 'stats' | 'achievements'
type TextLang = 'ar' | 'fr' | 'en'

/** استنساخ عميق آمن لكائن الإعدادات الحالية */
function cloneSettings(s: SiteSettings | null | undefined): SiteSettings {
  try {
    return s ? (JSON.parse(JSON.stringify(s)) as SiteSettings) : {}
  } catch {
    return {}
  }
}

/** قيمة رقمية للحقل (فارغة إن كانت غير مضبوطة = تُحسب تلقائياً) */
function numValue(v: number | undefined | null): string {
  return v === undefined || v === null || Number.isNaN(v) ? '' : String(v)
}

interface AchForm {
  title: string
  year: string
  description: string
  branchId: string // 'none' = بدون فرع
}

const EMPTY_ACH: AchForm = { title: '', year: '', description: '', branchId: 'none' }
const YEAR_RE = /^\d{4}([/-]\d{4})?$/

/** حقول نموذج الإنجاز — مشتركة بين نموذج الإضافة ونافذة التعديل */
function AchievementFields({
  form,
  setForm,
  branches,
}: {
  form: AchForm
  setForm: (f: AchForm) => void
  branches: AdminData['branches']
}) {
  return (
    <div className="space-y-3">
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
        <div className="space-y-1.5">
          <Label className="text-sm">عنوان الإنجاز *</Label>
          <Input
            value={form.title}
            onChange={(e) => setForm({ ...form, title: e.target.value })}
            placeholder="مثال: بطل كأس الولاية"
          />
        </div>
        <div className="space-y-1.5">
          <Label className="text-sm">السنة *</Label>
          <Input
            value={form.year}
            onChange={(e) => setForm({ ...form, year: e.target.value })}
            dir="ltr"
            className="text-right"
            placeholder="2026 أو 2025/2026"
          />
        </div>
      </div>
      <div className="space-y-1.5">
        <Label className="text-sm">الوصف (اختياري)</Label>
        <Textarea
          rows={2}
          value={form.description}
          onChange={(e) => setForm({ ...form, description: e.target.value })}
          placeholder="سطر يوضح الإنجاز كما يظهر للزوار..."
        />
      </div>
      <div className="space-y-1.5">
        <Label className="text-sm">الفرع (اختياري)</Label>
        <Select value={form.branchId} onValueChange={(v) => setForm({ ...form, branchId: v })}>
          <SelectTrigger className="w-full">
            <SelectValue placeholder="بدون فرع — على مستوى النادي" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="none">بدون فرع — على مستوى النادي</SelectItem>
            {branches.map((b) => (
              <SelectItem key={b.id} value={b.id}>
                {b.name}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>
    </div>
  )
}

export function SiteContentManager({ data, reload }: { data: AdminData; reload: () => void }) {
  const { toast } = useToast()
  const setGlobalSettings = useSiteSettings((s) => s.setSettings)
  const [tab, setTab] = useState<ContentTab>('president')
  const [textLang, setTextLang] = useState<TextLang>('ar')
  const [saving, setSaving] = useState(false)
  const [form, setForm] = useState<AchForm>({ ...EMPTY_ACH })
  const [adding, setAdding] = useState(false)
  const [editing, setEditing] = useState<AchievementItem | null>(null)
  const [editForm, setEditForm] = useState<AchForm>({ ...EMPTY_ACH })
  const [savingEdit, setSavingEdit] = useState(false)

  // المسودة = نسخة كاملة من الإعدادات الحالية (قد تكون null → كائن فارغ)
  const [draft, setDraft] = useState<SiteSettings>(() => cloneSettings(data.settings))

  // إعادة مزامنة المسودة بعد reload من الأعلى
  useEffect(() => {
    setDraft(cloneSettings(data.settings))
  }, [data.settings])

  const presidentWord = draft.content?.presidentWord
  const stats = draft.stats ?? {}

  const setPresidentText = (lang: TextLang, value: string) => {
    setDraft({
      ...draft,
      content: {
        ...draft.content,
        presidentWord: {
          ...presidentWord,
          text: { ...presidentWord?.text, [lang]: value },
        },
      },
    })
  }

  const setStat = (key: keyof EditableStats, raw: string) => {
    const clean = raw.trim()
    const value = clean === '' || !/^\d+$/.test(clean) ? undefined : Number(clean)
    setDraft({ ...draft, stats: { ...stats, [key]: value } })
  }

  /** حفظ الإعدادات — الإرسال بكامل الكائن مع الدمج المسبق مع الحالي */
  const saveSettings = async () => {
    setSaving(true)
    try {
      const res = await apiFetch('/api/admin/settings', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ settings: draft }),
      })
      const d = await res.json()
      if (!res.ok) throw new Error(d?.error || 'فشل الحفظ')
      setGlobalSettings(draft)
      toast({ title: 'تم حفظ محتوى الموقع', description: 'التغييرات ظاهرة الآن للزوار' })
      reload()
    } catch (e) {
      toast({ title: e instanceof Error ? e.message : 'فشل الحفظ', variant: 'destructive' })
    } finally {
      setSaving(false)
    }
  }

  // ==================== الإنجازات ====================

  const addAchievement = async () => {
    const title = form.title.trim()
    const year = form.year.trim()
    if (title.length < 2) return toast({ title: 'عنوان الإنجاز مطلوب (حرفان على الأقل)', variant: 'destructive' })
    if (!YEAR_RE.test(year)) return toast({ title: 'السنة يجب أن تكون بصيغة 2026 أو 2025/2026', variant: 'destructive' })
    setAdding(true)
    try {
      const res = await apiFetch('/api/admin/achievements', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          title,
          year,
          description: form.description.trim(),
          branchId: form.branchId === 'none' ? null : form.branchId,
        }),
      })
      const d = await res.json()
      if (!res.ok) throw new Error(d?.error || 'فشل إضافة الإنجاز')
      toast({ title: 'تم تسجيل الإنجاز', description: 'يظهر الآن في قسم الإنجازات بالصفحة الرئيسية' })
      setForm({ ...EMPTY_ACH })
      reload()
    } catch (e) {
      toast({ title: e instanceof Error ? e.message : 'فشل إضافة الإنجاز', variant: 'destructive' })
    } finally {
      setAdding(false)
    }
  }

  const openEdit = (a: AchievementItem) => {
    setEditing(a)
    setEditForm({
      title: a.title,
      year: a.year,
      description: a.description,
      branchId: a.branchId ?? 'none',
    })
  }

  const saveEdit = async () => {
    if (!editing) return
    const title = editForm.title.trim()
    const year = editForm.year.trim()
    if (title.length < 2) return toast({ title: 'عنوان الإنجاز مطلوب (حرفان على الأقل)', variant: 'destructive' })
    if (!YEAR_RE.test(year)) return toast({ title: 'السنة يجب أن تكون بصيغة 2026 أو 2025/2026', variant: 'destructive' })
    setSavingEdit(true)
    try {
      const res = await apiFetch('/api/admin/achievements', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          id: editing.id,
          data: {
            title,
            year,
            description: editForm.description.trim(),
            branchId: editForm.branchId === 'none' ? null : editForm.branchId,
          },
        }),
      })
      const d = await res.json()
      if (!res.ok) throw new Error(d?.error || 'فشل تعديل الإنجاز')
      toast({ title: 'تم تحديث الإنجاز' })
      setEditing(null)
      reload()
    } catch (e) {
      toast({ title: e instanceof Error ? e.message : 'فشل تعديل الإنجاز', variant: 'destructive' })
    } finally {
      setSavingEdit(false)
    }
  }

  const removeAchievement = async (a: AchievementItem) => {
    if (!window.confirm(`حذف الإنجاز «${a.title}» (${a.year}) نهائياً؟`)) return
    try {
      const res = await apiFetch('/api/admin/achievements', {
        method: 'DELETE',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id: a.id }),
      })
      const d = await res.json()
      if (!res.ok) throw new Error(d?.error || 'فشل حذف الإنجاز')
      toast({ title: 'تم حذف الإنجاز' })
      reload()
    } catch (e) {
      toast({ title: e instanceof Error ? e.message : 'فشل حذف الإنجاز', variant: 'destructive' })
    }
  }

  const tabs: Array<{ key: ContentTab; label: string; icon: React.ComponentType<{ className?: string }> }> = [
    { key: 'president', label: 'كلمة رئيس النادي', icon: Quote },
    { key: 'stats', label: 'إحصائيات الصفحة الرئيسية', icon: BarChart3 },
    { key: 'achievements', label: 'الإنجازات', icon: Trophy },
  ]

  return (
    <div>
      {/* رأس القسم */}
      <div className="rounded-3xl club-gradient p-5 md:p-6 mb-5 relative overflow-hidden">
        <div className="absolute -left-8 -bottom-8 h-36 w-36 rounded-full bg-(--silver)/10" />
        <div className="flex items-center gap-3">
          <Quote className="h-8 w-8 text-(--silver)" />
          <div>
            <h2 className="text-xl md:text-2xl font-black text-white">محتوى الموقع</h2>
            <p className="text-white/70 text-sm mt-1 max-w-2xl leading-relaxed">
              كلمة رئيس النادي بثلاث لغات، إحصائيات الصفحة الرئيسية، وتسجيل إنجازات النادي يدوياً —
              كل ما يُحفظ هنا ينعكس مباشرة على الصفحة الرئيسية.
            </p>
          </div>
        </div>
        <div className="mt-4 flex flex-wrap gap-2">
          <Badge className="bg-(--silver) text-(--club-dark)">كلمة الرئيس · إحصائيات · إنجازات</Badge>
          <Badge variant="outline" className="border-white/30 text-white/85">
            {data.achievements.length} إنجاز مسجل حالياً
          </Badge>
        </div>
      </div>

      {/* التبويبات */}
      <div className="rounded-2xl bg-white border border-(--border) p-2 mb-4 flex flex-wrap gap-1.5">
        {tabs.map((t) => (
          <button
            key={t.key}
            onClick={() => setTab(t.key)}
            className={`px-4 py-2 rounded-xl text-sm font-bold transition-all flex items-center gap-1.5 ${
              tab === t.key ? 'bg-(--club) text-white shadow' : 'text-(--club-dark) hover:bg-muted'
            }`}
          >
            <t.icon className="h-4 w-4" />
            {t.label}
          </button>
        ))}
      </div>

      <div className="rounded-2xl bg-white border border-(--border) p-5 md:p-6">
        {/* ===== كلمة رئيس النادي ===== */}
        {tab === 'president' && (
          <div className="space-y-6">
            <div className="flex flex-wrap items-center justify-between gap-2">
              <div>
                <Label className="text-base font-black text-(--club-dark) flex items-center gap-1.5">
                  <Quote className="h-4 w-4" /> كلمة رئيس النادي
                </Label>
                <p className="text-xs text-muted-foreground mt-1">
                  تظهر في قسم «عن النادي» بالصفحة الرئيسية — اكتبها بكل لغة من تبويبات اللغة أدناه.
                </p>
              </div>
              {/* مبدّل لغة النص */}
              <div className="flex gap-1.5 rounded-xl bg-muted p-1">
                {(
                  [
                    { key: 'ar', label: 'العربية' },
                    { key: 'fr', label: 'Français' },
                    { key: 'en', label: 'English' },
                  ] as Array<{ key: TextLang; label: string }>
                ).map((l) => (
                  <button
                    key={l.key}
                    onClick={() => setTextLang(l.key)}
                    className={`px-4 py-1.5 rounded-lg text-sm font-black transition-all ${
                      textLang === l.key ? 'bg-(--club) text-white shadow' : 'text-(--club-dark) hover:bg-white'
                    }`}
                  >
                    {l.label}
                  </button>
                ))}
              </div>
            </div>

            <div className="space-y-1.5">
              <Label>نص الكلمة ({textLang === 'ar' ? 'العربية' : textLang === 'fr' ? 'الفرنسية' : 'الإنجليزية'})</Label>
              <Textarea
                rows={5}
                value={presidentWord?.text?.[textLang] ?? ''}
                onChange={(e) => setPresidentText(textLang, e.target.value)}
                placeholder={
                  textLang === 'ar'
                    ? 'النادي ليس مجرد ملعب وقاعة، بل مدرسة للحياة...'
                    : textLang === 'fr'
                      ? 'Le club n\'est pas seulement un stade...'
                      : 'The club is not just a stadium...'
                }
              />
              <p className="text-[11px] text-muted-foreground">
                اللغة الفارغة تعود تلقائياً إلى النص الافتراضي للغة المطلوبة عند العرض.
              </p>
            </div>

            <Separator />

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-1.5">
                <Label className="flex items-center gap-1.5">
                  <UserRound className="h-4 w-4 text-(--club)" /> اسم الرئيس
                </Label>
                <Input
                  value={presidentWord?.name ?? ''}
                  onChange={(e) =>
                    setDraft({
                      ...draft,
                      content: {
                        ...draft.content,
                        presidentWord: { ...presidentWord, name: e.target.value },
                      },
                    })
                  }
                  placeholder="السيد عبد الرحمن بلقاسم"
                />
              </div>
              <div className="space-y-1.5">
                <Label className="flex items-center gap-1.5">
                  <Medal className="h-4 w-4 text-(--club)" /> الصفة
                </Label>
                <Input
                  value={presidentWord?.role ?? ''}
                  onChange={(e) =>
                    setDraft({
                      ...draft,
                      content: {
                        ...draft.content,
                        presidentWord: { ...presidentWord, role: e.target.value },
                      },
                    })
                  }
                  placeholder="رئيس النادي الرياضي الرائد"
                />
              </div>
            </div>
          </div>
        )}

        {/* ===== إحصائيات الصفحة الرئيسية ===== */}
        {tab === 'stats' && (
          <div className="space-y-6">
            <div className="flex items-start gap-3 rounded-2xl bg-(--club-light) border border-(--border) px-4 py-3">
              <Info className="h-5 w-5 text-(--club) shrink-0 mt-0.5" />
              <p className="text-xs md:text-sm font-bold text-(--club-dark) leading-relaxed">
                هذه الأرقام تظهر في شريط الإحصائيات وفي الواجهة الرئيسية. اترك أي خانة فارغة ليُحسب
                رقمها تلقائياً: عدد الفروع وعدد اللاعبين يُحسبان تلقائياً من الفروع المسجلة، وعدد
                الألقاب يُحسب من عدد الإنجازات المسجلة في تبويب «الإنجازات».
              </p>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="space-y-1.5">
                <Label className="font-bold text-sm text-(--club-dark)">سنة التأسيس</Label>
                <Input
                  type="number"
                  min={1900}
                  max={2100}
                  dir="ltr"
                  className="text-right"
                  value={numValue(stats.foundationYear)}
                  onChange={(e) => setStat('foundationYear', e.target.value)}
                  placeholder="افتراضي: 2024"
                />
              </div>
              <div className="space-y-1.5">
                <Label className="font-bold text-sm text-(--club-dark)">عدد المشجعين</Label>
                <Input
                  type="number"
                  min={0}
                  dir="ltr"
                  className="text-right"
                  value={numValue(stats.fansCount)}
                  onChange={(e) => setStat('fansCount', e.target.value)}
                  placeholder="افتراضي: 12500"
                />
              </div>
              <div className="space-y-1.5">
                <Label className="font-bold text-sm text-(--club-dark)">عدد الميداليات</Label>
                <Input
                  type="number"
                  min={0}
                  dir="ltr"
                  className="text-right"
                  value={numValue(stats.medalsCount)}
                  onChange={(e) => setStat('medalsCount', e.target.value)}
                  placeholder="افتراضي: 48"
                />
              </div>
              <div className="space-y-1.5">
                <Label className="font-bold text-sm text-(--club-dark)">عدد الألقاب</Label>
                <Input
                  type="number"
                  min={0}
                  dir="ltr"
                  className="text-right"
                  value={numValue(stats.titlesCount)}
                  onChange={(e) => setStat('titlesCount', e.target.value)}
                  placeholder={`فارغ = يُحسب تلقائياً (${data.achievements.length} حالياً)`}
                />
              </div>
            </div>

            <p className="text-xs text-muted-foreground">
              الحقول الفارغة تعني «حساب تلقائي» — ولن تُرسل أي قيمة يدوية في الإعدادات.
            </p>
          </div>
        )}

        {/* ===== الإنجازات ===== */}
        {tab === 'achievements' && (
          <div className="space-y-6">
            {/* نموذج الإضافة */}
            <div>
              <Label className="text-base font-black text-(--club-dark) flex items-center gap-1.5">
                <Plus className="h-4 w-4" /> تسجيل إنجاز جديد
              </Label>
              <p className="text-xs text-muted-foreground mt-1 mb-3">
                يظهر فوراً في قسم الإنجازات بالصفحة الرئيسية، ويدخل في حساب عدد الألقاب تلقائياً (ما لم
                تُحدد قيمة يدوية في تبويب الإحصائيات).
              </p>
              <AchievementFields form={form} setForm={setForm} branches={data.branches} />
              <Button
                onClick={addAchievement}
                disabled={adding}
                className="mt-3 bg-(--club) hover:bg-(--club)/90 text-white font-bold"
              >
                {adding ? <Loader2 className="h-4 w-4 animate-spin ml-1" /> : <Plus className="h-4 w-4 ml-1" />}
                تسجيل الإنجاز
              </Button>
            </div>

            <Separator />

            {/* قائمة الإنجازات */}
            <div>
              <Label className="text-base font-black text-(--club-dark) flex items-center gap-1.5">
                <Trophy className="h-4 w-4" /> الإنجازات المسجلة ({data.achievements.length})
              </Label>
              {!data.achievements.length ? (
                <p className="text-sm text-muted-foreground bg-muted/40 rounded-xl px-4 py-6 text-center mt-3">
                  لا إنجازات مسجلة بعد — سجّل أول إنجاز من النموذج أعلاه
                </p>
              ) : (
                <div className="space-y-2 mt-3">
                  {[...data.achievements]
                    .sort((a, b) => b.year.localeCompare(a.year))
                    .map((a) => (
                      <div
                        key={a.id}
                        className="flex items-center gap-3 rounded-xl border border-(--border) bg-paper/30 px-3 py-2.5"
                      >
                        <span className="bg-(--chip) text-(--primary) text-sm font-black px-3 py-0.5 rounded-full shrink-0">
                          {a.year}
                        </span>
                        {a.branch ? (
                          <span
                            className="text-white text-xs font-bold px-3 py-0.5 rounded-full shrink-0"
                            style={{ backgroundColor: a.branch.color }}
                          >
                            {a.branch.name}
                          </span>
                        ) : (
                          <span className="bg-(--primary) text-primary-foreground text-xs font-bold px-3 py-0.5 rounded-full shrink-0">
                            النادي
                          </span>
                        )}
                        <div className="min-w-0 flex-1">
                          <div className="text-sm font-black text-(--club-dark) truncate" dir="auto">
                            {a.title}
                          </div>
                          {a.description && (
                            <div className="text-xs text-muted-foreground truncate" dir="auto">
                              {a.description}
                            </div>
                          )}
                        </div>
                        <div className="flex gap-0.5 shrink-0">
                          <Button
                            size="icon"
                            variant="ghost"
                            className="h-8 w-8"
                            aria-label={`تعديل الإنجاز ${a.title}`}
                            onClick={() => openEdit(a)}
                          >
                            <Pencil className="h-4 w-4" />
                          </Button>
                          <Button
                            size="icon"
                            variant="ghost"
                            className="h-8 w-8 text-destructive"
                            aria-label={`حذف الإنجاز ${a.title}`}
                            onClick={() => void removeAchievement(a)}
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </div>
                      </div>
                    ))}
                </div>
              )}
            </div>
          </div>
        )}

        {/* حفظ الإعدادات — لتبويبي كلمة الرئيس والإحصائيات فقط */}
        {tab !== 'achievements' && (
          <div className="mt-6 pt-4 border-t border-(--border) flex items-center justify-end gap-2">
            <Button
              variant="outline"
              onClick={() => {
                setDraft(cloneSettings(data.settings))
                toast({ title: 'تمت استعادة الإعدادات المحفوظة' })
              }}
              disabled={saving}
            >
              <RotateCcw className="h-3.5 w-3.5 ml-1" /> تراجع
            </Button>
            <Button onClick={saveSettings} disabled={saving} className="bg-(--club) hover:bg-(--club)/90 text-white font-bold">
              {saving ? <Loader2 className="h-4 w-4 animate-spin ml-1" /> : <Save className="h-4 w-4 ml-1" />}
              حفظ المحتوى ونشره
            </Button>
          </div>
        )}
      </div>

      {/* نافذة تعديل إنجاز */}
      <Dialog open={!!editing} onOpenChange={(v) => !v && setEditing(null)}>
        <DialogContent className="max-h-[85vh] overflow-y-auto nice-scroll max-w-lg">
          <DialogHeader>
            <DialogTitle className="font-black text-(--club-dark)">تعديل الإنجاز</DialogTitle>
            <DialogDescription>عدّل بيانات الإنجاز ثم احفظ — تظهر التغييرات فوراً للزوار</DialogDescription>
          </DialogHeader>
          <AchievementFields form={editForm} setForm={setEditForm} branches={data.branches} />
          <Button
            onClick={saveEdit}
            disabled={savingEdit}
            className="w-full h-11 font-black bg-(--silver) hover:bg-(--silver)/85 text-(--club-dark)"
          >
            {savingEdit && <Loader2 className="h-4 w-4 animate-spin ml-2" />}
            {savingEdit ? 'جارٍ الحفظ...' : 'حفظ التعديلات'}
          </Button>
        </DialogContent>
      </Dialog>
    </div>
  )
}
