'use client'

import { useState, useEffect, useSyncExternalStore } from 'react'
import { motion } from 'framer-motion'
import { Menu, LogIn, X, ShieldCheck, LogOut, Globe, Sun, Moon } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { useT, useLang } from './i18n'
import { useSiteSettings, enabledLanguages } from './site-store'
import { useTheme } from './theme'
import type { OfficeAccount, AdminAccount } from './types'

export function Navbar({
  onLoginClick,
  account,
  admin,
  onOfficeClick,
  onAdminClick,
  onLogout,
}: {
  onLoginClick: () => void
  account: OfficeAccount | null
  admin?: AdminAccount | null
  onOfficeClick: () => void
  onAdminClick?: () => void
  onLogout: () => void
}) {
  const t = useT()
  const [scrolled, setScrolled] = useState(false)
  const [open, setOpen] = useState(false)
  const lang = useLang((s) => s.lang)
  const siteSettings = useSiteSettings((s) => s.settings)
  const langs = enabledLanguages(siteSettings)
  const theme = useTheme((s) => s.theme)
  const toggleTheme = useTheme((s) => s.toggle)
  // يصبح true بعد الترطيب فقط (لتفادي اختلاف الترطيب في أيقونة الثيم)
  const mounted = useSyncExternalStore(
    () => () => {},
    () => true,
    () => false
  )

  useEffect(() => {
    // إذا كانت اللغة المحفوظة معطلة في إعدادات الإدارة نعود للعربية
    if (!langs.includes(lang)) useLang.getState().setLang('ar')
  }, [lang, langs])

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 40)
    onScroll()
    window.addEventListener('scroll', onScroll, { passive: true })
    return () => window.removeEventListener('scroll', onScroll)
  }, [])

  const links = [
    { href: '#home', label: t('nav.home') },
    { href: '#about', label: t('nav.about') },
    { href: '#branches', label: t('nav.branches') },
    { href: '#news', label: t('nav.news') },
    { href: '#matches', label: t('nav.matches') },
    { href: '#achievements', label: t('nav.achievements') },
    { href: '#gallery', label: t('nav.gallery') },
    { href: '#shop', label: t('nav.shop') },
    { href: '#join', label: t('nav.join') },
  ]

  const toggleLang = () => {
    // تدوير بين اللغات المتاحة حسب إعدادات الإدارة: عربية ← فرنسية ← إنجليزية
    const idx = langs.indexOf(lang)
    const next = langs[(idx + 1) % langs.length] ?? 'ar'
    useLang.getState().setLang(next)
  }

  const nextLangLabel = (langs[(langs.indexOf(lang) + 1) % langs.length] ?? 'ar').toUpperCase()

  return (
    <header
      className={`fixed top-0 inset-x-0 z-50 transition-all duration-300 ${
        scrolled ? 'glass shadow-lg shadow-black/20 light:shadow-black/10' : 'bg-gradient-to-b from-black/60 to-transparent light:from-white/75'
      }`}
    >
      <div className="max-w-7xl mx-auto px-4 sm:px-6">
        <div className="flex items-center justify-between h-16 md:h-20">
          {/* الشعار */}
          <a href="#home" className="flex items-center gap-3 shrink-0">
            <img
              src="/images/logo.png"
              alt="شعار النادي الرياضي الرائد سعيدة"
              className="h-10 w-10 md:h-12 md:w-12 rounded-full object-contain ring-2 ring-(--silver)/70 logo-glow"
            />
            <div className="leading-tight">
              <div className="font-black text-paper text-sm md:text-base">{t('brand.name')}</div>
              <div className="text-(--accent-deep, var(--silver)) text-[10px] md:text-xs font-bold tracking-wider">
                {t('brand.sub')}
              </div>
            </div>
          </a>

          {/* روابط سطح المكتب */}
          <nav className="hidden xl:flex items-center gap-0.5" aria-label="التنقل الرئيسي">
            {links.map((l) => (
              <a
                key={l.href}
                href={l.href}
                className="px-2.5 py-2 text-sm font-bold text-paper/85 hover:text-(--accent-deep, var(--silver)) rounded-lg hover:bg-paper/10 transition-colors whitespace-nowrap"
              >
                {l.label}
              </a>
            ))}
          </nav>

          {/* أزرار */}
          <div className="flex items-center gap-2">
            {/* مبدّل الوضع الليلي / النهاري */}
            <button
              onClick={toggleTheme}
              className="h-9 w-9 rounded-lg border border-paper/25 text-paper/90 hover:bg-paper/10 hover:text-(--accent-deep, var(--silver)) transition-colors flex items-center justify-center"
              aria-label={theme === 'dark' ? 'التبديل إلى الوضع النهاري' : 'التبديل إلى الوضع الليلي'}
              title={theme === 'dark' ? t('theme.light') : t('theme.dark')}
            >
              {mounted ? (
                theme === 'dark' ? <Sun className="h-4 w-4" /> : <Moon className="h-4 w-4" />
              ) : (
                <Sun className="h-4 w-4 opacity-0" />
              )}
            </button>

            {/* مبدّل اللغة */}
            <button
              onClick={toggleLang}
              className="h-9 px-2.5 rounded-lg border border-paper/25 text-paper/90 text-xs font-black hover:bg-paper/10 hover:text-(--accent-deep, var(--silver)) transition-colors flex items-center gap-1.5"
              aria-label="تغيير اللغة / Changer de langue / Change language"
              title={nextLangLabel === 'AR' ? 'العربية' : nextLangLabel === 'FR' ? 'Français' : 'English'}
            >
              <Globe className="h-3.5 w-3.5" />
              {nextLangLabel}
            </button>

            {admin ? (
              <div className="hidden sm:flex items-center gap-2">
                <span className="inline-flex items-center gap-1 rounded-full bg-(--silver)/15 border border-(--silver)/50 px-3 py-1 text-[11px] font-black text-(--silver)">
                  <ShieldCheck className="h-3.5 w-3.5" />
                  {t('nav.adminBadge')}
                </span>
                <Button
                  onClick={onAdminClick}
                  className="bg-(--silver) hover:bg-(--silver)/85 text-(--club-dark) font-bold rounded-xl"
                >
                  <ShieldCheck className="ml-1.5 h-4 w-4" />
                  {t('nav.adminPanel')}
                </Button>
                <Button
                  onClick={onLogout}
                  variant="outline"
                  className="border-paper/25 text-paper hover:bg-paper/10 rounded-xl"
                >
                  <LogOut className="ml-1 h-4 w-4" />
                  {t('nav.logout')}
                </Button>
              </div>
            ) : account ? (
              <div className="hidden sm:flex items-center gap-2">
                <Button
                  onClick={onOfficeClick}
                  className="bg-(--silver) hover:bg-(--silver)/85 text-(--club-dark) font-bold rounded-xl"
                >
                  <ShieldCheck className="ml-1.5 h-4 w-4" />
                  {t('nav.officeOf')} {account.branch.name}
                </Button>
                <Button
                  onClick={onLogout}
                  variant="outline"
                  className="border-paper/25 text-paper hover:bg-paper/10 rounded-xl"
                >
                  {t('nav.logout')}
                </Button>
              </div>
            ) : (
              <Button
                onClick={onLoginClick}
                className="hidden sm:inline-flex bg-(--silver) hover:bg-(--silver)/85 text-(--club-dark) font-bold rounded-xl"
              >
                <LogIn className="ml-1.5 h-4 w-4" />
                {t('nav.loginOffices')}
              </Button>
            )}

            {/* قائمة الجوال */}
            <button
              onClick={() => setOpen(!open)}
              className="lg:hidden text-paper p-2 rounded-lg hover:bg-paper/10"
              aria-label={open ? t('nav.closeMenu') : t('nav.openMenu')}
            >
              {open ? <X className="h-6 w-6" /> : <Menu className="h-6 w-6" />}
            </button>
          </div>
        </div>
      </div>

      {/* قائمة الجوال المنسدلة */}
      {open && (
        <motion.div
          initial={{ opacity: 0, height: 0 }}
          animate={{ opacity: 1, height: 'auto' }}
          className="lg:hidden glass border-t border-paper/15"
        >
          <nav className="px-4 py-3 flex flex-col" aria-label="قائمة الجوال">
            {links.map((l) => (
              <a
                key={l.href}
                href={l.href}
                onClick={() => setOpen(false)}
                className="px-3 py-2.5 text-sm font-bold text-paper/90 hover:text-(--accent-deep, var(--silver)) rounded-lg hover:bg-paper/10"
              >
                {l.label}
              </a>
            ))}
            <div className="grid grid-cols-2 gap-2 mt-2">
              <button
                onClick={toggleTheme}
                className="px-3 py-2.5 text-sm font-bold text-right rounded-lg border border-paper/25 text-paper flex items-center gap-2"
              >
                {mounted && theme === 'dark' ? <Sun className="h-4 w-4" /> : <Moon className="h-4 w-4" />}
                {mounted && theme === 'dark' ? t('theme.light') : t('theme.dark')}
              </button>
              <button
                onClick={toggleLang}
                className="px-3 py-2.5 text-sm font-bold text-right rounded-lg border border-paper/25 text-paper flex items-center gap-2"
              >
                <Globe className="h-4 w-4" />
                {nextLangLabel === 'AR' ? 'العربية' : nextLangLabel === 'FR' ? 'Français' : 'English'}
              </button>
            </div>
            {admin ? (
              <>
                <button
                  onClick={() => {
                    setOpen(false)
                    onAdminClick?.()
                  }}
                  className="mt-2 px-3 py-2.5 text-sm font-bold text-right rounded-lg bg-(--silver) text-(--club-dark)"
                >
                  <ShieldCheck className="inline ml-1.5 h-4 w-4" />
                  {t('nav.adminPanel')}
                </button>
                <button
                  onClick={() => {
                    setOpen(false)
                    onLogout()
                  }}
                  className="mt-2 px-3 py-2.5 text-sm font-bold text-right rounded-lg border border-paper/25 text-paper"
                >
                  {t('nav.mobileLogout')}
                </button>
              </>
            ) : account ? (
              <>
                <button
                  onClick={() => {
                    setOpen(false)
                    onOfficeClick()
                  }}
                  className="mt-2 px-3 py-2.5 text-sm font-bold text-right rounded-lg bg-(--silver) text-(--club-dark)"
                >
                  <ShieldCheck className="inline ml-1.5 h-4 w-4" />
                  {t('nav.officeOf')} {account.branch.name}
                </button>
                <button
                  onClick={() => {
                    setOpen(false)
                    onLogout()
                  }}
                  className="mt-2 px-3 py-2.5 text-sm font-bold text-right rounded-lg border border-paper/25 text-paper"
                >
                  {t('nav.mobileLogout')}
                </button>
              </>
            ) : (
              <button
                onClick={() => {
                  setOpen(false)
                  onLoginClick()
                }}
                className="mt-2 px-3 py-2.5 text-sm font-bold text-right rounded-lg bg-(--silver) text-(--club-dark)"
              >
                <LogIn className="inline ml-1.5 h-4 w-4" />
                {t('nav.mobileLogin')}
              </button>
            )}
          </nav>
        </motion.div>
      )}
    </header>
  )
}
