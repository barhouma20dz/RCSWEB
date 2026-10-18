'use client'

/**
 * مخزن إعدادات الموقع — يغذي الواجهة الرئيسية بإعدادات الإدارة
 * (نصوص Hero حسب اللغة، عناوين الأقسام، خلفية الواجهة، معلومات التواصل،
 * اللون المميز، إظهار الأقسام، اللغات المتاحة)
 */

import { create } from 'zustand'
import { useLang } from './i18n'
import type { SiteSettings } from './types'

/** خلفيات الواجهة الرئيسية الجاهزة — يختار منها الإدارة أو يُدخل رابطاً مخصصاً */
export const HERO_PRESETS: Array<{ key: string; label: string; src: string; desc: string }> = [
  {
    key: 'all-sports',
    label: 'كل الرياضات',
    src: '/images/hero-all-sports.jpg',
    desc: 'لوحة تجمع كل فروع النادي: كرة القدم، السلة، اليد، السباحة، ألعاب القوى، الكاراتيه، الشطرنج',
  },
  {
    key: 'stadium-night',
    label: 'ملعب الليل',
    src: '/images/hero-stadium-night.jpg',
    desc: 'ملعب مضاء بمناراته مع نخب الرياضيين في الحركة',
  },
  {
    key: 'abstract-sports',
    label: 'زخرفة رياضية',
    src: '/images/hero-abstract-sports.jpg',
    desc: 'خلفية مجردة أنيقة بأدوات رياضية — مثالية لوضوح النصوص',
  },
  {
    key: 'classic',
    label: 'الملعب الكلاسيكي',
    src: '/images/hero.jpg',
    desc: 'الخلفية الأصلية لملعب النادي',
  },
]

/** الخلفية الافتراضية عند غياب الإعداد */
export const DEFAULT_HERO_IMAGE = '/images/hero-all-sports.jpg'

/** لوحات الألوان المميزة الجاهزة — تُطبق على متغيرات CSS مباشرة */
export const ACCENT_PRESETS: Record<
  string,
  { label: string; silver: string; silverSoft: string; light: string; deep: string; deep2: string }
> = {
  silver: {
    label: 'فضي معدني',
    silver: '#d6dce8',
    silverSoft: '#eef1f7',
    light: '#f4f7fc',
    deep: '#aeb9cd',
    deep2: '#93a1ba',
  },
  gold: {
    label: 'ذهبي فاخر',
    silver: '#e0c36a',
    silverSoft: '#f6e7b8',
    light: '#ffe9a8',
    deep: '#c39a3a',
    deep2: '#9a7a25',
  },
  red: {
    label: 'أحمر جزائري',
    silver: '#ef8296',
    silverSoft: '#ffd9de',
    light: '#ffc2cb',
    deep: '#d21034',
    deep2: '#a30c28',
  },
  green: {
    label: 'أخضر جزائري',
    silver: '#7fd6a4',
    silverSoft: '#d3f3e1',
    light: '#b7ecd0',
    deep: '#006233',
    deep2: '#0a4f2f',
  },
  rose: {
    label: 'وردي ملكي',
    silver: '#f2a7c3',
    silverSoft: '#ffdfea',
    light: '#ffc9dd',
    deep: '#d1568b',
    deep2: '#a83a68',
  },
}

/** تطبيق اللون المميز على متغيرات CSS الجذر */
export function applyAccent(settings: SiteSettings | null | undefined) {
  if (typeof document === 'undefined') return
  const root = document.documentElement
  const preset =
    ACCENT_PRESETS[settings?.design?.accent ?? 'silver'] ?? ACCENT_PRESETS.silver
  root.style.setProperty('--silver', preset.silver)
  root.style.setProperty('--silver-soft', preset.silverSoft)
  root.style.setProperty('--accent-light', preset.light)
  root.style.setProperty('--accent-deep', preset.deep)
  root.style.setProperty('--accent-deep2', preset.deep2)
}

interface SiteState {
  settings: SiteSettings | null
  setSettings: (s: SiteSettings | null) => void
}

export const useSiteSettings = create<SiteState>((set) => ({
  settings: null,
  setSettings: (settings) => {
    set({ settings })
    applyAccent(settings)
  },
}))

/** نص متعدد اللغات من الإعدادات مع قيمة احتياطية */
export function siteText(
  map: Partial<Record<string, string>> | undefined,
  lang: string,
  fallback: string
): string {
  const v = map?.[lang] ?? map?.ar ?? map?.fr ?? map?.en
  return v && v.trim() ? v : fallback
}

/** اللغات المتاحة حسب إعدادات الإدارة (العربية دائماً متاحة) */
export function enabledLanguages(s: SiteSettings | null | undefined): Array<'ar' | 'fr' | 'en'> {
  const langs: Array<'ar' | 'fr' | 'en'> = []
  if (s?.languages?.ar !== false) langs.push('ar')
  if (s?.languages?.fr !== false) langs.push('fr')
  if (s?.languages?.en !== false) langs.push('en')
  return langs.length ? langs : ['ar', 'fr', 'en']
}

/**
 * تجاوزات نصوص ترويسة الأقسام من إعدادات الإدارة (بثلاث لغات).
 * يعيد null للحقل غير المضبوط ليعود المكون إلى نصه الافتراضي.
 */
export function useSectionTexts(section: string): {
  eyebrow: string | null
  title: string | null
  titleGold: string | null
  subtitle: string | null
} {
  const settings = useSiteSettings((s) => s.settings)
  const lang = useLang((s) => s.lang)
  const block = settings?.texts?.[section]
  const pick = (field: 'eyebrow' | 'title' | 'titleGold' | 'subtitle'): string | null => {
    const v = block?.[field]?.[lang] ?? block?.[field]?.ar ?? block?.[field]?.fr ?? block?.[field]?.en
    return v && v.trim() ? v : null
  }
  return { eyebrow: pick('eyebrow'), title: pick('title'), titleGold: pick('titleGold'), subtitle: pick('subtitle') }
}
