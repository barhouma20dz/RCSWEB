'use client'

import { useEffect } from 'react'
import { useLang, applyDir } from './i18n'

/**
 * تسجيل Service Worker وإعادة ترطيب لغة الواجهة بعد التحميل
 * (يُدرج مرة واحدة في layout.tsx — لا يعرض أي شيء)
 */
export function PwaRegister() {
  useEffect(() => {
    // إعادة ترطيب اللغة المحفوظة ثم تطبيق الاتجاه
    try {
      Promise.resolve(useLang.persist.rehydrate())
        .then(() => applyDir(useLang.getState().lang))
        .catch(() => {})
    } catch {
      // تجاهل بصمت
    }

    const unsub = useLang.subscribe((s) => applyDir(s.lang))

    // تسجيل Service Worker
    if ('serviceWorker' in navigator) {
      navigator.serviceWorker.register('/sw.js').catch(() => {
        // فشل التسجيل لا يجب أن يعطل الموقع
      })
    }

    return () => {
      unsub()
    }
  }, [])

  return null
}
