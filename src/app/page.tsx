'use client'

import { useState, useEffect, useCallback, useRef } from 'react'
import { Loader2, Trophy } from 'lucide-react'
import { Navbar } from '@/components/club/navbar'
import { Hero } from '@/components/club/hero'
import { About } from '@/components/club/about'
import { Branches } from '@/components/club/branches'
import { NewsSection } from '@/components/club/news-section'
import { MatchesSection } from '@/components/club/matches-section'
import { AchievementsSection } from '@/components/club/achievements-section'
import { GallerySection } from '@/components/club/gallery-section'
import { ShopSection } from '@/components/club/shop-section'
import { JoinSection } from '@/components/club/join-section'
import { ContactSection } from '@/components/club/contact-section'
import { Footer } from '@/components/club/footer'
import { LoginModal } from '@/components/club/login-modal'
import { BranchOffice } from '@/components/club/office/dashboard'
import { AdminDashboard } from '@/components/club/admin/dashboard'
import { useToast } from '@/hooks/use-toast'
import { apiFetch, clearSessionToken } from '@/lib/session'
import { useSiteSettings } from '@/components/club/site-store'
import { useT } from '@/components/club/i18n'
import type { HomeData, OfficeAccount, AdminAccount } from '@/components/club/types'

type View = 'home' | 'office' | 'admin'

export default function HomePage() {
  const { toast } = useToast()
  const t = useT()
  const setSiteSettings = useSiteSettings((s) => s.setSettings)
  const [data, setData] = useState<HomeData | null>(null)
  const [loading, setLoading] = useState(true)
  const [account, setAccount] = useState<OfficeAccount | null>(null)
  const [admin, setAdmin] = useState<AdminAccount | null>(null)
  const [loginOpen, setLoginOpen] = useState(false)
  const [view, setView] = useState<View>('home')
  const joinRef = useRef<HTMLDivElement | null>(null)

  const loadHome = useCallback(async () => {
    try {
      const res = await fetch('/api/public/home', { cache: 'no-store' })
      const d = await res.json()
      if (!res.ok || !Array.isArray(d?.branches)) {
        throw new Error(d?.error || 'بيانات غير صالحة')
      }
      setData(d)
      // تطبيق إعدادات وتصميم الإدارة على الواجهة (اللون المميز + النصوص)
      setSiteSettings(d.settings ?? null)
    } catch {
      toast({ title: 'فشل تحميل بيانات الموقع', variant: 'destructive' })
    } finally {
      setLoading(false)
    }
  }, [toast])

  useEffect(() => {
    loadHome()
    // التحقق من جلسة سابقة (مكتب فرع أو إدارة)
    apiFetch('/api/auth/me')
      .then((r) => r.json())
      .then((d) => {
        if (d.admin) setAdmin(d.admin)
        else if (d.account) setAccount(d.account)
        else clearSessionToken()
      })
      .catch(() => {})
  }, [loadHome, setSiteSettings])

  const handleLogout = useCallback(async () => {
    try {
      clearSessionToken()
      await apiFetch('/api/auth/logout', { method: 'POST' })
    } catch {
      // حتى لو فشل طلب الخروج نمسح الجلسة محلياً
    }
    setAccount(null)
    setAdmin(null)
    setView('home')
    toast({ title: 'تم تسجيل الخروج' })
  }, [toast])

  const scrollToJoin = () => {
    setView('home')
    requestAnimationFrame(() => {
      document.querySelector('#join')?.scrollIntoView({ behavior: 'smooth' })
    })
  }

  // ===== شاشة التحميل =====
  if (loading || !data) {
    return (
      <div className="min-h-screen club-gradient flex flex-col items-center justify-center gap-4">
        <img
          src="/images/logo.png"
          alt="شعار النادي الرياضي الرائد"
          className="h-28 w-28 object-contain logo-glow animate-float-slow"
        />
        <div className="flex items-center gap-2 text-paper font-bold">
          <Loader2 className="h-5 w-5 animate-spin text-(--silver)" />
          جارٍ تحميل موقع النادي الرياضي الرائد...
        </div>
        <p className="text-paper/60 text-sm">قوة في الوحدة.. تميز في الأداء</p>
      </div>
    )
  }

  // ===== مكتب الفرع =====
  if (view === 'office' && account) {
    return (
      <BranchOffice account={account} onBack={() => setView('home')} onLogout={handleLogout} />
    )
  }

  // ===== لوحة الإدارة المركزية =====
  if (view === 'admin' && admin) {
    return (
      <AdminDashboard admin={admin} onBack={() => setView('home')} onLogout={handleLogout} />
    )
  }

  // ===== الموقع الرئيسي =====
  return (
    <div className="min-h-screen flex flex-col">
      <Navbar
        onLoginClick={() => setLoginOpen(true)}
        account={account}
        admin={admin}
        onOfficeClick={() => setView('office')}
        onAdminClick={() => setView('admin')}
        onLogout={handleLogout}
      />

      <main className="flex-1">
        <Hero data={data} onJoinClick={scrollToJoin} />
        {/* كل الأقسام قابلة للإظهار/الإخفاء من إعدادات الإدارة العامة */}
        {data.settings?.sections?.about !== false && <About />}
        {data.settings?.sections?.branches !== false && (
          <Branches branches={data.branches} onOfficeLogin={() => setLoginOpen(true)} />
        )}
        {data.settings?.sections?.news !== false && <NewsSection news={data.news} />}
        {data.settings?.sections?.matches !== false && (
          <MatchesSection upcoming={data.upcoming} results={data.results} />
        )}
        {data.settings?.sections?.achievements !== false && (
          <AchievementsSection achievements={data.achievements} />
        )}
        {data.settings?.sections?.gallery !== false && (
          <GallerySection
            items={data.gallery}
            videos={data.settings?.sections?.videos === false ? [] : data.videos ?? []}
          />
        )}
        {data.settings?.sections?.shop !== false && <ShopSection products={data.products ?? []} />}
        {data.settings?.sections?.join !== false && <JoinSection branches={data.branches} formRef={joinRef} />}
        {data.settings?.sections?.contact !== false && <ContactSection />}
      </main>

      <Footer branches={data.branches} />

      <LoginModal
        open={loginOpen}
        onClose={() => setLoginOpen(false)}
        onSuccess={(acc) => {
          setAdmin(null)
          setAccount(acc)
          setLoginOpen(false)
          setView('office')
          toast({
            title: `مرحباً بك في مكتب ${acc.branch.name}`,
            description: 'تم تسجيل الدخول بنجاح',
          })
        }}
        onSuccessAdmin={(adm) => {
          setAccount(null)
          setAdmin(adm)
          setLoginOpen(false)
          setView('admin')
          toast({
            title: `مرحباً ${adm.name || adm.username}`,
            description: 'تم تسجيل الدخول إلى لوحة الإدارة',
          })
        }}
      />

      {/* زر عائم للانضمام */}
      <button
        onClick={scrollToJoin}
        className="fixed bottom-5 left-5 z-40 h-14 px-5 rounded-2xl bg-(--silver) text-(--club-dark) font-black shadow-2xl shadow-black/30 hover:scale-105 active:scale-95 transition-transform flex items-center gap-2"
        aria-label="الانتقال إلى نموذج الانضمام"
      >
        <Trophy className="h-5 w-5" />
        <span className="hidden sm:inline">{t('nav.join')}</span>
      </button>
    </div>
  )
}
