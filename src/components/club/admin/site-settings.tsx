'use client'

/**
 * إعدادات وتصميم الواجهة الرئيسية — تحكم كامل حسب الذوق:
 * اللون المميز، خلفية الواجهة (من معرض جاهز أو رابط مخصص)،
 * نصوص الواجهة وعناوين كل الأقسام بثلاث لغات (عربية/فرنسية/إنجليزية)،
 * معلومات التواصل، إظهار/إخفاء كل أقسام الموقع، واللغات المتاحة للزوار
 */

import { useEffect, useState } from 'react'
import {
  Loader2,
  Palette,
  Save,
  Globe,
  Type,
  Phone,
  LayoutGrid,
  RotateCcw,
  ImageIcon,
  Eye,
  EyeOff,
  Heading,
  ClipboardList,
  User,
  Info,
  Banknote,
  FileText,
  Scale,
  Plus,
  Trash2,
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import { Label } from '@/components/ui/label'
import { Badge } from '@/components/ui/badge'
import { Switch } from '@/components/ui/switch'
import { Separator } from '@/components/ui/separator'
import { Slider } from '@/components/ui/slider'
import { useToast } from '@/hooks/use-toast'
import { apiFetch } from '@/lib/session'
import { ACCENT_PRESETS, applyAccent, useSiteSettings, HERO_PRESETS, DEFAULT_HERO_IMAGE } from '../site-store'
import { DEFAULT_FORM_SETTINGS, FEES_NOTICE, mergeFormSettings } from '../enrollment-form'
import type { AdminData, EnrollmentFormSettings, SiteSettings, SectionKey } from '../types'

type SectionTab = 'design' | 'texts' | 'contact' | 'enrollment' | 'layout'
type TextLang = 'ar' | 'fr' | 'en'

const DEFAULT_SETTINGS: SiteSettings = {
  hero: {
    title1: { ar: 'النادي الرياضي', fr: 'Le club sportif', en: 'The Athletic Club' },
    titleGold: { ar: 'الرائد', fr: '« El Raed »', en: '« El Raed »' },
    subtitle: {
      ar: 'متعدد الرياضات — بلدية سعيدة',
      fr: 'Omnisports — Commune de Saïda',
      en: 'Omnisports — Municipality of Saïda',
    },
    desc: { ar: '', fr: '', en: '' },
    descTail: { ar: '', fr: '', en: '' },
  },
  about: { title: { ar: '', fr: '', en: '' } },
  contact: { address: '', phone: '', email: '', facebook: '', instagram: '', youtube: '' },
  enrollment: {
    adultAge: 18,
    showGender: true,
    showNote: true,
    requirePhone: true,
    requireAddress: true,
    guardianTitle: 'معلومات ولي الأمر',
    adultTitle: 'معلومات المنخرط الشخصية',
    notice: { ar: '', fr: '', en: '' },
    form: DEFAULT_FORM_SETTINGS,
  },
  design: {
    accent: 'silver',
    heroImage: DEFAULT_HERO_IMAGE,
    showStats: true,
    watermark: true,
    overlay: 0.62,
    season: '2026/2027',
  },
  sections: {
    about: true,
    branches: true,
    news: true,
    matches: true,
    achievements: true,
    gallery: true,
    videos: true,
    shop: true,
    join: true,
    contact: true,
  },
  texts: {},
  languages: { ar: true, fr: true, en: true },
}

function mergeDefaults(s: SiteSettings | null | undefined): SiteSettings {
  return {
    ...DEFAULT_SETTINGS,
    ...s,
    hero: { ...DEFAULT_SETTINGS.hero, ...s?.hero },
    about: { ...DEFAULT_SETTINGS.about, ...s?.about },
    contact: { ...DEFAULT_SETTINGS.contact, ...s?.contact },
    enrollment: { ...DEFAULT_SETTINGS.enrollment, ...s?.enrollment, form: mergeFormSettings(s?.enrollment?.form) },
    design: { ...DEFAULT_SETTINGS.design, ...s?.design },
    sections: { ...DEFAULT_SETTINGS.sections, ...s?.sections },
    texts: { ...s?.texts },
    languages: { ...DEFAULT_SETTINGS.languages, ...s?.languages },
  }
}

const HERO_FIELDS: Array<{ key: 'title1' | 'titleGold' | 'subtitle' | 'desc' | 'descTail'; label: string; multiline?: boolean }> = [
  { key: 'title1', label: 'العنوان الأول' },
  { key: 'titleGold', label: 'العنوان المميز (الملوّن)' },
  { key: 'subtitle', label: 'العنوان الفرعي' },
  { key: 'desc', label: 'النص التعريفي', multiline: true },
  { key: 'descTail', label: 'ذيل النص التعريفي' },
]

/** أقسام الصفحة الرئيسية — تُستخدم في مفاتيح الإظهار ومحرر العناوين */
const SECTION_DEFS: Array<{ key: SectionKey; label: string; hasTitleGold?: boolean }> = [
  { key: 'about', label: 'عن النادي' },
  { key: 'branches', label: 'فروعنا الرياضية' },
  { key: 'news', label: 'أخبار النادي' },
  { key: 'matches', label: 'المباريات والنتائج' },
  { key: 'achievements', label: 'الإنجازات' },
  { key: 'gallery', label: 'معرض الصور' },
  { key: 'shop', label: 'متجر النادي' },
  { key: 'join', label: 'إنضم إلى عائلة النادي', hasTitleGold: true },
  { key: 'contact', label: 'تواصل معنا' },
]

const SECTION_FIELD_LABELS: Record<'eyebrow' | 'title' | 'titleGold' | 'subtitle', string> = {
  eyebrow: 'الشارة العلوية (فوق العنوان)',
  title: 'العنوان الرئيسي',
  titleGold: 'الجزء الملوّن من العنوان',
  subtitle: 'العنوان الفرعي / الوصف',
}

export function SiteSettingsManager({ data, reload }: { data: AdminData; reload: () => void }) {
  const { toast } = useToast()
  const setGlobalSettings = useSiteSettings((s) => s.setSettings)
  const [tab, setTab] = useState<SectionTab>('design')
  const [textLang, setTextLang] = useState<TextLang>('ar')
  const [textsSection, setTextsSection] = useState<SectionKey>('about')
  const [saving, setSaving] = useState(false)
  const [draft, setDraft] = useState<SiteSettings>(() => mergeDefaults(data.settings))
  const [medicalBranch, setMedicalBranch] = useState<string>('')

  // إعادة التحميل بعد reload من الأعلى
  useEffect(() => {
    setDraft(mergeDefaults(data.settings))
  }, [data.settings])

  // معاينة حية للون المميز
  useEffect(() => {
    applyAccent(draft)
    return () => applyAccent(data.settings)
  }, [draft, data.settings])

  const save = async () => {
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
      toast({ title: 'تم حفظ إعدادات وتصميم الواجهة الرئيسية', description: 'التغييرات ظاهرة الآن للزوار' })
      reload()
    } catch (e) {
      toast({ title: e instanceof Error ? e.message : 'فشل الحفظ', variant: 'destructive' })
    } finally {
      setSaving(false)
    }
  }

  const resetTexts = () => {
    setDraft({ ...draft, hero: mergeDefaults(null).hero, about: mergeDefaults(null).about, texts: {} })
    toast({ title: 'تمت استعادة النصوص الافتراضية (لم تُحفظ بعد)' })
  }

  const setHero = (key: string, lang: TextLang, value: string) => {
    setDraft({
      ...draft,
      hero: { ...draft.hero, [key]: { ...draft.hero?.[key], [lang]: value } },
    })
  }

  /** ضبط حقل من حقول ترويسة قسم */
  const setSectionField = (
    sectionKey: SectionKey,
    field: 'eyebrow' | 'title' | 'titleGold' | 'subtitle',
    lang: TextLang,
    value: string
  ) => {
    setDraft({
      ...draft,
      texts: {
        ...draft.texts,
        [sectionKey]: {
          ...draft.texts?.[sectionKey],
          [field]: { ...draft.texts?.[sectionKey]?.[field], [lang]: value },
        },
      },
    })
  }

  const tabs: Array<{ key: SectionTab; label: string; icon: React.ComponentType<{ className?: string }> }> = [
    { key: 'design', label: 'الهوية والتصميم', icon: Palette },
    { key: 'texts', label: 'نصوص الواجهة والأقسام', icon: Type },
    { key: 'enrollment', label: 'استمارة الانخراط', icon: ClipboardList },
    { key: 'contact', label: 'معلومات التواصل', icon: Phone },
    { key: 'layout', label: 'الأقسام واللغات', icon: LayoutGrid },
  ]

  const overlay = draft.design?.overlay ?? 0.62
  const heroImage = draft.design?.heroImage?.trim() || DEFAULT_HERO_IMAGE
  const activeSectionDef = SECTION_DEFS.find((s) => s.key === textsSection) ?? SECTION_DEFS[0]

  return (
    <div>
      {/* رأس القسم */}
      <div className="rounded-3xl club-gradient p-5 md:p-6 mb-5 relative overflow-hidden">
        <div className="absolute -left-8 -bottom-8 h-36 w-36 rounded-full bg-(--silver)/10" />
        <div className="flex items-center gap-3">
          <Palette className="h-8 w-8 text-(--silver)" />
          <div>
            <h2 className="text-xl md:text-2xl font-black text-white">إعدادات وتصميم الواجهة الرئيسية</h2>
            <p className="text-white/70 text-sm mt-1 max-w-2xl leading-relaxed">
              صمّم واجهة موقع النادي حسب ذوقك: اللون المميز، خلفية الواجهة، نصوص الصفحة الرئيسية وعناوين كل
              الأقسام بثلاث لغات، معلومات التواصل، والأقسام الظاهرة — كل تغيير ينعكس فوراً على الموقع.
            </p>
          </div>
        </div>
        <div className="mt-4 flex flex-wrap gap-2">
          <Badge className="bg-(--silver) text-(--club-dark)">ثلاث لغات: عربية · فرنسية · إنجليزية</Badge>
          <Badge variant="outline" className="border-white/30 text-white/85">
            5 ألوان مميزة + 4 خلفيات جاهزة
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
        {/* ===== الهوية والتصميم ===== */}
        {tab === 'design' && (
          <div className="space-y-6">
            {/* خلفية الواجهة الرئيسية */}
            <div>
              <Label className="text-base font-black text-(--club-dark) flex items-center gap-1.5">
                <ImageIcon className="h-4 w-4" /> خلفية الواجهة الرئيسية (الملعب)
              </Label>
              <p className="text-xs text-muted-foreground mt-1 mb-3">
                اختر خلفية احترافية تعبّر عن كل الرياضات من المعرض الجاهز، أو أدخل رابط صورة مخصصة — وتحكّم
                في قتامة طبقة التعتيم لوضوح النصوص فوقها.
              </p>

              {/* معاينة حية */}
              <div className="relative rounded-2xl overflow-hidden border border-(--border) h-40 md:h-52 mb-4">
                <img src={heroImage} alt="معاينة خلفية الواجهة" className="h-full w-full object-cover" />
                <div
                  className="absolute inset-0 bg-gradient-to-t from-black/85 via-black/40 to-black/20"
                  style={{ opacity: overlay }}
                />
                <div className="absolute inset-0 flex flex-col items-center justify-center text-center px-4">
                  <span className="text-white/90 text-xs font-bold">معاينة حية</span>
                  <span className="text-white font-black text-lg md:text-2xl mt-1 drop-shadow">
                    النادي الرياضي <span className="text-(--silver)">الرائد</span>
                  </span>
                </div>
              </div>

              {/* المعرض الجاهز */}
              <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 mb-3">
                {HERO_PRESETS.map((p) => {
                  const active = heroImage === p.src
                  return (
                    <button
                      key={p.key}
                      onClick={() => setDraft({ ...draft, design: { ...draft.design, heroImage: p.src } })}
                      className={`rounded-2xl border-2 overflow-hidden text-right transition-all ${
                        active ? 'border-(--club) shadow-md scale-[1.02]' : 'border-(--border) hover:border-(--club)/40'
                      }`}
                      aria-pressed={active}
                    >
                      <div className="relative h-20">
                        <img src={p.src} alt={p.label} className="h-full w-full object-cover" />
                        {active && (
                          <span className="absolute top-1.5 left-1.5 bg-(--club) text-white text-[10px] font-black px-2 py-0.5 rounded-full">
                            مفعّلة ✓
                          </span>
                        )}
                      </div>
                      <div className="p-2">
                        <div className="text-xs font-black text-(--club-dark)">{p.label}</div>
                        <div className="text-[10px] text-muted-foreground leading-snug line-clamp-2 mt-0.5">{p.desc}</div>
                      </div>
                    </button>
                  )
                })}
              </div>

              {/* رابط مخصص */}
              <div className="max-w-lg">
                <Label className="text-sm font-bold">أو رابط صورة مخصص (يظهر تلقائياً في المعاينة)</Label>
                <Input
                  value={draft.design?.heroImage ?? ''}
                  onChange={(e) => setDraft({ ...draft, design: { ...draft.design, heroImage: e.target.value } })}
                  dir="ltr"
                  className="text-right mt-1.5"
                  placeholder="/images/hero-all-sports.jpg أو https://..."
                />
              </div>
            </div>

            <Separator />

            <div>
              <Label className="text-base font-black text-(--club-dark)">اللون المميز للموقع</Label>
              <p className="text-xs text-muted-foreground mt-1 mb-3">
                يُطبَّق فوراً على كل العناصر المميزة (الأزرار، العناوين، الشارات) في الواجهة الرئيسية.
              </p>
              <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3">
                {Object.entries(ACCENT_PRESETS).map(([key, p]) => (
                  <button
                    key={key}
                    onClick={() => setDraft({ ...draft, design: { ...draft.design, accent: key } })}
                    className={`rounded-2xl border-2 p-3 text-center transition-all ${
                      (draft.design?.accent ?? 'silver') === key
                        ? 'border-(--club) shadow-md scale-[1.02]'
                        : 'border-(--border) hover:border-(--club)/40'
                    }`}
                  >
                    <div
                      className="h-10 w-full rounded-xl mb-2 ring-1 ring-black/5"
                      style={{ background: `linear-gradient(120deg, ${p.light}, ${p.deep} 55%, ${p.light})` }}
                    />
                    <div className="text-xs font-black text-(--club-dark)">{p.label}</div>
                  </button>
                ))}
              </div>
            </div>

            <Separator />

            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <div>
                  <div className="font-bold text-sm text-(--club-dark)">شريط الإحصائيات في الواجهة</div>
                  <p className="text-xs text-muted-foreground mt-0.5">الأرقام الكبيرة أسفل الصفحة الرئيسية</p>
                </div>
                <Switch
                  checked={draft.design?.showStats !== false}
                  onCheckedChange={(v) => setDraft({ ...draft, design: { ...draft.design, showStats: v } })}
                />
              </div>
              <div className="flex items-center justify-between">
                <div>
                  <div className="font-bold text-sm text-(--club-dark)">العلامة المائية للشعار</div>
                  <p className="text-xs text-muted-foreground mt-0.5">شعار الدرع الخلفي في منتصف الواجهة</p>
                </div>
                <Switch
                  checked={draft.design?.watermark !== false}
                  onCheckedChange={(v) => setDraft({ ...draft, design: { ...draft.design, watermark: v } })}
                />
              </div>
              <div>
                <div className="font-bold text-sm text-(--club-dark) mb-2">
                  قتامة طبقة التعتيم على خلفية الواجهة: {Math.round(overlay * 100)}%
                </div>
                <Slider
                  value={[overlay * 100]}
                  min={35}
                  max={90}
                  step={1}
                  onValueChange={([v]) => setDraft({ ...draft, design: { ...draft.design, overlay: v / 100 } })}
                  className="max-w-md"
                />
              </div>
              <div className="max-w-md">
                <Label className="font-bold text-sm text-(--club-dark)">موسم الانخراط الظاهر في الاستمارة</Label>
                <p className="text-xs text-muted-foreground mt-0.5 mb-2">
                  يظهر في شارة استمارة طلب الانخراط النهاري (مثال: 2026/2027)
                </p>
                <Input
                  value={draft.design?.season ?? ''}
                  onChange={(e) => setDraft({ ...draft, design: { ...draft.design, season: e.target.value } })}
                  placeholder="2026/2027"
                  dir="ltr"
                  className="text-right"
                />
              </div>
            </div>
          </div>
        )}

        {/* ===== نصوص الواجهة والأقسام ===== */}
        {tab === 'texts' && (
          <div className="space-y-6">
            <div className="flex flex-wrap items-center justify-between gap-2">
              {/* مبدّل لغة النصوص */}
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
              <Button variant="outline" size="sm" onClick={resetTexts}>
                <RotateCcw className="h-3.5 w-3.5 ml-1" /> استعادة الافتراضي
              </Button>
            </div>

            {/* نصوص الواجهة (Hero) */}
            <div>
              <Label className="text-sm font-black text-(--club-dark) uppercase tracking-wide">
                نصوص الواجهة الرئيسية (Hero)
              </Label>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-3">
                {HERO_FIELDS.map((f) => (
                  <div key={f.key} className={`space-y-1.5 ${f.multiline ? 'md:col-span-2' : ''}`}>
                    <Label>{f.label}</Label>
                    {f.multiline ? (
                      <Textarea
                        rows={3}
                        value={draft.hero?.[f.key]?.[textLang] ?? ''}
                        onChange={(e) => setHero(f.key, textLang, e.target.value)}
                      />
                    ) : (
                      <Input
                        value={draft.hero?.[f.key]?.[textLang] ?? ''}
                        onChange={(e) => setHero(f.key, textLang, e.target.value)}
                      />
                    )}
                  </div>
                ))}
                <div className="space-y-1.5 md:col-span-2">
                  <Label>عنوان قسم «عن النادي»</Label>
                  <Input
                    value={draft.about?.title?.[textLang] ?? ''}
                    onChange={(e) =>
                      setDraft({
                        ...draft,
                        about: { ...draft.about, title: { ...draft.about?.title, [textLang]: e.target.value } },
                      })
                    }
                  />
                </div>
              </div>
            </div>

            <Separator />

            {/* عناوين الأقسام */}
            <div>
              <Label className="text-sm font-black text-(--club-dark) flex items-center gap-1.5">
                <Heading className="h-4 w-4" /> عناوين أقسام الصفحة الرئيسية
              </Label>
              <p className="text-xs text-muted-foreground mt-1 mb-3">
                اختر قسماً ثم اكتب عناوينه حسب ذوقك — الحقل الفارغ يعود للنص الافتراضي.
              </p>

              {/* منتقي الأقسام */}
              <div className="flex flex-wrap gap-1.5 mb-4">
                {SECTION_DEFS.map((s) => (
                  <button
                    key={s.key}
                    onClick={() => setTextsSection(s.key)}
                    className={`px-3.5 py-1.5 rounded-full text-xs font-black transition-all ${
                      textsSection === s.key
                        ? 'bg-(--club) text-white shadow'
                        : 'bg-(--club-light) text-(--club-dark) hover:bg-(--accent)'
                    }`}
                  >
                    {s.label}
                  </button>
                ))}
              </div>

              {/* حقول القسم المحدد */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {(['eyebrow', 'title', ...(activeSectionDef.hasTitleGold ? (['titleGold'] as const) : []), 'subtitle'] as Array<
                  'eyebrow' | 'title' | 'titleGold' | 'subtitle'
                >).map((field) => (
                  <div key={field} className={`space-y-1.5 ${field === 'subtitle' ? 'md:col-span-2' : ''}`}>
                    <Label>{SECTION_FIELD_LABELS[field]}</Label>
                    <Input
                      value={draft.texts?.[textsSection]?.[field]?.[textLang] ?? ''}
                      onChange={(e) => setSectionField(textsSection, field, textLang, e.target.value)}
                      placeholder={`افتراضي: حسب اللغة (${textLang.toUpperCase()})`}
                    />
                  </div>
                ))}
              </div>
            </div>

            <p className="text-xs text-muted-foreground">
              الحقول الفارغة تعود تلقائياً إلى النصوص الافتراضية للغة المختارة.
            </p>
          </div>
        )}

        {/* ===== استمارة الانخراط ===== */}
        {tab === 'enrollment' && (
          <div className="space-y-6">
            <div className="flex items-start gap-3 rounded-2xl bg-(--club-light) border border-(--border) px-4 py-3">
              <ClipboardList className="h-5 w-5 text-(--club) shrink-0 mt-0.5" />
              <p className="text-xs md:text-sm font-bold text-(--club-dark) leading-relaxed">
                هذه الإعدادات تتحكم في نافذة «استمارة طلب الانخراط» الظاهرة للزوار: سن الرشد الذي يُبنى عليه
                عرض الخانات، إظهار وإلزامية الحقول، عناوين الأقسام، وإشعار يظهر أعلى الاستمارة.
              </p>
            </div>

            {/* سن الرشد */}
            <div className="max-w-md">
              <Label className="font-bold text-sm text-(--club-dark)">سن الرشد (يُبنى عليه عرض الخانات)</Label>
              <p className="text-xs text-muted-foreground mt-0.5 mb-2">
                المنخرط الأصغر من هذا العمر تظهر له خانات «معلومات ولي الأمر»، وما فوقه تظهر له خاناته
                الشخصية (العنوان، رقم البطاقة، الهاتف). الافتراضي: 18 سنة.
              </p>
              <Input
                type="number"
                min={10}
                max={25}
                dir="ltr"
                className="text-right"
                value={draft.enrollment?.adultAge ?? 18}
                onChange={(e) =>
                  setDraft({
                    ...draft,
                    enrollment: { ...draft.enrollment, adultAge: Math.max(1, Number(e.target.value) || 18) },
                  })
                }
              />
            </div>

            <Separator />

            {/* إظهار الحقول */}
            <div>
              <Label className="text-base font-black text-(--club-dark)">إظهار الحقول</Label>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 mt-3">
                {(
                  [
                    { key: 'showGender', label: 'خانة الجنس', icon: User },
                    { key: 'showNote', label: 'خانة الملاحظات', icon: ClipboardList },
                  ] as Array<{ key: 'showGender' | 'showNote'; label: string; icon: React.ComponentType<{ className?: string }> }>
                ).map((f) => (
                  <div key={f.key} className="flex items-center justify-between rounded-xl border border-(--border) p-3.5">
                    <span className="font-bold text-sm text-(--club-dark) flex items-center gap-1.5">
                      <f.icon className="h-4 w-4 text-(--club)" />
                      {f.label}
                    </span>
                    <Switch
                      checked={draft.enrollment?.[f.key] !== false}
                      onCheckedChange={(v) =>
                        setDraft({ ...draft, enrollment: { ...draft.enrollment, [f.key]: v } })
                      }
                    />
                  </div>
                ))}
              </div>
            </div>

            {/* إلزامية الحقول */}
            <div>
              <Label className="text-base font-black text-(--club-dark)">الحقول الإلزامية</Label>
              <p className="text-xs text-muted-foreground mt-1 mb-3">
                الحقول الإلزامية لا يُقبل الطلب بدون تعبئتها (ينطبق على ولي الأمر للأقل من سن الرشد).
              </p>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                {(
                  [
                    { key: 'requirePhone', label: 'رقم الهاتف' },
                    { key: 'requireAddress', label: 'العنوان' },
                  ] as Array<{ key: 'requirePhone' | 'requireAddress'; label: string }>
                ).map((f) => (
                  <div key={f.key} className="flex items-center justify-between rounded-xl border border-(--border) p-3.5">
                    <span className="font-bold text-sm text-(--club-dark)">{f.label}</span>
                    <Switch
                      checked={draft.enrollment?.[f.key] === true}
                      onCheckedChange={(v) =>
                        setDraft({ ...draft, enrollment: { ...draft.enrollment, [f.key]: v } })
                      }
                    />
                  </div>
                ))}
              </div>
            </div>

            <Separator />

            {/* عناوين الأقسام */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-1.5">
                <Label className="font-bold text-sm text-(--club-dark)">عنوان قسم معلومات ولي الأمر</Label>
                <Input
                  value={draft.enrollment?.guardianTitle ?? ''}
                  onChange={(e) =>
                    setDraft({ ...draft, enrollment: { ...draft.enrollment, guardianTitle: e.target.value } })
                  }
                  placeholder="معلومات ولي الأمر"
                />
              </div>
              <div className="space-y-1.5">
                <Label className="font-bold text-sm text-(--club-dark)">عنوان قسم معلومات المنخرط البالغ</Label>
                <Input
                  value={draft.enrollment?.adultTitle ?? ''}
                  onChange={(e) =>
                    setDraft({ ...draft, enrollment: { ...draft.enrollment, adultTitle: e.target.value } })
                  }
                  placeholder="معلومات المنخرط الشخصية"
                />
              </div>
            </div>

            <Separator />

            {/* إشعار أعلى الاستمارة بثلاث لغات */}
            <div>
              <Label className="text-base font-black text-(--club-dark) flex items-center gap-1.5">
                <Info className="h-4 w-4" /> إشعار يظهر أعلى الاستمارة (اختياري — بثلاث لغات)
              </Label>
              <p className="text-xs text-muted-foreground mt-1 mb-3">
                مثال: «التسجيل مجاني للموسم الجديد — التوقيت من 09:00 إلى 14:00 بمقر النادي». اتركه فارغاً لإخفائه.
              </p>
              <div className="space-y-3">
                {(
                  [
                    { key: 'ar', label: 'العربية' },
                    { key: 'fr', label: 'Français' },
                    { key: 'en', label: 'English' },
                  ] as Array<{ key: TextLang; label: string }>
                ).map((l) => (
                  <div key={l.key} className="space-y-1.5">
                    <Label className="text-xs font-black text-muted-foreground">{l.label}</Label>
                    <Textarea
                      rows={2}
                      value={draft.enrollment?.notice?.[l.key] ?? ''}
                      onChange={(e) =>
                        setDraft({
                          ...draft,
                          enrollment: {
                            ...draft.enrollment,
                            notice: { ...draft.enrollment?.notice, [l.key]: e.target.value },
                          },
                        })
                      }
                    />
                  </div>
                ))}
              </div>
            </div>

            <Separator />

            {/* ===== الاستمارة المطبوعة A4 — تُدار من حساب الإدارة ===== */}
            <div>
              <Label className="text-base font-black text-(--club-dark) flex items-center gap-1.5">
                <FileText className="h-4 w-4" /> الاستمارة المطبوعة A4 — استمارة الانخراط الرسمية
              </Label>
              <p className="text-xs text-muted-foreground mt-1 mb-3 leading-relaxed">
                استمارة موحدة لجميع الرياضات تُطبع صفحة A4 واحدة بعد تسجيل أي منخرط (ولأي منخرط
                قديم من صفحة الطلبات): معلومات المنخرط تلقائياً من ملفه، الشهادة الطبية يملؤها
                الطبيب، التصريح الأبوي للقاصرين، ورسوم الاشتراك والتأمين للفروع المعنية فقط، مع
                القوانين الأساسية ومعلومات النادي.
              </p>

              {/* الحقول الظاهرة على الاستمارة */}
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                {(
                  [
                    { key: 'showBirthPlace', label: 'مكان الميلاد' },
                    { key: 'showSpecialty', label: 'التخصص / الفئة' },
                    { key: 'showBloodType', label: 'فصيلة الدم' },
                  ] as Array<{ key: keyof EnrollmentFormSettings; label: string }>
                ).map((f) => (
                  <div key={String(f.key)} className="flex items-center justify-between rounded-xl border border-(--border) p-3.5">
                    <span className="font-bold text-sm text-(--club-dark)">{f.label}</span>
                    <Switch
                      checked={(draft.enrollment?.form as unknown as Record<string, boolean>)?.[f.key as string] !== false}
                      onCheckedChange={(v) =>
                        setDraft({
                          ...draft,
                          enrollment: {
                            ...draft.enrollment,
                            form: { ...mergeFormSettings(draft.enrollment?.form), [f.key]: v },
                          },
                        })
                      }
                    />
                  </div>
                ))}
              </div>

              {/* رسوم الاشتراك والتأمين لكل فرع */}
              <div className="mt-5 rounded-2xl border border-(--border) overflow-hidden">
                <div className="bg-(--club-light) px-4 py-2.5 flex items-center gap-2">
                  <Banknote className="h-4 w-4 text-(--club)" />
                  <span className="font-black text-sm text-(--club-dark)">رسوم الاشتراك والتأمين — لكل فرع</span>
                </div>
                <p className="text-[11px] text-muted-foreground px-4 py-2 leading-relaxed border-b border-(--border)">
                  فعّل الرسوم للفروع المعنية فقط (مثل السباحة) وحدّد المبالغ بالدينار. الفروع غير
                  المفعّلة لا يظهر قسم الرسوم في استمارتها إطلاقاً.
                </p>
                <div className="divide-y divide-(--border) max-h-72 overflow-y-auto nice-scroll">
                  {data.branches.map((b) => {
                    const f = mergeFormSettings(draft.enrollment?.form).fees[b.slug] ?? {
                      enabled: false,
                      subscription: 0,
                      insurance: 0,
                    }
                    const setFee = (patch: Partial<typeof f>) =>
                      setDraft({
                        ...draft,
                        enrollment: {
                          ...draft.enrollment,
                          form: {
                            ...mergeFormSettings(draft.enrollment?.form),
                            fees: {
                              ...mergeFormSettings(draft.enrollment?.form).fees,
                              [b.slug]: { ...f, ...patch },
                            },
                          },
                        },
                      })
                    return (
                      <div key={b.id} className="flex flex-wrap items-center gap-3 px-4 py-2.5">
                        <span
                          className="h-2.5 w-2.5 rounded-full shrink-0"
                          style={{ backgroundColor: b.color }}
                          aria-hidden
                        />
                        <span className="font-bold text-sm text-(--club-dark) min-w-28 flex-1">{b.name}</span>
                        <label className="flex items-center gap-1.5 text-xs font-bold text-muted-foreground cursor-pointer">
                          <Switch checked={f.enabled} onCheckedChange={(v) => setFee({ enabled: v })} />
                          معني بالرسوم
                        </label>
                        {f.enabled && (
                          <>
                            <label className="flex items-center gap-1 text-xs font-bold">
                              الاشتراك
                              <Input
                                type="number"
                                min={0}
                                dir="ltr"
                                className="w-24 h-8 text-right"
                                value={f.subscription || 0}
                                onChange={(e) => setFee({ subscription: Math.max(0, Number(e.target.value) || 0) })}
                              />
                              دج
                            </label>
                            <label className="flex items-center gap-1 text-xs font-bold">
                              التأمين
                              <Input
                                type="number"
                                min={0}
                                dir="ltr"
                                className="w-24 h-8 text-right"
                                value={f.insurance || 0}
                                onChange={(e) => setFee({ insurance: Math.max(0, Number(e.target.value) || 0) })}
                              />
                              دج
                            </label>
                          </>
                        )}
                      </div>
                    )
                  })}
                </div>
                <div className="px-4 py-2.5 border-t border-(--border) bg-neutral-50">
                  <div className="space-y-1.5">
                    <Label className="text-xs font-black text-muted-foreground">معلومات الحساب البنكي للجمعية (اختياري — يظهر في قسم الرسوم)</Label>
                    <Input
                      value={mergeFormSettings(draft.enrollment?.form).bankInfo}
                      onChange={(e) =>
                        setDraft({
                          ...draft,
                          enrollment: {
                            ...draft.enrollment,
                            form: { ...mergeFormSettings(draft.enrollment?.form), bankInfo: e.target.value },
                          },
                        })
                      }
                      placeholder="مثال: CCP 000123 سعيدة / أو رقم الحساب البنكي"
                      className="text-right"
                    />
                    <p className="text-[10px] font-bold text-neutral-600 bg-white border border-(--border) rounded-lg px-3 py-2 leading-relaxed">
                      العبارة المطبوعة ثابتاً في قسم الرسوم: «{FEES_NOTICE}»
                    </p>
                  </div>
                </div>
              </div>

              {/* التصريح الأبوي */}
              <div className="mt-5 space-y-1.5">
                <Label className="font-bold text-sm text-(--club-dark)">نص التصريح الأبوي (يظهر للقاصرين فقط)</Label>
                <Textarea
                  rows={3}
                  value={mergeFormSettings(draft.enrollment?.form).parentalText}
                  onChange={(e) =>
                    setDraft({
                      ...draft,
                      enrollment: {
                        ...draft.enrollment,
                        form: { ...mergeFormSettings(draft.enrollment?.form), parentalText: e.target.value },
                      },
                    })
                  }
                />
              </div>

              {/* الصيغة الطبية */}
              <div className="mt-5 grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-1.5">
                  <Label className="font-bold text-sm text-(--club-dark)">الصيغة الطبية الافتراضية (إرشادية — اختياري)</Label>
                  <p className="text-[11px] text-muted-foreground">
                    نص خافت يُطبع داخل مربع الشهادة الطبية كإرشاد للطبيب. لا يُطبّق أي تصريح
                    «سليم طبياً» تلقائياً — الطبيب هو من يملأ ويوقّع ويختم.
                  </p>
                  <Textarea
                    rows={3}
                    value={mergeFormSettings(draft.enrollment?.form).medicalDefault}
                    onChange={(e) =>
                      setDraft({
                        ...draft,
                        enrollment: {
                          ...draft.enrollment,
                          form: { ...mergeFormSettings(draft.enrollment?.form), medicalDefault: e.target.value },
                        },
                      })
                    }
                    placeholder="اتركه فارغاً ليملأ الطبيب التصريح بحرية كاملة"
                  />
                </div>
                <div className="space-y-1.5">
                  <Label className="font-bold text-sm text-(--club-dark)">صيغة خاصة بفرع معين (حسب متطلبات الرياضة)</Label>
                  <select
                    value={medicalBranch}
                    onChange={(e) => setMedicalBranch(e.target.value)}
                    className="w-full h-9 rounded-md border border-(--border) bg-white px-2 text-sm font-bold text-right"
                    aria-label="اختيار الفرع للصيغة الطبية الخاصة"
                  >
                    <option value="">— اختر فرعاً —</option>
                    {data.branches.map((b) => (
                      <option key={b.id} value={b.slug}>
                        {b.name}
                      </option>
                    ))}
                  </select>
                  {medicalBranch && (
                    <Textarea
                      rows={3}
                      value={mergeFormSettings(draft.enrollment?.form).medicalByBranch[medicalBranch] ?? ''}
                      onChange={(e) =>
                        setDraft({
                          ...draft,
                          enrollment: {
                            ...draft.enrollment,
                            form: {
                              ...mergeFormSettings(draft.enrollment?.form),
                              medicalByBranch: {
                                ...mergeFormSettings(draft.enrollment?.form).medicalByBranch,
                                [medicalBranch]: e.target.value,
                              },
                            },
                          },
                        })
                      }
                      placeholder="مثال: شهادة طبية تثبت القدرة على ممارسة السباحة..."
                    />
                  )}
                </div>
              </div>

              {/* القوانين الأساسية */}
              <div className="mt-5 rounded-2xl border border-(--border) overflow-hidden">
                <div className="bg-(--club-light) px-4 py-2.5 flex items-center justify-between gap-2">
                  <div className="flex items-center gap-2">
                    <Scale className="h-4 w-4 text-(--club)" />
                    <span className="font-black text-sm text-(--club-dark)">القوانين الأساسية للنادي (نقاط مختصرة)</span>
                  </div>
                  <Button
                    size="sm"
                    variant="outline"
                    className="font-bold h-8"
                    onClick={() =>
                      setDraft({
                        ...draft,
                        enrollment: {
                          ...draft.enrollment,
                          form: {
                            ...mergeFormSettings(draft.enrollment?.form),
                            rules: [...mergeFormSettings(draft.enrollment?.form).rules, ''],
                          },
                        },
                      })
                    }
                  >
                    <Plus className="h-3.5 w-3.5 ml-1" /> إضافة قانون
                  </Button>
                </div>
                <div className="p-3 space-y-2">
                  {mergeFormSettings(draft.enrollment?.form).rules.map((r, i) => (
                    <div key={i} className="flex items-center gap-2">
                      <span className="text-xs font-black text-muted-foreground w-5 text-center">{i + 1}</span>
                      <Input
                        value={r}
                        onChange={(e) => {
                          const rules = [...mergeFormSettings(draft.enrollment?.form).rules]
                          rules[i] = e.target.value
                          setDraft({
                            ...draft,
                            enrollment: {
                              ...draft.enrollment,
                              form: { ...mergeFormSettings(draft.enrollment?.form), rules },
                            },
                          })
                        }}
                        className="bg-white text-right text-sm"
                      />
                      <Button
                        size="icon"
                        variant="ghost"
                        aria-label={`حذف القانون ${i + 1}`}
                        className="text-destructive shrink-0"
                        onClick={() => {
                          const rules = mergeFormSettings(draft.enrollment?.form).rules.filter((_, j) => j !== i)
                          setDraft({
                            ...draft,
                            enrollment: {
                              ...draft.enrollment,
                              form: { ...mergeFormSettings(draft.enrollment?.form), rules },
                            },
                          })
                        }}
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  ))}
                  {mergeFormSettings(draft.enrollment?.form).rules.length === 0 && (
                    <p className="text-xs text-muted-foreground text-center py-2">
                      لا توجد قوانين — لن يُطبع قسم القوانين. اضغط «إضافة قانون».
                    </p>
                  )}
                </div>
              </div>
            </div>
          </div>
        )}
        {tab === 'contact' && (
          <div className="space-y-6">
            <p className="text-xs md:text-sm font-bold text-muted-foreground leading-relaxed">
              هذه المعلومات تظهر في قسم «تواصل مع النادي» بالواجهة الرئيسية وفي تذييل الموقع. لكل خانة
              سطر واحد — لعرض عدة أرقام أو عدة بريدات اكتب كل واحد في سطر مستقل.
            </p>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-1.5 md:col-span-2">
                <Label>العنوان (كل سطر يظهر كسطر مستقل في البطاقة)</Label>
                <Textarea
                  rows={2}
                  value={(draft.contact?.addressLines?.length ? draft.contact.addressLines.join('\n') : draft.contact?.address ?? '').replace(/\n+/g, '\n')}
                  onChange={(e) => {
                    const lines = e.target.value.split('\n').map((l) => l.trim()).filter(Boolean)
                    setDraft({
                      ...draft,
                      contact: {
                        ...draft.contact,
                        address: e.target.value,
                        addressLines: lines,
                      },
                    })
                  }}
                  placeholder={'حي الملعب\nبلدية سعيدة، ولاية سعيدة، الجزائر'}
                />
              </div>
              <div className="space-y-1.5">
                <Label>أرقام الهاتف (رقم في كل سطر)</Label>
                <Textarea
                  rows={3}
                  dir="ltr"
                  className="text-right"
                  value={
                    draft.contact?.phones?.length
                      ? draft.contact.phones.join('\n')
                      : draft.contact?.phone
                        ? draft.contact.phone + '\n'
                        : ''
                  }
                  onChange={(e) => {
                    const phones = e.target.value.split('\n').map((l) => l.trim()).filter(Boolean)
                    setDraft({
                      ...draft,
                      contact: { ...draft.contact, phones, phone: phones[0] ?? '' },
                    })
                  }}
                  placeholder={'0770 12 34 56\n0555 98 76 54'}
                />
              </div>
              <div className="space-y-1.5">
                <Label>البريد الإلكتروني (بريد في كل سطر)</Label>
                <Textarea
                  rows={3}
                  dir="ltr"
                  className="text-right"
                  value={
                    draft.contact?.emails?.length
                      ? draft.contact.emails.join('\n')
                      : draft.contact?.email
                        ? draft.contact.email + '\n'
                        : ''
                  }
                  onChange={(e) => {
                    const emails = e.target.value.split('\n').map((l) => l.trim()).filter(Boolean)
                    setDraft({
                      ...draft,
                      contact: { ...draft.contact, emails, email: emails[0] ?? '' },
                    })
                  }}
                  placeholder={'contact@raed-saida.dz\ninfo@raed-saida.dz'}
                />
              </div>
              <div className="space-y-1.5">
                <Label>رابط فيسبوك</Label>
                <Input
                  dir="ltr"
                  className="text-left"
                  value={draft.contact?.facebook ?? ''}
                  onChange={(e) => setDraft({ ...draft, contact: { ...draft.contact, facebook: e.target.value } })}
                  placeholder="https://facebook.com/..."
                />
              </div>
              <div className="space-y-1.5">
                <Label>رابط إنستغرام</Label>
                <Input
                  dir="ltr"
                  className="text-left"
                  value={draft.contact?.instagram ?? ''}
                  onChange={(e) => setDraft({ ...draft, contact: { ...draft.contact, instagram: e.target.value } })}
                  placeholder="https://instagram.com/..."
                />
              </div>
              <div className="space-y-1.5 md:col-span-2">
                <Label>رابط يوتيوب (اختياري)</Label>
                <Input
                  dir="ltr"
                  className="text-left"
                  value={draft.contact?.youtube ?? ''}
                  onChange={(e) => setDraft({ ...draft, contact: { ...draft.contact, youtube: e.target.value } })}
                  placeholder="https://youtube.com/@..."
                />
              </div>
            </div>
          </div>
        )}

        {/* ===== الأقسام واللغات ===== */}
        {tab === 'layout' && (
          <div className="space-y-6">
            <div>
              <Label className="text-base font-black text-(--club-dark)">الأقسام الظاهرة في الموقع</Label>
              <p className="text-xs text-muted-foreground mt-1 mb-3">
                أخفِ أي قسم لا تحتاجه حالياً — يظهر مجدداً بمجرد تشغيله. (إظهار وإخفاء الفروع نفسها من تبويب
                «الفروع»)
              </p>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                {SECTION_DEFS.map((s) => (
                  <div key={s.key} className="flex items-center justify-between rounded-xl border border-(--border) p-3.5">
                    <span className="font-bold text-sm text-(--club-dark)">{s.label}</span>
                    <div className="flex items-center gap-2">
                      {draft.sections?.[s.key] === false ? (
                        <EyeOff className="h-4 w-4 text-muted-foreground" />
                      ) : (
                        <Eye className="h-4 w-4 text-green-600" />
                      )}
                      <Switch
                        checked={draft.sections?.[s.key] !== false}
                        onCheckedChange={(v) => setDraft({ ...draft, sections: { ...draft.sections, [s.key]: v } })}
                        aria-label={`إظهار قسم ${s.label}`}
                      />
                    </div>
                  </div>
                ))}
                {/* إظهار الفيديوهات داخل المعرض */}
                <div className="flex items-center justify-between rounded-xl border border-(--border) p-3.5">
                  <span className="font-bold text-sm text-(--club-dark)">الفيديوهات (داخل المعرض)</span>
                  <Switch
                    checked={draft.sections?.videos !== false}
                    onCheckedChange={(v) => setDraft({ ...draft, sections: { ...draft.sections, videos: v } })}
                  />
                </div>
              </div>
            </div>

            <Separator />

            <div>
              <Label className="text-base font-black text-(--club-dark) flex items-center gap-1.5">
                <Globe className="h-4 w-4" /> اللغات المتاحة للزوار
              </Label>
              <p className="text-xs text-muted-foreground mt-1 mb-3">
                مبدّل اللغة في شريط التنقل يعرض فقط اللغات المفعّلة (العربية دائماً متاحة).
              </p>
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                {(
                  [
                    { key: 'ar', label: 'العربية', fixed: true },
                    { key: 'fr', label: 'Français', fixed: false },
                    { key: 'en', label: 'English', fixed: false },
                  ] as Array<{ key: 'ar' | 'fr' | 'en'; label: string; fixed: boolean }>
                ).map((l) => (
                  <div key={l.key} className="flex items-center justify-between rounded-xl border border-(--border) p-3.5">
                    <span className="font-bold text-sm text-(--club-dark)">{l.label}</span>
                    <Switch
                      checked={l.key === 'ar' ? true : draft.languages?.[l.key] !== false}
                      disabled={l.fixed}
                      onCheckedChange={(v) => setDraft({ ...draft, languages: { ...draft.languages, [l.key]: v } })}
                    />
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}

        {/* حفظ */}
        <div className="mt-6 pt-4 border-t border-(--border) flex items-center justify-end gap-2">
          <Button
            variant="outline"
            onClick={() => {
              setDraft(mergeDefaults(data.settings))
              toast({ title: 'تمت استعادة الإعدادات المحفوظة' })
            }}
            disabled={saving}
          >
            تراجع
          </Button>
          <Button onClick={save} disabled={saving} className="bg-(--club) hover:bg-(--club)/90 text-white font-bold">
            {saving ? <Loader2 className="h-4 w-4 animate-spin ml-1" /> : <Save className="h-4 w-4 ml-1" />}
            حفظ الإعدادات ونشرها
          </Button>
        </div>
      </div>
    </div>
  )
}
