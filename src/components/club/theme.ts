'use client'

/**
 * الوضع الليلي / النهاري — الليلي هو الافتراضي (هوية النادي الكحلية)
 * يُخزن الاختيار محلياً ويُطبق عبر صنف light على <html>
 */

import { create } from 'zustand'
import { persist } from 'zustand/middleware'

export type Theme = 'dark' | 'light'

export const THEME_STORAGE_KEY = 'raed-theme'

function applyTheme(theme: Theme) {
  if (typeof document === 'undefined') return
  const root = document.documentElement
  root.classList.toggle('light', theme === 'light')
  const meta = document.querySelector('meta[name="theme-color"]')
  if (meta) meta.setAttribute('content', theme === 'light' ? '#f2f5fa' : '#0f1b3a')
}

interface ThemeState {
  theme: Theme
  toggle: () => void
  setTheme: (t: Theme) => void
}

export const useTheme = create<ThemeState>()(
  persist(
    (set, get) => ({
      theme: 'dark',
      setTheme: (t) => {
        set({ theme: t })
        applyTheme(t)
      },
      toggle: () => {
        const next: Theme = get().theme === 'dark' ? 'light' : 'dark'
        set({ theme: next })
        applyTheme(next)
      },
    }),
    {
      name: THEME_STORAGE_KEY,
      onRehydrateStorage: () => (state) => {
        // بعد استعادة الاختيار المحفوظ نطبقه فوراً
        applyTheme(state?.theme ?? 'dark')
      },
    }
  )
)

/** يُستدعى مرة عند تحميل الموقع لضمان تطبيق الثيم */
export function initTheme() {
  if (typeof window === 'undefined') return
  try {
    const raw = window.localStorage.getItem(THEME_STORAGE_KEY)
    if (raw) {
      const parsed = JSON.parse(raw) as { state?: { theme?: Theme } }
      applyTheme(parsed?.state?.theme === 'light' ? 'light' : 'dark')
      return
    }
  } catch {
    // تجاهل
  }
  applyTheme('dark')
}
